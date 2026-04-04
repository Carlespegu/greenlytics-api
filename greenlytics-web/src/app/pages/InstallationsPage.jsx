import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CollapsibleFiltersCard from '../components/CollapsibleFiltersCard'
import CompactPagination from '../components/CompactPagination'
import BackofficeListHeader from '../components/BackofficeListHeader'
import BackofficeFilterInput from '../components/BackofficeFilterInput'
import BackofficeFilterActions from '../components/BackofficeFilterActions'
import BackofficeTableActionsDropdown from '../components/BackofficeTableActionsDropdown'
import StatusBadge from '../components/StatusBadge'
import { installationsService } from '../services/installationsService'

const EMPTY_FILTERS = { code: '', name: '', city: '', country: '', isActive: '' }

export default function InstallationsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)

  const activeFilterCount = useMemo(() => Object.values(filters).filter((value) => value !== '').length, [filters])

  async function loadInstallations({ targetPage = page, targetPageSize = pageSize, targetFilters = filters } = {}) {
    setIsLoading(true)
    setError('')
    try {
      const payload = await installationsService.searchInstallations({ page: targetPage, pageSize: targetPageSize, filters: targetFilters })
      setItems(payload.items || [])
      setTotal(payload.total || 0)
      setPage(payload.page || targetPage)
      setPageSize(payload.page_size || targetPageSize)
    } catch (err) {
      setError(err.message || 'No s’han pogut carregar les instal·lacions.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInstallations({ targetPage: 1, targetFilters: EMPTY_FILTERS })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setDraftFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleSearch(event) {
    event.preventDefault()
    setFilters(draftFilters)
    loadInstallations({ targetPage: 1, targetFilters: draftFilters })
  }

  function handleClear() {
    setDraftFilters(EMPTY_FILTERS)
    setFilters(EMPTY_FILTERS)
    loadInstallations({ targetPage: 1, targetFilters: EMPTY_FILTERS })
  }

  return (
    <div className="space-y-6">
      <CollapsibleFiltersCard title="Filtres" description="Ajusta criteris per localitzar instal·lacions més ràpidament." activeCount={activeFilterCount} defaultExpanded={false}>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <BackofficeFilterInput name="code" value={draftFilters.code} onChange={handleFilterChange} placeholder="Codi" />
            <BackofficeFilterInput name="name" value={draftFilters.name} onChange={handleFilterChange} placeholder="Nom" />
            <BackofficeFilterInput name="city" value={draftFilters.city} onChange={handleFilterChange} placeholder="Ciutat" />
            <BackofficeFilterInput name="country" value={draftFilters.country} onChange={handleFilterChange} placeholder="País" />
            <select name="isActive" value={draftFilters.isActive} onChange={handleFilterChange} className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400">
              <option value="">Activa: totes</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>
          <BackofficeFilterActions onClear={handleClear} disabled={isLoading} />
        </form>
      </CollapsibleFiltersCard>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-visible">
        <BackofficeListHeader title="Llistat d’instal·lacions" total={total} showNewButton onNew={() => navigate('/installations/new')} />

        {isLoading ? <p className="mt-4 text-sm text-slate-500">Carregant...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3">Codi</th>
                <th className="px-3 py-3">Nom</th>
                <th className="px-3 py-3">Ciutat</th>
                <th className="px-3 py-3">País</th>
                <th className="px-3 py-3">Activa</th>
                <th className="px-3 py-3 text-right">Accions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{item.code || '-'}</td>
                  <td className="px-3 py-3">{item.name || '-'}</td>
                  <td className="px-3 py-3">{item.city || '-'}</td>
                  <td className="px-3 py-3">{item.country || '-'}</td>
                  <td className="px-3 py-3"><StatusBadge value={item.is_active ? 'Active' : 'Inactive'} /></td>
                  <td className="px-3 py-3 text-right">
                    <BackofficeTableActionsDropdown
                      item={item}
                      actions={[
                        { key: 'open-plants', label: 'Veure plantes', onClick: () => navigate('/plants') },
                        { key: 'open-devices', label: 'Veure devices', onClick: () => navigate('/devices') },
                      ]}
                    />
                  </td>
                </tr>
              ))}
              {!isLoading && items.length === 0 ? <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-500">No s’han trobat instal·lacions.</td></tr> : null}
            </tbody>
          </table>
        </div>

        <CompactPagination
          page={page}
          pageSize={pageSize}
          total={total}
          isLoading={isLoading}
          onPageChange={(nextPage) => loadInstallations({ targetPage: nextPage })}
          onPageSizeChange={(nextSize) => loadInstallations({ targetPage: 1, targetPageSize: nextSize })}
        />
      </section>
    </div>
  )
}
