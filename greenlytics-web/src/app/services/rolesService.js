import { api } from '../lib/api'

export const rolesService = {
  async listAssignableClientRoles() {
    const roles = await api.get('/roles')
    return (roles || []).map((role) => ({
      ...role,
      id: String(role.id || ''),
      code: String(role.code || '').trim().toUpperCase(),
      name: role.name || role.code || '',
    }))
  },
}
