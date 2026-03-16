import type {
  ArtifactRecord,
  ISODateString,
  RunErrorCode,
  RunId,
  RunRecord,
  RunStatus
} from "../../shared/types.ts";

export type RunRepository = {
  getRun(runId: RunId): Promise<RunRecord | null>;
  listPendingRuns(limit: number, now?: ISODateString): Promise<RunRecord[]>;
  listRuns(options?: { status?: RunStatus; limit?: number }): Promise<RunRecord[]>;
  listRecentlyUpdatedRuns(since: ISODateString, limit: number): Promise<RunRecord[]>;
  createRun(run: RunRecord): Promise<void>;
  markRunning(runId: RunId): Promise<void>;
  markQueued(
    runId: RunId,
    errorMessage?: string,
    artifacts?: ArtifactRecord,
    nextAttemptAt?: ISODateString,
    errorCode?: RunErrorCode
  ): Promise<void>;
  markNeedsReview(
    runId: RunId,
    errorMessage?: string,
    artifacts?: ArtifactRecord,
    errorCode?: RunErrorCode
  ): Promise<void>;
  markCancelled(runId: RunId, reason?: string): Promise<void>;
  markFailed(runId: RunId, errorMessage: string, artifacts?: ArtifactRecord): Promise<void>;
  markCompleted(runId: RunId): Promise<void>;
  incrementAttempt(runId: RunId): Promise<number>;
};
