import "dotenv/config";
import { Worker, QueueEvents } from "bullmq";
import type { QueueJobPayload } from "@ai-dashboard/shared";
import { QUEUE_NAME } from "@ai-dashboard/shared";
import { processJob } from "./processors/jobProcessor";

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
} as const;

const worker = new Worker<QueueJobPayload>(
  QUEUE_NAME,
  async (job) => {
    await processJob(job);
  },
  {
    connection: redisConnection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || "2"),
    limiter: {
      max: 10,
      duration: 60_000,
    },
  }
);

const queueEvents = new QueueEvents(QUEUE_NAME, {
  connection: redisConnection,
});

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} (${job.name}) completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} (${job?.name}) failed:`, err.message);
});

worker.on("active", (job) => {
  console.log(`⚙️  Job ${job.id} (${job.name}) started`);
});

queueEvents.on("stalled", ({ jobId }) => {
  console.warn(`⚠️  Job ${jobId} stalled`);
});

async function shutdown(signal: string) {
  console.log(`\n[Worker] Received ${signal}, shutting down gracefully...`);
  await worker.close();
  await queueEvents.close();
  process.exit(0);
}

process.on("SIGINT",  () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

console.log(`🔧 Worker started. Listening on queue: "${QUEUE_NAME}"`);
console.log(`   Redis: ${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || "6379"}`);
console.log(`   Concurrency: ${process.env.WORKER_CONCURRENCY || "2"}`);
