import { api } from '../lib/api'

export const rolesService = {
  async listAssignableClientRoles() {
    const roles = await api.get('/roles')
    return (roles || []).filter((role) => {
      const code = (role.code || '').toUpperCase()
      return code === 'MANAGER' || code === 'VIEWER'
    })
  },
}
