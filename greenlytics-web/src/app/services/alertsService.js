import { api } from '../lib/api'

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
    if (filters.installationId) {
      body.installation_id = { filter_value: filters.installationId, comparator: 'equals' }
    }
    if (filters.plantId) {
      body.plant_id = { filter_value: filters.plantId, comparator: 'equals' }
    }
    if (filters.readingTypeId) {
      body.reading_type_id = { filter_value: filters.readingTypeId, comparator: 'equals' }
    }

    if (filters.name) {
      body.name = { filter_value: filters.name, comparator: 'contains' }
    }
    if (filters.clientName) {
      body.client_name = { filter_value: filters.clientName, comparator: 'contains' }
    }
    if (filters.installationName) {
      body.installation_name = { filter_value: filters.installationName, comparator: 'contains' }
    }
    if (filters.plantName) {
      body.plant_name = { filter_value: filters.plantName, comparator: 'contains' }
    }
    if (filters.readingTypeName) {
      body.reading_type_name = { filter_value: filters.readingTypeName, comparator: 'contains' }
    }
    if (filters.channel) {
      body.channel = { filter_value: filters.channel, comparator: 'contains' }
    }
    if (filters.conditionType) {
      body.condition_type = { filter_value: filters.conditionType, comparator: 'contains' }
    }
    if (filters.recipientEmail) {
      body.recipient_email = { filter_value: filters.recipientEmail, comparator: 'contains' }
    }
    if (filters.isActive !== '') {
      body.is_active = { filter_value: filters.isActive === 'true', comparator: 'equals' }
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
}
