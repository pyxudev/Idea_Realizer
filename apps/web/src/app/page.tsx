"use client";
import { useState, useEffect, useCallback } from "react";
import type { IdeaWithJobs, CreateIdeaRequest } from "@ai-dashboard/shared";
import { api } from "@/lib/api";
import { StatsBar } from "@/components/StatsBar";
import { StatusBadge } from "@/components/StatusBadge";
import { NewIdeaModal } from "@/components/NewIdeaModal";
import { IdeaDetailModal } from "@/components/IdeaDetailModal";

export default function DashboardPage() {
  const [ideas, setIdeas] = useState<IdeaWithJobs[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<IdeaWithJobs | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [ideasData, statsData] = await Promise.all([
        api.ideas.list(),
        api.ideas.stats(),
      ]);
      setIdeas(ideasData);
      setStats(statsData);
      // Refresh selected idea if it's generating
      if (selected) {
        const fresh = ideasData.find(i => i.id === selected.id);
        if (fresh) setSelected(fresh);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    refresh();
    // Poll every 5s while any idea is generating
    const interval = setInterval(() => {
      const hasActive = ideas.some(i => i.status === "generating" || i.status === "created");
      if (hasActive) refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [ideas, refresh]);

  async function handleCreate(req: CreateIdeaRequest) {
    const idea = await api.ideas.create(req);
    setIdeas(prev => [idea, ...prev]);
    setStats(prev => ({ ...prev, total: (prev.total ?? 0) + 1, generating: (prev.generating ?? 0) + 1 }));
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString("ja-JP", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function getActiveJobLabel(idea: IdeaWithJobs): string {
    const running = idea.jobs.find(j => j.status === "running");
    if (running) return `Generating (${running.type})`;
    return "";
  }

  return (
    <>
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight">Idea Realizer</h1>
            <p className="text-xs text-slate-400">Idea → Proposal → Spec → UI → Code</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Worker Active
          </span>
          <button
            onClick={() => setShowNew(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            New Idea
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <StatsBar stats={stats} />

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Ideas</h2>
            <button
              onClick={refresh}
              className="text-xs text-slate-400 hover:text-slate-600 transition flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>
          ) : ideas.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-slate-400 text-sm mb-4">No ideas yet. Create your first one!</p>
              <button onClick={() => setShowNew(true)} className="text-indigo-600 text-sm font-semibold hover:underline">
                + New Idea
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-3 font-semibold">ID</th>
                    <th className="px-6 py-3 font-semibold">Title</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold">Provider</th>
                    <th className="px-6 py-3 font-semibold">Created</th>
                    <th className="px-6 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {ideas.map(idea => (
                    <tr key={idea.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">
                        #{idea.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 text-sm">{idea.title}</p>
                        <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{idea.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={idea.status} />
                        {getActiveJobLabel(idea) && (
                          <p className="text-xs text-blue-500 mt-1">{getActiveJobLabel(idea)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {idea.ai_provider}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">{formatDate(idea.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelected(idea)}
                          className="text-indigo-600 hover:text-indigo-900 font-semibold text-sm transition"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showNew && (
        <NewIdeaModal onClose={() => setShowNew(false)} onSubmit={handleCreate} />
      )}

      {selected && (
        <IdeaDetailModal
          idea={selected}
          onClose={() => setSelected(null)}
          onRetried={refresh}
        />
      )}
    </>
  );
}
