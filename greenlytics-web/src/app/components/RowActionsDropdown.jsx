import { useEffect, useRef, useState } from 'react'

export default function RowActionsDropdown({ actions = [], disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (!containerRef.current?.contains(event.target)) {
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

  const visibleActions = actions.filter((action) => !action.hidden)

  return (
    <div ref={containerRef} className="relative inline-flex justify-end text-left">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-lg text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        ⋯
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-11 z-50 min-w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-lg">
          {visibleActions.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={action.disabled}
              onClick={() => {
                setIsOpen(false)
                action.onClick?.()
              }}
              className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
