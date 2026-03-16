import { createRedisClient } from "./config/redis";
import { createConsoleLogger } from "./shared/logger";
import { loadEnv, validateEnv } from "./config/env";
import { PostgresRunStore } from "./core/store/PostgresRunStore";
import { RedisQueue } from "./core/queue/RedisQueue";
import { ProfileLock } from "./core/browser/ProfileLock";
import { BrowserManager } from "./core/browser/BrowserManager";
import { PlaywrightBrowserDriver } from "./core/browser/PlaywrightBrowserDriver";
import { ScenarioRegistry } from "./core/scenario/ScenarioRegistry";
import { ScenarioEngine } from "./core/scenario/ScenarioEngine";
import { Scheduler } from "./core/scheduler/Scheduler";
import { Worker } from "./core/worker/Worker";
import { FileArtifactWriter } from "./core/worker/FileArtifactWriter";
import { ConnectWalletScenario } from "./core/scenario/scenarios/ConnectWalletScenario";
import { SignMessageScenario } from "./core/scenario/scenarios/SignMessageScenario";
import { TokenSwapScenario } from "./core/scenario/scenarios/TokenSwapScenario";
import { SwitchNetworkIfNeededScenario } from "./core/scenario/scenarios/SwitchNetworkScenario";
import { GenericTransactionFlowScenario } from "./core/scenario/scenarios/GenericTransactionScenario";
import { SCHEDULER_BATCH_SIZE, SCHEDULER_POLL_INTERVAL_MS } from "./shared/constants";
import type { Logger, BrowserProfile, Queue, RunQueuePayload, RedisQueueClient } from "./shared/types";

export type AppServices = {
  logger: Logger;
  runStore: PostgresRunStore;
  queue: Queue<RunQueuePayload>;
  redis: RedisQueueClient;
  browserManager: BrowserManager;
  scenarioEngine: ScenarioEngine;
  scheduler: Scheduler;
  worker: Worker;
};

