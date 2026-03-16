import Redis from "ioredis";

export function createRedisClient(url: string) {
  const redis = new Redis(url);

  redis.on("error", (error) => {
    console.error("Redis Error:", error);
  });

  redis.on("connect", () => {
    console.log("✓ Connected to Redis");
  });

  return redis;
}
