import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { DEFAULT_ARTIFACTS_DIR } from "../../shared/constants.ts";
import type { ArtifactWriter, PageHandle, RunId, Logger } from "../../shared/types.ts";

type FileArtifactWriterOptions = {
  baseDir?: string;
  logger?: Logger;
};

/**
 * FileArtifactWriter - Production-ready artifact storage
 *
 * Directory structure:
 * baseDir/
 *   runId/
 *     screenshots/      - PNG screenshots
 *     traces/          - Playwright trace.zip files
 *     logs/            - Console and network logs
 *     metadata/        - Detector and run metadata
 *     html/            - HTML snapshots
 */
export class FileArtifactWriter implements ArtifactWriter {
  private readonly baseDir: string;
  private readonly logger: Logger | typeof console;
  private readonly subdirs = {
    screenshots: "screenshots",
    traces: "traces",
    logs: "logs",
    metadata: "metadata",
    html: "html"
  };

  constructor(options: FileArtifactWriterOptions = {}) {
    this.baseDir = options.baseDir ?? path.join(os.homedir(), DEFAULT_ARTIFACTS_DIR);
    this.logger = options.logger ?? console;
  }

  async captureScreenshot(page: PageHandle, runId: RunId, name: string): Promise<string> {
    try {
      const dir = await this.ensureSubdir(runId, this.subdirs.screenshots);
      const filePath = path.join(dir, `${name}.png`);
      await page.screenshot({ path: filePath });
      return filePath;
    } catch (error) {
      // Graceful degradation - log but don't throw
      this.logger.error("artifact_screenshot_failed", `Failed to capture screenshot ${name}: ${error}`, { error: String(error) });
      return "";
    }
  }

  async captureHtml(page: PageHandle, runId: RunId, name: string): Promise<string> {
    try {
      const dir = await this.ensureSubdir(runId, this.subdirs.html);
      const filePath = path.join(dir, `${name}.html`);
      const html = await page.content();
      await fs.writeFile(filePath, html, "utf-8");
      return filePath;
    } catch (error) {
      this.logger.error("artifact_html_failed", `Failed to capture HTML ${name}: ${error}`, { error: String(error) });
      return "";
    }
  }

  async captureTrace(page: PageHandle, runId: RunId, name: string): Promise<string> {
    try {
      const dir = await this.ensureSubdir(runId, this.subdirs.traces);
      const filePath = path.join(dir, `${name}-trace.zip`);
      await page.stopTracing(filePath);
      return filePath;
    } catch (error) {
      this.logger.error("artifact_trace_failed", `Failed to capture trace ${name}: ${error}`, { error: String(error) });
      return "";
    }
  }

  async captureLogs(page: PageHandle, runId: RunId, name: string): Promise<{ consolePath: string; networkPath: string }> {
    try {
      const dir = await this.ensureSubdir(runId, this.subdirs.logs);
      const consolePath = path.join(dir, `${name}-console.json`);
      const networkPath = path.join(dir, `${name}-network.json`);

      // Get logs from page
      const consoleLogs = page.getConsoleLogs();
      const networkLogs = page.getNetworkLogs();

      // Save console logs
      await fs.writeFile(
        consolePath,
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            entries: consoleLogs
          },
          null,
          2
        ),
        "utf-8"
      );

      // Save network logs
      await fs.writeFile(
        networkPath,
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            entries: networkLogs
          },
          null,
          2
        ),
        "utf-8"
      );

      return { consolePath, networkPath };
    } catch (error) {
      this.logger.error("artifact_logs_failed", `Failed to capture logs ${name}: ${error}`, { error: String(error) });
      return { consolePath: "", networkPath: "" };
    }
  }

  async captureMetadata(runId: RunId, name: string, metadata: Record<string, unknown>): Promise<string> {
    try {
      const dir = await this.ensureSubdir(runId, this.subdirs.metadata);
      const filePath = path.join(dir, `${name}-metadata.json`);

      const enrichedMetadata = {
        timestamp: new Date().toISOString(),
        runId,
        artifactName: name,
        data: metadata
      };

      await fs.writeFile(filePath, JSON.stringify(enrichedMetadata, null, 2), "utf-8");
      return filePath;
    } catch (error) {
      this.logger.error("artifact_metadata_failed", `Failed to capture metadata ${name}: ${error}`, { error: String(error) });
      return "";
    }
  }

  private async ensureSubdir(runId: RunId, subdir: string): Promise<string> {
    const dir = path.join(this.baseDir, runId, subdir);
    try {
      await fs.mkdir(dir, { recursive: true });
      return dir;
    } catch (error) {
      throw new Error(`Failed to create artifact directory ${dir}: ${error}`);
    }
  }
}
