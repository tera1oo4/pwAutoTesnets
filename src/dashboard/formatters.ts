import type { RunRecord } from "../shared/types.ts";

/**
 * Format run status as human-readable badge
 */
export function formatRunStatus(status: RunRecord["status"]): {
  label: string;
  color: string;
  icon: string;
} {
  switch (status) {
    case "queued":
      return { label: "Queued", color: "gray", icon: "⏳" };
    case "running":
      return { label: "Running", color: "blue", icon: "▶️" };
    case "completed":
      return { label: "Completed", color: "green", icon: "✅" };
    case "failed":
      return { label: "Failed", color: "red", icon: "❌" };
    case "cancelled":
      return { label: "Cancelled", color: "orange", icon: "⛔" };
    case "needs_review":
      return { label: "Needs Review", color: "yellow", icon: "⚠️" };
    default:
      return { label: String(status), color: "gray", icon: "❓" };
  }
}

/**
 * Format run record as table row
 */
export function formatRunRow(run: RunRecord): {
  id: string;
  scenario: string;
  network: string;
  profile: string;
  status: string;
  progress: string;
  created: string;
} {
  const statusBadge = formatRunStatus(run.status);

  return {
    id: run.id.substring(0, 8),
    scenario: run.scenarioId,
    network: run.networkId || "—",
    profile: run.profileId,
    status: `${statusBadge.icon} ${statusBadge.label}`,
    progress: `${run.attempt}/${run.maxAttempts}`,
    created: new Date(run.createdAt).toLocaleString()
  };
}

/**
 * Format artifact list for display
 */
export function formatArtifacts(artifacts: Array<{ filename: string; size: number; type: string }>) {
  return artifacts.map((artifact) => ({
    name: artifact.filename.split("/")[1] || artifact.filename,
    type: artifact.type,
    size: formatFileSize(artifact.size),
    link: artifact.filename
  }));
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
