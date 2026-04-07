import { api } from '../lib/api'

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export const alertsService = {
  async searchAlerts({
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

    if (filters.clientId) {
      body.client_id = { filter_value: filters.clientId, comparator: 'equals' }
    }
    if (filters.clientName) {
      body.client_name = { filter_value: filters.clientName, comparator: 'contains' }
    }
    if (filters.installationId) {
      body.installation_id = { filter_value: filters.installationId, comparator: 'equals' }
    }
    if (filters.installationName) {
      body.installation_name = { filter_value: filters.installationName, comparator: 'contains' }
    }
    if (filters.plantId) {
      body.plant_id = { filter_value: filters.plantId, comparator: 'equals' }
    }
    if (filters.plantName) {
      body.plant_name = { filter_value: filters.plantName, comparator: 'contains' }
    }
    if (filters.readingTypeId) {
      body.reading_type_id = { filter_value: filters.readingTypeId, comparator: 'equals' }
    }
    if (filters.readingTypeName) {
      body.reading_type_name = { filter_value: filters.readingTypeName, comparator: 'contains' }
    }
    if (filters.name) {
      body.name = { filter_value: filters.name, comparator: 'contains' }
    }
    if (filters.channel) {
      body.channel = { filter_value: filters.channel, comparator: 'equals' }
    }
    if (filters.conditionType) {
      body.condition_type = { filter_value: filters.conditionType, comparator: 'equals' }
    }
    if (filters.recipientEmail) {
      body.recipient_email = { filter_value: filters.recipientEmail, comparator: 'contains' }
    }
    if (filters.isActive !== null && filters.isActive !== undefined) {
      body.is_active = { filter_value: Boolean(filters.isActive), comparator: 'equals' }
    }

    return api.post('/alerts/search', body)
  },

  async getAlertById(alertId) {
    return api.get(`/alerts/${alertId}`)
  },

  async createAlert(payload) {
    return api.post('/alerts', payload)
  },

  async updateAlert(alertId, payload) {
    return api.put(`/alerts/${alertId}`, payload)
  },

  async deleteAlert(alertId) {
    return api.delete(`/alerts/${alertId}`)
  },

  async listReadingTypes() {
    try {
      const payload = await api.get('/reading-types')
      return normalizeList(payload)
    } catch {
      return []
    }
  },
}
