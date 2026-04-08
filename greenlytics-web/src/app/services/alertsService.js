import { api } from '../lib/api'

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

function matchesText(value, filterValue) {
  if (!filterValue) return true
  return String(value || '').toLowerCase().includes(String(filterValue).toLowerCase())
}

function matchesBoolean(value, filterValue) {
  if (filterValue === null || filterValue === undefined) return true
  return Boolean(value) === Boolean(filterValue)
}

function applyAlertsFilters(items, filters = {}) {
  return items.filter((item) => {
    return (
      matchesText(item.name, filters.name) &&
      matchesText(item.client_name || item.client_code, filters.clientName) &&
      matchesText(item.installation_name || item.installation_code, filters.installationName) &&
      matchesText(item.plant_name || item.plant_code, filters.plantName) &&
      matchesText(item.reading_type_name || item.reading_type_code, filters.readingTypeName) &&
      matchesText(item.channel, filters.channel) &&
      matchesText(item.condition_type, filters.conditionType) &&
      matchesText(item.recipient_email, filters.recipientEmail) &&
      matchesBoolean(item.is_active, filters.isActive)
    )
  })
}

function sortAlerts(items, sorting = []) {
  const [firstSort] = Array.isArray(sorting) ? sorting : []
  if (!firstSort?.sort_by) return items

  const direction = String(firstSort.sort_direction || 'asc').toLowerCase() === 'desc' ? -1 : 1
  const field = firstSort.sort_by

  return [...items].sort((left, right) => {
    const leftValue = String(left?.[field] || '').toLowerCase()
    const rightValue = String(right?.[field] || '').toLowerCase()
    return leftValue.localeCompare(rightValue) * direction
  })
}

export const alertsService = {
  async listAlerts() {
    const payload = await api.get('/alerts')
    return normalizeList(payload)
  },

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

    try {
      return await api.post('/alerts/search', body)
    } catch (error) {
      const items = await this.listAlerts()
      const filtered = sortAlerts(applyAlertsFilters(items, filters), sorting)
      const offset = (page - 1) * pageSize

      return {
        items: filtered.slice(offset, offset + pageSize),
        total: filtered.length,
        page,
        page_size: pageSize,
        degraded: true,
        degraded_reason: error?.message || 'search_failed',
      }
    }
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
