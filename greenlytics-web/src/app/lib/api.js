import { config } from './config'
import { storage } from './storage'

const LANGUAGE_STORAGE_KEY = 'greenlytics_language'

async function request(path, options = {}) {
  const token = storage.getToken()
  const language = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'ca'

  const headers = {
    'Content-Type': 'application/json',
    'Accept-Language': language,
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    storage.clearSession()
    window.location.href = '/login'
    throw new Error('Sessió expirada')
  }

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const message =
      payload?.detail ||
      payload?.message ||
      payload?.error ||
      'S’ha produït un error en la petició'

    throw new Error(message)
  }

  return payload
}

export const api = {
  get(path) {
    return request(path, { method: 'GET' })
  },
  post(path, body) {
    return request(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
  put(path, body) {
    return request(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },
  delete(path) {
    return request(path, { method: 'DELETE' })
  },
}
