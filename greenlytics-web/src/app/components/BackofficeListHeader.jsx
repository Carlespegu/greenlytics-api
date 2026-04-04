export default function BackofficeListHeader({
  title,
  total = 0,
  showNewButton = false,
  newLabel = 'Nou',
  onNew,
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">
          Resultats: {total}
        </p>
      </div>

      {showNewButton ? (
        <button
          type="button"
          onClick={onNew}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          {newLabel}
        </button>
      ) : null}
    </div>
  )
}
