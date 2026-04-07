import { useEffect, useState } from 'react'

function FilterInput({ name, value, onChange, placeholder, disabled = false }) {
  return (
    <input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
    />
  )
}

function TriStateSwitch({ value, onChange, disabled = false }) {
  function handleClick() {
    if (disabled) return

    if (value === null) onChange(true)
    else if (value === true) onChange(false)
    else onChange(null)
  }

  const bgClass =
    value === true
      ? 'bg-emerald-600'
      : value === false
        ? 'bg-slate-500'
        : 'bg-slate-300'

  const thumbClass =
    value === true
      ? 'translate-x-8'
      : value === false
        ? 'translate-x-1'
        : 'translate-x-4'

  const label = value === true ? 'Sí' : value === false ? 'No' : 'Tots'

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={value === true}
        aria-label={`Actiu: ${label}`}
        onClick={handleClick}
        disabled={disabled}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${bgClass} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${thumbClass}`}
        />
      </button>
      <span className="text-sm text-slate-700">{label}</span>
    </div>
  )
}

const EMPTY_FILTERS = {
  code: '',
  name: '',
  serial_number: '',
  description: '',
  device_type_id: '',
  status: '',
  is_active: null,
}

export default function DeviceFilters({
  initialFilters,
  onSearch,
  onReset,
  disabled = false,
}) {
  const [filters, setFilters] = useState(initialFilters ?? EMPTY_FILTERS)

  useEffect(() => {
    setFilters(initialFilters ?? EMPTY_FILTERS)
  }, [initialFilters])

  function handleChange(event) {
    const { name, value } = event.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSearch(filters)
  }

  function handleResetClick() {
    setFilters(EMPTY_FILTERS)
    onReset()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FilterInput
          name="code"
          value={filters.code ?? ''}
          onChange={handleChange}
          placeholder="Codi"
          disabled={disabled}
        />
        <FilterInput
          name="name"
          value={filters.name ?? ''}
          onChange={handleChange}
          placeholder="Nom"
          disabled={disabled}
        />
        <FilterInput
          name="description"
          value={filters.description ?? ''}
          onChange={handleChange}
          placeholder="Descripció"
          disabled={disabled}
        />
        <FilterInput
          name="serial_number"
          value={filters.serial_number ?? ''}
          onChange={handleChange}
          placeholder="Serial"
          disabled={disabled}
        />
        <FilterInput
          name="device_type_id"
          value={filters.device_type_id ?? ''}
          onChange={handleChange}
          placeholder="Tipus dispositiu (ID)"
          disabled={disabled}
        />

        <select
          name="status"
          value={filters.status ?? ''}
          onChange={handleChange}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
        >
          <option value="">Status: tots</option>
          <option value="online">online</option>
          <option value="offline">offline</option>
          <option value="warning">warning</option>
          <option value="error">error</option>
        </select>

        <div className="space-y-2 text-sm text-slate-700">
          <span className="block">Actiu</span>
          <TriStateSwitch
            value={filters.is_active ?? null}
            onChange={(value) => setFilters((prev) => ({ ...prev, is_active: value }))}
            disabled={disabled}
          />
        </div>
      </div>

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
          onClick={handleResetClick}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Netejar filtres
        </button>
      </div>
    </form>
  )
}
