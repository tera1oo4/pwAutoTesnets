import express from "express";
import type { Logger, RunRecord, RunStatus } from "./src/shared/types.ts";
import type { RunRepository } from "./src/data/repositories/RunRepository.ts";
import { BrowserControlService } from "./src/api/services/BrowserControlService.ts";
import { createHttpServer } from "./src/api/server.ts";
import { DashboardApiClient } from "./src/dashboard/client/apiClient.ts";
import { DashboardRunService } from "./src/dashboard/services/runService.ts";
import { buildBrowserControlPage, renderBrowserControlPageHtml } from "./src/dashboard/pages/BrowserControlPage.ts";

/**
 * Simple in-memory run store for testing
 */
class InMemoryRunStore implements RunRepository {
  private readonly runs: Map<string, RunRecord>;

  constructor() {
    this.runs = new Map();
  }

  async getRun(runId: string): Promise<RunRecord | null> {
    return this.runs.get(runId) ?? null;
  }

  async listPendingRuns(limit: number, _now?: string): Promise<RunRecord[]> {
    return Array.from(this.runs.values())
      .filter((run) => run.status === "queued")
      .slice(0, limit);
  }

  async listRuns(options?: { status?: RunStatus; limit?: number }): Promise<RunRecord[]> {
    const list = options?.status
      ? Array.from(this.runs.values()).filter((run) => run.status === options.status)
      : Array.from(this.runs.values());
    return list.slice(0, options?.limit ?? list.length);
  }

  async listRecentlyUpdatedRuns(since: string, limit: number): Promise<RunRecord[]> {
    return Array.from(this.runs.values())
      .filter((run) => new Date(run.updatedAt) >= new Date(since))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }

  async createRun(run: RunRecord): Promise<void> {
    this.runs.set(run.id, run);
  }

  async updateRun(runId: string, updates: Partial<RunRecord>): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      this.runs.set(runId, { ...run, ...updates, updatedAt: new Date().toISOString() });
    }
  }

  async cancelRun(runId: string): Promise<RunRecord | null> {
    const run = this.runs.get(runId);
    if (run) {
      const updated = { ...run, status: "cancelled" as const, updatedAt: new Date().toISOString() };
      this.runs.set(runId, updated);
      return updated;
    }
    return null;
  }
}

/**
 * Simple console logger for testing
 */
const createConsoleLogger = (): Logger => ({
  log: (level: string, msg: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${level.toUpperCase()} ${msg}`);
    if (data) console.log(data);
  },
  debug: (event: string, msg: string, data?: any) => {
    console.log(`[DEBUG] ${event}: ${msg}`);
  },
  info: (event: string, msg: string, data?: any) => {
    console.log(`✓ ${msg}`);
  },
  warn: (event: string, msg: string, data?: any) => {
    console.warn(`⚠ ${msg}`);
  },
  error: (event: string, msg: string, data?: any) => {
    console.error(`✗ ${msg}`, data?.error || "");
  }
});

/**
 * Start simple test server with in-memory storage
 */
async function startTestServer() {
  const app = express();
  const logger = createConsoleLogger();
  const runStore = new InMemoryRunStore();
  const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;

  console.log("\n🧪 Starting Test Server for Browser Control Dashboard...\n");

  // Create the HTTP server
  const httpServer = createHttpServer({
    logger,
    runStore,
    artifactsPath: "./artifacts",
    port
  });

  // Start listening
  const server = httpServer.listen(port, () => {
    console.log(`\n✅ Test Server running on http://localhost:${port}\n`);
    console.log("📍 Available URLs:");
    console.log(`   • Dashboard:         http://localhost:${port}/`);
    console.log(`   • Browser Control:   http://localhost:${port}/browser-control`);
    console.log(`   • Health Check:      http://localhost:${port}/health\n`);
    console.log("🔌 API Endpoints:");
    console.log(`   • GET  http://localhost:${port}/api/runs`);
    console.log(`   • POST http://localhost:${port}/api/runs`);
    console.log(`   • GET  http://localhost:${port}/api/runs/:id`);
    console.log(`   • POST http://localhost:${port}/api/runs/:id/cancel`);
    console.log(`   • POST http://localhost:${port}/api/browser/sessions/:runId/create`);
    console.log(`   • GET  http://localhost:${port}/api/browser/sessions`);
    console.log(`   • GET  http://localhost:${port}/api/browser/sessions/:runId`);
    console.log(`   • POST http://localhost:${port}/api/browser/sessions/:runId/command`);
    console.log(`   • GET  http://localhost:${port}/api/browser/sessions/:runId/history\n`);
    console.log("📝 Note: This is an in-memory test server. Data will be lost on restart.\n");
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n\n🛑 Shutting down server...");
    server.close(() => {
      console.log("✓ Server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

// Run the server
startTestServer().catch((error) => {
  console.error("❌ Failed to start server:", error);
  process.exit(1);
});
