import { useMemo } from 'react'
import { useLanguage } from '../context/LanguageContext'

export default function BackofficeListHeader({
  title,
  total = 0,
  showNewButton = false,
  newLabel = '',
  onNew,
  newDisabled = false,
}) {
  const { language } = useLanguage()
  const text = useMemo(() => {
    const texts = {
      ca: { results: 'Resultats', newLabel: 'Nou' },
      es: { results: 'Resultados', newLabel: 'Nuevo' },
      en: { results: 'Results', newLabel: 'New' },
    }

    return texts[language] || texts.ca
  }, [language])

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {text.results}: {total}
        </p>
      </div>

      {showNewButton ? (
        <button
          type="button"
          onClick={onNew}
          disabled={newDisabled}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          {newLabel || text.newLabel}
        </button>
      ) : null}
    </div>
  )
}
