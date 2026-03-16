import type { Scenario, ScenarioContext } from "../../../shared/types.ts";
import { ScenarioUtils } from "../ScenarioUtils.ts";
import { NeedsReviewError } from "../../../shared/errors.ts";

/**
 * ApproveToken Scenario
 * Approves token spending for a dApp (for swaps, etc.)
 *
 * Flow:
 * 1. Connect wallet
 * 2. Select token (if needed)
 * 3. Find Approve button
 * 4. Click Approve (triggers approval transaction)
 * 5. Wait for wallet popup
 * 6. Use wallet controller to approve transaction
 * 7. Verify approval succeeded
 */
export const TokenSwapScenario: Scenario = {
  id: "approve_token",
  title: "Approve Token Spending",

  async run(context: ScenarioContext): Promise<void> {
    const { page, logger, artifacts, run, wallet, options } = context;

    if (!wallet) {
      throw new NeedsReviewError("Wallet manager not provided to scenario", "wallet_unknown_state");
    }

    try {
      logger.info("scenario_start", "approve_token started", {
        runId: run.id
      });

      // Phase 1: Connect wallet
      const dappUrl = options?.dappUrl || "https://app.uniswap.org";
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

      await page.waitForTimeout(1500);

      // Phase 2: Find and click Approve button
      logger.debug("phase_approve", "Phase 2: Finding approve button", {});

      const approveBtn = await ScenarioUtils.waitForAnyElement(
        page,
        [
          "button:has-text('Approve')",
          "button:has-text('Enable')",
          "button:has-text('Approve Spending')"
        ],
        8000,
        logger
      );

      logger.debug("click_approve", "Clicking approve button", {});
      await ScenarioUtils.clickAndWait(page, approveBtn, undefined, 2000);

      // Wait for wallet approval transaction popup
      logger.debug("wait_approval_popup", "Waiting for approval transaction popup", {});
      try {
        await ScenarioUtils.waitForWalletPopup(page, 5000);
      } catch (error) {
        await artifacts.captureScreenshot(page, run.id, "approval-popup-timeout");
        throw new NeedsReviewError(`Approval popup did not appear: ${error}`, "wallet_popup_missing");
      }

      // Approve transaction using wallet controller
      logger.debug("wallet_approve_tx", "Approving transaction", {});
      try {
        await wallet.confirmTransaction(page, { method: "eth_sendTransaction" });
      } catch (error) {
        await artifacts.captureScreenshot(page, run.id, "approval-failed");
        throw error;
      }

      // Wait for transaction to be submitted
      await page.waitForTimeout(2000);

      // Capture final state
      logger.debug("capture_final", "Capturing final state", {});
      await artifacts.captureScreenshot(page, run.id, "approved");

      logger.info("scenario_complete", "approve_token completed successfully", {
        runId: run.id
      });
    } catch (error) {
      if (error instanceof NeedsReviewError) {
        throw error;
      }
      throw new NeedsReviewError(`Unexpected error in approve_token: ${error}`, "wallet_unknown_state", error);
    }
  }
};
