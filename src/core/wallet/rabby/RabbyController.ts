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

// VERSION-SENSITIVE: Rabby wallet UI changes with each extension update. These selectors are for recent versions.
// Rabby UI is more aggressive with pop-ups and security warnings than MetaMask.
// Update these when Rabby extension changes its UI structure.
const RABBY_SELECTORS = {
  // Detection signals
  extensionIcon: "[data-testid='rabby-logo']", // version: 1.25+
  extensionIconAlt: ".rabby-logo", // fallback for older versions
  extensionTitle: "text=Rabby", // fallback via text content

  // Unlock flow (Rabby stores are often unlocked differently)
  unlockPasswordInput: "input[type='password']", // generic password input
  unlockPasswordInputAlt: "[placeholder*='password' i]", // case-insensitive fallback
  unlockButton: "button:has-text('Unlock')", // Rabby uses "Unlock" text
  unlockButtonAlt: "[data-testid='unlock-btn']", // fallback

  // Connection/approval flow (Rabby has aggressive approval UI)
  connectButton: "button:has-text('Connect')", // version: 1.25+
  connectButtonAlt: "[data-testid='connect-btn']", // fallback
  approveButton: "button:has-text('Approve')", // Rabby often says "Approve"
  approveButtonAlt: "[data-testid='approve-btn']", // fallback
  rejectButton: "button:has-text('Reject')", // Rabby explicit reject
  rejectButtonAlt: "[data-testid='reject-btn']", // fallback
  cancelButton: "button:has-text('Cancel')", // fallback to cancel

  // Network switching (Rabby has different network UI)
  networkMenu: "[data-testid='network-selector']", // network dropdown
  networkMenuAlt: ".network-selector", // fallback
  networkItem: "[data-testid='network-item-{chainId}']", // template: {chainId} replaced
  networkItemAlt: "text={chainName}", // fallback: network by name

  // Transaction confirmation
  confirmButton: "button:has-text('Confirm')", // generic confirm
  confirmButtonAlt: "[data-testid='confirm-btn']", // fallback

  // Rabby-specific: Security warnings and pop-ups
  securityWarning: "[data-testid='security-warning']", // security warning popup
  securityWarningAlt: ".security-warning-popup", // fallback
  securityWarningClose: "button:has-text('I Understand')", // acknowledge warning
  securityWarningCloseAlt: "[data-testid='security-warning-close']", // fallback

  // Rabby-specific: Account selection
  accountSelector: "[data-testid='account-selector']", // select account for signing
  accountItem: "[data-testid='account-item-{index}']", // template: {index} replaced

  // Banners (Rabby has info/warning banners like MetaMask)
  banner: "[data-testid='info-banner']", // info banner
  bannerClose: "[data-testid='banner-close']", // close button
  warningBanner: ".warning-banner", // warning banner fallback
  warningBannerClose: ".warning-banner__close", // close warning banner

  // Popup detection
  popupWindow: "[data-testid='rabby-container']", // main Rabby UI
  popupWindowAlt: ".rabby-container", // fallback

  // Message signing (Rabby has specific signing UI)
  signatureRequest: "[data-testid='message-signing-request']", // sign message popup
  signatureRequestAlt: ".message-signing-popup", // fallback
  typedDataSignature: "[data-testid='typed-data-signing']", // typed data signing
  typedDataSignatureAlt: ".typed-data-popup", // fallback

  // Error states
  errorMessage: "[data-testid='error-popup']",
  errorMessageAlt: ".error-popup"
} as const;

// Helper type for selector fallback chain
type SelectorChain = readonly string[];

export class RabbyController implements WalletController {
  kind = WalletKind.Rabby;

