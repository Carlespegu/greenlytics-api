import { api } from '../lib/api'

export const dashboardService = {
  async getSummary() {
    return api.get('/dashboard/summary')
  },
}
