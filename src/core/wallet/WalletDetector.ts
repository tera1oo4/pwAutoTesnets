import { WALLET_DETECTION_TIMEOUT_MS, WALLET_LOG_EVENTS } from "../../shared/constants.ts";
import { NeedsReviewError } from "../../shared/errors.ts";
import type { PageHandle, WalletContext, WalletController, WalletDetection } from "../../shared/types.ts";

export class WalletDetector {
  private readonly controllers: WalletController[];
  private readonly context: WalletContext;

  constructor(controllers: WalletController[], context: WalletContext) {
    this.controllers = controllers;
    this.context = context;
  }

  async detect(page: PageHandle): Promise<WalletDetection | null> {
    this.context.logger.info(WALLET_LOG_EVENTS.detectStart, "wallet detector start", {
      controllers: this.controllers.map((controller) => controller.kind)
    });
    const timeoutMs = this.context.timeoutMs ?? WALLET_DETECTION_TIMEOUT_MS;
    let best: WalletDetection | null = null;

    for (const controller of this.controllers) {
      try {
        const detection = await this.withTimeout(
          controller.detect(page, this.context),
          timeoutMs
        );
        if (detection && (!best || detection.confidence > best.confidence)) {
          best = detection;
        }
      } catch (error) {
        this.context.logger.warn(WALLET_LOG_EVENTS.detectFailure, "wallet detector controller error", {
          kind: controller.kind,
          error: String(error)
        });
      }
    }

    if (best) {
      this.context.logger.info(WALLET_LOG_EVENTS.detectSuccess, "wallet detector success", {
        kind: best.kind,
        confidence: best.confidence
      });
      return best;
    }

    this.context.logger.warn(WALLET_LOG_EVENTS.detectFailure, "wallet detector empty", {});
    throw new NeedsReviewError("WalletUnknownState", "wallet_unknown_state");
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error("DetectTimeout")), timeoutMs);
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }
}
