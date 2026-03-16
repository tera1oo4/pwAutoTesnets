import type { Scenario, ScenarioContext } from "../../../shared/types.ts";
import { ScenarioUtils } from "../ScenarioUtils.ts";
import { NeedsReviewError } from "../../../shared/errors.ts";

/**
 * SwitchNetworkIfNeeded Scenario
 * Ensures wallet is on the correct network, switching if needed
 *
 * Flow:
 * 1. Connect wallet
 * 2. Check current network
 * 3. If not target network, trigger network switch in wallet
 * 4. Wait for wallet popup
 * 5. Use wallet controller to confirm network switch
 * 6. Verify network switched
 */
export const SwitchNetworkIfNeededScenario: Scenario = {
  id: "switch_network_if_needed",
  title: "Switch Network If Needed",

  async run(context: ScenarioContext): Promise<void> {
    const { page, logger, artifacts, run, wallet, options } = context;

    if (!wallet) {
      throw new NeedsReviewError("Wallet manager not provided to scenario", "wallet_unknown_state");
    }

    try {
      logger.info("scenario_start", "switch_network_if_needed started", {
        runId: run.id,
        targetChainId: options?.dappUrl
      });

      // Default to Ethereum mainnet (chainId 1)
      const targetChainId = 1;

      // Phase 1: Connect wallet if needed
      logger.debug("phase_connect", "Phase 1: Ensuring wallet is connected", {});

      const dappUrl = options?.dappUrl || "https://example.com";
      await page.goto(dappUrl, {
        timeout: 30000,
        waitUntil: "networkidle"
      });

      await ScenarioUtils.verifyPageLoaded(page, logger, ["body"], 10000);

      // Try to find connect button
      let needsConnection = true;
      try {
        const connectBtn = await ScenarioUtils.waitForAnyElement(
          page,
          ["button:has-text('Connect')", "button:has-text('Connect Wallet')"],
          2000,
          logger
        );

        if (connectBtn) {
          logger.debug("connect_found", "Connect button found, connecting wallet", {});
          await ScenarioUtils.clickAndWait(page, connectBtn, undefined, 2000);

          // Wait for wallet popup
          await ScenarioUtils.waitForWalletPopup(page, 5000);

          // Approve connection
          try {
            await wallet.connect(page);
            needsConnection = false;
          } catch (error) {
            await artifacts.captureScreenshot(page, run.id, "connect-failed");
            throw error;
          }

          await page.waitForTimeout(1000);
        }
      } catch (error) {
        // Connect button not found - wallet may already be connected
        logger.debug("no_connect_button", "No connect button found - wallet already connected", {});
        needsConnection = false;
      }

      // Phase 2: Switch network if needed
      logger.debug("phase_network", "Phase 2: Checking and switching network", {
        targetChainId
      });

      try {
        logger.debug("switch_network", "Requesting network switch", { targetChainId });
        await wallet.ensureNetwork(page, { chainId: targetChainId });

        logger.debug("network_switch_complete", "Network switch completed", {
          targetChainId
        });
      } catch (error) {
        await artifacts.captureScreenshot(page, run.id, "network-switch-failed");
        throw error;
      }

      // Wait for network switch to settle
      await page.waitForTimeout(1500);

      // Capture final state
      logger.debug("capture_final", "Capturing final state", {});
      await artifacts.captureScreenshot(page, run.id, "network-switched");

      logger.info("scenario_complete", "switch_network_if_needed completed successfully", {
        runId: run.id,
        targetChainId,
        walletConnected: needsConnection
      });
    } catch (error) {
      if (error instanceof NeedsReviewError) {
        throw error;
      }
      throw new NeedsReviewError(`Unexpected error in switch_network_if_needed: ${error}`, "wallet_unknown_state", error);
    }
  }
};
