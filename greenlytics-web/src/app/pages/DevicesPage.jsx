import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CollapsibleFiltersCard from '../components/CollapsibleFiltersCard'
import CompactPagination from '../components/CompactPagination'
import BackofficeListHeader from '../components/BackofficeListHeader'
import DeviceFilters from '../components/DeviceFilters'
import DeviceEditModal from '../components/DeviceEditModal'
import LoadingOverlay from '../components/LoadingOverlay'
import RowActionsDropdown from '../components/RowActionsDropdown'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { resolveConcurrencyErrorMessage } from '../lib/concurrency'
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
    api_key: device.api_key || '',
    firmware_version: device.firmware_version || '',
    hardware_version: device.hardware_version || '',
    wifi_name: device.wifi_name || '',
    status: device.status || '',
    last_seen_on: device.last_seen_on || null,
    is_active: Boolean(device.is_active),
    created_by: device.created_by || '',
    created_on: device.created_on || null,
    modified_on: device.modified_on || null,
    deleted_on: device.deleted_on || null,
    modified_by: device.modified_by || '',
  }
}

function createEmptyDevice() {
  return {
    device_type_id: '',
    code: '',
    name: '',
    description: '',
    serial_number: '',
    mac_address: '',
    firmware_version: '',
    hardware_version: '',
    wifi_name: '',
    api_key: '',
    status: '',
    last_seen_on: null,
    is_active: false,
    created_by: '',
    created_on: null,
    modified_by: '',
    modified_on: null,
    deleted_on: null,
  }
}

function buildDevicePayload(formData = {}, { mode = 'create', user } = {}) {
  const normalizeOptional = (value) => {
    if (value === null || value === undefined) return null
    if (typeof value === 'string') {
      const trimmed = value.trim()
      return trimmed === '' ? null : trimmed
    }
    return value
  }

  const payload = {
    device_type_id: formData.device_type_id,
    code: (formData.code || '').trim(),
    name: (formData.name || '').trim(),
    description: normalizeOptional(formData.description),
    serial_number: normalizeOptional(formData.serial_number),
    mac_address: normalizeOptional(formData.mac_address),
    firmware_version: normalizeOptional(formData.firmware_version),
    hardware_version: normalizeOptional(formData.hardware_version),
    wifi_name: normalizeOptional(formData.wifi_name),
    api_key: normalizeOptional(formData.api_key),
    status: normalizeOptional(formData.status),
    last_seen_on: formData.last_seen_on || null,
    is_active: Boolean(formData.is_active),
  }

  if (mode === 'create') {
    payload.created_by = user?.username || ''
  } else {
    payload.modified_on = formData.modified_on || null
    payload.modified_by = user?.username || ''
  }

  return payload
}

const EMPTY_FILTERS = {
  code: '',
  name: '',
  serial_number: '',
  description: '',
  device_type_id: '',
  device_type_ids: [],
  device_type_items: [],
  client_ids: [],
  client_items: [],
  status: '',
  is_active: null,
}

