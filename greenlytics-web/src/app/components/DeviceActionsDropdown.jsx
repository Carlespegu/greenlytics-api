import { useEffect, useRef, useState } from 'react'

export default function DeviceActionsDropdown({
  device,
  onEdit,
  onToggleActive,
  onGoToReadings,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

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
    callback(device)
  }

  return (
    <div ref={containerRef} className="relative inline-block text-left overflow-visible">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Accions
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          <button
            type="button"
            onClick={() => handleAction(onEdit)}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => handleAction(onToggleActive)}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            {device.is_active ? 'Desactivar' : 'Activar'}
          </button>

          <button
            type="button"
            onClick={() => handleAction(onGoToReadings)}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            Lectures
          </button>
        </div>
      ) : null}
    </div>
  )
}
