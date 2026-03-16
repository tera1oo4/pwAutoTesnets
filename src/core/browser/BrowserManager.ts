import crypto from "node:crypto";
import type { BrowserDriver, BrowserProfile, BrowserSession } from "../../shared/types.ts";
import { ProfileLock } from "./ProfileLock.ts";

type BrowserManagerOptions = {
  driver: BrowserDriver;
  lock: ProfileLock;
  lockHeartbeatMs?: number;
};

export class BrowserManager {
  private readonly driver: BrowserDriver;
  private readonly lock: ProfileLock;
  private readonly sessions: Map<string, BrowserSession>;
  private readonly lockHeartbeatMs?: number;
  private readonly lockHeartbeats: Map<string, ReturnType<typeof setInterval>>;

  constructor(options: BrowserManagerOptions) {
    this.driver = options.driver;
    this.lock = options.lock;
    this.sessions = new Map();
    this.lockHeartbeatMs = options.lockHeartbeatMs;
    this.lockHeartbeats = new Map();
  }

  async open(profile: BrowserProfile): Promise<BrowserSession> {
    if (this.sessions.has(profile.id)) {
      throw new Error(`SessionAlreadyActive: profile ${profile.id}`);
    }

    await this.lock.acquire(profile.id);
    this.startHeartbeat(profile.id);

    try {
      const session = await this.driver.launch(profile, {
        proxyUrl: profile.proxyUrl
      });
      const enriched = {
        ...session,
        id: session.id || crypto.randomUUID(),
        profileId: profile.id
      };
      this.sessions.set(profile.id, enriched);
      return enriched;
    } catch (error) {
      this.stopHeartbeat(profile.id);
      await this.lock.release(profile.id);
      throw error;
    }
  }

  async close(profileId: string): Promise<void> {
    const session = this.sessions.get(profileId);
    if (!session) {
      return;
    }
    await this.driver.close(session);
    this.sessions.delete(profileId);
    this.stopHeartbeat(profileId);
    await this.lock.release(profileId);
  }

  async closeAll(): Promise<void> {
    const entries = Array.from(this.sessions.entries());
    for (const [profileId, session] of entries) {
      await this.driver.close(session);
      this.sessions.delete(profileId);
      this.stopHeartbeat(profileId);
      await this.lock.release(profileId);
    }
  }

  private startHeartbeat(profileId: string) {
    if (!this.lockHeartbeatMs || this.lockHeartbeats.has(profileId)) {
      return;
    }
    const timer = setInterval(() => {
      this.lock.refresh(profileId).catch((error) => {
        // Lock refresh failure - heartbeat stopped, lock will expire naturally
        // Next acquire will clean up and retry
      });
    }, this.lockHeartbeatMs);
    this.lockHeartbeats.set(profileId, timer);
  }

  private stopHeartbeat(profileId: string) {
    const timer = this.lockHeartbeats.get(profileId);
    if (timer) {
      clearInterval(timer);
      this.lockHeartbeats.delete(profileId);
    }
  }
}
