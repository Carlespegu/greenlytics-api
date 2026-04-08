const TOKEN_KEY = 'greenlytics_token'
const USER_KEY = 'greenlytics_user'

function safeLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  return window.localStorage
}

export const storage = {
  getToken() {
    const local = safeLocalStorage()
    return local ? local.getItem(TOKEN_KEY) : null
  },

  setToken(token) {
    const local = safeLocalStorage()
    if (!local) return
    local.setItem(TOKEN_KEY, token)
  },

  removeToken() {
    const local = safeLocalStorage()
    if (!local) return
    local.removeItem(TOKEN_KEY)
  },

  getUser() {
    const local = safeLocalStorage()
    if (!local) return null

    const raw = local.getItem(USER_KEY)
    if (!raw) return null

    try {
      return JSON.parse(raw)
    } catch {
      local.removeItem(USER_KEY)
      return null
    }
  },

  setUser(user) {
    const local = safeLocalStorage()
    if (!local) return
    local.setItem(USER_KEY, JSON.stringify(user))
  },

  removeUser() {
    const local = safeLocalStorage()
    if (!local) return
    local.removeItem(USER_KEY)
  },

  clearSession() {
    const local = safeLocalStorage()
    if (!local) return
    local.removeItem(TOKEN_KEY)
    local.removeItem(USER_KEY)
  },
}
