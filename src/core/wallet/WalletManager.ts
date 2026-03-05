import type {
  PageHandle,
  WalletConnectionRequest,
  WalletContext,
  WalletController,
  WalletDetection
} from "../../shared/types.ts";
import { WALLET_LOG_EVENTS } from "../../shared/constants.ts";
import { NeedsReviewError } from "../../shared/errors.ts";

export class WalletManager {
  private readonly controller: WalletController;
  private readonly context: WalletContext;

  constructor(controller: WalletController, context: WalletContext) {
    this.controller = controller;
    this.context = context;
  }

  async detect(page: PageHandle): Promise<WalletDetection | null> {
    this.context.logger.info(WALLET_LOG_EVENTS.detectStart, "wallet detect start", {
      kind: this.controller.kind
    });
    try {
      const detection = await this.controller.detect(page, this.context);
      if (detection) {
        this.context.logger.info(WALLET_LOG_EVENTS.detectSuccess, "wallet detect success", {
          kind: detection.kind,
          confidence: detection.confidence
        });
      } else {
        this.context.logger.warn(WALLET_LOG_EVENTS.detectFailure, "wallet detect empty", {
          kind: this.controller.kind
        });
        throw new NeedsReviewError(`Wallet ${this.controller.kind} detect empty or failed.`, "wallet_unknown_state");
      }
      return detection;
    } catch (error) {
      this.context.logger.error(WALLET_LOG_EVENTS.detectFailure, "wallet detect error", {
        kind: this.controller.kind,
        error: String(error)
      });
      if (error instanceof NeedsReviewError) {
        throw error;
      }
      throw new NeedsReviewError(`Wallet ${this.controller.kind} unknown state: ${error}`, "wallet_unknown_state", error);
    }
  }

  async unlock(page: PageHandle, password: string): Promise<void> {
    this.context.logger.info(WALLET_LOG_EVENTS.unlockStart, "wallet unlock start", {
      kind: this.controller.kind
    });
    try {
      await this.controller.unlock(page, password, this.context);
      this.context.logger.info(WALLET_LOG_EVENTS.unlockSuccess, "wallet unlock success", {
        kind: this.controller.kind
      });
    } catch (error) {
      this.context.logger.error(WALLET_LOG_EVENTS.unlockFailure, "wallet unlock error", {
        kind: this.controller.kind,
        error: String(error)
      });
      throw error;
    }
  }

  async connect(page: PageHandle): Promise<void> {
    this.context.logger.info(WALLET_LOG_EVENTS.connectStart, "wallet connect start", {
      kind: this.controller.kind
    });
    try {
      await this.controller.connect(page, this.context);
      this.context.logger.info(WALLET_LOG_EVENTS.connectSuccess, "wallet connect success", {
        kind: this.controller.kind
      });
    } catch (error) {
      this.context.logger.error(WALLET_LOG_EVENTS.connectFailure, "wallet connect error", {
        kind: this.controller.kind,
        error: String(error)
      });
      throw error;
    }
  }

  async ensureNetwork(page: PageHandle, request: WalletConnectionRequest): Promise<void> {
    this.context.logger.info(WALLET_LOG_EVENTS.networkStart, "wallet network start", {
      kind: this.controller.kind,
      chainId: request.chainId
    });
    try {
      await this.controller.ensureNetwork(page, request, this.context);
      this.context.logger.info(WALLET_LOG_EVENTS.networkSuccess, "wallet network success", {
        kind: this.controller.kind,
        chainId: request.chainId
      });
    } catch (error) {
      this.context.logger.error(WALLET_LOG_EVENTS.networkFailure, "wallet network error", {
        kind: this.controller.kind,
        chainId: request.chainId,
        error: String(error)
      });
      throw error;
    }
  }
}
