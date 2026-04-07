import { useEffect, useMemo, useState } from 'react'

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

export default function DeviceEditModal({
  isOpen,
  device,
  onClose,
  onSave,
  isSaving = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (!device) {
      setForm(EMPTY_FORM)
      return
    }

    setForm({
      ...EMPTY_FORM,
      ...device,
      last_seen_on: toDateTimeLocal(device.last_seen_on),
    })
  }, [device])

  const title = useMemo(() => {
    return device?.name ? `Editar dispositiu · ${device.name}` : 'Editar dispositiu'
  }, [device])

  if (!isOpen) return null

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Actualitza les dades principals del dispositiu seleccionat.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tancar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2 text-sm text-slate-700">
              <span>Tipus dispositiu (ID)</span>
              <input name="device_type_id" value={form.device_type_id} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Codi</span>
              <input name="code" value={form.code} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Nom</span>
              <input name="name" value={form.name} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700 md:col-span-2 xl:col-span-3">
              <span>Descripció</span>
              <input name="description" value={form.description} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Serial</span>
              <input name="serial_number" value={form.serial_number} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>MAC address</span>
              <input name="mac_address" value={form.mac_address} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Status</span>
              <input name="status" value={form.status} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Firmware version</span>
              <input name="firmware_version" value={form.firmware_version} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Hardware version</span>
              <input name="hardware_version" value={form.hardware_version} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>WiFi name</span>
              <input name="wifi_name" value={form.wifi_name} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Last seen</span>
              <input type="datetime-local" name="last_seen_on" value={form.last_seen_on} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Modified by</span>
              <input name="modified_by" value={form.modified_by} onChange={handleChange} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400" />
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300"
            />
            Dispositiu actiu
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              {isSaving ? 'Desant...' : 'Desar canvis'}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel·lar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
