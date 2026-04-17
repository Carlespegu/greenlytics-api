import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { postSearch } from '@/api/search';
import { useI18n } from '@/app/i18n/LanguageProvider';
import { useActiveClient } from '@/modules/clients/hooks/ActiveClientContext';
import { EmptyState } from '@/shared/components/EmptyState';
import { DataTable, type DataTableColumn } from '@/shared/ui/data-grid/DataTable';
import { FilterBar } from '@/shared/ui/data-grid/FilterBar';
import { PaginationControls } from '@/shared/ui/data-grid/PaginationControls';
import { RecordsPageHeader } from '@/shared/ui/data-grid/RecordsPageHeader';
import type { SearchRequest, SortDirection } from '@/types/api';

type ReadingFiltersDraft = {
  installationId: string;
  deviceId: string;
  readingTypeId: string;
  dateFrom: string;
  dateTo: string;
  valueMin: string;
  valueMax: string;
};

type ReadingSearchFiltersInput = {
  clientId?: string;
  installationId?: string;
  deviceId?: string;
  readingTypeId?: string;
  dateFrom?: string;
  dateTo?: string;
  valueMin?: number;
  valueMax?: number;
};

type ReadingSortField = 'recordedAt' | 'device' | 'readingType' | 'value';

type ReadingListItem = {
  id: string;
  recordedAt?: string | null;
  device?: string | null;
  deviceCode?: string | null;
  deviceName?: string | null;
  readingType?: string | null;
  readingTypeName?: string | null;
  value?: number | string | null;
  unit?: string | null;
  unitName?: string | null;
  installationName?: string | null;
  source?: string | null;
};

type OptionItem = {
  id: string;
  code?: string;
  name?: string;
};

const defaultFilters: ReadingFiltersDraft = {
  installationId: '',
  deviceId: '',
  readingTypeId: '',
  dateFrom: '',
  dateTo: '',
  valueMin: '',
  valueMax: '',
};

const pageSizeOptions = [10, 20, 50, 100];

function buildReadingsRequest(
  filters: ReadingFiltersDraft,
  page: number,
  pageSize: number,
  sortField: ReadingSortField,
  sortDirection: SortDirection,
  activeClientId: string | null,
): SearchRequest<ReadingSearchFiltersInput, ReadingSortField> {
  return {
    filters: {
      clientId: activeClientId ?? undefined,
      installationId: filters.installationId || undefined,
      deviceId: filters.deviceId || undefined,
      readingTypeId: filters.readingTypeId || undefined,
      dateFrom: filters.dateFrom ? `${filters.dateFrom}T00:00:00.000Z` : undefined,
      dateTo: filters.dateTo ? `${filters.dateTo}T23:59:59.999Z` : undefined,
      valueMin: filters.valueMin ? Number(filters.valueMin) : undefined,
      valueMax: filters.valueMax ? Number(filters.valueMax) : undefined,
    },
    pagination: { page, pageSize },
    sort: { field: sortField, direction: sortDirection },
  };
}

