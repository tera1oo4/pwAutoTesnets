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
 * Browser control types
 */
export type BrowserSessionInfo = {
  runId: string;
  isActive: boolean;
  commandCount: number;
  resultCount: number;
  lastActivity: string;
  pageAvailable: boolean;
};

export type BrowserCommand = {
  type: string;
  [key: string]: any;
};

export type BrowserCommandResult = {
  success: boolean;
  timestamp: string;
  command: BrowserCommand;
  result?: any;
  error?: string;
};

export type BrowserSessionsResponse = {
  sessions: BrowserSessionInfo[];
  count: number;
  timestamp: string;
};

export type BrowserSessionResponse = {
  session: BrowserSessionInfo;
  timestamp: string;
};

export type BrowserCommandResultResponse = {
  result: BrowserCommandResult;
  timestamp: string;
};

export type BrowserCommandHistoryResponse = {
  history: BrowserCommandResult[];
  count: number;
  total: number;
  timestamp: string;
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

  // ===== Browser Control Methods =====

  /**
   * Create a new browser session for a run
   */
  async createBrowserSession(runId: string): Promise<BrowserSessionResponse> {
    const response = await fetch(`${this.baseUrl}/api/browser/sessions/${runId}/create`, {
      method: "POST"
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json();
  }

  /**
   * Get browser session details
   */
  async getBrowserSession(runId: string): Promise<BrowserSessionResponse | null> {
    const response = await fetch(`${this.baseUrl}/api/browser/sessions/${runId}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json();
  }

  /**
   * List all active browser sessions
   */
  async listBrowserSessions(): Promise<BrowserSessionsResponse> {
    const response = await fetch(`${this.baseUrl}/api/browser/sessions`);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json();
  }

  /**
   * Execute a command in a browser session
   */
  async executeBrowserCommand(runId: string, command: BrowserCommand): Promise<BrowserCommandResultResponse> {
    const response = await fetch(`${this.baseUrl}/api/browser/sessions/${runId}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(command)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json();
  }

  /**
   * Get command history for a session
   */
  async getBrowserCommandHistory(runId: string, limit?: number): Promise<BrowserCommandHistoryResponse> {
    const url = new URL(`${this.baseUrl}/api/browser/sessions/${runId}/history`);
    if (limit) url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json();
  }

  /**
   * End a browser session
   */
  async endBrowserSession(runId: string): Promise<{ message: string; runId: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/api/browser/sessions/${runId}/end`, {
      method: "POST"
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return response.json();
  }
}
