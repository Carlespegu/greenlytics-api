const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function buildHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function parseResponse(response) {
  if (!response.ok) {
    let message = 'S’ha produït un error'
    try {
      const data = await response.json()
      message = data?.detail || data?.message || message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

export const clientBrandingService = {
  async getClientById(clientId, token) {
    const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
      method: 'GET',
      headers: buildHeaders(token),
    })

    return parseResponse(response)
  },

  async updateClient(clientId, payload, token) {
    const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
      method: 'PUT',
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    })

    return parseResponse(response)
  },
}