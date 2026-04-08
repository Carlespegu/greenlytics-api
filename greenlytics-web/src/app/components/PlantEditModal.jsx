import { useEffect, useMemo, useRef, useState } from 'react'
import { installationsService } from '../services/installationsService'
import { plantsService } from '../services/plantsService'
import { useLanguage } from '../context/LanguageContext'
import LoadingOverlay from './LoadingOverlay'

const EMPTY_FORM = {
  client_id: '',
  installation_id: '',
  code: '',
  name: '',
  common_name: '',
  scientific_name: '',
  plant_type: '',
  planting_type: '',
  location_type: '',
  sun_exposure: '',
  pot_size_cm: '',
  height_cm: '',
  width_cm: '',
  planting_date: '',
  last_repotting_date: '',
  status: '',
  notes: '',
  is_active: true,
  created_by: '',
  created_on: '',
  modified_by: '',
  modified_on: '',
}

const OPTION_SETS = {
  plant_type: ['plant', 'crop', 'tree', 'shrub'],
  planting_type: ['single', 'group', 'plot'],
  location_type: ['indoor', 'outdoor', 'greenhouse'],
  sun_exposure: ['full_sun', 'partial_shade', 'shade'],
  status: ['healthy', 'warning', 'critical', 'inactive'],
}

