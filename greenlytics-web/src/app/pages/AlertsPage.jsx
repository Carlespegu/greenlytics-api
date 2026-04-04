import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackofficeListHeader from '../components/BackofficeListHeader'
import CollapsibleFiltersCard from '../components/CollapsibleFiltersCard'
import CompactPagination from '../components/CompactPagination'
import RowActionsDropdown from '../components/RowActionsDropdown'
import { alertsService } from '../services/alertsService'

const INITIAL_FILTERS = {
  name: '',
  clientName: '',
  installationName: '',
  plantName: '',
  readingTypeName: '',
  channel: '',
  conditionType: '',
  recipientEmail: '',
  isActive: '',
}

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

function FilterSelect({ name, value, onChange, options }) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function buildRuleSummary(item) {
  const condition = item.condition_type || '-'
  const valueType = (item.reading_type_value_type || '').toUpperCase()

  if (valueType === 'NUMBER' || valueType === 'NUMERIC' || valueType === 'DECIMAL' || valueType === 'INTEGER' || valueType === 'FLOAT') {
    if (condition === 'MIN') return `Mínim: ${item.min_value ?? '-'}`
    if (condition === 'MAX') return `Màxim: ${item.max_value ?? '-'}`
    if (condition === 'RANGE') return `Rang: ${item.min_value ?? '-'} - ${item.max_value ?? '-'}`
    if (condition === 'EQUALS') return `Exacte: ${item.exact_numeric_value ?? '-'}`
  }

  if (valueType === 'TEXT' || valueType === 'STRING') {
    return `Text exacte: ${item.exact_text_value || '-'}`
  }

  if (valueType === 'BOOLEAN' || valueType === 'BOOL') {
    if (typeof item.exact_boolean_value === 'boolean') {
      return `Valor: ${item.exact_boolean_value ? 'True' : 'False'}`
    }
    return 'Valor: -'
  }

  return condition
}

function ActiveBadge({ isActive }) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
        isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600',
      ].join(' ')}
    >
      {isActive ? 'Activa' : 'Inactiva'}
    </span>
  )
}

