import { api } from '../lib/api'

export const usersService = {
  async listUsersByClient(clientId) {
    return api.get(`/users?client_id=${clientId}`)
  },

  async searchUsers({
    page = 1,
    pageSize = 10,
    filters = {},
    sorting = [{ sort_by: 'username', sort_direction: 'asc' }],
  } = {}) {
    const body = {
      pagination_params: { page, page_size: pageSize },
      sorting_params: sorting,
    }

    if (filters.username) body.username = { filter_value: filters.username, comparator: 'contains' }
    if (filters.email) body.email = { filter_value: filters.email, comparator: 'contains' }
    if (filters.firstName) body.first_name = { filter_value: filters.firstName, comparator: 'contains' }
    if (filters.lastName) body.last_name = { filter_value: filters.lastName, comparator: 'contains' }
    if (filters.isActive !== '') body.is_active = { filter_value: filters.isActive === 'true', comparator: 'equals' }

    return api.post('/users/search', body)
  },

  async createUser(payload) {
    return api.post('/users', payload)
  },

  async updateUser(userId, payload) {
    return api.put(`/users/${userId}`, payload)
  },
}