export async function initializeApp(config?: Partial<{ databaseUrl: string; redisUrl: string; logLevel: string; artifactsPath: string; headless: boolean }>): Promise<AppServices> {
  // Load environment
  const env = loadEnv(process.env);
  const finalConfig = { ...env, ...config };

  // Validate environment
  await validateEnv(finalConfig);

  // Logger
  const logger = createConsoleLogger({ context: { app: "PlaywrightAutomation" } });

  logger.info("app_init_start", "Initializing application...", {
    logLevel: finalConfig.logLevel,
    database: finalConfig.databaseUrl.replace(/password:[^@]*@/, "password:***@"),
    redis: finalConfig.redisUrl
  });

  // Infrastructure
  let redis: RedisQueueClient;
  try {
    redis = createRedisClient(finalConfig.redisUrl) as RedisQueueClient;
    logger.debug("redis_connected", "Connected to Redis", {});
  } catch (error) {
    logger.error("redis_connection_failed", "Failed to connect to Redis", {
      error: String(error)
    });
    throw error;
  }

  // Database
  let runStore: PostgresRunStore;
  try {
    runStore = new PostgresRunStore(finalConfig.databaseUrl);
    await runStore.initialize();
    logger.debug("postgres_initialized", "PostgreSQL initialized", {});
  } catch (error) {
    logger.error("postgres_init_failed", "Failed to initialize PostgreSQL", {
      error: String(error)
    });
    throw error;
  }

  // Queue
  const queue = new RedisQueue({ client: redis, logger });
  logger.debug("queue_initialized", "Redis queue initialized", {});

  // Browser infrastructure
  const lock = new ProfileLock();
  logger.debug("profile_lock_initialized", "Profile lock initialized", {});

  const driver = new PlaywrightBrowserDriver({
    browserType: "chromium",
    headless: finalConfig.headless,
    logger,
    extensionPaths: [
      ...(finalConfig.metamaskExtensionPath ? [finalConfig.metamaskExtensionPath] : []),
      ...(finalConfig.rabbyExtensionPath ? [finalConfig.rabbyExtensionPath] : [])
    ]
  });
  logger.debug("playwright_driver_initialized", "Playwright driver initialized", {});

  const browserManager = new BrowserManager({
    driver,
    lock,
    lockHeartbeatMs: 5000
  });
  logger.debug("browser_manager_initialized", "Browser manager initialized", {});

  // Scenarios
  const registry = new ScenarioRegistry();
  registry.register(ConnectWalletScenario);
  registry.register(SignMessageScenario);
  registry.register(TokenSwapScenario);
  registry.register(SwitchNetworkIfNeededScenario);
  registry.register(GenericTransactionFlowScenario);
  logger.debug("scenarios_registered", "Scenarios registered", {
    count: 5,
    scenarios: ["connect_wallet", "connect_and_sign_message", "approve_token", "switch_network_if_needed", "generic_transaction_flow"]
  });

  // Engine
  const scenarioEngine = new ScenarioEngine({ registry });
  logger.debug("scenario_engine_initialized", "Scenario engine initialized", {});

  // Artifacts
  const artifacts = new FileArtifactWriter({ 
    baseDir: finalConfig.artifactsPath,
    logger
  });
  logger.debug("artifact_writer_initialized", "Artifact writer initialized", {
    path: finalConfig.artifactsPath
  });

  // Worker
  const pageFactory = {
    create: async (profileId: string) => {
      const profile: BrowserProfile = {
        id: profileId,
        label: profileId,
        userDataDir: `./profiles/${profileId}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await browserManager.open(profile);
      const page = driver.getPage(profileId);
      if (!page) throw new Error("PageNotCreated");
      return page;
    },
    getExtensionPage: async (profileId: string) => {
      const page = driver.getExtensionPage(profileId);
      return page || null;
    },
    close: async (profileId: string) => {
      await browserManager.close(profileId);
    }
  };

  const worker = new Worker({
    queue,
    store: runStore,
    engine: scenarioEngine,
    pageFactory,
    artifacts,
    logger
  });
  logger.debug("worker_initialized", "Worker initialized", {});

  // Scheduler
  const scheduler = new Scheduler({
    store: runStore,
    queue: queue as any,
    batchSize: SCHEDULER_BATCH_SIZE,
    logger
  });
  logger.debug("scheduler_initialized", "Scheduler initialized", {
    batchSize: SCHEDULER_BATCH_SIZE
  });

  logger.info("app_init_complete", "Application initialized successfully", {
    timestamp: new Date().toISOString()
  });

  return {
    logger,
    runStore,
    queue,
    redis,
    browserManager,
    scenarioEngine,
    scheduler,
    worker
  };
}

export async function startWorkerLoop(worker: Worker, logger: Logger, signal: AbortSignal) {
  logger.info("worker_loop_started", "Worker loop started", {});
  while (!signal.aborted) {
    try {
      await worker.runOnce();
    } catch (error) {
      logger.error("worker_loop_error", "Error in worker loop", { error: String(error) });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  logger.info("worker_loop_stopped", "Worker loop stopped", {});
}

export function startSchedulerLoop(scheduler: Scheduler, logger: Logger, intervalMs: number, signal: AbortSignal) {
  logger.info("scheduler_loop_started", "Scheduler loop started", { intervalMs });
  
  const tick = async () => {
    if (signal.aborted) return;
    try {
      await scheduler.promotePendingRuns();
    } catch (error) {
      logger.error("scheduler_loop_error", "Error in scheduler loop", { error: String(error) });
    }
  };

  const timer = setInterval(() => {
    if (signal.aborted) {
      clearInterval(timer);
      logger.info("scheduler_loop_stopped", "Scheduler loop stopped", {});
      return;
    }
    void tick();
  }, intervalMs);
}
