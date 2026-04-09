import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { storage } from '../lib/storage'
import defaultLogo from '../../assets/logo.png'

const AuthContext = createContext(null)

const DEFAULT_BRANDING = {
  appName: 'Greenlytics',
  logoUrl: defaultLogo,
  faviconUrl: null,
  primaryColor: '#059669',
  secondaryColor: '#0f172a',
}

function extractRoleCode(user) {
  return user?.role_code || null
}

function canAccessAdminSection(user) {
  const roleCode = extractRoleCode(user)?.toUpperCase()
  return roleCode === 'ADMIN' || roleCode === 'MANAGER'
}

function hexToRgba(hex, alpha) {
  if (!hex || typeof hex !== 'string') return `rgba(5, 150, 105, ${alpha})`

  const normalized = hex.replace('#', '').trim()

  if (normalized.length !== 6) {
    return `rgba(5, 150, 105, ${alpha})`
  }

  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function extractBranding(user) {
  if (!user) return DEFAULT_BRANDING

  return {
    appName:
      user.app_name ||
      user.client_trade_name ||
      user.client_name ||
      DEFAULT_BRANDING.appName,
    logoUrl: user.logo_url || DEFAULT_BRANDING.logoUrl,
    faviconUrl: user.favicon_url || null,
    primaryColor: user.primary_color || DEFAULT_BRANDING.primaryColor,
    secondaryColor: user.secondary_color || DEFAULT_BRANDING.secondaryColor,
  }
}

function applyBranding(branding) {
  const safeBranding = branding || DEFAULT_BRANDING

  document.documentElement.style.setProperty(
    '--brand-primary',
    safeBranding.primaryColor
  )
  document.documentElement.style.setProperty(
    '--brand-primary-soft',
    hexToRgba(safeBranding.primaryColor, 0.12)
  )
  document.documentElement.style.setProperty(
    '--brand-primary-soft-strong',
    hexToRgba(safeBranding.primaryColor, 0.18)
  )
  document.documentElement.style.setProperty(
    '--brand-secondary',
    safeBranding.secondaryColor
  )

  document.title = safeBranding.appName || 'Greenlytics'

  if (safeBranding.faviconUrl) {
    let favicon = document.querySelector("link[rel='icon']")

    if (!favicon) {
      favicon = document.createElement('link')
      favicon.setAttribute('rel', 'icon')
      document.head.appendChild(favicon)
    }

    favicon.setAttribute('href', safeBranding.faviconUrl)
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(storage.getToken())
  const [user, setUser] = useState(storage.getUser())
  const [isLoading, setIsLoading] = useState(false)
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(storage.getToken()))

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

  useEffect(() => {
    applyBranding(extractBranding(user))
  }, [user])

  useEffect(() => {
    let isMounted = true

    async function bootstrapAuth() {
      if (!token) {
        if (isMounted) {
          setIsBootstrapping(false)
        }
        return
      }

      if (user) {
        if (isMounted) {
          setIsBootstrapping(false)
        }
        return
      }

      try {
        await refreshCurrentUser(token)
      } catch (error) {
        if (isMounted) {
          logout()
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false)
        }
      }
    }

    bootstrapAuth()

    return () => {
      isMounted = false
    }
  }, [token, user])

  async function refreshCurrentUser(explicitToken) {
    const safeToken = explicitToken || token
    if (!safeToken) return null

    const me = await authService.me(safeToken)
    setUser(me)
    return me
  }

  async function login(credentials) {
    setIsLoading(true)

    try {
      const result = await authService.login(credentials)
      const me = await authService.me(result.token)
      setToken(result.token)
      setUser(me)
      setIsBootstrapping(false)

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
    applyBranding(DEFAULT_BRANDING)
  }

  const branding = extractBranding(user)

  const value = useMemo(
    () => ({
      token,
      user,
      branding,
      isAuthenticated: Boolean(token) && !isBootstrapping,
      isLoading: isLoading || isBootstrapping,
      login,
      logout,
      refreshCurrentUser,
      roleCode: extractRoleCode(user),
      canSeeAdminSection: canAccessAdminSection(user),
    }),
    [token, user, branding, isLoading, isBootstrapping]
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
