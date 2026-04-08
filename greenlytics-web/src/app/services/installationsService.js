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
    try {
      return await api.post(`/installations/${installationId}/device-assignments/sync`, payload)
    } catch (error) {
      if (!String(error?.message || '').toLowerCase().includes('not found')) {
        throw error
      }

      return this.syncDeviceAssignmentsLegacy(installationId, payload)
    }
  },

  async syncDeviceAssignmentsLegacy(installationId, payload) {
    const now = new Date().toISOString()
    const requestedIds = Array.from(new Set((payload?.device_ids || []).map(String)))

    const searchPayload = {
      pagination_params: { page: 1, page_size: 200 },
      sorting_params: [{ sort_by: 'created_on', sort_direction: 'desc' }],
      installation_id: { filter_value: installationId, comparator: 'equals' },
      is_active: { filter_value: true, comparator: 'equals' },
    }

    const current = await api.post('/installation-devices/search', searchPayload)
    const currentItems = normalizeList(current)
    const currentByDeviceId = new Map(currentItems.map((item) => [String(item.device_id), item]))

    const toDeactivate = currentItems.filter((item) => !requestedIds.includes(String(item.device_id)))
    const toCreate = requestedIds.filter((deviceId) => !currentByDeviceId.has(deviceId))

    await Promise.all(
      toDeactivate.map((item) =>
        api.put(`/installation-devices/${item.id}`, {
          is_active: false,
          unassigned_on: now,
          notes: payload?.notes ?? item.notes ?? null,
        })
      )
    )

    await Promise.all(
      toCreate.map((deviceId) =>
        api.post('/installation-devices', {
          installation_id: installationId,
          device_id: deviceId,
          assigned_on: now,
          notes: payload?.notes ?? null,
          is_active: true,
        })
      )
    )

    return {
      installation_id: installationId,
      client_id: payload?.client_id,
      assigned_count: requestedIds.length,
      selected_device_ids: requestedIds,
      degraded: true,
    }
  },
}
