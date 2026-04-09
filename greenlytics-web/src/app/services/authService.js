import { config } from '../lib/config'

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export const authService = {
  async login(credentials) {
    const body = new URLSearchParams()
    body.append('grant_type', 'password')
    body.append('username', credentials.email)
    body.append('password', credentials.password)
    body.append('scope', '')
    body.append('client_id', 'string')
    body.append('client_secret', 'string')

    let response = null

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        response = await fetch(`${config.apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        })
      } catch {
        if (attempt === 1) {
          throw new Error(
            'No s’ha pogut connectar amb el servidor. Revisa la connexió o torna-ho a provar.'
          )
        }

        await delay(350)
        continue
      }

      if (![502, 503, 504].includes(response.status) || attempt === 1) {
        break
      }

      await delay(350)
    }

    const rawText = await response.text()

    let payload = null

    try {
      payload = JSON.parse(rawText)
    } catch {
      if ([502, 503, 504].includes(response.status)) {
        throw new Error('El servidor no ha respost correctament. Torna-ho a provar.')
      }

      throw new Error('Error processant la resposta del servidor.')
    }

    if (!response.ok) {
      if (response.status === 400 || response.status === 401) {
        throw new Error('Usuari o contrasenya incorrectes.')
      }

      throw new Error(
        payload?.detail || 'S’ha produït un error en iniciar sessió.'
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

  async me(token) {
    let response

    try {
      response = await fetch(`${config.apiBaseUrl}/auth/me`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    } catch {
      throw new Error('No s’ha pogut obtenir la informació de l’usuari.')
    }

    const rawText = await response.text()

    let payload = null

    try {
      payload = JSON.parse(rawText)
    } catch {
      throw new Error('Error processant la resposta de l’usuari.')
    }

    if (!response.ok) {
      throw new Error(
        payload?.detail || 'No s’ha pogut obtenir la informació de la sessió.'
      )
    }

    return payload
  },
}
