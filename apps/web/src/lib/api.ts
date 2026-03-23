import type { IdeaWithJobs, CreateIdeaRequest, Job } from "@ai-dashboard/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `API error ${res.status}`);
  return json.data as T;
}

export const api = {
  ideas: {
    list: () => apiFetch<IdeaWithJobs[]>("/ideas"),
    get: (id: string) => apiFetch<IdeaWithJobs>(`/ideas/${id}`),
    create: (body: CreateIdeaRequest) =>
      apiFetch<IdeaWithJobs>("/ideas", { method: "POST", body: JSON.stringify(body) }),
    stats: () => apiFetch<Record<string, number>>("/ideas/stats"),
  },
  jobs: {
    retry: (id: string) => apiFetch<Job>(`/jobs/${id}/retry`, { method: "POST" }),
  },
  outputs: {
    url: (ideaId: string, filename: string) =>
      `${API_URL}/api/outputs/${ideaId}/${filename}`,
  },
};
