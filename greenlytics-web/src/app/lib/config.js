const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!apiBaseUrl) {
  throw new Error('Falta la variable VITE_API_BASE_URL al fitxer .env')
}

export const config = {
  apiBaseUrl,
}