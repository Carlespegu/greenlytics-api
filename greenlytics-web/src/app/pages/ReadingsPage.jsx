import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CollapsibleFiltersCard from '../components/CollapsibleFiltersCard'
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

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

export default function ReadingsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const deviceNameFromQuery = searchParams.get('deviceName') || ''

  const [allItems, setAllItems] = useState([])
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const initialFilters = {
    deviceName: deviceNameFromQuery,
    installationName: '',
    status: '',
    fromDate: '',
    toDate: '',
  }

  const [filters, setFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((value) => value !== '').length
  }, [filters])

  const totalPages = useMemo(() => {
    const pages = Math.ceil((total || 0) / pageSize)
    return Math.max(1, pages || 1)
  }, [total, pageSize])

  const visiblePages = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
    if (page <= 4) return [1, 2, 3, 4, 5, 'ellipsis', totalPages]
    if (page >= totalPages - 3) return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages]
  }, [page, totalPages])

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const data = await resourceService.listReadings()
        setAllItems(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'No s’han pogut carregar les lectures.')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    let filtered = [...allItems]

    if (appliedFilters.deviceName) {
      filtered = filtered.filter((item) =>
        String(item.device_name || '').toLowerCase().includes(appliedFilters.deviceName.toLowerCase())
      )
    }

    if (appliedFilters.installationName) {
      filtered = filtered.filter((item) =>
        String(item.installation_name || '').toLowerCase().includes(appliedFilters.installationName.toLowerCase())
      )
    }

    if (appliedFilters.status) {
      filtered = filtered.filter((item) =>
        String(item.status || '').toLowerCase().includes(appliedFilters.status.toLowerCase())
      )
    }

    if (appliedFilters.fromDate) {
      const from = new Date(appliedFilters.fromDate)
      filtered = filtered.filter((item) => {
        const value = item.created_at
        return value ? new Date(value) >= from : false
      })
    }

    if (appliedFilters.toDate) {
      const to = new Date(appliedFilters.toDate)
      to.setHours(23, 59, 59, 999)
      filtered = filtered.filter((item) => {
        const value = item.created_at
        return value ? new Date(value) <= to : false
      })
    }

    setTotal(filtered.length)
    const start = (page - 1) * pageSize
    setItems(filtered.slice(start, start + pageSize))
  }, [allItems, appliedFilters, page, pageSize])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setPage(1)
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleSearch(event) {
    event.preventDefault()
    setPage(1)
    setAppliedFilters(filters)
  }

  function handleClearFilters() {
    const emptyFilters = {
      deviceName: '',
      installationName: '',
      status: '',
      fromDate: '',
      toDate: '',
    }
    setPage(1)
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
  }

  return (
    <div className="space-y-6">
      <CollapsibleFiltersCard
        title="Filtres"
        description="Ajusta criteris per localitzar lectures més ràpidament."
        activeCount={activeFilterCount}
        defaultExpanded={Boolean(deviceNameFromQuery)}
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterInput name="deviceName" value={filters.deviceName} onChange={handleFilterChange} placeholder="Nom dispositiu" />
            <FilterInput name="installationName" value={filters.installationName} onChange={handleFilterChange} placeholder="Instal·lació" />
            <FilterInput name="status" value={filters.status} onChange={handleFilterChange} placeholder="Status" />
            <label className="space-y-2 text-sm text-slate-700">
              <span>Des de</span>
              <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Fins a</span>
              <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400" />
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button type="submit" className="rounded-xl px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
              Cercar
            </button>
            <button type="button" onClick={handleClearFilters} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Netejar filtres
            </button>
          </div>
        </form>
      </CollapsibleFiltersCard>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <BackofficeListHeader
          title="Llistat de lectures"
          total={total}
          showNewButton
          onNew={() => navigate('/readings/new')}
        />

        {isLoading ? <p className="mt-4 text-sm text-slate-500">Carregant...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3">Data lectura</th>
                <th className="px-3 py-3">Nom dispositiu</th>
                <th className="px-3 py-3">Instal·lació</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Temperatura</th>
                <th className="px-3 py-3">Humitat</th>
                <th className="px-3 py-3">Llum</th>
                <th className="px-3 py-3">Humutat del sòl</th>
                <th className="px-3 py-3">Pluja</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={`${item.id}-${index}`} className="border-b border-slate-100">
                  <td className="px-3 py-3">{formatDate(item.ts || item.created_on || item.created_at)}</td>
                  <td className="px-3 py-3">{item.device_name || '-'}</td>
                  <td className="px-3 py-3">{item.installation_name || '-'}</td>
                  <td className="px-3 py-3">{item.status || '-'}</td>
                  <td className="px-3 py-3">{item.temp_c ?? item.temperature ?? '-'}</td>
                  <td className="px-3 py-3">{item.hum_air ?? item.humidity ?? '-'}</td>
                  <td className="px-3 py-3">{item.ldr_raw ?? item.light ?? '-'}</td>
                  <td className="px-3 py-3">{item.soil_percent ?? item.humudity_soil ?? '-'}</td>
                  <td className="px-3 py-3">{item.rain ?? '-'}</td>
                </tr>
              ))}

              {!isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-slate-500">
                    No s’han trobat lectures.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">Files</label>
            <select value={pageSize} onChange={(event) => { setPage(1); setPageSize(Number(event.target.value)) }} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setPage(page - 1)} disabled={page <= 1 || isLoading} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">‹</button>
            {visiblePages.map((pageItem, index) => pageItem === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-sm text-slate-400">…</span>
            ) : (
              <button key={pageItem} onClick={() => setPage(pageItem)} disabled={isLoading} className={['inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-medium transition', pageItem === page ? 'text-white shadow-sm' : 'border border-transparent bg-white text-slate-600 hover:bg-slate-50'].join(' ')} style={pageItem === page ? { backgroundColor: 'var(--brand-primary)' } : undefined}>
                {pageItem}
              </button>
            ))}
            <button onClick={() => setPage(page + 1)} disabled={page >= totalPages || isLoading} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50">›</button>
          </div>
        </div>
      </section>
    </div>
  )
}
