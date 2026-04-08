import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import defaultLogo from '../../assets/logo.png'

function menuClassName({ isActive }) {
  return [
    'block rounded-xl px-3 py-2 text-sm font-medium transition',
    isActive ? 'text-slate-900' : 'text-slate-700 hover:bg-slate-100',
  ].join(' ')
}

function SectionTitle({ children }) {
  return (
    <div className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </div>
  )
}

function resolvePageTitle(pathname, t) {
  if (pathname === '/app' || pathname === '/app/') return t('dashboard')
  if (pathname.startsWith('/app/devices')) return t('sensors')
  if (pathname.startsWith('/app/installations')) return t('installations')
  if (pathname.startsWith('/app/plants')) return t('plants')
  if (pathname.startsWith('/app/readings')) return t('readings')
  if (pathname.startsWith('/app/alerts')) return t('alerts')
  if (pathname.startsWith('/app/clients')) return t('clients')
  if (pathname.startsWith('/app/users')) return t('users')
  if (pathname.startsWith('/app/settings')) return t('settings')
  return 'Greenlytics'
}

export default function AppLayout() {
  const { user, logout, roleCode, branding } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  const canAccessAdministration = roleCode === 'ADMIN' || roleCode === 'MANAGER'
  const isAdmin = roleCode === 'ADMIN'

  const brandPrimary = branding?.primaryColor || '#059669'
  const brandSecondary = branding?.secondaryColor || '#0f172a'
  const brandName = branding?.appName || 'Greenlytics'
  const brandLogo = branding?.logoUrl || defaultLogo
  const pageTitle = resolvePageTitle(location.pathname, t)

  function itemStyle(isActive) {
    if (isActive) {
      return {
        backgroundColor: 'var(--brand-primary-soft)',
        color: brandPrimary,
      }
    }

    return undefined
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="w-full px-3 py-3 md:px-5 lg:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="self-start lg:sticky lg:top-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-6 flex items-center gap-3 px-2 pt-1">
                <img
                  src={brandLogo}
                  alt={brandName}
                  className="h-9 w-9 rounded-xl object-contain"
                />
                <span
                  className="text-[1.45rem] font-semibold tracking-tight"
                  style={{ color: brandPrimary }}
                >
                  {brandName}
                </span>
              </div>

              <nav className="space-y-4">
                <div>
                  <SectionTitle>{t('operations')}</SectionTitle>
                  <div className="space-y-2">
                    <NavLink to="/app" end className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                      {t('dashboard')}
                    </NavLink>
                    <NavLink to="/app/devices" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                      {t('sensors')}
                    </NavLink>
                    <NavLink to="/app/installations" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                      {t('installations')}
                    </NavLink>
                    <NavLink to="/app/plants" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                      {t('plants')}
                    </NavLink>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <SectionTitle>{t('data')}</SectionTitle>
                  <div className="space-y-2">
                    <NavLink to="/app/readings" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                      {t('readings')}
                    </NavLink>
                    <NavLink to="/app/alerts" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                      {t('alerts')}
                    </NavLink>
                  </div>
                </div>

                {canAccessAdministration && (
                  <div className="border-t border-slate-200 pt-4">
                    <SectionTitle>{t('administration')}</SectionTitle>
                    <div className="space-y-2">
                      {isAdmin && (
                        <NavLink to="/app/clients" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                          {t('clients')}
                        </NavLink>
                      )}
                      <NavLink to="/app/users" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                        {t('users')}
                      </NavLink>
                      <NavLink to="/app/settings" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                        {t('settings')}
                      </NavLink>
                    </div>
                  </div>
                )}
              </nav>
            </div>
          </aside>

          <div className="min-w-0">
            <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">{t('operations')}</p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                  {pageTitle}
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-600">
                  {user?.username || user?.email}
                  {roleCode ? ` · ${roleCode}` : ''}
                </div>

                <button
                  onClick={logout}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: brandSecondary }}
                >
                  {t('logout')}
                </button>
              </div>
            </header>

            <main className="min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
