import { chromium, firefox, webkit, Browser, BrowserContext, Page } from "playwright";
import type { BrowserProfile, BrowserSession, BrowserLaunchOptions, PageHandle, Logger } from "../../shared/types";

/**
 * Event collector for console and network logs
 * Captures events from Playwright pages for artifact storage
 */
class EventCollector {
  private consoleLogs: string[] = [];
  private networkLogs: Array<{ url: string; status: number; method: string }> = [];

  constructor(private page: Page) {
    this.setupListeners();
  }

  private setupListeners(): void {
    // Collect console messages
    this.page.on("console", (msg) => {
      const args = msg.args();
      const logEntry = `[${msg.type().toUpperCase()}] ${msg.text()}`;
      this.consoleLogs.push(logEntry);
    });

    // Collect network responses
    this.page.on("response", (response) => {
      const request = response.request();
      this.networkLogs.push({
        url: request.url(),
        status: response.status(),
        method: request.method()
      });
    });

    // Handle page errors
    this.page.on("pageerror", (error) => {
      this.consoleLogs.push(`[ERROR] ${error.message}`);
    });
  }

  getConsoleLogs(): string[] {
    return [...this.consoleLogs];
  }

  getNetworkLogs(): Array<{ url: string; status: number; method: string }> {
    return [...this.networkLogs];
  }

  clearLogs(): void {
    this.consoleLogs = [];
    this.networkLogs = [];
  }
}

class PageHandleImpl implements PageHandle {
  private tracingActive = false;
  private eventCollector: EventCollector;

  constructor(private page: Page, private context: BrowserContext) {
    this.eventCollector = new EventCollector(page);
  }

  locator(selector: string) {
    const loc = this.page.locator(selector);
    return {
      isVisible: (opts?: any) => loc.isVisible(opts),
      click: (opts?: any) => loc.click(opts),
      fill: (val: string, opts?: any) => loc.fill(val, opts),
      textContent: () => loc.textContent(),
      all: () => loc.all().then((locs) => locs.map((l) => ({
        isVisible: (o?: any) => l.isVisible(o),
        click: (o?: any) => l.click(o),
        fill: (v: string, o?: any) => l.fill(v, o),
        textContent: () => l.textContent(),
        all: () => Promise.resolve([]),
        first: () => ({} as any)
      }))),
      first: () => ({
        isVisible: (o?: any) => this.page.locator(selector).first().isVisible(o),
        click: (o?: any) => this.page.locator(selector).first().click(o),
        fill: (v: string, o?: any) => this.page.locator(selector).first().fill(v, o),
        textContent: () => this.page.locator(selector).first().textContent(),
        all: () => Promise.resolve([]),
        first: () => ({} as any)
      } as any)
    };
  }

  waitForTimeout(ms: number) {
    return this.page.waitForTimeout(ms);
  }

  evaluate<T>(fn: (arg?: any) => T | Promise<T>, arg?: any): Promise<T> {
    return this.page.evaluate(fn, arg);
  }

  goto(url: string, options?: any) {
    return this.page.goto(url, options).then(() => {});
  }

  screenshot(options?: any) {
    return this.page.screenshot(options);
  }

  content() {
    return this.page.content();
  }

  async startTracing() {
    try {
      await this.context.tracing.start({ screenshots: true, snapshots: true });
      this.tracingActive = true;
    } catch (error) {
      // Tracing may already be active
      this.tracingActive = true;
    }
  }

  async stopTracing(path: string) {
    if (this.tracingActive) {
      try {
        await this.context.tracing.stop({ path });
      } catch (error) {
        // Tracing may have already stopped or path may be invalid
      } finally {
        this.tracingActive = false;
      }
    }
  }

  getConsoleLogs(): string[] {
    return this.eventCollector.getConsoleLogs();
  }

  getNetworkLogs(): string[] {
    // Convert to string array for compatibility
    return this.eventCollector.getNetworkLogs().map(
      (log) => `${log.method} ${log.url} ${log.status}`
    );
  }

