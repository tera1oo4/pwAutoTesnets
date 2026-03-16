import { LogLevel } from "../shared/types";

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
