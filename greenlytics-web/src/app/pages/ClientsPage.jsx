import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientsService } from '../services/clientsService'

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

export default function ClientsPage() {
  const navigate = useNavigate()

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
    isActive: '',
  })

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
  }, [])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleSearch(event) {
    event.preventDefault()
    loadClients({ targetPage: 1, targetFilters: filters })
  }

  function handleClearFilters() {
    const emptyFilters = {
      code: '',
      name: '',
      tradeName: '',
      email: '',
      city: '',
      country: '',
      clientType: '',
      isActive: '',
    }

    setFilters(emptyFilters)
    loadClients({ targetPage: 1, targetFilters: emptyFilters })
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-600">Administració</p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Clients
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Gestiona el catàleg de clients de la plataforma.
            </p>
          </div>

          <button
            onClick={() => navigate('/clients/new')}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            Nou
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Filtres</h2>

        <form onSubmit={handleSearch} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterInput
              value={filters.code}
              onChange={handleFilterChange}
              placeholder="Codi"
              name="code"
            />
            <FilterInput
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Nom"
              name="name"
            />
            <FilterInput
              value={filters.tradeName}
              onChange={handleFilterChange}
              placeholder="Nom comercial"
              name="tradeName"
            />
            <FilterInput
              value={filters.email}
              onChange={handleFilterChange}
              placeholder="Email"
              name="email"
            />
            <FilterInput
              value={filters.city}
              onChange={handleFilterChange}
              placeholder="Ciutat"
              name="city"
            />
            <FilterInput
              value={filters.country}
              onChange={handleFilterChange}
              placeholder="País"
              name="country"
            />
            <FilterInput
              value={filters.clientType}
              onChange={handleFilterChange}
              placeholder="Tipus client"
              name="clientType"
            />

            <select
              name="isActive"
              value={filters.isActive}
              onChange={handleFilterChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="">Actiu: tots</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
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
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Llistat de clients</h2>
            <p className="mt-1 text-sm text-slate-500">
              Resultats: {total}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600">Files per pàgina</label>
            <select
              value={pageSize}
              onChange={(event) => {
                const nextPageSize = Number(event.target.value)
                loadClients({ targetPage: 1, targetPageSize: nextPageSize })
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {isLoading ? <p className="mt-4 text-sm text-slate-500">Carregant...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 overflow-x-auto">
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
                    <button
                      onClick={() => navigate(`/clients/${item.id}`)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Obrir
                    </button>
                  </td>
                </tr>
              ))}

              {!isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                    No s’han trobat clients.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-500">
            Pàgina {page} de {totalPages}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => loadClients({ targetPage: page - 1 })}
              disabled={page <= 1 || isLoading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>

            <button
              onClick={() => loadClients({ targetPage: page + 1 })}
              disabled={page >= totalPages || isLoading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Següent
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}