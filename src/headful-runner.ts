#!/usr/bin/env node
/**
 * Headful Browser Runner - Executes scenarios with visible browser for debugging
 * Usage: tsx src/headful-runner.ts <scenarioId> [profileId] [--networkId=<id>]
 */

import { createRedisClient } from "./config/redis";
import { createConsoleLogger } from "./shared/logger";
import { loadEnv } from "./config/env";
import { PostgresRunStore } from "./core/store/PostgresRunStore";
import { BrowserManager } from "./core/browser/BrowserManager";
import { PlaywrightBrowserDriver } from "./core/browser/PlaywrightBrowserDriver";
import { ProfileLock } from "./core/browser/ProfileLock";
import { ScenarioRegistry } from "./core/scenario/ScenarioRegistry";
import { ScenarioEngine } from "./core/scenario/ScenarioEngine";
import { FileArtifactWriter } from "./core/worker/FileArtifactWriter";
import { ConnectWalletScenario } from "./core/scenario/scenarios/ConnectWalletScenario";
import { SignMessageScenario } from "./core/scenario/scenarios/SignMessageScenario";
import { TokenSwapScenario } from "./core/scenario/scenarios/TokenSwapScenario";
import { SwitchNetworkIfNeededScenario } from "./core/scenario/scenarios/SwitchNetworkScenario";
import { GenericTransactionFlowScenario } from "./core/scenario/scenarios/GenericTransactionScenario";
import { MetaMaskController } from "./core/wallet/metamask/MetaMaskController";
import { RabbyController } from "./core/wallet/rabby/RabbyController";
import { WalletDetector } from "./core/wallet/WalletDetector";
import { WalletManager } from "./core/wallet/WalletManager";
import type { Logger, ScenarioContext, BrowserProfile } from "./shared/types";

type HeadfulRunnerOptions = {
  scenarioId: string;
  profileId?: string;
  networkId?: string;
};

class HeadfulRunner {
  private logger: Logger;
  private env: ReturnType<typeof loadEnv>;
  private store: PostgresRunStore;
  private browserManager: BrowserManager;
  private scenarioEngine: ScenarioEngine;
  private artifacts: FileArtifactWriter;

  private constructor(logger: Logger, env: ReturnType<typeof loadEnv>) {
    this.logger = logger;
    this.env = env;
  }

  static async create(): Promise<HeadfulRunner> {
    const env = loadEnv(process.env);
    const logger = createConsoleLogger({ context: { app: "HeadfulRunner" } });

    const instance = new HeadfulRunner(logger, env);
    await instance.initialize();
    return instance;
  }

  private async initialize(): Promise<void> {
    this.logger.info("init_start", "Initializing Headful Runner...", {});

    // Initialize database
    try {
      this.store = new PostgresRunStore({
        connectionString: this.env.databaseUrl,
        logger: this.logger
      });
      this.logger.debug("db_initialized", "Database connected", {});
    } catch (error) {
      this.logger.error("db_init_failed", "Failed to initialize database", {
        error: String(error)
      });
      throw error;
    }

    // Initialize browser driver with headless=false
    const browserDriver = new PlaywrightBrowserDriver({
      logger: this.logger,
      metamaskExtensionPath: this.env.metamaskExtensionPath,
      rabbyExtensionPath: this.env.rabbyExtensionPath
    });

    const profileLock = new ProfileLock(this.env.artifactsPath);
    this.browserManager = new BrowserManager({
      driver: browserDriver,
      lock: profileLock
    });

    // Initialize scenarios
    const registry = new ScenarioRegistry();
    registry.register(new ConnectWalletScenario());
    registry.register(new SignMessageScenario());
    registry.register(new TokenSwapScenario());
    registry.register(new SwitchNetworkIfNeededScenario());
    registry.register(new GenericTransactionFlowScenario());

    this.scenarioEngine = new ScenarioEngine({ registry });
    this.artifacts = new FileArtifactWriter({ baseDir: this.env.artifactsPath, logger: this.logger });

    this.logger.info("init_complete", "Headful Runner initialized", {
      headless: false
    });
  }

