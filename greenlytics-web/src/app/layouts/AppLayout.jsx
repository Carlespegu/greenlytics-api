import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function menuClassName({ isActive }) {
  return [
    'block rounded-xl px-3 py-2 text-sm font-medium',
    isActive
      ? 'bg-emerald-100 text-emerald-800'
      : 'text-slate-700 hover:bg-slate-100',
  ].join(' ')
}

export default function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-semibold text-emerald-700">
            Greenlytics
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600">
            {user?.email || user?.username || 'Sessió iniciada'}
            </div>
            <button
              onClick={logout}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <nav className="space-y-2">
            <NavLink to="/" end className={menuClassName}>
              Dashboard
            </NavLink>
            <NavLink to="/devices" className={menuClassName}>
              Devices
            </NavLink>
            <NavLink to="/installations" className={menuClassName}>
              Installations
            </NavLink>
            <NavLink to="/plants" className={menuClassName}>
              Plants
            </NavLink>
          </nav>
        </aside>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  )
}