export default function AlertsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [draftFilters, setDraftFilters] = useState(INITIAL_FILTERS)
  const [activeFilters, setActiveFilters] = useState(INITIAL_FILTERS)

  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).filter((value) => value !== '').length
  }, [activeFilters])

  async function loadAlerts({
    filters = activeFilters,
    targetPage = page,
    targetPageSize = pageSize,
  } = {}) {
    setIsLoading(true)
    setError('')

    try {
      const payload = await alertsService.searchAlerts({
        filters,
        page: targetPage,
        pageSize: targetPageSize,
      })

      setItems(payload.items || [])
      setTotal(payload.total || 0)
      setPage(payload.page || targetPage)
      setPageSize(payload.page_size || payload.pageSize || targetPageSize)
    } catch (err) {
      setError(err.message || 'No s’han pogut carregar les alertes.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSearch(event) {
    event?.preventDefault?.()
    setActiveFilters(draftFilters)
    await loadAlerts({ filters: draftFilters, targetPage: 1 })
  }

  async function handleReset() {
    setDraftFilters(INITIAL_FILTERS)
    setActiveFilters(INITIAL_FILTERS)
    setSuccess('')
    await loadAlerts({ filters: INITIAL_FILTERS, targetPage: 1 })
  }

  async function handleToggleActive(item) {
    const confirmed = window.confirm(
      item.is_active
        ? 'Vols desactivar aquesta alerta?'
        : 'Vols activar aquesta alerta?'
    )

    if (!confirmed) return

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await alertsService.updateAlert(item.id, {
        client_id: item.client_id,
        installation_id: item.installation_id,
        plant_id: item.plant_id,
        reading_type_id: item.reading_type_id,
        name: item.name,
        description: item.description,
        channel: item.channel,
        recipient_email: item.recipient_email,
        condition_type: item.condition_type,
        min_value: item.min_value,
        max_value: item.max_value,
        exact_numeric_value: item.exact_numeric_value,
        exact_text_value: item.exact_text_value,
        exact_boolean_value: item.exact_boolean_value,
        is_active: !item.is_active,
      })

      setSuccess(item.is_active ? 'Alerta desactivada correctament.' : 'Alerta activada correctament.')
      await loadAlerts()
    } catch (err) {
      setError(err.message || 'No s’ha pogut actualitzar l’estat de l’alerta.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(`Vols eliminar l’alerta "${item.name}"?`)
    if (!confirmed) return

    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await alertsService.deleteAlert(item.id)
      setSuccess('Alerta eliminada correctament.')
      await loadAlerts({
        targetPage: items.length === 1 && page > 1 ? page - 1 : page,
      })
    } catch (err) {
      setError(err.message || 'No s’ha pogut eliminar l’alerta.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <CollapsibleFiltersCard
        title="Filtres"
        description="Ajusta criteris per localitzar alertes més ràpidament."
        activeCount={activeFilterCount}
        defaultExpanded={false}
      >
        <form className="space-y-4" onSubmit={handleSearch}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FilterInput
              name="name"
              value={draftFilters.name}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Nom alerta"
            />
            <FilterInput
              name="clientName"
              value={draftFilters.clientName}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, clientName: event.target.value }))}
              placeholder="Client"
            />
            <FilterInput
              name="installationName"
              value={draftFilters.installationName}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, installationName: event.target.value }))}
              placeholder="Installation"
            />
            <FilterInput
              name="plantName"
              value={draftFilters.plantName}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, plantName: event.target.value }))}
              placeholder="Plant"
            />
            <FilterInput
              name="readingTypeName"
              value={draftFilters.readingTypeName}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, readingTypeName: event.target.value }))}
              placeholder="Reading type"
            />
            <FilterInput
              name="recipientEmail"
              value={draftFilters.recipientEmail}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, recipientEmail: event.target.value }))}
              placeholder="Email destinatari"
            />
            <FilterSelect
              name="channel"
              value={draftFilters.channel}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, channel: event.target.value }))}
              options={[
                { value: '', label: 'Canal' },
                { value: 'EMAIL', label: 'EMAIL' },
              ]}
            />
            <FilterSelect
              name="conditionType"
              value={draftFilters.conditionType}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, conditionType: event.target.value }))}
              options={[
                { value: '', label: 'Condició' },
                { value: 'MIN', label: 'MIN' },
                { value: 'MAX', label: 'MAX' },
                { value: 'RANGE', label: 'RANGE' },
                { value: 'EQUALS', label: 'EQUALS' },
                { value: 'BOOLEAN_EQUALS', label: 'BOOLEAN_EQUALS' },
              ]}
            />
            <FilterSelect
              name="isActive"
              value={draftFilters.isActive}
              onChange={(event) => setDraftFilters((prev) => ({ ...prev, isActive: event.target.value }))}
              options={[
                { value: '', label: 'Estat' },
                { value: 'true', label: 'Activa' },
                { value: 'false', label: 'Inactiva' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={isLoading || isSaving}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              Cercar
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading || isSaving}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Netejar filtres
            </button>
          </div>
        </form>
      </CollapsibleFiltersCard>

      <section className="overflow-visible rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <BackofficeListHeader
          title="Llistat d'alertes"
          total={total}
          showNewButton
          onNew={() => navigate('/alerts/new')}
        />

        {isLoading ? <p className="mt-4 text-sm text-slate-500">Carregant...</p> : null}
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mt-4 text-sm text-emerald-600">{success}</p> : null}

        <div className="mt-4 overflow-visible">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-3 py-3">Nom</th>
                <th className="px-3 py-3">Client</th>
                <th className="px-3 py-3">Installation</th>
                <th className="px-3 py-3">Plant</th>
                <th className="px-3 py-3">Reading type</th>
                <th className="px-3 py-3">Condició</th>
                <th className="px-3 py-3">Regla</th>
                <th className="px-3 py-3">Destinatari</th>
                <th className="px-3 py-3">Estat</th>
                <th className="px-3 py-3 text-right">Accions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-3">
                    <div className="font-medium text-slate-900">{item.name || '-'}</div>
                    <div className="text-xs text-slate-500">{item.channel || '-'}</div>
                  </td>
                  <td className="px-3 py-3">{item.client_name || item.client_code || '-'}</td>
                  <td className="px-3 py-3">{item.installation_name || item.installation_code || '-'}</td>
                  <td className="px-3 py-3">{item.plant_name || item.plant_code || '-'}</td>
                  <td className="px-3 py-3">{item.reading_type_name || item.reading_type_code || '-'}</td>
                  <td className="px-3 py-3">{item.condition_type || '-'}</td>
                  <td className="px-3 py-3">{buildRuleSummary(item)}</td>
                  <td className="px-3 py-3">{item.recipient_email || '-'}</td>
                  <td className="px-3 py-3"><ActiveBadge isActive={item.is_active} /></td>
                  <td className="px-3 py-3 text-right">
                    <RowActionsDropdown
                      disabled={isSaving}
                      actions={[
                        {
                          label: 'Editar',
                          onClick: () => navigate(`/alerts/${item.id}`),
                        },
                        {
                          label: item.is_active ? 'Desactivar' : 'Activar',
                          onClick: () => handleToggleActive(item),
                        },
                        {
                          label: 'Eliminar',
                          onClick: () => handleDelete(item),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}

              {!isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-slate-500">
                    No s’han trobat alertes.
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
          onPageChange={(nextPage) => {
            setPage(nextPage)
            loadAlerts({ targetPage: nextPage })
          }}
          onPageSizeChange={(nextSize) => {
            setPage(1)
            setPageSize(nextSize)
            loadAlerts({ targetPage: 1, targetPageSize: nextSize })
          }}
        />
      </section>
    </div>
  )
}
