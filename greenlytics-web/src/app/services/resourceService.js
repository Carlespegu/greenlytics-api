import { api } from '../lib/api'

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  return []
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
}