import { api } from '../lib/api'

export const installationsService = {
  async searchInstallations({
    page = 1,
    pageSize = 10,
    filters = {},
    sorting = [{ sort_by: 'name', sort_direction: 'asc' }],
  } = {}) {
    const body = {
      pagination_params: { page, page_size: pageSize },
      sorting_params: sorting,
    }

    if (filters.code) body.code = { filter_value: filters.code, comparator: 'contains' }
    if (filters.name) body.name = { filter_value: filters.name, comparator: 'contains' }
    if (filters.city) body.city = { filter_value: filters.city, comparator: 'contains' }
    if (filters.country) body.country = { filter_value: filters.country, comparator: 'contains' }
    if (filters.isActive !== '') body.is_active = { filter_value: filters.isActive === 'true', comparator: 'equals' }

    return api.post('/installations/search', body)
  },
}
