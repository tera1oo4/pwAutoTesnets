import type { RunErrorCode } from "./types.ts";

export type ErrorCategory = "transient" | "permanent" | "needs_review";

export type AppErrorOptions = {
  code: RunErrorCode;
  category: ErrorCategory;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: RunErrorCode;
  readonly category: ErrorCategory;
  readonly cause?: unknown;

  constructor(message: string, options: AppErrorOptions) {
    super(message);
    this.code = options.code;
    this.category = options.category;
    this.cause = options.cause;
  }
}

export class NeedsReviewError extends AppError {
  constructor(message: string, code: RunErrorCode, cause?: unknown) {
    super(message, { code, category: "needs_review", cause });
  }
}

export const classifyError = (
  error: unknown
): { category: ErrorCategory; code: RunErrorCode; message: string } => {
  if (error instanceof AppError) {
    return {
      category: error.category,
      code: error.code,
      message: error.message
    };
  }
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("wallet") && lower.includes("unknown")) {
    return { category: "needs_review", code: "wallet_unknown_state", message };
  }
  if (lower.includes("selectortodo")) {
    return { category: "needs_review", code: "wallet_selector_todo", message };
  }
  if (lower.includes("timeout") && lower.includes("waiting for selector")) {
    return { category: "permanent", code: "ui_element_missing", message };
  }
  if (lower.includes("timeout") || lower.includes("econn") || lower.includes("network") || lower.includes("502") || lower.includes("503") || lower.includes("504")) {
    return { category: "transient", code: "network_timeout", message };
  }
  if (lower.includes("429") || lower.includes("too many requests") || lower.includes("rate limit")) {
    return { category: "transient", code: "rate_limit_exceeded", message };
  }
  if (lower.includes("401") || lower.includes("403") || lower.includes("unauthorized") || lower.includes("forbidden")) {
    return { category: "permanent", code: "auth_failed", message };
  }
  return { category: "permanent", code: "unknown", message };
};
