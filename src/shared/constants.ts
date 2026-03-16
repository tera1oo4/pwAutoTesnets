export const DEFAULT_LOCK_TTL_MS = 5 * 60 * 1000;
export const DEFAULT_LOCK_RETRY_DELAY_MS = 500;
export const DEFAULT_LOCK_RETRY_ATTEMPTS = 20;
export const DEFAULT_LOCK_DIR = ".pwAutoTestnets/locks";

export const RUN_STATUS = {
  queued: "queued",
  running: "running",
  completed: "completed",
  failed: "failed",
  cancelled: "cancelled",
  needsReview: "needs_review"
} as const;

export const WALLET_DETECTION_TIMEOUT_MS = 2000;
export const WALLET_ACTION_TIMEOUT_MS = 15000;

export const WALLET_LOG_EVENTS = {
  detectStart: "wallet.detect.start",
  detectSuccess: "wallet.detect.success",
  detectFailure: "wallet.detect.failure",
  unlockStart: "wallet.unlock.start",
  unlockSuccess: "wallet.unlock.success",
  unlockFailure: "wallet.unlock.failure",
  connectStart: "wallet.connect.start",
  connectSuccess: "wallet.connect.success",
  connectFailure: "wallet.connect.failure",
  networkStart: "wallet.network.start",
  networkSuccess: "wallet.network.success",
  networkFailure: "wallet.network.failure"
} as const;

export const DEFAULT_RUN_MAX_ATTEMPTS = 3;
export const DEFAULT_QUEUE_WAIT_MS = 1000;
export const DEFAULT_QUEUE_POLL_INTERVAL_MS = 200;
export const DEFAULT_RETRY_DELAY_MS = 1500;
export const DEFAULT_ARTIFACTS_DIR = ".pwAutoTestnets/artifacts";

// Scheduler configuration
export const SCHEDULER_BATCH_SIZE = 10;
export const SCHEDULER_POLL_INTERVAL_MS = 15000;

// Scenario execution timeouts
export const SCENARIO_EXECUTION_TIMEOUT_MS = 30000;
export const SCENARIO_STEP_TIMEOUT_MS = 10000;

// API configuration
export const RATE_LIMIT_WINDOW_MS = 60000;
export const RATE_LIMIT_MAX_REQUESTS = 100;

export const SCENARIO_LOG_EVENTS = {
  start: "scenario.start",
  success: "scenario.success",
  failure: "scenario.failure"
} as const;

export const QUEUE_LOG_EVENTS = {
  enqueue: "queue.enqueue",
  dequeue: "queue.dequeue",
  ack: "queue.ack"
} as const;

export const SCHEDULER_LOG_EVENTS = {
  promoteStart: "scheduler.promote.start",
  promoteSkip: "scheduler.promote.skip",
  promoteEnqueue: "scheduler.promote.enqueue",
  promoteDone: "scheduler.promote.done"
} as const;

export const WORKER_LOG_EVENTS = {
  runStart: "worker.run.start",
  runSuccess: "worker.run.success",
  runFailure: "worker.run.failure",
  runCancelled: "worker.run.cancelled",
  needsReview: "worker.run.needs_review",
  retryScheduled: "worker.retry.scheduled",
  artifactsCaptured: "worker.artifacts.captured"
} as const;
