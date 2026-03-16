import "dotenv/config";
import { initializeApp, startWorkerLoop, startSchedulerLoop } from "./main";
import { createHttpServer } from "./api/server";
import { createConsoleLogger } from "./shared/logger";
import { SCHEDULER_POLL_INTERVAL_MS } from "./shared/constants";

const logger = createConsoleLogger({ context: { module: "startup" } });

async function main() {
  try {
    logger.info("app_startup", "Starting PlaywrightAutomation application", {});

    // Initialize all services
    const services = await initializeApp();
    const app = {
      ...services,
      artifactsPath: process.env.ARTIFACTS_PATH || "./artifacts"
    };

    // Create HTTP server
    const server = createHttpServer(app);

    // Start server
    const port = process.env.APP_PORT || 3000;
    const httpServer = server.listen(port, () => {
      logger.info("http_server_started", `HTTP Server listening on http://localhost:${port}`, {
        port: Number(port),
        availableScenarios: ["connect_wallet", "connect_and_sign_message", "approve_token"]
      });
    });

    const abortController = new AbortController();

    // Start background loops
    void startWorkerLoop(services.worker, services.logger, abortController.signal);
    startSchedulerLoop(services.scheduler, services.logger, SCHEDULER_POLL_INTERVAL_MS, abortController.signal);

    const shutdown = async () => {
      services.logger.info("shutdown_initiated", "Shutting down application", {});
      abortController.abort();
      
      httpServer.close();
      if (typeof (services.runStore as any)?.close === "function") {
        await (services.runStore as any).close();
      }
      if (typeof services.redis?.quit === "function") {
        await services.redis.quit().catch((err) => {
          services.logger.error("redis_quit_failed", "Failed to close Redis connection", {
            error: String(err)
          });
        });
      }
      
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    logger.error("app_startup_failed", "Failed to start application", {
      error: String(error)
    });
    process.exit(1);
  }
}

main();