  async detect(page: PageHandle, context: WalletContext): Promise<WalletDetection | null> {
    context.logger.info(WALLET_LOG_EVENTS.detectStart, "rabby detect start", {
      kind: this.kind
    });

    const detectedSignals: string[] = [];
    let bestConfidence = 0;
    let matchedRule: WalletDetectionRule | undefined;

    // Signal 1: Check for Rabby extension icon/logo
    const iconRule: WalletDetectionRule = {
      name: "extension_icon_visible",
      signal: "Rabby extension UI present",
      confidence: 0.92
    };
    if (await this.tryLocator(page, [RABBY_SELECTORS.extensionIcon, RABBY_SELECTORS.extensionIconAlt, RABBY_SELECTORS.extensionTitle], context.timeoutMs)) {
      detectedSignals.push(iconRule.signal);
      bestConfidence = iconRule.confidence;
      matchedRule = iconRule;
    }

    // Signal 2: Check for Rabby wallet UI container
    const uiRule: WalletDetectionRule = {
      name: "wallet_ui_elements",
      signal: "Rabby wallet UI detected",
      confidence: 0.8
    };
    if (await this.tryLocator(page, [RABBY_SELECTORS.popupWindow, RABBY_SELECTORS.popupWindowAlt], context.timeoutMs)) {
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
        reason: "Rabby extension detected via multiple signals",
        matchedRule,
        metadata: {
          detectedSignals,
          selectors: [
            { name: "extensionIcon", versions: [1, 2] },
            { name: "popupWindow", versions: [1, 2] }
          ]
        }
      };
      context.logger.info(WALLET_LOG_EVENTS.detectSuccess, "rabby detect success", detection);
      return detection;
    }

