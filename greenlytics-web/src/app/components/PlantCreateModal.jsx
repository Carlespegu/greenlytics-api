import { useEffect, useMemo, useRef, useState } from 'react'

import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { clientsService } from '../services/clientsService'
import { installationsService } from '../services/installationsService'
import { plantsService } from '../services/plantsService'
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
  notes: '',
  is_active: true,
}

const EMPTY_PHOTOS = {
  leaf: null,
  trunk: null,
  general: null,
}

const OPTION_SETS = {
  plant_type: ['plant', 'crop', 'tree', 'shrub'],
  planting_type: ['single', 'group', 'plot'],
  location_type: ['indoor', 'outdoor', 'greenhouse'],
  sun_exposure: ['full_sun', 'partial_shade', 'shade'],
}

const UI_TEXT = {
  ca: {
    title: 'Nova planta',
    helper: 'Per donar d alta una planta has d aportar tres fotos: fulla, tronc i general.',
    photoTitle: 'Fotos obligatories',
    photoHelper: 'Les tres fotos es comprimiran abans d enviar-les a OpenAI i al backend.',
    leaf: 'Fulla',
    trunk: 'Tronc',
    general: 'General',
    uploadPhoto: 'Pujar',
    takePhoto: 'Fer foto',
    analyze: 'Analitzar 3 fotos',
    analyzing: 'Analitzant 3 fotos...',
    preparingPhoto: 'Preparant foto...',
    photoRequired: 'Has d afegir les tres fotos obligatories: fulla, tronc i general.',
    photoLoaded: 'Dades carregades des de les tres fotos.',
    identifyError: 'No s ha pogut identificar la planta a partir de les tres fotos.',
    noPhotoPreview: 'Encara no hi ha cap foto carregada.',
    confidence: 'Confianca',
    currentState: 'Estat detectat',
    careSummary: 'Cures recomanades',
    basicTitle: 'Informacio basica',
    basicHelper: 'Client, codi i nom son obligatoris. La instal lacio es opcional.',
    client: 'Client',
    installation: 'Instal lacio',
    code: 'Codi',
    name: 'Nom',
    commonName: 'Nom comu',
    scientificName: 'Nom cientific',
    plantType: 'Tipus de planta',
    plantingType: 'Tipus de plantacio',
    locationType: 'Ubicacio',
    sunExposure: 'Exposicio solar',
    notes: 'Notes',
    active: 'Activa',
    requiredClient: 'Has de seleccionar un client.',
    requiredCode: 'El camp Codi es obligatori.',
    requiredName: 'El camp Nom es obligatori.',
    selectClient: 'Selecciona un client',
    selectInstallation: 'Sense instal lacio',
    loadingClients: 'Carregant clients...',
    loadingInstallations: 'Carregant instal lacions...',
    save: 'Desar',
    saving: 'Desant...',
    cancel: 'Cancel lar',
  },
  es: {
    title: 'Nueva planta',
    helper: 'Para dar de alta una planta debes aportar tres fotos: hoja, tronco y general.',
    photoTitle: 'Fotos obligatorias',
    photoHelper: 'Las tres fotos se comprimen antes de enviarlas a OpenAI y al backend.',
    leaf: 'Hoja',
    trunk: 'Tronco',
    general: 'General',
    uploadPhoto: 'Subir',
    takePhoto: 'Hacer foto',
    analyze: 'Analizar 3 fotos',
    analyzing: 'Analizando 3 fotos...',
    preparingPhoto: 'Preparando foto...',
    photoRequired: 'Debes añadir las tres fotos obligatorias: hoja, tronco y general.',
    photoLoaded: 'Datos cargados desde las tres fotos.',
    identifyError: 'No se ha podido identificar la planta a partir de las tres fotos.',
    noPhotoPreview: 'Todavia no hay ninguna foto cargada.',
    confidence: 'Confianza',
    currentState: 'Estado detectado',
    careSummary: 'Cuidados recomendados',
    basicTitle: 'Informacion basica',
    basicHelper: 'Cliente, codigo y nombre son obligatorios. La instalacion es opcional.',
    client: 'Cliente',
    installation: 'Instalacion',
    code: 'Codigo',
    name: 'Nombre',
    commonName: 'Nombre comun',
    scientificName: 'Nombre cientifico',
    plantType: 'Tipo de planta',
    plantingType: 'Tipo de plantacion',
    locationType: 'Ubicacion',
    sunExposure: 'Exposicion solar',
    notes: 'Notas',
    active: 'Activa',
    requiredClient: 'Debes seleccionar un cliente.',
    requiredCode: 'El campo Codigo es obligatorio.',
    requiredName: 'El campo Nombre es obligatorio.',
    selectClient: 'Selecciona un cliente',
    selectInstallation: 'Sin instalacion',
    loadingClients: 'Cargando clientes...',
    loadingInstallations: 'Cargando instalaciones...',
    save: 'Guardar',
    saving: 'Guardando...',
    cancel: 'Cancelar',
  },
  en: {
    title: 'New plant',
    helper: 'To create a plant you must provide three photos: leaf, trunk and general view.',
    photoTitle: 'Required photos',
    photoHelper: 'All three photos are compressed before being sent to OpenAI and the backend.',
    leaf: 'Leaf',
    trunk: 'Trunk',
    general: 'General',
    uploadPhoto: 'Upload',
    takePhoto: 'Take photo',
    analyze: 'Analyze 3 photos',
    analyzing: 'Analyzing 3 photos...',
    preparingPhoto: 'Preparing photo...',
    photoRequired: 'You must add the three required photos: leaf, trunk and general.',
    photoLoaded: 'Data loaded from the three photos.',
    identifyError: 'The plant could not be identified from the three photos.',
    noPhotoPreview: 'There is no photo loaded yet.',
    confidence: 'Confidence',
    currentState: 'Detected state',
    careSummary: 'Recommended care',
    basicTitle: 'Basic information',
    basicHelper: 'Client, code and name are required. Installation is optional.',
    client: 'Client',
    installation: 'Installation',
    code: 'Code',
    name: 'Name',
    commonName: 'Common name',
    scientificName: 'Scientific name',
    plantType: 'Plant type',
    plantingType: 'Planting type',
    locationType: 'Location',
    sunExposure: 'Sun exposure',
    notes: 'Notes',
    active: 'Active',
    requiredClient: 'You must select a client.',
    requiredCode: 'The Code field is required.',
    requiredName: 'The Name field is required.',
    selectClient: 'Select a client',
    selectInstallation: 'No installation',
    loadingClients: 'Loading clients...',
    loadingInstallations: 'Loading installations...',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
  },
}

