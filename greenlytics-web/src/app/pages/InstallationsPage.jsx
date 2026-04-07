import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CollapsibleFiltersCard from '../components/CollapsibleFiltersCard'
import CompactPagination from '../components/CompactPagination'
import BackofficeListHeader from '../components/BackofficeListHeader'
import { resourceService } from '../services/resourceService'

function FilterInput({ name, value, onChange, placeholder }) {
  return (
    <input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
    />
  )
}

function TriStateSwitch({ value, onChange }) {
  function handleClick() {
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

  const label =
    value === true ? 'Sí' : value === false ? 'No' : 'Tots'

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={value === true}
        aria-label={`Actiu: ${label}`}
        onClick={handleClick}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${bgClass}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${thumbClass}`}
        />
      </button>
      <span className="text-sm text-slate-700">{label}</span>
    </div>
  )
}

const EMPTY_FILTERS = { name: '', state: '', code: '', is_active: null }

export default function InstallationsPage() {
  const navigate = useNavigate()
  const [allItems, setAllItems] = useState([])
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS)

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value !== '' && value !== null).length,
    [filters]
  )

  useEffect(() => {
    async function load() {
      try {
        const data = await resourceService.listInstallations()
        setAllItems(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'No s’han pogut carregar les instal·lacions.')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    let filtered = [...allItems]

    if (appliedFilters.name) {
      filtered = filtered.filter((item) =>
        String(item.name || '').toLowerCase().includes(appliedFilters.name.toLowerCase())
      )
    }

    if (appliedFilters.state) {
      filtered = filtered.filter((item) =>
        String(item.state || '').toLowerCase().includes(appliedFilters.state.toLowerCase())
      )
    }

    if (appliedFilters.code) {
      filtered = filtered.filter((item) =>
        String(item.code || '').toLowerCase().includes(appliedFilters.code.toLowerCase())
      )
    }

    if (appliedFilters.is_active !== null) {
      filtered = filtered.filter((item) => Boolean(item.is_active) === appliedFilters.is_active)
    }

    setTotal(filtered.length)
    const start = (page - 1) * pageSize
    setItems(filtered.slice(start, start + pageSize))
  }, [allItems, appliedFilters, page, pageSize])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleSearch(event) {
    event.preventDefault()
    setPage(1)
    setAppliedFilters(filters)
  }

  function handleClear() {
    setPage(1)
    setFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
  }

  return (
    <div className="space-y-6">
      <CollapsibleFiltersCard
        title="Filtres"
        description="Llistat d’instal·lacions"
        activeCount={activeFilterCount}
        defaultExpanded={false}
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterInput name="name" value={filters.name} onChange={handleFilterChange} placeholder="Nom" />
            <FilterInput name="state" value={filters.state} onChange={handleFilterChange} placeholder="Ubicació" />
            <FilterInput name="code" value={filters.code} onChange={handleFilterChange} placeholder="Codi" />

            <div className="space-y-2 text-sm text-slate-700">
              <span className="block">Actiu</span>
              <TriStateSwitch
                value={filters.is_active}
                onChange={(value) => setFilters((prev) => ({ ...prev, is_active: value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              Cercar
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Netejar filtres
            </button>
          </div>
        </form>
      </CollapsibleFiltersCard>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <BackofficeListHeader
          title="Llistat d’instal·lacions"
          total={total}
          showNewButton
          onNew={() => navigate('/installations/new')}
        />

        {isLoading ? <p className="mt-4 text-sm text-slate-500">Carregant...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3">Nom</th>
                <th className="px-3 py-3">Code</th>
                <th className="px-3 py-3">Ubicació</th>
                <th className="px-3 py-3">Latitut</th>
                <th className="px-3 py-3">Longitut</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{item.name || '-'}</td>
                  <td className="px-3 py-3">{item.code || '-'}</td>
                  <td className="px-3 py-3">{item.state || '-'}</td>
                  <td className="px-3 py-3">{item.latitude || '-'}</td>
                  <td className="px-3 py-3">{item.longitude || '-'}</td>
                </tr>
              ))}

              {!isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    No s’han trobat instal·lacions.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <CompactPagination
          page={page}
          pageSize={pageSize}
          total={total}
          isLoading={isLoading}
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPage(1)
            setPageSize(nextSize)
          }}
        />
      </section>
    </div>
  )
}
