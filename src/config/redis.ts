import Redis from "ioredis";
import { createConsoleLogger } from "../shared/logger";

const logger = createConsoleLogger({ context: { module: "redis-client" } });

export function createRedisClient(url: string) {
  const redis = new Redis(url);

  redis.on("error", (error) => {
    logger.error("redis_error", "Redis connection error", { error: String(error) });
  });

  redis.on("connect", () => {
    logger.info("redis_connected", "Connected to Redis", {});
  });

  return redis;
}
