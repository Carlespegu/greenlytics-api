import { useMemo, useState } from 'react'

export default function CollapsibleFiltersCard({
  title = 'Filtres',
  description = 'Ajusta criteris de cerca per refinar el llistat.',
  activeCount = 0,
  defaultExpanded = false,
  children,
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const badgeLabel = useMemo(() => {
    return activeCount === 1 ? '1 filtre actiu' : `${activeCount} filtres actius`
  }, [activeCount])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
            <span className="font-medium text-slate-900">{badgeLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {isExpanded ? 'Amagar filtres' : 'Mostrar filtres'}
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div className="mt-5 border-t border-slate-200 pt-5">
          {children}
        </div>
      ) : null}
    </section>
  )
}
