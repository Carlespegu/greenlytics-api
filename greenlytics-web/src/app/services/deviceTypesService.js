import { api } from '../lib/api'

export const deviceTypesService = {
  async listDeviceTypes() {
    return api.get('/device-types')
  },

  async searchDeviceTypeOptions({ query = '', page = 1, pageSize = 10 } = {}) {
    return api.post('/device-types/search-combo', {
      query,
      page,
      page_size: Math.min(pageSize, 10),
    })
  },
}
