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

    async getArtifactStream(runId: string, filename: string): Promise<string | null> {
        const filePath = path.join(this.baseDir, runId, filename);
        const normalized = path.normalize(filePath);

        // Prevent directory traversal attacks
        if (!normalized.startsWith(path.resolve(this.baseDir))) {
            return null;
        }

        try {
            const stat = await fs.stat(normalized);
            if (!stat.isFile()) {
                return null;
            }
            return normalized;
        } catch {
            return null;
        }
    }

    getMimeType(filename: string): string {
        const ext = path.extname(filename).toLowerCase();
        switch (ext) {
            case ".png": return "image/png";
            case ".html": return "text/html";
            case ".zip": return "application/zip";
            case ".json": return "application/json";
            case ".txt": return "text/plain";
            default: return "application/octet-stream";
        }
    }
}
