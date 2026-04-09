import { useEffect, useMemo, useState } from 'react'
import BackofficeListHeader from '../components/BackofficeListHeader'
import CollapsibleFiltersCard from '../components/CollapsibleFiltersCard'
import CompactPagination from '../components/CompactPagination'
import LoadingOverlay from '../components/LoadingOverlay'
import PlantCreateModal from '../components/PlantCreateModal'
import PlantEditModalTabs from '../components/PlantEditModalTabs'
import RowActionsDropdown from '../components/RowActionsDropdown'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { resolveConcurrencyErrorMessage } from '../lib/concurrency'
import { plantThresholdsService } from '../services/plantThresholdsService'
import { plantsService } from '../services/plantsService'

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

const EMPTY_FILTERS = { name: '', species: '', code: '' }

function normalizePlant(plant) {
  return {
    id: plant.id,
    client_id: plant.client_id || '',
    installation_id: plant.installation_id || '',
    code: plant.code || '',
    name: plant.name || '',
    common_name: plant.common_name || '',
    scientific_name: plant.scientific_name || '',
    plant_type: plant.plant_type || '',
    planting_type: plant.planting_type || '',
    location_type: plant.location_type || '',
    sun_exposure: plant.sun_exposure || '',
    pot_size_cm: plant.pot_size_cm ?? '',
    height_cm: plant.height_cm ?? '',
    width_cm: plant.width_cm ?? '',
    planting_date: plant.planting_date || '',
    last_repotting_date: plant.last_repotting_date || '',
    status: plant.status || '',
    notes: plant.notes || '',
    is_active: plant.is_active ?? true,
    created_by: plant.created_by || '',
    created_on: plant.created_on || '',
    modified_by: plant.modified_by || '',
    modified_on: plant.modified_on || '',
    is_deleted: Boolean(plant.is_deleted),
  }
}

