import { DEFAULT_RUN_MAX_ATTEMPTS, SCHEDULER_LOG_EVENTS } from "../../shared/constants.ts";
import type { ObservabilityHooks } from "../../shared/observability.ts";
import type { Logger, Queue, RunQueuePayload } from "../../shared/types.ts";
import type { RunRepository } from "../../data/repositories/RunRepository.ts";

type SchedulerOptions = {
  store: RunRepository;
  queue: Queue<RunQueuePayload>;
  logger: Logger;
  hooks?: ObservabilityHooks;
  batchSize?: number;
  maxAttempts?: number;
};

export class Scheduler {
  private readonly store: RunRepository;
  private readonly queue: Queue<RunQueuePayload>;
  private readonly logger: Logger;
  private readonly hooks?: ObservabilityHooks;
  private readonly batchSize: number;
  private readonly maxAttempts: number;

  constructor(options: SchedulerOptions) {
    this.store = options.store;
    this.queue = options.queue;
    this.logger = options.logger;
    this.hooks = options.hooks;
    this.batchSize = options.batchSize ?? 50;
    this.maxAttempts = options.maxAttempts ?? DEFAULT_RUN_MAX_ATTEMPTS;
  }

  async promotePendingRuns(): Promise<number> {
    this.logger.info(SCHEDULER_LOG_EVENTS.promoteStart, "scheduler promote start", {
      batchSize: this.batchSize
    });
    const now = new Date().toISOString();
    const pending = await this.store.listPendingRuns(this.batchSize, now);
    let promoted = 0;

    for (const run of pending) {
      if (run.status !== "queued") {
        continue;
      }
      if (run.nextAttemptAt && new Date(run.nextAttemptAt).getTime() > Date.now()) {
        continue;
      }
      if (run.attempt >= Math.min(run.maxAttempts, this.maxAttempts)) {
        await this.store.markFailed(run.id, "MaxAttemptsReached");
        this.logger.warn(SCHEDULER_LOG_EVENTS.promoteSkip, "scheduler promote skip", {
          runId: run.id,
          attempt: run.attempt
        });
        continue;
      }
      const attempt = await this.store.incrementAttempt(run.id);
      await this.store.markRunning(run.id);
      try {
        await this.queue.enqueue({
          runId: run.id,
          scenarioId: run.scenarioId,
          attempt
        });
      } catch (error) {
        await this.store.markQueued(run.id, "EnqueueFailed");
        this.logger.warn(SCHEDULER_LOG_EVENTS.promoteSkip, "scheduler enqueue failed", {
          runId: run.id,
          attempt,
          error: String(error)
        });
        continue;
      }
      promoted += 1;
      this.logger.info(SCHEDULER_LOG_EVENTS.promoteEnqueue, "scheduler promote enqueue", {
        runId: run.id,
        attempt
      });
      this.hooks?.onEvent({
        name: "scheduler.promote.enqueue",
        time: new Date().toISOString(),
        payload: { runId: run.id, attempt }
      });
    }

    this.logger.info(SCHEDULER_LOG_EVENTS.promoteDone, "scheduler promote done", {
      promoted
    });
    this.hooks?.onEvent({
      name: "scheduler.promote.done",
      time: new Date().toISOString(),
      payload: { promoted }
    });
    return promoted;
  }
}
