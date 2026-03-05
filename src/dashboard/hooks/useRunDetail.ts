import type { RunRecord } from "../../shared/types.ts";
import type { DashboardRunService } from "../services/runService.ts";

export const useRunDetail = async (
  service: DashboardRunService,
  runId: string
): Promise<RunRecord | null> => {
  return service.getRun(runId);
};
