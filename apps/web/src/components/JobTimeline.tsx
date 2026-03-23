import clsx from "clsx";
import type { Job, JobType } from "@ai-dashboard/shared";
import { JOB_SEQUENCE } from "@ai-dashboard/shared";

const JOB_ICONS: Record<JobType, string> = {
  proposal: "📋",
  spec: "⚙️",
  ui: "🎨",
  implementation: "💻",
};

const JOB_LABELS: Record<JobType, string> = {
  proposal: "Proposal",
  spec: "Specification",
  ui: "UI Preview",
  implementation: "Implementation",
};

interface Props {
  jobs: Job[];
  onRetry?: (jobId: string) => void;
  onViewOutput?: (job: Job) => void;
}

export function JobTimeline({ jobs, onRetry, onViewOutput }: Props) {
  const jobMap = new Map(jobs.map((j) => [j.type, j]));

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
      <ol className="space-y-4">
        {JOB_SEQUENCE.map((type, i) => {
          const job = jobMap.get(type);
          const status = job?.status ?? "pending";
          const isDone = status === "completed";
          const isRunning = status === "running";
          const isFailed = status === "failed";

          return (
            <li key={type} className="flex items-start gap-4 relative">
              {/* Circle */}
              <div className={clsx(
                "relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 text-base",
                isDone  && "border-emerald-400 bg-emerald-50",
                isRunning && "border-blue-400 bg-blue-50 animate-pulse",
                isFailed  && "border-red-400 bg-red-50",
                !isDone && !isRunning && !isFailed && "border-slate-200 bg-white"
              )}>
                {JOB_ICONS[type]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={clsx("text-sm font-semibold",
                    isDone ? "text-slate-800" : "text-slate-500")}>
                    {JOB_LABELS[type]}
                  </span>
                  <div className="flex items-center gap-2">
                    {isFailed && onRetry && job && (
                      <button
                        onClick={() => onRetry(job.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold underline"
                      >
                        Retry
                      </button>
                    )}
                    {isDone && onViewOutput && job && (
                      <button
                        onClick={() => onViewOutput(job)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
                {job?.error_message && (
                  <p className="mt-0.5 text-xs text-red-500 truncate">{job.error_message}</p>
                )}
                {job?.output_path && isDone && (
                  <p className="mt-0.5 text-xs text-slate-400 font-mono truncate">{job.output_path.split("/").slice(-2).join("/")}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
