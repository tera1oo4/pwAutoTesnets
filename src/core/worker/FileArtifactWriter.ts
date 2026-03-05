import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { DEFAULT_ARTIFACTS_DIR } from "../../shared/constants.ts";
import type { ArtifactWriter, PageHandle, RunId } from "../../shared/types.ts";

type FileArtifactWriterOptions = {
  baseDir?: string;
};

export class FileArtifactWriter implements ArtifactWriter {
  private readonly baseDir: string;

  constructor(options: FileArtifactWriterOptions = {}) {
    this.baseDir = options.baseDir ?? path.join(os.homedir(), DEFAULT_ARTIFACTS_DIR);
  }

  async captureScreenshot(page: PageHandle, runId: RunId, name: string): Promise<string> {
    const dir = await this.ensureDir(runId);
    const filePath = path.join(dir, `${name}.png`);
    await page.screenshot({ path: filePath });
    return filePath;
  }

  async captureHtml(page: PageHandle, runId: RunId, name: string): Promise<string> {
    const dir = await this.ensureDir(runId);
    const filePath = path.join(dir, `${name}.html`);
    const html = await page.content();
    await fs.writeFile(filePath, html, "utf-8");
    return filePath;
  }

  async captureTrace(page: PageHandle, runId: RunId, name: string): Promise<string> {
    const dir = await this.ensureDir(runId);
    const filePath = path.join(dir, `${name}-trace.zip`);
    await page.stopTracing(filePath);
    return filePath;
  }

  async captureLogs(page: PageHandle, runId: RunId, name: string): Promise<{ consolePath: string; networkPath: string }> {
    const dir = await this.ensureDir(runId);
    const consolePath = path.join(dir, `${name}-console.json`);
    const networkPath = path.join(dir, `${name}-network.json`);

    await fs.writeFile(consolePath, JSON.stringify(page.getConsoleLogs(), null, 2), "utf-8");
    await fs.writeFile(networkPath, JSON.stringify(page.getNetworkLogs(), null, 2), "utf-8");

    return { consolePath, networkPath };
  }

  async captureMetadata(runId: RunId, name: string, metadata: Record<string, unknown>): Promise<string> {
    const dir = await this.ensureDir(runId);
    const filePath = path.join(dir, `${name}-metadata.json`);
    await fs.writeFile(filePath, JSON.stringify(metadata, null, 2), "utf-8");
    return filePath;
  }

  private async ensureDir(runId: RunId): Promise<string> {
    const dir = path.join(this.baseDir, runId);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }
}
