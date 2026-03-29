import { api } from '../lib/api'

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export const dashboardService = {
  async getLatestReadings() {
    // Ajusta aquest endpoint si al teu backend és diferent
    const payload = await api.get('/device-readings?limit=12')
    return normalizeList(payload)
  },
}