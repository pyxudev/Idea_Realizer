interface Props {
  stats: Record<string, number>;
}

export function StatsBar({ stats }: Props) {
  const cards = [
    { label: "Total Ideas",  value: stats.total      ?? 0, color: "text-slate-900" },
    { label: "Generating",   value: stats.generating ?? 0, color: "text-blue-600" },
    { label: "Completed",    value: stats.completed  ?? 0, color: "text-emerald-600" },
    { label: "Errors",       value: stats.error      ?? 0, color: "text-red-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map(card => (
        <div key={card.label} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{card.label}</p>
          <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
