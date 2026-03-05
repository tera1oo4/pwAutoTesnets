import { DEFAULT_QUEUE_WAIT_MS, WORKER_LOG_EVENTS } from "../../shared/constants.ts";
import { classifyError } from "../../shared/errors.ts";
import type { ObservabilityHooks } from "../../shared/observability.ts";
import { computeRetryDelayMs } from "../../shared/retry.ts";
import type {
  ArtifactWriter,
  Logger,
  PageFactory,
  PageHandle,
  Queue,
  RunQueuePayload,
  ScenarioRun
} from "../../shared/types.ts";
import type { RunRepository } from "../../data/repositories/RunRepository.ts";
import { ScenarioEngine } from "../scenario/ScenarioEngine.ts";

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

    await page.startTracing().catch(() => { });

    try {
      await this.engine.runById(run.scenarioId, {
        logger: this.logger,
        page,
        run: scenarioRun,
        artifacts: this.artifacts,
        abortSignal: controller.signal
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
      await page.stopTracing("").catch(() => { }); // Cleanup trace casually
      return true;
    } catch (error) {
      const screenshotPath = await this.artifacts.captureScreenshot(page, run.id, `failure-${scenarioRun.attempt}`).catch(() => undefined);
      const htmlPath = await this.artifacts.captureHtml(page, run.id, `failure-${scenarioRun.attempt}`).catch(() => undefined);
      const tracePath = await this.artifacts.captureTrace(page, run.id, `failure-${scenarioRun.attempt}`).catch(() => undefined);

      let consoleLogsPath: string | undefined;
      let networkLogsPath: string | undefined;
      try {
        const logs = await this.artifacts.captureLogs(page, run.id, `failure-${scenarioRun.attempt}`);
        consoleLogsPath = logs.consolePath;
        networkLogsPath = logs.networkPath;
      } catch (e) { }

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
        screenshotPath,
        htmlPath,
        tracePath
      });
      const artifacts = { screenshotPath, htmlPath, tracePath, consoleLogsPath, networkLogsPath, metadataPath };

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
      this.activeRuns.delete(run.id);
      if (page) {
        await this.pageFactory.close(page);
      }
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
