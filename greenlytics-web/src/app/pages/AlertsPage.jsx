import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CollapsibleFiltersCard from '../components/CollapsibleFiltersCard'
import CompactPagination from '../components/CompactPagination'
import BackofficeListHeader from '../components/BackofficeListHeader'
import RowActionsDropdown from '../components/RowActionsDropdown'
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

export default function AlertsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const deviceIdFromQuery = searchParams.get('deviceId') || ''
  const deviceNameFromQuery = searchParams.get('deviceName') || ''

  const [allItems, setAllItems] = useState([])
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    title: '',
    deviceId: deviceIdFromQuery,
    deviceName: deviceNameFromQuery,
    level: '',
    status: '',
    fromDate: '',
    toDate: '',
  })

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((value) => value !== '').length
  }, [filters])

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const data = await resourceService.listAlerts()
        setAllItems(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'No s’han pogut carregar les alertes.')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    let filtered = [...allItems]

    if (filters.title) {
      filtered = filtered.filter((item) =>
        String(item.title || item.name || '').toLowerCase().includes(filters.title.toLowerCase())
      )
    }

    if (filters.deviceId) {
      filtered = filtered.filter((item) =>
        String(item.deviceId || item.device_id || '').toLowerCase().includes(filters.deviceId.toLowerCase())
      )
    }

    if (filters.deviceName) {
      filtered = filtered.filter((item) =>
        String(item.deviceName || item.device_name || item.device?.name || '').toLowerCase().includes(filters.deviceName.toLowerCase())
      )
    }

    if (filters.level) {
      filtered = filtered.filter((item) =>
        String(item.level || item.severity || '').toLowerCase().includes(filters.level.toLowerCase())
      )
    }

    if (filters.status) {
      filtered = filtered.filter((item) =>
        String(item.status || '').toLowerCase().includes(filters.status.toLowerCase())
      )
    }

    if (filters.fromDate) {
      const from = new Date(filters.fromDate)
      filtered = filtered.filter((item) => {
        const value = item.created_at || item.createdAt || item.ts
        return value ? new Date(value) >= from : false
      })
    }

    if (filters.toDate) {
      const to = new Date(filters.toDate)
      to.setHours(23, 59, 59, 999)
      filtered = filtered.filter((item) => {
        const value = item.created_at || item.createdAt || item.ts
        return value ? new Date(value) <= to : false
      })
    }

    setTotal(filtered.length)
    const start = (page - 1) * pageSize
    setItems(filtered.slice(start, start + pageSize))
  }, [allItems, filters, page, pageSize])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleSearch(event) {
    event.preventDefault()
    setPage(1)
  }

  function handleClearFilters() {
    setPage(1)
    setFilters({
      title: '',
      deviceId: '',
      deviceName: '',
      level: '',
      status: '',
      fromDate: '',
      toDate: '',
    })
  }

  function handleViewReadings(item) {
    const deviceId = item.deviceId || item.device_id || ''
    const deviceName = item.deviceName || item.device_name || item.device?.name || ''
    navigate(`/readings?deviceId=${encodeURIComponent(deviceId)}&deviceName=${encodeURIComponent(deviceName)}`)
  }

  return (
    <div className="space-y-6">
      <CollapsibleFiltersCard
        title="Filtres"
        description="Ajusta criteris per localitzar alertes més ràpidament."
        activeCount={activeFilterCount}
        defaultExpanded={Boolean(deviceIdFromQuery)}
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterInput name="title" value={filters.title} onChange={handleFilterChange} placeholder="Títol / alerta" />
            <FilterInput name="deviceId" value={filters.deviceId} onChange={handleFilterChange} placeholder="Device ID" />
            <FilterInput name="deviceName" value={filters.deviceName} onChange={handleFilterChange} placeholder="Nom dispositiu" />
            <FilterInput name="level" value={filters.level} onChange={handleFilterChange} placeholder="Nivell" />
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

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-visible">
        <BackofficeListHeader
          title="Llistat d'alertes"
          total={total}
          showNewButton
          onNew={() => navigate('/alerts/new')}
        />

        {isLoading ? <p className="mt-4 text-sm text-slate-500">Carregant...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 overflow-visible">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3">Data</th>
                <th className="px-3 py-3">Títol</th>
                <th className="px-3 py-3">Dispositiu</th>
                <th className="px-3 py-3">Nivell</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Missatge</th>
                <th className="px-3 py-3 text-right">Accions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id || `${item.title || item.name}-${index}`} className="border-b border-slate-100">
                  <td className="px-3 py-3">{formatDate(item.created_at || item.createdAt || item.ts)}</td>
                  <td className="px-3 py-3">{item.title || item.name || '-'}</td>
                  <td className="px-3 py-3">{item.deviceName || item.device_name || item.device?.name || '-'}</td>
                  <td className="px-3 py-3">{item.level || item.severity || '-'}</td>
                  <td className="px-3 py-3">{item.status || '-'}</td>
                  <td className="px-3 py-3">{item.message || item.description || '-'}</td>
                  <td className="px-3 py-3 text-right">
                    <RowActionsDropdown
                      actions={[
                        {
                          key: 'readings',
                          label: 'Veure lectures',
                          onClick: () => handleViewReadings(item),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}

              {!isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    No s’han trobat alertes.
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
