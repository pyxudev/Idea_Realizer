import clsx from "clsx";
import type { IdeaStatus, JobStatus } from "@ai-dashboard/shared";

const STATUS_CONFIG: Record<string, { label: string; classes: string; dot: string }> = {
  created:    { label: "Created",    classes: "bg-slate-100 text-slate-600",     dot: "bg-slate-400" },
  generating: { label: "Generating", classes: "bg-blue-100 text-blue-700",       dot: "bg-blue-500 animate-pulse" },
  pending:    { label: "Pending",    classes: "bg-amber-100 text-amber-700",     dot: "bg-amber-400" },
  completed:  { label: "Completed",  classes: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  error:      { label: "Error",      classes: "bg-red-100 text-red-700",         dot: "bg-red-500" },
  running:    { label: "Running",    classes: "bg-blue-100 text-blue-700",       dot: "bg-blue-500 animate-pulse" },
  failed:     { label: "Failed",     classes: "bg-red-100 text-red-700",         dot: "bg-red-500" },
};

interface Props { status: IdeaStatus | JobStatus; size?: "sm" | "md" }

export function StatusBadge({ status, size = "md" }: Props) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.created;
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full font-medium",
      cfg.classes, size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs")}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}
