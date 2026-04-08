import { api } from '../lib/api'

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export const plantsService = {
  async listPlants() {
    const payload = await api.get('/plants')
    return normalizeList(payload)
  },

  async getPlant(plantId) {
    return api.get(`/plants/${plantId}`)
  },

  async createPlant(payload) {
    return api.post('/plants', payload)
  },

  async updatePlant(plantId, payload) {
    return api.put(`/plants/${plantId}`, payload)
  },

  async deletePlant(plantId) {
    return api.delete(`/plants/${plantId}`)
  },
}
