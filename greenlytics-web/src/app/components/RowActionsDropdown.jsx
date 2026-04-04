import { useEffect, useRef, useState } from 'react'

export default function RowActionsDropdown({
  actions = [],
  disabled = false,
  label = 'Accions',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const visibleActions = actions.filter((action) => !action.hidden)

  useEffect(() => {
    function handleClickOutside(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleAction(callback) {
    setIsOpen(false)
    if (typeof callback === 'function') {
      callback()
    }
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left overflow-visible">
      <button
        type="button"
        disabled={disabled || visibleActions.length === 0}
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          {visibleActions.map((action) => (
            <button
              key={action.key || action.label}
              type="button"
              onClick={() => handleAction(action.onClick)}
              disabled={action.disabled}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
