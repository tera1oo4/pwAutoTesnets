import type { RunRecord } from "../../shared/types.ts";
import type { ApiUpdatesResponse } from "../client/apiClient.ts";
import { DashboardApiClient } from "../client/apiClient.ts";

/**
 * RunUpdatesPoller - Polls for run updates
 * Provides both polling and optional SSE fallback
 */
export class RunUpdatesPoller {
  private readonly client: DashboardApiClient;
  private readonly intervalMs: number;
  private timer?: NodeJS.Timeout;
  private running = false;
  private lastUpdate: Date;

  constructor(client: DashboardApiClient, intervalMs: number = 5000) {
    this.client = client;
    this.intervalMs = intervalMs;
    this.lastUpdate = new Date(Date.now() - 60000); // Start from 1 minute ago
  }

  /**
   * Start polling for updates
   */
  start(onUpdate: (runs: RunRecord[]) => void, onError?: (error: Error) => void): void {
    if (this.running) return;

    this.running = true;
    const poll = async () => {
      try {
        if (!this.running) return;

        const response = await this.client.getUpdates(this.lastUpdate, 50);
        if (response.updates.length > 0) {
          onUpdate(response.updates);
          this.lastUpdate = new Date();
        }
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    // Poll immediately first
    void poll();

    // Then set up interval
    this.timer = setInterval(() => {
      void poll();
    }, this.intervalMs);
  }

  /**
   * Stop polling
   */
  stop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  /**
   * Check if currently polling
   */
  isRunning(): boolean {
    return this.running;
  }
}
