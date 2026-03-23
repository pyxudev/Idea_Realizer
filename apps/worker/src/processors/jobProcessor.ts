import path from "path";
import fs from "fs/promises";
import type { Job as BullJob } from "bullmq";
import type { QueueJobPayload, JobType } from "@ai-dashboard/shared";
import { JOB_OUTPUT_FILES } from "@ai-dashboard/shared";
import { createProvider } from "../providers/factory";
import { processors } from "./index";
import { query, queryOne } from "../db";
import { enqueueNextJob } from "../services/ideas";

async function ensureOutputDir(ideaId: string): Promise<string> {
  const outputsDir =
    process.env.OUTPUTS_DIR || path.join(process.cwd(), "../../outputs");
  const dir = path.join(outputsDir, ideaId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function writeOutput(
  ideaId: string,
  type: JobType,
  content: string
): Promise<string> {
  const dir = await ensureOutputDir(ideaId);
  const filename = JOB_OUTPUT_FILES[type];
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, content, "utf-8");
  return filePath;
}

async function readPreviousOutputs(
  ideaId: string
): Promise<Record<string, string>> {
  const outputsDir =
    process.env.OUTPUTS_DIR || path.join(process.cwd(), "../../outputs");
  const outputs: Record<string, string> = {};

  for (const [type, filename] of Object.entries(JOB_OUTPUT_FILES)) {
    const filePath = path.join(outputsDir, ideaId, filename);
    try {
      outputs[type] = await fs.readFile(filePath, "utf-8");
    } catch {
      // Not generated yet - that's fine
    }
  }
  return outputs;
}

export async function processJob(
  bullJob: BullJob<QueueJobPayload>
): Promise<void> {
  const { jobId, ideaId, type, input, aiProvider } = bullJob.data;

  console.log(`[Worker] Processing job ${jobId} (${type}) for idea ${ideaId}`);

  await query(`UPDATE jobs SET status = 'running' WHERE id = $1`, [jobId]);
  await query(`UPDATE ideas SET status = 'generating' WHERE id = $1`, [ideaId]);

  try {
    await bullJob.updateProgress(10);

    const previousOutputs = await readPreviousOutputs(ideaId);
    const provider = createProvider(aiProvider);
    const processor = processors[type];

    if (!processor) throw new Error(`No processor found for job type: ${type}`);

    await bullJob.updateProgress(25);

    const result = await processor(
      {
        title: String(input.title ?? ""),
        description: String(input.description ?? ""),
        previousOutputs,
      },
      provider
    );

    await bullJob.updateProgress(80);

    const outputPath = await writeOutput(ideaId, type, result);

    await query(
      `UPDATE jobs SET status = 'completed', output_path = $1 WHERE id = $2`,
      [outputPath, jobId]
    );

    await bullJob.updateProgress(100);
    console.log(`[Worker] Job ${jobId} (${type}) completed → ${outputPath}`);

    // Get the AI provider for this idea and enqueue next job
    const idea = await queryOne<{ ai_provider: string }>(
      `SELECT ai_provider FROM ideas WHERE id = $1`,
      [ideaId]
    );
    if (idea) {
      await enqueueNextJob(ideaId, idea.ai_provider as any);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Worker] Job ${jobId} (${type}) failed:`, message);

    await query(
      `UPDATE jobs SET status = 'failed', error_message = $1 WHERE id = $2`,
      [message, jobId]
    );
    await query(`UPDATE ideas SET status = 'error' WHERE id = $1`, [ideaId]);

    throw err;
  }
}
