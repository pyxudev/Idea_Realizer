// ============================================================
// Shared Types & Constants for AI Idea Dashboard
// ============================================================

export type IdeaStatus =
  | "created"
  | "generating"
  | "pending"
  | "completed"
  | "error";

export type JobType = "proposal" | "spec" | "ui" | "implementation";

export type JobStatus = "pending" | "running" | "completed" | "failed";

export type AIProviderType = "openai" | "claude" | "gemini" | "ollama";

// ── DB row types ──────────────────────────────────────────────
export interface Idea {
  id: string;
  title: string;
  description: string;
  status: IdeaStatus;
  ai_provider: AIProviderType;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  idea_id: string;
  type: JobType;
  status: JobStatus;
  input: Record<string, unknown>;
  output_path: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// ── API request/response types ────────────────────────────────
export interface CreateIdeaRequest {
  title: string;
  description: string;
  ai_provider: AIProviderType;
}

export interface IdeaWithJobs extends Idea {
  jobs: Job[];
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// ── Queue job payload ─────────────────────────────────────────
export interface QueueJobPayload {
  jobId: string;
  ideaId: string;
  type: JobType;
  input: Record<string, unknown>;
  aiProvider: AIProviderType;
}

// ── AI provider abstract interface ───────────────────────────
export interface AIProvider {
  generate(prompt: string): Promise<string>;
}

// ── Job output file names ─────────────────────────────────────
export const JOB_OUTPUT_FILES: Record<JobType, string> = {
  proposal: "proposal.md",
  spec: "specification.json",
  ui: "preview.html",
  implementation: "implementation.md",
};

// ── Job execution order ───────────────────────────────────────
export const JOB_SEQUENCE: JobType[] = [
  "proposal",
  "spec",
  "ui",
  "implementation",
];

export const QUEUE_NAME = "idea-jobs";
