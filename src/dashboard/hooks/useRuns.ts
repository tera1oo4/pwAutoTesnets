import type { RunRecord } from "../../shared/types.ts";
import type { DashboardRunService } from "../services/runService.ts";
import type { RunsQuery } from "../client/apiClient.ts";

export const useRuns = async (
  service: DashboardRunService,
  query?: RunsQuery
): Promise<RunRecord[]> => {
  return service.listRuns(query);
};
