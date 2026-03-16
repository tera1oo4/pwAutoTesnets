import type { RunRecord } from "../../shared/types.ts";
import { DashboardApiClient, type RunsQuery } from "../client/apiClient.ts";

/**
 * DashboardRunService - Business logic for dashboard
 * Wraps API client with type-safe methods
 */
export class DashboardRunService {
  private readonly client: DashboardApiClient;

  constructor(client: DashboardApiClient) {
    this.client = client;
  }

  /**
   * List runs with optional filtering
   */
  async listRuns(query?: RunsQuery): Promise<RunRecord[]> {
    const response = await this.client.listRuns(query);
    return response.runs;
  }

  /**
   * Get specific run by ID
   */
  async getRun(id: string): Promise<RunRecord | null> {
    const response = await this.client.getRun(id);
    return response?.run ?? null;
  }

  /**
   * Cancel a run
   */
  async cancelRun(id: string): Promise<RunRecord | null> {
    const response = await this.client.cancelRun(id);
    return response?.run ?? null;
  }

  /**
   * Get run count by status
   */
  async getRunCountByStatus() {
    const runs = await this.listRuns({ limit: 1000 });

    const counts = {
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      needs_review: 0
    };

    for (const run of runs) {
      counts[run.status]++;
    }

    return counts;
  }
}
