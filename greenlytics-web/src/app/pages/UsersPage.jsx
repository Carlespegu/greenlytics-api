import { useEffect, useMemo, useState } from 'react'
import CollapsibleFiltersCard from '../components/CollapsibleFiltersCard'
import CompactPagination from '../components/CompactPagination'
import BackofficeListHeader from '../components/BackofficeListHeader'
import LoadingOverlay from '../components/LoadingOverlay'
import { usersService } from '../services/usersService'
import { useLanguage } from '../context/LanguageContext'

function FilterInput({ value, onChange, placeholder, name }) {
  return (
    <input
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
    />
  )
}

function TriStateSwitch({ value, onChange, trueLabel, falseLabel, emptyLabel, fieldLabel }) {
  function handleClick() {
    if (value === null) onChange(true)
    else if (value === true) onChange(false)
    else onChange(null)
  }

  const bgClass =
    value === true
      ? 'bg-emerald-600'
      : value === false
        ? 'bg-slate-500'
        : 'bg-slate-300'

  const thumbClass =
    value === true
      ? 'translate-x-8'
      : value === false
        ? 'translate-x-1'
        : 'translate-x-4'

  const label = value === true ? trueLabel : value === false ? falseLabel : emptyLabel

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={value === true}
        aria-label={`${fieldLabel}: ${label}`}
        onClick={handleClick}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition ${bgClass}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${thumbClass}`}
        />
      </button>
      <span className="text-sm text-slate-700">{label}</span>
    </div>
  )
}

function resolveRoleLabel(item, t) {
  const roleCode = (item.role_code || '').toUpperCase()

  if (roleCode === 'MANAGER') return t('roleManager')
  if (roleCode === 'VIEWER') return t('roleViewer')

  return item.role_name || item.role_code || '-'
}

export default function UsersPage() {
  const { t } = useLanguage()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    isActive: null,
  })

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value !== '' && value !== null).length,
    [filters],
  )

  async function loadUsers({ targetPage = page, targetPageSize = pageSize, targetFilters = filters } = {}) {
    setIsLoading(true)
    setError('')

    try {
      const payload = await usersService.searchUsers({
        page: targetPage,
        pageSize: targetPageSize,
        filters: targetFilters,
      })

      setItems(payload.items || [])
      setTotal(payload.total || 0)
      setPage(payload.page || targetPage)
      setPageSize(payload.page_size || targetPageSize)
    } catch (err) {
      setError(err.message || t('userLoadError'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers({ targetPage: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleSearch(event) {
    event.preventDefault()
    loadUsers({ targetPage: 1, targetFilters: filters })
  }

  function handleClearFilters() {
    const emptyFilters = {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      isActive: null,
    }

    setFilters(emptyFilters)
    loadUsers({ targetPage: 1, targetFilters: emptyFilters })
  }

  return (
    <div className="space-y-6">
      <CollapsibleFiltersCard
        title={t('users')}
        description="Consulta els usuaris registrats i filtra el llistat segons el teu criteri."
        activeCount={activeFilterCount}
        defaultExpanded={false}
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <FilterInput
              value={filters.username}
              onChange={handleFilterChange}
              placeholder={t('username')}
              name="username"
            />
            <FilterInput
              value={filters.email}
              onChange={handleFilterChange}
              placeholder={t('email')}
              name="email"
            />
            <FilterInput
              value={filters.firstName}
              onChange={handleFilterChange}
              placeholder={t('firstName')}
              name="firstName"
            />
            <FilterInput
              value={filters.lastName}
              onChange={handleFilterChange}
              placeholder={t('lastName')}
              name="lastName"
            />
            <div className="space-y-2 text-sm text-slate-700">
              <span className="block">{t('active')}</span>
              <TriStateSwitch
                value={filters.isActive}
                onChange={(value) => setFilters((prev) => ({ ...prev, isActive: value }))}
                trueLabel={t('yes')}
                falseLabel={t('no')}
                emptyLabel="Tots"
                fieldLabel={t('active')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="rounded-xl px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              Cercar
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Netejar filtres
            </button>
          </div>
        </form>
      </CollapsibleFiltersCard>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <BackofficeListHeader title="Llistat d'usuaris" total={total} />

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3">{t('username')}</th>
                <th className="px-3 py-3">{t('email')}</th>
                <th className="px-3 py-3">{t('firstName')}</th>
                <th className="px-3 py-3">{t('lastName')}</th>
                <th className="px-3 py-3">{t('client')}</th>
                <th className="px-3 py-3">{t('role')}</th>
                <th className="px-3 py-3">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{item.username || '-'}</td>
                  <td className="px-3 py-3">{item.email || '-'}</td>
                  <td className="px-3 py-3">{item.first_name || '-'}</td>
                  <td className="px-3 py-3">{item.last_name || '-'}</td>
                  <td className="px-3 py-3">{item.client_name || item.client_code || '-'}</td>
                  <td className="px-3 py-3">{resolveRoleLabel(item, t)}</td>
                  <td className="px-3 py-3">{item.is_active ? t('yes') : t('no')}</td>
                </tr>
              ))}

              {!isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    {t('noUsersFound')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <CompactPagination
          page={page}
          pageSize={pageSize}
          total={total}
          isLoading={isLoading}
          onPageChange={(nextPage) => loadUsers({ targetPage: nextPage })}
          onPageSizeChange={(nextSize) => loadUsers({ targetPage: 1, targetPageSize: nextSize })}
        />
      </section>
      <LoadingOverlay visible={isLoading} label={t('loadingUsers')} transparent />
    </div>
  )
}
