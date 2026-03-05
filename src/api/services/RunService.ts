import crypto from "node:crypto";
import { DEFAULT_RUN_MAX_ATTEMPTS } from "../../shared/constants.ts";
import type { RunRecord, RunStatus } from "../../shared/types.ts";
import type { RunRepository } from "../../data/repositories/RunRepository.ts";

type CreateRunInput = {
  scenarioId: string;
  networkId: string;
  profileId: string;
  maxAttempts?: number;
};

export class RunService {
  private readonly store: RunRepository;

  constructor(store: RunRepository) {
    this.store = store;
  }

  async createRun(input: CreateRunInput): Promise<RunRecord> {
    const now = new Date().toISOString();
    const run: RunRecord = {
      id: crypto.randomUUID(),
      scenarioId: input.scenarioId,
      networkId: input.networkId,
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

  async listRuns(status?: RunStatus, limit?: number): Promise<RunRecord[]> {
    return this.store.listRuns({ status, limit });
  }

  async getRun(id: string): Promise<RunRecord | null> {
    return this.store.getRun(id);
  }

  async cancelRun(id: string): Promise<RunRecord | null> {
    const run = await this.store.getRun(id);
    if (!run) {
      return null;
    }
    if (run.status === "completed" || run.status === "failed" || run.status === "cancelled") {
      return run;
    }
    await this.store.markCancelled(id, "CancelledByUser");
    return this.store.getRun(id);
  }
}
