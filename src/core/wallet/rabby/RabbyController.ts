import { WALLET_ACTION_TIMEOUT_MS, WALLET_DETECTION_TIMEOUT_MS, WALLET_LOG_EVENTS } from "../../../shared/constants.ts";
import { NeedsReviewError } from "../../../shared/errors.ts";
import { WalletKind } from "../../../shared/types.ts";
import type {
  PageHandle,
  WalletConnectionRequest,
  WalletContext,
  WalletController,
  WalletDetection
} from "../../../shared/types.ts";

const RABBY_SELECTORS = {
  extensionIcon: "TODO: version-sensitive",
  unlockPasswordInput: "TODO: version-sensitive",
  unlockButton: "TODO: version-sensitive",
  connectButton: "TODO: version-sensitive",
  approveButton: "TODO: version-sensitive",
  networkMenu: "TODO: version-sensitive",
  networkItem: "TODO: version-sensitive"
} as const;

export class RabbyController implements WalletController {
  kind = WalletKind.Rabby;

  async detect(page: PageHandle, context: WalletContext): Promise<WalletDetection | null> {
    context.logger.info(WALLET_LOG_EVENTS.detectStart, "rabby detect start", {
      kind: this.kind
    });
    if (this.isTodoSelector(RABBY_SELECTORS.extensionIcon)) {
      throw new NeedsReviewError("WalletSelectorTodo", "wallet_selector_todo");
    }
    const visible = await page
      .locator(RABBY_SELECTORS.extensionIcon)
      .isVisible({ timeout: context.timeoutMs ?? WALLET_DETECTION_TIMEOUT_MS });
    if (!visible) {
      context.logger.warn(WALLET_LOG_EVENTS.detectFailure, "rabby not visible", {
        kind: this.kind
      });
      return null;
    }
    const detection = { kind: this.kind, confidence: 0.85 };
    context.logger.info(WALLET_LOG_EVENTS.detectSuccess, "rabby detect success", detection);
    return detection;
  }

  async unlock(page: PageHandle, password: string, context: WalletContext): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.unlockStart, "rabby unlock start", {
      kind: this.kind
    });
    this.assertSelectorReady(RABBY_SELECTORS.unlockPasswordInput);
    this.assertSelectorReady(RABBY_SELECTORS.unlockButton);
    await page
      .locator(RABBY_SELECTORS.unlockPasswordInput)
      .fill(password, { timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    await page
      .locator(RABBY_SELECTORS.unlockButton)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    context.logger.info(WALLET_LOG_EVENTS.unlockSuccess, "rabby unlock success", {
      kind: this.kind
    });
  }

  async connect(page: PageHandle, context: WalletContext): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.connectStart, "rabby connect start", {
      kind: this.kind
    });
    this.assertSelectorReady(RABBY_SELECTORS.connectButton);
    this.assertSelectorReady(RABBY_SELECTORS.approveButton);
    await page
      .locator(RABBY_SELECTORS.connectButton)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    await page
      .locator(RABBY_SELECTORS.approveButton)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    context.logger.info(WALLET_LOG_EVENTS.connectSuccess, "rabby connect success", {
      kind: this.kind
    });
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
    this.assertSelectorReady(RABBY_SELECTORS.networkMenu);
    this.assertSelectorReady(RABBY_SELECTORS.networkItem);
    await page
      .locator(RABBY_SELECTORS.networkMenu)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    await page
      .locator(this.withNetworkSelector(RABBY_SELECTORS.networkItem, request.chainId))
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    context.logger.info(WALLET_LOG_EVENTS.networkSuccess, "rabby network success", {
      kind: this.kind,
      chainId: request.chainId
    });
  }

  private withNetworkSelector(template: string, chainId: number) {
    return template.replace("{chainId}", String(chainId));
  }

  private isTodoSelector(selector: string) {
    return selector.includes("TODO");
  }

  private assertSelectorReady(selector: string) {
    if (this.isTodoSelector(selector)) {
      throw new Error(`SelectorTODO: ${selector}`);
    }
  }
}
