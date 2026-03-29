import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const LanguageContext = createContext(null)

const translations = {
  ca: {
    sessionStarted: 'Sessió iniciada',
    selectLanguage: 'Seleccionar idioma',
    logout: 'Logout',
    dashboard: 'Dashboard',
    device: 'Dispositius',
    installations: 'Instal·lacions',
    plants: 'Plantes',
    readings: 'Lectures',
    users: 'Usuaris',
    alerts: 'Alertes',
    settings: 'Configuració',
  },
  es: {
    sessionStarted: 'Sesión iniciada',
    selectLanguage: 'Seleccionar idioma',
    logout: 'Logout',
    dashboard: 'Dashboard',
    device: 'Dispositivos',
    installations: 'Instalaciones',
    plants: 'Plantas',
    readings: 'Lecturas',
    users: 'Usuarios',
    alerts: 'Alertas',
    settings: 'Configuración',
  },
  en: {
    sessionStarted: 'Session started',
    selectLanguage: 'Select language',
    logout: 'Logout',
    dashboard: 'Dashboard',
    device: 'Devices',
    installations: 'Installations',
    plants: 'Plants',
    readings: 'Readings',
    users: 'Users',
    alerts: 'Alerts',
    settings: 'Settings',
  },
}

const STORAGE_KEY = 'greenlytics_language'

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    localStorage.getItem(STORAGE_KEY) || 'ca'
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
  }, [language])

  const value = useMemo(() => {
    const dict = translations[language] || translations.ca

    return {
      language,
      setLanguage,
      t: (key) => dict[key] || key,
    }
  }, [language])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)

  if (!context) {
    throw new Error('useLanguage s’ha d’utilitzar dins de LanguageProvider')
  }

  return context
}