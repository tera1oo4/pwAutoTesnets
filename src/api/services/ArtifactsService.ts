import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { DEFAULT_ARTIFACTS_DIR } from "../../shared/constants.ts";

type ArtifactsServiceOptions = {
  baseDir?: string;
};

export class ArtifactsService {
  private readonly baseDir: string;

  constructor(options: ArtifactsServiceOptions = {}) {
    this.baseDir = options.baseDir ?? path.join(os.homedir(), DEFAULT_ARTIFACTS_DIR);
  }

  /**
   * Get safe artifact file path with security checks
   * Prevents directory traversal attacks
   */
  async getArtifactStream(runId: string, filename: string): Promise<string | null> {
    // Validate runId and filename don't contain path traversal sequences
    if (runId.includes("..") || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return null;
    }

    const baseResolved = path.resolve(this.baseDir);
    const filePath = path.join(this.baseDir, runId, filename);
    const normalized = path.normalize(filePath);
    const normalizedResolved = path.resolve(normalized);

    // Strict check: resolved path must start with base directory
    if (!normalizedResolved.startsWith(baseResolved + path.sep) && normalizedResolved !== baseResolved) {
      return null;
    }

    try {
      const stat = await fs.stat(normalizedResolved);
      if (!stat.isFile()) {
        return null;
      }
      return normalizedResolved;
    } catch {
      return null;
    }
  }

  /**
   * Get MIME type for artifact file
   */
  getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
      case ".png":
        return "image/png";
      case ".html":
        return "text/html";
      case ".zip":
        return "application/zip";
      case ".json":
        return "application/json";
      case ".txt":
        return "text/plain";
      default:
        return "application/octet-stream";
    }
  }
}

