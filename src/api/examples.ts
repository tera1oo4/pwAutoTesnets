import type { RunRecord } from "../shared/types.ts";

export const createRunRequestExample = {
  scenarioId: "connect-wallet",
  networkId: "sepolia",
  profileId: "profile-1",
  maxAttempts: 3
};

export const createRunResponseExample = {
  run: {
    id: "run-1",
    scenarioId: "connect-wallet",
    networkId: "sepolia",
    profileId: "profile-1",
    status: "queued",
    attempt: 0,
    maxAttempts: 3,
    createdAt: "2026-03-05T10:00:00.000Z",
    updatedAt: "2026-03-05T10:00:00.000Z"
  } satisfies RunRecord
};

export const listRunsResponseExample = {
  runs: [createRunResponseExample.run]
};

export const cancelRunResponseExample = {
  run: {
    ...createRunResponseExample.run,
    status: "cancelled"
  }
};