  close() {
    return this.page.close();
  }

  isTracingActive() {
    return this.tracingActive;
  }
}

export class PlaywrightBrowserDriver {
  private contexts: Map<string, BrowserContext> = new Map();
  private pages: Map<string, PageHandle> = new Map();

  constructor(
    private config: {
      browserType: "chromium" | "firefox" | "webkit";
      headless?: boolean;
      logger?: Logger;
      extensionPaths?: string[];
    }
  ) {}

  async launch(
    profile: BrowserProfile,
    options?: BrowserLaunchOptions
  ): Promise<BrowserSession> {
    const browserType = this.config.browserType;
    const isHeadless = this.config.headless !== false;

    this.config.logger?.debug("playwright_launch", `Launching ${browserType} browser`, {
      profile: profile.id,
      headless: isHeadless
    });

    try {
      let context: BrowserContext;

      if (browserType === "chromium") {
        const args: string[] = options?.extraArgs ? [...options.extraArgs] : [];
        if (this.config.extensionPaths && this.config.extensionPaths.length > 0) {
          const extensionPathsStr = this.config.extensionPaths.join(",");
          args.push(`--disable-extensions-except=${extensionPathsStr}`);
          args.push(`--load-extension=${extensionPathsStr}`);
        }

        const isExtensionHeadless = !!(this.config.extensionPaths?.length && isHeadless);
        if (isExtensionHeadless) {
          args.push("--headless=new");
        }

        const launchArgs: NonNullable<Parameters<typeof chromium.launchPersistentContext>[1]> = {
          headless: isExtensionHeadless ? false : isHeadless,
          args
        };
        if (options?.proxyUrl) {
          launchArgs.proxy = { server: options.proxyUrl };
        }
        context = await chromium.launchPersistentContext(profile.userDataDir, launchArgs);
      } else if (browserType === "firefox") {
        context = await firefox.launchPersistentContext(profile.userDataDir, {
          headless: isHeadless,
          args: options?.extraArgs
        });
      } else {
        context = await webkit.launchPersistentContext(profile.userDataDir, {
          headless: isHeadless
        });
      }

      this.contexts.set(profile.id, context);

      const pages = context.pages();
      const page = pages.length > 0 ? pages[0] : await context.newPage();
      const pageHandle = new PageHandleImpl(page, context);
      this.pages.set(profile.id, pageHandle);

      const session: BrowserSession = {
        id: `session-${profile.id}`,
        profileId: profile.id,
        createdAt: new Date().toISOString()
      };

      this.config.logger?.info("browser_launched", "Browser launched successfully", {
        profile: profile.id,
        sessionId: session.id
      });

      return session;
    } catch (error) {
      this.config.logger?.error("browser_launch_failed", "Failed to launch browser", {
        profile: profile.id,
        error: String(error)
      });
      throw error;
    }
  }

  async close(session: BrowserSession): Promise<void> {
    const { profileId } = session;

    try {
      const pageHandle = this.pages.get(profileId);
      if (pageHandle) {
        await pageHandle.close().catch(() => {});
        this.pages.delete(profileId);
      }

      const context = this.contexts.get(profileId);
      if (context) {
        await context.close();
        this.contexts.delete(profileId);
      }

      this.config.logger?.debug("browser_closed", "Browser closed successfully", {
        profile: profileId
      });
    } catch (error) {
      this.config.logger?.error("browser_close_failed", "Failed to close browser", {
        profile: profileId,
        error: String(error)
      });
      throw error;
    }
  }

  getPage(profileId: string): PageHandle | undefined {
    return this.pages.get(profileId);
  }

  getExtensionPage(profileId: string): PageHandle | undefined {
    const context = this.contexts.get(profileId);
    if (!context) return undefined;

    const pages = context.pages();
    for (const p of pages) {
      if (p.url().startsWith("chrome-extension://")) {
        return new PageHandleImpl(p, context);
      }
    }
    return undefined;
  }
}
