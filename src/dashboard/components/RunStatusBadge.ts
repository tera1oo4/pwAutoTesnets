import type { RunStatus } from "../../shared/types.ts";

export const renderRunStatusBadge = (status: RunStatus) => {
  return {
    text: status,
    tone:
      status === "failed"
        ? "critical"
        : status === "completed"
          ? "success"
          : status === "needs_review"
            ? "warning"
            : status === "cancelled"
              ? "subdued"
              : "neutral"
  };
};
