const COLOR_MAP = {
  ok: 'bg-emerald-50 text-emerald-700',
  online: 'bg-emerald-50 text-emerald-700',
  active: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  critical: 'bg-red-50 text-red-700',
  error: 'bg-red-50 text-red-700',
  offline: 'bg-slate-100 text-slate-700',
  inactive: 'bg-slate-100 text-slate-700',
}

export default function StatusBadge({ value }) {
  if (!value) return <span className="text-slate-400">-</span>
  const normalized = String(value).trim().toLowerCase()
  const colorClass = COLOR_MAP[normalized] || 'bg-slate-100 text-slate-700'

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${colorClass}`}>
      {String(value)}
    </span>
  )
}
