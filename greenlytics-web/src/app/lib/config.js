const DEFAULT_API_BASE_URL = 'https://api.greenlytics.app'

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '')

export const config = {
  apiBaseUrl,
}
