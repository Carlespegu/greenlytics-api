import { useEffect, useMemo, useRef, useState } from 'react'
import { clientsService } from '../services/clientsService'
import { useLanguage } from '../context/LanguageContext'
import LoadingOverlay from './LoadingOverlay'

const EMPTY_FORM = {
  client_id: '',
  client_name: '',
  code: '',
  name: '',
  description: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  latitude: '',
  longitude: '',
  is_active: true,
  modified_on: null,
}

const UI_TEXT = {
  ca: {
    newInstallation: 'Nova instal·lació',
    editInstallation: 'Editar instal·lació',
    helper: 'Crea una nova instal·lació i assigna-la al client corresponent.',
    editHelper: 'Actualitza les dades principals de la instal·lació seleccionada.',
    client: 'Client',
    searchClient: 'Buscar client...',
    selectClient: 'Selecciona un client',
    noClients: 'No s’han trobat clients.',
    clearSelection: 'Netejar selecció',
    loadMore: 'Carregar més',
    loading: 'Carregant...',
    code: 'Codi',
    name: 'Nom',
    description: 'Descripció',
    address: 'Adreça',
    city: 'Ciutat',
    state: 'Província / Estat',
    postalCode: 'Codi postal',
    country: 'País',
    latitude: 'Latitud',
    longitude: 'Longitud',
    active: 'Activa',
    save: 'Desar',
    saving: 'Desant...',
    cancel: 'Cancel·lar',
    requiredClient: 'Has de seleccionar un client.',
    requiredCode: 'El camp "Codi" és obligatori.',
    requiredName: 'El camp "Nom" és obligatori.',
    invalidLatitude: 'La latitud ha d\'estar entre -90 i 90.',
    invalidLongitude: 'La longitud ha d\'estar entre -180 i 180.',
  },
  es: {
    newInstallation: 'Nueva instalación',
    editInstallation: 'Editar instalación',
    helper: 'Crea una nueva instalación y asígnala al cliente correspondiente.',
    editHelper: 'Actualiza los datos principales de la instalación seleccionada.',
    client: 'Cliente',
    searchClient: 'Buscar cliente...',
    selectClient: 'Selecciona un cliente',
    noClients: 'No se han encontrado clientes.',
    clearSelection: 'Limpiar selección',
    loadMore: 'Cargar más',
    loading: 'Cargando...',
    code: 'Código',
    name: 'Nombre',
    description: 'Descripción',
    address: 'Dirección',
    city: 'Ciudad',
    state: 'Provincia / Estado',
    postalCode: 'Código postal',
    country: 'País',
    latitude: 'Latitud',
    longitude: 'Longitud',
    active: 'Activa',
    save: 'Guardar',
    saving: 'Guardando...',
    cancel: 'Cancelar',
    requiredClient: 'Debes seleccionar un cliente.',
    requiredCode: 'El campo "Código" es obligatorio.',
    requiredName: 'El campo "Nombre" es obligatorio.',
    invalidLatitude: 'La latitud debe estar entre -90 y 90.',
    invalidLongitude: 'La longitud debe estar entre -180 y 180.',
  },
  en: {
    newInstallation: 'New installation',
    editInstallation: 'Edit installation',
    helper: 'Create a new installation and assign it to the right client.',
    editHelper: 'Update the main data of the selected installation.',
    client: 'Client',
    searchClient: 'Search client...',
    selectClient: 'Select a client',
    noClients: 'No clients found.',
    clearSelection: 'Clear selection',
    loadMore: 'Load more',
    loading: 'Loading...',
    code: 'Code',
    name: 'Name',
    description: 'Description',
    address: 'Address',
    city: 'City',
    state: 'State / Province',
    postalCode: 'Postal code',
    country: 'Country',
    latitude: 'Latitude',
    longitude: 'Longitude',
    active: 'Active',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    requiredClient: 'You must select a client.',
    requiredCode: 'The "Code" field is required.',
    requiredName: 'The "Name" field is required.',
    invalidLatitude: 'Latitude must be between -90 and 90.',
    invalidLongitude: 'Longitude must be between -180 and 180.',
  },
}

