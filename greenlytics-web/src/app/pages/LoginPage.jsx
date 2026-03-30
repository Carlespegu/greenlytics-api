import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SunLoader from '../components/SunLoader'
import defaultLogo from '../../assets/logo.png'

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
      <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a13.16 13.16 0 0 1-4.09 4.95" />
      <path d="M6.61 6.61C4.06 8.29 2.5 12 2.5 12a13.2 13.2 0 0 0 7.44 6.16" />
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isLoading, branding } = useAuth()

  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      await login(form)
      const redirectTo = location.state?.from?.pathname || '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'No s’ha pogut iniciar sessió.')
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const brandPrimary = branding?.primaryColor || '#059669'
  const brandName = branding?.appName || 'Greenlytics'
  const brandLogo = branding?.logoUrl || defaultLogo

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: `linear-gradient(135deg, var(--brand-primary-soft) 0%, #f1f5f9 100%)`,
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur">
        <div className="mb-8 text-center">
          <img
            src={brandLogo}
            alt={brandName}
            className="mx-auto h-28 w-auto object-contain"
          />

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            {brandName}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Smart plant monitoring platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email / Username
            </label>
            <input
              name="email"
              type="text"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition"
              style={{
                boxShadow: 'none',
              }}
              placeholder="usuari o email"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>

            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-14 outline-none transition"
                placeholder="********"
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-500 transition hover:text-slate-700"
                aria-label={showPassword ? 'Amagar password' : 'Mostrar password'}
                title={showPassword ? 'Amagar password' : 'Mostrar password'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                border: `1px solid var(--brand-primary-soft-strong)`,
                backgroundColor: 'var(--brand-primary-soft)',
                color: brandPrimary,
              }}
            >
              Introdueix el teu usuari i contrasenya per accedir.
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundColor: brandPrimary }}
          >
            {isLoading ? (
              <>
                <SunLoader size={18} />
                <span>Entrant...</span>
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}