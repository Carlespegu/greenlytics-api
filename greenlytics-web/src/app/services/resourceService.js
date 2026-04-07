import { api } from '../lib/api'

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function buildAlertFromReading(reading) {
  const soilPercent = Number(reading.soil_percent ?? reading.soilPercent)
  const humidity = Number(reading.hum_air ?? reading.humidity ?? reading.humAir)
  const temperature = Number(reading.temp_c ?? reading.temperature ?? reading.tempC)
  const light = Number(reading.ldr_raw ?? reading.light ?? reading.ldrRaw)

  let level = 'info'
  let title = 'Lectura registrada'
  let message = 'Lectura registrada correctament.'

  if (Number.isFinite(soilPercent) && soilPercent <= 20) {
    level = 'high'
    title = 'Humitat baixa'
    message = `Humitat detectada massa baixa (${soilPercent}).`
  } else if (Number.isFinite(temperature) && temperature >= 35) {
    level = 'medium'
    title = 'Temperatura alta'
    message = `Temperatura elevada detectada (${temperature}).`
  } else if (Number.isFinite(light) && light <= 100) {
    level = 'low'
    title = 'Llum baixa'
    message = `Nivell de llum baix detectat (${light}).`
  }

  return {
    id: `alert-${reading.id}`,
    title,
    level,
    status: reading.status || 'open',
    message,
    deviceId: reading.deviceId || reading.device_id || '',
    deviceName: reading.deviceName || reading.device_name || '',
    created_at: reading.ts || reading.created_on || reading.created_at || reading.timestamp,
  }
}

export const resourceService = {
  async listDevices() {
    const payload = await api.get('/devices')
    return normalizeList(payload)
  },

  async listInstallations() {
    const payload = await api.get('/installations')
    return normalizeList(payload)
  },

  async listPlants() {
    const payload = await api.get('/plants')
    return normalizeList(payload)
  },

  async listReadings() {
    const payload = await api.get('/readings')
    return normalizeList(payload)
  },

  async listAlerts() {
    const readings = await this.listReadings()
    return readings.map(buildAlertFromReading)
  },
}
