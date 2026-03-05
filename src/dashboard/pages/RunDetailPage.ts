import { renderRunStatusBadge } from "../components/RunStatusBadge.ts";
import { renderRunArtifacts } from "../components/RunArtifacts.ts";
import { useRunDetail } from "../hooks/useRunDetail.ts";
import type { DashboardRunService } from "../services/runService.ts";

export const buildRunDetailPage = async (service: DashboardRunService, runId: string) => {
  const run = await useRunDetail(service, runId);
  if (!run) {
    return { error: "RunNotFound" };
  }
  return {
    id: run.id,
    scenarioId: run.scenarioId,
    networkId: run.networkId,
    profileId: run.profileId,
    status: renderRunStatusBadge(run.status),
    attempt: run.attempt,
    maxAttempts: run.maxAttempts,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,

    // We expect the Dashboard renderer generator to pass this down dynamically
    artifactsView: renderRunArtifacts(run.id, (run as any).artifacts || run.lastErrorMessage ? {
      // Quick polyfill mapping for dashboard testing where API didn't strictly expose artifacts column
      // For a real production app we would expose it cleanly through `run.artifacts`
      screenshotPath: (run as any).screenshotPath,
      htmlPath: (run as any).htmlPath,
      tracePath: (run as any).tracePath,
      consoleLogsPath: (run as any).consoleLogsPath,
      networkLogsPath: (run as any).networkLogsPath,
      metadataPath: (run as any).metadataPath
    } : undefined)
  };
};
