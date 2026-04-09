import { useEffect, useState } from 'react'
import CompactPagination from './CompactPagination'
import LoadingOverlay from './LoadingOverlay'
import { resolveConcurrencyErrorMessage } from '../lib/concurrency'
import { clientsService } from '../services/clientsService'
import { devicesService } from '../services/devicesService'
import { installationsService } from '../services/installationsService'

const UI_TEXT = {
  ca: {
    title: 'Dispositius de la instal·lació',
    client: 'Client',
    notes: 'Notes',
    searchClient: 'Buscar client...',
    selectClient: 'Selecciona un client',
    noClients: 'No s’han trobat clients.',
    name: 'Nom',
    code: 'Codi',
    active: 'Actiu',
    serial: 'Serial',
    mac: 'MAC',
    devices: 'Dispositius',
    save: 'Desar',
    saving: 'Desant...',
    cancel: 'Cancel·lar',
    loading: 'Carregant...',
    loadError: 'No s’han pogut carregar les assignacions.',
    saveError: 'No s’han pogut desar les assignacions.',
    noResults: 'No s’han trobat dispositius per al client seleccionat.',
    yes: 'Sí',
    no: 'No',
    actionLabel: 'Dispositius',
  },
  es: {
    title: 'Dispositivos de la instalación',
    client: 'Cliente',
    notes: 'Notas',
    searchClient: 'Buscar cliente...',
    selectClient: 'Selecciona un cliente',
    noClients: 'No se han encontrado clientes.',
    name: 'Nombre',
    code: 'Código',
    active: 'Activo',
    serial: 'Serial',
    mac: 'MAC',
    devices: 'Dispositivos',
    save: 'Guardar',
    saving: 'Guardando...',
    cancel: 'Cancelar',
    loading: 'Cargando...',
    loadError: 'No se han podido cargar las asignaciones.',
    saveError: 'No se han podido guardar las asignaciones.',
    noResults: 'No se han encontrado dispositivos para el cliente seleccionado.',
    yes: 'Sí',
    no: 'No',
    actionLabel: 'Dispositivos',
  },
  en: {
    title: 'Installation devices',
    client: 'Client',
    notes: 'Notes',
    searchClient: 'Search client...',
    selectClient: 'Select a client',
    noClients: 'No clients found.',
    name: 'Name',
    code: 'Code',
    active: 'Active',
    serial: 'Serial',
    mac: 'MAC',
    devices: 'Devices',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    loading: 'Loading...',
    loadError: 'Could not load assignments.',
    saveError: 'Could not save assignments.',
    noResults: 'No devices found for the selected client.',
    yes: 'Yes',
    no: 'No',
    actionLabel: 'Devices',
  },
}

