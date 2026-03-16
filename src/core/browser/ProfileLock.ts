import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import {
  DEFAULT_LOCK_DIR,
  DEFAULT_LOCK_RETRY_ATTEMPTS,
  DEFAULT_LOCK_RETRY_DELAY_MS,
  DEFAULT_LOCK_TTL_MS
} from "../../shared/constants.ts";
import type { ProfileId, ProfileLockState } from "../../shared/types.ts";

type ProfileLockOptions = {
  ownerId?: string;
  lockDir?: string;
  ttlMs?: number;
  retryDelayMs?: number;
  retryAttempts?: number;
};

export class ProfileLock {
  private readonly ownerId: string;
  private readonly lockDir: string;
  private readonly ttlMs: number;
  private readonly retryDelayMs: number;
  private readonly retryAttempts: number;
  private readonly lockTokens: Map<ProfileId, string>;

  constructor(options: ProfileLockOptions = {}) {
    this.ownerId = options.ownerId ?? crypto.randomUUID();
    this.lockDir = options.lockDir ?? path.join(os.homedir(), DEFAULT_LOCK_DIR);
    this.ttlMs = options.ttlMs ?? DEFAULT_LOCK_TTL_MS;
    this.retryDelayMs = options.retryDelayMs ?? DEFAULT_LOCK_RETRY_DELAY_MS;
    this.retryAttempts = options.retryAttempts ?? DEFAULT_LOCK_RETRY_ATTEMPTS;
    this.lockTokens = new Map();
  }

  getOwnerId() {
    return this.ownerId;
  }

  async acquire(profileId: ProfileId): Promise<ProfileLockState> {
    await fs.mkdir(this.lockDir, { recursive: true });
    const lockPath = this.getLockPath(profileId);

    for (let attempt = 0; attempt < this.retryAttempts; attempt += 1) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.ttlMs);
      const lockToken = crypto.randomUUID();
      const state: ProfileLockState = {
        profileId,
        ownerId: this.ownerId,
        lockToken,
        host: os.hostname(),
        pid: process.pid,
        acquiredAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        updatedAt: now.toISOString()
      };

      try {
        const handle = await fs.open(lockPath, "wx");
        await handle.writeFile(JSON.stringify(state));
        await handle.close();
        this.lockTokens.set(profileId, lockToken);
        return state;
      } catch (error) {
        const resolved = await this.tryResolveStaleLock(lockPath);
        if (resolved) {
          continue;
        }
      }

      await this.delay(this.retryDelayMs);
    }

    throw new Error(`LockBusy: profile ${profileId}`);
  }

  async release(profileId: ProfileId): Promise<void> {
    const lockPath = this.getLockPath(profileId);
    const state = await this.readLock(lockPath);
    if (!state) {
      this.lockTokens.delete(profileId);
      return;
    }
    if (state.ownerId !== this.ownerId || state.lockToken !== this.lockTokens.get(profileId)) {
      throw new Error(`LockOwnerMismatch: profile ${profileId}`);
    }
    await fs.unlink(lockPath);
    this.lockTokens.delete(profileId);
  }

  async refresh(profileId: ProfileId): Promise<ProfileLockState> {
    const lockPath = this.getLockPath(profileId);
    const state = await this.readLock(lockPath);
    if (!state) {
      throw new Error(`LockMissing: profile ${profileId}`);
    }
    const token = this.lockTokens.get(profileId);
    if (state.ownerId !== this.ownerId || state.lockToken !== token) {
      throw new Error(`LockOwnerMismatch: profile ${profileId}`);
    }
    const now = new Date();
    const refreshed: ProfileLockState = {
      ...state,
      expiresAt: new Date(now.getTime() + this.ttlMs).toISOString(),
      updatedAt: now.toISOString()
    };
    await fs.writeFile(lockPath, JSON.stringify(refreshed));
    return refreshed;
  }

  async read(profileId: ProfileId): Promise<ProfileLockState | null> {
    return this.readLock(this.getLockPath(profileId));
  }

  private getLockPath(profileId: ProfileId) {
    return path.join(this.lockDir, `${profileId}.lock.json`);
  }

  private async readLock(lockPath: string): Promise<ProfileLockState | null> {
    try {
      const content = await fs.readFile(lockPath, "utf-8");
      return JSON.parse(content) as ProfileLockState;
    } catch (error) {
      return null;
    }
  }

  private async tryResolveStaleLock(lockPath: string): Promise<boolean> {
    const state = await this.readLock(lockPath);
    if (!state) {
      return false;
    }
    const expiresAt = new Date(state.expiresAt).getTime();
    if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
      await fs.unlink(lockPath).catch((error) => {
        // May have been removed concurrently
        if ((error as any).code !== 'ENOENT') throw error;
      });
      return true;
    }
    // Check if the holding process is still alive locally
    if (state.host === os.hostname() && state.pid) {
      try {
        process.kill(state.pid, 0);
      } catch (e: any) {
        if (e.code === "ESRCH") {
          // Process does not exist, lock is stale
          await fs.unlink(lockPath).catch((error) => {
            if ((error as any).code !== 'ENOENT') throw error;
          });
          return true;
        }
      }
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
