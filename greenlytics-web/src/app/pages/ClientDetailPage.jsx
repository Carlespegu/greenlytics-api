import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { clientsService } from '../services/clientsService'
import { usersService } from '../services/usersService'
import { rolesService } from '../services/rolesService'
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

const EMPTY_USER_FORM = {
  id: null,
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  role_id: '',
  is_active: true,
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
        active ? 'text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
      ].join(' ')}
      style={active ? { backgroundColor: 'var(--brand-primary)' } : undefined}
    >
      {children}
    </button>
  )
}

function UserModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
  error,
  form,
  setForm,
  roles,
  isEdit,
  t,
}) {
  if (!isOpen) return null

  function getRoleLabel(role) {
    const code = String(role?.code || '').trim().toUpperCase()
    if (code === 'ADMIN') return t('roleAdmin')
    if (code === 'MANAGER') return t('roleManager')
    if (code === 'VIEWER') return t('roleViewer')
    return role?.name || role?.code || t('role')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-semibold text-slate-900">
            {isEdit ? t('editUser') : t('newUser')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('close')}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label={t('username')} required>
            <TextInput
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              placeholder={t('username')}
            />
          </Field>

          <Field label={t('email')} required>
            <TextInput
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="user@company.com"
            />
          </Field>

          <Field label={t('firstName')} required>
            <TextInput
              value={form.first_name}
              onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
              placeholder={t('firstName')}
            />
          </Field>

          <Field label={t('lastName')}>
            <TextInput
              value={form.last_name}
              onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
              placeholder={t('lastName')}
            />
          </Field>

          <Field label={t('role')} required>
            <select
              value={String(form.role_id || '')}
              onChange={(e) => setForm((prev) => ({ ...prev, role_id: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="">{t('role')}</option>
              {roles.map((role) => (
                <option key={String(role.id)} value={String(role.id)}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('password')} required={!isEdit} hint={isEdit ? t('passwordEditHint') : undefined}>
            <TextInput
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="********"
            />
          </Field>

          <Field label={t('active')}>
            <label className="flex h-[50px] items-center gap-3 rounded-xl border border-slate-300 px-4">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
              />
              <span className="text-sm text-slate-700">{t('activeUser')}</span>
            </label>
          </Field>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            {isSaving ? t('saving') : isEdit ? t('saveUser') : t('createUser')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
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

  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userSaveError, setUserSaveError] = useState('')
  const [userSaving, setUserSaving] = useState(false)
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM)

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

  useEffect(() => {
    if (activeTab !== 'users' || isNew) return

    async function loadUsersAndRoles() {
      setUsersLoading(true)
      setUserSaveError('')
      try {
        const [loadedUsers, loadedRoles] = await Promise.all([
          usersService.listUsersByClient(clientId),
          rolesService.listAssignableClientRoles(),
        ])
        setUsers(loadedUsers || [])
        setRoles(loadedRoles || [])
      } catch (err) {
        setUserSaveError(err.message || t('userLoadError'))
      } finally {
        setUsersLoading(false)
      }
    }

    loadUsersAndRoles()
  }, [activeTab, clientId, isNew, t])

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  function validateClientForm() {
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
    const validationError = validateClientForm()
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
        navigate('/app/clients', { state: { refresh: Date.now() } })
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

  function openNewUserModal() {
    setUserSaveError('')
    setUserForm(EMPTY_USER_FORM)
    setUserModalOpen(true)
  }

function openEditUserModal(item) {
    setUserSaveError('')
    setUserForm({
      id: item.id,
      username: item.username || '',
      email: item.email || '',
      first_name: item.first_name || '',
      last_name: item.last_name || '',
      password: '',
      role_id: String(item.role_id || ''),
      is_active: Boolean(item.is_active),
    })
    setUserModalOpen(true)
  }

  function validateUserForm() {
    if (!userForm.username.trim()) return t('validationUsernameRequired')
    if (!userForm.email.trim()) return t('validationUserEmailRequired')
    if (!userForm.first_name.trim()) return t('validationFirstNameRequired')
    if (!userForm.role_id) return t('validationRoleRequired')
    if (!userForm.id && !userForm.password.trim()) return t('validationPasswordRequired')
    return ''
  }

  async function reloadUsers() {
    const loadedUsers = await usersService.listUsersByClient(clientId)
    setUsers(loadedUsers || [])
  }

  async function handleSaveUser() {
    const validationError = validateUserForm()
    if (validationError) {
      setUserSaveError(validationError)
      return
    }

    setUserSaving(true)
    setUserSaveError('')

    try {
      if (!userForm.id) {
        await usersService.createUser({
          username: userForm.username.trim(),
          email: userForm.email.trim(),
          password: userForm.password.trim(),
          client_id: clientId,
          role_id: String(userForm.role_id).trim(),
          first_name: userForm.first_name.trim(),
          last_name: userForm.last_name.trim() || null,
          is_active: userForm.is_active,
        })
      } else {
        await usersService.updateUser(userForm.id, {
          username: userForm.username.trim(),
          email: userForm.email.trim(),
          password: userForm.password.trim() || undefined,
          role_id: String(userForm.role_id).trim(),
          first_name: userForm.first_name.trim(),
          last_name: userForm.last_name.trim() || null,
          is_active: userForm.is_active,
        })
      }

      await reloadUsers()
      setUserModalOpen(false)
      setUserForm(EMPTY_USER_FORM)
      setSuccess(t('userSavedSuccess'))
    } catch (err) {
      setUserSaveError(err.message || t('userSaveError'))
    } finally {
      setUserSaving(false)
    }
  }

  const preview = useMemo(() => ({
    appName: form.AppName || form.TradeName || form.Name || 'Greenlytics',
    logoUrl: form.LogoUrl || defaultLogo,
    primaryColor: form.PrimaryColor || '#059669',
    secondaryColor: form.SecondaryColor || '#0f172a',
  }), [form])

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
            onClick={() => navigate('/app/clients', { state: { refresh: Date.now() } })}
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
              <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
                {t('clientTabGeneral')}
              </TabButton>
              <TabButton active={activeTab === 'branding'} onClick={() => setActiveTab('branding')}>
                {t('clientTabBranding')}
              </TabButton>
              <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
                {t('clientTabUsers')}
              </TabButton>
            </div>
          </section>

          {activeTab === 'general' && (
            <>
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">{t('clientGeneralInfo')}</h2>
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label={t('code')} hint={isNew ? t('clientCodeAutoHint') : null}>
                    <TextInput name="Code" value={isNew ? t('automatic') : form.Code} disabled />
                  </Field>
                  <Field label={t('legalName')} required><TextInput name="Name" value={form.Name} onChange={handleChange} required /></Field>
                  <Field label={t('tradeName')} required><TextInput name="TradeName" value={form.TradeName} onChange={handleChange} required /></Field>
                  <Field label={t('taxId')} required><TextInput name="TaxId" value={form.TaxId} onChange={handleChange} required /></Field>
                  <Field label={t('email')} required><TextInput name="Email" type="email" value={form.Email} onChange={handleChange} required /></Field>
                  <Field label={t('phone')} required><TextInput name="Phone" value={form.Phone} onChange={handleChange} required /></Field>
                  <Field label={t('clientType')} required>
                    <select name="ClientType" value={form.ClientType} onChange={handleChange} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400" required>
                      <option value="DEMO">DEMO</option>
                      <option value="PREMIUM">PREMIUM</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </Field>
                  <Field label={t('active')}>
                    <label className="flex h-[50px] items-center gap-3 rounded-xl border border-slate-300 px-4">
                      <input type="checkbox" name="IsActive" checked={form.IsActive} onChange={handleChange} />
                      <span className="text-sm text-slate-700">{t('activeClient')}</span>
                    </label>
                  </Field>
                  {isNew && (
                    <Field label={t('apiSecret')} hint={t('apiSecretCreateOnly')} required>
                      <TextInput name="ApiSecret" value={form.ApiSecret} onChange={handleChange} required />
                    </Field>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">{t('clientAdditionalInfo')}</h2>
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label={t('website')}><TextInput name="Website" value={form.Website} onChange={handleChange} /></Field>
                  <Field label={t('externalId')}><TextInput name="ExternalId" value={form.ExternalId} onChange={handleChange} /></Field>
                  <Field label={t('address')}><TextInput name="Address" value={form.Address} onChange={handleChange} /></Field>
                  <Field label={t('city')}><TextInput name="City" value={form.City} onChange={handleChange} /></Field>
                  <Field label={t('stateProvince')}><TextInput name="State" value={form.State} onChange={handleChange} /></Field>
                  <Field label={t('postalCode')}><TextInput name="PostalCode" value={form.PostalCode} onChange={handleChange} /></Field>
                  <Field label={t('country')}><TextInput name="Country" value={form.Country} onChange={handleChange} /></Field>
                </div>
                <div className="mt-4">
                  <Field label={t('notes')}><TextArea name="Notes" value={form.Notes} onChange={handleChange} rows={4} /></Field>
                </div>
              </section>
            </>
          )}

          {activeTab === 'branding' && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{t('clientBrandingMvp')}</h2>
              <div className="mt-6 grid grid-cols-1 gap-4">
                <Field label={t('appName')}><TextInput name="AppName" value={form.AppName} onChange={handleChange} /></Field>
                <Field label={t('logoUrl')}><TextInput name="LogoUrl" value={form.LogoUrl} onChange={handleChange} /></Field>
                <Field label={t('faviconUrl')}><TextInput name="FaviconUrl" value={form.FaviconUrl} onChange={handleChange} /></Field>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label={t('primaryColor')}>
                    <div className="flex items-center gap-3">
                      <input type="color" name="PrimaryColor" value={form.PrimaryColor} onChange={handleChange} className="h-12 w-16 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
                      <TextInput name="PrimaryColor" value={form.PrimaryColor} onChange={handleChange} />
                    </div>
                  </Field>
                  <Field label={t('secondaryColor')}>
                    <div className="flex items-center gap-3">
                      <input type="color" name="SecondaryColor" value={form.SecondaryColor} onChange={handleChange} className="h-12 w-16 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
                      <TextInput name="SecondaryColor" value={form.SecondaryColor} onChange={handleChange} />
                    </div>
                  </Field>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'users' && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{t('clientUsersSectionTitle')}</h2>
                  <p className="mt-1 text-sm text-slate-500">{t('clientUsersSectionDescription')}</p>
                </div>
                {!isNew ? (
                  <button
                    type="button"
                    onClick={openNewUserModal}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: 'var(--brand-primary)' }}
                  >
                    {t('newUser')}
                  </button>
                ) : null}
              </div>

              {isNew ? (
                <p className="mt-6 text-sm text-slate-500">{t('usersAvailableAfterSaveClient')}</p>
              ) : usersLoading ? (
                <p className="mt-6 text-sm text-slate-500">{t('loadingUsers')}</p>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="px-3 py-3">{t('username')}</th>
                        <th className="px-3 py-3">{t('email')}</th>
                        <th className="px-3 py-3">{t('firstName')}</th>
                        <th className="px-3 py-3">{t('lastName')}</th>
                        <th className="px-3 py-3">{t('role')}</th>
                        <th className="px-3 py-3">{t('status')}</th>
                        <th className="px-3 py-3 text-right">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((item) => {
                        const role = roles.find((r) => String(r.id) === String(item.role_id))
                        return (
                          <tr key={item.id} className="border-b border-slate-100">
                            <td className="px-3 py-3">{item.username}</td>
                            <td className="px-3 py-3">{item.email}</td>
                            <td className="px-3 py-3">{item.first_name || '-'}</td>
                            <td className="px-3 py-3">{item.last_name || '-'}</td>
                            <td className="px-3 py-3">
                              {role?.code === 'ADMIN'
                                ? 'Admin'
                                : role?.code === 'MANAGER'
                                ? t('roleManager')
                                : role?.code === 'VIEWER'
                                  ? t('roleViewer')
                                  : role?.name || '-'}
                            </td>
                            <td className="px-3 py-3">{item.is_active ? t('yes') : t('no')}</td>
                            <td className="px-3 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => openEditUserModal(item)}
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                              >
                                {t('editUser')}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                            {t('noUsersFound')}
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              )}

              {userSaveError ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {userSaveError}
                </div>
              ) : null}
            </section>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={isSaving} className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70" style={{ backgroundColor: 'var(--brand-primary)' }}>
                {isSaving ? t('saving') : isNew ? t('createClient') : t('saveChanges')}
              </button>
              <button type="button" onClick={() => navigate('/app/clients', { state: { refresh: Date.now() } })} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                {t('cancel')}
              </button>
            </div>
            {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            {success ? <div className="mt-4 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--brand-primary-soft-strong)', backgroundColor: 'var(--brand-primary-soft)', color: 'var(--brand-primary)' }}>{success}</div> : null}
          </section>
        </div>

        <div className="self-start xl:sticky xl:top-6">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <img src={preview.logoUrl} alt={preview.appName} className="h-16 w-16 rounded-2xl object-contain" />
                <div>
                  <p className="text-sm text-slate-500">{isNew ? t('newClient') : t('client')}</p>
                  <h2 className="text-xl font-semibold text-slate-900">{form.TradeName || form.Name || t('unnamed')}</h2>
                  <p className="text-sm text-slate-500">{form.Email || t('noEmail')}</p>
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
              <h3 className="text-lg font-semibold text-slate-900">{t('brandPreview')}</h3>
              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
                <div className="flex items-center justify-between bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={preview.logoUrl} alt={preview.appName} className="h-10 w-10 rounded-xl object-contain" />
                    <span className="text-lg font-semibold" style={{ color: preview.primaryColor }}>{preview.appName}</span>
                  </div>
                  <button type="button" className="rounded-xl px-3 py-2 text-sm font-medium text-white" style={{ backgroundColor: preview.secondaryColor }}>
                    Logout
                  </button>
                </div>
                <div className="grid grid-cols-[160px_1fr] border-t border-slate-200">
                  <div className="bg-slate-50 p-4">
                    <div className="rounded-xl px-3 py-2 text-sm font-medium" style={{ backgroundColor: `${preview.primaryColor}20`, color: preview.primaryColor }}>
                      {t('dashboard')}
                    </div>
                  </div>
                  <div className="bg-white p-4">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <div className="text-sm text-slate-500">{t('example')}</div>
                      <div className="mt-2 text-xl font-semibold text-slate-900">{preview.appName}</div>
                      <div className="mt-4 h-3 rounded-full" style={{ backgroundColor: preview.primaryColor }} />
                      <div className="mt-3 h-3 w-2/3 rounded-full" style={{ backgroundColor: preview.secondaryColor }} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </form>

      <UserModal
        isOpen={userModalOpen}
        onClose={() => {
          setUserModalOpen(false)
          setUserForm(EMPTY_USER_FORM)
          setUserSaveError('')
        }}
        onSave={handleSaveUser}
        isSaving={userSaving}
        error={userSaveError}
        form={userForm}
        setForm={setUserForm}
        roles={roles}
        isEdit={Boolean(userForm.id)}
        t={t}
      />
    </div>
  )
}
