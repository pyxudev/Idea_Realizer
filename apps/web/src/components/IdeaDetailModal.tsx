"use client";
import { useState, useEffect } from "react";
import type { IdeaWithJobs, Job, JobType } from "@ai-dashboard/shared";
import { JOB_OUTPUT_FILES } from "@ai-dashboard/shared";
import { StatusBadge } from "./StatusBadge";
import { JobTimeline } from "./JobTimeline";
import { api } from "@/lib/api";

const JOB_TYPE_LABELS: Record<JobType, string> = {
  proposal: "Proposal",
  spec: "Specification",
  ui: "UI Preview",
  implementation: "Implementation",
};

interface Props {
  idea: IdeaWithJobs;
  onClose: () => void;
  onRetried: () => void;
}

export function IdeaDetailModal({ idea, onClose, onRetried }: Props) {
  const [activeOutput, setActiveOutput] = useState<Job | null>(
    idea.jobs.find(j => j.type === "ui" && j.status === "completed") ?? null
  );

  const completedJobs = idea.jobs.filter(j => j.status === "completed");

  async function handleRetry(jobId: string) {
    try {
      await api.jobs.retry(jobId);
      onRetried();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Retry failed");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden z-10 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-8 py-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono text-slate-400">#{idea.id.slice(0,8)}</span>
              <StatusBadge status={idea.status} />
              <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                {idea.ai_provider}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{idea.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition text-2xl leading-none ml-4 flex-shrink-0"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 h-full">
            {/* Left panel */}
            <div className="p-6 space-y-6 overflow-y-auto">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Description</h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {idea.description}
                </p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">Generation Pipeline</h3>
                <JobTimeline
                  jobs={idea.jobs}
                  onRetry={handleRetry}
                  onViewOutput={setActiveOutput}
                />
              </div>

              {completedJobs.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">Artifacts</h3>
                  <ul className="space-y-2">
                    {completedJobs.map(job => (
                      <li
                        key={job.id}
                        onClick={() => setActiveOutput(job)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-sm cursor-pointer transition ${
                          activeOutput?.id === job.id
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : "bg-white border-slate-200 hover:border-indigo-200 text-slate-700"
                        }`}
                      >
                        <span className="font-medium">{JOB_TYPE_LABELS[job.type as JobType]}</span>
                        <span className="text-xs text-slate-400 font-mono">
                          {JOB_OUTPUT_FILES[job.type as JobType]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right panel */}
            <div className="lg:col-span-2 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h3 className="text-xs font-bold uppercase text-slate-400">
                  {activeOutput
                    ? `Preview: ${JOB_TYPE_LABELS[activeOutput.type as JobType]}`
                    : "Output Preview"}
                </h3>
                {activeOutput && (
                  <a
                    href={api.outputs.url(idea.id, JOB_OUTPUT_FILES[activeOutput.type as JobType])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Open in new tab ↗
                  </a>
                )}
              </div>

              <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                {!activeOutput ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                    {idea.status === "generating" ? (
                      <>
                        <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                        <span>Generating…</span>
                      </>
                    ) : (
                      <span>No output available yet</span>
                    )}
                  </div>
                ) : activeOutput.type === "ui" ? (
                  <iframe
                    src={api.outputs.url(idea.id, JOB_OUTPUT_FILES.ui)}
                    className="w-full h-full"
                    sandbox="allow-scripts"
                    title="UI Preview"
                    style={{ minHeight: "400px" }}
                  />
                ) : (
                  <OutputViewer
                    url={api.outputs.url(idea.id, JOB_OUTPUT_FILES[activeOutput.type as JobType])}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OutputViewer({ url }: { url: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error("Not found");
        return r.text();
      })
      .then(text => { setContent(text); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [url]);

  if (loading) return (
    <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading…</div>
  );
  if (error) return (
    <div className="h-full flex items-center justify-center text-red-400 text-sm">Failed to load file</div>
  );

  return (
    <pre className="h-full overflow-auto p-4 text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-wrap">
      {content}
    </pre>
  );
}
