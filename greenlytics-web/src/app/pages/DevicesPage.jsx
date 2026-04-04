import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CollapsibleFiltersCard from '../components/CollapsibleFiltersCard'
import CompactPagination from '../components/CompactPagination'
import BackofficeListHeader from '../components/BackofficeListHeader'
import DeviceFilters from '../components/DeviceFilters'
import DeviceActionsDropdown from '../components/DeviceActionsDropdown'
import DeviceEditModal from '../components/DeviceEditModal'
import { devicesService } from '../services/devicesService'

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

function normalizeDevice(device) {
  return {
    id: device.id,
    device_type_id: device.device_type_id || '',
    code: device.code || '',
    name: device.name || '',
    description: device.description || '',
    serial_number: device.serial_number || '',
    mac_address: device.mac_address || '',
    firmware_version: device.firmware_version || '',
    hardware_version: device.hardware_version || '',
    api_key: device.api_key || '',
    wifi_name: device.wifi_name || '',
    wifi_password: device.wifi_password || '',
    status: device.status || '',
    last_seen_on: device.last_seen_on || null,
    is_active: Boolean(device.is_active),
    modified_by: device.modified_by || '',
  }
}

function buildVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages]
}

export default function DevicesPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [activeFilters, setActiveFilters] = useState({
    code: '',
    name: '',
    serial_number: '',
    description: '',
    device_type_id: '',
    status: '',
    is_active: '',
  })

  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).filter((value) => value !== '').length
  }, [activeFilters])

  const totalPages = useMemo(() => {
    const pages = Math.ceil((total || 0) / pageSize)
    return Math.max(1, pages || 1)
  }, [total, pageSize])

  const visiblePages = useMemo(() => {
    return buildVisiblePages(page, totalPages)
  }, [page, totalPages])

  async function loadDevices({
    filters = activeFilters,
    targetPage = page,
    targetPageSize = pageSize,
  } = {}) {
    setIsLoading(true)
    setError('')

    try {
      const payload = await devicesService.searchDevices(filters, {
        page: targetPage,
        pageSize: targetPageSize,
      })

      setItems(payload.items || [])
      setTotal(payload.total || payload.items?.length || 0)
      setPage(payload.page || targetPage)
      setPageSize(payload.page_size || payload.pageSize || targetPageSize)
    } catch (err) {
      setError(err.message || 'No s’han pogut carregar els dispositius.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDevices()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSearch(filters) {
    setActiveFilters(filters)
    await loadDevices({ filters, targetPage: 1 })
  }

  async function handleReset() {
    const emptyFilters = {
      code: '',
      name: '',
      serial_number: '',
      description: '',
      device_type_id: '',
      status: '',
      is_active: '',
    }
    setActiveFilters(emptyFilters)
    await loadDevices({ filters: emptyFilters, targetPage: 1 })
  }

  function handleEdit(device) {
    setSelectedDevice(normalizeDevice(device))
    setIsEditOpen(true)
  }

  async function handleSaveDevice(formData) {
    if (!selectedDevice?.id) return

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await devicesService.updateDevice(selectedDevice.id, {
        ...normalizeDevice(selectedDevice),
        ...formData,
      })

      setSuccess('Dispositiu actualitzat correctament.')
      setIsEditOpen(false)
      setSelectedDevice(null)
      await loadDevices()
    } catch (err) {
      setError(err.message || 'No s’ha pogut actualitzar el dispositiu.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleActive(device) {
    const nextValue = !device.is_active
    const confirmed = window.confirm(
      nextValue
        ? 'Vols activar aquest dispositiu?'
        : 'Vols desactivar aquest dispositiu?'
    )

    if (!confirmed) return

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await devicesService.updateDevice(device.id, {
        ...normalizeDevice(device),
        is_active: nextValue,
      })

      setSuccess(
        nextValue
          ? 'Dispositiu activat correctament.'
          : 'Dispositiu desactivat correctament.'
      )

      await loadDevices()
    } catch (err) {
      setError(err.message || 'No s’ha pogut actualitzar l’estat del dispositiu.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleGoToReadings(device) {
    navigate(`/readings?deviceId=${encodeURIComponent(device.id)}&deviceName=${encodeURIComponent(device.name || '')}`)
  }

  return (
    <div className="space-y-6">
      <CollapsibleFiltersCard
        title="Filtres"
        description="Ajusta criteris per localitzar dispositius més ràpidament."
        activeCount={activeFilterCount}
        defaultExpanded={false}
      >
        <DeviceFilters
          initialFilters={activeFilters}
          onSearch={handleSearch}
          onReset={handleReset}
          disabled={isLoading || isSaving}
        />
      </CollapsibleFiltersCard>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-visible">
        <BackofficeListHeader
          title="Llistat de dispositius"
          total={total}
          showNewButton
          onNew={() => navigate('/devices/new')}
        />

        {isLoading ? <p className="mt-4 text-sm text-slate-500">Carregant...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mt-4 text-sm text-emerald-600">{success}</p> : null}

        <div className="mt-4 overflow-visible">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3">Nom</th>
                <th className="px-3 py-3">Codi</th>
                <th className="px-3 py-3">Serial</th>
                <th className="px-3 py-3">MAC</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Actiu</th>
                <th className="px-3 py-3">Last seen</th>
                <th className="px-3 py-3 text-right">Accions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{item.name || '-'}</td>
                  <td className="px-3 py-3">{item.code || '-'}</td>
                  <td className="px-3 py-3">{item.serial_number || '-'}</td>
                  <td className="px-3 py-3">{item.mac_address || '-'}</td>
                  <td className="px-3 py-3">{item.status || '-'}</td>
                  <td className="px-3 py-3">{item.is_active ? 'Sí' : 'No'}</td>
                  <td className="px-3 py-3">{formatDate(item.last_seen_on)}</td>
                  <td className="px-3 py-3 text-right">
                    <DeviceActionsDropdown
                      device={item}
                      onEdit={handleEdit}
                      onToggleActive={handleToggleActive}
                      onGoToReadings={handleGoToReadings}
                      disabled={isSaving}
                    />
                  </td>
                </tr>
              ))}

              {!isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                    No s’han trobat dispositius.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">Files</label>
            <select
              value={pageSize}
              onChange={(event) => {
                const nextPageSize = Number(event.target.value)
                loadDevices({ targetPage: 1, targetPageSize: nextPageSize })
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => loadDevices({ targetPage: page - 1 })}
              disabled={page <= 1 || isLoading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Pàgina anterior"
              title="Pàgina anterior"
            >
              ‹
            </button>

            {visiblePages.map((pageItem, index) =>
              pageItem === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-sm text-slate-400"
                >
                  …
                </span>
              ) : (
                <button
                  key={pageItem}
                  onClick={() => loadDevices({ targetPage: pageItem })}
                  disabled={isLoading}
                  className={[
                    'inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-medium transition',
                    pageItem === page
                      ? 'text-white shadow-sm'
                      : 'border border-transparent bg-white text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                  style={pageItem === page ? { backgroundColor: 'var(--brand-primary)' } : undefined}
                >
                  {pageItem}
                </button>
              )
            )}

            <button
              onClick={() => loadDevices({ targetPage: page + 1 })}
              disabled={page >= totalPages || isLoading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Pàgina següent"
              title="Pàgina següent"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      <DeviceEditModal
        isOpen={isEditOpen}
        device={selectedDevice}
        onClose={() => {
          if (isSaving) return
          setIsEditOpen(false)
          setSelectedDevice(null)
        }}
        onSave={handleSaveDevice}
        isSaving={isSaving}
      />
    </div>
  )
}
