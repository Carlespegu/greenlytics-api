import { useEffect, useMemo, useRef, useState } from 'react'
import { clientsService } from '../services/clientsService'
import { deviceTypesService } from '../services/deviceTypesService'
import { useLanguage } from '../context/LanguageContext'

function FilterInput({ name, value, onChange, placeholder, disabled = false }) {
  return (
    <input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
    />
  )
}

function TriStateSwitch({ value, onChange, disabled = false }) {
  function handleClick() {
    if (disabled) return

    if (value === null) onChange(true)
    else if (value === true) onChange(false)
    else onChange(null)
  }

  const bgClass =
    value === true
      ? 'bg-emerald-600'
      : value === false
        ? 'bg-slate-500'
        : 'bg-slate-300'

  const thumbClass =
    value === true
      ? 'translate-x-8'
      : value === false
        ? 'translate-x-1'
        : 'translate-x-4'

  const { language } = useLanguage()
  const text = useMemo(() => getDeviceFilterText(language), [language])
  const label = value === true ? text.yes : value === false ? text.no : text.all

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={value === true}
        aria-label={`${text.active}: ${label}`}
        onClick={handleClick}
        disabled={disabled}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${bgClass} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${thumbClass}`}
        />
      </button>
      <span className="text-sm text-slate-700">{label}</span>
    </div>
  )
}

function getDeviceFilterText(language) {
  const texts = {
    ca: {
      yes: 'Sí',
      no: 'No',
      all: 'Tots',
      active: 'Actiu',
      clients: 'Clients',
      searchClient: 'Buscar client...',
      noClients: 'No s\'han trobat clients.',
      clientsSelected: (count) => `${count} client${count === 1 ? '' : 's'} seleccionats`,
      clientsAll: 'Clients: tots',
      deviceType: 'Tipus de dispositiu',
      searchDeviceType: 'Buscar tipus de dispositiu...',
      noDeviceTypes: 'No s\'han trobat tipus de dispositiu.',
      deviceTypesSelected: (count) => `${count} tipus de dispositiu seleccionats`,
      deviceTypesAll: 'Tipus de dispositiu: tots',
      clearSelection: 'Netejar selecció',
      loading: 'Carregant...',
      loadMore: 'Carregar més',
      code: 'Codi',
      name: 'Nom',
      description: 'Descripció',
      serial: 'Serial',
      statusAll: 'Status: tots',
      search: 'Cercar',
      reset: 'Netejar filtres',
    },
    es: {
      yes: 'Sí',
      no: 'No',
      all: 'Todos',
      active: 'Activo',
      clients: 'Clientes',
      searchClient: 'Buscar cliente...',
      noClients: 'No se han encontrado clientes.',
      clientsSelected: (count) => `${count} cliente${count === 1 ? '' : 's'} seleccionados`,
      clientsAll: 'Clientes: todos',
      deviceType: 'Tipo de dispositivo',
      searchDeviceType: 'Buscar tipo de dispositivo...',
      noDeviceTypes: 'No se han encontrado tipos de dispositivo.',
      deviceTypesSelected: (count) => `${count} tipos de dispositivo seleccionados`,
      deviceTypesAll: 'Tipo de dispositivo: todos',
      clearSelection: 'Limpiar selección',
      loading: 'Cargando...',
      loadMore: 'Cargar más',
      code: 'Código',
      name: 'Nombre',
      description: 'Descripción',
      serial: 'Serie',
      statusAll: 'Estado: todos',
      search: 'Buscar',
      reset: 'Limpiar filtros',
    },
    en: {
      yes: 'Yes',
      no: 'No',
      all: 'All',
      active: 'Active',
      clients: 'Clients',
      searchClient: 'Search client...',
      noClients: 'No clients found.',
      clientsSelected: (count) => `${count} client${count === 1 ? '' : 's'} selected`,
      clientsAll: 'Clients: all',
      deviceType: 'Device type',
      searchDeviceType: 'Search device type...',
      noDeviceTypes: 'No device types found.',
      deviceTypesSelected: (count) => `${count} device types selected`,
      deviceTypesAll: 'Device type: all',
      clearSelection: 'Clear selection',
      loading: 'Loading...',
      loadMore: 'Load more',
      code: 'Code',
      name: 'Name',
      description: 'Description',
      serial: 'Serial',
      statusAll: 'Status: all',
      search: 'Search',
      reset: 'Clear filters',
    },
  }

  return texts[language] || texts.ca
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

function mergeUniqueById(items = []) {
  const seen = new Map()

  for (const item of items) {
    if (!item?.id) continue
    seen.set(item.id, item)
  }

  return Array.from(seen.values())
}

function LazyMultiSelectFilter({
  label,
  placeholder,
  emptyMessage,
  selectedItems = [],
  onChange,
  loadOptions,
  getSummaryLabel,
  disabled = false,
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
      const payload = await loadOptions({
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

  function toggleOption(option) {
    const exists = selectedItems.some((item) => item.id === option.id)
    const nextItems = exists
      ? selectedItems.filter((item) => item.id !== option.id)
      : [...selectedItems, option]

    onChange(mergeUniqueById(nextItems))
  }

  async function handleLoadMore() {
    const cacheEntry = cacheRef.current.get(normalizedQuery)
    const loadedCount = cacheEntry?.items?.length || 0

    if (loadedCount >= (cacheEntry?.total || 0)) return

    const nextPage = (cacheEntry?.pagesLoaded?.size || 0) + 1
    await loadQueryPage(searchQuery, nextPage)
  }

  return (
    <div className="space-y-2 text-sm text-slate-700">
      <span className="block">{label}</span>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
        >
          <span className="truncate">{getSummaryLabel(selectedItems)}</span>
          <span className="text-slate-400">{isOpen ? '^' : 'v'}</span>
        </button>

        {isOpen ? (
          <div className="absolute z-30 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />

            {selectedItems.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleOption(item)}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
              {options.map((item) => {
                const checked = selectedItems.some((selected) => selected.id === item.id)

                return (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOption(item)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {item.name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {item.code}
                      </span>
                    </span>
                  </label>
                )
              })}

              {!isLoading && options.length === 0 ? (
                <p className="px-3 py-2 text-sm text-slate-500">{emptyMessage}</p>
              ) : null}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  onChange([])
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
    </div>
  )
}

function ClientMultiSelectFilter(props) {
  const { language } = useLanguage()
  const text = useMemo(() => getDeviceFilterText(language), [language])

  return (
    <LazyMultiSelectFilter
      {...props}
      label={text.clients}
      placeholder={text.searchClient}
      emptyMessage={text.noClients}
      getSummaryLabel={(items) =>
        items.length
          ? text.clientsSelected(items.length)
          : text.clientsAll
      }
      loadOptions={clientsService.searchClientOptions}
    />
  )
}

function DeviceTypeMultiSelectFilter(props) {
  const { language } = useLanguage()
  const text = useMemo(() => getDeviceFilterText(language), [language])

  return (
    <LazyMultiSelectFilter
      {...props}
      label={text.deviceType}
      placeholder={text.searchDeviceType}
      emptyMessage={text.noDeviceTypes}
      getSummaryLabel={(items) =>
        items.length
          ? text.deviceTypesSelected(items.length)
          : text.deviceTypesAll
      }
      loadOptions={deviceTypesService.searchDeviceTypeOptions}
    />
  )
}

export default function DeviceFiltersV2({
  initialFilters,
  onSearch,
  onReset,
  showClientFilter = false,
  disabled = false,
}) {
  const { language } = useLanguage()
  const text = useMemo(() => getDeviceFilterText(language), [language])
  const [filters, setFilters] = useState(initialFilters ?? EMPTY_FILTERS)

  useEffect(() => {
    setFilters(initialFilters ?? EMPTY_FILTERS)
  }, [initialFilters])

  function handleChange(event) {
    const { name, value } = event.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSearch(filters)
  }

  function handleResetClick() {
    setFilters(EMPTY_FILTERS)
    onReset()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FilterInput
          name="code"
          value={filters.code ?? ''}
          onChange={handleChange}
          placeholder={text.code}
          disabled={disabled}
        />
        <FilterInput
          name="name"
          value={filters.name ?? ''}
          onChange={handleChange}
          placeholder={text.name}
          disabled={disabled}
        />
        <FilterInput
          name="description"
          value={filters.description ?? ''}
          onChange={handleChange}
          placeholder={text.description}
          disabled={disabled}
        />
        <FilterInput
          name="serial_number"
          value={filters.serial_number ?? ''}
          onChange={handleChange}
          placeholder={text.serial}
          disabled={disabled}
        />
        <DeviceTypeMultiSelectFilter
          selectedItems={filters.device_type_items ?? []}
          onChange={(items) =>
            setFilters((prev) => ({
              ...prev,
              device_type_id: '',
              device_type_items: items,
              device_type_ids: items.map((item) => item.id),
            }))
          }
          disabled={disabled}
        />

        {showClientFilter ? (
          <ClientMultiSelectFilter
            selectedItems={filters.client_items ?? []}
            onChange={(items) =>
              setFilters((prev) => ({
                ...prev,
                client_items: items,
                client_ids: items.map((item) => item.id),
              }))
            }
            disabled={disabled}
          />
        ) : null}

        <select
          name="status"
          value={filters.status ?? ''}
          onChange={handleChange}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
        >
          <option value="">{text.statusAll}</option>
          <option value="online">online</option>
          <option value="offline">offline</option>
          <option value="warning">warning</option>
          <option value="error">error</option>
        </select>

        <div className="space-y-2 text-sm text-slate-700">
          <span className="block">{text.active}</span>
          <TriStateSwitch
            value={filters.is_active ?? null}
            onChange={(value) => setFilters((prev) => ({ ...prev, is_active: value }))}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          {text.search}
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={handleResetClick}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {text.reset}
        </button>
      </div>
    </form>
  )
}
