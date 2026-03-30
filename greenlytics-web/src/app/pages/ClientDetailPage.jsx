import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { clientsService } from '../services/clientsService'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
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
  ClientType: 'DEMO',
  Notes: '',
  ExternalId: '',
  ApiSecret: '',
  AppName: '',
  LogoUrl: '',
  FaviconUrl: '',
  PrimaryColor: '#059669',
  SecondaryColor: '#0f172a',
}

function Field({ label, children, hint, required = false }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
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

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">{value || '-'}</span>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-xl px-4 py-2 text-sm font-medium transition',
        active
          ? 'text-white'
          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
      ].join(' ')}
      style={active ? { backgroundColor: 'var(--brand-primary)' } : undefined}
    >
      {children}
    </button>
  )
}

export default function ClientDetailPage() {
  const navigate = useNavigate()
  const { clientId } = useParams()
  const { user } = useAuth()
  const { t } = useLanguage()

  const isNew = !clientId
  const [activeTab, setActiveTab] = useState('general')

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
          ClientType: client.client_type || 'DEMO',
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
        setError(err.message || t('clientLoadError'))
      } finally {
        setIsLoading(false)
      }
    }

    loadClient()
  }, [clientId, isNew, t])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  function validateForm() {
    if (!form.Name.trim()) return t('clientValidationLegalName')
    if (!form.TradeName.trim()) return t('clientValidationTradeName')
    if (!form.TaxId.trim()) return t('clientValidationTaxId')
    if (!form.Email.trim()) return t('clientValidationEmail')
    if (!form.Phone.trim()) return t('clientValidationPhone')
    if (!form.ClientType.trim()) return t('clientValidationClientType')
    if (isNew && !form.ApiSecret.trim()) return t('clientValidationApiSecret')
    return ''
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      if (isNew) {
        await clientsService.createClient({
          Name: form.Name.trim(),
          TradeName: form.TradeName.trim(),
          TaxId: form.TaxId.trim(),
          Email: form.Email.trim(),
          Phone: form.Phone.trim(),
          Website: form.Website.trim(),
          Address: form.Address.trim(),
          City: form.City.trim(),
          State: form.State.trim(),
          PostalCode: form.PostalCode.trim(),
          Country: form.Country.trim(),
          IsActive: form.IsActive,
          ClientType: form.ClientType.trim() || 'DEMO',
          Notes: form.Notes.trim(),
          ExternalId: form.ExternalId.trim(),
          ApiSecret: form.ApiSecret.trim(),
          AppName: form.AppName.trim(),
          LogoUrl: form.LogoUrl.trim(),
          FaviconUrl: form.FaviconUrl.trim(),
          PrimaryColor: form.PrimaryColor,
          SecondaryColor: form.SecondaryColor,
          CreatedBy: user?.username || user?.email || 'system',
        })

        navigate('/clients')
        return
      }

      await clientsService.updateClient(clientId, {
        Name: form.Name.trim(),
        TradeName: form.TradeName.trim(),
        TaxId: form.TaxId.trim(),
        Email: form.Email.trim(),
        Phone: form.Phone.trim(),
        Website: form.Website.trim(),
        Address: form.Address.trim(),
        City: form.City.trim(),
        State: form.State.trim(),
        PostalCode: form.PostalCode.trim(),
        Country: form.Country.trim(),
        IsActive: form.IsActive,
        ClientType: form.ClientType.trim() || 'DEMO',
        Notes: form.Notes.trim(),
        ExternalId: form.ExternalId.trim(),
        AppName: form.AppName.trim(),
        LogoUrl: form.LogoUrl.trim(),
        FaviconUrl: form.FaviconUrl.trim(),
        PrimaryColor: form.PrimaryColor,
        SecondaryColor: form.SecondaryColor,
        ModifiedBy: user?.username || user?.email || 'system',
      })

      setSuccess(t('clientSavedSuccess'))
    } catch (err) {
      setError(err.message || t('clientSaveError'))
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
        <p className="text-sm text-slate-500">{t('loadingClient')}</p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600">{t('administration')}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {isNew ? t('newClient') : t('clientDetail')}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isNew ? t('newClientDescription') : t('clientDetailDescription')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('backToList')}
          </button>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <TabButton
                active={activeTab === 'general'}
                onClick={() => setActiveTab('general')}
              >
                {t('clientTabGeneral')}
              </TabButton>

              <TabButton
                active={activeTab === 'branding'}
                onClick={() => setActiveTab('branding')}
              >
                {t('clientTabBranding')}
              </TabButton>

              <TabButton
                active={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
              >
                {t('clientTabUsers')}
              </TabButton>
            </div>
          </section>

          {activeTab === 'general' && (
            <>
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  {t('clientGeneralInfo')}
                </h2>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label={t('code')}
                    hint={isNew ? t('clientCodeAutoHint') : null}
                  >
                    <TextInput
                      name="Code"
                      value={isNew ? t('automatic') : form.Code}
                      disabled
                      placeholder={t('automatic')}
                    />
                  </Field>

                  <Field label={t('legalName')} required>
                    <TextInput
                      name="Name"
                      value={form.Name}
                      onChange={handleChange}
                      placeholder={t('legalName')}
                      required
                    />
                  </Field>

                  <Field label={t('tradeName')} required>
                    <TextInput
                      name="TradeName"
                      value={form.TradeName}
                      onChange={handleChange}
                      placeholder={t('tradeName')}
                      required
                    />
                  </Field>

                  <Field label={t('taxId')} required>
                    <TextInput
                      name="TaxId"
                      value={form.TaxId}
                      onChange={handleChange}
                      placeholder={t('taxIdPlaceholder')}
                      required
                    />
                  </Field>

                  <Field label={t('email')} required>
                    <TextInput
                      name="Email"
                      type="email"
                      value={form.Email}
                      onChange={handleChange}
                      placeholder="email@empresa.com"
                      required
                    />
                  </Field>

                  <Field label={t('phone')} required>
                    <TextInput
                      name="Phone"
                      value={form.Phone}
                      onChange={handleChange}
                      placeholder="+34 600000000"
                      required
                    />
                  </Field>

                  <Field label={t('clientType')} required>
                    <select
                      name="ClientType"
                      value={form.ClientType}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                      required
                    >
                      <option value="DEMO">DEMO</option>
                      <option value="PREMIUM">PREMIUM</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </Field>

                  <Field label={t('active')}>
                    <label className="flex h-[50px] items-center gap-3 rounded-xl border border-slate-300 px-4">
                      <input
                        type="checkbox"
                        name="IsActive"
                        checked={form.IsActive}
                        onChange={handleChange}
                      />
                      <span className="text-sm text-slate-700">{t('activeClient')}</span>
                    </label>
                  </Field>

                  {isNew && (
                    <Field
                      label={t('apiSecret')}
                      hint={t('apiSecretCreateOnly')}
                      required
                    >
                      <TextInput
                        name="ApiSecret"
                        value={form.ApiSecret}
                        onChange={handleChange}
                        placeholder={t('apiSecretPlaceholder')}
                        required
                      />
                    </Field>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  {t('clientAdditionalInfo')}
                </h2>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label={t('website')}>
                    <TextInput
                      name="Website"
                      value={form.Website}
                      onChange={handleChange}
                      placeholder="https://empresa.com"
                    />
                  </Field>

                  <Field label={t('externalId')}>
                    <TextInput
                      name="ExternalId"
                      value={form.ExternalId}
                      onChange={handleChange}
                      placeholder={t('externalId')}
                    />
                  </Field>

                  <Field label={t('address')}>
                    <TextInput
                      name="Address"
                      value={form.Address}
                      onChange={handleChange}
                      placeholder={t('address')}
                    />
                  </Field>

                  <Field label={t('city')}>
                    <TextInput
                      name="City"
                      value={form.City}
                      onChange={handleChange}
                      placeholder={t('city')}
                    />
                  </Field>

                  <Field label={t('stateProvince')}>
                    <TextInput
                      name="State"
                      value={form.State}
                      onChange={handleChange}
                      placeholder={t('stateProvince')}
                    />
                  </Field>

                  <Field label={t('postalCode')}>
                    <TextInput
                      name="PostalCode"
                      value={form.PostalCode}
                      onChange={handleChange}
                      placeholder={t('postalCode')}
                    />
                  </Field>

                  <Field label={t('country')}>
                    <TextInput
                      name="Country"
                      value={form.Country}
                      onChange={handleChange}
                      placeholder={t('country')}
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <Field label={t('notes')}>
                    <TextArea
                      name="Notes"
                      value={form.Notes}
                      onChange={handleChange}
                      rows={4}
                      placeholder={t('notes')}
                    />
                  </Field>
                </div>
              </section>
            </>
          )}

          {activeTab === 'branding' && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                {t('clientBrandingMvp')}
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-4">
                <Field label={t('appName')}>
                  <TextInput
                    name="AppName"
                    value={form.AppName}
                    onChange={handleChange}
                    placeholder={t('appNamePlaceholder')}
                  />
                </Field>

                <Field label={t('logoUrl')}>
                  <TextInput
                    name="LogoUrl"
                    value={form.LogoUrl}
                    onChange={handleChange}
                    placeholder="https://empresa.com/logo.png"
                  />
                </Field>

                <Field label={t('faviconUrl')}>
                  <TextInput
                    name="FaviconUrl"
                    value={form.FaviconUrl}
                    onChange={handleChange}
                    placeholder="https://empresa.com/favicon.ico"
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label={t('primaryColor')}>
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

                  <Field label={t('secondaryColor')}>
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
          )}

          {activeTab === 'users' && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                {t('clientUsersTitle')}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {t('clientUsersPlaceholder')}
              </p>
            </section>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {isSaving
                  ? t('saving')
                  : isNew
                  ? t('createClient')
                  : t('saveChanges')}
              </button>

              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t('cancel')}
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

        <div className="self-start xl:sticky xl:top-6">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <img
                  src={preview.logoUrl}
                  alt={preview.appName}
                  className="h-16 w-16 rounded-2xl object-contain"
                />
                <div>
                  <p className="text-sm text-slate-500">
                    {isNew ? t('newClient') : t('client')}
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {form.TradeName || form.Name || t('unnamed')}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {form.Email || t('noEmail')}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-100">
                <SummaryRow label={t('code')} value={isNew ? t('automatic') : form.Code} />
                <SummaryRow label={t('taxId')} value={form.TaxId} />
                <SummaryRow label={t('phone')} value={form.Phone} />
                <SummaryRow label={t('clientType')} value={form.ClientType} />
                <SummaryRow label={t('active')} value={form.IsActive ? t('yes') : t('no')} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                {t('brandPreview')}
              </h3>

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

                <div className="grid grid-cols-[160px_1fr] border-t border-slate-200">
                  <div className="bg-slate-50 p-4">
                    <div
                      className="rounded-xl px-3 py-2 text-sm font-medium"
                      style={{
                        backgroundColor: `${preview.primaryColor}20`,
                        color: preview.primaryColor,
                      }}
                    >
                      {t('dashboard')}
                    </div>
                  </div>

                  <div className="bg-white p-4">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="text-sm text-slate-500">{t('example')}</div>
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
        </div>
      </form>
    </div>
  )
}