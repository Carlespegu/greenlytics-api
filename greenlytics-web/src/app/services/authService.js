import { config } from '../lib/config'

export const authService = {
  async login(credentials) {
    const body = new URLSearchParams()
    body.append('username', credentials.email)
    body.append('password', credentials.password)

    const response = await fetch(`${config.apiBaseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.detail || 'Error de login')
    }

    const token = payload?.access_token

    if (!token) {
      throw new Error('La resposta de login no conté access_token')
    }

    return {
      token,
      user: null,
      raw: payload,
    }
  },
}