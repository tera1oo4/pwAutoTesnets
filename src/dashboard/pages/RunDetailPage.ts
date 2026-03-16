import type { RunRecord } from "../../shared/types.ts";
import { DashboardRunService } from "../services/runService.ts";
import { formatRunStatus, formatArtifacts } from "../formatters.ts";
import { DashboardApiClient } from "../client/apiClient.ts";

/**
 * RunDetailPage - Single run detail page
 * Shows complete run information and artifacts
 */
export interface RunDetailPageResponse {
  ok: boolean;
  notFound?: boolean;
  error?: string;
  data?: {
    id: string;
    scenario: string;
    network: string;
    profile: string;
    statusBadge: ReturnType<typeof formatRunStatus>;
    attempt: number;
    maxAttempts: number;
    created: string;
    updated: string;
    artifacts: ReturnType<typeof formatArtifacts>;
    errorMessage?: string;
  };
}

/**
 * Build run detail page data
 */
export async function buildRunDetailPage(
  service: DashboardRunService,
  apiClient: DashboardApiClient,
  runId: string
): Promise<RunDetailPageResponse> {
  try {
    // Fetch run
    const run = await service.getRun(runId);

    if (!run) {
      return {
        ok: false,
        notFound: true
      };
    }

    // Fetch artifacts
    const artifactsResponse = await apiClient.getArtifacts(runId);
    const artifacts = artifactsResponse?.artifacts ?? [];

    return {
      ok: true,
      data: {
        id: run.id,
        scenario: run.scenarioId,
        network: run.networkId || "—",
        profile: run.profileId,
        statusBadge: formatRunStatus(run.status),
        attempt: run.attempt,
        maxAttempts: run.maxAttempts,
        created: new Date(run.createdAt).toLocaleString(),
        updated: new Date(run.updatedAt).toLocaleString(),
        artifacts: formatArtifacts(artifacts),
        errorMessage: run.lastErrorMessage
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
 * Serialize run detail to JSON
 */
export function serializeRunDetailPage(data: RunDetailPageResponse): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Format run detail as HTML
 */
export function renderRunDetailPageHtml(data: RunDetailPageResponse): string {
  if (!data.ok && data.notFound) {
    return `<div class="error">Run not found</div>`;
  }

  if (!data.ok) {
    return `<div class="error">Error: ${data.error}</div>`;
  }

  if (!data.data) {
    return `<div class="empty">No data</div>`;
  }

  const { id, scenario, network, profile, statusBadge, attempt, maxAttempts, created, updated, artifacts, errorMessage } = data.data;

  const artifactsHtml = artifacts.length > 0
    ? `
    <div class="artifacts">
      <h3>Artifacts</h3>
      <ul>
        ${artifacts.map((a) => `<li><a href="/api/runs/${id}/artifacts/${a.link}">${a.name}</a> (${a.size})</li>`).join("")}
      </ul>
    </div>
    `
    : "<p>No artifacts</p>";

  return `
<div class="run-detail">
  <div class="header">
    <h1>${scenario}</h1>
    <span class="status ${statusBadge.color}">${statusBadge.icon} ${statusBadge.label}</span>
  </div>

  <div class="info-grid">
    <div class="info-item">
      <span class="label">Run ID</span>
      <span class="value">${id}</span>
    </div>
    <div class="info-item">
      <span class="label">Profile</span>
      <span class="value">${profile}</span>
    </div>
    <div class="info-item">
      <span class="label">Network</span>
      <span class="value">${network}</span>
    </div>
    <div class="info-item">
      <span class="label">Progress</span>
      <span class="value">${attempt}/${maxAttempts}</span>
    </div>
    <div class="info-item">
      <span class="label">Created</span>
      <span class="value">${created}</span>
    </div>
    <div class="info-item">
      <span class="label">Updated</span>
      <span class="value">${updated}</span>
    </div>
  </div>

  ${errorMessage ? `<div class="error-message"><strong>Error:</strong> ${errorMessage}</div>` : ""}

  ${artifactsHtml}
</div>
  `;
}
