import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { clientBrandingService } from '../services/clientBrandingService'
import defaultLogo from '../../assets/logo.png'

const INITIAL_FORM = {
  Name: '',
  TradeName: '',
  Website: '',
  Email: '',
  Phone: '',
  AppName: '',
  LogoUrl: '',
  FaviconUrl: '',
  PrimaryColor: '#059669',
  SecondaryColor: '#0f172a',
  Notes: '',
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
    </div>
  )
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
    />
  )
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
    />
  )
}

export default function SettingsPage() {
  const { user, token, refreshCurrentUser, branding } = useAuth()

  const [form, setForm] = useState(INITIAL_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const clientId = user?.client_id

  useEffect(() => {
    async function loadSettings() {
      if (!clientId || !token) return

      setIsLoading(true)
      setError('')
      setSuccess('')

      try {
        const client = await clientBrandingService.getClientById(clientId, token)

        setForm({
          Name: client?.name || '',
          TradeName: client?.trade_name || '',
          Website: client?.website || '',
          Email: client?.email || '',
          Phone: client?.phone || '',
          AppName: client?.app_name || '',
          LogoUrl: client?.logo_url || '',
          FaviconUrl: client?.favicon_url || '',
          PrimaryColor: client?.primary_color || '#059669',
          SecondaryColor: client?.secondary_color || '#0f172a',
          Notes: client?.notes || '',
        })
      } catch (err) {
        setError(err.message || 'No s’ha pogut carregar la configuració.')
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [clientId, token])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!clientId || !token) return

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await clientBrandingService.updateClient(
        clientId,
        {
          Name: form.Name,
          TradeName: form.TradeName,
          Website: form.Website,
          Email: form.Email,
          Phone: form.Phone,
          AppName: form.AppName,
          LogoUrl: form.LogoUrl,
          FaviconUrl: form.FaviconUrl,
          PrimaryColor: form.PrimaryColor,
          SecondaryColor: form.SecondaryColor,
          Notes: form.Notes,
          ModifiedBy: user?.username || user?.email || 'system',
        },
        token
      )

      await refreshCurrentUser()

      setSuccess('Configuració desada correctament.')
    } catch (err) {
      setError(err.message || 'No s’ha pogut desar la configuració.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleResetBranding() {
    setForm((prev) => ({
      ...prev,
      AppName: '',
      LogoUrl: '',
      FaviconUrl: '',
      PrimaryColor: '#059669',
      SecondaryColor: '#0f172a',
    }))
    setSuccess('')
    setError('')
  }

  const preview = useMemo(() => {
    return {
      appName: form.AppName || form.TradeName || form.Name || 'Greenlytics',
      logoUrl: form.LogoUrl || defaultLogo,
      faviconUrl: form.FaviconUrl || '',
      primaryColor: form.PrimaryColor || '#059669',
      secondaryColor: form.SecondaryColor || '#0f172a',
    }
  }, [form])

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Carregant configuració...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-emerald-600">Administració</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          Configuració del client
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Personalitza el branding bàsic de l’aplicació perquè el client la senti
          com a pròpia.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Dades bàsiques del client
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Camps principals de la taula de clients visibles a l’aplicació.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Nom legal">
                <TextInput
                  name="Name"
                  value={form.Name}
                  onChange={handleChange}
                  placeholder="Nom legal del client"
                />
              </Field>

              <Field label="Nom comercial">
                <TextInput
                  name="TradeName"
                  value={form.TradeName}
                  onChange={handleChange}
                  placeholder="Nom comercial"
                />
              </Field>

              <Field label="Website">
                <TextInput
                  name="Website"
                  value={form.Website}
                  onChange={handleChange}
                  placeholder="https://empresa.com"
                />
              </Field>

              <Field label="Email">
                <TextInput
                  name="Email"
                  type="email"
                  value={form.Email}
                  onChange={handleChange}
                  placeholder="info@empresa.com"
                />
              </Field>

              <Field label="Telèfon">
                <TextInput
                  name="Phone"
                  value={form.Phone}
                  onChange={handleChange}
                  placeholder="+34 600000000"
                />
              </Field>

              <Field label="Nom de l’aplicació">
                <TextInput
                  name="AppName"
                  value={form.AppName}
                  onChange={handleChange}
                  placeholder="Ex. Agro Monitor"
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Notes">
                <TextArea
                  name="Notes"
                  value={form.Notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Notes internes del client"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Branding MVP
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Personalització visual bàsica: logo, favicon i colors corporatius.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4">
              <Field
                label="Logo URL"
                hint="URL pública de la imatge que es mostrarà al header i login."
              >
                <TextInput
                  name="LogoUrl"
                  value={form.LogoUrl}
                  onChange={handleChange}
                  placeholder="https://empresa.com/logo.png"
                />
              </Field>

              <Field
                label="Favicon URL"
                hint="URL pública de la icona del navegador."
              >
                <TextInput
                  name="FaviconUrl"
                  value={form.FaviconUrl}
                  onChange={handleChange}
                  placeholder="https://empresa.com/favicon.ico"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Color primari">
                  <div className="flex items-center gap-3">
                    <input
                      name="PrimaryColor"
                      type="color"
                      value={form.PrimaryColor}
                      onChange={handleChange}
                      className="h-12 w-16 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                    />
                    <TextInput
                      name="PrimaryColor"
                      value={form.PrimaryColor}
                      onChange={handleChange}
                      placeholder="#059669"
                    />
                  </div>
                </Field>

                <Field label="Color secundari">
                  <div className="flex items-center gap-3">
                    <input
                      name="SecondaryColor"
                      type="color"
                      value={form.SecondaryColor}
                      onChange={handleChange}
                      className="h-12 w-16 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                    />
                    <TextInput
                      name="SecondaryColor"
                      value={form.SecondaryColor}
                      onChange={handleChange}
                      placeholder="#0f172a"
                    />
                  </div>
                </Field>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleResetBranding}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Restaurar branding MVP
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {isSaving ? 'Desant...' : 'Desar configuració'}
              </button>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mt-4 rounded-xl border px-4 py-3 text-sm" style={{
                borderColor: 'var(--brand-primary-soft-strong)',
                backgroundColor: 'var(--brand-primary-soft)',
                color: 'var(--brand-primary)',
              }}>
                {success}
              </div>
            ) : null}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Preview del branding
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Vista ràpida de com es veurà l’app.
            </p>

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
              <div className="flex items-center justify-between bg-white px-4 py-3">
                <div className="flex items-center gap-3">
                  <img
                    src={preview.logoUrl}
                    alt={preview.appName}
                    className="h-10 w-10 rounded-xl object-contain"
                  />
                  <span
                    className="text-lg font-semibold"
                    style={{ color: preview.primaryColor }}
                  >
                    {preview.appName}
                  </span>
                </div>

                <button
                  type="button"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: preview.secondaryColor }}
                >
                  Logout
                </button>
              </div>

              <div className="grid grid-cols-[180px_1fr] border-t border-slate-200">
                <div className="bg-slate-50 p-4">
                  <div className="space-y-2">
                    <div
                      className="rounded-xl px-3 py-2 text-sm font-medium"
                      style={{
                        backgroundColor: `${preview.primaryColor}20`,
                        color: preview.primaryColor,
                      }}
                    >
                      Dashboard
                    </div>
                    <div className="rounded-xl px-3 py-2 text-sm text-slate-600">
                      Devices
                    </div>
                    <div className="rounded-xl px-3 py-2 text-sm text-slate-600">
                      Plants
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-sm text-slate-500">Exemple</div>
                    <div className="mt-2 text-xl font-semibold text-slate-900">
                      {preview.appName}
                    </div>
                    <div
                      className="mt-4 h-3 rounded-full"
                      style={{ backgroundColor: preview.primaryColor }}
                    />
                    <div
                      className="mt-3 h-3 w-2/3 rounded-full"
                      style={{ backgroundColor: preview.secondaryColor }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Branding actual carregat
            </h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-800">App name:</span>{' '}
                {branding?.appName || 'Greenlytics'}
              </p>
              <p>
                <span className="font-medium text-slate-800">Primary:</span>{' '}
                {branding?.primaryColor || '#059669'}
              </p>
              <p>
                <span className="font-medium text-slate-800">Secondary:</span>{' '}
                {branding?.secondaryColor || '#0f172a'}
              </p>
            </div>
          </section>
        </div>
      </form>
    </div>
  )
}