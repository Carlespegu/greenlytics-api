import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { postSearch } from '@/api/search';
import { useI18n } from '@/app/i18n/LanguageProvider';
import { useActiveClient } from '@/modules/clients/hooks/ActiveClientContext';
import { EmptyState } from '@/shared/components/EmptyState';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { DataTable, type DataTableColumn } from '@/shared/ui/data-grid/DataTable';
import { FilterBar } from '@/shared/ui/data-grid/FilterBar';
import { PaginationControls } from '@/shared/ui/data-grid/PaginationControls';
import { RecordsPageHeader } from '@/shared/ui/data-grid/RecordsPageHeader';
import type { SearchRequest, SortDirection } from '@/types/api';

type AlertFiltersDraft = {
  name: string;
  installationId: string;
  plantId: string;
  channel: string;
  conditionType: string;
  isActive: 'all' | 'true' | 'false';
  createdAtFrom: string;
  createdAtTo: string;
};

type AlertSearchFiltersInput = {
  name?: string;
  clientId?: string;
  installationId?: string;
  plantId?: string;
  channel?: string;
  conditionType?: string;
  isActive?: boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
};

type AlertSortField = 'name' | 'channel' | 'conditionType' | 'isActive' | 'createdAt';

type AlertListItem = {
  id: string;
  name?: string | null;
  description?: string | null;
  channel?: string | null;
  conditionType?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  plantName?: string | null;
  plantCode?: string | null;
  installationName?: string | null;
  installationCode?: string | null;
  clientName?: string | null;
  clientCode?: string | null;
};

type OptionItem = {
  id: string;
  code?: string;
  name?: string;
};

const defaultFilters: AlertFiltersDraft = {
  name: '',
  installationId: '',
  plantId: '',
  channel: '',
  conditionType: '',
  isActive: 'all',
  createdAtFrom: '',
  createdAtTo: '',
};

const pageSizeOptions = [10, 20, 50, 100];

function buildAlertsRequest(
  filters: AlertFiltersDraft,
  page: number,
  pageSize: number,
  sortField: AlertSortField,
  sortDirection: SortDirection,
  activeClientId: string | null,
): SearchRequest<AlertSearchFiltersInput, AlertSortField> {
  return {
    filters: {
      name: filters.name.trim() || undefined,
      clientId: activeClientId ?? undefined,
      installationId: filters.installationId || undefined,
      plantId: filters.plantId || undefined,
      channel: filters.channel.trim() || undefined,
      conditionType: filters.conditionType.trim() || undefined,
      isActive: filters.isActive === 'all' ? undefined : filters.isActive === 'true',
      createdAtFrom: filters.createdAtFrom ? `${filters.createdAtFrom}T00:00:00.000Z` : undefined,
      createdAtTo: filters.createdAtTo ? `${filters.createdAtTo}T23:59:59.999Z` : undefined,
    },
    pagination: { page, pageSize },
    sort: { field: sortField, direction: sortDirection },
  };
}

function countActiveFilters(filters: AlertFiltersDraft) {
  return [
    filters.name,
    filters.installationId,
    filters.plantId,
    filters.channel,
    filters.conditionType,
    filters.createdAtFrom,
    filters.createdAtTo,
    filters.isActive !== 'all' ? filters.isActive : '',
  ].filter(Boolean).length;
}

function formatDateTime(value: string | null | undefined, locale: string) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function resolveAlertScope(item: AlertListItem, t: (key: string) => string) {
  return item.plantName
    ?? item.installationName
    ?? item.clientName
    ?? item.plantCode
    ?? item.installationCode
    ?? item.clientCode
    ?? t('alertsPage.unknownScope');
}

