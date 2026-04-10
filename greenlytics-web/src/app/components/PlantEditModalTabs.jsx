import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { devicesService } from '../services/devicesService'
import { installationsService } from '../services/installationsService'
import { plantsService } from '../services/plantsService'
import { plantThresholdsService } from '../services/plantThresholdsService'
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

const METRIC_META = {
  SOIL_PERCENT: { field: 'soil_percent', color: '#16a34a' },
  TEMP_C: { field: 'temp_c', color: '#f97316' },
  HUM_AIR: { field: 'hum_air', color: '#0ea5e9' },
  LDR_RAW: { field: 'ldr_raw', color: '#a855f7' },
  RSSI: { field: 'rssi', color: '#64748b' },
}

const UI_TEXT = {
  ca: {
    tabs: { basic: 'Informacio Basica', thresholds: 'Thresholds', relations: 'Instal·lacions / Sensors', photos: 'Fotos' },
    newPlant: 'Nova planta',
    editPlant: 'Editar planta',
    helperCreate: 'Dona d alta una planta i revisa la informacio abans de guardar.',
    helperEdit: 'Consulta o actualitza les dades de la planta seleccionada.',
    installation: 'Instal·lacio',
    code: 'Codi',
    name: 'Nom',
    commonName: 'Nom comu',
    scientificName: 'Nom cientific',
    plantType: 'Tipus de planta',
    plantingType: 'Tipus de plantacio',
    locationType: 'Ubicacio',
    sunExposure: 'Exposicio solar',
    potSize: 'Mida test (cm)',
    height: 'Alcada (cm)',
    width: 'Amplada (cm)',
    plantingDate: 'Data de plantacio',
    lastRepottingDate: 'Darrera replantacio',
    status: 'Estat',
    notes: 'Notes',
    active: 'Activa',
    save: 'Desar',
    saving: 'Desant...',
    cancel: 'Cancel·lar',
    delete: 'Eliminar',
    confirmDelete: 'Estas segur que vols eliminar aquesta planta?',
    yes: 'Yes',
    no: 'No',
    requiredInstallation: 'La instal lacio es opcional.',
    requiredCode: 'El camp Codi es obligatori.',
    requiredName: 'El camp Nom es obligatori.',
    selectInstallation: 'Selecciona una instal·lacio',
    loadingInstallations: 'Carregant instal·lacions...',
    noInstallations: 'No hi ha instal·lacions disponibles.',
    uploadPhoto: 'Pujar foto',
    takePhoto: 'Fer foto',
    identifyTitle: 'Identificacio amb foto',
    identifyHint: 'Pots analitzar una foto i completar la fitxa. La instal lacio es opcional i es pot vincular despres.',
    identifying: 'Analitzant foto...',
    preparingPhoto: 'Preparant foto...',
    photoLoaded: 'Dades carregades des de la foto.',
    identifyError: 'No s ha pogut identificar la planta a partir de la foto.',
    confidence: 'Confianca',
    careSummary: 'Cures recomanades',
    currentState: 'Estat detectat',
    thresholdsTitle: 'Llindars i valors optims',
    thresholdsHelper: 'Defineix els rangs saludables per comparar-los amb les lectures reals.',
    thresholdsCreateHint: 'Els thresholds es generaran automaticament quan guardis la planta.',
    readingType: 'Indicador',
    minimum: 'Minim',
    maximum: 'Maxim',
    optimalMin: 'Optim minim',
    optimalMax: 'Optim maxim',
    unit: 'Unitat',
    metricStatus: 'Estat',
    noThresholds: 'No hi ha thresholds per a aquesta planta.',
    loadingThresholds: 'Carregant thresholds...',
    thresholdsError: 'No s han pogut carregar els thresholds.',
    thresholdSavedInline: 'Els canvis dels thresholds es desaran amb el boto principal.',
    chartTitle: 'Lectures dels ultims 10 dies',
    chartHelper: 'Selecciona un o mes indicadors per comparar les lectures amb els valors optims.',
    noReadings: 'Encara no hi ha lectures per dibuixar la grafica.',
    chartLoading: 'Carregant lectures...',
    relationTitle: 'Instal·lacio i sensors vinculats',
    relationHelper: 'Mostra la instal·lacio actual de la planta i els dispositius actius associats.',
    relationEmpty: 'Selecciona una instal·lacio per veure els sensors relacionats.',
    sensorsAssigned: 'Sensors assignats',
    sensorsNone: 'No hi ha sensors assignats a aquesta instal·lacio.',
    serial: 'Serial',
    mac: 'MAC',
    photosTitle: 'Fotos i analisi',
    photosHelper: 'Gestiona la cronologia de fotos de la planta i afegeix noves imatges quan calgui.',
    noPhotoPreview: 'Encara no hi ha cap foto seleccionada.',
    photoTimelineEmpty: 'Encara no hi ha fotos guardades per a aquesta planta.',
    photoPart: 'Tipus de foto',
    leaf: 'Fulla',
    trunk: 'Tronc',
    general: 'General',
    evolution: 'Evolucio',
    capturedOn: 'Capturada el',
    addPhoto: 'Afegir foto',
    uploadingPhoto: 'Pujant foto...',
    photoSaved: 'Foto guardada correctament.',
    deletePhoto: 'Eliminar foto',
    analyzeLatestPhotos: 'Analitzar ultima serie',
    photoNotes: 'Notes de la foto',
    loadingPhotos: 'Carregant fotos...',
    photosError: 'No s han pogut carregar les fotos.',
    status_unknown: 'Sense dades',
    status_healthy: 'Correcta',
    status_warning: 'Avis',
    status_critical: 'Critica',
    status_inactive: 'Inactiva',
    metric_SOIL_PERCENT: 'Humitat sol',
    metric_TEMP_C: 'Temperatura',
    metric_HUM_AIR: 'Humitat aire',
    metric_LDR_RAW: 'Llum',
    metric_RSSI: 'Senyal WiFi',
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
    basicSavedHint: 'La informacio basica i els thresholds es desaran conjuntament.',
  },
  es: {
    tabs: { basic: 'Informacion Basica', thresholds: 'Thresholds', relations: 'Instalaciones / Sensores', photos: 'Fotos' },
    newPlant: 'Nueva planta',
    editPlant: 'Editar planta',
    helperCreate: 'Da de alta una planta y revisa la informacion antes de guardar.',
    helperEdit: 'Consulta o actualiza los datos de la planta seleccionada.',
    installation: 'Instalacion',
    code: 'Codigo',
    name: 'Nombre',
    commonName: 'Nombre comun',
    scientificName: 'Nombre cientifico',
    plantType: 'Tipo de planta',
    plantingType: 'Tipo de plantacion',
    locationType: 'Ubicacion',
    sunExposure: 'Exposicion solar',
    potSize: 'Tamano maceta (cm)',
    height: 'Altura (cm)',
    width: 'Anchura (cm)',
    plantingDate: 'Fecha de plantacion',
    lastRepottingDate: 'Ultimo trasplante',
    status: 'Estado',
    notes: 'Notas',
    active: 'Activa',
    save: 'Guardar',
    saving: 'Guardando...',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    confirmDelete: 'Estas seguro que quieres eliminar esta planta?',
    yes: 'Yes',
    no: 'No',
    requiredInstallation: 'La instalacion es opcional.',
    requiredCode: 'El campo Codigo es obligatorio.',
    requiredName: 'El campo Nombre es obligatorio.',
    selectInstallation: 'Selecciona una instalacion',
    loadingInstallations: 'Cargando instalaciones...',
    noInstallations: 'No hay instalaciones disponibles.',
    uploadPhoto: 'Subir foto',
    takePhoto: 'Hacer foto',
    identifyTitle: 'Identificacion con foto',
    identifyHint: 'Puedes analizar una foto y completar la ficha. La instalacion es opcional y se puede vincular despues.',
    identifying: 'Analizando foto...',
    preparingPhoto: 'Preparando foto...',
    photoLoaded: 'Datos cargados desde la foto.',
    identifyError: 'No se ha podido identificar la planta a partir de la foto.',
    confidence: 'Confianza',
    careSummary: 'Cuidados recomendados',
    currentState: 'Estado detectado',
    thresholdsTitle: 'Umbrales y valores optimos',
    thresholdsHelper: 'Define los rangos saludables para compararlos con las lecturas reales.',
    thresholdsCreateHint: 'Los thresholds se generaran automaticamente al guardar la planta.',
    readingType: 'Indicador',
    minimum: 'Minimo',
    maximum: 'Maximo',
    optimalMin: 'Optimo minimo',
    optimalMax: 'Optimo maximo',
    unit: 'Unidad',
    metricStatus: 'Estado',
    noThresholds: 'No hay thresholds para esta planta.',
    loadingThresholds: 'Cargando thresholds...',
    thresholdsError: 'No se han podido cargar los thresholds.',
    thresholdSavedInline: 'Los cambios de thresholds se guardaran con el boton principal.',
    chartTitle: 'Lecturas de los ultimos 10 dias',
    chartHelper: 'Selecciona uno o varios indicadores para comparar las lecturas con los valores optimos.',
    noReadings: 'Todavia no hay lecturas para dibujar la grafica.',
    chartLoading: 'Cargando lecturas...',
    relationTitle: 'Instalacion y sensores vinculados',
    relationHelper: 'Muestra la instalacion actual de la planta y los dispositivos activos asociados.',
    relationEmpty: 'Selecciona una instalacion para ver los sensores relacionados.',
    sensorsAssigned: 'Sensores asignados',
    sensorsNone: 'No hay sensores asignados a esta instalacion.',
    serial: 'Serial',
    mac: 'MAC',
    photosTitle: 'Fotos y analisis',
    photosHelper: 'Gestiona la cronologia de fotos de la planta y anade nuevas imagenes cuando haga falta.',
    noPhotoPreview: 'Todavia no hay ninguna foto seleccionada.',
    photoTimelineEmpty: 'Todavia no hay fotos guardadas para esta planta.',
    photoPart: 'Tipo de foto',
    leaf: 'Hoja',
    trunk: 'Tronco',
    general: 'General',
    evolution: 'Evolucion',
    capturedOn: 'Capturada el',
    addPhoto: 'Anadir foto',
    uploadingPhoto: 'Subiendo foto...',
    photoSaved: 'Foto guardada correctamente.',
    deletePhoto: 'Eliminar foto',
    analyzeLatestPhotos: 'Analizar ultima serie',
    photoNotes: 'Notas de la foto',
    loadingPhotos: 'Cargando fotos...',
    photosError: 'No se han podido cargar las fotos.',
    status_unknown: 'Sin datos',
    status_healthy: 'Correcta',
    status_warning: 'Aviso',
    status_critical: 'Critica',
    status_inactive: 'Inactiva',
    metric_SOIL_PERCENT: 'Humedad suelo',
    metric_TEMP_C: 'Temperatura',
    metric_HUM_AIR: 'Humedad aire',
    metric_LDR_RAW: 'Luz',
    metric_RSSI: 'Senal WiFi',
    plant_type_plant: 'Planta',
    plant_type_crop: 'Cultivo',
    plant_type_tree: 'Arbol',
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
    basicSavedHint: 'La informacion basica y los thresholds se guardaran conjuntamente.',
  },
}

