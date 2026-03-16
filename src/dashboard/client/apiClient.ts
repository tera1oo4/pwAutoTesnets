import type { RunRecord, RunStatus } from "../../shared/types.ts";

/**
 * API Client for dashboard
 * Communicates with backend HTTP API
 */
export type ApiRunsResponse = {
  runs: RunRecord[];
  count: number;
  timestamp: string;
};

export type ApiRunResponse = {
  run: RunRecord;
  timestamp: string;
};

export type ApiArtifact = {
  filename: string;
  size: number;
  type: "screenshots" | "traces" | "logs" | "metadata" | "html";
};

export type ApiArtifactsResponse = {
  artifacts: ApiArtifact[];
  count: number;
  timestamp: string;
};

export type ApiUpdatesResponse = {
  updates: RunRecord[];
  count: number;
  nextUpdate: string;
  timestamp: string;
};

export type RunsQuery = {
  status?: RunStatus;
  limit?: number;
};

/**
 * Dashboard API Client
 * Type-safe HTTP client for backend API
 */
export class DashboardApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl;
  }

  /**
   * List runs with optional filtering
   */
  async listRuns(query?: RunsQuery): Promise<ApiRunsResponse> {
    const url = new URL(`${this.baseUrl}/api/runs`);
    if (query?.status) url.searchParams.set("status", query.status);
    if (query?.limit) url.searchParams.set("limit", String(query.limit));

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    return response.json();
  }

  /**
   * Get run by ID
   */
  async getRun(id: string): Promise<ApiRunResponse | null> {
    const response = await fetch(`${this.baseUrl}/api/runs/${id}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    return response.json();
  }

  /**
   * Cancel a run
   */
  async cancelRun(id: string): Promise<ApiRunResponse | null> {
    const response = await fetch(`${this.baseUrl}/api/runs/${id}/cancel`, {
      method: "POST"
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    return response.json();
  }

  /**
   * List artifacts for a run
   */
  async getArtifacts(runId: string): Promise<ApiArtifactsResponse | null> {
    const response = await fetch(`${this.baseUrl}/api/runs/${runId}/artifacts`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    return response.json();
  }

  /**
   * Download artifact file
   */
  getArtifactUrl(runId: string, filename: string): string {
    return `${this.baseUrl}/api/runs/${runId}/artifacts/${filename}`;
  }

  /**
   * Poll for recent updates
   */
  async getUpdates(since?: Date, limit?: number): Promise<ApiUpdatesResponse> {
    const url = new URL(`${this.baseUrl}/api/runs/stream/updates`);
    if (since) url.searchParams.set("since", since.toISOString());
    if (limit) url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    return response.json();
  }
}
