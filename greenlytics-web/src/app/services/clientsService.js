import { api } from '../lib/api'

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export const clientsService = {
  async listClients() {
    const payload = await api.get('/clients')
    return normalizeList(payload)
  },

  async searchClients({
    page = 1,
    pageSize = 10,
    filters = {},
    sorting = [{ sort_by: 'name', sort_direction: 'asc' }],
  } = {}) {
    const body = {
      pagination_params: {
        page,
        page_size: pageSize,
      },
      sorting_params: sorting,
    }

    if (filters.code) {
      body.code = { filter_value: filters.code, comparator: 'contains' }
    }
    if (filters.name) {
      body.name = { filter_value: filters.name, comparator: 'contains' }
    }
    if (filters.tradeName) {
      body.trade_name = { filter_value: filters.tradeName, comparator: 'contains' }
    }
    if (filters.email) {
      body.email = { filter_value: filters.email, comparator: 'contains' }
    }
    if (filters.city) {
      body.city = { filter_value: filters.city, comparator: 'contains' }
    }
    if (filters.country) {
      body.country = { filter_value: filters.country, comparator: 'contains' }
    }
    if (filters.clientType) {
      body.client_type = { filter_value: filters.clientType, comparator: 'contains' }
    }
    if (filters.isActive !== '' && filters.isActive !== null && filters.isActive !== undefined) {
      body.is_active = { filter_value: Boolean(filters.isActive), comparator: 'equals' }
    }

    return api.post('/clients/search', body)
  },

  async getClientById(clientId) {
    return api.get(`/clients/${clientId}`)
  },

  async searchClientOptions({ query = '', page = 1, pageSize = 10 } = {}) {
    return api.post('/clients/search-combo', {
      query,
      page,
      page_size: Math.min(pageSize, 10),
    })
  },

  async createClient(payload) {
    return api.post('/clients', payload)
  },

  async updateClient(clientId, payload) {
    return api.put(`/clients/${clientId}`, payload)
  },
}
