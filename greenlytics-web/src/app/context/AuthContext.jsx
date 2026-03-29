import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { storage } from '../lib/storage'

const AuthContext = createContext(null)

function extractRoleCode(user) {
  return user?.role_code || null
}

function canAccessAdminSection(user) {
  const roleCode = extractRoleCode(user)?.toUpperCase()
  return roleCode === 'ADMIN' || roleCode === 'MANAGER'
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(storage.getToken())
  const [user, setUser] = useState(storage.getUser())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (token) {
      storage.setToken(token)
    } else {
      storage.removeToken()
    }
  }, [token])

  useEffect(() => {
    if (user) {
      storage.setUser(user)
    } else {
      storage.removeUser()
    }
  }, [user])

  async function login(credentials) {
    setIsLoading(true)

    try {
      const result = await authService.login(credentials)
      setToken(result.token)

      const me = await authService.me(result.token)
      setUser(me)

      return {
        token: result.token,
        user: me,
      }
    } finally {
      setIsLoading(false)
    }
  }

  function logout() {
    setToken(null)
    setUser(null)
    storage.clearSession()
  }

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
      roleCode: extractRoleCode(user),
      canSeeAdminSection: canAccessAdminSection(user),
    }),
    [token, user, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth s’ha d’utilitzar dins d’AuthProvider')
  }

  return context
}