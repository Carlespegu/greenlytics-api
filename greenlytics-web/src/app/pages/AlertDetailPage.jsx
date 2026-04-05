import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { alertsService } from '../services/alertsService'
import { resourceService } from '../services/resourceService'
import { clientsService } from '../services/clientsService'
import { useAuth } from '../context/AuthContext'

const EMPTY_FORM = {
  client_id: '',
  installation_id: '',
  plant_id: '',
  reading_type_id: '',
  name: '',
  description: '',
  channel: 'EMAIL',
  recipient_email: '',
  condition_type: 'MIN',
  min_value: '',
  max_value: '',
  exact_numeric_value: '',
  exact_text_value: '',
  exact_boolean_value: 'true',
  is_active: true,
}

function Field({ label, required = false, hint, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
    </div>
  )
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
    />
  )
}

function SelectInput(props) {
  return (
    <select
      {...props}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
    />
  )
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="min-h-[110px] w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
    />
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex h-[50px] items-center gap-3 rounded-xl border border-slate-300 px-4">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  )
}

function buildPayload(form, user) {
  const payload = {
    client_id: form.client_id,
    installation_id: form.installation_id || null,
    plant_id: form.plant_id || null,
    reading_type_id: form.reading_type_id,
    name: form.name.trim(),
    description: form.description.trim() || null,
    channel: 'EMAIL',
    recipient_email: form.recipient_email.trim() || null,
    condition_type: form.condition_type,
    is_active: Boolean(form.is_active),
  }

  if (user?.id) {
    payload.created_by = user.id
    payload.modified_by = user.id
  } else if (user?.email) {
    payload.created_by = user.email
    payload.modified_by = user.email
  }

  if (form.condition_type === 'MIN') {
    payload.min_value = form.min_value === '' ? null : Number(form.min_value)
  }

  if (form.condition_type === 'MAX') {
    payload.max_value = form.max_value === '' ? null : Number(form.max_value)
  }

  if (form.condition_type === 'RANGE') {
    payload.min_value = form.min_value === '' ? null : Number(form.min_value)
    payload.max_value = form.max_value === '' ? null : Number(form.max_value)
  }

  if (form.condition_type === 'EQUALS') {
    if (form.exact_numeric_value !== '') {
      payload.exact_numeric_value = Number(form.exact_numeric_value)
    } else if (form.exact_text_value.trim() !== '') {
      payload.exact_text_value = form.exact_text_value.trim()
    }
  }

  if (form.condition_type === 'BOOLEAN_EQUALS') {
    payload.exact_boolean_value = form.exact_boolean_value === 'true'
  }

  return payload
}

function resolveValueType(readingType) {
  return (
    readingType?.value_type ||
    readingType?.reading_type_value_type ||
    readingType?.data_type ||
    ''
  )
    .toString()
    .toUpperCase()
}

function getConditionOptions(valueType) {
  switch (valueType) {
    case 'TEXT':
      return [{ value: 'EQUALS', label: 'Equals' }]
    case 'BOOLEAN':
      return [{ value: 'BOOLEAN_EQUALS', label: 'True / False' }]
    default:
      return [
        { value: 'MIN', label: 'Minimum' },
        { value: 'MAX', label: 'Maximum' },
        { value: 'RANGE', label: 'Range' },
        { value: 'EQUALS', label: 'Equals' },
      ]
  }
}

