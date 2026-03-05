import type { RunRecord, RunStatus } from "../shared/types.ts";

export type CreateRunRequest = {
  scenarioId: string;
  networkId: string;
  profileId: string;
  maxAttempts?: number;
};

export type ListRunsQuery = {
  status?: RunStatus;
  limit?: number;
};

export type RunResponse = {
  run: RunRecord;
};

export type RunsResponse = {
  runs: RunRecord[];
};

export type CancelRunResponse = {
  run: RunRecord;
};

export const parseCreateRunRequest = (input: unknown): CreateRunRequest => {
  const body = ensureObject(input);
  return {
    scenarioId: requireString(body, "scenarioId"),
    networkId: requireString(body, "networkId"),
    profileId: requireString(body, "profileId"),
    maxAttempts: optionalNumber(body, "maxAttempts")
  };
};

export const parseListRunsQuery = (input: Record<string, string> | undefined): ListRunsQuery => {
  if (!input) {
    return {};
  }
  const limit = input.limit ? Number(input.limit) : undefined;
  if (limit !== undefined && Number.isNaN(limit)) {
    throw new Error("InvalidQuery: limit");
  }
  const status = input.status as RunStatus | undefined;
  if (status && !["queued", "running", "completed", "failed", "cancelled", "needs_review"].includes(status)) {
    throw new Error("InvalidQuery: status");
  }
  return {
    limit,
    status
  };
};

const ensureObject = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object") {
    throw new Error("InvalidBody");
  }
  return input as Record<string, unknown>;
};

const requireString = (input: Record<string, unknown>, key: string): string => {
  const value = input[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`InvalidBody: ${key}`);
  }
  return value;
};

const optionalNumber = (input: Record<string, unknown>, key: string): number | undefined => {
  const value = input[key];
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`InvalidBody: ${key}`);
  }
  return value;
};
