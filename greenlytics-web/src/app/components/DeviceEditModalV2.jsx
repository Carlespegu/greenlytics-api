import { useEffect, useMemo, useState } from 'react'
import { deviceTypesService } from '../services/deviceTypesService'
import { useLanguage } from '../context/LanguageContext'

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
  status: 'offline',
  last_seen_on: '',
  is_active: true,
  created_by: '',
  created_on: '',
  modified_by: '',
  modified_on: '',
  deleted_on: '',
}

const STATUS_OPTIONS = ['online', 'offline', 'warning', 'error']

const UI_TEXT = {
  ca: {
    editDevice: 'Editar dispositiu',
    editDeviceHelp: 'Actualitza les dades principals del dispositiu seleccionat.',
    delete: 'Eliminar',
    save: 'Desar',
    saving: 'Desant...',
    cancel: 'Cancelar',
    confirmDelete: 'Segur que vols eliminar aquest registre?',
    deviceType: 'Tipus de dispositiu',
    code: 'Codi',
    name: 'Nom',
    description: 'Descripcio',
    serialNumber: 'Serial',
    macAddress: 'MAC address',
    status: 'Estat',
    firmwareVersion: 'Versio firmware',
    hardwareVersion: 'Versio hardware',
    wifiName: 'Nom WiFi',
    lastSeen: 'Darrera connexio',
    active: 'Actiu',
    modifiedBy: 'Modificat per',
    modifiedOn: 'Modificat el',
    createdBy: 'Creat per',
    createdOn: 'Creat el',
    yes: 'Si',
    online: 'Online',
    offline: 'Offline',
    warning: 'Avis',
    error: 'Error',
  },
  es: {
    editDevice: 'Editar dispositivo',
    editDeviceHelp: 'Actualiza los datos principales del dispositivo seleccionado.',
    delete: 'Eliminar',
    save: 'Guardar',
    saving: 'Guardando...',
    cancel: 'Cancelar',
    confirmDelete: 'Seguro que quieres eliminar este registro?',
    deviceType: 'Tipo de dispositivo',
    code: 'Codigo',
    name: 'Nombre',
    description: 'Descripcion',
    serialNumber: 'Serial',
    macAddress: 'Direccion MAC',
    status: 'Estado',
    firmwareVersion: 'Version firmware',
    hardwareVersion: 'Version hardware',
    wifiName: 'Nombre WiFi',
    lastSeen: 'Ultima conexion',
    active: 'Activo',
    modifiedBy: 'Modificado por',
    modifiedOn: 'Modificado el',
    createdBy: 'Creado por',
    createdOn: 'Creado el',
    yes: 'Si',
    online: 'Online',
    offline: 'Offline',
    warning: 'Aviso',
    error: 'Error',
  },
  en: {
    editDevice: 'Edit device',
    editDeviceHelp: 'Update the main data of the selected device.',
    delete: 'Delete',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    confirmDelete: 'Are you sure to deleted this register?',
    deviceType: 'Device type',
    code: 'Code',
    name: 'Name',
    description: 'Description',
    serialNumber: 'Serial',
    macAddress: 'MAC address',
    status: 'Status',
    firmwareVersion: 'Firmware version',
    hardwareVersion: 'Hardware version',
    wifiName: 'WiFi name',
    lastSeen: 'Last seen',
    active: 'Active',
    modifiedBy: 'Modified by',
    modifiedOn: 'Modified on',
    createdBy: 'Created by',
    createdOn: 'Created on',
    yes: 'Yes',
    online: 'Online',
    offline: 'Offline',
    warning: 'Warning',
    error: 'Error',
  },
}

function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  const pad = (num) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatMetaDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString()
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

function Field({ label, children, fullWidth = false }) {
  return (
    <label className={`space-y-2 text-sm text-slate-700 ${fullWidth ? 'md:col-span-2 xl:col-span-3' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="space-y-2 text-sm text-slate-700">
      <span className="block">{label}</span>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600">
        {value || '-'}
      </div>
    </div>
  )
}

export default function DeviceEditModalV2({
  isOpen,
  device,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
}) {
  const { language } = useLanguage()
  const text = UI_TEXT[language] || UI_TEXT.ca
  const [form, setForm] = useState(EMPTY_FORM)
  const [deviceTypes, setDeviceTypes] = useState([])
  const [isLoadingTypes, setIsLoadingTypes] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!device) {
      setForm(EMPTY_FORM)
      return
    }

    setForm({
      ...EMPTY_FORM,
      ...device,
      last_seen_on: toDateTimeLocal(device.last_seen_on),
      created_on: device.created_on || '',
      modified_on: device.modified_on || '',
      deleted_on: device.deleted_on || '',
    })
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

  const title = useMemo(() => {
    return device?.name ? `${text.editDevice} - ${device.name}` : text.editDevice
  }, [device, text.editDevice])

  if (!isOpen) return null

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    onSave({
      ...form,
      last_seen_on: form.last_seen_on ? new Date(form.last_seen_on).toISOString() : null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{text.editDeviceHelp}</p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {text.delete}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label={text.deviceType}>
              <select
                name="device_type_id"
                value={form.device_type_id}
                onChange={handleChange}
                disabled={isSaving || isLoadingTypes}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">{isLoadingTypes ? '...' : text.deviceType}</option>
                {deviceTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={text.code}>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400"
              />
            </Field>

            <Field label={text.name}>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400"
              />
            </Field>

            <Field label={text.description} fullWidth>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400"
              />
            </Field>

            <Field label={text.serialNumber}>
              <input
                name="serial_number"
                value={form.serial_number}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400"
              />
            </Field>

            <Field label={text.macAddress}>
              <input
                name="mac_address"
                value={form.mac_address}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400"
              />
            </Field>

            <Field label={text.status}>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {text[status]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={text.firmwareVersion}>
              <input
                name="firmware_version"
                value={form.firmware_version}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400"
              />
            </Field>

            <Field label={text.hardwareVersion}>
              <input
                name="hardware_version"
                value={form.hardware_version}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400"
              />
            </Field>

            <Field label={text.wifiName}>
              <input
                name="wifi_name"
                value={form.wifi_name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400"
              />
            </Field>

            <Field label={text.lastSeen}>
              <input
                type="datetime-local"
                name="last_seen_on"
                value={form.last_seen_on}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400"
              />
            </Field>

            <div className="space-y-2 text-sm text-slate-700">
              <span className="block">{text.active}</span>
              <BinarySwitch
                checked={Boolean(form.is_active)}
                onChange={(value) => setForm((prev) => ({ ...prev, is_active: value }))}
                disabled={isSaving}
              />
            </div>

            <ReadOnlyField label={text.createdBy} value={form.created_by} />
            <ReadOnlyField label={text.createdOn} value={formatMetaDate(form.created_on)} />
            <ReadOnlyField label={text.modifiedBy} value={form.modified_by} />
            <ReadOnlyField label={text.modifiedOn} value={formatMetaDate(form.modified_on)} />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              {isSaving ? text.saving : text.save}
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

        {showDeleteConfirm ? (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <p className="text-sm text-slate-700">{text.confirmDelete}</p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    await onDelete()
                    setShowDeleteConfirm(false)
                  }}
                  disabled={isSaving}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  {text.yes}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {text.cancel}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
