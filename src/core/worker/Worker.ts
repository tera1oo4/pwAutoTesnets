import { DEFAULT_QUEUE_WAIT_MS, WORKER_LOG_EVENTS } from "../../shared/constants.ts";
import { classifyError } from "../../shared/errors.ts";
import type { ObservabilityHooks } from "../../shared/observability.ts";
import { computeRetryDelayMs } from "../../shared/retry.ts";
import path from "node:path";
import type {
  ArtifactWriter,
  Logger,
  PageFactory,
  PageHandle,
  Queue,
  RunQueuePayload,
  ScenarioRun,
  WalletKind
} from "../../shared/types.ts";
import type { RunRepository } from "../../data/repositories/RunRepository.ts";
import { ScenarioEngine } from "../scenario/ScenarioEngine.ts";
import { WalletManager } from "../wallet/WalletManager.ts";
import { MetaMaskController } from "../wallet/metamask/MetaMaskController.ts";
import { RabbyController } from "../wallet/rabby/RabbyController.ts";
import { WalletDetector } from "../wallet/WalletDetector.ts";
import { promises as fs } from "node:fs";

type WorkerOptions = {
  queue: Queue<RunQueuePayload>;
  store: RunRepository;
  engine: ScenarioEngine;
  pageFactory: PageFactory;
  artifacts: ArtifactWriter;
  logger: Logger;
  hooks?: ObservabilityHooks;
};

export class Worker {
  private readonly queue: Queue<RunQueuePayload>;
  private readonly store: RunRepository;
  private readonly engine: ScenarioEngine;
  private readonly pageFactory: PageFactory;
  private readonly artifacts: ArtifactWriter;
  private readonly logger: Logger;
  private readonly hooks?: ObservabilityHooks;
  private readonly activeRuns = new Map<string, AbortController>();

  constructor(options: WorkerOptions) {
    this.queue = options.queue;
    this.store = options.store;
    this.engine = options.engine;
    this.pageFactory = options.pageFactory;
    this.artifacts = options.artifacts;
    this.logger = options.logger;
    this.hooks = options.hooks;
  }

