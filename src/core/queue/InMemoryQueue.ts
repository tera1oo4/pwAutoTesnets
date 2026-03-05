import crypto from "node:crypto";
import { DEFAULT_QUEUE_POLL_INTERVAL_MS, QUEUE_LOG_EVENTS } from "../../shared/constants.ts";
import type { Logger, Queue, QueueDequeueOptions, QueueEnqueueOptions, QueueItem } from "../../shared/types.ts";

type InMemoryQueueOptions = {
  logger: Logger;
  pollIntervalMs?: number;
};

export class InMemoryQueue<T> implements Queue<T> {
  private readonly logger: Logger;
  private readonly pollIntervalMs: number;
  private readonly items: QueueItem<T>[];

  constructor(options: InMemoryQueueOptions) {
    this.logger = options.logger;
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_QUEUE_POLL_INTERVAL_MS;
    this.items = [];
  }

  async enqueue(payload: T, options: QueueEnqueueOptions = {}): Promise<QueueItem<T>> {
    const now = Date.now();
    const availableAt = new Date(now + (options.delayMs ?? 0)).toISOString();
    const item: QueueItem<T> = {
      id: crypto.randomUUID(),
      payload,
      enqueuedAt: new Date(now).toISOString(),
      availableAt
    };
    this.items.push(item);
    this.logger.info(QUEUE_LOG_EVENTS.enqueue, "queue enqueue", {
      itemId: item.id,
      availableAt: item.availableAt
    });
    return item;
  }

  async dequeue(options: QueueDequeueOptions = {}): Promise<QueueItem<T> | null> {
    const waitMs = options.waitMs ?? 0;
    const start = Date.now();
    while (true) {
      const index = this.items.findIndex((item) => new Date(item.availableAt).getTime() <= Date.now());
      if (index >= 0) {
        const [item] = this.items.splice(index, 1);
        this.logger.info(QUEUE_LOG_EVENTS.dequeue, "queue dequeue", {
          itemId: item.id
        });
        return item;
      }
      if (Date.now() - start >= waitMs) {
        return null;
      }
      await new Promise((resolve) => setTimeout(resolve, this.pollIntervalMs));
    }
  }

  async ack(itemId: string): Promise<void> {
    this.logger.info(QUEUE_LOG_EVENTS.ack, "queue ack", {
      itemId
    });
  }
}
