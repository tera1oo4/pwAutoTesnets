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

const METAMASK_SELECTORS = {
  extensionIcon: "TODO: version-sensitive",
  unlockPasswordInput: "TODO: version-sensitive",
  unlockButton: "TODO: version-sensitive",
  connectButton: "TODO: version-sensitive",
  approveButton: "TODO: version-sensitive",
  networkMenu: "TODO: version-sensitive",
  networkItem: "TODO: version-sensitive"
} as const;

export class MetaMaskController implements WalletController {
  kind = WalletKind.MetaMask;

  async detect(page: PageHandle, context: WalletContext): Promise<WalletDetection | null> {
    context.logger.info(WALLET_LOG_EVENTS.detectStart, "metamask detect start", {
      kind: this.kind
    });
    if (this.isTodoSelector(METAMASK_SELECTORS.extensionIcon)) {
      throw new NeedsReviewError("WalletSelectorTodo", "wallet_selector_todo");
    }
    const visible = await page
      .locator(METAMASK_SELECTORS.extensionIcon)
      .isVisible({ timeout: context.timeoutMs ?? WALLET_DETECTION_TIMEOUT_MS });
    if (!visible) {
      context.logger.warn(WALLET_LOG_EVENTS.detectFailure, "metamask not visible", {
        kind: this.kind
      });
      return null;
    }
    const detection = { kind: this.kind, confidence: 0.9 };
    context.logger.info(WALLET_LOG_EVENTS.detectSuccess, "metamask detect success", detection);
    return detection;
  }

  async unlock(page: PageHandle, password: string, context: WalletContext): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.unlockStart, "metamask unlock start", {
      kind: this.kind
    });
    this.assertSelectorReady(METAMASK_SELECTORS.unlockPasswordInput);
    this.assertSelectorReady(METAMASK_SELECTORS.unlockButton);
    await page
      .locator(METAMASK_SELECTORS.unlockPasswordInput)
      .fill(password, { timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    await page
      .locator(METAMASK_SELECTORS.unlockButton)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    context.logger.info(WALLET_LOG_EVENTS.unlockSuccess, "metamask unlock success", {
      kind: this.kind
    });
  }

  async connect(page: PageHandle, context: WalletContext): Promise<void> {
    context.logger.info(WALLET_LOG_EVENTS.connectStart, "metamask connect start", {
      kind: this.kind
    });
    this.assertSelectorReady(METAMASK_SELECTORS.connectButton);
    this.assertSelectorReady(METAMASK_SELECTORS.approveButton);
    await page
      .locator(METAMASK_SELECTORS.connectButton)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    await page
      .locator(METAMASK_SELECTORS.approveButton)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    context.logger.info(WALLET_LOG_EVENTS.connectSuccess, "metamask connect success", {
      kind: this.kind
    });
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
    this.assertSelectorReady(METAMASK_SELECTORS.networkMenu);
    this.assertSelectorReady(METAMASK_SELECTORS.networkItem);
    await page
      .locator(METAMASK_SELECTORS.networkMenu)
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    await page
      .locator(this.withNetworkSelector(METAMASK_SELECTORS.networkItem, request.chainId))
      .click({ timeout: context.timeoutMs ?? WALLET_ACTION_TIMEOUT_MS });
    context.logger.info(WALLET_LOG_EVENTS.networkSuccess, "metamask network success", {
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
