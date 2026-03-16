import assert from "node:assert/strict";
import test from "node:test";
import { WalletDetector } from "../src/core/wallet/WalletDetector.ts";
import { WalletKind } from "../src/shared/types.ts";
import type { Logger, PageHandle, WalletController } from "../src/shared/types.ts";

const createLogger = (): Logger => ({
  log: () => { },
  debug: () => { },
  info: () => { },
  warn: () => { },
  error: () => { }
});

const createController = (
  kind: WalletKind,
  confidence: number,
  throws = false
): WalletController => ({
  kind,
  detect: async () => {
    if (throws) {
      throw new Error("DetectorError");
    }
    return { kind, confidence };
  },
  unlock: async () => { },
  connect: async () => { },
  ensureNetwork: async () => { },
  signMessage: async () => { },
  signTypedData: async () => { },
  confirmTransaction: async () => { },
  approve: async () => { },
  reject: async () => { },
  handlePopupAuto: async () => { }
});

const createPage = (): PageHandle => ({
  locator: () => ({
    isVisible: async () => true,
    click: async () => { },
    fill: async () => { },
    textContent: async () => "",
    all: async () => [],
    first: () => ({ isVisible: async () => true, click: async () => { }, fill: async () => { }, textContent: async () => "", all: async () => [], first: () => ({} as any) } as any)
  } as any),
  waitForTimeout: async () => { },
  evaluate: async <T>() => undefined as T,
  goto: async () => { },
  screenshot: async () => Buffer.from(""),
  content: async () => "",
  startTracing: async () => { },
  stopTracing: async () => { },
  getConsoleLogs: () => [],
  getNetworkLogs: () => [],
  close: async () => { },
  isTracingActive: () => false
});

test("WalletDetector returns best detection", async () => {
  const detector = new WalletDetector(
    [createController(WalletKind.MetaMask, 0.7), createController(WalletKind.Rabby, 0.9)],
    { logger: createLogger(), timeoutMs: 1000 }
  );
  const result = await detector.detect(createPage());
  assert.equal(result?.kind, WalletKind.Rabby);
});

test("WalletDetector tolerates controller errors", async () => {
  const detector = new WalletDetector(
    [createController(WalletKind.MetaMask, 0.6, true), createController(WalletKind.Rabby, 0.8)],
    { logger: createLogger(), timeoutMs: 1000 }
  );
  const result = await detector.detect(createPage());
  assert.equal(result?.kind, WalletKind.Rabby);
});