export function AlertsPage() {
  const navigate = useNavigate();
  const { locale, t } = useI18n();
  const { clientId: activeClientId } = useActiveClient();

  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<AlertFiltersDraft>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<AlertFiltersDraft>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<AlertSortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const alertsRequest = useMemo(
    () => buildAlertsRequest(appliedFilters, page, pageSize, sortField, sortDirection, activeClientId),
    [activeClientId, appliedFilters, page, pageSize, sortDirection, sortField],
  );

  const alertsQuery = useQuery({
    queryKey: ['alerts-search', alertsRequest],
    queryFn: () => postSearch<AlertListItem, AlertSearchFiltersInput, AlertSortField>('/api/alerts/search', alertsRequest),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const installationsQuery = useQuery({
    queryKey: ['alerts-installation-options', activeClientId],
    enabled: Boolean(activeClientId) && isFilterBarOpen,
    queryFn: async () => {
      const response = await postSearch<OptionItem, { clientId: string }, 'name'>('/api/installations/search', {
        filters: { clientId: activeClientId! },
        pagination: { page: 1, pageSize: 100 },
        sort: { field: 'name', direction: 'asc' },
      });

      return response.items;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const plantsQuery = useQuery({
    queryKey: ['alerts-plant-options', activeClientId],
    enabled: Boolean(activeClientId) && isFilterBarOpen,
    queryFn: async () => {
      const response = await postSearch<OptionItem, { clientId: string }, 'name'>('/api/plants/search', {
        filters: { clientId: activeClientId! },
        pagination: { page: 1, pageSize: 100 },
        sort: { field: 'name', direction: 'asc' },
      });

      return response.items;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const columns = useMemo<DataTableColumn<AlertListItem>[]>(() => ([
    {
      id: 'name',
      label: t('alertsPage.name'),
      align: 'left',
      sortable: true,
      sortField: 'name',
      render: (item) => (
        <div className="records-table__stack">
          <span className="records-table__primary">{item.name ?? t('alertsPage.unnamedAlert')}</span>
          <span>{item.description ?? t('records.noDescription')}</span>
        </div>
      ),
    },
    {
      id: 'channel',
      label: t('alertsPage.channel'),
      align: 'left',
      sortable: true,
      sortField: 'channel',
      render: (item) => item.channel ?? t('records.unspecified'),
    },
    {
      id: 'scope',
      label: t('alertsPage.scope'),
      align: 'left',
      render: (item) => resolveAlertScope(item, t),
    },
    {
      id: 'conditionType',
      label: t('alertsPage.conditionType'),
      align: 'left',
      sortable: true,
      sortField: 'conditionType',
      render: (item) => item.conditionType ?? t('records.unspecified'),
    },
    {
      id: 'isActive',
      label: t('alertsPage.status'),
      align: 'left',
      sortable: true,
      sortField: 'isActive',
      render: (item) => (
        <StatusBadge
          label={item.isActive ? t('records.active') : t('records.inactive')}
          variant={item.isActive ? 'success' : 'neutral'}
        />
      ),
    },
    {
      id: 'createdAt',
      label: t('alertsPage.createdAt'),
      align: 'left',
      sortable: true,
      sortField: 'createdAt',
      render: (item) => formatDateTime(item.createdAt, locale),
    },
  ]), [locale, t]);

  const activeFilterCount = isFilterBarOpen ? countActiveFilters(draftFilters) : countActiveFilters(appliedFilters);

  function handleApplyFilters() {
    setAppliedFilters(draftFilters);
    setPage(1);
    setIsFilterBarOpen(false);
  }

  function handleClearFilters() {
    setDraftFilters(defaultFilters);
  }

  function handleSortChange(nextField: string) {
    const normalizedField = nextField as AlertSortField;

    if (sortField === normalizedField) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(normalizedField);
      setSortDirection('asc');
    }

    setPage(1);
  }

  return (
    <div className="module-page records-page">
      <RecordsPageHeader title={t('alertsPage.title')} subtitle={t('alertsPage.subtitle')} />

      <FilterBar
        activeCount={activeFilterCount}
        isOpen={isFilterBarOpen}
        onToggle={() => setIsFilterBarOpen((current) => !current)}
        actions={(
          <>
            <button className="secondary-button" type="button" onClick={handleClearFilters}>{t('records.clearAll')}</button>
            <button className="primary-button" type="button" onClick={handleApplyFilters}>{t('records.apply')}</button>
          </>
        )}
      >
        <div className="records-filters-grid">
          <label className="records-field">
            <span>{t('alertsPage.name')}</span>
            <input type="text" value={draftFilters.name} onChange={(event) => setDraftFilters((current) => ({ ...current, name: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>{t('alertsPage.installation')}</span>
            <select value={draftFilters.installationId} onChange={(event) => setDraftFilters((current) => ({ ...current, installationId: event.target.value }))}>
              <option value="">{t('alertsPage.allInstallations')}</option>
              {(installationsQuery.data ?? []).map((installation) => (
                <option key={installation.id} value={installation.id}>
                  {installation.name ?? installation.code ?? installation.id}
                </option>
              ))}
            </select>
          </label>

          <label className="records-field">
            <span>{t('alertsPage.plant')}</span>
            <select value={draftFilters.plantId} onChange={(event) => setDraftFilters((current) => ({ ...current, plantId: event.target.value }))}>
              <option value="">{t('alertsPage.allPlants')}</option>
              {(plantsQuery.data ?? []).map((plant) => (
                <option key={plant.id} value={plant.id}>
                  {plant.name ?? plant.code ?? plant.id}
                </option>
              ))}
            </select>
          </label>

          <label className="records-field">
            <span>{t('alertsPage.channel')}</span>
            <input type="text" value={draftFilters.channel} onChange={(event) => setDraftFilters((current) => ({ ...current, channel: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>{t('alertsPage.conditionType')}</span>
            <input type="text" value={draftFilters.conditionType} onChange={(event) => setDraftFilters((current) => ({ ...current, conditionType: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>{t('alertsPage.status')}</span>
            <select value={draftFilters.isActive} onChange={(event) => setDraftFilters((current) => ({ ...current, isActive: event.target.value as AlertFiltersDraft['isActive'] }))}>
              <option value="all">{t('records.all')}</option>
              <option value="true">{t('records.active')}</option>
              <option value="false">{t('records.inactive')}</option>
            </select>
          </label>

          <label className="records-field">
            <span>{t('records.createdFrom')}</span>
            <input type="date" value={draftFilters.createdAtFrom} onChange={(event) => setDraftFilters((current) => ({ ...current, createdAtFrom: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>{t('records.createdTo')}</span>
            <input type="date" value={draftFilters.createdAtTo} onChange={(event) => setDraftFilters((current) => ({ ...current, createdAtTo: event.target.value }))} />
          </label>
        </div>
      </FilterBar>

      <section className="panel-card records-card">
        <div className="records-card__toolbar">
          <div className="records-card__summary">
            <strong>{t('alertsPage.catalogTitle')}</strong>
            <p>{t('alertsPage.catalogSubtitle')}</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          emptyState={<EmptyState title={t('alertsPage.emptyTitle')} description={t('alertsPage.emptyDescription')} />}
          getRowKey={(item) => item.id}
          isLoading={alertsQuery.isLoading}
          items={alertsQuery.data?.items ?? []}
          sortDirection={sortDirection}
          sortField={sortField}
          onRowClick={(item) => navigate(`/alerts/${item.id}`)}
          onSortChange={handleSortChange}
        />

        <PaginationControls
          page={alertsQuery.data?.page ?? page}
          pageSize={alertsQuery.data?.pageSize ?? pageSize}
          totalItems={alertsQuery.data?.totalItems ?? 0}
          totalPages={alertsQuery.data?.totalPages ?? 0}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      </section>
    </div>
  );
}
