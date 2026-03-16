import type { RunRecord, RunStatus } from "../../shared/types.ts";
import { DashboardRunService } from "../services/runService.ts";
import { formatRunRow } from "../formatters.ts";

/**
 * RunsPage - Main dashboard page
 * Lists all runs with filtering and status overview
 */
export interface RunsPageResponse {
  ok: boolean;
  error?: string;
  data?: {
    runs: ReturnType<typeof formatRunRow>[];
    counts: {
      total: number;
      queued: number;
      running: number;
      completed: number;
      failed: number;
      cancelled: number;
      needs_review: number;
    };
    lastUpdate: string;
  };
}

/**
 * Build runs page data
 */
export async function buildRunsPage(
  service: DashboardRunService,
  status?: RunStatus
): Promise<RunsPageResponse> {
  try {
    // Fetch runs
    const runs = await service.listRuns({ status, limit: 100 });

    // Format for display
    const formattedRuns = runs.map(formatRunRow);

    // Calculate counts
    const counts = await service.getRunCountByStatus();

    return {
      ok: true,
      data: {
        runs: formattedRuns,
        counts: {
          total: runs.length,
          ...counts
        },
        lastUpdate: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Serialize runs page to JSON
 */
export function serializeRunsPage(data: RunsPageResponse): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Format runs page as HTML table
 */
export function renderRunsPageHtml(data: RunsPageResponse): string {
  if (!data.ok) {
    return `<div class="error">Error: ${data.error}</div>`;
  }

  if (!data.data) {
    return `<div class="empty">No data</div>`;
  }

  const { runs, counts } = data.data;

  if (runs.length === 0) {
    return `<div class="empty">No runs found</div>`;
  }

  const headers = Object.keys(runs[0]);
  const headerHtml = headers.map((h) => `<th>${h}</th>`).join("");
  const rowsHtml = runs
    .map(
      (run: any) =>
        `<tr>${headers.map((h) => `<td>${run[h]}</td>`).join("")}</tr>`
    )
    .join("");

  return `
<div class="dashboard">
  <div class="stats">
    <div class="stat-card"><span class="label">Total</span><span class="value">${counts.total}</span></div>
    <div class="stat-card"><span class="label">Queued</span><span class="value">${counts.queued}</span></div>
    <div class="stat-card"><span class="label">Running</span><span class="value">${counts.running}</span></div>
    <div class="stat-card"><span class="label">Completed</span><span class="value">${counts.completed}</span></div>
    <div class="stat-card"><span class="label">Failed</span><span class="value">${counts.failed}</span></div>
    <div class="stat-card"><span class="label">Needs Review</span><span class="value">${counts.needs_review}</span></div>
  </div>
  <table class="runs-table">
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</div>
  `;
}