export default function AlertDetailPage() {
  const navigate = useNavigate()
  const { alertId } = useParams()
  const { user } = useAuth()

  const isNew = !alertId

  const [form, setForm] = useState({
    ...EMPTY_FORM,
    client_id: user?.client_id || '',
    recipient_email: user?.email || '',
  })

  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [success, setSuccess] = useState('')

  const [clients, setClients] = useState([])
  const [installations, setInstallations] = useState([])
  const [plants, setPlants] = useState([])
  const [readingTypes, setReadingTypes] = useState([])
  const [readingTypesLoadError, setReadingTypesLoadError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadCatalogs() {
      try {
        const [clientsData, installationsData, plantsData, readingTypesData] = await Promise.all([
          user?.role_code?.toUpperCase() === 'ADMIN' ? clientsService.listClients() : Promise.resolve([]),
          resourceService.listInstallations(),
          resourceService.listPlants(),
          alertsService.listReadingTypes(),
        ])

        if (cancelled) return

        setClients(Array.isArray(clientsData) ? clientsData : [])
        setInstallations(Array.isArray(installationsData) ? installationsData : [])
        setPlants(Array.isArray(plantsData) ? plantsData : [])
        setReadingTypes(Array.isArray(readingTypesData) ? readingTypesData : [])

        if (!Array.isArray(readingTypesData) || readingTypesData.length === 0) {
          setReadingTypesLoadError(
            "No s'han pogut carregar els reading types des de l'API. Pots informar el Reading type ID manualment."
          )
        }
      } catch (error) {
        if (cancelled) return
        setLoadError(error.message || 'No s’han pogut carregar les dades auxiliars.')
      }
    }

    loadCatalogs()
    return () => {
      cancelled = true
    }
  }, [user?.role_code])

  useEffect(() => {
    if (isNew) return

    let cancelled = false

    async function loadAlert() {
      setIsLoading(true)
      setLoadError('')

      try {
        const item = await alertsService.getAlertById(alertId)
        if (cancelled) return

        setForm({
          client_id: item.client_id || user?.client_id || '',
          installation_id: item.installation_id || '',
          plant_id: item.plant_id || '',
          reading_type_id: item.reading_type_id || '',
          name: item.name || '',
          description: item.description || '',
          channel: item.channel || 'EMAIL',
          recipient_email: item.recipient_email || '',
          condition_type: item.condition_type || 'MIN',
          min_value: item.min_value ?? '',
          max_value: item.max_value ?? '',
          exact_numeric_value: item.exact_numeric_value ?? '',
          exact_text_value: item.exact_text_value || '',
          exact_boolean_value:
            typeof item.exact_boolean_value === 'boolean'
              ? String(item.exact_boolean_value)
              : 'true',
          is_active: Boolean(item.is_active),
        })
      } catch (error) {
        if (!cancelled) {
          setLoadError(error.message || "No s'ha pogut carregar l'alerta.")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadAlert()
    return () => {
      cancelled = true
    }
  }, [alertId, isNew, user?.client_id])

  const selectedReadingType = useMemo(() => {
    return readingTypes.find((item) => item.id === form.reading_type_id)
  }, [readingTypes, form.reading_type_id])

  const valueType = useMemo(() => resolveValueType(selectedReadingType), [selectedReadingType])
  const conditionOptions = useMemo(() => getConditionOptions(valueType), [valueType])

  useEffect(() => {
    if (!conditionOptions.some((option) => option.value === form.condition_type)) {
      setForm((prev) => ({ ...prev, condition_type: conditionOptions[0]?.value || 'MIN' }))
    }
  }, [conditionOptions, form.condition_type])

  const availableInstallations = useMemo(() => {
    const currentClientId = form.client_id || user?.client_id
    return installations.filter((item) => {
      if (!currentClientId) return true
      return item.client_id === currentClientId
    })
  }, [installations, form.client_id, user?.client_id])

  const availablePlants = useMemo(() => {
    return plants.filter((item) => {
      const sameClient = !form.client_id || item.client_id === form.client_id
      const sameInstallation =
        !form.installation_id || item.installation_id === form.installation_id
      return sameClient && sameInstallation
    })
  }, [plants, form.client_id, form.installation_id])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setSaveError('')
    setSuccess('')

    setForm((prev) => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }

      if (name === 'client_id') {
        next.installation_id = ''
        next.plant_id = ''
      }

      if (name === 'installation_id' && prev.installation_id !== value) {
        next.plant_id = ''
      }

      if (name === 'reading_type_id') {
        next.min_value = ''
        next.max_value = ''
        next.exact_numeric_value = ''
        next.exact_text_value = ''
        next.exact_boolean_value = 'true'
      }

      return next
    })
  }

  function validateForm() {
    if (!form.client_id) return 'El client és obligatori.'
    if (!form.installation_id && !form.plant_id) {
      return "Cal informar una instal·lació o una planta."
    }
    if (!form.reading_type_id) return 'El reading type és obligatori.'
    if (!form.name.trim()) return "El nom de l'alerta és obligatori."
    if (!form.recipient_email.trim()) return "L'email del destinatari és obligatori."

    if (form.condition_type === 'MIN' && form.min_value === '') {
      return 'Has d’informar un valor mínim.'
    }

    if (form.condition_type === 'MAX' && form.max_value === '') {
      return 'Has d’informar un valor màxim.'
    }

    if (form.condition_type === 'RANGE') {
      if (form.min_value === '' || form.max_value === '') {
        return 'Has d’informar el mínim i el màxim.'
      }
      if (Number(form.min_value) > Number(form.max_value)) {
        return 'El mínim no pot ser superior al màxim.'
      }
    }

    if (form.condition_type === 'EQUALS') {
      const hasNumeric = form.exact_numeric_value !== ''
      const hasText = form.exact_text_value.trim() !== ''
      if (!hasNumeric && !hasText) {
        return 'Has d’informar un valor exacte.'
      }
    }

    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationError = validateForm()

    if (validationError) {
      setSaveError(validationError)
      return
    }

    setIsSaving(true)
    setSaveError('')
    setSuccess('')

    try {
      const payload = buildPayload(form, user)

      if (isNew) {
        const created = await alertsService.createAlert(payload)
        setSuccess('Alerta creada correctament.')
        navigate(`/alerts/${created.id}`, { replace: true })
        return
      }

      await alertsService.updateAlert(alertId, payload)
      setSuccess('Alerta actualitzada correctament.')
    } catch (error) {
      setSaveError(error.message || "No s'ha pogut desar l'alerta.")
    } finally {
      setIsSaving(false)
    }
  }

  const title = isNew ? 'Nova alerta' : 'Editar alerta'

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-400">Alerts</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h1>
            <p className="mt-2 text-sm text-slate-500">
              Defineix una alerta per planta o per instal·lació i configura la condició que dispararà l’email.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/alerts')}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Tornar
            </button>
          </div>
        </div>

        {isLoading ? <p className="mt-6 text-sm text-slate-500">Carregant...</p> : null}
        {loadError ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        {!isLoading && !loadError ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {user?.role_code?.toUpperCase() === 'ADMIN' ? (
                <Field label="Client" required>
                  <SelectInput name="client_id" value={form.client_id} onChange={handleChange}>
                    <option value="">Selecciona un client</option>
                    {clients.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code ? `${item.code} · ` : ''}{item.name}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              ) : (
                <Field label="Client">
                  <TextInput
                    value={user?.client_name || user?.client_trade_name || user?.client_id || ''}
                    disabled
                  />
                </Field>
              )}

              <Field label="Nom de l'alerta" required>
                <TextInput
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ex. Humitat baixa ficus recepció"
                />
              </Field>

              <Field
                label="Instal·lació"
                required={!form.plant_id}
                hint="Si informes una planta, l'alerta actuarà sobre aquella planta. Si només informes la instal·lació, s'aplicarà a totes les plantes de la instal·lació."
              >
                <SelectInput
                  name="installation_id"
                  value={form.installation_id}
                  onChange={handleChange}
                >
                  <option value="">Selecciona una instal·lació</option>
                  {availableInstallations.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code ? `${item.code} · ` : ''}{item.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label="Planta" hint="Opcional. Si la selecciones, la regla s'aplicarà només a aquesta planta.">
                <SelectInput name="plant_id" value={form.plant_id} onChange={handleChange}>
                  <option value="">Totes les plantes de la instal·lació</option>
                  {availablePlants.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code ? `${item.code} · ` : ''}{item.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field
                label="Reading type"
                required
                hint={
                  readingTypesLoadError ||
                  "Si més endavant exposes /reading-types al backend, aquest selector es podrà omplir automàticament."
                }
              >
                {readingTypes.length > 0 ? (
                  <SelectInput
                    name="reading_type_id"
                    value={form.reading_type_id}
                    onChange={handleChange}
                  >
                    <option value="">Selecciona un reading type</option>
                    {readingTypes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {(item.code || item.name || item.id) +
                          (resolveValueType(item) ? ` · ${resolveValueType(item)}` : '')}
                      </option>
                    ))}
                  </SelectInput>
                ) : (
                  <TextInput
                    name="reading_type_id"
                    value={form.reading_type_id}
                    onChange={handleChange}
                    placeholder="UUID del reading type"
                  />
                )}
              </Field>

              <Field label="Tipus de condició" required>
                <SelectInput
                  name="condition_type"
                  value={form.condition_type}
                  onChange={handleChange}
                >
                  {conditionOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label="Email destinatari" required>
                <TextInput
                  type="email"
                  name="recipient_email"
                  value={form.recipient_email}
                  onChange={handleChange}
                  placeholder="alerts@empresa.com"
                />
              </Field>

              <Field label="Canal">
                <TextInput value="EMAIL" disabled />
              </Field>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-900">Valors de la regla</h2>
              <p className="mt-1 text-sm text-slate-500">
                El tipus de valor depèn del reading type seleccionat.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {(form.condition_type === 'MIN' || form.condition_type === 'RANGE') ? (
                  <Field label="Valor mínim" required={form.condition_type !== 'MAX'}>
                    <TextInput
                      type="number"
                      step="any"
                      name="min_value"
                      value={form.min_value}
                      onChange={handleChange}
                      placeholder="0"
                    />
                  </Field>
                ) : null}

                {(form.condition_type === 'MAX' || form.condition_type === 'RANGE') ? (
                  <Field label="Valor màxim" required={form.condition_type !== 'MIN'}>
                    <TextInput
                      type="number"
                      step="any"
                      name="max_value"
                      value={form.max_value}
                      onChange={handleChange}
                      placeholder="100"
                    />
                  </Field>
                ) : null}

                {form.condition_type === 'EQUALS' ? (
                  <>
                    <Field label="Valor exacte numèric">
                      <TextInput
                        type="number"
                        step="any"
                        name="exact_numeric_value"
                        value={form.exact_numeric_value}
                        onChange={handleChange}
                        placeholder="Ex. 25"
                      />
                    </Field>

                    <Field label="Valor exacte text">
                      <TextInput
                        name="exact_text_value"
                        value={form.exact_text_value}
                        onChange={handleChange}
                        placeholder="Ex. dry"
                      />
                    </Field>
                  </>
                ) : null}

                {form.condition_type === 'BOOLEAN_EQUALS' ? (
                  <Field label="Valor booleà" required>
                    <SelectInput
                      name="exact_boolean_value"
                      value={form.exact_boolean_value}
                      onChange={handleChange}
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </SelectInput>
                  </Field>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Field label="Descripció">
                <TextArea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Context funcional de l'alerta"
                />
              </Field>

              <Field label="Estat">
                <Toggle
                  checked={form.is_active}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, is_active: event.target.checked }))
                  }
                  label={form.is_active ? 'Alerta activa' : 'Alerta inactiva'}
                />
              </Field>
            </div>

            {saveError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {saveError}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {isSaving ? 'Desant...' : isNew ? 'Crear alerta' : 'Desar canvis'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/alerts')}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel·lar
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </div>
  )
}
