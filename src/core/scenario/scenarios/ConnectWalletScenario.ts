import type { Scenario, ScenarioContext } from "../../../shared/types.ts";
import { ScenarioUtils } from "../ScenarioUtils.ts";
import { NeedsReviewError } from "../../../shared/errors.ts";

const DAPP_BUTTON_SELECTORS = {
  connect: "button:has-text('Connect'), button:has-text('Connect Wallet')",
  sign: "button:has-text('Sign'), button:has-text('Sign Message')"
};

/**
 * ConnectWallet Scenario
 * Connects a dApp to a wallet extension
 *
 * Flow:
 * 1. Navigate to dApp URL
 * 2. Wait for page load
 * 3. Find and click Connect button
 * 4. Wait for wallet popup
 * 5. Use wallet controller to approve connection
 * 6. Verify connection succeeded
 */
export const ConnectWalletScenario: Scenario = {
  id: "connect_wallet",
  title: "Connect Wallet to dApp",

  async run(context: ScenarioContext): Promise<void> {
    const { page, logger, artifacts, run, wallet, options } = context;

    if (!wallet) {
      throw new NeedsReviewError("Wallet manager not provided to scenario", "wallet_unknown_state");
    }

    try {
      logger.info("scenario_start", "connect_wallet started", {
        runId: run.id,
        dappUrl: options?.dappUrl
      });

      // Step 1: Navigate to dApp
      const dappUrl = options?.dappUrl || "about:blank";
      logger.debug("navigate", "Navigating to dApp", { dappUrl });
      try {
        await page.goto(dappUrl, {
          timeout: 30000,
          waitUntil: "networkidle"
        });
      } catch (error) {
        await artifacts.captureScreenshot(page, run.id, "navigate-failed");
        throw new NeedsReviewError(`Navigation failed: ${error}`, "wallet_unknown_state");
      }

      // Step 2: Verify page loaded
      logger.debug("verify_load", "Verifying dApp loaded", {});
      try {
        await ScenarioUtils.verifyPageLoaded(page, logger, ["body"], 10000);
      } catch (error) {
        await artifacts.captureScreenshot(page, run.id, "page-not-loaded");
        throw new NeedsReviewError(`dApp did not load: ${error}`, "wallet_unknown_state");
      }

      // Step 3: Find Connect button
      logger.debug("find_connect", "Looking for connect button", {});
      let connectSelector: string;
      try {
        connectSelector = await ScenarioUtils.waitForAnyElement(
          page,
          [DAPP_BUTTON_SELECTORS.connect, "button"],
          5000,
          logger
        );
      } catch (error) {
        await artifacts.captureScreenshot(page, run.id, "connect-button-not-found");
        throw new NeedsReviewError(`Connect button not found: ${error}`, "ui_element_missing");
      }

      // Step 4: Click Connect button
      logger.debug("click_connect", "Clicking connect button", { selector: connectSelector });
      try {
        await ScenarioUtils.clickAndWait(page, connectSelector, undefined, 2000);
      } catch (error) {
        await artifacts.captureScreenshot(page, run.id, "connect-click-failed");
        throw new NeedsReviewError(`Failed to click connect: ${error}`, "wallet_unknown_state");
      }

      // Step 5: Wait for wallet popup
      logger.debug("wait_popup", "Waiting for wallet popup", {});
      try {
        await ScenarioUtils.waitForWalletPopup(page, 5000);
      } catch (error) {
        await artifacts.captureScreenshot(page, run.id, "wallet-popup-timeout");
        throw new NeedsReviewError(`Wallet popup did not appear: ${error}`, "wallet_popup_missing");
      }

      // Step 6: Let wallet approve connection
      logger.debug("wallet_approve", "Letting wallet approve connection", {});
      try {
        await wallet.connect(page);
      } catch (error) {
        await artifacts.captureScreenshot(page, run.id, "wallet-approve-failed");
        throw error;
      }

      // Step 7: Capture success state
      logger.debug("capture_success", "Capturing success state", {});
      await artifacts.captureScreenshot(page, run.id, "connected");

      logger.info("scenario_complete", "connect_wallet completed successfully", {
        runId: run.id
      });
    } catch (error) {
      if (error instanceof NeedsReviewError) {
        throw error;
      }
      throw new NeedsReviewError(`Unexpected error in connect_wallet: ${error}`, "wallet_unknown_state", error);
    }
  }
};
