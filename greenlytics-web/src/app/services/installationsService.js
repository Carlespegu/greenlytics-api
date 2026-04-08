import { api } from '../lib/api'

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export const installationsService = {
  async listInstallations() {
    const payload = await api.get('/installations')
    return normalizeList(payload)
  },

  async getInstallation(installationId) {
    return api.get(`/installations/${installationId}`)
  },

  async createInstallation(payload) {
    return api.post('/installations', payload)
  },

  async updateInstallation(installationId, payload) {
    return api.put(`/installations/${installationId}`, payload)
  },

  async getDeviceAssignmentsSummary(installationId) {
    return api.get(`/installations/${installationId}/device-assignments/summary`)
  },

  async syncDeviceAssignments(installationId, payload) {
    return api.post(`/installations/${installationId}/device-assignments/sync`, payload)
  },
}
