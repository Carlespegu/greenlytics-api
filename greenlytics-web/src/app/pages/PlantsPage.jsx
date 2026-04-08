import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CollapsibleFiltersCard from '../components/CollapsibleFiltersCard'
import CompactPagination from '../components/CompactPagination'
import BackofficeListHeader from '../components/BackofficeListHeader'
import LoadingOverlay from '../components/LoadingOverlay'
import { useLanguage } from '../context/LanguageContext'
import { resourceService } from '../services/resourceService'

function FilterInput({ name, value, onChange, placeholder }) {
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

const EMPTY_FILTERS = { name: '', species: '', deviceId: '' }

export default function PlantsPage() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [allItems, setAllItems] = useState([])
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS)
  const text = useMemo(() => {
    const texts = {
      ca: {
        filters: 'Filtres',
        filtersDescription: 'Llistat de plantes',
        name: 'Nom',
        species: 'Espècie',
        device: 'Dispositiu',
        search: 'Cercar',
        clear: 'Netejar filtres',
        listTitle: 'Llistat de plantes',
        noResults: 'No s’han trobat plantes.',
        loading: 'Carregant plantes...',
      },
      es: {
        filters: 'Filtros',
        filtersDescription: 'Listado de plantas',
        name: 'Nombre',
        species: 'Especie',
        device: 'Dispositivo',
        search: 'Buscar',
        clear: 'Limpiar filtros',
        listTitle: 'Listado de plantas',
        noResults: 'No se han encontrado plantas.',
        loading: 'Cargando plantas...',
      },
      en: {
        filters: 'Filters',
        filtersDescription: 'Plants list',
        name: 'Name',
        species: 'Species',
        device: 'Device',
        search: 'Search',
        clear: 'Clear filters',
        listTitle: 'Plants list',
        noResults: 'No plants found.',
        loading: 'Loading plants...',
      },
    }

    return texts[language] || texts.ca
  }, [language])

  const activeFilterCount = useMemo(() => Object.values(filters).filter((value) => value !== '').length, [filters])

  useEffect(() => {
    async function load() {
      try {
        const data = await resourceService.listPlants()
        setAllItems(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'No s’han pogut carregar les plantes.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let filtered = [...allItems]
    if (appliedFilters.name) filtered = filtered.filter((item) => String(item.name || '').toLowerCase().includes(appliedFilters.name.toLowerCase()))
    if (appliedFilters.species) filtered = filtered.filter((item) => String(item.species || item.type || '').toLowerCase().includes(appliedFilters.species.toLowerCase()))
    if (appliedFilters.deviceId) filtered = filtered.filter((item) => String(item.deviceId || item.device?.name || '').toLowerCase().includes(appliedFilters.deviceId.toLowerCase()))
    setTotal(filtered.length)
    const start = (page - 1) * pageSize
    setItems(filtered.slice(start, start + pageSize))
  }, [allItems, appliedFilters, page, pageSize])

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  function handleSearch(event) {
    event.preventDefault()
    setPage(1)
    setAppliedFilters(filters)
  }

  function handleClear() {
    setPage(1)
    setFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
  }

  return (
    <div className="space-y-6">
      <CollapsibleFiltersCard
        title={text.filters}
        description={text.filtersDescription}
        activeCount={activeFilterCount}
        defaultExpanded={false}
      >
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterInput name="name" value={filters.name} onChange={handleFilterChange} placeholder={text.name} />
            <FilterInput name="species" value={filters.species} onChange={handleFilterChange} placeholder={text.species} />
            <FilterInput name="deviceId" value={filters.deviceId} onChange={handleFilterChange} placeholder={text.device} />
          </div>

          <div className="flex justify-end gap-3">
            <button type="submit" className="rounded-xl px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
              {text.search}
            </button>
            <button type="button" onClick={handleClear} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {text.clear}
            </button>
          </div>
        </form>
      </CollapsibleFiltersCard>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <BackofficeListHeader title={text.listTitle} total={total} showNewButton onNew={() => navigate('/plants/new')} />

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3">{text.name}</th>
                <th className="px-3 py-3">{text.species}</th>
                <th className="px-3 py-3">{text.device}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">{item.name || '-'}</td>
                  <td className="px-3 py-3">{item.species || item.type || '-'}</td>
                  <td className="px-3 py-3">{item.device?.name || '-'}</td>
                </tr>
              ))}
              {!isLoading && items.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-500">{text.noResults}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <CompactPagination
          page={page}
          pageSize={pageSize}
          total={total}
          isLoading={isLoading}
          onPageChange={setPage}
          onPageSizeChange={(nextSize) => {
            setPage(1)
            setPageSize(nextSize)
          }}
        />
      </section>
      <LoadingOverlay visible={isLoading} label={text.loading} transparent />
    </div>
  )
}