export default function DevicesPage() {
  const navigate = useNavigate()
  const { roleCode, user } = useAuth()
  const { language } = useLanguage()
  const normalizedRoleCode = (roleCode || '').toUpperCase()
  const canCreateDevices = ['ADMIN', 'MANAGER'].includes(normalizedRoleCode)
  const canEditDevices = normalizedRoleCode === 'ADMIN'
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [modalMode, setModalMode] = useState('edit')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [activeFilters, setActiveFilters] = useState(EMPTY_FILTERS)
  const text = useMemo(() => {
    const texts = {
      ca: {
        pageTitle: 'Sensors',
        pageDescription: 'Consulta l’estat dels sensors, revisa el seu detall i filtra el llistat ràpidament.',
        filters: 'Filtres',
        filtersDescription: 'Ajusta criteris per localitzar dispositius més ràpidament.',
        listTitle: 'Llistat de dispositius',
        name: 'Nom',
        code: 'Codi',
        serial: 'Serial',
        status: 'Status',
        active: 'Actiu',
        lastSeen: 'Last seen',
        actions: 'Accions',
        yes: 'Sí',
        no: 'No',
        edit: 'Editar',
        activate: 'Activar',
        deactivate: 'Desactivar',
        readings: 'Lectures',
        noResults: 'No s’han trobat dispositius.',
        loading: 'Carregant dispositius...',
        saving: 'Desant dispositiu...',
        confirmActivate: 'Estàs segur que vols activar el registre?',
        confirmDeactivate: 'Estàs segur que vols desactivar el registre?',
        confirmYes: 'Sí',
        cancel: 'Cancel·lar',
      },
      es: {
        pageTitle: 'Sensores',
        pageDescription: 'Consulta el estado de los sensores, revisa su detalle y filtra el listado rápidamente.',
        filters: 'Filtros',
        filtersDescription: 'Ajusta criterios para localizar dispositivos más rápido.',
        listTitle: 'Listado de dispositivos',
        name: 'Nombre',
        code: 'Código',
        serial: 'Serie',
        status: 'Estado',
        active: 'Activo',
        lastSeen: 'Última conexión',
        actions: 'Acciones',
        yes: 'Sí',
        no: 'No',
        edit: 'Editar',
        activate: 'Activar',
        deactivate: 'Desactivar',
        readings: 'Lecturas',
        noResults: 'No se han encontrado dispositivos.',
        loading: 'Cargando dispositivos...',
        saving: 'Guardando dispositivo...',
        confirmActivate: '¿Estás seguro de que quieres activar el registro?',
        confirmDeactivate: '¿Estás seguro de que quieres desactivar el registro?',
        confirmYes: 'Sí',
        cancel: 'Cancelar',
      },
      en: {
        pageTitle: 'Sensors',
        pageDescription: 'Review sensor status, inspect details and filter the list quickly.',
        filters: 'Filters',
        filtersDescription: 'Adjust criteria to find devices faster.',
        listTitle: 'Devices list',
        name: 'Name',
        code: 'Code',
        serial: 'Serial',
        status: 'Status',
        active: 'Active',
        lastSeen: 'Last seen',
        actions: 'Actions',
        yes: 'Yes',
        no: 'No',
        edit: 'Edit',
        activate: 'Activate',
        deactivate: 'Deactivate',
        readings: 'Readings',
        noResults: 'No devices found.',
        loading: 'Loading devices...',
        saving: 'Saving device...',
        confirmActivate: 'Are you sure you want to activate this record?',
        confirmDeactivate: 'Are you sure you want to deactivate this record?',
        confirmYes: 'Yes',
        cancel: 'Cancel',
      },
    }

    return texts[language] || texts.ca
  }, [language])

  const activeFilterCount = useMemo(() => {
    return [
      activeFilters.code,
      activeFilters.name,
      activeFilters.serial_number,
      activeFilters.description,
      activeFilters.device_type_id,
      Array.isArray(activeFilters.device_type_ids) && activeFilters.device_type_ids.length > 0 ? '__device_types__' : null,
      activeFilters.status,
      activeFilters.is_active,
      Array.isArray(activeFilters.client_ids) && activeFilters.client_ids.length > 0 ? '__clients__' : null,
    ].filter((value) => value !== '' && value !== null).length
  }, [activeFilters])

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
    setActiveFilters(EMPTY_FILTERS)
    await loadDevices({ filters: EMPTY_FILTERS, targetPage: 1 })
  }

  async function handleEdit(device) {
    if (!canEditDevices) return

    setModalMode('edit')
    setIsSaving(true)
    setError('')

    try {
      const payload = await devicesService.getDevice(device.id)
      setSelectedDevice(normalizeDevice(payload))
      setIsEditOpen(true)
    } catch (err) {
      setError(err.message || 'No sâ€™ha pogut carregar el detall del dispositiu.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveDevice(formData) {
    setIsSaving(true)
    setError('')
    setSuccess('')
    const wasCreating = modalMode === 'create'

    try {
      if (wasCreating) {
        await devicesService.createDevice(
          buildDevicePayload(formData, { mode: 'create', user })
        )
      } else {
        await devicesService.updateDevice(
          selectedDevice.id,
          buildDevicePayload(formData, { mode: 'edit', user })
        )

        setSuccess('Dispositiu actualitzat correctament.')
      }

      setIsEditOpen(false)
      setSelectedDevice(null)
      await loadDevices({ targetPage: wasCreating ? 1 : page })
    } catch (err) {
      setError(resolveConcurrencyErrorMessage(err, language, 'No s’ha pogut actualitzar el dispositiu.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteDevice() {
    if (!canEditDevices) return
    if (!selectedDevice?.id) return

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await devicesService.deleteDevice(selectedDevice.id)
      setSuccess('Dispositiu eliminat correctament.')
      setIsEditOpen(false)
      setSelectedDevice(null)
      await loadDevices()
    } catch (err) {
      setError(err.message || 'No sâ€™ha pogut eliminar el dispositiu.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleNewDevice() {
    if (!canCreateDevices) return

    setModalMode('create')
    setError('')
    setSelectedDevice(createEmptyDevice())
    setIsEditOpen(true)
  }

  async function handleToggleActive(device) {
    if (!canEditDevices) return
    setToggleTarget(device)
  }

  async function handleConfirmToggleActive() {
    if (!toggleTarget) return

    const nextValue = !toggleTarget.is_active

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const updatedDevice = await devicesService.updateDevice(toggleTarget.id, {
        ...normalizeDevice(toggleTarget),
        is_active: nextValue,
      })

      setSuccess(
        nextValue
          ? 'Dispositiu activat correctament.'
          : 'Dispositiu desactivat correctament.'
      )

      await loadDevices()
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === toggleTarget.id
            ? { ...entry, is_active: nextValue, modified_on: updatedDevice?.modified_on || entry.modified_on }
            : entry
        )
      )
    } catch (err) {
      setError(resolveConcurrencyErrorMessage(err, language, 'No s’ha pogut actualitzar l’estat del dispositiu.'))
    } finally {
      setToggleTarget(null)
      setIsSaving(false)
    }
  }

  function handleGoToReadings(device) {
    navigate(`/readings?deviceId=${encodeURIComponent(device.id)}&deviceName=${encodeURIComponent(device.name || '')}`)
  }

  return (
    <div className="space-y-6">
      <CollapsibleFiltersCard
        title={text.pageTitle}
        description={text.pageDescription}
        activeCount={activeFilterCount}
        defaultExpanded={false}
      >
        <DeviceFilters
          initialFilters={activeFilters}
          onSearch={handleSearch}
          onReset={handleReset}
          showClientFilter={normalizedRoleCode === 'ADMIN'}
          disabled={isLoading || isSaving}
        />
      </CollapsibleFiltersCard>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-visible">
        <BackofficeListHeader
          title={text.listTitle}
          total={total}
          showNewButton
          onNew={handleNewDevice}
          newDisabled={!canCreateDevices || isLoading || isSaving}
        />

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mt-4 text-sm text-emerald-600">{success}</p> : null}

        <div className="mt-4 overflow-visible">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3">{text.name}</th>
                <th className="px-3 py-3">{text.code}</th>
                <th className="px-3 py-3">{text.serial}</th>
                <th className="px-3 py-3">MAC</th>
                <th className="px-3 py-3">{text.status}</th>
                <th className="px-3 py-3">{text.active}</th>
                <th className="px-3 py-3">{text.lastSeen}</th>
                <th className="px-3 py-3 text-right">{text.actions}</th>
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
                  <td className="px-3 py-3">{item.is_active ? text.yes : text.no}</td>
                  <td className="px-3 py-3">{formatDate(item.last_seen_on)}</td>
                  <td className="px-3 py-3 text-right">
                    <RowActionsDropdown
                      disabled={isSaving}
                      actions={[
                        ...(canEditDevices
                          ? [
                              {
                                key: 'edit',
                                label: text.edit,
                                onClick: () => handleEdit(item),
                              },
                              {
                                key: 'toggle-active',
                                label: item.is_active ? text.deactivate : text.activate,
                                onClick: () => handleToggleActive(item),
                              },
                            ]
                          : []),
                        {
                          key: 'readings',
                          label: text.readings,
                          onClick: () => handleGoToReadings(item),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}

              {!isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                    {text.noResults}
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
          isLoading={isLoading || isSaving}
          onPageChange={(nextPage) => loadDevices({ targetPage: nextPage })}
          onPageSizeChange={(nextSize) => loadDevices({ targetPage: 1, targetPageSize: nextSize })}
        />
      </section>

      <DeviceEditModal
        isOpen={isEditOpen}
        device={selectedDevice}
        mode={modalMode}
        onClose={() => {
          if (isSaving) return
          setIsEditOpen(false)
          setSelectedDevice(null)
          setModalMode('edit')
        }}
        onSave={handleSaveDevice}
        onDelete={handleDeleteDevice}
        isSaving={isSaving}
      />
      {toggleTarget ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 px-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl">
            <p className="text-lg font-semibold text-slate-900">
              {toggleTarget.is_active ? text.confirmDeactivate : text.confirmActivate}
            </p>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setToggleTarget(null)}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {text.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleActive}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {text.confirmYes}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <LoadingOverlay
        visible={isLoading || isSaving}
        label={isSaving ? text.saving : text.loading}
        transparent
      />
    </div>
  )
}
