import { config } from '../lib/config'

export const authService = {
  async login(credentials) {
    const body = new URLSearchParams()
    body.append('grant_type', 'password')
    body.append('username', credentials.email)
    body.append('password', credentials.password)
    body.append('scope', '')
    body.append('client_id', '')
    body.append('client_secret', '')

    let response
    let payload = null

    try {
      response = await fetch(`${config.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body,
      })
    } catch {
      throw new Error(
        'No s’ha pogut connectar amb el servidor. Revisa la connexió o torna-ho a provar.'
      )
    }

    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    if (!response.ok) {
      if (response.status === 400 || response.status === 401) {
        throw new Error('Usuari o contrasenya incorrectes.')
      }

      throw new Error(
        payload?.detail ||
          'S’ha produït un error en iniciar sessió. Torna-ho a provar.'
      )
    }

    const token = payload?.access_token

    if (!token) {
      throw new Error('La resposta de login no conté access_token.')
    }

    return {
      token,
      user: null,
      raw: payload,
    }
  },
}