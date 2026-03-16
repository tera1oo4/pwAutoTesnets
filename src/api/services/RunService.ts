import crypto from "node:crypto";
import { DEFAULT_RUN_MAX_ATTEMPTS } from "../../shared/constants.ts";
import type { RunRecord, RunStatus } from "../../shared/types.ts";
import type { RunRepository } from "../../data/repositories/RunRepository.ts";

type CreateRunInput = {
  scenarioId: string;
  networkId?: string;
  profileId: string;
  maxAttempts?: number;
};

/**
 * RunService - Business logic for run management
 * Handles creation, listing, querying, and cancellation
 */
export class RunService {
  private readonly store: RunRepository;

  constructor(store: RunRepository) {
    this.store = store;
  }

  /**
   * Create a new run
   */
  async createRun(input: CreateRunInput): Promise<RunRecord> {
    const now = new Date().toISOString();
    const run: RunRecord = {
      id: crypto.randomUUID(),
      scenarioId: input.scenarioId,
      networkId: input.networkId || "",
      profileId: input.profileId,
      status: "queued",
      attempt: 0,
      maxAttempts: input.maxAttempts ?? DEFAULT_RUN_MAX_ATTEMPTS,
      createdAt: now,
      updatedAt: now
    };
    await this.store.createRun(run);
    return run;
  }

  /**
   * List runs with optional filtering
   */
  async listRuns(status?: RunStatus, limit?: number): Promise<RunRecord[]> {
    return this.store.listRuns({ status, limit });
  }

  /**
   * List recently updated runs (optimized for polling)
   */
  async listRecentlyUpdatedRuns(since: string, limit: number): Promise<RunRecord[]> {
    return this.store.listRecentlyUpdatedRuns(since, limit);
  }

  /**
   * Get run by ID
   */
  async getRun(id: string): Promise<RunRecord | null> {
    return this.store.getRun(id);
  }

  /**
   * Cancel a run
   */
  async cancelRun(id: string): Promise<RunRecord | null> {
    const run = await this.store.getRun(id);
    if (!run) {
      return null;
    }

    // Only allow cancellation of non-terminal states
    if (run.status === "completed" || run.status === "failed" || run.status === "cancelled") {
      return run;
    }

    await this.store.markCancelled(id, "CancelledByUser");
    return this.store.getRun(id);
  }
}

