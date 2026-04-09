import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { clientsService } from '../services/clientsService'
import CollapsibleFiltersCard from '../components/CollapsibleFiltersCard'
import CompactPagination from '../components/CompactPagination'
import BackofficeListHeader from '../components/BackofficeListHeader'
import LoadingOverlay from '../components/LoadingOverlay'
import RowActionsDropdown from '../components/RowActionsDropdown'

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

function TriStateSwitch({ value, onChange }) {
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

  const label = value === true ? 'Sí' : value === false ? 'No' : 'Tots'

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={value === true}
        aria-label={`Actiu: ${label}`}
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

export default function ClientsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    code: '',
    name: '',
    tradeName: '',
    email: '',
    city: '',
    country: '',
    clientType: '',
    isActive: null,
  })

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value !== '' && value !== null).length,
    [filters]
  )

  async function loadClients({ targetPage = page, targetPageSize = pageSize, targetFilters = filters } = {}) {
    setIsLoading(true)
    setError('')
    try {
      const payload = await clientsService.searchClients({
        page: targetPage,
        pageSize: targetPageSize,
        filters: targetFilters,
      })
      setItems(payload.items || [])
      setTotal(payload.total || 0)
      setPage(payload.page || targetPage)
      setPageSize(payload.page_size || targetPageSize)
    } catch (err) {
      setError(err.message || 'No s’han pogut carregar els clients.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClients({ targetPage: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, location.state?.refresh])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleSearch(event) {
    event.preventDefault()
    loadClients({ targetPage: 1, targetFilters: filters })
  }

  function handleClearFilters() {
    const emptyFilters = {
      code: '', name: '', tradeName: '', email: '', city: '', country: '', clientType: '', isActive: null,
    }
    setFilters(emptyFilters)
    loadClients({ targetPage: 1, targetFilters: emptyFilters })
  }

  return (
    <div className="space-y-6">
      <CollapsibleFiltersCard
        title="Clients"
        description="Consulta els clients registrats i filtra el llistat segons les teves necessitats."
        activeCount={activeFilterCount}
        defaultExpanded={false}
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterInput value={filters.code} onChange={handleFilterChange} placeholder="Codi" name="code" />
            <FilterInput value={filters.name} onChange={handleFilterChange} placeholder="Nom" name="name" />
            <FilterInput value={filters.tradeName} onChange={handleFilterChange} placeholder="Nom comercial" name="tradeName" />
            <FilterInput value={filters.email} onChange={handleFilterChange} placeholder="Email" name="email" />
            <FilterInput value={filters.city} onChange={handleFilterChange} placeholder="Ciutat" name="city" />
            <FilterInput value={filters.country} onChange={handleFilterChange} placeholder="País" name="country" />
            <FilterInput value={filters.clientType} onChange={handleFilterChange} placeholder="Tipus client" name="clientType" />
            <div className="space-y-2 text-sm text-slate-700">
              <span className="block">Actiu</span>
              <TriStateSwitch
                value={filters.isActive}
                onChange={(value) => setFilters((prev) => ({ ...prev, isActive: value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="submit" className="rounded-xl px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
              Cercar
            </button>
            <button type="button" onClick={handleClearFilters} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Netejar filtres
            </button>
          </div>
        </form>
      </CollapsibleFiltersCard>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-visible">
        <BackofficeListHeader title="Llistat de clients" total={total} showNewButton onNew={() => navigate('/app/clients/new')} />

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 overflow-visible">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3">Codi</th>
                <th className="px-3 py-3">Nom</th>
                <th className="px-3 py-3">Nom comercial</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Ciutat</th>
                <th className="px-3 py-3">País</th>
                <th className="px-3 py-3">Actiu</th>
                <th className="px-3 py-3 text-right">Accions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{item.code || '-'}</td>
                  <td className="px-3 py-3">{item.name || '-'}</td>
                  <td className="px-3 py-3">{item.trade_name || '-'}</td>
                  <td className="px-3 py-3">{item.email || '-'}</td>
                  <td className="px-3 py-3">{item.city || '-'}</td>
                  <td className="px-3 py-3">{item.country || '-'}</td>
                  <td className="px-3 py-3">{item.is_active ? 'Sí' : 'No'}</td>
                  <td className="px-3 py-3 text-right">
                    <RowActionsDropdown
                      actions={[
                        {
                          key: 'open',
                          label: 'Obrir',
                          onClick: () => navigate(`/app/clients/${item.id}`),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {!isLoading && items.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-slate-500">No s’han trobat clients.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <CompactPagination
          page={page}
          pageSize={pageSize}
          total={total}
          isLoading={isLoading}
          onPageChange={(nextPage) => loadClients({ targetPage: nextPage })}
          onPageSizeChange={(nextSize) => loadClients({ targetPage: 1, targetPageSize: nextSize })}
        />
      </section>
      <LoadingOverlay visible={isLoading} label="Carregant clients..." transparent />
    </div>
  )
}
