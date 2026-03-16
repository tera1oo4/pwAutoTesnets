import type { Logger, RunRecord } from "../../shared/types.ts";
import type { Page } from "playwright";

/**
 * Browser command types
 */
export type BrowserCommand =
  | { type: "navigate"; url: string }
  | { type: "click"; selector: string }
  | { type: "fill"; selector: string; text: string }
  | { type: "screenshot"; filename?: string }
  | { type: "execute"; script: string }
  | { type: "consoleLog" }
  | { type: "getCookies" }
  | { type: "setCookies"; cookies: Array<{ name: string; value: string }> }
  | { type: "getStorage"; storageType: "local" | "session" }
  | { type: "setStorage"; storageType: "local" | "session"; key: string; value: string }
  | { type: "clearStorage"; storageType: "local" | "session" }
  | { type: "evaluate"; expression: string };

export type BrowserCommandResult = {
  success: boolean;
  timestamp: string;
  command: BrowserCommand;
  result?: any;
  error?: string;
};

export type BrowserSession = {
  runId: string;
  page?: Page;
  isActive: boolean;
  commands: BrowserCommand[];
  results: BrowserCommandResult[];
  lastActivity: string;
};

/**
 * BrowserControlService - Manages browser sessions and commands
 * Handles execution of browser commands, screenshot capture, and data manipulation
 */
export class BrowserControlService {
  private readonly sessions: Map<string, BrowserSession> = new Map();
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Create a browser session for a run
   */
  createSession(runId: string): BrowserSession {
    const session: BrowserSession = {
      runId,
      isActive: true,
      commands: [],
      results: [],
      lastActivity: new Date().toISOString()
    };
    this.sessions.set(runId, session);
    this.logger.info("browser_session_created", `Browser session created for run ${runId}`);
    return session;
  }

  /**
   * Get browser session for a run
   */
  getSession(runId: string): BrowserSession | null {
    return this.sessions.get(runId) || null;
  }

  /**
   * List all active sessions
   */
  listSessions(): BrowserSession[] {
    return Array.from(this.sessions.values()).filter(s => s.isActive);
  }

  /**
   * Execute a browser command
   */
  async executeCommand(runId: string, command: BrowserCommand): Promise<BrowserCommandResult> {
    const session = this.getSession(runId);
    if (!session) {
      this.logger.error("session_not_found", `Session not found for run ${runId}`);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        command,
        error: "Session not found"
      };
    }

    if (!session.page) {
      session.results.push({
        success: false,
        timestamp: new Date().toISOString(),
        command,
        error: "Page not available in session"
      });
      return session.results[session.results.length - 1]!;
    }

    const result: BrowserCommandResult = {
      success: true,
      timestamp: new Date().toISOString(),
      command
    };

    try {
      session.commands.push(command);

      switch (command.type) {
        case "navigate":
          await session.page.goto(command.url, { waitUntil: "networkidle" });
          result.result = { navigated: true, url: command.url };
          break;

        case "click":
          await session.page.click(command.selector);
          result.result = { clicked: true, selector: command.selector };
          break;

        case "fill":
          await session.page.fill(command.selector, command.text);
          result.result = { filled: true, selector: command.selector, length: command.text.length };
          break;

        case "screenshot": {
          const filename = command.filename || `screenshot_${Date.now()}.png`;
          const buf = await session.page.screenshot({ path: filename });
          result.result = { filename, size: buf?.length || 0 };
          break;
        }

        case "execute":
          result.result = await session.page.evaluate(command.script);
          break;

        case "consoleLog": {
          const logs: any[] = [];
          session.page.on("console", msg => logs.push({ type: msg.type(), text: msg.text() }));
          result.result = logs;
          break;
        }

        case "getCookies":
          result.result = await session.page.context().cookies();
          break;

        case "setCookies":
          await session.page.context().addCookies(command.cookies.map(c => ({
            name: c.name,
            value: c.value,
            url: session.page!.url()
          })));
          result.result = { cookiesSet: command.cookies.length };
          break;

        case "getStorage": {
          const storage = await session.page.evaluate(() => {
            const type = sessionStorage;
            const obj: Record<string, string> = {};
            for (let i = 0; i < type.length; i++) {
              const key = type.key(i);
              if (key) obj[key] = type.getItem(key) || "";
            }
            return obj;
          });
          result.result = storage;
          break;
        }

        case "setStorage":
          await session.page.evaluate(({ key, value, type }) => {
            const storage = type === "local" ? localStorage : sessionStorage;
            storage.setItem(key, value);
          }, { key: command.key, value: command.value, type: command.storageType });
          result.result = { storageSet: true, key: command.key };
          break;

        case "clearStorage":
          await session.page.evaluate(({ type }) => {
            const storage = type === "local" ? localStorage : sessionStorage;
            storage.clear();
          }, { type: command.storageType });
          result.result = { storageCleared: true, type: command.storageType };
          break;

        case "evaluate":
          result.result = await session.page.evaluate(command.expression);
          break;

        default:
          result.success = false;
          result.error = `Unknown command: ${(command as any).type}`;
      }
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : String(error);
      this.logger.error("browser_command_error", `Error executing command for run ${runId}`, {
        command: JSON.stringify(command),
        error: result.error
      });
    }

    session.results.push(result);
    session.lastActivity = new Date().toISOString();

    return result;
  }

  /**
   * Attach a page to a session
   */
  attachPage(runId: string, page: Page): void {
    const session = this.getSession(runId);
    if (session) {
      session.page = page;
      session.lastActivity = new Date().toISOString();
      this.logger.info("page_attached", `Page attached to session ${runId}`);
    }
  }

  /**
   * End a browser session
   */
  endSession(runId: string): void {
    const session = this.getSession(runId);
    if (session) {
      session.isActive = false;
      session.page = undefined;
      session.lastActivity = new Date().toISOString();
      this.logger.info("session_ended", `Session ended for run ${runId}`);
    }
  }

  /**
   * Get session history
   */
  getSessionHistory(runId: string): BrowserCommandResult[] {
    const session = this.getSession(runId);
    return session?.results || [];
  }

  /**
   * Clear old sessions
   */
  clearOldSessions(maxAgeMs: number = 3600000): void { // 1 hour default
    const now = new Date().getTime();
    let cleared = 0;

    for (const [runId, session] of this.sessions.entries()) {
      const lastActivityTime = new Date(session.lastActivity).getTime();
      if (now - lastActivityTime > maxAgeMs) {
        this.sessions.delete(runId);
        cleared++;
      }
    }

    if (cleared > 0) {
      this.logger.debug("sessions_cleared", `Cleared ${cleared} old sessions`);
    }
  }
}