const UI_TEXT = {
  ca: {
    newPlant: 'Nova planta',
    editPlant: 'Editar planta',
    helperCreate: 'Dona d’alta una planta activa i vincula-la a una instal·lació.',
    helperEdit: 'Actualitza les dades principals de la planta seleccionada.',
    installation: 'Instal·lació',
    code: 'Codi',
    name: 'Nom',
    commonName: 'Nom comú',
    scientificName: 'Nom científic',
    plantType: 'Tipus de planta',
    plantingType: 'Tipus de plantació',
    locationType: 'Ubicació',
    sunExposure: 'Exposició solar',
    potSize: 'Mida test (cm)',
    height: 'Alçada (cm)',
    width: 'Amplada (cm)',
    plantingDate: 'Data de plantació',
    lastRepottingDate: 'Darrera replantació',
    status: 'Estat',
    notes: 'Notes',
    active: 'Activa',
    identifyFromPhoto: 'Omplir des de foto',
    uploadPhoto: 'Pujar foto',
    takePhoto: 'Fer foto',
    identifying: 'Analitzant foto...',
    photoHint: 'Selecciona una instal·lació i puja una foto per identificar la planta i omplir el formulari.',
    photoLoaded: 'Dades de la planta carregades des de la foto.',
    identifyError: 'No s’ha pogut identificar la planta a partir de la foto.',
    identifyNeedsImageContext: 'Pots analitzar la foto abans de desar. Hauràs d’informar instal·lació, codi i nom abans de guardar.',
    confidence: 'Confiança',
    careSummary: 'Cura recomanada',
    currentState: 'Estat detectat',
    save: 'Desar',
    saving: 'Desant...',
    cancel: 'Cancel·lar',
    delete: 'Eliminar',
    confirmDelete: 'Estas segur que vols eliminar aquesta planta?',
    yes: 'Yes',
    requiredInstallation: 'Has de seleccionar una instal·lació.',
    requiredCode: 'El camp "Codi" és obligatori.',
    requiredName: 'El camp "Nom" és obligatori.',
    selectInstallation: 'Selecciona una instal·lació',
    loadingInstallations: 'Carregant instal·lacions...',
    noInstallations: 'No hi ha instal·lacions disponibles.',
    plant_type_plant: 'Planta',
    plant_type_crop: 'Cultiu',
    plant_type_tree: 'Arbre',
    plant_type_shrub: 'Arbust',
    planting_type_single: 'Individual',
    planting_type_group: 'Grup',
    planting_type_plot: 'Parcel·la',
    location_type_indoor: 'Interior',
    location_type_outdoor: 'Exterior',
    location_type_greenhouse: 'Hivernacle',
    sun_exposure_full_sun: 'Sol complet',
    sun_exposure_partial_shade: 'Semiombra',
    sun_exposure_shade: 'Ombra',
    status_healthy: 'Saludable',
    status_warning: 'Avís',
    status_critical: 'Crítica',
    status_inactive: 'Inactiva',
  },
  es: {
    newPlant: 'Nueva planta',
    editPlant: 'Editar planta',
    helperCreate: 'Da de alta una planta activa y vincúlala a una instalación.',
    helperEdit: 'Actualiza los datos principales de la planta seleccionada.',
    installation: 'Instalación',
    code: 'Código',
    name: 'Nombre',
    commonName: 'Nombre común',
    scientificName: 'Nombre científico',
    plantType: 'Tipo de planta',
    plantingType: 'Tipo de plantación',
    locationType: 'Ubicación',
    sunExposure: 'Exposición solar',
    potSize: 'Tamaño maceta (cm)',
    height: 'Altura (cm)',
    width: 'Anchura (cm)',
    plantingDate: 'Fecha de plantación',
    lastRepottingDate: 'Último trasplante',
    status: 'Estado',
    notes: 'Notas',
    active: 'Activa',
    identifyFromPhoto: 'Rellenar desde foto',
    uploadPhoto: 'Subir foto',
    takePhoto: 'Hacer foto',
    identifying: 'Analizando foto...',
    photoHint: 'Selecciona una instalación y sube una foto para identificar la planta y rellenar el formulario.',
    photoLoaded: 'Datos de la planta cargados desde la foto.',
    identifyError: 'No se ha podido identificar la planta a partir de la foto.',
    identifyNeedsImageContext: 'Puedes analizar la foto antes de guardar. Tendrás que informar instalación, código y nombre antes de guardar.',
    confidence: 'Confianza',
    careSummary: 'Cuidados recomendados',
    currentState: 'Estado detectado',
    save: 'Guardar',
    saving: 'Guardando...',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    confirmDelete: 'Estas seguro que quieres eliminar esta planta?',
    yes: 'Yes',
    requiredInstallation: 'Debes seleccionar una instalación.',
    requiredCode: 'El campo "Código" es obligatorio.',
    requiredName: 'El campo "Nombre" es obligatorio.',
    selectInstallation: 'Selecciona una instalación',
    loadingInstallations: 'Cargando instalaciones...',
    noInstallations: 'No hay instalaciones disponibles.',
    plant_type_plant: 'Planta',
    plant_type_crop: 'Cultivo',
    plant_type_tree: 'Árbol',
    plant_type_shrub: 'Arbusto',
    planting_type_single: 'Individual',
    planting_type_group: 'Grupo',
    planting_type_plot: 'Parcela',
    location_type_indoor: 'Interior',
    location_type_outdoor: 'Exterior',
    location_type_greenhouse: 'Invernadero',
    sun_exposure_full_sun: 'Sol completo',
    sun_exposure_partial_shade: 'Semisombra',
    sun_exposure_shade: 'Sombra',
    status_healthy: 'Saludable',
    status_warning: 'Aviso',
    status_critical: 'Crítica',
    status_inactive: 'Inactiva',
  },
  en: {
    newPlant: 'New plant',
    editPlant: 'Edit plant',
    helperCreate: 'Create an active plant and link it to an installation.',
    helperEdit: 'Update the main data of the selected plant.',
    installation: 'Installation',
    code: 'Code',
    name: 'Name',
    commonName: 'Common name',
    scientificName: 'Scientific name',
    plantType: 'Plant type',
    plantingType: 'Planting type',
    locationType: 'Location',
    sunExposure: 'Sun exposure',
    potSize: 'Pot size (cm)',
    height: 'Height (cm)',
    width: 'Width (cm)',
    plantingDate: 'Planting date',
    lastRepottingDate: 'Last repotting',
    status: 'Status',
    notes: 'Notes',
    active: 'Active',
    identifyFromPhoto: 'Fill from photo',
    uploadPhoto: 'Upload photo',
    takePhoto: 'Take photo',
    identifying: 'Analyzing photo...',
    photoHint: 'Select an installation and upload a photo to identify the plant and prefill the form.',
    photoLoaded: 'Plant data loaded from the photo.',
    identifyError: 'The plant could not be identified from the photo.',
    identifyNeedsImageContext: 'You can analyze the photo before saving. You will still need installation, code and name before saving.',
    confidence: 'Confidence',
    careSummary: 'Recommended care',
    currentState: 'Detected status',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this plant?',
    yes: 'Yes',
    requiredInstallation: 'You must select an installation.',
    requiredCode: 'The "Code" field is required.',
    requiredName: 'The "Name" field is required.',
    selectInstallation: 'Select an installation',
    loadingInstallations: 'Loading installations...',
    noInstallations: 'No installations available.',
    plant_type_plant: 'Plant',
    plant_type_crop: 'Crop',
    plant_type_tree: 'Tree',
    plant_type_shrub: 'Shrub',
    planting_type_single: 'Single',
    planting_type_group: 'Group',
    planting_type_plot: 'Plot',
    location_type_indoor: 'Indoor',
    location_type_outdoor: 'Outdoor',
    location_type_greenhouse: 'Greenhouse',
    sun_exposure_full_sun: 'Full sun',
    sun_exposure_partial_shade: 'Partial shade',
    sun_exposure_shade: 'Shade',
    status_healthy: 'Healthy',
    status_warning: 'Warning',
    status_critical: 'Critical',
    status_inactive: 'Inactive',
  },
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

function Field({ label, required = false, fullWidth = false, children }) {
  return (
    <label className={`space-y-2 text-sm text-slate-700 ${fullWidth ? 'md:col-span-2 xl:col-span-3' : ''}`}>
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  )
}

function toInputDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function toInputValue(value) {
  return value == null ? '' : String(value)
}

function normalizeInstallation(item) {
  return {
    id: item.id,
    client_id: item.client_id || '',
    name: item.name || '',
    code: item.code || '',
    label: item.name ? `${item.name} (${item.code || '-'})` : item.code || '',
  }
}

export default function PlantEditModal({
  isOpen,
  mode = 'create',
  plant = null,
  canEdit = true,
  canDelete = true,
  initialDeleteConfirm = false,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  error = '',
}) {
  const { language } = useLanguage()
  const text = UI_TEXT[language] || UI_TEXT.ca
  const [form, setForm] = useState(EMPTY_FORM)
  const [installations, setInstallations] = useState([])
  const [isLoadingInstallations, setIsLoadingInstallations] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isIdentifying, setIsIdentifying] = useState(false)
  const [identificationInfo, setIdentificationInfo] = useState(null)
  const uploadInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    setValidationError('')
    setShowDeleteConfirm(Boolean(initialDeleteConfirm))
    setIdentificationInfo(null)
    setForm({
      ...EMPTY_FORM,
      ...plant,
      client_id: plant?.client_id || '',
      installation_id: plant?.installation_id || '',
      code: plant?.code || '',
      name: plant?.name || '',
      common_name: plant?.common_name || '',
      scientific_name: plant?.scientific_name || '',
      plant_type: plant?.plant_type || '',
      planting_type: plant?.planting_type || '',
      location_type: plant?.location_type || '',
      sun_exposure: plant?.sun_exposure || '',
      pot_size_cm: toInputValue(plant?.pot_size_cm),
      height_cm: toInputValue(plant?.height_cm),
      width_cm: toInputValue(plant?.width_cm),
      planting_date: toInputDate(plant?.planting_date),
      last_repotting_date: toInputDate(plant?.last_repotting_date),
      status: plant?.status || '',
      notes: plant?.notes || '',
      is_active: plant?.is_active ?? true,
      created_by: plant?.created_by || '',
      created_on: plant?.created_on || '',
      modified_by: plant?.modified_by || '',
      modified_on: plant?.modified_on || '',
    })
  }, [initialDeleteConfirm, isOpen, plant])

  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    async function loadInstallations() {
      setIsLoadingInstallations(true)
      try {
        const payload = await installationsService.listInstallations()
        if (isMounted) {
          setInstallations((Array.isArray(payload) ? payload : []).map(normalizeInstallation))
        }
      } finally {
        if (isMounted) {
          setIsLoadingInstallations(false)
        }
      }
    }

    loadInstallations()

    return () => {
      isMounted = false
    }
  }, [isOpen])

  const filteredInstallations = useMemo(() => {
    if (!form.client_id) return installations
    return installations.filter((item) => item.client_id === form.client_id)
  }, [form.client_id, installations])

  const title = mode === 'edit'
    ? `${text.editPlant}${plant?.name ? ` - ${plant.name}` : ''}`
    : text.newPlant

  const helper = mode === 'edit' ? text.helperEdit : text.helperCreate

  if (!isOpen) return null

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleImageSelection(file) {
    if (!file) return

    const installation = installations.find((item) => item.id === form.installation_id)
    let clientId = installation?.client_id || form.client_id || plant?.client_id
    let installationId = form.installation_id || plant?.installation_id || ''

    setValidationError('')
    setIsIdentifying(true)

    try {
      if (installationId && !clientId) {
        const fullInstallation = await installationsService.getInstallation(installationId)
        clientId = fullInstallation?.client_id || ''
      }

      const identified = await plantsService.identifyPlantFromImage({
        clientId,
        installationId,
        file,
        language,
      })

      setForm((prev) => ({
        ...prev,
        client_id: clientId,
        code: identified.suggested_code || prev.code,
        name: identified.name || prev.name,
        common_name: identified.common_name || '',
        scientific_name: identified.scientific_name || '',
        plant_type: identified.plant_type || '',
        location_type: identified.location_type || '',
        sun_exposure: identified.sun_exposure || '',
        status: identified.status || '',
        notes: identified.notes || prev.notes || '',
      }))

      setIdentificationInfo({
        confidence: identified.confidence,
        care_summary: identified.care_summary || '',
        current_state: identified.current_state || '',
      })
    } catch (err) {
      setValidationError(err.message || text.identifyError)
    } finally {
      setIsIdentifying(false)
      if (uploadInputRef.current) uploadInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
    }
  }

  function parseDecimal(value) {
    if (value === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  function handleSubmit(event) {
    event.preventDefault()
    setValidationError('')

    if (!form.installation_id) {
      setValidationError(text.requiredInstallation)
      return
    }

    if (!form.code.trim()) {
      setValidationError(text.requiredCode)
      return
    }

    if (!form.name.trim()) {
      setValidationError(text.requiredName)
      return
    }

    const selectedInstallation = installations.find((item) => item.id === form.installation_id)

    onSave({
      client_id: selectedInstallation?.client_id || form.client_id || plant?.client_id,
      installation_id: form.installation_id,
      code: form.code.trim(),
      name: form.name.trim(),
      common_name: form.common_name.trim() || null,
      scientific_name: form.scientific_name.trim() || null,
      plant_type: form.plant_type || null,
      planting_type: form.planting_type || null,
      location_type: form.location_type || null,
      sun_exposure: form.sun_exposure || null,
      pot_size_cm: parseDecimal(form.pot_size_cm),
      height_cm: parseDecimal(form.height_cm),
      width_cm: parseDecimal(form.width_cm),
      planting_date: form.planting_date || null,
      last_repotting_date: form.last_repotting_date || null,
      status: form.status || null,
      notes: form.notes.trim() || null,
      is_active: Boolean(form.is_active),
    })
  }

  function renderOptions(type) {
    return OPTION_SETS[type].map((value) => (
      <option key={value} value={value}>
        {text[`${type}_${value}`]}
      </option>
    ))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{helper}</p>
          </div>

          {mode === 'edit' ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving || !canDelete}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {text.delete}
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-900">{text.identifyFromPhoto}</p>
                <p className="mt-1 text-sm text-emerald-800">{text.photoHint}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleImageSelection(event.target.files?.[0] || null)}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => handleImageSelection(event.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  disabled={!canEdit || isSaving || isIdentifying}
                  onClick={() => uploadInputRef.current?.click()}
                  className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {text.uploadPhoto}
                </button>
                <button
                  type="button"
                  disabled={!canEdit || isSaving || isIdentifying}
                  onClick={() => cameraInputRef.current?.click()}
                  className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {text.takePhoto}
                </button>
              </div>
            </div>

            {identificationInfo ? (
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-white/80 p-3 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">{text.confidence}</p>
                  <p className="mt-1">{identificationInfo.confidence != null ? `${Math.round(identificationInfo.confidence * 100)}%` : '-'}</p>
                </div>
                <div className="rounded-xl bg-white/80 p-3 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">{text.currentState}</p>
                  <p className="mt-1">{identificationInfo.current_state || '-'}</p>
                </div>
                <div className="rounded-xl bg-white/80 p-3 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">{text.careSummary}</p>
                  <p className="mt-1">{identificationInfo.care_summary || '-'}</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label={text.installation} required>
              <select
                name="installation_id"
                value={form.installation_id}
                onChange={(event) => {
                  handleChange(event)
                  const installation = installations.find((item) => item.id === event.target.value)
                  setForm((prev) => ({
                    ...prev,
                    installation_id: event.target.value,
                    client_id: installation?.client_id || prev.client_id,
                  }))
                }}
                disabled={isSaving || isLoadingInstallations || !canEdit}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <option value="">
                  {isLoadingInstallations
                    ? text.loadingInstallations
                    : filteredInstallations.length > 0
                      ? text.selectInstallation
                      : text.noInstallations}
                </option>
                {filteredInstallations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={text.code} required>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.name} required>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.commonName}>
              <input
                name="common_name"
                value={form.common_name}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.scientificName}>
              <input
                name="scientific_name"
                value={form.scientific_name}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.plantType}>
              <select
                name="plant_type"
                value={form.plant_type}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"
              >
                <option value=""></option>
                {renderOptions('plant_type')}
              </select>
            </Field>

            <Field label={text.plantingType}>
              <select
                name="planting_type"
                value={form.planting_type}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"
              >
                <option value=""></option>
                {renderOptions('planting_type')}
              </select>
            </Field>

            <Field label={text.locationType}>
              <select
                name="location_type"
                value={form.location_type}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"
              >
                <option value=""></option>
                {renderOptions('location_type')}
              </select>
            </Field>

            <Field label={text.sunExposure}>
              <select
                name="sun_exposure"
                value={form.sun_exposure}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"
              >
                <option value=""></option>
                {renderOptions('sun_exposure')}
              </select>
            </Field>

            <Field label={text.potSize}>
              <input
                type="number"
                step="any"
                name="pot_size_cm"
                value={form.pot_size_cm}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.height}>
              <input
                type="number"
                step="any"
                name="height_cm"
                value={form.height_cm}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.width}>
              <input
                type="number"
                step="any"
                name="width_cm"
                value={form.width_cm}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.plantingDate}>
              <input
                type="date"
                name="planting_date"
                value={form.planting_date}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.lastRepottingDate}>
              <input
                type="date"
                name="last_repotting_date"
                value={form.last_repotting_date}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"
              />
            </Field>

            <Field label={text.status}>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={!canEdit}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"
              >
                <option value=""></option>
                {renderOptions('status')}
              </select>
            </Field>

            <Field label={text.notes} fullWidth>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                disabled={!canEdit}
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"
              />
            </Field>

            <div className="space-y-2 text-sm text-slate-700">
              <span className="block">{text.active}</span>
              <BinarySwitch
                checked={Boolean(form.is_active)}
                onChange={(value) => setForm((prev) => ({ ...prev, is_active: value }))}
                disabled={!canEdit || isSaving}
              />
            </div>
          </div>

          {validationError || error ? (
            <p className="text-sm text-red-600">{validationError || error}</p>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving || !canEdit}
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

        {mode === 'edit' && showDeleteConfirm ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <p className="text-sm text-slate-700">{text.confirmDelete}</p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    await onDelete?.()
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

      <LoadingOverlay
        visible={isSaving || isLoadingInstallations || isIdentifying}
        label={isIdentifying ? text.identifying : isSaving ? text.saving : text.loadingInstallations}
        transparent
      />
    </div>
  )
}
