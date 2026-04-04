import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CollapsibleFiltersCard from '../components/CollapsibleFiltersCard'
import CompactPagination from '../components/CompactPagination'
import BackofficeListHeader from '../components/BackofficeListHeader'
import BackofficeFilterInput from '../components/BackofficeFilterInput'
import BackofficeFilterActions from '../components/BackofficeFilterActions'
import BackofficeTableActionsDropdown from '../components/BackofficeTableActionsDropdown'
import StatusBadge from '../components/StatusBadge'
import { readingsService } from '../services/readingsService'

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function buildAlertsFromReadings(readings) {
  const alerts = []

  readings.forEach((reading) => {
    const base = {
      id: `${reading.id}`,
      created_at: reading.ts,
      device_name: reading.device_name,
      device_id: reading.device_id,
      status: 'Open',
    }

    if (reading.soil_percent !== null && reading.soil_percent !== undefined && Number(reading.soil_percent) < 30) {
      alerts.push({
        ...base,
        id: `${reading.id}-soil`,
        title: 'Humitat baixa',
        level: Number(reading.soil_percent) < 20 ? 'Critical' : 'Warning',
        message: `La humitat del sòl és ${reading.soil_percent}%.`,
      })
    }

    if (reading.temp_c !== null && reading.temp_c !== undefined && Number(reading.temp_c) > 35) {
      alerts.push({
        ...base,
        id: `${reading.id}-temp`,
        title: 'Temperatura alta',
        level: 'Warning',
        message: `La temperatura és ${reading.temp_c} °C.`,
      })
    }

    if (reading.status && String(reading.status).toLowerCase() === 'offline') {
      alerts.push({
        ...base,
        id: `${reading.id}-offline`,
        title: 'Device offline',
        level: 'Critical',
        message: 'El dispositiu informa estat offline.',
      })
    }
  })

  return alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export default function AlertsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const deviceNameFromQuery = searchParams.get('deviceName') || ''
  const emptyFilters = { title: '', deviceName: deviceNameFromQuery, level: '', status: '', fromDate: '', toDate: '' }

  const [allItems, setAllItems] = useState([])
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(emptyFilters)
  const [draftFilters, setDraftFilters] = useState(emptyFilters)

  const activeFilterCount = useMemo(() => Object.values(filters).filter((value) => value !== '').length, [filters])

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const data = await readingsService.listReadings(400)
        setAllItems(buildAlertsFromReadings(Array.isArray(data) ? data : []))
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
    if (filters.title) filtered = filtered.filter((item) => String(item.title || '').toLowerCase().includes(filters.title.toLowerCase()))
    if (filters.deviceName) filtered = filtered.filter((item) => String(item.device_name || '').toLowerCase().includes(filters.deviceName.toLowerCase()))
    if (filters.level) filtered = filtered.filter((item) => String(item.level || '').toLowerCase().includes(filters.level.toLowerCase()))
    if (filters.status) filtered = filtered.filter((item) => String(item.status || '').toLowerCase().includes(filters.status.toLowerCase()))
    if (filters.fromDate) {
      const from = new Date(filters.fromDate)
      filtered = filtered.filter((item) => item.created_at ? new Date(item.created_at) >= from : false)
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate)
      to.setHours(23, 59, 59, 999)
      filtered = filtered.filter((item) => item.created_at ? new Date(item.created_at) <= to : false)
    }
    setTotal(filtered.length)
    const start = (page - 1) * pageSize
    setItems(filtered.slice(start, start + pageSize))
  }, [allItems, filters, page, pageSize])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setDraftFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleSearch(event) {
    event.preventDefault()
    setPage(1)
    setFilters(draftFilters)
  }

  function handleClearFilters() {
    const reset = { title: '', deviceName: '', level: '', status: '', fromDate: '', toDate: '' }
    setPage(1)
    setDraftFilters(reset)
    setFilters(reset)
  }

  return (
    <div className="space-y-6">
      <CollapsibleFiltersCard title="Filtres" description="Ajusta criteris per localitzar alertes més ràpidament." activeCount={activeFilterCount} defaultExpanded={Boolean(deviceNameFromQuery)}>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <BackofficeFilterInput name="title" value={draftFilters.title} onChange={handleFilterChange} placeholder="Títol / alerta" />
            <BackofficeFilterInput name="deviceName" value={draftFilters.deviceName} onChange={handleFilterChange} placeholder="Nom dispositiu" />
            <BackofficeFilterInput name="level" value={draftFilters.level} onChange={handleFilterChange} placeholder="Nivell" />
            <BackofficeFilterInput name="status" value={draftFilters.status} onChange={handleFilterChange} placeholder="Status" />
            <label className="space-y-2 text-sm text-slate-700">
              <span>Des de</span>
              <BackofficeFilterInput type="date" name="fromDate" value={draftFilters.fromDate} onChange={handleFilterChange} />
            </label>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Fins a</span>
              <BackofficeFilterInput type="date" name="toDate" value={draftFilters.toDate} onChange={handleFilterChange} />
            </label>
          </div>
          <BackofficeFilterActions onClear={handleClearFilters} disabled={isLoading} />
        </form>
      </CollapsibleFiltersCard>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-visible">
        <BackofficeListHeader title="Llistat d'alertes" total={total} showNewButton onNew={() => navigate('/alerts/new')} />

        {isLoading ? <p className="mt-4 text-sm text-slate-500">Carregant...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 overflow-x-auto">
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
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{formatDate(item.created_at)}</td>
                  <td className="px-3 py-3">{item.title || '-'}</td>
                  <td className="px-3 py-3">{item.device_name || '-'}</td>
                  <td className="px-3 py-3"><StatusBadge value={item.level || '-'} /></td>
                  <td className="px-3 py-3"><StatusBadge value={item.status || '-'} /></td>
                  <td className="px-3 py-3">{item.message || '-'}</td>
                  <td className="px-3 py-3 text-right">
                    <BackofficeTableActionsDropdown
                      item={item}
                      actions={[
                        { key: 'readings', label: 'Veure lectures', onClick: (row) => navigate(`/readings?deviceId=${encodeURIComponent(row.device_id || '')}&deviceName=${encodeURIComponent(row.device_name || '')}`) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {!isLoading && items.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-500">No s’han trobat alertes.</td></tr>
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
          onPageSizeChange={(nextSize) => { setPage(1); setPageSize(nextSize) }}
        />
      </section>
    </div>
  )
}