function mergeUniqueById(items = []) {
  const map = new Map()
  for (const item of items) {
    if (!item?.id) continue
    map.set(item.id, item)
  }
  return Array.from(map.values())
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

function Field({ label, required = false, children, fullWidth = false }) {
  return (
    <label className={`space-y-2 text-sm text-slate-700 ${fullWidth ? 'md:col-span-2' : ''}`}>
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  )
}

function ClientSingleSelect({
  value,
  onChange,
  disabled = false,
  text,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [options, setOptions] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const cacheRef = useRef(new Map())

  const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery])

  function applyCacheEntry(entry) {
    setOptions(entry?.items || [])
    setTotal(entry?.total || 0)
  }

  async function loadQueryPage(query, page = 1) {
    const key = query.trim().toLowerCase()
    const cachedEntry = cacheRef.current.get(key)

    if (cachedEntry?.pagesLoaded?.has(page)) {
      applyCacheEntry(cachedEntry)
      return
    }

    setIsLoading(true)

    try {
      const payload = await clientsService.searchClientOptions({
        query,
        page,
        pageSize: 10,
      })

      const previousItems = page === 1 ? [] : (cachedEntry?.items || [])
      const nextItems = mergeUniqueById([...previousItems, ...(payload.items || [])])
      const pagesLoaded = new Set(cachedEntry?.pagesLoaded || [])
      pagesLoaded.add(page)

      const nextEntry = {
        items: nextItems,
        total: payload.total || 0,
        pagesLoaded,
      }

      cacheRef.current.set(key, nextEntry)
      applyCacheEntry(nextEntry)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isOpen || disabled) return
    loadQueryPage(searchQuery, 1)
  }, [disabled, isOpen, searchQuery])

  async function handleLoadMore() {
    const cacheEntry = cacheRef.current.get(normalizedQuery)
    const loadedCount = cacheEntry?.items?.length || 0
    if (loadedCount >= (cacheEntry?.total || 0)) return

    const nextPage = (cacheEntry?.pagesLoaded?.size || 0) + 1
    await loadQueryPage(searchQuery, nextPage)
  }

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
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={text.searchClient}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />

          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {options.map((item) => {
              const checked = value?.id === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onChange(item)
                    setIsOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-50 ${
                    checked ? 'bg-slate-50' : ''
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${checked ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {item.name}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {item.code}
                    </span>
                  </span>
                </button>
              )
            })}

            {!isLoading && options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-slate-500">{text.noClients}</p>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setSearchQuery('')
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {text.clearSelection}
            </button>

            {options.length < total ? (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoading}
                className="rounded-xl px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {isLoading ? text.loading : text.loadMore}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function InstallationCreateModal({
  isOpen,
  mode = 'create',
  installation = null,
  isAdmin = false,
  readOnly = false,
  defaultClient = null,
  onClose,
  onSave,
  isSaving = false,
  error = '',
}) {
  const { language } = useLanguage()
  const text = UI_TEXT[language] || UI_TEXT.ca
  const [form, setForm] = useState(EMPTY_FORM)
  const [selectedClient, setSelectedClient] = useState(defaultClient)
  const [validationError, setValidationError] = useState('')
  const title = mode === 'edit'
    ? `${text.editInstallation} - ${installation?.name || ''}`
    : text.newInstallation
  const helper = mode === 'edit' ? text.editHelper : text.helper

  useEffect(() => {
    if (!isOpen) return

    setValidationError('')
    const baseClient = installation?.client_id
      ? {
          id: installation.client_id,
          name: installation.client_name || defaultClient?.name || '',
          code: installation.client_code || defaultClient?.code || '',
        }
      : defaultClient

    setSelectedClient(baseClient)
    setForm({
      ...EMPTY_FORM,
      ...installation,
      client_id: installation?.client_id || defaultClient?.id || '',
      client_name: baseClient?.name || '',
      code: installation?.code || '',
      name: installation?.name || '',
      description: installation?.description || '',
      address: installation?.address || '',
      city: installation?.city || '',
      state: installation?.state || '',
      postal_code: installation?.postal_code || '',
      country: installation?.country || '',
      latitude: installation?.latitude ?? '',
      longitude: installation?.longitude ?? '',
      is_active: installation?.is_active ?? true,
    })
  }, [defaultClient, installation, isOpen])

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
    setValidationError('')

    const clientId = isAdmin ? selectedClient?.id || '' : form.client_id || defaultClient?.id || ''
    const code = form.code.trim()
    const name = form.name.trim()

    if (!clientId) {
      setValidationError(text.requiredClient)
      return
    }

    if (!code) {
      setValidationError(text.requiredCode)
      return
    }

    if (!name) {
      setValidationError(text.requiredName)
      return
    }

    const latitude = form.latitude === '' ? null : Number(form.latitude)
    const longitude = form.longitude === '' ? null : Number(form.longitude)

    if (latitude !== null && (Number.isNaN(latitude) || latitude < -90 || latitude > 90)) {
      setValidationError(text.invalidLatitude)
      return
    }

    if (longitude !== null && (Number.isNaN(longitude) || longitude < -180 || longitude > 180)) {
      setValidationError(text.invalidLongitude)
      return
    }

    onSave({
      client_id: clientId,
      code,
      name,
      description: form.description.trim() || null,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      postal_code: form.postal_code.trim() || null,
      country: form.country.trim() || null,
      latitude,
      longitude,
      is_active: Boolean(form.is_active),
      modified_on: mode === 'edit' ? form.modified_on || null : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{helper}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isAdmin ? (
              <Field label={text.client} required>
                <ClientSingleSelect
                  value={selectedClient}
                  onChange={(client) => {
                    setSelectedClient(client)
                    setForm((prev) => ({
                      ...prev,
                      client_id: client?.id || '',
                      client_name: client?.name || '',
                    }))
                  }}
                  disabled={isSaving || readOnly}
                  text={text}
                />
              </Field>
            ) : null}

            <Field label={text.code} required>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.name} required>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.description} fullWidth>
              <input
                name="description"
                value={form.description}
                onChange={handleChange}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.address} fullWidth>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.city}>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.state}>
              <input
                name="state"
                value={form.state}
                onChange={handleChange}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.postalCode}>
              <input
                name="postal_code"
                value={form.postal_code}
                onChange={handleChange}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.country}>
              <input
                name="country"
                value={form.country}
                onChange={handleChange}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.latitude}>
              <input
                type="number"
                step="any"
                name="latitude"
                value={form.latitude}
                onChange={handleChange}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.longitude}>
              <input
                type="number"
                step="any"
                name="longitude"
                value={form.longitude}
                onChange={handleChange}
                disabled={readOnly}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </Field>

            <div className="space-y-2 text-sm text-slate-700">
              <span className="block">{text.active}</span>
              <BinarySwitch
                checked={Boolean(form.is_active)}
                onChange={(value) => setForm((prev) => ({ ...prev, is_active: value }))}
                disabled={isSaving || readOnly}
              />
            </div>
          </div>

          {validationError || error ? (
            <p className="text-sm text-red-600">{validationError || error}</p>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving || readOnly}
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
      </div>
      <LoadingOverlay
        visible={isSaving}
        label={text.saving}
        transparent
      />
    </div>
  )
}
