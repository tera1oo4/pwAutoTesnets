import type { PageHandle, Logger } from "../../shared/types.ts";
import path from "node:path";

/**
 * ScenarioUtils - Common patterns for wallet-enabled scenarios
 * Provides explicit waits and event-based flow patterns
 */

export class ScenarioUtils {
  /**
   * Wait for an element to be visible with retries
   * @param page PageHandle
   * @param selector CSS selector to wait for
   * @param timeoutMs Timeout in milliseconds
   * @param logger Logger instance
   * @throws Error if element doesn't become visible
   */
  static async waitForElement(
    page: PageHandle,
    selector: string,
    timeoutMs: number = 5000,
    logger?: Logger
  ): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 200;

    while (Date.now() - startTime < timeoutMs) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 1000 })) {
          logger?.debug("element_found", `Element found: ${selector}`, {});
          return;
        }
      } catch (_error) {
        // Continue polling
      }
      await page.waitForTimeout(pollInterval);
    }

    throw new Error(`Element not visible after ${timeoutMs}ms: ${selector}`);
  }

  /**
   * Wait for any of multiple elements to be visible
   * @param page PageHandle
   * @param selectors Array of CSS selectors
   * @param timeoutMs Timeout in milliseconds
   * @param logger Logger instance
   * @returns The selector that became visible first
   */
  static async waitForAnyElement(
    page: PageHandle,
    selectors: string[],
    timeoutMs: number = 5000,
    logger?: Logger
  ): Promise<string> {
    const startTime = Date.now();
    const pollInterval = 200;

    while (Date.now() - startTime < timeoutMs) {
      for (const selector of selectors) {
        try {
          if (await page.locator(selector).isVisible({ timeout: 500 })) {
            logger?.debug("element_found", `Element found: ${selector}`, {});
            return selector;
          }
        } catch (_error) {
          // Continue to next selector
        }
      }
      await page.waitForTimeout(pollInterval);
    }

    throw new Error(`None of the elements visible after ${timeoutMs}ms: ${selectors.join(", ")}`);
  }

  /**
   * Click a button and wait for navigation/state change
   * @param page PageHandle
   * @param selector Button selector
   * @param waitForSelector Optional selector to wait for after click
   * @param timeoutMs Timeout in milliseconds
   */
  static async clickAndWait(
    page: PageHandle,
    selector: string,
    waitForSelector?: string,
    timeoutMs: number = 5000
  ): Promise<void> {
    const locator = page.locator(selector);

    // Verify button is visible before clicking
    if (!await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
      throw new Error(`Button not visible: ${selector}`);
    }

    await locator.click({ timeout: 2000 });

    // If waiting for another element, wait for it
    if (waitForSelector) {
      await this.waitForElement(page, waitForSelector, timeoutMs);
    } else {
      // Otherwise just wait a bit for any state change
      await page.waitForTimeout(300);
    }
  }

  /**
   * Fill input and verify value was set
   * @param page PageHandle
   * @param selector Input selector
   * @param value Value to fill
   * @param timeoutMs Timeout in milliseconds
   */
  static async fillAndVerify(
    page: PageHandle,
    selector: string,
    value: string,
    timeoutMs: number = 5000
  ): Promise<void> {
    const locator = page.locator(selector);

    if (!await locator.isVisible({ timeout: 1000 }).catch(() => false)) {
      throw new Error(`Input not visible: ${selector}`);
    }

    // Clear and fill
    await locator.fill(value, { timeout: timeoutMs });

    // Verify value was set
    const actualValue = await page.evaluate((sel: string) => {
      const el = document.querySelector(sel);
      return el instanceof HTMLInputElement ? el.value : el?.textContent ?? "";
    }, selector);
    
    if (!actualValue.includes(value)) {
      throw new Error(`Failed to fill input with value: ${value}`);
    }
  }

  /**
   * Wait for wallet popup to appear (generic)
   * Looks for common wallet UI indicators
   * @param page PageHandle
   * @param timeoutMs Timeout in milliseconds
   */
  static async waitForWalletPopup(
    page: PageHandle,
    timeoutMs: number = 5000
  ): Promise<string> {
    // Common wallet popup indicators
    const walletSelectors = [
      // MetaMask
      "[data-testid='app-content-wrapper']",
      ".app-content-wrapper",
      // Rabby
      "[data-testid='rabby-container']",
      ".rabby-container",
      // Generic
      "iframe",
      "[role='dialog']"
    ];

    return this.waitForAnyElement(page, walletSelectors, timeoutMs);
  }

  /**
   * Capture page state for debugging/artifacts
   * @param page PageHandle
   * @param logger Logger instance
   * @param name Artifact name
   */
  static async captureState(
    page: PageHandle,
    logger: Logger,
    name: string
  ): Promise<void> {
    try {
      const artifactsPath = process.env.ARTIFACTS_PATH || "./artifacts";
      await page.screenshot({ path: path.join(artifactsPath, `scenario-${name}-${Date.now()}.png`) });
      logger.debug("state_captured", `Captured state: ${name}`, {});
    } catch (error) {
      logger.warn("capture_failed", `Failed to capture state: ${name}`, {
        error: String(error)
      });
    }
  }

  /**
   * Handle potential wallet popup by trying to auto-approve
   * @param page PageHandle
   * @param wallet Wallet manager
   * @param logger Logger instance
   * @param timeoutMs Timeout in milliseconds
   */
  static async handlePopupIfPresent(
    page: PageHandle,
    wallet: any, // WalletManager
    logger: Logger,
    timeoutMs: number = 3000
  ): Promise<boolean> {
    try {
      // Check if popup is visible
      const popupSelectors = [
        "[data-testid='signature-request']",
        ".signature-request",
        "[data-testid='message-signing-request']",
        ".message-signing-popup"
      ];

      const startTime = Date.now();
      while (Date.now() - startTime < timeoutMs) {
        for (const selector of popupSelectors) {
          try {
            if (await page.locator(selector).isVisible({ timeout: 500 })) {
              // Popup found - let wallet controller handle it
              await wallet.handlePopupAuto(page);
              logger.info("popup_handled", "Wallet popup auto-handled", {});
              return true;
            }
          } catch (_error) {
            // Continue
          }
        }
        await page.waitForTimeout(100);
      }

      return false;
    } catch (error) {
      logger.warn("popup_handle_error", "Error handling popup", {
        error: String(error)
      });
      return false;
    }
  }

  /**
   * Retry async operation with exponential backoff
   * @param operation Async operation to retry
   * @param maxRetries Maximum number of retries
   * @param logger Logger instance
   * @returns Operation result
   */
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    logger?: Logger
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          logger?.warn("retry_attempt", `Retry attempt ${attempt + 1}/${maxRetries}`, {
            error: lastError.message,
            backoffMs
          });
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    throw new Error(`Operation failed after ${maxRetries} retries: ${lastError?.message}`);
  }

  /**
   * Verify page has loaded by checking for essential elements
   * @param page PageHandle
   * @param logger Logger instance
   * @param expectedSelectors Selectors to verify page is loaded
   * @param timeoutMs Timeout in milliseconds
   */
  static async verifyPageLoaded(
    page: PageHandle,
    logger: Logger,
    expectedSelectors: string[] = ["body"],
    timeoutMs: number = 10000
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      let allFound = true;

      for (const selector of expectedSelectors) {
        try {
          const element = page.locator(selector);
          const visible = await element.isVisible({ timeout: 500 }).catch(() => false);
          if (!visible) {
            allFound = false;
            break;
          }
        } catch (_error) {
          allFound = false;
          break;
        }
      }

      if (allFound) {
        logger.debug("page_loaded", "Page loaded successfully", {
          checkCount: expectedSelectors.length
        });
        return;
      }

      await page.waitForTimeout(200);
    }

    throw new Error(`Page did not load within ${timeoutMs}ms. Missing: ${expectedSelectors.join(", ")}`);
  }
}
