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
            {isExpanded ? text.hide : text.show}
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