UI_TEXT.en = {
  tabs: { basic: 'Basic Info', thresholds: 'Thresholds', relations: 'Installations / Sensors', photos: 'Photos' },
  newPlant: 'New plant',
  editPlant: 'Edit plant',
  helperCreate: 'Create a plant and review the generated information before saving.',
  helperEdit: 'Review or update the selected plant information.',
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
  save: 'Save',
  saving: 'Saving...',
  cancel: 'Cancel',
  delete: 'Delete',
  confirmDelete: 'Are you sure you want to delete this plant?',
  yes: 'Yes',
  no: 'No',
  requiredInstallation: 'Installation is optional.',
  requiredCode: 'The Code field is required.',
  requiredName: 'The Name field is required.',
  selectInstallation: 'Select an installation',
  loadingInstallations: 'Loading installations...',
  noInstallations: 'No installations available.',
  uploadPhoto: 'Upload photo',
  takePhoto: 'Take photo',
  identifyTitle: 'Photo identification',
  identifyHint: 'You can analyze a photo and complete the card. Installation is optional and can be linked later.',
  identifying: 'Analyzing photo...',
  preparingPhoto: 'Preparing photo...',
  photoLoaded: 'Data loaded from the photo.',
  identifyError: 'The plant could not be identified from the photo.',
  confidence: 'Confidence',
  careSummary: 'Recommended care',
  currentState: 'Detected state',
  thresholdsTitle: 'Thresholds and optimal values',
  thresholdsHelper: 'Define healthy ranges so they can later be compared with real readings.',
  thresholdsCreateHint: 'Thresholds will be generated automatically once the plant is saved.',
  readingType: 'Metric',
  minimum: 'Minimum',
  maximum: 'Maximum',
  optimalMin: 'Optimal minimum',
  optimalMax: 'Optimal maximum',
  unit: 'Unit',
  metricStatus: 'Status',
  noThresholds: 'There are no thresholds for this plant yet.',
  loadingThresholds: 'Loading thresholds...',
  thresholdsError: 'Could not load thresholds.',
  thresholdSavedInline: 'Threshold changes will be saved with the main save button.',
  chartTitle: 'Readings from the last 10 days',
  chartHelper: 'Select one or more metrics to compare readings with the plant optimal values.',
  noReadings: 'There are no readings available for the chart yet.',
  chartLoading: 'Loading readings...',
  relationTitle: 'Installation and linked sensors',
  relationHelper: 'Shows the current installation of the plant and its active assigned devices.',
  relationEmpty: 'Select an installation to view related sensors.',
  sensorsAssigned: 'Assigned sensors',
  sensorsNone: 'There are no sensors assigned to this installation.',
  serial: 'Serial',
  mac: 'MAC',
  photosTitle: 'Photos and analysis',
  photosHelper: 'Manage the photo timeline of the plant and add new images when needed.',
  noPhotoPreview: 'There is no selected photo yet.',
  photoTimelineEmpty: 'There are no photos stored for this plant yet.',
  photoPart: 'Photo type',
  leaf: 'Leaf',
  trunk: 'Trunk',
  general: 'General',
  evolution: 'Evolution',
  capturedOn: 'Captured on',
  addPhoto: 'Add photo',
  uploadingPhoto: 'Uploading photo...',
  photoSaved: 'Photo uploaded successfully.',
  deletePhoto: 'Delete photo',
  analyzeLatestPhotos: 'Analyze latest set',
  photoNotes: 'Photo notes',
  loadingPhotos: 'Loading photos...',
  photosError: 'Could not load the photos.',
  status_unknown: 'No data',
  status_healthy: 'Healthy',
  status_warning: 'Warning',
  status_critical: 'Critical',
  status_inactive: 'Inactive',
  metric_SOIL_PERCENT: 'Soil humidity',
  metric_TEMP_C: 'Temperature',
  metric_HUM_AIR: 'Air humidity',
  metric_LDR_RAW: 'Light',
  metric_RSSI: 'WiFi signal',
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
  basicSavedHint: 'Basic information and thresholds will be saved together.',
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

function Field({ label, required = false, fullWidth = false, children }) {
  return (
    <label className={`space-y-2 text-sm text-slate-700 ${fullWidth ? 'md:col-span-2 xl:col-span-3' : ''}`}>
      <span>{label}{required ? ' *' : ''}</span>
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

function parseDecimal(value) {
  if (value === '' || value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatDateTime(value, language) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : language, { dateStyle: 'short', timeStyle: 'short' }).format(parsed)
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

async function optimizeImageForPlantIdentification(file) {
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

function normalizeInstallation(item) {
  return {
    id: item.id,
    client_id: item.client_id || '',
    name: item.name || '',
    code: item.code || '',
    label: item.name ? `${item.name} (${item.code || '-'})` : item.code || '',
  }
}

function normalizeThreshold(item) {
  return {
    id: item.id,
    plant_id: item.plant_id,
    reading_type_id: item.reading_type_id,
    reading_type_code: item.reading_type_code || '',
    reading_type_name: item.reading_type_name || '',
    unit: item.unit || item.reading_type_unit || '',
    min_value: toInputValue(item.min_value),
    max_value: toInputValue(item.max_value),
    optimal_min_value: toInputValue(item.optimal_min_value),
    optimal_max_value: toInputValue(item.optimal_max_value),
    modified_on: item.modified_on || null,
    is_active: item.is_active ?? true,
  }
}

function serializeThresholds(thresholds) {
  return JSON.stringify(thresholds.map((item) => ({
    id: item.id,
    min_value: item.min_value,
    max_value: item.max_value,
    optimal_min_value: item.optimal_min_value,
    optimal_max_value: item.optimal_max_value,
    modified_on: item.modified_on,
    unit: item.unit,
    is_active: item.is_active,
  })))
}

function getMetricValue(readingTypeCode, reading) {
  const meta = METRIC_META[readingTypeCode]
  if (!meta) return null
  const raw = reading?.[meta.field]
  if (raw == null || raw === '') return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

function toneClasses(status) {
  switch (status) {
    case 'healthy':
      return 'bg-emerald-100 text-emerald-700'
    case 'warning':
      return 'bg-amber-100 text-amber-700'
    case 'critical':
      return 'bg-red-100 text-red-700'
    case 'inactive':
      return 'bg-slate-200 text-slate-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function buildThresholdUpdates(thresholds, baseline) {
  const original = new Map(JSON.parse(baseline).map((item) => [item.id, item]))
  return thresholds
    .filter((item) => {
      const previous = original.get(item.id)
      if (!previous) return true
      return JSON.stringify({
        min_value: item.min_value,
        max_value: item.max_value,
        optimal_min_value: item.optimal_min_value,
        optimal_max_value: item.optimal_max_value,
        unit: item.unit,
        is_active: item.is_active,
      }) !== JSON.stringify({
        min_value: previous.min_value,
        max_value: previous.max_value,
        optimal_min_value: previous.optimal_min_value,
        optimal_max_value: previous.optimal_max_value,
        unit: previous.unit,
        is_active: previous.is_active,
      })
    })
    .map((item) => ({
      id: item.id,
      payload: {
        min_value: parseDecimal(item.min_value),
        max_value: parseDecimal(item.max_value),
        optimal_min_value: parseDecimal(item.optimal_min_value),
        optimal_max_value: parseDecimal(item.optimal_max_value),
        modified_on: item.modified_on || null,
        unit: item.unit || null,
        is_active: Boolean(item.is_active),
      },
    }))
}

function ChartCard({ metric, threshold, readings, text, language }) {
  const chartData = useMemo(() => readings.map((reading) => {
    const value = getMetricValue(metric.reading_type_code, reading)
    if (value == null) return null
    return { ts: reading.ts || reading.created_on, label: formatDateTime(reading.ts || reading.created_on, language), value }
  }).filter(Boolean), [language, metric.reading_type_code, readings])

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-slate-900">{metric.reading_type_name || text[`metric_${metric.reading_type_code}`] || metric.reading_type_code}</p>
            <p className="text-sm text-slate-500">{threshold.unit || '-'}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${toneClasses(metric.status)}`}>{text[`status_${metric.status}`] || metric.status}</span>
        </div>
        <p className="mt-4 text-sm text-slate-500">{text.noReadings}</p>
      </div>
    )
  }

  const lineColor = METRIC_META[metric.reading_type_code]?.color || '#0f766e'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">{metric.reading_type_name || text[`metric_${metric.reading_type_code}`] || metric.reading_type_code}</p>
          <p className="text-sm text-slate-500">{threshold.unit || '-'}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${toneClasses(metric.status)}`}>{text[`status_${metric.status}`] || metric.status}</span>
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" minTickGap={24} stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Legend />
            {threshold.optimal_min_value !== '' && threshold.optimal_max_value !== '' ? (
              <ReferenceArea y1={Number(threshold.optimal_min_value)} y2={Number(threshold.optimal_max_value)} fill={lineColor} fillOpacity={0.08} />
            ) : null}
            {threshold.min_value !== '' ? <ReferenceLine y={Number(threshold.min_value)} stroke="#ef4444" strokeDasharray="5 5" /> : null}
            {threshold.max_value !== '' ? <ReferenceLine y={Number(threshold.max_value)} stroke="#ef4444" strokeDasharray="5 5" /> : null}
            <Line type="monotone" dataKey="value" name={metric.reading_type_name || metric.reading_type_code} stroke={lineColor} strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function PlantEditModalTabs({
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
  const [activeTab, setActiveTab] = useState('basic')
  const [form, setForm] = useState(EMPTY_FORM)
  const [installations, setInstallations] = useState([])
  const [isLoadingInstallations, setIsLoadingInstallations] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isOptimizingPhoto, setIsOptimizingPhoto] = useState(false)
  const [isIdentifying, setIsIdentifying] = useState(false)
  const [identificationInfo, setIdentificationInfo] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')
  const [photoUploadFile, setPhotoUploadFile] = useState(null)
  const [photoUploadPart, setPhotoUploadPart] = useState('evolution')
  const [photoUploadNotes, setPhotoUploadNotes] = useState('')
  const [photoUploadCapturedOn, setPhotoUploadCapturedOn] = useState('')
  const [plantPhotos, setPlantPhotos] = useState([])
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [photosError, setPhotosError] = useState('')
  const [photoSuccess, setPhotoSuccess] = useState('')
  const [thresholds, setThresholds] = useState([])
  const [thresholdsBaseline, setThresholdsBaseline] = useState('[]')
  const [isLoadingThresholds, setIsLoadingThresholds] = useState(false)
  const [thresholdsError, setThresholdsError] = useState('')
  const [healthSummary, setHealthSummary] = useState(null)
  const [isLoadingHealthSummary, setIsLoadingHealthSummary] = useState(false)
  const [readings, setReadings] = useState([])
  const [isLoadingReadings, setIsLoadingReadings] = useState(false)
  const [readingsError, setReadingsError] = useState('')
  const [selectedMetricCodes, setSelectedMetricCodes] = useState([])
  const [relationDevices, setRelationDevices] = useState([])
  const [isLoadingRelations, setIsLoadingRelations] = useState(false)
  const [relationsError, setRelationsError] = useState('')
  const uploadInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    setActiveTab('basic')
    setValidationError('')
    setShowDeleteConfirm(Boolean(initialDeleteConfirm))
    setIdentificationInfo(null)
    setPhotoUploadFile(null)
    setPhotoUploadPart('evolution')
    setPhotoUploadNotes('')
    setPhotoUploadCapturedOn('')
    setPlantPhotos([])
    setPhotosError('')
    setPhotoSuccess('')
    setThresholds([])
    setThresholdsBaseline('[]')
    setThresholdsError('')
    setHealthSummary(null)
    setReadings([])
    setReadingsError('')
    setSelectedMetricCodes([])
    setRelationDevices([])
    setRelationsError('')
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

  useEffect(() => () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
  }, [photoPreviewUrl])

  useEffect(() => {
    if (!isOpen) return
    let mounted = true
    async function loadInstallations() {
      setIsLoadingInstallations(true)
      try {
        const payload = await installationsService.listInstallations()
        if (!mounted) return
        setInstallations((Array.isArray(payload) ? payload : []).map(normalizeInstallation))
      } finally {
        if (mounted) setIsLoadingInstallations(false)
      }
    }
    loadInstallations()
    return () => { mounted = false }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || !plant?.id) return
    let mounted = true
    async function loadThresholds() {
      setIsLoadingThresholds(true)
      setThresholdsError('')
      try {
        const payload = await plantThresholdsService.searchThresholds({
          pagination_params: { page: 1, page_size: 50 },
          sorting_params: [{ sort_by: 'reading_type_code', sort_direction: 'asc' }],
          plant_id: { filter_value: plant.id, comparator: 'equals' },
        })
        if (!mounted) return
        const normalized = (payload?.items || []).map(normalizeThreshold)
        setThresholds(normalized)
        setThresholdsBaseline(serializeThresholds(normalized))
        setSelectedMetricCodes(normalized.map((item) => item.reading_type_code).filter(Boolean))
      } catch (err) {
        if (mounted) setThresholdsError(err.message || text.thresholdsError)
      } finally {
        if (mounted) setIsLoadingThresholds(false)
      }
    }
    async function loadHealthSummary() {
      setIsLoadingHealthSummary(true)
      try {
        const payload = await plantThresholdsService.getPlantHealthSummary(plant.id)
        if (mounted) setHealthSummary(payload)
      } finally {
        if (mounted) setIsLoadingHealthSummary(false)
      }
    }
    async function loadReadings() {
      setIsLoadingReadings(true)
      setReadingsError('')
      try {
        const payload = await plantsService.listPlantReadings(plant.id, { days: 10, limit: 500 })
        if (mounted) setReadings(payload)
      } catch (err) {
        if (mounted) setReadingsError(err.message || text.chartLoading)
      } finally {
        if (mounted) setIsLoadingReadings(false)
      }
    }
    loadThresholds()
    loadHealthSummary()
    loadReadings()
    return () => { mounted = false }
  }, [isOpen, plant?.id, text.chartLoading, text.thresholdsError])

  useEffect(() => {
    if (!isOpen || !form.installation_id) return
    let mounted = true
    async function loadRelations() {
      setIsLoadingRelations(true)
      setRelationsError('')
      try {
        const summary = await installationsService.getDeviceAssignmentsSummary(form.installation_id)
        const deviceIds = (summary?.selected_device_ids || []).map(String)
        if (!deviceIds.length) {
          if (!mounted) return
          setRelationDevices([])
          return
        }
        const resolvedClientId =
          form.client_id ||
          plant?.client_id ||
          ''
        const devicesPayload = await devicesService.searchDevices(
          { client_ids: resolvedClientId ? [resolvedClientId] : [] },
          { page: 1, pageSize: 100 }
        )
        if (!mounted) return
        setRelationDevices((devicesPayload?.items || []).filter((item) => deviceIds.includes(String(item.id))))
      } catch (err) {
        if (mounted) setRelationsError(err.message || text.relationEmpty)
      } finally {
        if (mounted) setIsLoadingRelations(false)
      }
    }
    loadRelations()
    return () => { mounted = false }
  }, [form.client_id, form.installation_id, isOpen, plant?.client_id, text.relationEmpty])

  useEffect(() => {
    if (!isOpen || mode !== 'edit' || !plant?.id) return
    loadPlantPhotos(plant.id)
  }, [isOpen, mode, plant?.id])

  const thresholdsDirty = useMemo(() => serializeThresholds(thresholds) !== thresholdsBaseline, [thresholds, thresholdsBaseline])
  const filteredInstallations = useMemo(() => !form.client_id ? installations : installations.filter((item) => item.client_id === form.client_id), [form.client_id, installations])
  const selectedInstallation = useMemo(() => installations.find((item) => item.id === form.installation_id) || null, [form.installation_id, installations])
  const healthMetricsByCode = useMemo(() => {
    const map = new Map()
    for (const metric of healthSummary?.metrics || []) map.set(metric.reading_type_code, metric)
    return map
  }, [healthSummary])
  const visibleChartMetrics = useMemo(() => {
    const selected = new Set(selectedMetricCodes)
    return thresholds.filter((item) => selected.has(item.reading_type_code))
  }, [selectedMetricCodes, thresholds])
  const title = mode === 'edit' ? `${text.editPlant}${plant?.name ? ` - ${plant.name}` : ''}` : text.newPlant
  const helper = mode === 'edit' ? text.helperEdit : text.helperCreate

  if (!isOpen) return null

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function updateThresholdDraft(thresholdId, field, value) {
    setThresholds((prev) => prev.map((item) => (item.id === thresholdId ? { ...item, [field]: value } : item)))
  }

  function getPhotoPartLabel(part) {
    return text[part] || part
  }

  function toggleMetric(code) {
    setSelectedMetricCodes((prev) => prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code])
  }

  async function handleImageSelection(file) {
    if (!file || mode !== 'edit' || !plant?.id) return
    setValidationError('')
    setPhotosError('')
    setPhotoSuccess('')
    setIsOptimizingPhoto(true)

    try {
      const optimizedFile = await optimizeImageForPlantIdentification(file)
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
      setPhotoPreviewUrl(URL.createObjectURL(optimizedFile))
      setPhotoUploadFile(optimizedFile)
    } catch (err) {
      setPhotosError(err.message || text.photosError)
    } finally {
      setIsOptimizingPhoto(false)
      if (uploadInputRef.current) uploadInputRef.current.value = ''
      if (cameraInputRef.current) cameraInputRef.current.value = ''
    }
  }

  async function loadPlantPhotos(currentPlantId) {
    if (!currentPlantId) return
    setIsLoadingPhotos(true)
    setPhotosError('')
    setPhotoSuccess('')
    try {
      const payload = await plantsService.listPlantPhotos(currentPlantId)
      setPlantPhotos(Array.isArray(payload) ? payload : [])
    } catch (err) {
      setPhotosError(err.message || text.photosError)
    } finally {
      setIsLoadingPhotos(false)
    }
  }

  async function handleUploadPhoto() {
    if (!plant?.id || !photoUploadFile) {
      setPhotosError(text.noPhotoPreview)
      return
    }

    setPhotosError('')
    setPhotoSuccess('')
    setIsUploadingPhoto(true)
    try {
      await plantsService.uploadPlantPhoto(plant.id, {
        photoPart: photoUploadPart,
        file: photoUploadFile,
        notes: photoUploadNotes,
        capturedOn: photoUploadCapturedOn || null,
      })
      setPhotoUploadFile(null)
      setPhotoUploadNotes('')
      setPhotoUploadCapturedOn('')
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl)
        setPhotoPreviewUrl('')
      }
      setPhotoSuccess(text.photoSaved)
      await loadPlantPhotos(plant.id)
    } catch (err) {
      setPhotosError(err.message || text.photosError)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  async function handleDeletePhoto(photoId) {
    if (!plant?.id) return
    setPhotosError('')
    setPhotoSuccess('')
    setIsUploadingPhoto(true)
    try {
      await plantsService.deletePlantPhoto(plant.id, photoId)
      await loadPlantPhotos(plant.id)
    } catch (err) {
      setPhotosError(err.message || text.photosError)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  async function handleAnalyzeLatestPhotos() {
    if (!plant?.id) return
    setPhotosError('')
    setPhotoSuccess('')
    setIsIdentifying(true)
    try {
      const identified = await plantsService.analyzeLatestPlantPhotos(plant.id, language)
      setForm((prev) => ({
        ...prev,
        code: identified.suggested_code || prev.code,
        name: identified.name || prev.name,
        common_name: identified.common_name || prev.common_name || '',
        scientific_name: identified.scientific_name || prev.scientific_name || '',
        plant_type: identified.plant_type || prev.plant_type || '',
        location_type: identified.location_type || prev.location_type || '',
        sun_exposure: identified.sun_exposure || prev.sun_exposure || '',
        status: identified.status || prev.status || '',
        notes: identified.notes || prev.notes || '',
      }))
      setIdentificationInfo({
        confidence: identified.confidence,
        care_summary: identified.care_summary || '',
        current_state: identified.current_state || '',
      })
    } catch (err) {
      setPhotosError(err.message || text.identifyError)
    } finally {
      setIsIdentifying(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    setValidationError('')
    if (!form.code.trim()) { setValidationError(text.requiredCode); setActiveTab('basic'); return }
    if (!form.name.trim()) { setValidationError(text.requiredName); setActiveTab('basic'); return }

    const thresholdUpdates = mode === 'edit' && thresholdsDirty ? buildThresholdUpdates(thresholds, thresholdsBaseline) : []

    onSave({
      plant: {
        client_id: selectedInstallation?.client_id || form.client_id || plant?.client_id,
        installation_id: form.installation_id || null,
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
        modified_on: mode === 'edit' ? form.modified_on || null : undefined,
      },
      thresholdUpdates,
    })
  }

  function renderOptions(type) {
    return OPTION_SETS[type].map((value) => <option key={value} value={value}>{text[`${type}_${value}`]}</option>)
  }

  const tabs = [
    { key: 'basic', label: text.tabs.basic },
    { key: 'thresholds', label: text.tabs.thresholds },
    { key: 'relations', label: text.tabs.relations },
    { key: 'photos', label: text.tabs.photos },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[92vh] w-full max-w-7xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{helper}</p>
          </div>
          {mode === 'edit' ? (
            <button type="button" onClick={() => setShowDeleteConfirm(true)} disabled={isSaving || !canDelete} className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50">{text.delete}</button>
          ) : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeTab === tab.key ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {activeTab === 'basic' ? (
            <section className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">{text.basicSavedHint}</div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label={text.installation} required>
                  <select name="installation_id" value={form.installation_id} onChange={(event) => {
                    handleChange(event)
                    const installation = installations.find((item) => item.id === event.target.value)
                    setForm((prev) => ({ ...prev, installation_id: event.target.value, client_id: installation?.client_id || prev.client_id }))
                  }} disabled={isSaving || isLoadingInstallations || !canEdit} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50">
                    <option value="">{isLoadingInstallations ? text.loadingInstallations : filteredInstallations.length > 0 ? text.selectInstallation : text.noInstallations}</option>
                    {filteredInstallations.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </Field>
                <Field label={text.code} required><input name="code" value={form.code} onChange={handleChange} disabled={!canEdit} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" /></Field>
                <Field label={text.name} required><input name="name" value={form.name} onChange={handleChange} disabled={!canEdit} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" /></Field>
                <Field label={text.commonName}><input name="common_name" value={form.common_name} onChange={handleChange} disabled={!canEdit} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" /></Field>
                <Field label={text.scientificName}><input name="scientific_name" value={form.scientific_name} onChange={handleChange} disabled={!canEdit} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" /></Field>
                <Field label={text.plantType}><select name="plant_type" value={form.plant_type} onChange={handleChange} disabled={!canEdit} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"><option value=""></option>{renderOptions('plant_type')}</select></Field>
                <Field label={text.plantingType}><select name="planting_type" value={form.planting_type} onChange={handleChange} disabled={!canEdit} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"><option value=""></option>{renderOptions('planting_type')}</select></Field>
                <Field label={text.locationType}><select name="location_type" value={form.location_type} onChange={handleChange} disabled={!canEdit} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"><option value=""></option>{renderOptions('location_type')}</select></Field>
                <Field label={text.sunExposure}><select name="sun_exposure" value={form.sun_exposure} onChange={handleChange} disabled={!canEdit} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"><option value=""></option>{renderOptions('sun_exposure')}</select></Field>
                <Field label={text.potSize}><input type="number" step="any" name="pot_size_cm" value={form.pot_size_cm} onChange={handleChange} disabled={!canEdit} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" /></Field>
                <Field label={text.height}><input type="number" step="any" name="height_cm" value={form.height_cm} onChange={handleChange} disabled={!canEdit} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" /></Field>
                <Field label={text.width}><input type="number" step="any" name="width_cm" value={form.width_cm} onChange={handleChange} disabled={!canEdit} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" /></Field>
                <Field label={text.plantingDate}><input type="date" name="planting_date" value={form.planting_date} onChange={handleChange} disabled={!canEdit} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" /></Field>
                <Field label={text.lastRepottingDate}><input type="date" name="last_repotting_date" value={form.last_repotting_date} onChange={handleChange} disabled={!canEdit} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" /></Field>
                <Field label={text.status}><select name="status" value={form.status} onChange={handleChange} disabled={!canEdit} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50"><option value=""></option>{renderOptions('status')}</select></Field>
                <Field label={text.notes} fullWidth><textarea name="notes" value={form.notes} onChange={handleChange} disabled={!canEdit} rows={4} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" /></Field>
                <div className="space-y-2 text-sm text-slate-700">
                  <span className="block">{text.active}</span>
                  <BinarySwitch checked={Boolean(form.is_active)} onChange={(value) => setForm((prev) => ({ ...prev, is_active: value }))} disabled={!canEdit || isSaving} />
                </div>
              </div>
            </section>
          ) : null}

          {activeTab === 'thresholds' ? (
            <section className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-base font-semibold text-slate-900">{text.thresholdsTitle}</h3>
                <p className="mt-1 text-sm text-slate-600">{text.thresholdsHelper}</p>
                <p className="mt-2 text-sm text-slate-500">{mode === 'edit' ? text.thresholdSavedInline : text.thresholdsCreateHint}</p>
              </div>
              {mode !== 'edit' ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">{text.thresholdsCreateHint}</div>
              ) : (
                <>
                  {thresholdsError ? <p className="text-sm text-red-600">{thresholdsError}</p> : null}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {(healthSummary?.metrics || []).map((metric) => (
                      <div key={metric.threshold_id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">{metric.reading_type_name || text[`metric_${metric.reading_type_code}`] || metric.reading_type_code}</p>
                            <p className="mt-1 text-sm text-slate-500">{metric.message || '-'}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${toneClasses(metric.status)}`}>{text[`status_${metric.status}`] || metric.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-3 py-3">{text.readingType}</th><th className="px-3 py-3">{text.minimum}</th><th className="px-3 py-3">{text.maximum}</th><th className="px-3 py-3">{text.optimalMin}</th><th className="px-3 py-3">{text.optimalMax}</th><th className="px-3 py-3">{text.unit}</th><th className="px-3 py-3">{text.metricStatus}</th><th className="px-3 py-3">{text.active}</th></tr></thead>
                      <tbody>
                        {thresholds.map((threshold) => {
                          const metric = healthMetricsByCode.get(threshold.reading_type_code)
                          return (
                            <tr key={threshold.id} className="border-t border-slate-100">
                              <td className="px-3 py-3"><div className="font-medium text-slate-900">{threshold.reading_type_name || text[`metric_${threshold.reading_type_code}`] || threshold.reading_type_code}</div><div className="text-xs text-slate-500">{threshold.reading_type_code}</div></td>
                              {['min_value', 'max_value', 'optimal_min_value', 'optimal_max_value', 'unit'].map((field) => <td key={field} className="px-3 py-3"><input type={field === 'unit' ? 'text' : 'number'} step={field === 'unit' ? undefined : 'any'} value={threshold[field]} onChange={(event) => updateThresholdDraft(threshold.id, field, event.target.value)} disabled={!canEdit || isSaving} className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-400 disabled:bg-slate-50" /></td>)}
                              <td className="px-3 py-3"><span className={`rounded-full px-3 py-1 text-xs font-medium ${toneClasses(metric?.status || 'unknown')}`}>{text[`status_${metric?.status || 'unknown'}`] || metric?.status || 'unknown'}</span></td>
                              <td className="px-3 py-3"><BinarySwitch checked={Boolean(threshold.is_active)} onChange={(value) => updateThresholdDraft(threshold.id, 'is_active', value)} disabled={!canEdit || isSaving} /></td>
                            </tr>
                          )
                        })}
                        {!isLoadingThresholds && thresholds.length === 0 ? <tr><td colSpan={8} className="px-3 py-6 text-center text-slate-500">{text.noThresholds}</td></tr> : null}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="text-base font-semibold text-slate-900">{text.chartTitle}</h3>
                    <p className="mt-1 text-sm text-slate-600">{text.chartHelper}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {thresholds.map((threshold) => {
                        const selected = selectedMetricCodes.includes(threshold.reading_type_code)
                        return (
                          <button
                            key={threshold.id}
                            type="button"
                            onClick={() => toggleMetric(threshold.reading_type_code)}
                            className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                              selected
                                ? 'bg-emerald-600 text-white'
                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {threshold.reading_type_name || text[`metric_${threshold.reading_type_code}`] || threshold.reading_type_code}
                          </button>
                        )
                      })}
                    </div>

                    {readingsError ? <p className="mt-4 text-sm text-red-600">{readingsError}</p> : null}

                    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {visibleChartMetrics.map((threshold) => (
                        <ChartCard
                          key={threshold.id}
                          metric={healthMetricsByCode.get(threshold.reading_type_code) || threshold}
                          threshold={threshold}
                          readings={readings}
                          text={text}
                          language={language}
                        />
                      ))}
                    </div>

                    {!isLoadingReadings && visibleChartMetrics.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-500">{text.noThresholds}</p>
                    ) : null}
                  </div>
                </>
              )}
            </section>
          ) : null}

          {activeTab === 'relations' ? (
            <section className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-base font-semibold text-slate-900">{text.relationTitle}</h3>
                <p className="mt-1 text-sm text-slate-600">{text.relationHelper}</p>
              </div>
              {!form.installation_id ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">{text.relationEmpty}</div>
              ) : (
                <>
                  {relationsError ? <p className="text-sm text-red-600">{relationsError}</p> : null}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{text.installation}</p><p className="mt-1 font-medium text-slate-900">{selectedInstallation?.name || '-'}</p><p className="text-sm text-slate-500">{selectedInstallation?.code || '-'}</p></div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{text.sensorsAssigned}</p><p className="mt-1 text-2xl font-semibold text-slate-900">{relationDevices.length}</p></div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{text.name}</p><p className="mt-1 font-medium text-slate-900">{form.name || '-'}</p><p className="text-sm text-slate-500">{form.code || '-'}</p></div>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-left text-slate-500"><tr><th className="px-3 py-3">{text.name}</th><th className="px-3 py-3">{text.code}</th><th className="px-3 py-3">{text.status}</th><th className="px-3 py-3">{text.serial}</th><th className="px-3 py-3">{text.mac}</th></tr></thead>
                      <tbody>
                        {relationDevices.map((device) => <tr key={device.id} className="border-t border-slate-100"><td className="px-3 py-3">{device.name || '-'}</td><td className="px-3 py-3">{device.code || '-'}</td><td className="px-3 py-3">{device.status || '-'}</td><td className="px-3 py-3">{device.serial_number || '-'}</td><td className="px-3 py-3">{device.mac_address || '-'}</td></tr>)}
                        {!isLoadingRelations && relationDevices.length === 0 ? <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-500">{text.sensorsNone}</td></tr> : null}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          ) : null}

          {activeTab === 'photos' ? (
            <section className="space-y-5">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <h3 className="text-base font-semibold text-emerald-900">{text.photosTitle}</h3>
                <p className="mt-1 text-sm text-emerald-800">{text.photosHelper}</p>
                <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[220px,1fr]">
                  <div className="space-y-3">
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>{text.photoPart}</span>
                      <select value={photoUploadPart} onChange={(event) => setPhotoUploadPart(event.target.value)} disabled={!canEdit || isSaving || isUploadingPhoto} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50">
                        <option value="leaf">{text.leaf}</option>
                        <option value="trunk">{text.trunk}</option>
                        <option value="general">{text.general}</option>
                        <option value="evolution">{text.evolution}</option>
                      </select>
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>{text.capturedOn}</span>
                      <input type="datetime-local" value={photoUploadCapturedOn} onChange={(event) => setPhotoUploadCapturedOn(event.target.value)} disabled={!canEdit || isSaving || isUploadingPhoto} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-700">
                      <span>{text.photoNotes}</span>
                      <textarea value={photoUploadNotes} onChange={(event) => setPhotoUploadNotes(event.target.value)} disabled={!canEdit || isSaving || isUploadingPhoto} rows={3} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-400 disabled:bg-slate-50" />
                    </label>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleImageSelection(event.target.files?.[0] || null)} />
                      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => handleImageSelection(event.target.files?.[0] || null)} />
                      <button type="button" disabled={!canEdit || isSaving || isUploadingPhoto || isOptimizingPhoto} onClick={() => uploadInputRef.current?.click()} className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">{text.uploadPhoto}</button>
                      <button type="button" disabled={!canEdit || isSaving || isUploadingPhoto || isOptimizingPhoto} onClick={() => cameraInputRef.current?.click()} className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">{text.takePhoto}</button>
                      <button type="button" disabled={!canEdit || isSaving || isUploadingPhoto || !photoUploadFile} onClick={handleUploadPhoto} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">{text.addPhoto}</button>
                      <button type="button" disabled={!canEdit || isSaving || isUploadingPhoto || isIdentifying} onClick={handleAnalyzeLatestPhotos} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">{text.analyzeLatestPhotos}</button>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      {photoPreviewUrl ? <img src={photoPreviewUrl} alt="Plant preview" className="h-[260px] w-full rounded-2xl object-cover" /> : <div className="flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">{text.noPhotoPreview}</div>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr,1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="space-y-4">
                    {photosError ? <p className="text-sm text-red-600">{photosError}</p> : null}
                    {photoSuccess ? <p className="text-sm text-emerald-600">{photoSuccess}</p> : null}
                    {isLoadingPhotos ? <p className="text-sm text-slate-500">{text.loadingPhotos}</p> : null}
                    <div className="space-y-3">
                      {plantPhotos.map((photo) => (
                        <div key={photo.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row">
                          <div className="h-32 w-full overflow-hidden rounded-2xl bg-slate-100 md:w-44">
                            {photo.signed_url ? <img src={photo.signed_url} alt={getPhotoPartLabel(photo.photo_part)} className="h-full w-full object-cover" /> : null}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{getPhotoPartLabel(photo.photo_part)}</p>
                                <p className="text-xs text-slate-500">{photo.captured_on ? new Date(photo.captured_on).toLocaleString(language === 'en' ? 'en-GB' : language) : '-'}</p>
                              </div>
                              {canEdit ? <button type="button" onClick={() => handleDeletePhoto(photo.id)} disabled={isSaving || isUploadingPhoto} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50">{text.deletePhoto}</button> : null}
                            </div>
                            <p className="text-sm text-slate-600 break-all">{photo.notes || '-'}</p>
                          </div>
                        </div>
                      ))}
                      {!isLoadingPhotos && plantPhotos.length === 0 ? <p className="text-sm text-slate-500">{text.photoTimelineEmpty}</p> : null}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm font-medium text-slate-900">{text.identifyTitle}</p><p className="mt-1 text-sm text-slate-500">{text.identifyHint}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm font-medium text-slate-900">{text.confidence}</p><p className="mt-2 text-2xl font-semibold text-slate-900">{identificationInfo?.confidence != null ? `${Math.round(identificationInfo.confidence * 100)}%` : '-'}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm font-medium text-slate-900">{text.currentState}</p><p className="mt-2 text-sm text-slate-600">{identificationInfo?.current_state || '-'}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-sm font-medium text-slate-900">{text.careSummary}</p><p className="mt-2 text-sm text-slate-600">{identificationInfo?.care_summary || '-'}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">{text.photosHelper}</div>
                </div>
              </div>
            </section>
          ) : null}

          {validationError || error ? <p className="text-sm text-red-600">{validationError || error}</p> : null}
          {!validationError && !error && identificationInfo ? <p className="text-sm text-emerald-600">{text.photoLoaded}</p> : null}

          <div className="flex justify-end gap-3">
            <button type="submit" disabled={isSaving || !canEdit} className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: 'var(--brand-primary)' }}>{isSaving ? text.saving : text.save}</button>
            <button type="button" onClick={onClose} disabled={isSaving} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">{text.cancel}</button>
          </div>
        </form>

        {mode === 'edit' && showDeleteConfirm ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <p className="text-sm text-slate-700">{text.confirmDelete}</p>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={async () => { await onDelete?.(); setShowDeleteConfirm(false) }} disabled={isSaving} className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: 'var(--brand-primary)' }}>{text.yes}</button>
                <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={isSaving} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">{text.cancel}</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <LoadingOverlay
        visible={isSaving || isLoadingInstallations || isIdentifying || isOptimizingPhoto || isLoadingThresholds || isLoadingHealthSummary || isLoadingReadings || isLoadingRelations || isLoadingPhotos || isUploadingPhoto}
        label={isOptimizingPhoto ? text.preparingPhoto : isIdentifying ? text.identifying : isUploadingPhoto ? text.uploadingPhoto : isSaving ? text.saving : isLoadingPhotos ? text.loadingPhotos : isLoadingThresholds || isLoadingHealthSummary ? text.loadingThresholds : isLoadingReadings ? text.chartLoading : isLoadingRelations ? text.relationTitle : text.loadingInstallations}
        transparent
      />
    </div>
  )
}
