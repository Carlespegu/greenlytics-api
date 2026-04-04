import { api } from '../lib/api'

export const readingsService = {
  async listReadings(limit = 300) {
    return api.get(`/readings?limit=${limit}`)
  },
}
