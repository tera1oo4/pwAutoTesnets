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
    await this.client.lpush(this.key, JSON.stringify(item));
    this.logger.info(QUEUE_LOG_EVENTS.enqueue, "queue enqueue", {
      itemId: item.id
    });
    return item;
  }

  async dequeue(_options: QueueDequeueOptions = {}): Promise<QueueItem<T> | null> {
    const value = await this.client.rpop(this.key);
    if (!value) {
      return null;
    }
    const item = JSON.parse(value) as QueueItem<T>;
    if (new Date(item.availableAt).getTime() > Date.now()) {
      await this.client.lpush(this.key, JSON.stringify(item));
      return null;
    }
    this.logger.info(QUEUE_LOG_EVENTS.dequeue, "queue dequeue", {
      itemId: item.id
    });
    return item;
  }

  async ack(itemId: string): Promise<void> {
    this.logger.info(QUEUE_LOG_EVENTS.ack, "queue ack", {
      itemId
    });
  }
}
