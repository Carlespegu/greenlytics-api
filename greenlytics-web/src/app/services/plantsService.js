import { api } from '../lib/api'
import { config } from '../lib/config'
import { storage } from '../lib/storage'

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

  async identifyPlantFromImage({ clientId, installationId, file, language = 'ca' }) {
    const formData = new FormData()
    if (clientId) formData.append('client_id', clientId)
    if (installationId) formData.append('installation_id', installationId)
    formData.append('language', language)
    formData.append('image', file)

    const token = storage.getToken()
    const response = await fetch(`${config.apiBaseUrl}/plants/identify-from-image`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    })

    if (response.status === 401) {
      storage.clearSession()
      window.location.href = '/login'
      throw new Error('Sessio expirada')
    }

    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const payload = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      throw new Error(
        payload?.detail ||
          payload?.message ||
          payload?.error ||
          'No sha pogut identificar la planta'
      )
    }

    return payload
  },

  async updatePlant(plantId, payload) {
    return api.put(`/plants/${plantId}`, payload)
  },

  async deletePlant(plantId) {
    return api.delete(`/plants/${plantId}`)
  },
}
