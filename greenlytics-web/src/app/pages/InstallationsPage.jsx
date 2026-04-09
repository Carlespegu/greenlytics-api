import { useEffect, useMemo, useState } from 'react'
import CollapsibleFiltersCard from '../components/CollapsibleFiltersCard'
import CompactPagination from '../components/CompactPagination'
import BackofficeListHeader from '../components/BackofficeListHeader'
import InstallationCreateModal from '../components/InstallationCreateModal'
import InstallationDevicesModal from '../components/InstallationDevicesModal'
import InstallationPlantsModal from '../components/InstallationPlantsModal'
import LoadingOverlay from '../components/LoadingOverlay'
import RowActionsDropdown from '../components/RowActionsDropdown'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { installationsService } from '../services/installationsService'

function FilterInput({ name, value, onChange, placeholder }) {
  return (
    <input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
    />
  )
}

function TriStateSwitch({ value, onChange, labels }) {
  function handleClick() {
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

  const label = value === true ? labels.yes : value === false ? labels.no : labels.all

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={value === true}
        aria-label={`${labels.active}: ${label}`}
        onClick={handleClick}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${bgClass}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${thumbClass}`}
        />
      </button>
      <span className="text-sm text-slate-700">{label}</span>
    </div>
  )
}

const EMPTY_FILTERS = { name: '', state: '', code: '', is_active: null }

export default function InstallationsPage() {
  const { roleCode, user } = useAuth()
  const { language } = useLanguage()
  const normalizedRoleCode = (roleCode || '').toUpperCase()
  const isAdmin = normalizedRoleCode === 'ADMIN'
  const isViewer = normalizedRoleCode === 'VIEWER'
  const canCreateInstallations = ['ADMIN', 'MANAGER'].includes(normalizedRoleCode)
  const canEditInstallations = ['ADMIN', 'MANAGER'].includes(normalizedRoleCode)
  const canOpenInstallationDetail = ['ADMIN', 'MANAGER', 'VIEWER'].includes(normalizedRoleCode)

  const [allItems, setAllItems] = useState([])
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedInstallation, setSelectedInstallation] = useState(null)
  const [isDevicesOpen, setIsDevicesOpen] = useState(false)
  const [isPlantsOpen, setIsPlantsOpen] = useState(false)

  const text = useMemo(() => {
    const texts = {
      ca: {
        pageTitle: 'Instal·lacions',
        pageDescription: 'Consulta les instal·lacions, revisa’n l’estat i filtra el llistat ràpidament.',
        filters: 'Filtres',
        listDescription: 'Ajusta criteris per localitzar instal·lacions més ràpidament.',
        name: 'Nom',
        location: 'Ubicació',
        code: 'Codi',
        active: 'Activa',
        search: 'Cercar',
        clearFilters: 'Netejar filtres',
        listTitle: 'Llistat d’instal·lacions',
        new: 'Nou',
        loading: 'Carregant...',
        loadError: 'No s’han pogut carregar les instal·lacions.',
        saveError: 'No s’ha pogut desar la instal·lació.',
        noResults: 'No s’han trobat instal·lacions.',
        latitude: 'Latitud',
        longitude: 'Longitud',
        saving: 'Desant...',
        actions: 'Accions',
        edit: 'Editar',
        activate: 'Activar',
        deactivate: 'Desactivar',
        devices: 'Dispositius',
        plants: 'Plantes',
        yes: 'Sí',
        no: 'No',
        all: 'Totes',
      },
      es: {
        pageTitle: 'Instalaciones',
        pageDescription: 'Consulta las instalaciones, revisa su estado y filtra el listado rápidamente.',
        filters: 'Filtros',
        listDescription: 'Ajusta criterios para localizar instalaciones más rápido.',
        name: 'Nombre',
        location: 'Ubicación',
        code: 'Código',
        active: 'Activa',
        search: 'Buscar',
        clearFilters: 'Limpiar filtros',
        listTitle: 'Listado de instalaciones',
        new: 'Nuevo',
        loading: 'Cargando...',
        loadError: 'No se han podido cargar las instalaciones.',
        saveError: 'No se ha podido guardar la instalación.',
        noResults: 'No se han encontrado instalaciones.',
        latitude: 'Latitud',
        longitude: 'Longitud',
        saving: 'Guardando...',
        actions: 'Acciones',
        edit: 'Editar',
        activate: 'Activar',
        deactivate: 'Desactivar',
        devices: 'Dispositivos',
        plants: 'Plantas',
        yes: 'Sí',
        no: 'No',
        all: 'Todas',
      },
      en: {
        pageTitle: 'Installations',
        pageDescription: 'Review installations, inspect their status and filter the list quickly.',
        filters: 'Filters',
        listDescription: 'Adjust criteria to find installations faster.',
        name: 'Name',
        location: 'Location',
        code: 'Code',
        active: 'Active',
        search: 'Search',
        clearFilters: 'Clear filters',
        listTitle: 'Installations list',
        new: 'New',
        loading: 'Loading...',
        loadError: 'Could not load installations.',
        saveError: 'Could not save installation.',
        noResults: 'No installations found.',
        latitude: 'Latitude',
        longitude: 'Longitude',
        saving: 'Saving...',
        actions: 'Actions',
        edit: 'Edit',
        activate: 'Activate',
        deactivate: 'Deactivate',
        devices: 'Devices',
        plants: 'Plants',
        yes: 'Yes',
        no: 'No',
        all: 'All',
      },
    }

    return texts[language] || texts.ca
  }, [language])

  const activeFilterCount = useMemo(
    () => Object.values(appliedFilters).filter((value) => value !== '' && value !== null).length,
    [appliedFilters]
  )

  useEffect(() => {
    async function load() {
      try {
        const data = await installationsService.listInstallations()
        setAllItems(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || text.loadError)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [text.loadError])

  useEffect(() => {
    let filtered = [...allItems]

    if (appliedFilters.name) {
      filtered = filtered.filter((item) =>
        String(item.name || '').toLowerCase().includes(appliedFilters.name.toLowerCase())
      )
    }

    if (appliedFilters.state) {
      filtered = filtered.filter((item) =>
        String(item.state || '').toLowerCase().includes(appliedFilters.state.toLowerCase())
      )
    }

    if (appliedFilters.code) {
      filtered = filtered.filter((item) =>
        String(item.code || '').toLowerCase().includes(appliedFilters.code.toLowerCase())
      )
    }

    if (appliedFilters.is_active !== null) {
      filtered = filtered.filter((item) => Boolean(item.is_active) === appliedFilters.is_active)
    }

    setTotal(filtered.length)
    const start = (page - 1) * pageSize
    setItems(filtered.slice(start, start + pageSize))
  }, [allItems, appliedFilters, page, pageSize])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleSearch(event) {
    event.preventDefault()
    setPage(1)
    setAppliedFilters(filters)
  }

  function handleClear() {
    setPage(1)
    setFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
  }

  async function handleCreateInstallation(payload) {
    setIsSaving(true)
    setSaveError('')
    const wasCreating = modalMode !== 'edit'

    try {
      if (modalMode === 'edit' && selectedInstallation?.id) {
        await installationsService.updateInstallation(selectedInstallation.id, payload)
      } else {
        await installationsService.createInstallation(payload)
      }
    } catch (err) {
      if (wasCreating) {
        try {
          const fallbackData = await installationsService.listInstallations()
          const normalizedItems = Array.isArray(fallbackData) ? fallbackData : []
          const recoveredItem = normalizedItems.find(
            (item) =>
              String(item.client_id || '') === String(payload.client_id || '') &&
              String(item.code || '').trim().toLowerCase() === String(payload.code || '').trim().toLowerCase()
          )

          if (recoveredItem) {
            setPage(1)
            setAllItems(normalizedItems)
            setIsCreateOpen(false)
            setSelectedInstallation(null)
            setModalMode('create')
            return
          }
        } catch (fallbackError) {
          // Ignore fallback errors and surface the original save error below.
        }
      }

      setSaveError(err.message || text.saveError)
      return
    } finally {
      setIsSaving(false)
    }

    if (wasCreating) {
      setPage(1)
    }

    setIsCreateOpen(false)
    setSelectedInstallation(null)
    setModalMode('create')
    const data = await installationsService.listInstallations()
    setAllItems(Array.isArray(data) ? data : [])
  }

  const defaultClient = isAdmin
    ? null
    : {
        id: user?.client_id || '',
        name: user?.client_name || user?.client_trade_name || '',
        code: user?.client_code || '',
      }

  async function handleEditInstallation(item) {
    if (!canOpenInstallationDetail) return

    setIsSaving(true)
    setError('')

    try {
      const payload = await installationsService.getInstallation(item.id)
      setSelectedInstallation(payload)
      setModalMode('edit')
      setIsCreateOpen(true)
    } catch (err) {
      setError(err.message || text.saveError)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleInstallationActive(item) {
    if (!canEditInstallations) return

    setIsSaving(true)
    setError('')

    try {
      const nextActive = !item.is_active

      await installationsService.updateInstallation(item.id, {
        client_id: item.client_id,
        code: item.code,
        name: item.name,
        description: item.description,
        address: item.address,
        city: item.city,
        state: item.state,
        postal_code: item.postal_code,
        country: item.country,
        latitude: item.latitude,
        longitude: item.longitude,
        is_active: nextActive,
      })

      const data = await installationsService.listInstallations()
      setAllItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || text.saveError)
    } finally {
      setIsSaving(false)
    }
  }

  function handleOpenDevices(item) {
    setSelectedInstallation(item)
    setIsDevicesOpen(true)
  }

  function handleOpenPlants(item) {
    setSelectedInstallation(item)
    setIsPlantsOpen(true)
  }

  function handleCloseDevices(didSave) {
    setIsDevicesOpen(false)
    setSelectedInstallation(null)

    if (!didSave) return

    void (async () => {
      const data = await installationsService.listInstallations()
      setAllItems(Array.isArray(data) ? data : [])
    })()
  }

  function handleClosePlants(didSave) {
    setIsPlantsOpen(false)
    setSelectedInstallation(null)

    if (!didSave) return

    void (async () => {
      const data = await installationsService.listInstallations()
      setAllItems(Array.isArray(data) ? data : [])
    })()
  }

  return (
    <div className="space-y-6">
      <CollapsibleFiltersCard
        title={text.pageTitle}
        description={text.pageDescription}
        activeCount={activeFilterCount}
        defaultExpanded={false}
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterInput name="name" value={filters.name} onChange={handleFilterChange} placeholder={text.name} />
            <FilterInput name="state" value={filters.state} onChange={handleFilterChange} placeholder={text.location} />
            <FilterInput name="code" value={filters.code} onChange={handleFilterChange} placeholder={text.code} />

            <div className="space-y-2 text-sm text-slate-700">
              <span className="block">{text.active}</span>
              <TriStateSwitch
                value={filters.is_active}
                onChange={(value) => setFilters((prev) => ({ ...prev, is_active: value }))}
                labels={text}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              {text.search}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {text.clearFilters}
            </button>
          </div>
        </form>
      </CollapsibleFiltersCard>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-visible">
        <BackofficeListHeader
          title={text.listTitle}
          total={total}
          showNewButton={canCreateInstallations}
          newLabel={text.new}
          onNew={() => {
            setSaveError('')
            setIsCreateOpen(true)
          }}
          newDisabled={isLoading || isSaving}
        />

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 overflow-visible">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3">{text.name}</th>
                <th className="px-3 py-3">{text.code}</th>
                <th className="px-3 py-3">{text.location}</th>
                <th className="px-3 py-3">{text.latitude}</th>
                <th className="px-3 py-3">{text.longitude}</th>
                <th className="px-3 py-3">{text.active}</th>
                <th className="px-3 py-3 text-right">{text.actions}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{item.name || '-'}</td>
                  <td className="px-3 py-3">{item.code || '-'}</td>
                  <td className="px-3 py-3">{item.state || '-'}</td>
                  <td className="px-3 py-3">{item.latitude || '-'}</td>
                  <td className="px-3 py-3">{item.longitude || '-'}</td>
                  <td className="px-3 py-3">{item.is_active ? text.yes : text.no}</td>
                  <td className="px-3 py-3 text-right">
                    <RowActionsDropdown
                      disabled={isSaving}
                      actions={[
                        {
                          key: 'edit',
                          label: text.edit,
                          hidden: !canOpenInstallationDetail,
                          onClick: () => handleEditInstallation(item),
                        },
                        {
                          key: 'toggle-active',
                          label: item.is_active ? text.deactivate : text.activate,
                          hidden: false,
                          disabled: !canEditInstallations,
                          onClick: () => handleToggleInstallationActive(item),
                        },
                        {
                          key: 'devices',
                          label: text.devices,
                          onClick: () => handleOpenDevices(item),
                        },
                        {
                          key: 'plants',
                          label: text.plants,
                          onClick: () => handleOpenPlants(item),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}

              {!isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
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
      </section>

      <InstallationCreateModal
        isOpen={isCreateOpen}
        mode={modalMode}
        installation={selectedInstallation}
        isAdmin={isAdmin}
        readOnly={isViewer}
        defaultClient={defaultClient}
        onClose={() => {
          if (isSaving) return
          setIsCreateOpen(false)
          setSaveError('')
          setSelectedInstallation(null)
          setModalMode('create')
        }}
        onSave={handleCreateInstallation}
        isSaving={isSaving}
        error={saveError}
      />

      <InstallationDevicesModal
        isOpen={isDevicesOpen}
        installation={selectedInstallation}
        isAdmin={isAdmin}
        isViewer={isViewer}
        language={language}
        onClose={handleCloseDevices}
      />
      <InstallationPlantsModal
        isOpen={isPlantsOpen}
        installation={selectedInstallation}
        canEdit={canEditInstallations}
        language={language}
        onClose={handleClosePlants}
      />
      <LoadingOverlay
        visible={isLoading || isSaving}
        label={isSaving ? text.saving : text.loading}
        transparent
      />
    </div>
  )
}