function BinarySwitch({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${checked ? 'bg-emerald-600' : 'bg-slate-400'} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-8' : 'translate-x-1'}`} />
    </button>
  )
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not load the selected image.'))
    }
    image.src = objectUrl
  })
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not prepare the image for analysis.'))
        return
      }
      resolve(blob)
    }, mimeType, quality)
  })
}

async function optimizeImage(file) {
  const image = await loadImage(file)
  const maxSide = 1280
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
  const targetWidth = Math.max(1, Math.round(image.width * scale))
  const targetHeight = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const context = canvas.getContext('2d')
  if (!context) return file
  context.drawImage(image, 0, 0, targetWidth, targetHeight)
  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await canvasToBlob(canvas, mimeType, mimeType === 'image/png' ? undefined : 0.82)
  if (blob.size >= file.size && scale === 1) return file
  const extension = mimeType === 'image/png' ? 'png' : 'jpg'
  const fileName = file.name && file.name.includes('.') ? file.name : `plant-photo.${extension}`
  return new File([blob], fileName, { type: mimeType, lastModified: Date.now() })
}

function normalizeClient(item) {
  return {
    id: item.id,
    label: item.name ? `${item.name} (${item.code || '-'})` : item.code || '',
  }
}

function normalizeInstallation(item) {
  return {
    id: item.id,
    client_id: item.client_id || '',
    label: item.name ? `${item.name} (${item.code || '-'})` : item.code || '',
  }
}

