import crypto from "node:crypto";
import { QUEUE_LOG_EVENTS } from "../../shared/constants.ts";
import type {
  Logger,
  Queue,
  QueueDequeueOptions,
  QueueEnqueueOptions,
  QueueItem,
  RedisQueueClient
} from "../../shared/types.ts";

type RedisQueueOptions = {
  client: RedisQueueClient;
  logger: Logger;
  keyPrefix?: string;
};

export class RedisQueue<T> implements Queue<T> {
  private readonly client: RedisQueueClient;
  private readonly logger: Logger;
  private readonly key: string;

  constructor(options: RedisQueueOptions) {
    this.client = options.client;
    this.logger = options.logger;
    this.key = `${options.keyPrefix ?? "pwAutoTestnets"}:queue`;
  }

  async enqueue(payload: T, options: QueueEnqueueOptions = {}): Promise<QueueItem<T>> {
    const item: QueueItem<T> = {
      id: crypto.randomUUID(),
      payload,
      enqueuedAt: new Date().toISOString(),
      availableAt: new Date(Date.now() + (options.delayMs ?? 0)).toISOString()
    };
    await this.client.zadd(this.key, new Date(item.availableAt).getTime(), JSON.stringify(item));
    this.logger.info(QUEUE_LOG_EVENTS.enqueue, "queue enqueue", {
      itemId: item.id
    });
    return item;
  }

  async dequeue(options: QueueDequeueOptions = {}): Promise<QueueItem<T> | null> {
    const waitMs = options.waitMs ?? 0;
    const start = Date.now();
    const pollInterval = Math.min(1000, Math.max(100, waitMs / 10)); // Dynamic poll

    while (Date.now() - start <= waitMs || waitMs === 0) {
      const results = await this.client.zrangebyscore(this.key, "-inf", Date.now(), "LIMIT", "0", "1");
      if (results && results.length > 0) {
        const itemStr = results[0];
        const removed = await this.client.zrem(this.key, itemStr);
        if (removed > 0) {
          const item = JSON.parse(itemStr) as QueueItem<T>;
          this.logger.info(QUEUE_LOG_EVENTS.dequeue, "queue dequeue", { itemId: item.id });
          return item;
        }
      }
      
      if (waitMs === 0) break;
      const elapsed = Date.now() - start;
      const nextSleep = Math.min(pollInterval, waitMs - elapsed);
      if (nextSleep > 0) {
        await new Promise(resolve => setTimeout(resolve, nextSleep));
      }
    }
    return null;
  }

  async ack(itemId: string): Promise<void> {
    this.logger.info(QUEUE_LOG_EVENTS.ack, "queue ack", {
      itemId
    });
  }
}
