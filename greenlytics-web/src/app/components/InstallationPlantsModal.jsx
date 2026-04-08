import { useEffect, useMemo, useState } from 'react'
import CompactPagination from './CompactPagination'
import LoadingOverlay from './LoadingOverlay'
import { plantsService } from '../services/plantsService'

const UI_TEXT = {
  ca: {
    title: 'Plantes de la instal·lació',
    name: 'Nom',
    code: 'Codi',
    active: 'Activa',
    species: 'Espècie',
    currentInstallation: 'Instal·lació actual',
    save: 'Desar',
    saving: 'Desant...',
    cancel: 'Cancel·lar',
    loading: 'Carregant...',
    loadError: 'No s’han pogut carregar les plantes.',
    saveError: 'No s’han pogut desar les plantes.',
    noResults: 'No s’han trobat plantes per al client seleccionat.',
    yes: 'Sí',
    no: 'No',
  },
  es: {
    title: 'Plantas de la instalación',
    name: 'Nombre',
    code: 'Código',
    active: 'Activa',
    species: 'Especie',
    currentInstallation: 'Instalación actual',
    save: 'Guardar',
    saving: 'Guardando...',
    cancel: 'Cancelar',
    loading: 'Cargando...',
    loadError: 'No se han podido cargar las plantas.',
    saveError: 'No se han podido guardar las plantas.',
    noResults: 'No se han encontrado plantas para el cliente seleccionado.',
    yes: 'Sí',
    no: 'No',
  },
  en: {
    title: 'Installation plants',
    name: 'Name',
    code: 'Code',
    active: 'Active',
    species: 'Species',
    currentInstallation: 'Current installation',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    loading: 'Loading...',
    loadError: 'Could not load plants.',
    saveError: 'Could not save plants.',
    noResults: 'No plants found for the selected client.',
    yes: 'Yes',
    no: 'No',
  },
}

function normalizePlant(item) {
  return {
    id: String(item.id),
    client_id: item.client_id || '',
    installation_id: item.installation_id || '',
    name: item.name || '',
    code: item.code || '',
    species: item.common_name || item.scientific_name || item.plant_type || '',
    is_active: Boolean(item.is_active),
  }
}

export default function InstallationPlantsModal({
  isOpen,
  installation,
  canEdit = false,
  language = 'ca',
  onClose,
}) {
  const text = UI_TEXT[language] || UI_TEXT.ca
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [plants, setPlants] = useState([])
  const [selectedPlantIds, setSelectedPlantIds] = useState([])
  const [currentPlantIds, setCurrentPlantIds] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    if (!isOpen || !installation?.client_id) return

    let mounted = true

    async function loadPlants() {
      setIsLoading(true)
      setError('')
      try {
        const payload = await plantsService.listPlants()
        if (!mounted) return

        const clientPlants = (Array.isArray(payload) ? payload : [])
          .map(normalizePlant)
          .filter((item) => item.client_id === installation.client_id && !item.is_deleted)

        const currentIds = clientPlants
          .filter((item) => item.installation_id === installation.id)
          .map((item) => item.id)

        setPlants(clientPlants)
        setCurrentPlantIds(currentIds)
        setSelectedPlantIds(currentIds)
        setPage(1)
      } catch (err) {
        if (mounted) setError(err.message || text.loadError)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadPlants()
    return () => {
      mounted = false
    }
  }, [installation, isOpen, text.loadError])

  const pagedPlants = useMemo(() => {
    const start = (page - 1) * pageSize
    return plants.slice(start, start + pageSize)
  }, [page, pageSize, plants])

  if (!isOpen || !installation) return null

  const readOnly = !canEdit

  function togglePlant(plantId) {
    if (readOnly) return
    if (currentPlantIds.includes(String(plantId))) return

    setSelectedPlantIds((prev) =>
      prev.includes(String(plantId))
        ? prev.filter((item) => item !== String(plantId))
        : [...prev, String(plantId)]
    )
  }

  async function handleSave() {
    if (readOnly) return

    const plantIdsToMove = selectedPlantIds.filter((id) => !currentPlantIds.includes(id))
    if (plantIdsToMove.length === 0) {
      onClose(true)
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await Promise.all(
        plantIdsToMove.map((plantId) =>
          plantsService.updatePlant(plantId, { installation_id: installation.id })
        )
      )
      onClose(true)
    } catch (err) {
      setError(err.message || text.saveError)
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
              {installation.client_name || '-'} / {installation.name}
            </p>
          </div>
        </div>

        {isLoading ? <p className="mt-6 text-sm text-slate-500">{text.loading}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-6 overflow-visible">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3" />
                <th className="px-3 py-3">{text.name}</th>
                <th className="px-3 py-3">{text.code}</th>
                <th className="px-3 py-3">{text.species}</th>
                <th className="px-3 py-3">{text.active}</th>
                <th className="px-3 py-3">{text.currentInstallation}</th>
              </tr>
            </thead>
            <tbody>
              {pagedPlants.map((item) => {
                const checked = selectedPlantIds.includes(String(item.id))
                const alreadyAssigned = currentPlantIds.includes(String(item.id))

                return (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={readOnly || isSaving}
                        onChange={() => togglePlant(item.id)}
                      />
                    </td>
                    <td className="px-3 py-3">{item.name || '-'}</td>
                    <td className="px-3 py-3">{item.code || '-'}</td>
                    <td className="px-3 py-3">{item.species || '-'}</td>
                    <td className="px-3 py-3">{item.is_active ? text.yes : text.no}</td>
                    <td className="px-3 py-3">
                      {alreadyAssigned ? installation.name : '-'}
                    </td>
                  </tr>
                )
              })}

              {!isLoading && pagedPlants.length === 0 ? (
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
          total={plants.length}
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
        label={isSaving ? text.saving : text.loading}
        transparent
      />
    </div>
  )
}
