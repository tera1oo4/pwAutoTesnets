import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import type { Logger, RunRecord, RunStatus } from "../shared/types.ts";
import type { RunRepository } from "../data/repositories/RunRepository.ts";
import type { ScenarioEngine } from "../core/scenario/ScenarioEngine.ts";
import { RunService } from "./services/RunService.ts";
import { ArtifactsService } from "./services/ArtifactsService.ts";
import { BrowserControlService } from "./services/BrowserControlService.ts";
import { DashboardApiClient } from "../dashboard/client/apiClient.ts";
import { DashboardRunService } from "../dashboard/services/runService.ts";
import { buildRunsPage, renderRunsPageHtml } from "../dashboard/pages/RunsPage.ts";
import { buildRunDetailPage, renderRunDetailPageHtml } from "../dashboard/pages/RunDetailPage.ts";
import { buildBrowserControlPage, renderBrowserControlPageHtml } from "../dashboard/pages/BrowserControlPage.ts";

interface HttpServerOptions {
  logger: Logger;
  runStore: RunRepository;
  artifactsPath: string;
  scenarioEngine: ScenarioEngine;
  port?: number;
}

/**
 * Create production-ready HTTP server with Express
 * Replaces custom Router with standard Express routing
 */
export function createHttpServer(options: HttpServerOptions): Express {
  const { logger, runStore, artifactsPath, scenarioEngine, port = 3000 } = options;

  const app = express();

  // Middleware
  app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.debug("http_request", `${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get("user-agent")
    });
    next();
  });

  // Services
  const runService = new RunService(runStore);
  const artifactsService = new ArtifactsService({ baseDir: artifactsPath });
  const browserControlService = new BrowserControlService(logger);

  // Dashboard Helpers
  const apiClient = new DashboardApiClient(`http://localhost:${port}`);
  const dashboardService = new DashboardRunService(apiClient);

  const wrapHtml = (content: string, title: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | pwAutoTestnets</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #0f172a;
            --bg-secondary: #1e293b;
            --accent: #38bdf8;
            --accent-hover: #0ea5e9;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --border: #334155;
            --success: #22c55e;
            --error: #ef4444;
            --warning: #f59e0b;
        }
        body {
            background: var(--bg-primary);
            color: var(--text-primary);
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            line-height: 1.5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            border-bottom: 1px solid var(--border);
            padding-bottom: 1rem;
        }
        h1 {
            font-family: 'Outfit', sans-serif;
            margin: 0;
            font-size: 1.8rem;
            background: linear-gradient(135deg, #fff 0%, var(--accent) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .dashboard-link {
            text-decoration: none;
            color: var(--accent);
            font-weight: 500;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .stat-card {
            background: var(--bg-secondary);
            padding: 1.5rem;
            border-radius: 12px;
            border: 1px solid var(--border);
            text-align: center;
            transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-4px); }
        .stat-card .label { display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem; }
        .stat-card .value { font-size: 1.5rem; font-weight: 700; color: var(--accent); font-family: 'Outfit', sans-serif; }
        
        table { width: 100%; border-collapse: collapse; background: var(--bg-secondary); border-radius: 12px; overflow: hidden; border: 1px solid var(--border); }
        th { text-align: left; padding: 1rem; background: rgba(51, 65, 85, 0.5); font-weight: 600; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
        td { padding: 1rem; border-top: 1px solid var(--border); font-size: 0.875rem; }
        tr:hover { background: rgba(51, 65, 85, 0.3); }

        .badge { display: inline-block; padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
        .badge-queued { background: rgba(148, 163, 184, 0.2); color: #94a3b8; }
        .badge-running { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
        .badge-completed { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .badge-failed { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .badge-needs_review { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }

        .btn { background: var(--accent); color: var(--bg-primary); border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; text-decoration: none; }
        .btn:hover { background: var(--accent-hover); }
        
        pre { background: var(--bg-primary); padding: 1rem; border-radius: 8px; border: 1px solid var(--border); overflow-x: auto; font-size: 0.8rem; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>pwAutoTestnets</h1>
            <nav>
              <a href="/" class="dashboard-link">Dashboard</a> | 
              <a href="/browser-control" class="dashboard-link">Browser Control</a>
            </nav>
        </header>
        <main>${content}</main>
    </div>
</body>
</html>
  `;

  // ===== Dashboard UI Routes =====
  app.get("/", async (req: Request, res: Response) => {
    const status = req.query.status as RunStatus;
    const pageData = await buildRunsPage(dashboardService, status);
    const htmlSnippet = renderRunsPageHtml(pageData);
    res.send(wrapHtml(htmlSnippet, "Dashboard"));
  });

  app.get("/runs/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const pageData = await buildRunDetailPage(dashboardService, apiClient, id);
    const htmlSnippet = renderRunDetailPageHtml(pageData);
    res.send(wrapHtml(htmlSnippet, `Run ${id.slice(0, 8)}`));
  });

  app.get("/browser-control", async (req: Request, res: Response) => {
    const pageData = await buildBrowserControlPage(apiClient);
    const htmlSnippet = renderBrowserControlPageHtml(pageData);
    res.send(wrapHtml(htmlSnippet, "Browser Control"));
  });

  // ===== Health Endpoint =====
  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // ===== Runs Endpoints =====

  /**
   * GET /api/runs
   * List runs with optional filtering
   * Query params: status, limit (default 100)
   */
  app.get("/api/runs", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = req.query.status as RunStatus | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

      logger.debug("list_runs", "Listing runs", { status, limit });

      const runs = await runService.listRuns(status, limit);

      res.status(200).json({
        runs,
        count: runs.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/runs/:id
   * Get specific run by ID
   */
  app.get("/api/runs/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      logger.debug("get_run", "Getting run", { runId: id });

      const run = await runService.getRun(id);

      if (!run) {
        return res.status(404).json({
          error: "NotFound",
          message: `Run ${id} not found`
        });
      }

      res.status(200).json({
        run,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/runs
   * Create new run
   * Body: { scenarioId, profileId, networkId?, maxAttempts? }
   */
  app.post("/api/runs", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { scenarioId, profileId, networkId, maxAttempts } = req.body;

      if (!scenarioId || !profileId) {
        return res.status(400).json({
          error: "ValidationError",
          message: "scenarioId and profileId are required"
        });
      }

      // Validate scenario exists
      if (!scenarioEngine.registry.has(scenarioId)) {
        return res.status(400).json({
          error: "ValidationError",
          message: `Unknown scenarioId: ${scenarioId}`,
          availableScenarios: scenarioEngine.registry.list().map(s => ({ id: s.id, label: s.label }))
        });
      }

      logger.info("create_run", "Creating new run", {
        scenarioId,
        profileId,
        networkId
      });

      const run = await runService.createRun({
        scenarioId,
        profileId,
        networkId,
        maxAttempts
      });

      res.status(201).json({
        run,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/runs/:id/cancel
   * Cancel a run
   */
  app.post("/api/runs/:id/cancel", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      logger.info("cancel_run", "Cancelling run", { runId: id });

      const run = await runService.cancelRun(id);

      if (!run) {
        return res.status(404).json({
          error: "NotFound",
          message: `Run ${id} not found`
        });
      }

      res.status(200).json({
        run,
        message: "Run cancelled",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  // ===== Browser Control Endpoints =====

  /**
   * POST /api/browser/sessions/:runId/create
   * Create a new browser session for a run
   */
  app.post("/api/browser/sessions/:runId/create", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { runId } = req.params;

      logger.info("create_browser_session", "Creating browser session", { runId });

      const session = browserControlService.createSession(runId);

      res.status(201).json({
        session: {
          runId: session.runId,
          isActive: session.isActive,
          lastActivity: session.lastActivity,
          commandCount: session.commands.length,
          resultCount: session.results.length
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/browser/sessions/:runId
   * Get browser session details
   */
  app.get("/api/browser/sessions/:runId", (req: Request, res: Response) => {
    const { runId } = req.params;

    const session = browserControlService.getSession(runId);

    if (!session) {
      return res.status(404).json({
        error: "NotFound",
        message: `Browser session not found for run ${runId}`
      });
    }

    res.status(200).json({
      session: {
        runId: session.runId,
        isActive: session.isActive,
        commands: session.commands,
        commandCount: session.commands.length,
        resultCount: session.results.length,
        lastActivity: session.lastActivity,
        pageAvailable: !!session.page
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/browser/sessions
   * List all active browser sessions
   */
  app.get("/api/browser/sessions", (req: Request, res: Response) => {
    const sessions = browserControlService.listSessions();

    res.status(200).json({
      sessions: sessions.map(s => ({
        runId: s.runId,
        isActive: s.isActive,
        commandCount: s.commands.length,
        resultCount: s.results.length,
        lastActivity: s.lastActivity,
        pageAvailable: !!s.page
      })),
      count: sessions.length,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * POST /api/browser/sessions/:runId/command
   * Execute a command in a browser session
   * Body: { type, ... } - BrowserCommand
   */
  app.post("/api/browser/sessions/:runId/command", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { runId } = req.params;
      const command = req.body;

      if (!command.type) {
        return res.status(400).json({
          error: "ValidationError",
          message: "Command type is required"
        });
      }

      logger.debug("execute_browser_command", "Executing browser command", { runId, commandType: command.type });

      const result = await browserControlService.executeCommand(runId, command);

      res.status(result.success ? 200 : 400).json({
        result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/browser/sessions/:runId/history
   * Get command history for a session
   * Query params: limit
   */
  app.get("/api/browser/sessions/:runId/history", (req: Request, res: Response) => {
    const { runId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const history = browserControlService.getSessionHistory(runId);
    const limited = history.slice(-limit);

    res.status(200).json({
      history: limited,
      count: limited.length,
      total: history.length,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * POST /api/browser/sessions/:runId/end
   * End a browser session
   */
  app.post("/api/browser/sessions/:runId/end", (req: Request, res: Response) => {
    const { runId } = req.params;

    logger.info("end_browser_session", "Ending browser session", { runId });

    browserControlService.endSession(runId);

    res.status(200).json({
      message: "Browser session ended",
      runId,
      timestamp: new Date().toISOString()
    });
  });

  // ===== Artifacts Endpoints =====

  /**
   * GET /api/runs/:id/artifacts/:filename
   * Download artifact file
   * Supports security checks (directory traversal prevention)
   */
  app.get("/api/runs/:id/artifacts/:filename", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, filename } = req.params;

      logger.debug("get_artifact", "Getting artifact", { runId: id, filename });

      const filePath = await artifactsService.getArtifactStream(id, filename);

      if (!filePath) {
        return res.status(404).json({
          error: "NotFound",
          message: `Artifact ${filename} not found for run ${id}`
        });
      }

      const mimeType = artifactsService.getMimeType(filename);
      const stat = fs.statSync(filePath);

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Length", stat.size);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on("error", (error) => {
        logger.error("artifact_stream_error", String(error), { runId: id, filename });
        if (!res.headersSent) {
          res.status(500).json({ error: "StreamError" });
        }
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/runs/:id/artifacts
   * List all artifacts for a run
   */
  app.get("/api/runs/:id/artifacts", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      logger.debug("list_artifacts", "Listing artifacts", { runId: id });

      const artifactsDir = path.join(artifactsPath, id);

      if (!fs.existsSync(artifactsDir)) {
        return res.status(404).json({
          artifacts: [],
          message: "No artifacts found for this run"
        });
      }

      const artifacts: Array<{ filename: string; size: number; type: string }> = [];

      // Walk through subdirectories with security validation
      const subdirs = ["screenshots", "traces", "logs", "metadata", "html"];
      for (const subdir of subdirs) {
        const subdirPath = path.join(artifactsDir, subdir);
        if (fs.existsSync(subdirPath)) {
          const files = fs.readdirSync(subdirPath);
          for (const file of files) {
            const filePath = path.join(subdirPath, file);
            const normalized = path.normalize(filePath);
            // Prevent directory traversal attacks in listing
            if (!normalized.startsWith(path.resolve(artifactsDir))) {
              logger.warn("artifact_traversal_attempt", "Skipping file outside artifacts directory", {
                runId: id,
                filename: file
              });
              continue;
            }
            const stat = fs.statSync(filePath);
            if (!stat.isFile()) {
              continue;
            }
            artifacts.push({
              filename: `${subdir}/${file}`,
              size: stat.size,
              type: subdir
            });
          }
        }
      }

      res.status(200).json({
        artifacts,
        count: artifacts.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  // ===== Live Updates Endpoint (Polling-friendly) =====

  /**
   * GET /api/runs/stream/updates
   * Poll for run updates
   * Query params: since (ISO timestamp), limit
   * Returns runs updated since the given timestamp
   */
  app.get("/api/runs/stream/updates", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sinceStr = req.query.since as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const since = sinceStr ? new Date(sinceStr) : new Date(Date.now() - 60000); // Default: last minute

      logger.debug("stream_updates", "Fetching run updates", {
        since: since.toISOString(),
        limit
      });

      // Get recently updated runs efficiently
      const recentRuns = await runService.listRecentlyUpdatedRuns(since.toISOString(), limit);

      res.status(200).json({
        updates: recentRuns,
        count: recentRuns.length,
        nextUpdate: new Date(Date.now() + 5000).toISOString(), // Suggest polling again in 5s
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  // ===== Error Handler =====

  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error("http_error", err.message, {
      path: req.path,
      method: req.method,
      stack: err.stack
    });

    res.status(500).json({
      error: "InternalServerError",
      message: err.message
    });
  });

  // ===== 404 Handler =====

  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: "NotFound",
      message: `${req.method} ${req.path} not found`
    });
  });

  return app;
}

/**
 * Start HTTP server and listen on port
 */
export async function startHttpServer(
  app: Express,
  port: number,
  logger: Logger
): Promise<{ close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      logger.info("http_server_started", `HTTP server listening on port ${port}`, {
        port
      });

      resolve({
        close: () =>
          new Promise<void>((resolveClose, rejectClose) => {
            server.close((err) => {
              if (err) rejectClose(err);
              else {
                logger.info("http_server_closed", "HTTP server closed", {});
                resolveClose();
              }
            });
          })
      });
    });

    server.on("error", (err) => {
      logger.error("http_server_error", String(err), {});
      reject(err);
    });
  });
}
