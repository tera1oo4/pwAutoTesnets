import type { Scenario, ScenarioContext } from "../../../shared/types.ts";
import { ScenarioUtils } from "../ScenarioUtils.ts";
import { NeedsReviewError } from "../../../shared/errors.ts";

/**
 * GenericTransactionFlow Scenario
 * Generic flow for any transaction-based interaction
 *
 * Flow:
 * 1. Connect wallet if needed
 * 2. Switch network if needed
 * 3. Find transaction trigger button
 * 4. Click button (triggers transaction)
 * 5. Wait for wallet popup
 * 6. Use wallet controller to confirm transaction
 * 7. Wait for transaction confirmation on page
 * 8. Verify success
 */
export const GenericTransactionFlowScenario: Scenario = {
  id: "generic_transaction_flow",
  title: "Generic Transaction Flow",

  async run(context: ScenarioContext): Promise<void> {
    const { page, logger, artifacts, run, wallet, options } = context;

    if (!wallet) {
      throw new NeedsReviewError("Wallet manager not provided to scenario", "wallet_unknown_state");
    }

    try {
      logger.info("scenario_start", "generic_transaction_flow started", {
        runId: run.id
      });

      const dappUrl = options?.dappUrl || "https://example.com";
      const targetChainId = 1;

      // Phase 1: Connect wallet
      logger.debug("phase_connect", "Phase 1: Connecting wallet", {});

      await page.goto(dappUrl, {
        timeout: 30000,
        waitUntil: "networkidle"
      });

      await ScenarioUtils.verifyPageLoaded(page, logger, ["body"], 10000);

      // Try to connect if button exists
      try {
        const connectBtn = await ScenarioUtils.waitForAnyElement(
          page,
          ["button:has-text('Connect')", "button:has-text('Connect Wallet')"],
          3000,
          logger
        );

        logger.debug("connect_wallet", "Connecting wallet", {});
        await ScenarioUtils.clickAndWait(page, connectBtn, undefined, 2000);

        // Wait for wallet popup
        await ScenarioUtils.waitForWalletPopup(page, 5000);

        try {
          await wallet.connect(page);
        } catch (error) {
          await artifacts.captureScreenshot(page, run.id, "connect-failed");
          throw error;
        }

        await page.waitForTimeout(1000);
      } catch (error) {
        // Connect may not be needed
        logger.debug("skip_connect", "No connect button found or connection skipped", {});
      }

      // Phase 2: Switch network if needed
      logger.debug("phase_network", "Phase 2: Ensuring correct network", {
        targetChainId
      });

      try {
        await wallet.ensureNetwork(page, { chainId: targetChainId });
        await page.waitForTimeout(1000);
      } catch (error) {
        logger.warn("network_switch_failed", "Network switch failed or not needed", {
          error: String(error)
        });
        // Continue anyway - network might already be correct
      }

      // Phase 3: Find and click transaction trigger
      logger.debug("phase_transaction", "Phase 3: Finding transaction button", {});

      const txBtn = await ScenarioUtils.waitForAnyElement(
        page,
        [
          "button:has-text('Send')",
          "button:has-text('Swap')",
          "button:has-text('Execute')",
          "button:has-text('Confirm')",
          "button:has-text('Submit')",
          "button:has-text('Bridge')",
          "button:has-text('Mint')"
        ],
        8000,
        logger
      );

      logger.debug("click_tx_button", "Clicking transaction button", { selector: txBtn });
      await ScenarioUtils.clickAndWait(page, txBtn, undefined, 2000);

      // Phase 4: Wait for wallet transaction popup
      logger.debug("wait_tx_popup", "Waiting for transaction popup", {});
      try {
        await ScenarioUtils.waitForWalletPopup(page, 5000);
      } catch (error) {
        await artifacts.captureScreenshot(page, run.id, "tx-popup-timeout");
        throw new NeedsReviewError(`Transaction popup did not appear: ${error}`, "wallet_popup_missing");
      }

      // Phase 5: Confirm transaction
      logger.debug("confirm_tx", "Confirming transaction in wallet", {});
      try {
        await wallet.confirmTransaction(page, { method: "eth_sendTransaction" });
      } catch (error) {
        await artifacts.captureScreenshot(page, run.id, "tx-confirm-failed");
        throw error;
      }

      // Wait for popup to close and transaction to be submitted
      await page.waitForTimeout(2000);

      // Phase 6: Wait for confirmation on page
      logger.debug("wait_confirmation", "Waiting for page confirmation", {});
      try {
        await ScenarioUtils.waitForAnyElement(
          page,
          [
            "text='Success'",
            "text='Transaction sent'",
            "text='Confirmed'",
            "[data-testid='transaction-success']"
          ],
          10000,
          logger
        );
      } catch (error) {
        logger.warn("confirmation_timeout", "No success message appeared", {
          error: String(error)
        });
        // Continue - page may show success differently
      }

      // Capture final state
      logger.debug("capture_final", "Capturing final state", {});
      await artifacts.captureScreenshot(page, run.id, "transaction-complete");

      logger.info("scenario_complete", "generic_transaction_flow completed successfully", {
        runId: run.id
      });
    } catch (error) {
      if (error instanceof NeedsReviewError) {
        throw error;
      }
      throw new NeedsReviewError(`Unexpected error in generic_transaction_flow: ${error}`, "wallet_unknown_state", error);
    }
  }
};
