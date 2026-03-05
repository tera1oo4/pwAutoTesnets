import type { RunRecord } from "../../shared/types.ts";
import { renderRunStatusBadge } from "./RunStatusBadge.ts";

export const renderRunTable = (runs: RunRecord[]) => {
  return runs.map((run) => ({
    id: run.id,
    scenarioId: run.scenarioId,
    networkId: run.networkId,
    profileId: run.profileId,
    status: renderRunStatusBadge(run.status),
    attempt: `${run.attempt}/${run.maxAttempts}`
  }));
};
