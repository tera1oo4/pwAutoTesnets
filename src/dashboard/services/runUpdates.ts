import type { RunRecord, RunStatus } from "../../shared/types.ts";
import type { DashboardApi } from "./runService.ts";

type RunUpdatesOptions = {
  intervalMs?: number;
  status?: RunStatus;
  limit?: number;
};

export class RunUpdatesPoller {
  private readonly api: DashboardApi;
  private readonly intervalMs: number;
  private readonly status?: RunStatus;
  private readonly limit?: number;
  private timer?: ReturnType<typeof setInterval>;
  private eventSource?: EventSource;
  private running = false;

  constructor(api: DashboardApi, options: RunUpdatesOptions = {}) {
    this.api = api;
    this.intervalMs = options.intervalMs ?? 2000;
    this.status = options.status;
    this.limit = options.limit;
  }

  start(handler: (runs: RunRecord[]) => void) {
    if (this.running) {
      return;
    }
    this.running = true;

    try {
      const url = new URL("/api/runs/stream", window.location.origin);
      if (this.status) url.searchParams.set("status", this.status);
      if (this.limit) url.searchParams.set("limit", String(this.limit));

      this.eventSource = new EventSource(url.toString());
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.runs) handler(data.runs);
        } catch { }
      };
      this.eventSource.onerror = () => {
        this.eventSource?.close();
        this.eventSource = undefined;
        this.startPolling(handler);
      };
    } catch {
      this.startPolling(handler);
    }
  }

  private startPolling(handler: (runs: RunRecord[]) => void) {
    if (this.timer || !this.running) return;
    const tick = async () => {
      if (!this.running) return;
      const runs = await this.api.listRuns({ status: this.status, limit: this.limit });
      handler(runs);
    };
    this.timer = setInterval(() => {
      void tick();
    }, this.intervalMs);
    void tick();
  }

  stop() {
    this.running = false;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
