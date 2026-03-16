import { WALLET_ACTION_TIMEOUT_MS, WALLET_DETECTION_TIMEOUT_MS, WALLET_LOG_EVENTS } from "../../../shared/constants.ts";
import { NeedsReviewError } from "../../../shared/errors.ts";
import { WalletKind } from "../../../shared/types.ts";
import type {
  PageHandle,
  WalletConnectionRequest,
  WalletContext,
  WalletController,
  WalletDetection,
  SignMessageRequest,
  SignTypedDataRequest,
  TransactionConfirmRequest,
  WalletDetectionRule
} from "../../../shared/types.ts";

// VERSION-SENSITIVE: MetaMask extension UI changes frequently. These selectors are for current extension version.
// Update these when MetaMask extension changes its UI structure.
const METAMASK_SELECTORS = {
  // Detection signals
  extensionIcon: "[data-testid='app-header-logo']", // version: 10.33+
  extensionIconAlt: ".app-header__logo-container", // fallback for older versions

  // Unlock flow
  unlockPasswordInput: "[type='password']", // version: 10.33+
  unlockPasswordInputAlt: "input[placeholder*='Password']", // fallback
  unlockButton: "button[type='submit']", // in unlock screen context
  unlockButtonAlt: "[data-testid='unlock-submit']", // fallback

  // Connection/approval flow
  connectButton: "button:has-text('Connect')", // version: 10.33+
  connectButtonAlt: "[data-testid='page-container-footer-button-primary']", // fallback in connect dialog
  approveButton: "[data-testid='page-container-footer-button-primary']", // reused for approve
  rejectButton: "[data-testid='page-container-footer-button-secondary']", // reject/cancel
  rejectButtonAlt: "button:has-text('Cancel')", // fallback

  // Network switching
  networkMenu: "[data-testid='network-display']", // network selector button
  networkMenuAlt: ".network-display", // fallback
  networkItem: "[data-testid='network-item-{chainId}']", // template: {chainId} replaced at runtime
  networkItemAlt: "text={chainName}", // fallback: network by name

  // Transaction confirmation
  confirmButton: "[data-testid='page-container-footer-button-primary']", // in tx confirmation
  confirmButtonAlt: "button:has-text('Confirm')", // fallback

  // Banners and warnings (to close)
  banner: "[data-testid='global-banner']", // info/warning banner
  bannerClose: "[data-testid='global-banner-close']", // close button on banner
  warningBanner: ".warning-banner", // warning banner fallback
  warningBannerClose: ".warning-banner__close", // close warning banner fallback

  // Popup detection
  popupWindow: "[data-testid='app-content-wrapper']", // main MetaMask UI
  popupWindowAlt: ".app-content-wrapper", // fallback

  // Message signing
  signatureRequest: "[data-testid='signature-request']", // sign message popup
  signatureRequestAlt: ".signature-request", // fallback

  // Error states
  errorMessage: "[data-testid='error-page-container']",
  errorMessageAlt: ".error-container"
} as const;

// Helper type for selector fallback chain
type SelectorChain = readonly string[];

export class MetaMaskController implements WalletController {
  kind = WalletKind.MetaMask;

  async detect(page: PageHandle, context: WalletContext): Promise<WalletDetection | null> {
    context.logger.info(WALLET_LOG_EVENTS.detectStart, "metamask detect start", {
      kind: this.kind
    });

    const detectedSignals: string[] = [];
    let bestConfidence = 0;
    let matchedRule: WalletDetectionRule | undefined;

    // Signal 1: Check for extension icon
    const iconRule: WalletDetectionRule = {
      name: "extension_icon_visible",
      signal: "MetaMask extension UI present",
      confidence: 0.9
    };
    if (await this.tryLocator(page, [METAMASK_SELECTORS.extensionIcon, METAMASK_SELECTORS.extensionIconAlt], context.timeoutMs)) {
      detectedSignals.push(iconRule.signal);
      bestConfidence = iconRule.confidence;
      matchedRule = iconRule;
    }

    // Signal 2: Check for common wallet UI elements
    const uiRule: WalletDetectionRule = {
      name: "wallet_ui_elements",
      signal: "MetaMask wallet UI detected",
      confidence: 0.75
    };
    if (await this.tryLocator(page, [METAMASK_SELECTORS.popupWindow, METAMASK_SELECTORS.popupWindowAlt], context.timeoutMs)) {
      detectedSignals.push(uiRule.signal);
      if (uiRule.confidence > bestConfidence) {
        bestConfidence = uiRule.confidence;
        matchedRule = uiRule;
      }
    }

    if (bestConfidence > 0) {
      const detection: WalletDetection = {
        kind: this.kind,
        confidence: bestConfidence,
        reason: "MetaMask extension detected via multiple signals",
        matchedRule,
        metadata: {
          detectedSignals,
          selectors: [
            { name: "extensionIcon", versions: [10, 11] },
            { name: "popupWindow", versions: [10, 11] }
          ]
        }
      };
      context.logger.info(WALLET_LOG_EVENTS.detectSuccess, "metamask detect success", detection);
      return detection;
    }

    context.logger.warn(WALLET_LOG_EVENTS.detectFailure, "metamask not visible", {
      kind: this.kind,
      attemptedSignals: detectedSignals
    });
    return null;
  }

