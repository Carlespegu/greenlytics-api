import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import defaultLogo from '../../assets/logo.png'

function SectionTitle({ children, collapsed = false }) {
  return (
    <div
      className={`overflow-hidden px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 transition-all duration-300 ${
        collapsed ? 'max-h-0 px-0 pb-0 pt-0 opacity-0' : 'max-h-10 opacity-100'
      }`}
    >
      {children}
    </div>
  )
}

function sectionKeyFromPath(pathname, canAccessAdministration) {
  if (pathname.startsWith('/app/readings') || pathname.startsWith('/app/alerts')) return 'data'
  if (
    canAccessAdministration &&
    (pathname.startsWith('/app/clients') ||
      pathname.startsWith('/app/users') ||
      pathname.startsWith('/app/settings'))
  ) {
    return 'administration'
  }
  return 'operations'
}

function MenuIcon({ type, active, color }) {
  const stroke = active ? color : 'currentColor'
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  switch (type) {
    case 'dashboard':
      return (
        <svg {...common}>
          <path d="M4 13.5 12 5l8 8.5" />
          <path d="M6.5 11.5V20h11V11.5" />
        </svg>
      )
    case 'devices':
      return (
        <svg {...common}>
          <rect x="7" y="3.5" width="10" height="17" rx="2.5" />
          <path d="M10 7h4" />
          <path d="M10 17h4" />
        </svg>
      )
    case 'installations':
      return (
        <svg {...common}>
          <path d="M3 19h18" />
          <path d="M5 19V9l7-4 7 4v10" />
          <path d="M9 19v-5h6v5" />
        </svg>
      )
    case 'plants':
      return (
        <svg {...common}>
          <path d="M12 20V11" />
          <path d="M12 11c0-4.5 3.2-7 7-7 0 4.5-3.1 7-7 7Z" />
          <path d="M12 14c-3.8 0-7-2.5-7-7 3.8 0 7 2.5 7 7Z" />
        </svg>
      )
    case 'readings':
      return (
        <svg {...common}>
          <path d="M4 18V6" />
          <path d="M10 18V10" />
          <path d="M16 18V4" />
          <path d="M22 18v-7" />
        </svg>
      )
    case 'alerts':
      return (
        <svg {...common}>
          <path d="M12 4a5 5 0 0 0-5 5v2.5L5 15v1h14v-1l-2-3.5V9a5 5 0 0 0-5-5Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
      )
    case 'clients':
      return (
        <svg {...common}>
          <path d="M5 18v-1.5A3.5 3.5 0 0 1 8.5 13h7A3.5 3.5 0 0 1 19 16.5V18" />
          <circle cx="12" cy="8" r="3" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common}>
          <path d="M4 18v-1a3 3 0 0 1 3-3h3" />
          <circle cx="9" cy="9" r="3" />
          <path d="M15 10h5" />
          <path d="M17.5 7.5v5" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.8 1.8 0 1 1-2.5 2.5l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.8 1.8 0 1 1-3.6 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a1.8 1.8 0 1 1-2.5-2.5l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1.8 1.8 0 1 1 0-3.6h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a1.8 1.8 0 1 1 2.5-2.5l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a1.8 1.8 0 1 1 3.6 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a1.8 1.8 0 1 1 2.5 2.5l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a1.8 1.8 0 1 1 0 3.6h-.2a1 1 0 0 0-.9.7Z" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      )
  }
}