  async runScenario(options: HeadfulRunnerOptions): Promise<void> {
    const { scenarioId, profileId = "default-profile", networkId = "1" } = options;

    this.logger.info("scenario_start_headful", "Starting headful scenario execution", {
      scenarioId,
      profileId,
      networkId,
      headless: false
    });

    // Create a test profile
    const profile: BrowserProfile = {
      id: profileId,
      walletAddress: "0x742d35Cc6634C0532925a3b844Bc7e7595f42bE",
      walletKind: "metamask"
    };

    let browserSession;
    try {
      // Open browser in headful mode (visible)
      browserSession = await this.browserManager.open(profile);
      this.logger.info("browser_opened", "Browser session opened in HEADFUL mode", {
        sessionId: browserSession.id,
        profileId
      });

      // Get page from browser
      const page = browserSession.page;

      // Initialize wallet manager for wallet interactions
      const walletDetector = new WalletDetector({ logger: this.logger });
      const metamaskController = new MetaMaskController({
        logger: this.logger,
        walletDetector
      });
      const rabbyController = new RabbyController({
        logger: this.logger,
        walletDetector
      });
      const walletManager = new WalletManager({
        metamask: metamaskController,
        rabby: rabbyController,
        logger: this.logger
      });

      // Create scenario context
      const run = await this.store.getRunById("headful-test-run").catch(() => null);
      const context: ScenarioContext = {
        page,
        logger: this.logger,
        walletManager,
        run: run || {
          id: "headful-test-run",
          scenarioId,
          profileId,
          networkId: parseInt(networkId),
          status: "running",
          attempt: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        artifacts: this.artifacts
      };

      // Execute scenario
      await this.scenarioEngine.runById(scenarioId as any, context);

      this.logger.info("scenario_success", "Scenario execution completed successfully", {
        scenarioId,
        profileId
      });

      console.log("\n✅ Scenario completed successfully!");
      console.log("🔍 Browser is still open for inspection. Press Ctrl+C to exit.");
    } catch (error) {
      this.logger.error("scenario_failed", "Scenario execution failed", {
        scenarioId,
        profileId,
        error: String(error)
      });
      console.error(`\n❌ Scenario failed: ${error}`);
      throw error;
    } finally {
      if (browserSession) {
        try {
          await this.browserManager.close(profileId);
          this.logger.info("browser_closed", "Browser session closed", { profileId });
        } catch (error) {
          this.logger.error("browser_close_failed", "Failed to close browser", {
            error: String(error)
          });
        }
      }
    }
  }

  async cleanup(): Promise<void> {
    this.logger.info("cleanup_start", "Cleaning up resources", {});
    try {
      await this.store.close?.();
    } catch (error) {
      this.logger.warn("cleanup_warning", "Error during cleanup", { error: String(error) });
    }
  }
}

// Parse command line arguments
function parseArgs(): HeadfulRunnerOptions {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: tsx src/headful-runner.ts <scenarioId> [profileId] [--networkId=<id>]\n");
    console.error("Available scenarios:");
    console.error("  - connect_wallet       Connect browser wallet (MetaMask/Rabby)");
    console.error("  - sign_message         Sign a message with wallet");
    console.error("  - token_swap           Execute token swap on DEX");
    console.error("  - switch_network       Switch blockchain network");
    console.error("  - generic_transaction  Execute generic transaction\n");
    console.error("Examples:");
    console.error("  tsx src/headful-runner.ts connect_wallet");
    console.error("  tsx src/headful-runner.ts token_swap myprofile --networkId=137");
    console.error("  tsx src/headful-runner.ts sign_message --networkId=1\n");
    process.exit(1);
  }

  const scenarioId = args[0];
  const profileId = args[1] || "default-profile";
  let networkId = "1";

  for (const arg of args) {
    if (arg.startsWith("--networkId=")) {
      networkId = arg.split("=")[1];
    }
  }

  return { scenarioId, profileId, networkId };
}

// Main execution
async function main(): Promise<void> {
  const options = parseArgs();
  let runner: HeadfulRunner | null = null;

  process.on("SIGINT", async () => {
    console.log("\n\nShutting down gracefully...");
    if (runner) {
      await runner.cleanup();
    }
    process.exit(0);
  });

  try {
    runner = await HeadfulRunner.create();
    await runner.runScenario(options);

    // Keep the process alive for inspection
    await new Promise(() => {
      console.log("\n💡 Browser is still open. Use Ctrl+C to exit and close browser.");
    });
  } catch (error) {
    if (runner) {
      await runner.cleanup();
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { HeadfulRunner };