    context.logger.warn(WALLET_LOG_EVENTS.detectFailure, "rabby not visible", {
      kind: this.kind,
      attemptedSignals: detectedSignals
    });
    return null;
  }

  async unlock(page: PageHandle, password: string, context: WalletContext): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.unlockStart, "rabby unlock start", {
      kind: this.kind
    });

    try {
      // Close security warnings if present
      await this.closeSecurityWarnings(page, context);
      await this.closeBanners(page, context);

      // Fill password
      await this.fillInput(
        page,
        [RABBY_SELECTORS.unlockPasswordInput, RABBY_SELECTORS.unlockPasswordInputAlt],
        password,
        context.timeoutMs,
        "password input"
      );

      // Click unlock button
      await this.clickButton(
        page,
        [RABBY_SELECTORS.unlockButton, RABBY_SELECTORS.unlockButtonAlt],
        context.timeoutMs,
        "unlock button"
      );

      context.logger.info(WALLET_LOG_EVENTS.unlockSuccess, "rabby unlock success", {
        kind: this.kind
      });
    } catch (error) {
      context.logger.error(WALLET_LOG_EVENTS.unlockFailure, "rabby unlock error", {
        kind: this.kind,
        error: String(error)
      });
      throw new NeedsReviewError(`Rabby unlock failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async connect(page: PageHandle, context: WalletContext): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.connectStart, "rabby connect start", {
      kind: this.kind
    });

    try {
      // Close security warnings if present
      await this.closeSecurityWarnings(page, context);
      await this.closeBanners(page, context);

      // Click connect button
      await this.clickButton(
        page,
        [RABBY_SELECTORS.connectButton, RABBY_SELECTORS.connectButtonAlt],
        context.timeoutMs,
        "connect button"
      );

      // Wait for UI transition
      await page.waitForTimeout(500);

      // Close any new security warnings that appear
      await this.closeSecurityWarnings(page, context);

      // Click approve button
      await this.clickButton(
        page,
        [RABBY_SELECTORS.approveButton, RABBY_SELECTORS.approveButtonAlt],
        context.timeoutMs,
        "approve button"
      );

      context.logger.info(WALLET_LOG_EVENTS.connectSuccess, "rabby connect success", {
        kind: this.kind
      });
    } catch (error) {
      context.logger.error(WALLET_LOG_EVENTS.connectFailure, "rabby connect error", {
        kind: this.kind,
        error: String(error)
      });
      throw new NeedsReviewError(`Rabby connect failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async ensureNetwork(
    page: PageHandle,
    request: WalletConnectionRequest,
    context: WalletContext
  ): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.networkStart, "rabby network start", {
      kind: this.kind,
      chainId: request.chainId
    });

    try {
      // Close security warnings
      await this.closeSecurityWarnings(page, context);
      await this.closeBanners(page, context);

      // Click network menu
      await this.clickButton(
        page,
        [RABBY_SELECTORS.networkMenu, RABBY_SELECTORS.networkMenuAlt],
        context.timeoutMs,
        "network menu"
      );

      // Wait for menu to appear
      await page.waitForTimeout(300);

      // Build selector for network item
      const networkSelector = RABBY_SELECTORS.networkItem.replace("{chainId}", String(request.chainId));

      // Click network item with fallback
      await this.clickButton(
        page,
        [networkSelector, RABBY_SELECTORS.networkItemAlt],
        context.timeoutMs,
        `network item for chain ${request.chainId}`
      );

      context.logger.info(WALLET_LOG_EVENTS.networkSuccess, "rabby network success", {
        kind: this.kind,
        chainId: request.chainId
      });
    } catch (error) {
      context.logger.error(WALLET_LOG_EVENTS.networkFailure, "rabby network error", {
        kind: this.kind,
        chainId: request.chainId,
        error: String(error)
      });
      throw new NeedsReviewError(`Rabby network switch failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async signMessage(page: PageHandle, request: SignMessageRequest, context: WalletContext): Promise<void> {
    context.logger.info("wallet_sign_message_start", "rabby sign message start", {
      kind: this.kind,
      messageLength: request.message.length
    });

    try {
      // Close security warnings first
      await this.closeSecurityWarnings(page, context);
      await this.closeBanners(page, context);

      // Wait for signature request popup
      await this.waitForElement(
        page,
        [RABBY_SELECTORS.signatureRequest, RABBY_SELECTORS.signatureRequestAlt],
        context.timeoutMs,
        "signature request popup"
      );

      // Close any new warnings
      await this.closeSecurityWarnings(page, context);

      // Click confirm button
      await this.clickButton(
        page,
        [RABBY_SELECTORS.confirmButton, RABBY_SELECTORS.approveButton],
        context.timeoutMs,
        "sign/confirm button"
      );

      context.logger.info("wallet_sign_message_success", "rabby sign message success", {
        kind: this.kind
      });
    } catch (error) {
      context.logger.error("wallet_sign_message_error", "rabby sign message error", {
        kind: this.kind,
        error: String(error)
      });
      throw new NeedsReviewError(`Rabby sign message failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async signTypedData(page: PageHandle, request: SignTypedDataRequest, context: WalletContext): Promise<void> {
    context.logger.info("wallet_sign_typed_data_start", "rabby sign typed data start", {
      kind: this.kind,
      primaryType: request.primaryType
    });

    try {
      // Close security warnings
      await this.closeSecurityWarnings(page, context);
      await this.closeBanners(page, context);

      // Wait for typed data signature popup
      await this.waitForElement(
        page,
        [RABBY_SELECTORS.typedDataSignature, RABBY_SELECTORS.typedDataSignatureAlt, RABBY_SELECTORS.signatureRequest],
        context.timeoutMs,
        "typed data signature request popup"
      );

      // Close any new warnings that appeared
      await this.closeSecurityWarnings(page, context);

      // Click confirm button
      await this.clickButton(
        page,
        [RABBY_SELECTORS.confirmButton, RABBY_SELECTORS.approveButton],
        context.timeoutMs,
        "sign typed data/confirm button"
      );

      context.logger.info("wallet_sign_typed_data_success", "rabby sign typed data success", {
        kind: this.kind
      });
    } catch (error) {
      context.logger.error("wallet_sign_typed_data_error", "rabby sign typed data error", {
        kind: this.kind,
        error: String(error)
      });
      throw new NeedsReviewError(`Rabby sign typed data failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async confirmTransaction(page: PageHandle, request: TransactionConfirmRequest, context: WalletContext): Promise<void> {
    context.logger.info("wallet_confirm_tx_start", "rabby confirm transaction start", {
      kind: this.kind,
      method: request.method
    });

    try {
      // Close security warnings
      await this.closeSecurityWarnings(page, context);
      await this.closeBanners(page, context);

      // Handle different transaction types
      if (request.method === "eth_sign" || request.method === "personal_sign") {
        // Sign request popup
        await this.waitForElement(
          page,
          [RABBY_SELECTORS.signatureRequest, RABBY_SELECTORS.signatureRequestAlt],
          context.timeoutMs,
          "signature request for tx"
        );
      }

      // Close any security warnings that appear
      await this.closeSecurityWarnings(page, context);

      // Click confirm button
      await this.clickButton(
        page,
        [RABBY_SELECTORS.confirmButton, RABBY_SELECTORS.approveButton],
        context.timeoutMs,
        "transaction confirm button"
      );

      context.logger.info("wallet_confirm_tx_success", "rabby confirm transaction success", {
        kind: this.kind,
        method: request.method
      });
    } catch (error) {
      context.logger.error("wallet_confirm_tx_error", "rabby confirm transaction error", {
        kind: this.kind,
        method: request.method,
        error: String(error)
      });
      throw new NeedsReviewError(`Rabby transaction confirmation failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async approve(page: PageHandle, context: WalletContext): Promise<void> {
    context.logger.info("wallet_approve_start", "rabby approve start", {
      kind: this.kind
    });

    try {
      // Close security warnings
      await this.closeSecurityWarnings(page, context);
      await this.closeBanners(page, context);

      // Click approve button
      await this.clickButton(
        page,
        [RABBY_SELECTORS.approveButton, RABBY_SELECTORS.confirmButton],
        context.timeoutMs,
        "approve button"
      );

      context.logger.info("wallet_approve_success", "rabby approve success", {
        kind: this.kind
      });
    } catch (error) {
      context.logger.error("wallet_approve_error", "rabby approve error", {
        kind: this.kind,
        error: String(error)
      });
      throw new NeedsReviewError(`Rabby approve failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async reject(page: PageHandle, context: WalletContext): Promise<void> {
    context.logger.info("wallet_reject_start", "rabby reject start", {
      kind: this.kind
    });

    try {
      // Close security warnings
      await this.closeSecurityWarnings(page, context);
      await this.closeBanners(page, context);

      // Click reject button
      await this.clickButton(
        page,
        [RABBY_SELECTORS.rejectButton, RABBY_SELECTORS.rejectButtonAlt, RABBY_SELECTORS.cancelButton],
        context.timeoutMs,
        "reject button"
      );

      context.logger.info("wallet_reject_success", "rabby reject success", {
        kind: this.kind
      });
    } catch (error) {
      context.logger.error("wallet_reject_error", "rabby reject error", {
        kind: this.kind,
        error: String(error)
      });
      throw new NeedsReviewError(`Rabby reject failed: ${error}`, "wallet_unknown_state", error);
    }
  }

  async handlePopupAuto(page: PageHandle, context: WalletContext): Promise<void> {
    context.logger.info("wallet_handle_popup_auto_start", "rabby handle popup auto start", {
      kind: this.kind
    });

    try {
      // Rabby is aggressive with security warnings, so try closing first
      await this.closeSecurityWarnings(page, context);
      await this.closeBanners(page, context);

      // Check for pending requests
      const hasSignRequest = await this.tryLocator(
        page,
        [RABBY_SELECTORS.signatureRequest, RABBY_SELECTORS.signatureRequestAlt],
        2000
      );

      if (hasSignRequest) {
        // Auto-approve signature
        await this.clickButton(
          page,
          [RABBY_SELECTORS.confirmButton, RABBY_SELECTORS.approveButton],
          context.timeoutMs,
          "auto confirm signature"
        );
        context.logger.info("wallet_handle_popup_auto_success", "rabby auto-confirmed signature", {
          kind: this.kind
        });
      } else {
        context.logger.info("wallet_handle_popup_auto_success", "rabby no pending popups", {
          kind: this.kind
        });
      }
    } catch (error) {
      context.logger.warn("wallet_handle_popup_auto_warn", "rabby handle popup auto warning", {
        kind: this.kind,
        error: String(error)
      });
      // Not throwing - this is best-effort
    }
  }

  // ===== Helper methods =====

  private async closeSecurityWarnings(page: PageHandle, context: WalletContext): Promise<void> {
    try {
      const hasWarning = await this.tryLocator(page, [RABBY_SELECTORS.securityWarning, RABBY_SELECTORS.securityWarningAlt], 1000);
      if (hasWarning) {
        // Try to acknowledge/close the warning
        await this.clickButton(
          page,
          [RABBY_SELECTORS.securityWarningClose, RABBY_SELECTORS.securityWarningCloseAlt],
          2000,
          "security warning close"
        );
        context.logger.debug("wallet_security_warning_closed", "Closed Rabby security warning", { kind: this.kind });
      }
    } catch (_error) {
      // Security warning close is best-effort, ignore errors
    }
  }

  private async closeBanners(page: PageHandle, context: WalletContext): Promise<void> {
    try {
      const hasBanner = await this.tryLocator(page, [RABBY_SELECTORS.banner, RABBY_SELECTORS.warningBanner], 1000);
      if (hasBanner) {
        await this.clickButton(
          page,
          [RABBY_SELECTORS.bannerClose, RABBY_SELECTORS.warningBannerClose],
          2000,
          "banner close"
        );
        context.logger.debug("wallet_banner_closed", "Closed Rabby banner", { kind: this.kind });
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
