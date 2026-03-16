import type { Scenario, ScenarioContext } from "../../../shared/types.ts";
import { ScenarioUtils } from "../ScenarioUtils.ts";
import { NeedsReviewError } from "../../../shared/errors.ts";

/**
 * ConnectAndSignMessage Scenario
 * Connects to wallet and signs a message
 *
 * Flow:
 * 1. Connect wallet (via ConnectWallet flow)
 * 2. Find Sign Message button on dApp
 * 3. Click button (triggers personal_sign or eth_sign)
 * 4. Wait for wallet popup
 * 5. Use wallet controller to sign message
 * 6. Verify signature on page
 */
export const SignMessageScenario: Scenario = {
  id: "connect_and_sign_message",
  title: "Connect Wallet and Sign Message",

  async run(context: ScenarioContext): Promise<void> {
    const { page, logger, artifacts, run, wallet, options } = context;

    if (!wallet) {
      throw new NeedsReviewError("Wallet manager not provided to scenario", "wallet_unknown_state");
    }

    try {
      logger.info("scenario_start", "connect_and_sign_message started", {
        runId: run.id
      });

      // Phase 1: Connect wallet
      const dappUrl = options?.dappUrl || "https://example.com";
      logger.debug("phase_connect", "Phase 1: Connecting wallet", {});

      await page.goto(dappUrl, {
        timeout: 30000,
        waitUntil: "networkidle"
      });

      await ScenarioUtils.verifyPageLoaded(page, logger, ["body"], 10000);

      // Find and click Connect button
      const connectBtn = await ScenarioUtils.waitForAnyElement(
        page,
        ["button:has-text('Connect')", "button:has-text('Connect Wallet')"],
        5000,
        logger
      );

      await ScenarioUtils.clickAndWait(page, connectBtn, undefined, 2000);

      // Wait for wallet popup
      await ScenarioUtils.waitForWalletPopup(page, 5000);

      // Approve connection
      logger.debug("wallet_connect", "Approving wallet connection", {});
      try {
        await wallet.connect(page);
      } catch (error) {
        await artifacts.captureScreenshot(page, run.id, "connect-failed");
        throw error;
      }

      // Wait for connection to settle
      await page.waitForTimeout(1000);

      // Phase 2: Sign message
      logger.debug("phase_sign", "Phase 2: Signing message", {});

      // Find Sign Message button
      const signBtn = await ScenarioUtils.waitForAnyElement(
        page,
        ["button:has-text('Sign')", "button:has-text('Sign Message')"],
        5000,
        logger
      );

      await ScenarioUtils.clickAndWait(page, signBtn, undefined, 2000);

      // Wait for wallet signature request popup
      logger.debug("wait_signature_popup", "Waiting for signature popup", {});
      try {
        await ScenarioUtils.waitForWalletPopup(page, 5000);
      } catch (error) {
        await artifacts.captureScreenshot(page, run.id, "signature-popup-timeout");
        throw new NeedsReviewError(`Signature popup did not appear: ${error}`, "wallet_popup_missing");
      }

      // Sign message using wallet controller
      logger.debug("sign_message", "Signing message", {});
      try {
        await wallet.signMessage(page, { message: "Test message from PlaywrightAutomation" });
      } catch (error) {
        await artifacts.captureScreenshot(page, run.id, "sign-failed");
        throw error;
      }

      // Wait for popup to close and signature to be processed
      await page.waitForTimeout(1000);

      // Capture final state
      logger.debug("capture_final", "Capturing final state", {});
      await artifacts.captureScreenshot(page, run.id, "signed");

      logger.info("scenario_complete", "connect_and_sign_message completed successfully", {
        runId: run.id
      });
    } catch (error) {
      if (error instanceof NeedsReviewError) {
        throw error;
      }
      throw new NeedsReviewError(`Unexpected error in connect_and_sign_message: ${error}`, "wallet_unknown_state", error);
    }
  }
};
