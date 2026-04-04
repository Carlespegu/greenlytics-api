export default function BackofficeFilterActions({ disabled = false, onClear }) {
  return (
    <div className="flex justify-end gap-3">
      <button
        type="submit"
        disabled={disabled}
        className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: 'var(--brand-primary)' }}
      >
        Cercar
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onClear}
        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Netejar filtres
      </button>
    </div>
  )
}
