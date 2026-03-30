import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { clientsService } from '../services/clientsService'
import { useAuth } from '../context/AuthContext'
import defaultLogo from '../../assets/logo.png'

const EMPTY_FORM = {
  Code: '',
  Name: '',
  TradeName: '',
  TaxId: '',
  Email: '',
  Phone: '',
  Website: '',
  Address: '',
  City: '',
  State: '',
  PostalCode: '',
  Country: '',
  IsActive: true,
  ClientType: '',
  Notes: '',
  ExternalId: '',
  ApiSecret: '',
  AppName: '',
  LogoUrl: '',
  FaviconUrl: '',
  PrimaryColor: '#059669',
  SecondaryColor: '#0f172a',
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

export default function ClientDetailPage() {
  const navigate = useNavigate()
  const { clientId } = useParams()
  const { user } = useAuth()

  const isNew = clientId === 'new'

  const [form, setForm] = useState(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(!isNew)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (isNew) return

    async function loadClient() {
      setIsLoading(true)
      setError('')

      try {
        const client = await clientsService.getClientById(clientId)

        setForm({
          Code: client.code || '',
          Name: client.name || '',
          TradeName: client.trade_name || '',
          TaxId: client.tax_id || '',
          Email: client.email || '',
          Phone: client.phone || '',
          Website: client.website || '',
          Address: client.address || '',
          City: client.city || '',
          State: client.state || '',
          PostalCode: client.postal_code || '',
          Country: client.country || '',
          IsActive: Boolean(client.is_active),
          ClientType: client.client_type || '',
          Notes: client.notes || '',
          ExternalId: client.external_id || '',
          ApiSecret: '',
          AppName: client.app_name || '',
          LogoUrl: client.logo_url || '',
          FaviconUrl: client.favicon_url || '',
          PrimaryColor: client.primary_color || '#059669',
          SecondaryColor: client.secondary_color || '#0f172a',
        })
      } catch (err) {
        setError(err.message || 'No s’ha pogut carregar el client.')
      } finally {
        setIsLoading(false)
      }
    }

    loadClient()
  }, [clientId, isNew])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      if (isNew) {
        await clientsService.createClient({
          ...form,
          CreatedBy: user?.username || user?.email || 'system',
        })
        navigate('/clients')
        return
      }

      await clientsService.updateClient(clientId, {
        Name: form.Name,
        TradeName: form.TradeName,
        TaxId: form.TaxId,
        Email: form.Email,
        Phone: form.Phone,
        Website: form.Website,
        Address: form.Address,
        City: form.City,
        State: form.State,
        PostalCode: form.PostalCode,
        Country: form.Country,
        IsActive: form.IsActive,
        ClientType: form.ClientType,
        Notes: form.Notes,
        ExternalId: form.ExternalId,
        AppName: form.AppName,
        LogoUrl: form.LogoUrl,
        FaviconUrl: form.FaviconUrl,
        PrimaryColor: form.PrimaryColor,
        SecondaryColor: form.SecondaryColor,
        ModifiedBy: user?.username || user?.email || 'system',
      })

      setSuccess('Client actualitzat correctament.')
    } catch (err) {
      setError(err.message || 'No s’ha pogut desar el client.')
    } finally {
      setIsSaving(false)
    }
  }

  const preview = useMemo(() => {
    return {
      appName: form.AppName || form.TradeName || form.Name || 'Greenlytics',
      logoUrl: form.LogoUrl || defaultLogo,
      primaryColor: form.PrimaryColor || '#059669',
      secondaryColor: form.SecondaryColor || '#0f172a',
    }
  }, [form])

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Carregant client...</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600">Administració</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {isNew ? 'Nou client' : 'Detall de client'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isNew
                ? 'Crea un nou client de la plataforma.'
                : 'Consulta i actualitza la informació del client.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Tornar al llistat
          </button>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Dades principals</h2>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Codi">
                <TextInput
                  name="Code"
                  value={form.Code}
                  onChange={handleChange}
                  disabled={!isNew}
                  placeholder="Ex. CLIENT_001"
                />
              </Field>

              <Field label="Nom legal">
                <TextInput
                  name="Name"
                  value={form.Name}
                  onChange={handleChange}
                  placeholder="Nom legal"
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

              <Field label="Tax ID">
                <TextInput
                  name="TaxId"
                  value={form.TaxId}
                  onChange={handleChange}
                  placeholder="NIF / CIF"
                />
              </Field>

              <Field label="Email">
                <TextInput
                  name="Email"
                  type="email"
                  value={form.Email}
                  onChange={handleChange}
                  placeholder="email@empresa.com"
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

              <Field label="Website">
                <TextInput
                  name="Website"
                  value={form.Website}
                  onChange={handleChange}
                  placeholder="https://empresa.com"
                />
              </Field>

              <Field label="Tipus client">
                <TextInput
                  name="ClientType"
                  value={form.ClientType}
                  onChange={handleChange}
                  placeholder="DEMO / PREMIUM / ENTERPRISE"
                />
              </Field>

              <Field label="External ID">
                <TextInput
                  name="ExternalId"
                  value={form.ExternalId}
                  onChange={handleChange}
                  placeholder="External ID"
                />
              </Field>

              <Field label="Actiu">
                <label className="flex h-[50px] items-center gap-3 rounded-xl border border-slate-300 px-4">
                  <input
                    type="checkbox"
                    name="IsActive"
                    checked={form.IsActive}
                    onChange={handleChange}
                  />
                  <span className="text-sm text-slate-700">Client actiu</span>
                </label>
              </Field>

              {isNew && (
                <Field
                  label="Api secret"
                  hint="Només s’informa a l’alta del client."
                >
                  <TextInput
                    name="ApiSecret"
                    value={form.ApiSecret}
                    onChange={handleChange}
                    placeholder="Secret per generar hash"
                  />
                </Field>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Address">
                <TextInput
                  name="Address"
                  value={form.Address}
                  onChange={handleChange}
                  placeholder="Adreça"
                />
              </Field>

              <Field label="Ciutat">
                <TextInput
                  name="City"
                  value={form.City}
                  onChange={handleChange}
                  placeholder="Ciutat"
                />
              </Field>

              <Field label="Província / Estat">
                <TextInput
                  name="State"
                  value={form.State}
                  onChange={handleChange}
                  placeholder="Província o estat"
                />
              </Field>

              <Field label="Codi postal">
                <TextInput
                  name="PostalCode"
                  value={form.PostalCode}
                  onChange={handleChange}
                  placeholder="08201"
                />
              </Field>

              <Field label="País">
                <TextInput
                  name="Country"
                  value={form.Country}
                  onChange={handleChange}
                  placeholder="Spain"
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
                  placeholder="Notes del client"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Branding MVP</h2>

            <div className="mt-6 grid grid-cols-1 gap-4">
              <Field label="Nom de l’aplicació">
                <TextInput
                  name="AppName"
                  value={form.AppName}
                  onChange={handleChange}
                  placeholder="Ex. Agro Monitor"
                />
              </Field>

              <Field label="Logo URL">
                <TextInput
                  name="LogoUrl"
                  value={form.LogoUrl}
                  onChange={handleChange}
                  placeholder="https://empresa.com/logo.png"
                />
              </Field>

              <Field label="Favicon URL">
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
                      type="color"
                      name="PrimaryColor"
                      value={form.PrimaryColor}
                      onChange={handleChange}
                      className="h-12 w-16 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                    />
                    <TextInput
                      name="PrimaryColor"
                      value={form.PrimaryColor}
                      onChange={handleChange}
                    />
                  </div>
                </Field>

                <Field label="Color secundari">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      name="SecondaryColor"
                      value={form.SecondaryColor}
                      onChange={handleChange}
                      className="h-12 w-16 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
                    />
                    <TextInput
                      name="SecondaryColor"
                      value={form.SecondaryColor}
                      onChange={handleChange}
                    />
                  </div>
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {isSaving
                  ? 'Desant...'
                  : isNew
                  ? 'Crear client'
                  : 'Desar canvis'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel·lar
              </button>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div
                className="mt-4 rounded-xl border px-4 py-3 text-sm"
                style={{
                  borderColor: 'var(--brand-primary-soft-strong)',
                  backgroundColor: 'var(--brand-primary-soft)',
                  color: 'var(--brand-primary)',
                }}
              >
                {success}
              </div>
            ) : null}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Preview</h2>

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
                  <div
                    className="rounded-xl px-3 py-2 text-sm font-medium"
                    style={{
                      backgroundColor: `${preview.primaryColor}20`,
                      color: preview.primaryColor,
                    }}
                  >
                    Dashboard
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
        </div>
      </form>
    </div>
  )
}