function countActiveFilters(filters: ReadingFiltersDraft) {
  return [
    filters.installationId,
    filters.deviceId,
    filters.readingTypeId,
    filters.dateFrom,
    filters.dateTo,
    filters.valueMin,
    filters.valueMax,
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

export function ReadingsPage() {
  const { locale, t } = useI18n();
  const { clientId: activeClientId } = useActiveClient();

  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<ReadingFiltersDraft>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<ReadingFiltersDraft>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<ReadingSortField>('recordedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const readingsRequest = useMemo(
    () => buildReadingsRequest(appliedFilters, page, pageSize, sortField, sortDirection, activeClientId),
    [activeClientId, appliedFilters, page, pageSize, sortDirection, sortField],
  );

  const readingsQuery = useQuery({
    queryKey: ['readings-search', readingsRequest],
    queryFn: () => postSearch<ReadingListItem, ReadingSearchFiltersInput, ReadingSortField>('/api/readings/search', readingsRequest),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const installationsQuery = useQuery({
    queryKey: ['readings-installation-options', activeClientId],
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

  const devicesQuery = useQuery({
    queryKey: ['readings-device-options', activeClientId],
    enabled: Boolean(activeClientId) && isFilterBarOpen,
    queryFn: async () => {
      const response = await postSearch<OptionItem, { clientId: string }, 'name'>('/api/devices/search', {
        filters: { clientId: activeClientId! },
        pagination: { page: 1, pageSize: 100 },
        sort: { field: 'name', direction: 'asc' },
      });

      return response.items;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const columns = useMemo<DataTableColumn<ReadingListItem>[]>(() => ([
    {
      id: 'recordedAt',
      label: t('readingsPage.recordedAt'),
      align: 'left',
      sortable: true,
      sortField: 'recordedAt',
      render: (item) => formatDateTime(item.recordedAt, locale),
    },
    {
      id: 'device',
      label: t('readingsPage.device'),
      align: 'left',
      sortable: true,
      sortField: 'device',
      render: (item) => item.deviceName ?? item.deviceCode ?? item.device ?? t('readingsPage.unknownDevice'),
    },
    {
      id: 'readingType',
      label: t('readingsPage.readingType'),
      align: 'left',
      sortable: true,
      sortField: 'readingType',
      render: (item) => item.readingTypeName ?? item.readingType ?? t('records.unspecified'),
    },
    {
      id: 'value',
      label: t('readingsPage.value'),
      align: 'left',
      sortable: true,
      sortField: 'value',
      render: (item) => `${item.value ?? '—'}${item.unit ?? item.unitName ? ` ${item.unit ?? item.unitName}` : ''}`,
    },
    {
      id: 'installation',
      label: t('readingsPage.installation'),
      align: 'left',
      render: (item) => item.installationName ?? t('records.unassigned'),
    },
    {
      id: 'source',
      label: t('readingsPage.source'),
      align: 'left',
      render: (item) => item.source ?? t('records.unspecified'),
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
    const normalizedField = nextField as ReadingSortField;

    if (sortField === normalizedField) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(normalizedField);
      setSortDirection(normalizedField === 'recordedAt' ? 'desc' : 'asc');
    }

    setPage(1);
  }

  return (
    <div className="module-page records-page">
      <RecordsPageHeader title={t('readingsPage.title')} subtitle={t('readingsPage.subtitle')} />

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
            <span>{t('readingsPage.installation')}</span>
            <select value={draftFilters.installationId} onChange={(event) => setDraftFilters((current) => ({ ...current, installationId: event.target.value }))}>
              <option value="">{t('readingsPage.allInstallations')}</option>
              {(installationsQuery.data ?? []).map((installation) => (
                <option key={installation.id} value={installation.id}>
                  {installation.name ?? installation.code ?? installation.id}
                </option>
              ))}
            </select>
          </label>

          <label className="records-field">
            <span>{t('readingsPage.device')}</span>
            <select value={draftFilters.deviceId} onChange={(event) => setDraftFilters((current) => ({ ...current, deviceId: event.target.value }))}>
              <option value="">{t('readingsPage.allDevices')}</option>
              {(devicesQuery.data ?? []).map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name ?? device.code ?? device.id}
                </option>
              ))}
            </select>
          </label>

          <label className="records-field">
            <span>{t('readingsPage.readingTypeId')}</span>
            <input type="text" value={draftFilters.readingTypeId} onChange={(event) => setDraftFilters((current) => ({ ...current, readingTypeId: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>{t('readingsPage.dateFrom')}</span>
            <input type="date" value={draftFilters.dateFrom} onChange={(event) => setDraftFilters((current) => ({ ...current, dateFrom: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>{t('readingsPage.dateTo')}</span>
            <input type="date" value={draftFilters.dateTo} onChange={(event) => setDraftFilters((current) => ({ ...current, dateTo: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>{t('readingsPage.valueMin')}</span>
            <input type="number" value={draftFilters.valueMin} onChange={(event) => setDraftFilters((current) => ({ ...current, valueMin: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>{t('readingsPage.valueMax')}</span>
            <input type="number" value={draftFilters.valueMax} onChange={(event) => setDraftFilters((current) => ({ ...current, valueMax: event.target.value }))} />
          </label>
        </div>
      </FilterBar>

      <section className="panel-card records-card">
        <div className="records-card__toolbar">
          <div className="records-card__summary">
            <strong>{t('readingsPage.catalogTitle')}</strong>
            <p>{t('readingsPage.catalogSubtitle')}</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          emptyState={<EmptyState title={t('readingsPage.emptyTitle')} description={t('readingsPage.emptyDescription')} />}
          getRowKey={(item) => item.id}
          isLoading={readingsQuery.isLoading}
          items={readingsQuery.data?.items ?? []}
          sortDirection={sortDirection}
          sortField={sortField}
          onSortChange={handleSortChange}
        />

        <PaginationControls
          page={readingsQuery.data?.page ?? page}
          pageSize={readingsQuery.data?.pageSize ?? pageSize}
          totalItems={readingsQuery.data?.totalItems ?? 0}
          totalPages={readingsQuery.data?.totalPages ?? 0}
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