  async runOnce(): Promise<boolean> {
    const item = await this.queue.dequeue({ waitMs: DEFAULT_QUEUE_WAIT_MS });
    if (!item) {
      return false;
    }

    if (this.activeRuns.has(item.payload.runId)) {
      this.logger.warn(WORKER_LOG_EVENTS.runStart, "idempotency constraint: run already active", {
        runId: item.payload.runId
      });
      await this.queue.ack(item.id);
      return true;
    }

    const run = await this.store.getRun(item.payload.runId);
    if (!run) {
      await this.queue.ack(item.id);
      return true;
    }
    if (run.status === "completed" || run.status === "failed") {
      await this.queue.ack(item.id);
      return true;
    }
    if (run.status === "cancelled") {
      this.logger.info(WORKER_LOG_EVENTS.runCancelled, "worker run cancelled", {
        runId: run.id
      });
      await this.queue.ack(item.id);
      return true;
    }
    if (run.status === "needs_review") {
      this.logger.info(WORKER_LOG_EVENTS.needsReview, "worker run needs review", {
        runId: run.id
      });
      await this.queue.ack(item.id);
      return true;
    }
    if (run.status !== "running" || run.attempt !== item.payload.attempt) {
      await this.queue.ack(item.id);
      return true;
    }
    const scenarioRun: ScenarioRun = {
      id: run.id,
      scenarioId: run.scenarioId,
      networkId: run.networkId,
      profileId: run.profileId,
      attempt: item.payload.attempt
    };
    let page: PageHandle | null = null;
    try {
      page = await this.pageFactory.create(run.profileId);
    } catch (error) {
      try {
        const classified = classifyError(error);
        if (classified.category === "needs_review") {
          await this.store.markNeedsReview(run.id, classified.message, undefined, classified.code);
          this.logger.info(WORKER_LOG_EVENTS.needsReview, "worker run needs review", {
            runId: run.id,
            attempt: scenarioRun.attempt,
            error: classified.message,
            code: classified.code
          });
        } else if (classified.category === "transient" && scenarioRun.attempt < run.maxAttempts) {
          const delayMs = computeRetryDelayMs(scenarioRun.attempt);
          await this.store.markQueued(
            run.id,
            classified.message,
            undefined,
            new Date(Date.now() + delayMs).toISOString(),
            classified.code
          );
          this.logger.info(WORKER_LOG_EVENTS.retryScheduled, "worker retry scheduled", {
            runId: run.id,
            nextAttempt: scenarioRun.attempt + 1,
            delayMs
          });
        } else {
          await this.store.markFailed(run.id, classified.message);
          this.logger.error(WORKER_LOG_EVENTS.runFailure, "worker run failure", {
            runId: run.id,
            attempt: scenarioRun.attempt,
            error: classified.message,
            code: classified.code
          });
        }
        await this.queue.ack(item.id);
      } finally {
        // Cleanup on page creation error
        if (page) {
          await this.pageFactory.close(run.profileId).catch(() => {
            // Ignore cleanup errors
          });
        }
      }
      return true;
    }

    this.logger.info(WORKER_LOG_EVENTS.runStart, "worker run start", {
      runId: run.id,
      attempt: scenarioRun.attempt
    });
    this.hooks?.onEvent({
      name: "worker.run.start",
      time: new Date().toISOString(),
      payload: { runId: run.id, attempt: scenarioRun.attempt }
    });

    const controller = new AbortController();
    this.activeRuns.set(run.id, controller);

    // Start tracing before any operations
    await page.startTracing().catch((error) => {
      this.logger.warn("tracing_start_failed", "Failed to start tracing", {
        error: String(error)
      });
    });

    try {
      // Detect wallet and create appropriate controller
      let walletController: any = new MetaMaskController();
      let detectedKind: WalletKind = "metamask";
      let extPage: PageHandle = page!;

      try {
        if (this.pageFactory.getExtensionPage) {
          const foundExtPage = await this.pageFactory.getExtensionPage(run.profileId);
          if (foundExtPage) {
            extPage = foundExtPage;
          }
        }
        
        const detector = new WalletDetector([new MetaMaskController(), new RabbyController()], { logger: this.logger, timeoutMs: 5000 });
        const detection = await detector.detect(extPage);
        if (detection?.kind === "rabby") {
          walletController = new RabbyController();
          detectedKind = "rabby";
        }
      } catch (detectionError) {
        this.logger.warn("wallet_detection_failed", "Wallet detection failed, defaulting to MetaMask", {
          runId: run.id,
          error: String(detectionError)
        });
      }

      const walletManager = new WalletManager(walletController, {
        logger: this.logger,
        timeoutMs: 10000
      });

      const wrappedWalletManager = {
        detect: (p: any) => walletManager.detect(extPage),
        unlock: (p: any, pw: string) => walletManager.unlock(extPage, pw),
        connect: (p: any) => walletManager.connect(extPage),
        ensureNetwork: (p: any, req: any) => walletManager.ensureNetwork(extPage, req),
        signMessage: (p: any, req: any) => walletManager.signMessage(extPage, req),
        signTypedData: (p: any, req: any) => walletManager.signTypedData(extPage, req),
        confirmTransaction: (p: any, req: any) => walletManager.confirmTransaction(extPage, req),
        approve: (p: any) => walletManager.approve(extPage),
        reject: (p: any) => walletManager.reject(extPage),
        handlePopupAuto: (p: any) => walletManager.handlePopupAuto(extPage)
      };

      const artifactsPath = process.env.ARTIFACTS_PATH || "./artifacts";
      await fs.mkdir(path.join(artifactsPath, run.id), { recursive: true }).catch(() => {
        // Ensure artifacts directory exists
      });

      await this.engine.runById(run.scenarioId, {
        logger: this.logger,
        page: page!,
        run: scenarioRun,
        artifacts: this.artifacts,
        abortSignal: controller.signal,
        wallet: wrappedWalletManager as any,
        walletKind: detectedKind,
        options: {
          dappUrl: process.env.DAPP_URL || "https://example.com",
          maxRetries: 3,
          timeoutMs: 30000
        }
      });
      await this.store.markCompleted(run.id);
      await this.queue.ack(item.id);
      this.logger.info(WORKER_LOG_EVENTS.runSuccess, "worker run success", {
        runId: run.id,
        attempt: scenarioRun.attempt
      });
      this.hooks?.onEvent({
        name: "worker.run.success",
        time: new Date().toISOString(),
        payload: { runId: run.id, attempt: scenarioRun.attempt }
      });
      await page.stopTracing(path.join(artifactsPath, run.id, `success-${scenarioRun.attempt}-trace.zip`)).catch(() => {
        // Trace stop is best-effort - may fail if tracing wasn't active
      });
      return true;
    } catch (error) {
      // Capture failure artifacts
      const screenshotPath = await this.artifacts.captureScreenshot(page, run.id, `failure-${scenarioRun.attempt}`).catch(() => "");
      const htmlPath = await this.artifacts.captureHtml(page, run.id, `failure-${scenarioRun.attempt}`).catch(() => "");

      // Stop tracing and capture trace file
      let tracePath = "";
      try {
        const traceFile = path.join(process.env.ARTIFACTS_PATH || "./artifacts", run.id, `failure-${scenarioRun.attempt}-trace.zip`);
        await page.stopTracing(traceFile).catch(() => {
          // Trace stop may fail if tracing wasn't active - best effort only
        });
        tracePath = traceFile;
      } catch (e) {
        // Trace capture is best-effort
      }

      let consoleLogsPath: string | undefined;
      let networkLogsPath: string | undefined;
      try {
        const logs = await this.artifacts.captureLogs(page, run.id, `failure-${scenarioRun.attempt}`);
        consoleLogsPath = logs.consolePath;
        networkLogsPath = logs.networkPath;
      } catch (e) {
        // Log capture failed - will proceed without console/network logs for this run
        this.logger.warn("logs_capture_failed", "Failed to capture console and network logs", {
          runId: run.id,
          attempt: scenarioRun.attempt,
          error: String(e)
        });
      }

      const classified = classifyError(error);
      const metadataPath = await this.artifacts.captureMetadata(run.id, `metadata-${scenarioRun.attempt}`, {
        error: classified.message,
        code: classified.code,
        category: classified.category,
        attempt: scenarioRun.attempt,
        time: new Date().toISOString()
      }).catch(() => undefined);

      this.logger.info(WORKER_LOG_EVENTS.artifactsCaptured, "worker artifacts captured", {
        runId: run.id,
        screenshotPath: screenshotPath || "failed",
        htmlPath: htmlPath || "failed",
        tracePath: tracePath || "failed"
      });
      const artifacts = { screenshotPath: screenshotPath || undefined, htmlPath: htmlPath || undefined, tracePath: tracePath || undefined, consoleLogsPath, networkLogsPath, metadataPath };

      if (classified.category === "needs_review") {
        await this.store.markNeedsReview(run.id, classified.message, artifacts, classified.code);
        this.logger.info(WORKER_LOG_EVENTS.needsReview, "worker run needs review", {
          runId: run.id,
          attempt: scenarioRun.attempt,
          error: classified.message,
          code: classified.code
        });
      } else if (classified.category === "transient" && scenarioRun.attempt < run.maxAttempts) {
        const delayMs = computeRetryDelayMs(scenarioRun.attempt);
        await this.store.markQueued(
          run.id,
          classified.message,
          artifacts,
          new Date(Date.now() + delayMs).toISOString(),
          classified.code
        );
        this.logger.info(WORKER_LOG_EVENTS.retryScheduled, "worker retry scheduled", {
          runId: run.id,
          nextAttempt: scenarioRun.attempt + 1,
          delayMs
        });
      } else {
        await this.store.markFailed(run.id, classified.message, artifacts);
        this.logger.error(WORKER_LOG_EVENTS.runFailure, "worker run failure", {
          runId: run.id,
          attempt: scenarioRun.attempt,
          error: classified.message,
          code: classified.code
        });
      }
      await this.queue.ack(item.id);
      this.hooks?.onEvent({
        name: "worker.run.failure",
        time: new Date().toISOString(),
        payload: { runId: run.id, attempt: scenarioRun.attempt, error: classified.message, code: classified.code }
      });
      return true;
    } finally {
      // Ensure tracing is stopped even if an error occurred
      if (page && page.isTracingActive()) {
        await page.stopTracing(path.join(process.env.ARTIFACTS_PATH || "./artifacts", run.id, `final-${scenarioRun.attempt}-trace.zip`)).catch(() => {
          // Final trace stop is best-effort cleanup - may fail if already stopped
        });
      }

      this.activeRuns.delete(run.id);
      await this.pageFactory.close(run.profileId);
    }
  }

  cancelActiveRun(runId: string): boolean {
    const controller = this.activeRuns.get(runId);
    if (controller) {
      controller.abort(new Error("RunCancelled"));
      return true;
    }
    return false;
  }
}
