import { Queue } from "bullmq";
import type { QueueJobPayload } from "@ai-dashboard/shared";
import { QUEUE_NAME } from "@ai-dashboard/shared";

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
} as const;

let queue: Queue<QueueJobPayload> | null = null;

export function getQueue(): Queue<QueueJobPayload> {
  if (!queue) {
    queue = new Queue<QueueJobPayload>(QUEUE_NAME, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return queue;
}
