import type { RunRecord, RunStatus } from "../../shared/types.ts";

export type RunsQuery = {
  status?: RunStatus;
  limit?: number;
};

export type DashboardApi = {
  listRuns(query?: RunsQuery): Promise<RunRecord[]>;
  getRun(id: string): Promise<RunRecord | null>;
  cancelRun(id: string): Promise<RunRecord | null>;
};

export class DashboardRunService {
  private readonly api: DashboardApi;

  constructor(api: DashboardApi) {
    this.api = api;
  }

  async listRuns(query?: RunsQuery): Promise<RunRecord[]> {
    return this.api.listRuns(query);
  }

  async getRun(id: string): Promise<RunRecord | null> {
    return this.api.getRun(id);
  }

  async cancelRun(id: string): Promise<RunRecord | null> {
    return this.api.cancelRun(id);
  }
}
