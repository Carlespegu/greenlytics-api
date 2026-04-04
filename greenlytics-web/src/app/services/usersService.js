import { api } from '../lib/api'

export const usersService = {
  async listUsersByClient(clientId) {
    return api.get(`/users?client_id=${clientId}`)
  },

  async createUser(payload) {
    return api.post('/users', payload)
  },

  async updateUser(userId, payload) {
    return api.put(`/users/${userId}`, payload)
  },
}
