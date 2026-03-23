"use client";
import { useState } from "react";
import type { AIProviderType, CreateIdeaRequest } from "@ai-dashboard/shared";

const PROVIDERS: { value: AIProviderType; label: string }[] = [
  { value: "openai",  label: "OpenAI (GPT-4o)" },
  { value: "claude",  label: "Claude 3.5 Sonnet" },
  { value: "gemini",  label: "Gemini Pro" },
  { value: "ollama",  label: "Ollama (Local)" },
];

interface Props {
  onClose: () => void;
  onSubmit: (req: CreateIdeaRequest) => Promise<void>;
}

export function NewIdeaModal({ onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [provider, setProvider] = useState<AIProviderType>("openai");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), ai_provider: provider });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create idea");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 z-10">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Register New Idea</h2>
        <p className="text-sm text-slate-500 mb-6">AI will generate proposal → spec → UI → implementation</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. AI-powered recipe generator"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe your idea in detail. The more context, the better the output."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">AI Provider</label>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value as AIProviderType)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition bg-white"
              disabled={loading}
            >
              {PROVIDERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Creating…" : "Create & Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
