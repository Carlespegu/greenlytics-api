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

function formatNumber(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '-'
  return `${value}${suffix}`
}

export default function ReadingsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const deviceIdFromQuery = searchParams.get('deviceId') || ''
  const deviceNameFromQuery = searchParams.get('deviceName') || ''
  const emptyFilters = {
    deviceId: deviceIdFromQuery,
    deviceName: deviceNameFromQuery,
    installationName: '',
    status: '',
    fromDate: '',
    toDate: '',
  }

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

    if (filters.deviceId) {
      filtered = filtered.filter((item) => String(item.device_id || '').toLowerCase().includes(filters.deviceId.toLowerCase()))
    }
    if (filters.deviceName) {
      filtered = filtered.filter((item) => String(item.device_name || '').toLowerCase().includes(filters.deviceName.toLowerCase()))
    }
    if (filters.installationName) {
      filtered = filtered.filter((item) => String(item.installation_name || '').toLowerCase().includes(filters.installationName.toLowerCase()))
    }
    if (filters.status) {
      filtered = filtered.filter((item) => String(item.status || '').toLowerCase().includes(filters.status.toLowerCase()))
    }
    if (filters.fromDate) {
      const from = new Date(filters.fromDate)
      filtered = filtered.filter((item) => item.ts ? new Date(item.ts) >= from : false)
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate)
      to.setHours(23, 59, 59, 999)
      filtered = filtered.filter((item) => item.ts ? new Date(item.ts) <= to : false)
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
    const reset = { ...emptyFilters, deviceId: '', deviceName: '', installationName: '', status: '', fromDate: '', toDate: '' }
    setPage(1)
    setDraftFilters(reset)
    setFilters(reset)
  }

  return (
    <div className="space-y-6">
      <CollapsibleFiltersCard title="Filtres" description="Ajusta criteris per localitzar lectures més ràpidament." activeCount={activeFilterCount} defaultExpanded={Boolean(deviceIdFromQuery)}>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <BackofficeFilterInput name="deviceId" value={draftFilters.deviceId} onChange={handleFilterChange} placeholder="Device ID" />
            <BackofficeFilterInput name="deviceName" value={draftFilters.deviceName} onChange={handleFilterChange} placeholder="Nom dispositiu" />
            <BackofficeFilterInput name="installationName" value={draftFilters.installationName} onChange={handleFilterChange} placeholder="Instal·lació" />
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
        <BackofficeListHeader title="Llistat de lectures" total={total} showNewButton onNew={() => navigate('/readings/new')} />

        {isLoading ? <p className="mt-4 text-sm text-slate-500">Carregant...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3">Data lectura</th>
                <th className="px-3 py-3">Dispositiu</th>
                <th className="px-3 py-3">Instal·lació</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Temperatura</th>
                <th className="px-3 py-3">Humitat aire</th>
                <th className="px-3 py-3">Humitat sòl</th>
                <th className="px-3 py-3">Llum</th>
                <th className="px-3 py-3 text-right">Accions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{formatDate(item.ts)}</td>
                  <td className="px-3 py-3">{item.device_name || item.device_id || '-'}</td>
                  <td className="px-3 py-3">{item.installation_name || '-'}</td>
                  <td className="px-3 py-3"><StatusBadge value={item.status || '-'} /></td>
                  <td className="px-3 py-3">{formatNumber(item.temp_c, ' °C')}</td>
                  <td className="px-3 py-3">{formatNumber(item.hum_air, '%')}</td>
                  <td className="px-3 py-3">{formatNumber(item.soil_percent, '%')}</td>
                  <td className="px-3 py-3">{formatNumber(item.ldr_raw)}</td>
                  <td className="px-3 py-3 text-right">
                    <BackofficeTableActionsDropdown
                      item={item}
                      actions={[
                        { key: 'device', label: 'Veure device', onClick: (row) => row.device_id && navigate(`/devices?highlight=${row.device_id}`) },
                        { key: 'alerts', label: 'Veure alertes', onClick: (row) => navigate(`/alerts?deviceName=${encodeURIComponent(row.device_name || '')}`) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {!isLoading && items.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-slate-500">No s’han trobat lectures.</td></tr>
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
