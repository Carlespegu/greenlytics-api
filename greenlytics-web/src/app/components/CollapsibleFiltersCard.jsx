import { useMemo, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function CollapsibleFiltersCard({
  title = 'Filtres',
  description = 'Ajusta criteris de cerca per refinar el llistat.',
  activeCount = 0,
  defaultExpanded = false,
  children,
}) {
  const { language } = useLanguage()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const text = useMemo(() => {
    const texts = {
      ca: {
        oneActive: '1 filtre actiu',
        manyActive: (count) => `${count} filtres actius`,
        show: 'Mostrar filtres',
        hide: 'Amagar filtres',
      },
      es: {
        oneActive: '1 filtro activo',
        manyActive: (count) => `${count} filtros activos`,
        show: 'Mostrar filtros',
        hide: 'Ocultar filtros',
      },
      en: {
        oneActive: '1 active filter',
        manyActive: (count) => `${count} active filters`,
        show: 'Show filters',
        hide: 'Hide filters',
      },
    }

    return texts[language] || texts.ca
  }, [language])

  const badgeLabel = useMemo(() => {
    return activeCount === 1 ? text.oneActive : text.manyActive(activeCount)
  }, [activeCount, text])

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-[1.85rem] font-semibold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-2 text-sm text-slate-600">
            <span className="font-medium text-slate-900">{badgeLabel}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-50"
            aria-label={isExpanded ? text.hide : text.show}
            title={isExpanded ? text.hide : text.show}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 5h18" />
              <path d="M6 12h12" />
              <path d="M10 19h4" />
            </svg>
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
