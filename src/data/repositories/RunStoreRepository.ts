import type { RunStore } from "../../shared/types.ts";
import type { RunRepository } from "./RunRepository.ts";

export class RunStoreRepository implements RunRepository {
  private readonly store: RunStore;

  constructor(store: RunStore) {
    this.store = store;
  }

  getRun(runId: string) {
    return this.store.getRun(runId);
  }

  listPendingRuns(limit: number, now?: string) {
    return this.store.listPendingRuns(limit, now);
  }

  listRuns(options?: Parameters<RunStore["listRuns"]>[0]) {
    return this.store.listRuns(options);
  }

  listRecentlyUpdatedRuns(since: string, limit: number) {
    return this.store.listRecentlyUpdatedRuns(since, limit);
  }

  createRun(run: Parameters<RunStore["createRun"]>[0]) {
    return this.store.createRun(run);
  }

  markRunning(runId: string) {
    return this.store.markRunning(runId);
  }

  markQueued(
    runId: string,
    errorMessage?: string,
    artifacts?: Parameters<RunStore["markQueued"]>[2],
    nextAttemptAt?: string,
    errorCode?: Parameters<RunStore["markQueued"]>[4]
  ) {
    return this.store.markQueued(runId, errorMessage, artifacts, nextAttemptAt, errorCode);
  }

  markNeedsReview(
    runId: string,
    errorMessage?: string,
    artifacts?: Parameters<RunStore["markNeedsReview"]>[2],
    errorCode?: Parameters<RunStore["markNeedsReview"]>[3]
  ) {
    return this.store.markNeedsReview(runId, errorMessage, artifacts, errorCode);
  }

  markCancelled(runId: string, reason?: string) {
    return this.store.markCancelled(runId, reason);
  }

  markFailed(runId: string, errorMessage: string, artifacts?: Parameters<RunStore["markFailed"]>[2]) {
    return this.store.markFailed(runId, errorMessage, artifacts);
  }

  markCompleted(runId: string) {
    return this.store.markCompleted(runId);
  }

  incrementAttempt(runId: string) {
    return this.store.incrementAttempt(runId);
  }
}
