import { Queue } from "bullmq";
import type { Job, AIProviderType, QueueJobPayload } from "@ai-dashboard/shared";
import { QUEUE_NAME } from "@ai-dashboard/shared";
import { query, queryOne } from "../db";

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
} as const;

let queueInstance: Queue<QueueJobPayload> | null = null;

function getQueue(): Queue<QueueJobPayload> {
  if (!queueInstance) {
    queueInstance = new Queue<QueueJobPayload>(QUEUE_NAME, {
      connection: redisConnection,
    });
  }
  return queueInstance;
}

export async function enqueueNextJob(
  ideaId: string,
  provider: AIProviderType
): Promise<void> {
  const jobs = await query<Job>(
    `SELECT * FROM jobs WHERE idea_id = $1 ORDER BY created_at ASC`,
    [ideaId]
  );

  const nextJob = jobs.find((j) => j.status === "pending");
  if (!nextJob) {
    await query(`UPDATE ideas SET status = 'completed' WHERE id = $1`, [ideaId]);
    console.log(`[Worker] Idea ${ideaId} fully completed`);
    return;
  }

  await getQueue().add(
    nextJob.type,
    {
      jobId: nextJob.id,
      ideaId,
      type: nextJob.type,
      input: nextJob.input as Record<string, unknown>,
      aiProvider: provider,
    },
    { jobId: `${ideaId}-${nextJob.type}-${Date.now()}` }
  );

  console.log(`[Worker] Enqueued next job: ${nextJob.type} for idea ${ideaId}`);
}
