export type AppEnv = {
  port: number;
  baseUrl: string;
  logLevel: string;
  secretKey?: string;
};

export const loadEnv = (env: Record<string, string | undefined>): AppEnv => {
  const port = parseNumber(env.APP_PORT, 3000);
  const baseUrl = env.APP_BASE_URL ?? "http://localhost:3000";
  const logLevel = env.APP_LOG_LEVEL ?? "info";
  const secretKey = env.APP_SECRET_KEY;
  return { port, baseUrl, logLevel, secretKey };
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
