import { api } from '../lib/api'

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export const plantThresholdsService = {
  async listByPlant(plantId) {
    const payload = await api.get(`/plant-thresholds?plant_id=${plantId}`)
    return normalizeList(payload)
  },

  async getThreshold(thresholdId) {
    return api.get(`/plant-thresholds/${thresholdId}`)
  },

  async createThreshold(payload) {
    return api.post('/plant-thresholds', payload)
  },

  async updateThreshold(thresholdId, payload) {
    return api.put(`/plant-thresholds/${thresholdId}`, payload)
  },

  async deleteThreshold(thresholdId) {
    return api.delete(`/plant-thresholds/${thresholdId}`)
  },

  async searchThresholds(payload) {
    return api.post('/plant-thresholds/search', payload)
  },

  async getPlantHealthSummary(plantId) {
    return api.get(`/plant-thresholds/plant/${plantId}/health-summary`)
  },
}
