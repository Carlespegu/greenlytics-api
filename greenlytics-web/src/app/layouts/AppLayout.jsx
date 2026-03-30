import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import LanguageDropdown from '../components/LanguageDropdown'
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

export default function AppLayout() {
  const { user, logout, roleCode, branding } = useAuth()
  const { t } = useLanguage()

  const canAccessAdministration =
    roleCode === 'ADMIN' || roleCode === 'MANAGER'

  const isAdmin = roleCode === 'ADMIN'

  const brandPrimary = branding?.primaryColor || '#059669'
  const brandSecondary = branding?.secondaryColor || '#0f172a'
  const brandName = branding?.appName || 'Greenlytics'
  const brandLogo = branding?.logoUrl || defaultLogo

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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={brandLogo}
              alt={brandName}
              className="h-10 w-10 rounded-xl object-contain"
            />
            <span className="text-xl font-semibold" style={{ color: brandPrimary }}>
              {brandName}
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600">
              {user?.username || user?.email}
              {roleCode ? ` · ${roleCode}` : ''}
            </div>

            <LanguageDropdown />

            <button
              onClick={logout}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: brandSecondary }}
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[260px_1fr]">
        <aside className="self-start md:sticky md:top-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <nav className="space-y-4">
              <div>
                <SectionTitle>Operativa</SectionTitle>
                <div className="space-y-2">
                  <NavLink to="/" end className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                    {t('Dashboard')}
                  </NavLink>
                  <NavLink to="/devices" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                    {t('Dispositius')}
                  </NavLink>
                  <NavLink to="/installations" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                    {t('Instal·lacions')}
                  </NavLink>
                  <NavLink to="/plants" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                    {t('plantes')}
                  </NavLink>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <SectionTitle>Dades</SectionTitle>
                <div className="space-y-2">
                  <NavLink to="/readings" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                    {t('readings')}
                  </NavLink>
                  <NavLink to="/alerts" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                    {t('alerts')}
                  </NavLink>
                </div>
              </div>

              {canAccessAdministration && (
                <div className="border-t border-slate-200 pt-4">
                  <SectionTitle>Administració</SectionTitle>
                  <div className="space-y-2">
                    {isAdmin && (
                      <NavLink to="/clients" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                        {t('Clients')}
                      </NavLink>
                    )}
                    <NavLink to="/users" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                      {t('Users')}
                    </NavLink>
                    <NavLink to="/settings" className={menuClassName} style={({ isActive }) => itemStyle(isActive)}>
                      {t('Settings')}
                    </NavLink>
                  </div>
                </div>
              )}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}