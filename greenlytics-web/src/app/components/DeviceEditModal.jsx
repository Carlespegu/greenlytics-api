import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { deviceTypesService } from '../services/deviceTypesService'

const EMPTY_FORM = {
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
  last_seen_on: '',
  is_active: true,
  modified_by: '',
}

function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (num) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function BinarySwitch({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => {
        if (disabled) return
        onChange(!checked)
      }}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${
        checked ? 'bg-emerald-600' : 'bg-slate-400'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-8' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function formatReadOnlyDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

export default function DeviceEditModal({
  isOpen,
  device,
  mode = 'edit',
  onClose,
  onSave,
  onDelete,
  isSaving = false,
}) {
  const { language } = useLanguage()
  const [form, setForm] = useState(EMPTY_FORM)
  const [deviceTypes, setDeviceTypes] = useState([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)
  const [deviceTypeQuery, setDeviceTypeQuery] = useState('')
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const text = useMemo(() => {
    const texts = {
      ca: {
        createTitle: 'Creació dispositiu',
        editTitle: 'Editar dispositiu',
        createHelp: 'Completa les dades principals per donar d’alta un nou dispositiu.',
        editHelp: 'Actualitza les dades principals del dispositiu seleccionat.',
        delete: 'Eliminar',
        confirmDelete: 'Estàs segur que vols eliminar el registre?',
        confirmYes: 'Sí',
        deviceType: 'Tipus dispositiu',
        deviceTypePlaceholder: 'Cerca un tipus de dispositiu',
        noDeviceTypes: 'No s’han trobat tipus de dispositiu.',
        code: 'Codi',
        name: 'Nom',
        description: 'Descripció',
        serial: 'Serial',
        macAddress: 'Adreça MAC',
        apiKey: 'API key',
        showSecret: 'Mostrar',
        hideSecret: 'Ocultar',
        status: 'Estat',
        firmwareVersion: 'Versió firmware',
        hardwareVersion: 'Versió hardware',
        wifiName: 'Nom WiFi',
        lastSeen: 'Darrera connexió',
        active: 'Dispositiu actiu',
        loadingDeviceTypes: 'Carregant tipus de dispositiu...',
        saveChanges: 'Desar canvis',
        save: 'Desar',
        saving: 'Desant...',
        cancel: 'Cancel·lar',
      },
      es: {
        createTitle: 'Creación dispositivo',
        editTitle: 'Editar dispositivo',
        createHelp: 'Completa los datos principales para dar de alta un nuevo dispositivo.',
        editHelp: 'Actualiza los datos principales del dispositivo seleccionado.',
        delete: 'Eliminar',
        confirmDelete: 'Estas seguro que quieres eliminar el registro?',
        confirmYes: 'Sí',
        deviceType: 'Tipo dispositivo',
        deviceTypePlaceholder: 'Busca un tipo de dispositivo',
        noDeviceTypes: 'No se han encontrado tipos de dispositivo.',
        code: 'Código',
        name: 'Nombre',
        description: 'Descripción',
        serial: 'Serial',
        macAddress: 'Dirección MAC',
        apiKey: 'API key',
        showSecret: 'Mostrar',
        hideSecret: 'Ocultar',
        status: 'Estado',
        firmwareVersion: 'Versión firmware',
        hardwareVersion: 'Versión hardware',
        wifiName: 'Nombre WiFi',
        lastSeen: 'Última conexión',
        active: 'Dispositivo activo',
        loadingDeviceTypes: 'Cargando tipos de dispositivo...',
        saveChanges: 'Guardar cambios',
        save: 'Guardar',
        saving: 'Guardando...',
        cancel: 'Cancelar',
      },
      en: {
        createTitle: 'Device creation',
        editTitle: 'Edit device',
        createHelp: 'Complete the main data to create a new device.',
        editHelp: 'Update the main data of the selected device.',
        delete: 'Delete',
        confirmDelete: 'Are you sure you want to delete this record?',
        confirmYes: 'Yes',
        deviceType: 'Device type',
        deviceTypePlaceholder: 'Search a device type',
        noDeviceTypes: 'No device types found.',
        code: 'Code',
        name: 'Name',
        description: 'Description',
        serial: 'Serial',
        macAddress: 'MAC address',
        apiKey: 'API key',
        showSecret: 'Show',
        hideSecret: 'Hide',
        status: 'Status',
        firmwareVersion: 'Firmware version',
        hardwareVersion: 'Hardware version',
        wifiName: 'WiFi name',
        lastSeen: 'Last seen',
        active: 'Active device',
        loadingDeviceTypes: 'Loading device types...',
        saveChanges: 'Save changes',
        save: 'Save',
        saving: 'Saving...',
        cancel: 'Cancel',
      },
    }

    return texts[language] || texts.ca
  }, [language])

  useEffect(() => {
    setShowApiKey(false)
    setIsTypeMenuOpen(false)
    setShowDeleteConfirm(false)

    if (!device) {
      setForm(EMPTY_FORM)
      setDeviceTypeQuery('')
      return
    }

    setForm({
      ...EMPTY_FORM,
      ...device,
      last_seen_on: toDateTimeLocal(device.last_seen_on),
    })
    setDeviceTypeQuery('')
  }, [device])

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    async function loadDeviceTypes() {
      setIsLoadingTypes(true)
      try {
        const payload = await deviceTypesService.listDeviceTypes()
        if (isMounted) {
          setDeviceTypes(Array.isArray(payload) ? payload : [])
        }
      } finally {
        if (isMounted) {
          setIsLoadingTypes(false)
        }
      }
    }

    loadDeviceTypes()

    return () => {
      isMounted = false
    }
  }, [isOpen])

  useEffect(() => {
    if (!form.device_type_id) {
      return
    }

    const currentType = deviceTypes.find((item) => item.id === form.device_type_id)
    if (currentType) {
      setDeviceTypeQuery(currentType.name || currentType.code || '')
    }
  }, [deviceTypes, form.device_type_id])

  const title = useMemo(() => {
    if (mode === 'create') return text.createTitle
    return device?.name ? `${text.editTitle} · ${device.name}` : text.editTitle
  }, [device, mode, text.createTitle, text.editTitle])

  const subtitle = useMemo(() => {
    return mode === 'create' ? text.createHelp : text.editHelp
  }, [mode, text.createHelp, text.editHelp])

  const filteredDeviceTypes = useMemo(() => {
    const query = deviceTypeQuery.trim().toLowerCase()
    if (!query) return deviceTypes
    return deviceTypes.filter((item) =>
      String(item.name || item.code || '').toLowerCase().includes(query)
    )
  }, [deviceTypeQuery, deviceTypes])

  if (!isOpen) return null

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleActiveChange(nextValue) {
    setForm((prev) => ({
      ...prev,
      is_active: nextValue,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const normalizedDeviceTypeId =
      form.device_type_id ||
      deviceTypes.find(
        (item) =>
          String(item.name || '').toLowerCase() === deviceTypeQuery.trim().toLowerCase()
      )?.id ||
      ''

    onSave({
      ...form,
      device_type_id: normalizedDeviceTypeId,
      last_seen_on: form.last_seen_on ? new Date(form.last_seen_on).toISOString() : null,
    })
  }

  function handleSelectDeviceType(item) {
    setForm((prev) => ({
      ...prev,
      device_type_id: item.id,
    }))
    setDeviceTypeQuery(item.name || item.code || '')
    setIsTypeMenuOpen(false)
  }

  function handleDeleteClick() {
    setShowDeleteConfirm(true)
  }

  function handleConfirmDelete() {
    if (typeof onDelete !== 'function') return
    setShowDeleteConfirm(false)
    onDelete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          {mode !== 'create' && typeof onDelete === 'function' ? (
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isSaving}
              className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={text.delete}
              title={text.delete}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2 text-sm text-slate-700">
              <span>{text.deviceType}</span>
              <div className="relative">
                <input
                  value={deviceTypeQuery}
                  onChange={(event) => {
                    setDeviceTypeQuery(event.target.value)
                    setForm((prev) => ({ ...prev, device_type_id: '' }))
                    setIsTypeMenuOpen(true)
                  }}
                  onFocus={() => setIsTypeMenuOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setIsTypeMenuOpen(false)
                    }, 120)
                  }}
                  autoComplete="off"
                  placeholder={text.deviceTypePlaceholder}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400"
                />
                {isTypeMenuOpen ? (
                  <div className="absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    {isLoadingTypes ? (
                      <div className="px-3 py-2 text-sm text-slate-500">{text.loadingDeviceTypes}</div>
                    ) : filteredDeviceTypes.length > 0 ? (
                      filteredDeviceTypes.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelectDeviceType(item)}
                          className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {item.name || item.code || '-'}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-slate-500">{text.noDeviceTypes}</div>
                    )}
                  </div>
                ) : null}
              </div>
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>{text.code}</span>
              <input name="code" value={form.code} onChange={handleChange} autoComplete="off" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>{text.name}</span>
              <input name="name" value={form.name} onChange={handleChange} autoComplete="off" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700 md:col-span-2 xl:col-span-3">
              <span>{text.description}</span>
              <input name="description" value={form.description} onChange={handleChange} autoComplete="off" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>{text.serial}</span>
              <input name="serial_number" value={form.serial_number} onChange={handleChange} autoComplete="off" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>{text.macAddress}</span>
              <input name="mac_address" value={form.mac_address} onChange={handleChange} autoComplete="off" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>{text.apiKey}</span>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  name="api_key"
                  value={form.api_key || ''}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-24 outline-none focus:border-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((prev) => !prev)}
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  aria-label={showApiKey ? text.hideSecret : text.showSecret}
                  title={showApiKey ? text.hideSecret : text.showSecret}
                >
                  {showApiKey ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m3 3 18 18" />
                      <path d="M10.6 10.7a3 3 0 0 0 4.2 4.2" />
                      <path d="M9.9 5.2A10.9 10.9 0 0 1 12 5c5.2 0 9.3 4 10 7-.3 1.3-1.3 3.1-2.8 4.6" />
                      <path d="M6.2 6.2C4.1 7.6 2.6 9.8 2 12c.9 3.7 5 7 10 7 1.7 0 3.2-.3 4.6-1" />
                    </svg>
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>{text.status}</span>
              <input name="status" value={form.status} onChange={handleChange} autoComplete="off" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>{text.firmwareVersion}</span>
              <input name="firmware_version" value={form.firmware_version} onChange={handleChange} autoComplete="off" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>{text.hardwareVersion}</span>
              <input name="hardware_version" value={form.hardware_version} onChange={handleChange} autoComplete="off" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>{text.wifiName}</span>
              <input name="wifi_name" value={form.wifi_name} onChange={handleChange} autoComplete="off" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>{text.lastSeen}</span>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
                {formatReadOnlyDate(form.last_seen_on)}
              </div>
            </label>

            <div className="space-y-2 text-sm text-slate-700">
              <span className="block">{text.active}</span>
              <div className="flex min-h-[52px] items-start pt-1">
                <BinarySwitch checked={Boolean(form.is_active)} onChange={handleActiveChange} disabled={isSaving} />
              </div>
            </div>

          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              {isSaving ? text.saving : mode === 'create' ? text.save : text.saveChanges}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {text.cancel}
            </button>
          </div>
        </form>
      </div>
      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <p className="text-base font-medium text-slate-900">{text.confirmDelete}</p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {text.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                {text.confirmYes}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
