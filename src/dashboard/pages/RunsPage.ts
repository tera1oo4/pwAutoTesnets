import type { RunRecord } from "../../shared/types.ts";
import { renderRunTable } from "../components/RunTable.ts";
import { useRuns } from "../hooks/useRuns.ts";
import type { DashboardRunService, RunsQuery } from "../services/runService.ts";

export const buildRunsPage = async (
  service: DashboardRunService,
  query?: RunsQuery
): Promise<{ runs: ReturnType<typeof renderRunTable>; total: number }> => {
  const runs = await useRuns(service, query);
  return {
    runs: renderRunTable(runs),
    total: runs.length
  };
};

export const serializeRunsPage = (runs: RunRecord[]) => {
  return JSON.stringify({ runs }, null, 2);
};
