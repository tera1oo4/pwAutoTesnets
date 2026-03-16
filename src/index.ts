import "dotenv/config";
import { initializeApp, startWorkerLoop, startSchedulerLoop } from "./main";
import { createHttpServer } from "./api/server";

async function main() {
  try {
    console.log("🚀 Starting PlaywrightAutomation application...\n");

    // Initialize all services
    const services = await initializeApp();
    const app = { ...services, artifactsPath: process.env.ARTIFACTS_PATH || "./artifacts" };

    // Create HTTP server
    const server = createHttpServer(app);

    // Start server
    const port = process.env.APP_PORT || 3000;
    const httpServer = server.listen(port, () => {
      console.log(`✓ HTTP Server listening on http://localhost:${port}`);
      console.log(`✓ Available scenarios:`);
      console.log(`  - connect_wallet: Detect and connect MetaMask`);
      console.log(`  - connect_and_sign_message: Sign test message`);
      console.log(`  - approve_token: Simulate Uniswap token swap\n`);
      console.log(`API endpoints:`);
      console.log(`  GET  http://localhost:${port}/api/runs`);
      console.log(`  POST http://localhost:${port}/api/runs`);
      console.log(`  GET  http://localhost:${port}/api/runs/:id\n`);
    });

    const abortController = new AbortController();

    // Start background loops
    void startWorkerLoop(services.worker, services.logger, abortController.signal);
    startSchedulerLoop(services.scheduler, services.logger, 15000, abortController.signal);

    const shutdown = async () => {
      services.logger.info("shutdown_initiated", "Shutting down application", {});
      abortController.abort();
      
      httpServer.close();
      if (typeof (services.runStore as any)?.close === "function") {
        await (services.runStore as any).close();
      }
      if (typeof services.redis?.quit === "function") {
        await services.redis.quit().catch(console.error);
      }
      
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("❌ Failed to start application:", error);
    process.exit(1);
  }
}

main();
