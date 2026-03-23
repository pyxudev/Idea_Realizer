import type {
  Idea, Job, IdeaWithJobs, CreateIdeaRequest, AIProviderType,
} from "@ai-dashboard/shared";
import { JOB_SEQUENCE } from "@ai-dashboard/shared";
import { query, queryOne } from "../db/connection";
import { getQueue } from "./queue";

export async function listIdeas(): Promise<IdeaWithJobs[]> {
  const ideas = await query<Idea>(`SELECT * FROM ideas ORDER BY created_at DESC`);
  if (ideas.length === 0) return [];

  const jobs = await query<Job>(
    `SELECT * FROM jobs WHERE idea_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
    [ideas.map((i) => i.id)]
  );

  const jobsByIdea = new Map<string, Job[]>();
  for (const job of jobs) {
    const list = jobsByIdea.get(job.idea_id) ?? [];
    list.push(job);
    jobsByIdea.set(job.idea_id, list);
  }

  return ideas.map((idea) => ({ ...idea, jobs: jobsByIdea.get(idea.id) ?? [] }));
}

export async function getIdeaById(id: string): Promise<IdeaWithJobs | null> {
  const idea = await queryOne<Idea>(`SELECT * FROM ideas WHERE id = $1`, [id]);
  if (!idea) return null;

  const jobs = await query<Job>(
    `SELECT * FROM jobs WHERE idea_id = $1 ORDER BY created_at ASC`,
    [id]
  );
  return { ...idea, jobs };
}

export async function createIdea(req: CreateIdeaRequest): Promise<IdeaWithJobs> {
  const idea = await queryOne<Idea>(
    `INSERT INTO ideas (title, description, ai_provider, status)
     VALUES ($1, $2, $3, 'created') RETURNING *`,
    [req.title, req.description, req.ai_provider]
  );
  if (!idea) throw new Error("Failed to create idea");

  const jobRows: Job[] = [];
  for (const type of JOB_SEQUENCE) {
    const job = await queryOne<Job>(
      `INSERT INTO jobs (idea_id, type, status, input)
       VALUES ($1, $2, 'pending', $3) RETURNING *`,
      [idea.id, type, JSON.stringify({ title: idea.title, description: idea.description })]
    );
    if (job) jobRows.push(job);
  }

  // Enqueue only the first job (proposal)
  const firstJob = jobRows[0];
  if (firstJob) {
    const queue = getQueue();
    await queue.add(firstJob.type, {
      jobId: firstJob.id,
      ideaId: idea.id,
      type: firstJob.type,
      input: firstJob.input as Record<string, unknown>,
      aiProvider: req.ai_provider,
    }, { jobId: `${idea.id}-${firstJob.type}-${Date.now()}` });
  }

  await query(`UPDATE ideas SET status = 'generating' WHERE id = $1`, [idea.id]);
  return { ...idea, status: "generating", jobs: jobRows };
}

export async function enqueueNextJob(ideaId: string, provider: AIProviderType): Promise<void> {
  const jobs = await query<Job>(
    `SELECT * FROM jobs WHERE idea_id = $1 ORDER BY created_at ASC`,
    [ideaId]
  );

  const nextJob = jobs.find((j) => j.status === "pending");
  if (!nextJob) {
    await query(`UPDATE ideas SET status = 'completed' WHERE id = $1`, [ideaId]);
    return;
  }

  const queue = getQueue();
  await queue.add(nextJob.type, {
    jobId: nextJob.id,
    ideaId,
    type: nextJob.type,
    input: nextJob.input as Record<string, unknown>,
    aiProvider: provider,
  }, { jobId: `${ideaId}-${nextJob.type}-${Date.now()}` });

  await query(`UPDATE ideas SET status = 'generating' WHERE id = $1`, [ideaId]);
}

export async function retryJob(jobId: string): Promise<Job | null> {
  const job = await queryOne<Job>(`SELECT * FROM jobs WHERE id = $1`, [jobId]);
  if (!job) return null;

  await query(`UPDATE jobs SET status = 'pending', error_message = NULL WHERE id = $1`, [jobId]);

  const idea = await queryOne<Idea>(`SELECT * FROM ideas WHERE id = $1`, [job.idea_id]);
  if (!idea) throw new Error("Idea not found");

  const queue = getQueue();
  await queue.add(job.type, {
    jobId: job.id,
    ideaId: job.idea_id,
    type: job.type,
    input: job.input as Record<string, unknown>,
    aiProvider: idea.ai_provider as AIProviderType,
  }, { jobId: `retry-${job.id}-${Date.now()}` });

  await query(`UPDATE ideas SET status = 'generating' WHERE id = $1`, [job.idea_id]);
  return { ...job, status: "pending" };
}

export async function getStats(): Promise<Record<string, number>> {
  const rows = await query<{ status: string; count: string }>(
    `SELECT status, COUNT(*)::int as count FROM ideas GROUP BY status`
  );

  const stats: Record<string, number> = { total: 0, created: 0, generating: 0, pending: 0, completed: 0, error: 0 };
  for (const row of rows) {
    stats[row.status] = Number(row.count);
    stats.total += Number(row.count);
  }
  return stats;
}
