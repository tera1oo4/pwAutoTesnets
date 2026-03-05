import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryQueue } from "../src/core/queue/InMemoryQueue.ts";
import { Scheduler } from "../src/core/scheduler/Scheduler.ts";
import type { Logger, RunQueuePayload, RunRecord, RunStatus } from "../src/shared/types.ts";
import type { RunRepository } from "../src/data/repositories/RunRepository.ts";

const createLogger = (): Logger => ({
  log: () => { },
  debug: () => { },
  info: () => { },
  warn: () => { },
  error: () => { }
});

class InMemoryRunStore implements RunRepository {
  private readonly runs: Map<string, RunRecord>;

  constructor(initial: RunRecord[]) {
    this.runs = new Map(initial.map((run) => [run.id, run]));
  }

  async getRun(runId: string): Promise<RunRecord | null> {
    return this.runs.get(runId) ?? null;
  }

  async listPendingRuns(limit: number, _now?: string): Promise<RunRecord[]> {
    return Array.from(this.runs.values())
      .filter((run) => run.status === "queued")
      .slice(0, limit);
  }

  async listRuns(options?: { status?: RunStatus; limit?: number }): Promise<RunRecord[]> {
    const list = options?.status
      ? Array.from(this.runs.values()).filter((run) => run.status === options.status)
      : Array.from(this.runs.values());
    return list.slice(0, options?.limit ?? list.length);
  }

  async createRun(run: RunRecord): Promise<void> {
    this.runs.set(run.id, run);
  }

  async markRunning(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      delete run.nextAttemptAt;
      run.status = "running";
    }
  }

  async markQueued(runId: string, errorMessage?: string, _artifacts?: unknown, nextAttemptAt?: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      if (errorMessage !== undefined) run.lastErrorMessage = errorMessage;
      if (nextAttemptAt !== undefined) run.nextAttemptAt = nextAttemptAt;
      run.status = "queued";
    }
  }

  async markNeedsReview(runId: string, errorMessage?: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      if (errorMessage !== undefined) run.lastErrorMessage = errorMessage;
      run.status = "needs_review";
    }
  }

  async markCancelled(runId: string, reason?: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      if (reason !== undefined) run.lastErrorMessage = reason;
      run.status = "cancelled";
      run.cancelledAt = new Date().toISOString();
    }
  }

  async markFailed(runId: string, errorMessage?: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      if (errorMessage !== undefined) run.lastErrorMessage = errorMessage;
      run.status = "failed";
    }
  }

  async markCompleted(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      this.runs.set(runId, { ...run, status: "completed" });
    }
  }

  async incrementAttempt(runId: string): Promise<number> {
    const run = this.runs.get(runId);
    if (!run) {
      return 0;
    }
    const next = run.attempt + 1;
    this.runs.set(runId, { ...run, attempt: next });
    return next;
  }
}

const createRun = (id: string, attempt: number, maxAttempts: number): RunRecord => {
  const now = new Date().toISOString();
  return {
    id,
    scenarioId: "connect-wallet",
    networkId: "sepolia",
    profileId: "profile-1",
    status: "queued",
    attempt,
    maxAttempts,
    createdAt: now,
    updatedAt: now
  };
};

test("Scheduler promotes pending runs into queue", async () => {
  const store = new InMemoryRunStore([createRun("run-1", 0, 3)]);
  const queue = new InMemoryQueue<RunQueuePayload>({ logger: createLogger() });
  const scheduler = new Scheduler({ store, queue, logger: createLogger(), batchSize: 10 });

  const promoted = await scheduler.promotePendingRuns();
  const item = await queue.dequeue();

  assert.equal(promoted, 1);
  assert.equal(item?.payload.runId, "run-1");
});

test("Scheduler skips runs over max attempts", async () => {
  const store = new InMemoryRunStore([createRun("run-2", 3, 3)]);
  const queue = new InMemoryQueue<RunQueuePayload>({ logger: createLogger() });
  const scheduler = new Scheduler({ store, queue, logger: createLogger(), batchSize: 10 });

  const promoted = await scheduler.promotePendingRuns();
  const updated = await store.getRun("run-2");

  assert.equal(promoted, 0);
  assert.equal(updated?.status, "failed");
});
