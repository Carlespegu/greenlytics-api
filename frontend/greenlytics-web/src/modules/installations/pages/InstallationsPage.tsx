import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useI18n } from '@/app/i18n/LanguageProvider';
import { useActiveClient } from '@/modules/clients/hooks/ActiveClientContext';
import { installationsApi, type InstallationListItem, type InstallationSearchFiltersInput, type InstallationSortField } from '@/modules/installations/api/installationsApi';
import { EmptyState } from '@/shared/components/EmptyState';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { DataTable, type DataTableColumn } from '@/shared/ui/data-grid/DataTable';
import { FilterBar } from '@/shared/ui/data-grid/FilterBar';
import { PaginationControls } from '@/shared/ui/data-grid/PaginationControls';
import { RecordsPageHeader } from '@/shared/ui/data-grid/RecordsPageHeader';
import type { SearchRequest, SortDirection } from '@/types/api';

type InstallationFiltersDraft = {
  code: string;
  name: string;
  location: string;
  isActive: 'all' | 'true' | 'false';
  createdAtFrom: string;
  createdAtTo: string;
};

const defaultFilters: InstallationFiltersDraft = {
  code: '',
  name: '',
  location: '',
  isActive: 'all',
  createdAtFrom: '',
  createdAtTo: '',
};

const pageSizeOptions = [10, 20, 50, 100];

function buildInstallationsRequest(
  filters: InstallationFiltersDraft,
  page: number,
  pageSize: number,
  sortField: InstallationSortField,
  sortDirection: SortDirection,
  activeClientId: string | null,
): SearchRequest<InstallationSearchFiltersInput, InstallationSortField> {
  return {
    filters: {
      code: filters.code.trim() || undefined,
      name: filters.name.trim() || undefined,
      location: filters.location.trim() || undefined,
      clientId: activeClientId ?? undefined,
      isActive: filters.isActive === 'all' ? undefined : filters.isActive === 'true',
      createdAtFrom: filters.createdAtFrom ? `${filters.createdAtFrom}T00:00:00.000Z` : undefined,
      createdAtTo: filters.createdAtTo ? `${filters.createdAtTo}T23:59:59.999Z` : undefined,
    },
    pagination: {
      page,
      pageSize,
    },
    sort: {
      field: sortField,
      direction: sortDirection,
    },
  };
}

function countActiveFilters(filters: InstallationFiltersDraft) {
  return [
    filters.code,
    filters.name,
    filters.location,
    filters.createdAtFrom,
    filters.createdAtTo,
    filters.isActive !== 'all' ? filters.isActive : '',
  ].filter(Boolean).length;
}

export function InstallationsPage() {
  const navigate = useNavigate();
  const { clientId: activeClientId } = useActiveClient();
  const { locale, t } = useI18n();

  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<InstallationFiltersDraft>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<InstallationFiltersDraft>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<InstallationSortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const installationsRequest = useMemo(
    () => buildInstallationsRequest(appliedFilters, page, pageSize, sortField, sortDirection, activeClientId),
    [activeClientId, appliedFilters, page, pageSize, sortDirection, sortField],
  );

  const installationsQuery = useQuery({
    queryKey: ['installations-search', installationsRequest],
    queryFn: () => installationsApi.search(installationsRequest),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    enabled: Boolean(activeClientId),
  });

  const formatDateTime = (value: string | null) => {
    if (!value) {
      return t('records.never');
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  };

  const columns = useMemo<DataTableColumn<InstallationListItem>[]>(() => ([
    {
      id: 'code',
      label: t('installationsPage.code'),
      sortable: true,
      render: (installation) => <span className="records-table__primary">{installation.code}</span>,
    },
    {
      id: 'name',
      label: t('installationsPage.name'),
      sortable: true,
      render: (installation) => (
        <div className="records-table__stack">
          <span className="records-table__primary">{installation.name}</span>
          <span>{installation.description ?? t('installationsPage.noDescription')}</span>
        </div>
      ),
    },
    {
      id: 'location',
      label: t('installationsPage.location'),
      sortable: true,
      render: (installation) => installation.location ?? t('installationsPage.unspecified'),
    },
    {
      id: 'plantsCount',
      label: t('installationsPage.plants'),
      sortable: true,
      align: 'center',
      render: (installation) => String(installation.plantsCount),
    },
    {
      id: 'devicesCount',
      label: t('installationsPage.devices'),
      sortable: true,
      align: 'center',
      render: (installation) => String(installation.devicesCount),
    },
    {
      id: 'isActive',
      label: t('installationsPage.status'),
      sortable: true,
      render: (installation) => (
        <StatusBadge
          label={installation.isActive ? t('records.active') : t('records.inactive')}
          variant={installation.isActive ? 'success' : 'neutral'}
        />
      ),
    },
    {
      id: 'updatedAt',
      label: t('installationsPage.updated'),
      sortable: true,
      render: (installation) => formatDateTime(installation.updatedAt ?? installation.createdAt),
    },
  ]), [locale, t]);

  function handleApplyFilters() {
    setAppliedFilters(draftFilters);
    setPage(1);
    setIsFilterBarOpen(false);
  }

  function handleClearFilters() {
    setDraftFilters(defaultFilters);
  }

  function handleSortChange(nextField: string) {
    const normalizedField = nextField as InstallationSortField;

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
      <RecordsPageHeader
        title={t('installationsPage.title')}
        subtitle={t('installationsPage.subtitle')}
        actions={(
          <button className="primary-button" type="button" onClick={() => navigate('/installations/new')}>
            <Plus size={16} />
            <span>{t('records.new')}</span>
          </button>
        )}
      />

      <FilterBar
        activeCount={isFilterBarOpen ? countActiveFilters(draftFilters) : countActiveFilters(appliedFilters)}
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
            <span>{t('installationsPage.installationCode')}</span>
            <input type="text" value={draftFilters.code} onChange={(event) => setDraftFilters((current) => ({ ...current, code: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>{t('installationsPage.name')}</span>
            <input type="text" value={draftFilters.name} onChange={(event) => setDraftFilters((current) => ({ ...current, name: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>{t('installationsPage.location')}</span>
            <input type="text" value={draftFilters.location} onChange={(event) => setDraftFilters((current) => ({ ...current, location: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>{t('records.active')}</span>
            <select value={draftFilters.isActive} onChange={(event) => setDraftFilters((current) => ({ ...current, isActive: event.target.value as InstallationFiltersDraft['isActive'] }))}>
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
            <strong>{t('installationsPage.catalogTitle')}</strong>
            <p>{t('installationsPage.catalogSubtitle')}</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          emptyState={<EmptyState title={t('installationsPage.emptyTitle')} description={t('installationsPage.emptyDescription')} />}
          getRowKey={(installation) => installation.id}
          isLoading={installationsQuery.isLoading}
          items={installationsQuery.data?.items ?? []}
          sortDirection={sortDirection}
          sortField={sortField}
          onRowClick={(installation) => navigate(`/installations/${installation.id}`)}
          onSortChange={handleSortChange}
        />

        <PaginationControls
          page={installationsQuery.data?.page ?? page}
          pageSize={installationsQuery.data?.pageSize ?? pageSize}
          totalItems={installationsQuery.data?.totalItems ?? 0}
          totalPages={installationsQuery.data?.totalPages ?? 0}
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