function PhotoCard({ label, previewUrl, onUpload, onCamera, disabled, uploadRef, cameraRef, uploadLabel, cameraLabel }) {
  return (
    <div className="space-y-3 rounded-2xl border border-emerald-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-emerald-900">{label}</p>
        <div className="flex gap-2">
          <input ref={uploadRef} type="file" accept="image/*" className="hidden" onChange={(event) => onUpload(event.target.files?.[0] || null)} />
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => onCamera(event.target.files?.[0] || null)} />
          <button type="button" disabled={disabled} onClick={() => uploadRef.current?.click()} className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">{uploadLabel}</button>
          <button type="button" disabled={disabled} onClick={() => cameraRef.current?.click()} className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">{cameraLabel}</button>
        </div>
      </div>
      {previewUrl ? (
        <img src={previewUrl} alt={label} className="h-52 w-full rounded-2xl object-cover" />
      ) : (
        <div className="flex h-52 items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 text-sm text-emerald-900/70">
          {label}
        </div>
      )}
    </div>
  )
}

export default function PlantCreateModal({ isOpen, onClose, onSave, isSaving = false, error = '' }) {
  const { language } = useLanguage()
  const { roleCode, user } = useAuth()
  const text = UI_TEXT[language] || UI_TEXT.ca
  const normalizedRoleCode = (roleCode || '').toUpperCase()
  const isAdmin = normalizedRoleCode === 'ADMIN'
  const [form, setForm] = useState(EMPTY_FORM)
  const [clients, setClients] = useState([])
  const [installations, setInstallations] = useState([])
  const [validationError, setValidationError] = useState('')
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [isLoadingInstallations, setIsLoadingInstallations] = useState(false)
  const [isOptimizingPhoto, setIsOptimizingPhoto] = useState(false)
  const [isIdentifying, setIsIdentifying] = useState(false)
  const [identificationInfo, setIdentificationInfo] = useState(null)
  const [photoFiles, setPhotoFiles] = useState(EMPTY_PHOTOS)
  const [photoPreviews, setPhotoPreviews] = useState({ leaf: '', trunk: '', general: '' })
  const uploadInputRefs = {
    leaf: useRef(null),
    trunk: useRef(null),
    general: useRef(null),
  }
  const cameraInputRefs = {
    leaf: useRef(null),
    trunk: useRef(null),
    general: useRef(null),
  }

  useEffect(() => {
    if (!isOpen) return
    setForm({ ...EMPTY_FORM, client_id: isAdmin ? '' : String(user?.client_id || '') })
    setValidationError('')
    setIdentificationInfo(null)
    setPhotoFiles(EMPTY_PHOTOS)
    setPhotoPreviews((prev) => {
      Object.values(prev).forEach((value) => {
        if (value) URL.revokeObjectURL(value)
      })
      return { leaf: '', trunk: '', general: '' }
    })
  }, [isAdmin, isOpen, user?.client_id])

  useEffect(() => {
    if (!isOpen || !isAdmin) return
    let mounted = true
    async function loadClients() {
      setIsLoadingClients(true)
      try {
        const payload = await clientsService.listClients()
        if (mounted) setClients((Array.isArray(payload) ? payload : []).map(normalizeClient))
      } finally {
        if (mounted) setIsLoadingClients(false)
      }
    }
    loadClients()
    return () => { mounted = false }
  }, [isAdmin, isOpen])

  useEffect(() => {
    if (!isOpen) return
    let mounted = true
    async function loadInstallations() {
      setIsLoadingInstallations(true)
      try {
        const payload = await installationsService.listInstallations()
        if (mounted) setInstallations((Array.isArray(payload) ? payload : []).map(normalizeInstallation))
      } finally {
        if (mounted) setIsLoadingInstallations(false)
      }
    }
    loadInstallations()
    return () => { mounted = false }
  }, [isOpen])

  const filteredInstallations = useMemo(() => {
    if (!form.client_id) return []
    return installations.filter((item) => item.client_id === form.client_id)
  }, [form.client_id, installations])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'client_id') next.installation_id = ''
      return next
    })
  }

  function renderOptions(fieldName) {
    return OPTION_SETS[fieldName].map((value) => (
      <option key={value} value={value}>
        {value}
      </option>
    ))
  }

  const hasAllRequiredPhotos = useMemo(
    () => Boolean(photoFiles.leaf && photoFiles.trunk && photoFiles.general),
    [photoFiles]
  )

  async function handleImageSelection(part, file) {
    if (!file) return
    setValidationError('')

    try {
      setIsOptimizingPhoto(true)
      const optimizedFile = await optimizeImage(file)
      setPhotoFiles((prev) => ({ ...prev, [part]: optimizedFile }))
      setPhotoPreviews((prev) => {
        if (prev[part]) URL.revokeObjectURL(prev[part])
        return { ...prev, [part]: URL.createObjectURL(optimizedFile) }
      })
      setIsOptimizingPhoto(false)
    } catch (err) {
      setValidationError(err.message || text.preparingPhoto)
    } finally {
      setIsOptimizingPhoto(false)
    }
  }

  async function handleAnalyze() {
    if (!hasAllRequiredPhotos) {
      setValidationError(text.photoRequired)
      return
    }

    setValidationError('')
    setIsIdentifying(true)
    try {
      const payload = await plantsService.identifyPlantFromPhotos({
        clientId: form.client_id || undefined,
        installationId: form.installation_id || undefined,
        files: photoFiles,
        language,
      })

      setIdentificationInfo(payload)
      setForm((prev) => ({
        ...prev,
        code: prev.code || payload.suggested_code || '',
        name: prev.name || payload.name || payload.common_name || '',
        common_name: payload.common_name || prev.common_name || '',
        scientific_name: payload.scientific_name || prev.scientific_name || '',
        plant_type: payload.plant_type || prev.plant_type || '',
        planting_type: payload.planting_type || prev.planting_type || '',
        location_type: payload.location_type || prev.location_type || '',
        sun_exposure: payload.sun_exposure || prev.sun_exposure || '',
        notes: payload.notes || prev.notes,
      }))
    } catch (err) {
      setValidationError(err.message || text.identifyError)
    } finally {
      setIsIdentifying(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    setValidationError('')
    if (!form.client_id) {
      setValidationError(text.requiredClient)
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
    if (!hasAllRequiredPhotos) {
      setValidationError(text.photoRequired)
      return
    }

    const payload = {
      client_id: form.client_id,
      code: form.code.trim(),
      name: form.name.trim(),
      common_name: form.common_name.trim() || null,
      scientific_name: form.scientific_name.trim() || null,
      plant_type: form.plant_type || null,
      planting_type: form.planting_type || null,
      location_type: form.location_type || null,
      sun_exposure: form.sun_exposure || null,
      notes: form.notes.trim() || null,
      is_active: Boolean(form.is_active),
    }

    if (form.installation_id) {
      payload.installation_id = form.installation_id
    }

    onSave({
      plant: payload,
      photos: photoFiles,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{text.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{text.helper}</p>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
            {text.cancel}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
            <div>
              <h3 className="text-base font-semibold text-emerald-900">{text.photoTitle}</h3>
              <p className="mt-1 text-sm text-emerald-800">{text.photoHelper}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {['leaf', 'trunk', 'general'].map((part) => (
                <PhotoCard
                  key={part}
                  label={text[part]}
                  previewUrl={photoPreviews[part]}
                  uploadRef={uploadInputRefs[part]}
                  cameraRef={cameraInputRefs[part]}
                  uploadLabel={text.uploadPhoto}
                  cameraLabel={text.takePhoto}
                  disabled={isSaving || isIdentifying || isOptimizingPhoto}
                  onUpload={(file) => handleImageSelection(part, file)}
                  onCamera={(file) => handleImageSelection(part, file)}
                />
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={isSaving || isIdentifying || isOptimizingPhoto || !hasAllRequiredPhotos}
                onClick={handleAnalyze}
                className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isIdentifying ? text.analyzing : text.analyze}
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{text.currentState}</h3>
                <p className="mt-1 text-sm text-slate-500">{text.noPhotoPreview}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {['leaf', 'trunk', 'general'].map((part) => (
                  photoPreviews[part] ? <img key={part} src={photoPreviews[part]} alt={text[part]} className="h-40 w-full rounded-2xl object-cover" /> : <div key={part} className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">{text[part]}</div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-900">{text.confidence}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{identificationInfo?.confidence != null ? `${Math.round(identificationInfo.confidence * 100)}%` : '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-900">{text.currentState}</p>
                <p className="mt-2 text-sm text-slate-600">{identificationInfo?.current_state || '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-900">{text.careSummary}</p>
                <p className="mt-2 text-sm text-slate-600">{identificationInfo?.care_summary || '-'}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-base font-semibold text-slate-900">{text.basicTitle}</h3>
            <p className="mt-1 text-sm text-slate-600">{text.basicHelper}</p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {isAdmin ? (
                <label className="space-y-2 text-sm text-slate-700">
                  <span>{text.client} *</span>
                  <select name="client_id" value={form.client_id} onChange={handleChange} disabled={isSaving || isLoadingClients} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50">
                    <option value="">{isLoadingClients ? text.loadingClients : text.selectClient}</option>
                    {clients.map((client) => <option key={client.id} value={client.id}>{client.label}</option>)}
                  </select>
                </label>
              ) : null}

              <label className="space-y-2 text-sm text-slate-700">
                <span>{text.installation}</span>
                <select name="installation_id" value={form.installation_id} onChange={handleChange} disabled={isSaving || isLoadingInstallations || !form.client_id} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50">
                  <option value="">{isLoadingInstallations ? text.loadingInstallations : text.selectInstallation}</option>
                  {filteredInstallations.map((installation) => <option key={installation.id} value={installation.id}>{installation.label}</option>)}
                </select>
              </label>

              <label className="space-y-2 text-sm text-slate-700">
                <span>{text.code} *</span>
                <input name="code" value={form.code} onChange={handleChange} disabled={isSaving} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>{text.name} *</span>
                <input name="name" value={form.name} onChange={handleChange} disabled={isSaving} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>{text.commonName}</span>
                <input name="common_name" value={form.common_name} onChange={handleChange} disabled={isSaving} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>{text.scientificName}</span>
                <input name="scientific_name" value={form.scientific_name} onChange={handleChange} disabled={isSaving} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" />
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>{text.plantType}</span>
                <select name="plant_type" value={form.plant_type} onChange={handleChange} disabled={isSaving} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"><option value=""></option>{renderOptions('plant_type')}</select>
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>{text.plantingType}</span>
                <select name="planting_type" value={form.planting_type} onChange={handleChange} disabled={isSaving} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"><option value=""></option>{renderOptions('planting_type')}</select>
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>{text.locationType}</span>
                <select name="location_type" value={form.location_type} onChange={handleChange} disabled={isSaving} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"><option value=""></option>{renderOptions('location_type')}</select>
              </label>
              <label className="space-y-2 text-sm text-slate-700">
                <span>{text.sunExposure}</span>
                <select name="sun_exposure" value={form.sun_exposure} onChange={handleChange} disabled={isSaving} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"><option value=""></option>{renderOptions('sun_exposure')}</select>
              </label>
              <label className="space-y-2 text-sm text-slate-700 md:col-span-2 xl:col-span-3">
                <span>{text.notes}</span>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={4} disabled={isSaving} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" />
              </label>
              <div className="space-y-2 text-sm text-slate-700">
                <span className="block">{text.active}</span>
                <BinarySwitch checked={Boolean(form.is_active)} onChange={(value) => setForm((prev) => ({ ...prev, is_active: value }))} disabled={isSaving} />
              </div>
            </div>
          </section>

          {validationError || error ? <p className="text-sm text-red-600">{validationError || error}</p> : null}
          {!validationError && !error && identificationInfo ? <p className="text-sm text-emerald-600">{text.photoLoaded}</p> : null}

          <div className="flex justify-end gap-3">
            <button type="submit" disabled={isSaving} className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: 'var(--brand-primary)' }}>
              {isSaving ? text.saving : text.save}
            </button>
            <button type="button" onClick={onClose} disabled={isSaving} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
              {text.cancel}
            </button>
          </div>
        </form>

        <LoadingOverlay
          visible={isSaving || isLoadingClients || isLoadingInstallations || isIdentifying || isOptimizingPhoto}
          label={isOptimizingPhoto ? text.preparingPhoto : isIdentifying ? text.analyzing : isSaving ? text.saving : isLoadingClients ? text.loadingClients : text.loadingInstallations}
          transparent
        />
      </div>
    </div>
  )
}
