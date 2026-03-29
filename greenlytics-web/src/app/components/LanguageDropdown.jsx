import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

const languages = [
  { code: 'ca', short: 'CA', label: 'Català' },
  { code: 'es', short: 'ES', label: 'Castellano' },
  { code: 'en', short: 'EN', label: 'English' },
]

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function LanguageBadge({ short }) {
  return (
    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-emerald-100 px-2 text-xs font-semibold text-emerald-800">
      {short}
    </span>
  )
}

export default function LanguageDropdown() {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  const current =
    languages.find((item) => item.code === language) || languages[0]

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function handleSelect(code) {
    setLanguage(code)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('selectLanguage')}
        title={t('selectLanguage')}
      >
        <LanguageBadge short={current.short} />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronIcon />
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-20 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          {languages.map((item) => {
            const isActive = item.code === language

            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                className={[
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition',
                  isActive
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-slate-700 hover:bg-slate-50',
                ].join(' ')}
              >
                <LanguageBadge short={item.short} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}