export default function PlantsPage() {
  const { roleCode } = useAuth()
  const { language } = useLanguage()
  const normalizedRoleCode = (roleCode || '').toUpperCase()
  const canManagePlants = ['ADMIN', 'MANAGER'].includes(normalizedRoleCode)
  const canOpenPlantDetail = ['ADMIN', 'MANAGER', 'VIEWER'].includes(normalizedRoleCode)

  const [allItems, setAllItems] = useState([])
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedPlant, setSelectedPlant] = useState(null)
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false)

  const text = useMemo(() => {
    const texts = {
      ca: {
        pageTitle: 'Plantes',
        pageDescription: 'Consulta el catàleg de plantes, revisa’n l’estat i filtra el llistat ràpidament.',
        filters: 'Filtres',
        filtersDescription: 'Gestiona plantes actives vinculades a instal·lacions.',
        name: 'Nom',
        species: 'Espècie',
        code: 'Codi',
        installation: 'Instal·lació',
        active: 'Activa',
        actions: 'Accions',
        search: 'Cercar',
        clear: 'Netejar filtres',
        listTitle: 'Llistat de plantes',
        noResults: 'No s’han trobat plantes.',
        loading: 'Carregant plantes...',
        saving: 'Desant planta...',
        loadError: 'No s’han pogut carregar les plantes.',
        saveError: 'No s’ha pogut desar la planta.',
        deleteError: 'No s’ha pogut eliminar la planta.',
        saved: 'Planta desada correctament.',
        deleted: 'Planta eliminada correctament.',
        edit: 'Editar',
        delete: 'Eliminar',
        yes: 'Sí',
        no: 'No',
      },
      es: {
        pageTitle: 'Plantas',
        pageDescription: 'Consulta el catálogo de plantas, revisa su estado y filtra el listado rápidamente.',
        filters: 'Filtros',
        filtersDescription: 'Gestiona plantas activas vinculadas a instalaciones.',
        name: 'Nombre',
        species: 'Especie',
        code: 'Código',
        installation: 'Instalación',
        active: 'Activa',
        actions: 'Acciones',
        search: 'Buscar',
        clear: 'Limpiar filtros',
        listTitle: 'Listado de plantas',
        noResults: 'No se han encontrado plantas.',
        loading: 'Cargando plantas...',
        saving: 'Guardando planta...',
        loadError: 'No se han podido cargar las plantas.',
        saveError: 'No se ha podido guardar la planta.',
        deleteError: 'No se ha podido eliminar la planta.',
        saved: 'Planta guardada correctamente.',
        deleted: 'Planta eliminada correctamente.',
        edit: 'Editar',
        delete: 'Eliminar',
        yes: 'Sí',
        no: 'No',
      },
      en: {
        pageTitle: 'Plants',
        pageDescription: 'Review the plant catalog, inspect status and filter the list quickly.',
        filters: 'Filters',
        filtersDescription: 'Manage active plants linked to installations.',
        name: 'Name',
        species: 'Species',
        code: 'Code',
        installation: 'Installation',
        active: 'Active',
        actions: 'Actions',
        search: 'Search',
        clear: 'Clear filters',
        listTitle: 'Plants list',
        noResults: 'No plants found.',
        loading: 'Loading plants...',
        saving: 'Saving plant...',
        loadError: 'Could not load plants.',
        saveError: 'Could not save plant.',
        deleteError: 'Could not delete plant.',
        saved: 'Plant saved successfully.',
        deleted: 'Plant deleted successfully.',
        edit: 'Edit',
        delete: 'Delete',
        yes: 'Yes',
        no: 'No',
      },
    }

    return texts[language] || texts.ca
  }, [language])

  const activeFilterCount = useMemo(
    () => Object.values(appliedFilters).filter((value) => value !== '').length,
    [appliedFilters]
  )

  async function loadPlants() {
    setIsLoading(true)
    setError('')

    try {
      const payload = await plantsService.listPlants()
      const normalized = (Array.isArray(payload) ? payload : [])
        .map(normalizePlant)
        .filter((item) => !item.is_deleted)
      setAllItems(normalized)
    } catch (err) {
      setError(err.message || text.loadError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPlants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text.loadError])

  useEffect(() => {
    let filtered = [...allItems]

    if (appliedFilters.name) {
      filtered = filtered.filter((item) =>
        String(item.name || '').toLowerCase().includes(appliedFilters.name.toLowerCase())
      )
    }

    if (appliedFilters.species) {
      filtered = filtered.filter((item) =>
        [
          item.common_name,
          item.scientific_name,
          item.plant_type,
          item.planting_type,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(appliedFilters.species.toLowerCase())
      )
    }

    if (appliedFilters.code) {
      filtered = filtered.filter((item) =>
        String(item.code || '').toLowerCase().includes(appliedFilters.code.toLowerCase())
      )
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

  function handleNew() {
    if (!canManagePlants) return
    setSelectedPlant(null)
    setModalMode('create')
    setIsCreateModalOpen(true)
    setOpenDeleteConfirm(false)
    setError('')
    setSuccess('')
  }

  async function handleEdit(item) {
    if (!canOpenPlantDetail) return

    setIsSaving(true)
    setError('')
    try {
      const payload = await plantsService.getPlant(item.id)
      setSelectedPlant(normalizePlant(payload))
      setModalMode('edit')
      setOpenDeleteConfirm(false)
      setIsModalOpen(true)
    } catch (err) {
      setError(resolveConcurrencyErrorMessage(err, language, text.saveError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteClick(item) {
    if (!canManagePlants) return

    setIsSaving(true)
    setError('')
    try {
      const payload = await plantsService.getPlant(item.id)
      setSelectedPlant(normalizePlant(payload))
      setModalMode('edit')
      setOpenDeleteConfirm(true)
      setIsModalOpen(true)
    } catch (err) {
      setError(resolveConcurrencyErrorMessage(err, language, text.deleteError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSave(payload) {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const plantPayload = payload?.plant || payload
      const thresholdUpdates = Array.isArray(payload?.thresholdUpdates) ? payload.thresholdUpdates : []

      if (modalMode === 'create') {
        await plantsService.createPlant(plantPayload)
      } else {
        await plantsService.updatePlant(selectedPlant.id, plantPayload)
        if (thresholdUpdates.length > 0) {
          await Promise.all(
            thresholdUpdates.map((item) =>
              plantThresholdsService.updateThreshold(item.id, item.payload)
            )
          )
        }
      }
      setSuccess(text.saved)
      setIsModalOpen(false)
      setIsCreateModalOpen(false)
      setModalMode('create')
      setSelectedPlant(null)
      await loadPlants()
    } catch (err) {
      setError(err.message || text.saveError)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteConfirmed() {
    if (!selectedPlant?.id || !canManagePlants) return

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await plantsService.deletePlant(selectedPlant.id)
      setSuccess(text.deleted)
      setIsModalOpen(false)
      setSelectedPlant(null)
      await loadPlants()
    } catch (err) {
      setError(err.message || text.deleteError)
    } finally {
      setIsSaving(false)
    }
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
            <FilterInput name="species" value={filters.species} onChange={handleFilterChange} placeholder={text.species} />
            <FilterInput name="code" value={filters.code} onChange={handleFilterChange} placeholder={text.code} />
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
              {text.clear}
            </button>
          </div>
        </form>
      </CollapsibleFiltersCard>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-visible">
        <BackofficeListHeader
          title={text.listTitle}
          total={total}
          showNewButton={canManagePlants}
          onNew={handleNew}
          newDisabled={isLoading || isSaving}
        />

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mt-4 text-sm text-emerald-600">{success}</p> : null}

        <div className="mt-4 overflow-visible">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3">{text.name}</th>
                <th className="px-3 py-3">{text.code}</th>
                <th className="px-3 py-3">{text.species}</th>
                <th className="px-3 py-3">{text.installation}</th>
                <th className="px-3 py-3">{text.active}</th>
                <th className="px-3 py-3 text-right">{text.actions}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{item.name || '-'}</td>
                  <td className="px-3 py-3">{item.code || '-'}</td>
                  <td className="px-3 py-3">{item.common_name || item.scientific_name || item.plant_type || '-'}</td>
                  <td className="px-3 py-3">{item.installation_id || '-'}</td>
                  <td className="px-3 py-3">{item.is_active ? text.yes : text.no}</td>
                  <td className="px-3 py-3 text-right">
                    <RowActionsDropdown
                      disabled={isSaving}
                      actions={[
                        {
                          key: 'edit',
                          label: text.edit,
                          disabled: !canOpenPlantDetail,
                          onClick: () => handleEdit(item),
                        },
                        {
                          key: 'delete',
                          label: text.delete,
                          disabled: !canManagePlants,
                          onClick: () => handleDeleteClick(item),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}

              {!isLoading && items.length === 0 ? (
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
      </section>

      <PlantEditModalTabs
        isOpen={isModalOpen}
        mode={modalMode}
        plant={selectedPlant}
        canEdit={canManagePlants}
        canDelete={canManagePlants}
        initialDeleteConfirm={openDeleteConfirm}
        onClose={() => {
          if (isSaving) return
          setIsModalOpen(false)
          setSelectedPlant(null)
          setModalMode('create')
          setOpenDeleteConfirm(false)
        }}
        onSave={handleSave}
        onDelete={handleDeleteConfirmed}
        isSaving={isSaving}
        error={error}
      />

      <PlantCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (isSaving) return
          setIsCreateModalOpen(false)
        }}
        onSave={handleSave}
        isSaving={isSaving}
        error={error}
      />

      <LoadingOverlay
        visible={isLoading || isSaving}
        label={isSaving ? text.saving : text.loading}
        transparent
      />
    </div>
  )
}