  async unlock(page: PageHandle, password: string, context: WalletContext): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.unlockStart, "metamask unlock start", {
      kind: this.kind
    });

    try {
      // Close any banners first
      await this.closeBanners(page, context);

      // Fill password
      await this.fillInput(
        page,
        [METAMASK_SELECTORS.unlockPasswordInput, METAMASK_SELECTORS.unlockPasswordInputAlt],
        password,
        context.timeoutMs,
        "password input"
      );

      // Click unlock button
      await this.clickButton(
        page,
        [METAMASK_SELECTORS.unlockButton, METAMASK_SELECTORS.unlockButtonAlt],
        context.timeoutMs,
        "unlock button"
      );

      context.logger.info(WALLET_LOG_EVENTS.unlockSuccess, "metamask unlock success", {
        kind: this.kind
      });
    } catch (error) {
      context.logger.error(WALLET_LOG_EVENTS.unlockFailure, "metamask unlock error", {
        kind: this.kind,
        error: String(error)
      });
      throw new NeedsReviewError(`MetaMask unlock failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async connect(page: PageHandle, context: WalletContext): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.connectStart, "metamask connect start", {
      kind: this.kind
    });

    try {
      // Close any banners first
      await this.closeBanners(page, context);

      // Click connect button
      await this.clickButton(
        page,
        [METAMASK_SELECTORS.connectButton, METAMASK_SELECTORS.connectButtonAlt],
        context.timeoutMs,
        "connect button"
      );

      // Wait a moment for popup to transition
      await page.waitForTimeout(500);

      // Click approve button
      await this.clickButton(
        page,
        [METAMASK_SELECTORS.approveButton],
        context.timeoutMs,
        "approve button"
      );

      context.logger.info(WALLET_LOG_EVENTS.connectSuccess, "metamask connect success", {
        kind: this.kind
      });
    } catch (error) {
      context.logger.error(WALLET_LOG_EVENTS.connectFailure, "metamask connect error", {
        kind: this.kind,
        error: String(error)
      });
      throw new NeedsReviewError(`MetaMask connect failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async ensureNetwork(
    page: PageHandle,
    request: WalletConnectionRequest,
    context: WalletContext
  ): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.networkStart, "metamask network start", {
      kind: this.kind,
      chainId: request.chainId
    });

    try {
      // Close any banners first
      await this.closeBanners(page, context);

      // Click network menu
      await this.clickButton(
        page,
        [METAMASK_SELECTORS.networkMenu, METAMASK_SELECTORS.networkMenuAlt],
        context.timeoutMs,
        "network menu"
      );

      // Wait for menu to appear
      await page.waitForTimeout(300);

      // Build selector for network item (replace template)
      const networkSelector = METAMASK_SELECTORS.networkItem.replace("{chainId}", String(request.chainId));

      // Click network item with fallback
      await this.clickButton(
        page,
        [networkSelector, METAMASK_SELECTORS.networkItemAlt],
        context.timeoutMs,
        `network item for chain ${request.chainId}`
      );

      context.logger.info(WALLET_LOG_EVENTS.networkSuccess, "metamask network success", {
        kind: this.kind,
        chainId: request.chainId
      });
    } catch (error) {
      context.logger.error(WALLET_LOG_EVENTS.networkFailure, "metamask network error", {
        kind: this.kind,
        chainId: request.chainId,
        error: String(error)
      });
      throw new NeedsReviewError(`MetaMask network switch failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async signMessage(page: PageHandle, request: SignMessageRequest, context: WalletContext): Promise<void> {
    context.logger.info("wallet_sign_message_start", "metamask sign message start", {
      kind: this.kind,
      messageLength: request.message.length
    });

    try {
      // Close any banners first
      await this.closeBanners(page, context);

      // Wait for signature request popup
      await this.waitForElement(
        page,
        [METAMASK_SELECTORS.signatureRequest, METAMASK_SELECTORS.signatureRequestAlt],
        context.timeoutMs,
        "signature request popup"
      );

      // Click confirm/sign button
      await this.clickButton(
        page,
        [METAMASK_SELECTORS.confirmButton, METAMASK_SELECTORS.confirmButtonAlt],
        context.timeoutMs,
        "sign/confirm button"
      );

      context.logger.info("wallet_sign_message_success", "metamask sign message success", {
        kind: this.kind
      });
    } catch (error) {
      context.logger.error("wallet_sign_message_error", "metamask sign message error", {
        kind: this.kind,
        error: String(error)
      });
      throw new NeedsReviewError(`MetaMask sign message failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async signTypedData(page: PageHandle, request: SignTypedDataRequest, context: WalletContext): Promise<void> {
    context.logger.info("wallet_sign_typed_data_start", "metamask sign typed data start", {
      kind: this.kind,
      primaryType: request.primaryType
    });

    try {
      // Close any banners first
      await this.closeBanners(page, context);

      // Wait for signature request popup
      await this.waitForElement(
        page,
        [METAMASK_SELECTORS.signatureRequest, METAMASK_SELECTORS.signatureRequestAlt],
        context.timeoutMs,
        "typed data signature request popup"
      );

      // Click confirm/sign button
      await this.clickButton(
        page,
        [METAMASK_SELECTORS.confirmButton, METAMASK_SELECTORS.confirmButtonAlt],
        context.timeoutMs,
        "sign typed data/confirm button"
      );

      context.logger.info("wallet_sign_typed_data_success", "metamask sign typed data success", {
        kind: this.kind
      });
    } catch (error) {
      context.logger.error("wallet_sign_typed_data_error", "metamask sign typed data error", {
        kind: this.kind,
        error: String(error)
      });
      throw new NeedsReviewError(`MetaMask sign typed data failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async confirmTransaction(page: PageHandle, request: TransactionConfirmRequest, context: WalletContext): Promise<void> {
    context.logger.info("wallet_confirm_tx_start", "metamask confirm transaction start", {
      kind: this.kind,
      method: request.method
    });

    try {
      // Close any banners first
      await this.closeBanners(page, context);

      // Different handling based on method type
      if (request.method === "eth_sign" || request.method === "personal_sign") {
        // Sign request popup
        await this.waitForElement(
          page,
          [METAMASK_SELECTORS.signatureRequest, METAMASK_SELECTORS.signatureRequestAlt],
          context.timeoutMs,
          "signature request for tx"
        );
      }

      // Click confirm/approve button
      await this.clickButton(
        page,
        [METAMASK_SELECTORS.confirmButton, METAMASK_SELECTORS.approveButton],
        context.timeoutMs,
        "transaction confirm button"
      );

      context.logger.info("wallet_confirm_tx_success", "metamask confirm transaction success", {
        kind: this.kind,
        method: request.method
      });
    } catch (error) {
      context.logger.error("wallet_confirm_tx_error", "metamask confirm transaction error", {
        kind: this.kind,
        method: request.method,
        error: String(error)
      });
      throw new NeedsReviewError(`MetaMask transaction confirmation failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async approve(page: PageHandle, context: WalletContext): Promise<void> {
    context.logger.info("wallet_approve_start", "metamask approve start", {
      kind: this.kind
    });

    try {
      // Close any banners first
      await this.closeBanners(page, context);

      // Click approve button
      await this.clickButton(
        page,
        [METAMASK_SELECTORS.approveButton, METAMASK_SELECTORS.confirmButton],
        context.timeoutMs,
        "approve button"
      );

      context.logger.info("wallet_approve_success", "metamask approve success", {
        kind: this.kind
      });
    } catch (error) {
      context.logger.error("wallet_approve_error", "metamask approve error", {
        kind: this.kind,
        error: String(error)
      });
      throw new NeedsReviewError(`MetaMask approve failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async reject(page: PageHandle, context: WalletContext): Promise<void> {
    context.logger.info("wallet_reject_start", "metamask reject start", {
      kind: this.kind
    });

    try {
      // Close any banners first
      await this.closeBanners(page, context);

      // Click reject button
      await this.clickButton(
        page,
        [METAMASK_SELECTORS.rejectButton, METAMASK_SELECTORS.rejectButtonAlt],
        context.timeoutMs,
        "reject button"
      );

      context.logger.info("wallet_reject_success", "metamask reject success", {
        kind: this.kind
      });
    } catch (error) {
      context.logger.error("wallet_reject_error", "metamask reject error", {
        kind: this.kind,
        error: String(error)
      });
      throw new NeedsReviewError(`MetaMask reject failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async handlePopupAuto(page: PageHandle, context: WalletContext): Promise<void> {
    context.logger.info("wallet_handle_popup_auto_start", "metamask handle popup auto start", {
      kind: this.kind
    });

    try {
      // Close any banners first
      await this.closeBanners(page, context);

      // Check if there's a request popup that needs action
      const hasSignRequest = await this.tryLocator(
        page,
        [METAMASK_SELECTORS.signatureRequest, METAMASK_SELECTORS.signatureRequestAlt],
        2000
      );

      if (hasSignRequest) {
        // Auto-approve signature requests
        await this.clickButton(
          page,
          [METAMASK_SELECTORS.confirmButton, METAMASK_SELECTORS.confirmButtonAlt],
          context.timeoutMs,
          "auto confirm signature"
        );
        context.logger.info("wallet_handle_popup_auto_success", "metamask auto-confirmed signature", {
          kind: this.kind
        });
      } else {
        context.logger.info("wallet_handle_popup_auto_success", "metamask no pending popups", {
          kind: this.kind
        });
      }
    } catch (error) {
      context.logger.warn("wallet_handle_popup_auto_warn", "metamask handle popup auto warning", {
        kind: this.kind,
        error: String(error)
      });
      // Not throwing - this is best-effort
    }
  }

  // ===== Helper methods =====

  private async closeBanners(page: PageHandle, context: WalletContext): Promise<void> {
    try {
      const hasBanner = await this.tryLocator(page, [METAMASK_SELECTORS.banner, METAMASK_SELECTORS.warningBanner], 1000);
      if (hasBanner) {
        await this.clickButton(
          page,
          [METAMASK_SELECTORS.bannerClose, METAMASK_SELECTORS.warningBannerClose],
          2000,
          "banner close"
        );
        context.logger.debug("wallet_banner_closed", "Closed MetaMask banner", { kind: this.kind });
      }
    } catch (_error) {
      // Banner close is best-effort, ignore errors
    }
  }

  private async fillInput(
    page: PageHandle,
    selectors: SelectorChain,
    value: string,
    timeoutMs?: number,
    description = "input"
  ): Promise<void> {
    for (const selector of selectors) {
      try {
        const locator = page.locator(selector);
        if (await locator.isVisible({ timeout: timeoutMs ?? WALLET_ACTION_TIMEOUT_MS })) {
          await locator.fill(value, { timeout: timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
          return;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    throw new Error(`Could not fill ${description}: no visible selector found`);
  }

  private async clickButton(
    page: PageHandle,
    selectors: SelectorChain,
    timeoutMs?: number,
    description = "button"
  ): Promise<void> {
    for (const selector of selectors) {
      try {
        const locator = page.locator(selector);
        if (await locator.isVisible({ timeout: timeoutMs ?? WALLET_ACTION_TIMEOUT_MS })) {
          await locator.click({ timeout: timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
          return;
        }
      } catch (_error) {
        // Continue to next selector
      }
    }
    throw new Error(`Could not click ${description}: no visible selector found`);
  }

  private async tryLocator(
    page: PageHandle,
    selectors: SelectorChain,
    timeoutMs?: number
  ): Promise<boolean> {
    for (const selector of selectors) {
      try {
        if (await page.locator(selector).isVisible({ timeout: timeoutMs ?? 1000 })) {
          return true;
        }
      } catch (_error) {
        // Continue
      }
    }
    return false;
  }

  private async waitForElement(
    page: PageHandle,
    selectors: SelectorChain,
    timeoutMs?: number,
    description = "element"
  ): Promise<void> {
    let lastError: Error | null = null;
    for (const selector of selectors) {
      try {
        await page.locator(selector).isVisible({ timeout: timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
        return;
      } catch (error) {
        lastError = error as Error;
        // Continue to next selector
      }
    }
    throw new Error(`Could not find ${description}: ${lastError?.message}`);
  }
}
