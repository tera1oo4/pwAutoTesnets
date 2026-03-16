import { LogLevel } from "../shared/types";
import { promises as fs } from "node:fs";
import path from "node:path";

export type AppEnv = {
  port: number;
  baseUrl: string;
  logLevel: LogLevel;
  secretKey?: string;
  databaseUrl: string;
  redisUrl: string;
  artifactsPath: string;
  headless: boolean;
  metamaskExtensionPath?: string;
  rabbyExtensionPath?: string;
};

export const loadEnv = (env: Record<string, string | undefined>): AppEnv => {
  const port = parseNumber(env.APP_PORT, 3000);
  const baseUrl = env.APP_BASE_URL ?? "http://localhost:3000";

  const logLevel = (env.APP_LOG_LEVEL ?? "info") as LogLevel;
  const validLogLevels = ["debug", "info", "warn", "error"];
  if (!validLogLevels.includes(logLevel)) {
    throw new Error(`Invalid APP_LOG_LEVEL: ${env.APP_LOG_LEVEL}. Valid values: ${validLogLevels.join(", ")}`);
  }

  const databaseUrl = env.DATABASE_URL ?? "postgresql://user:password@localhost:5432/playwrightautomation";
  const redisUrl = env.REDIS_URL ?? "redis://localhost:6379";
  const artifactsPath = env.ARTIFACTS_PATH ?? "./artifacts";
  const headless = env.HEADLESS !== "false";
  const secretKey = env.APP_SECRET_KEY;
  const metamaskExtensionPath = env.METAMASK_EXTENSION_PATH;
  const rabbyExtensionPath = env.RABBY_EXTENSION_PATH;

  return {
    port,
    baseUrl,
    logLevel,
    secretKey,
    databaseUrl,
    redisUrl,
    artifactsPath,
    headless,
    metamaskExtensionPath,
    rabbyExtensionPath
  };
};

export const validateEnv = async (config: AppEnv): Promise<void> => {
  const errors: string[] = [];

  // Validate extension paths if provided
  if (config.metamaskExtensionPath) {
    try {
      const stat = await fs.stat(config.metamaskExtensionPath);
      if (!stat.isDirectory()) {
        errors.push(`METAMASK_EXTENSION_PATH must be a directory: ${config.metamaskExtensionPath}`);
      }
      const manifestPath = path.join(config.metamaskExtensionPath, "manifest.json");
      try {
        await fs.access(manifestPath);
      } catch {
        errors.push(`manifest.json not found in METAMASK_EXTENSION_PATH: ${config.metamaskExtensionPath}`);
      }
    } catch {
      errors.push(`METAMASK_EXTENSION_PATH does not exist: ${config.metamaskExtensionPath}`);
    }
  }

  if (config.rabbyExtensionPath) {
    try {
      const stat = await fs.stat(config.rabbyExtensionPath);
      if (!stat.isDirectory()) {
        errors.push(`RABBY_EXTENSION_PATH must be a directory: ${config.rabbyExtensionPath}`);
      }
      const manifestPath = path.join(config.rabbyExtensionPath, "manifest.json");
      try {
        await fs.access(manifestPath);
      } catch {
        errors.push(`manifest.json not found in RABBY_EXTENSION_PATH: ${config.rabbyExtensionPath}`);
      }
    } catch {
      errors.push(`RABBY_EXTENSION_PATH does not exist: ${config.rabbyExtensionPath}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
  }
};

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return parsed;
};
