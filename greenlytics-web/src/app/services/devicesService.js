import { api } from '../lib/api'

function normalizeSearchPayload(filters = {}, pagination = {}) {
  const payload = {
    pagination_params: {
      page: pagination.page || 1,
      page_size: pagination.pageSize || 10,
    },
  }

  if (filters.device_type_id) {
    payload.device_type_id = {
      filter_value: filters.device_type_id,
      comparator: 'equals',
    }
  }

  if (filters.code) {
    payload.code = {
      filter_value: filters.code,
      comparator: 'contains',
    }
  }

  if (filters.name) {
    payload.name = {
      filter_value: filters.name,
      comparator: 'contains',
    }
  }

  if (filters.description) {
    payload.description = {
      filter_value: filters.description,
      comparator: 'contains',
    }
  }

  if (filters.serial_number) {
    payload.serial_number = {
      filter_value: filters.serial_number,
      comparator: 'contains',
    }
  }

  if (filters.status) {
    payload.status = {
      filter_value: filters.status,
      comparator: 'equals',
    }
  }

  if (filters.is_active !== '') {
    payload.is_active = {
      filter_value: filters.is_active === 'true',
      comparator: 'equals',
    }
  }

  return payload
}

function normalizeSearchResponse(payload, pagination = {}) {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      total: payload.length,
      page: pagination.page || 1,
      page_size: pagination.pageSize || 10,
    }
  }

  if (Array.isArray(payload?.items)) {
    return {
      ...payload,
      total: payload.total ?? payload.count ?? payload.items.length,
      page: payload.page ?? pagination.page ?? 1,
      page_size: payload.page_size ?? payload.pageSize ?? pagination.pageSize ?? 10,
    }
  }

  if (Array.isArray(payload?.data)) {
    return {
      items: payload.data,
      total: payload.total ?? payload.count ?? payload.data.length,
      page: payload.page ?? pagination.page ?? 1,
      page_size: payload.page_size ?? payload.pageSize ?? pagination.pageSize ?? 10,
    }
  }

  if (Array.isArray(payload?.results)) {
    return {
      items: payload.results,
      total: payload.total ?? payload.count ?? payload.results.length,
      page: payload.page ?? pagination.page ?? 1,
      page_size: payload.page_size ?? payload.pageSize ?? pagination.pageSize ?? 10,
    }
  }

  return {
    items: [],
    total: 0,
    page: pagination.page || 1,
    page_size: pagination.pageSize || 10,
  }
}

export const devicesService = {
  async searchDevices(filters = {}, pagination = {}) {
    const payload = await api.post('/devices/search', normalizeSearchPayload(filters, pagination))
    return normalizeSearchResponse(payload, pagination)
  },

  async updateDevice(deviceId, body) {
    return api.put(`/devices/${deviceId}`, body)
  },
}
