import type { RunErrorCode } from "./types.ts";

type RetryPolicyOptions = {
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const computeRetryDelayMs = (attempt: number, errorCode?: RunErrorCode, options: RetryPolicyOptions = {}) => {
  let base = options.baseDelayMs ?? 2000;
  if (errorCode === "rate_limit_exceeded") {
    base = Math.max(base, 15000); // Backoff greatly on rate limit
  }
  const max = options.maxDelayMs ?? 60_000;
  const jitterRatio = options.jitterRatio ?? 0.2;
  const exponential = base * Math.pow(2, Math.max(0, attempt - 1));
  const jitter = exponential * jitterRatio * (Math.random() - 0.5) * 2;
  return clamp(Math.round(exponential + jitter), base, max);
};