function SidebarLink({ to, label, icon, brandPrimary, collapsed = false }) {
  return (
    <NavLink
      to={to}
      end={to === '/app'}
      className={({ isActive }) =>
        [
          `group flex items-center rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
            collapsed ? 'justify-center gap-0' : 'gap-3'
          }`,
          isActive
            ? 'shadow-sm'
            : 'text-slate-600 hover:-translate-y-0.5 hover:bg-white/80 hover:text-slate-900',
        ].join(' ')
      }
      style={({ isActive }) =>
        isActive
          ? {
              background:
                'linear-gradient(135deg, var(--brand-primary-soft) 0%, rgba(255,255,255,0.96) 100%)',
              color: brandPrimary,
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
            }
          : undefined
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-2xl transition ${
              isActive
                ? 'bg-white/90 shadow-sm'
                : 'bg-slate-100 text-slate-500 group-hover:bg-slate-900 group-hover:text-white'
            }`}
          >
            <MenuIcon type={icon} active={isActive} color={brandPrimary} />
          </span>
          <span
            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
              collapsed ? 'max-w-0 opacity-0' : 'max-w-[160px] opacity-100'
            }`}
          >
            {label}
          </span>
          <span
            className={`h-2.5 w-2.5 rounded-full transition ${
              isActive
                ? 'scale-100 opacity-100'
                : 'scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-40'
            } ${collapsed ? 'hidden' : ''}`}
            style={{ backgroundColor: brandPrimary }}
          />
        </>
      )}
    </NavLink>
  )
}

function SidebarSection({
  title,
  children,
  collapsed = false,
  open = true,
  onToggle,
}) {
  return (
    <div className="space-y-2">
      {!collapsed ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 hover:bg-white/70"
        >
          <span>{title}</span>
          <Chevron open={open} />
        </button>
      ) : null}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          collapsed ? 'max-h-[420px] opacity-100' : open ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="space-y-1 pt-0.5">{children}</div>
      </div>
    </div>
  )
}