function SingleClientSelect({
  text,
  value,
  onChange,
  disabled = false,
}) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || disabled) return

    let mounted = true
    async function load() {
      setIsLoading(true)
      try {
        const payload = await clientsService.searchClientOptions({
          query,
          page: 1,
          pageSize: 10,
        })
        if (mounted) {
          setOptions(payload.items || [])
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [disabled, isOpen, query])

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        <span className="truncate">{value?.name || text.selectClient}</span>
        <span className="text-slate-400">{isOpen ? '^' : 'v'}</span>
      </button>

      {isOpen ? (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text.searchClient}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {options.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item)
                  setIsOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-800">{item.name}</span>
                  <span className="block truncate text-xs text-slate-500">{item.code}</span>
                </span>
              </button>
            ))}

            {!isLoading && options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-500">{text.noClients}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function InstallationDevicesModal({
  isOpen,
  installation,
  isAdmin = false,
  isViewer = false,
  language = 'ca',
  onClose,
}) {
  const text = UI_TEXT[language] || UI_TEXT.ca
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)
  const [notes, setNotes] = useState('')
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([])
  const [summaryModifiedOn, setSummaryModifiedOn] = useState(null)
  const [devices, setDevices] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!isOpen || !installation?.client_id) return

    let mounted = true

    async function preloadClient() {
      const fallbackClient = {
        id: installation.client_id,
        name: installation.client_name || '',
        code: installation.client_code || '',
      }

      setSelectedClient(fallbackClient)

      if (fallbackClient.name) return

      try {
        const client = await clientsService.getClientById(installation.client_id)
        if (!mounted || !client) return

        setSelectedClient({
          id: client.id,
          name: client.name || '',
          code: client.code || '',
        })
      } catch {
        // Keep fallback value if client detail cannot be resolved.
      }
    }

    preloadClient()

    return () => {
      mounted = false
    }
  }, [installation, isOpen])

  useEffect(() => {
    if (!isOpen || !installation?.id) return

    let mounted = true

    async function loadSummary() {
      setIsLoading(true)
      setError('')
      try {
        const payload = await installationsService.getDeviceAssignmentsSummary(installation.id)
        if (!mounted) return
        setSelectedClient({
          id: payload.client_id,
          name: payload.client_name || installation.client_name || '',
          code: installation.client_code || '',
        })
        setSelectedDeviceIds((payload.selected_device_ids || []).map(String))
        setNotes(payload.notes || '')
        setSummaryModifiedOn(payload.modified_on || null)
        setPage(1)
      } catch (err) {
        if (mounted) setError(err.message || text.loadError)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadSummary()
    return () => {
      mounted = false
    }
  }, [installation, isOpen, text.loadError])

  useEffect(() => {
    if (!isOpen || !selectedClient?.id) return

    let mounted = true
    async function loadDevices() {
      setIsLoading(true)
      setError('')
      try {
        const payload = await devicesService.searchDevices(
          { client_ids: [selectedClient.id] },
          { page, pageSize }
        )
        if (!mounted) return
        setDevices(payload.items || [])
        setTotal(payload.total || 0)
      } catch (err) {
        if (mounted) setError(err.message || text.loadError)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadDevices()
    return () => {
      mounted = false
    }
  }, [isOpen, selectedClient, page, pageSize, text.loadError])

  if (!isOpen || !installation) return null

  const readOnly = isViewer
  const headerClientName = selectedClient?.name || installation.client_name || ''

  function toggleDevice(deviceId) {
    if (readOnly) return
    setSelectedDeviceIds((prev) =>
      prev.includes(String(deviceId))
        ? prev.filter((item) => item !== String(deviceId))
        : [...prev, String(deviceId)]
    )
  }

  async function handleSave() {
    if (readOnly) return

    setIsSaving(true)
    setError('')
    try {
      await installationsService.syncDeviceAssignments(installation.id, {
        client_id: selectedClient?.id || installation.client_id,
        notes,
        modified_on: summaryModifiedOn,
        device_ids: selectedDeviceIds,
      })
      onClose(true)
    } catch (err) {
      setError(resolveConcurrencyErrorMessage(err, language, text.saveError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{text.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {headerClientName} / {installation.name}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-700">
            <span className="block">{text.client}</span>
            {isAdmin ? (
              <SingleClientSelect
                text={text}
                value={selectedClient}
                disabled={readOnly || isSaving}
                onChange={(client) => {
                  setSelectedClient(client)
                  setSelectedDeviceIds([])
                  setPage(1)
                }}
              />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
                {headerClientName || '-'}
              </div>
            )}
          </label>

          <label className="space-y-2 text-sm text-slate-700">
            <span className="block">{text.notes}</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={readOnly || isSaving}
              rows={4}
              className="min-h-32 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </label>
        </div>

        {isLoading ? <p className="mt-4 text-sm text-slate-500">{text.loading}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 overflow-visible">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3" />
                <th className="px-3 py-3">{text.name}</th>
                <th className="px-3 py-3">{text.code}</th>
                <th className="px-3 py-3">{text.active}</th>
                <th className="px-3 py-3">{text.serial}</th>
                <th className="px-3 py-3">{text.mac}</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((item) => {
                const checked = selectedDeviceIds.includes(String(item.id))
                return (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={readOnly}
                        onChange={() => toggleDevice(item.id)}
                      />
                    </td>
                    <td className="px-3 py-3">{item.name || '-'}</td>
                    <td className="px-3 py-3">{item.code || '-'}</td>
                    <td className="px-3 py-3">{item.is_active ? text.yes : text.no}</td>
                    <td className="px-3 py-3">{item.serial_number || '-'}</td>
                    <td className="px-3 py-3">{item.mac_address || '-'}</td>
                  </tr>
                )
              })}

              {!isLoading && devices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
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
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPage(1)
            setPageSize(nextSize)
          }}
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={readOnly || isSaving}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            {isSaving ? text.saving : text.save}
          </button>
          <button
            type="button"
            onClick={() => onClose(false)}
            disabled={isSaving}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {text.cancel}
          </button>
        </div>
      </div>
      <LoadingOverlay
        visible={isLoading || isSaving}
        label={isSaving ? text.save : text.loading}
        transparent
      />
    </div>
  )
}
