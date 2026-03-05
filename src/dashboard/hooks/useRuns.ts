import type { RunRecord } from "../../shared/types.ts";
import type { DashboardRunService, RunsQuery } from "../services/runService.ts";

export const useRuns = async (
  service: DashboardRunService,
  query?: RunsQuery
): Promise<RunRecord[]> => {
  return service.listRuns(query);
};