function SidebarToggleIcon({ collapsed }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function Chevron({ open }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-300 ${open ? 'rotate-90' : ''}`}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export default function AppLayout() {
  const { user, logout, roleCode, branding } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const canAccessAdministration = roleCode === 'ADMIN' || roleCode === 'MANAGER'
  const isAdmin = roleCode === 'ADMIN'

  const brandPrimary = branding?.primaryColor || '#059669'
  const brandSecondary = branding?.secondaryColor || '#0f172a'
  const brandName = branding?.appName || 'Greenlytics'
  const brandLogo = branding?.logoUrl || defaultLogo
  const currentSection = sectionKeyFromPath(location.pathname, canAccessAdministration)
  const [openSections, setOpenSections] = useState(() => ({
    operations: currentSection === 'operations',
      data: currentSection === 'data',
      administration: currentSection === 'administration',
    }))
  const displayUser = user?.username || user?.email || 'Greenlytics'

  useEffect(() => {
    setOpenSections((prev) => ({
      operations: currentSection === 'operations' ? true : prev.operations,
      data: currentSection === 'data' ? true : prev.data,
      administration: currentSection === 'administration' ? true : prev.administration,
    }))
  }, [currentSection])

  const navigation = useMemo(() => {
    const sections = [
      {
        key: 'operations',
        title: t('operations'),
        items: [
          { to: '/app', label: t('dashboard'), icon: 'dashboard' },
          { to: '/app/devices', label: t('sensors'), icon: 'devices' },
          { to: '/app/installations', label: t('installations'), icon: 'installations' },
          { to: '/app/plants', label: t('plants'), icon: 'plants' },
        ],
      },
      {
        key: 'data',
        title: t('data'),
        items: [
          { to: '/app/readings', label: t('readings'), icon: 'readings' },
          { to: '/app/alerts', label: t('alerts'), icon: 'alerts' },
        ],
      },
    ]

    if (canAccessAdministration) {
      sections.push({
        key: 'administration',
        title: t('administration'),
        items: [
          ...(isAdmin ? [{ to: '/app/clients', label: t('clients'), icon: 'clients' }] : []),
          { to: '/app/users', label: t('users'), icon: 'users' },
          { to: '/app/settings', label: t('settings'), icon: 'settings' },
        ],
      })
    }

    return sections
  }, [canAccessAdministration, isAdmin, t])

  function toggleSection(sectionKey) {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }))
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(241,245,249,0.96)_42%,_rgba(226,232,240,0.92)_100%)]">
      <div className="w-full px-3 py-2 md:px-4 lg:px-5">
        <div className="flex flex-col gap-4 lg:flex-row">
          <aside
            className="self-start transition-[width] duration-300 lg:sticky lg:top-2 lg:shrink-0"
            style={{ width: isSidebarCollapsed ? '104px' : '264px' }}
          >
            <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.96)_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur transition-all duration-300">
              <div
                className={`relative overflow-hidden border-b border-slate-200/80 transition-all duration-300 ${
                  isSidebarCollapsed ? 'px-3 pb-3 pt-3' : 'px-4 pb-3 pt-3'
                }`}
                style={{
                  background: `linear-gradient(160deg, ${brandPrimary}18 0%, rgba(255,255,255,0.96) 45%, ${brandSecondary}0d 100%)`,
                }}
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/30 blur-2xl" />
                <div
                  className="absolute bottom-0 right-0 h-24 w-24 rounded-full blur-2xl"
                  style={{ backgroundColor: `${brandPrimary}22` }}
                />
                <div className={`relative flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-white/90 shadow-[0_12px_30px_rgba(15,23,42,0.10)]">
                    <img src={brandLogo} alt={brandName} className="h-8 w-8 rounded-xl object-contain" />
                  </div>
                  <div
                    className={`min-w-0 overflow-hidden transition-all duration-300 ${
                      isSidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[180px] opacity-100'
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Green Intelligence
                    </p>
                    <h2 className="truncate text-[1.3rem] font-semibold tracking-tight" style={{ color: brandSecondary }}>
                      {brandName}
                    </h2>
                  </div>
                </div>
                <div className={`mt-2.5 flex ${isSidebarCollapsed ? 'justify-center' : 'items-center justify-between gap-2'}`}>
                  <div
                    className={`relative overflow-hidden rounded-2xl border border-white/70 bg-white/75 backdrop-blur transition-all duration-300 ${
                      isSidebarCollapsed ? 'max-w-0 border-transparent p-0 opacity-0' : 'max-w-[170px] px-3 py-2.5 opacity-100'
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {t('operations')}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{displayUser}</p>
                    <p className="mt-1 text-xs text-slate-500">{roleCode || '-'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setIsSidebarCollapsed((prev) => !prev)
                    }}
                    className="relative z-20 pointer-events-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-white/95 text-slate-600 shadow-sm hover:text-slate-900"
                    aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    aria-pressed={isSidebarCollapsed}
                    title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  >
                    <SidebarToggleIcon collapsed={isSidebarCollapsed} />
                  </button>
                </div>
              </div>

              <nav className={`space-y-3 px-3 py-3 transition-all duration-300 ${isSidebarCollapsed ? 'px-2' : 'px-3'}`}>
                {navigation.map((section) => (
                  <SidebarSection
                    key={section.key}
                    title={section.title}
                    open={openSections[section.key]}
                    onToggle={() => toggleSection(section.key)}
                    collapsed={isSidebarCollapsed}
                  >
                    {section.items.map((item) => (
                      <SidebarLink
                        key={item.to}
                        to={item.to}
                        label={item.label}
                        icon={item.icon}
                        brandPrimary={brandPrimary}
                        collapsed={isSidebarCollapsed}
                      />
                    ))}
                  </SidebarSection>
                ))}
              </nav>

              <div className={`border-t border-slate-200/80 transition-all duration-300 ${isSidebarCollapsed ? 'p-2' : 'p-3'}`}>
                <button
                  onClick={logout}
                  className={`flex w-full items-center justify-center rounded-2xl text-sm font-medium text-white shadow-[0_18px_35px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 ${
                    isSidebarCollapsed ? 'px-0 py-3' : 'px-4 py-3'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${brandSecondary} 0%, ${brandPrimary} 100%)` }}
                >
                  <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-[120px] opacity-100'}`}>
                    {t('logout')}
                  </span>
                  <span className={`${isSidebarCollapsed ? 'block' : 'hidden'}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <path d="m16 17 5-5-5-5" />
                      <path d="M21 12H9" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <main className="min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
