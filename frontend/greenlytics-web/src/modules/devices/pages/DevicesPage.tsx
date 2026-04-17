import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { postSearch } from '@/api/search';
import { useI18n } from '@/app/i18n/LanguageProvider';
import { useActiveClient } from '@/modules/clients/hooks/ActiveClientContext';
import { devicesApi, type DeviceListItem, type DeviceSearchFiltersInput, type DeviceSortField } from '@/modules/devices/api/devicesApi';
import { EmptyState } from '@/shared/components/EmptyState';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { DataTable, type DataTableColumn } from '@/shared/ui/data-grid/DataTable';
import { FilterBar } from '@/shared/ui/data-grid/FilterBar';
import { PaginationControls } from '@/shared/ui/data-grid/PaginationControls';
import { RecordsPageHeader } from '@/shared/ui/data-grid/RecordsPageHeader';
import type { SearchRequest, SortDirection } from '@/types/api';

type DeviceFiltersDraft = {
  code: string;
  name: string;
  serialNumber: string;
  firmwareVersion: string;
  installationId: string;
  isActive: 'all' | 'true' | 'false';
  createdAtFrom: string;
  createdAtTo: string;
};

type OptionItem = {
  id: string;
  code?: string;
  name?: string;
};

const defaultFilters: DeviceFiltersDraft = {
  code: '',
  name: '',
  serialNumber: '',
  firmwareVersion: '',
  installationId: '',
  isActive: 'all',
  createdAtFrom: '',
  createdAtTo: '',
};

const pageSizeOptions = [10, 20, 50, 100];

function buildDevicesRequest(
  filters: DeviceFiltersDraft,
  page: number,
  pageSize: number,
  sortField: DeviceSortField,
  sortDirection: SortDirection,
  activeClientId: string | null,
): SearchRequest<DeviceSearchFiltersInput, DeviceSortField> {
  return {
    filters: {
      code: filters.code.trim() || undefined,
      name: filters.name.trim() || undefined,
      serialNumber: filters.serialNumber.trim() || undefined,
      firmwareVersion: filters.firmwareVersion.trim() || undefined,
      clientId: activeClientId ?? undefined,
      installationId: filters.installationId || undefined,
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

function countActiveFilters(filters: DeviceFiltersDraft) {
  return [
    filters.code,
    filters.name,
    filters.serialNumber,
    filters.firmwareVersion,
    filters.installationId,
    filters.createdAtFrom,
    filters.createdAtTo,
    filters.isActive !== 'all' ? filters.isActive : '',
  ].filter(Boolean).length;
}

export function DevicesPage() {
  const navigate = useNavigate();
  const { clientId: activeClientId } = useActiveClient();
  const { locale, t } = useI18n();

  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<DeviceFiltersDraft>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<DeviceFiltersDraft>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<DeviceSortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const devicesRequest = useMemo(
    () => buildDevicesRequest(appliedFilters, page, pageSize, sortField, sortDirection, activeClientId),
    [activeClientId, appliedFilters, page, pageSize, sortDirection, sortField],
  );

  const devicesQuery = useQuery({
    queryKey: ['devices-search', devicesRequest],
    queryFn: () => devicesApi.search(devicesRequest),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    enabled: Boolean(activeClientId),
  });

  const installationsQuery = useQuery({
    queryKey: ['devices-installation-options', activeClientId],
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

  const formatDateTime = (value: string | null) => {
    if (!value) {
      return t('records.never');
    }

    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  };

  const columns = useMemo<DataTableColumn<DeviceListItem>[]>(() => ([
    {
      id: 'code',
      label: t('devicesPage.code'),
      sortable: true,
      render: (device) => <span className="records-table__primary">{device.code}</span>,
    },
    {
      id: 'name',
      label: t('devicesPage.name'),
      sortable: true,
      render: (device) => (
        <div className="records-table__stack">
          <span className="records-table__primary">{device.name}</span>
          <span>{device.installationName ?? t('devicesPage.noInstallationAssigned')}</span>
        </div>
      ),
    },
    {
      id: 'deviceTypeName',
      label: t('devicesPage.deviceType'),
      sortable: true,
      render: (device) => device.deviceTypeName ?? t('devicesPage.unspecified'),
    },
    {
      id: 'serialNumber',
      label: t('devicesPage.serialNumber'),
      sortable: true,
      render: (device) => device.serialNumber ?? t('devicesPage.noSerial'),
    },
    {
      id: 'firmwareVersion',
      label: t('devicesPage.firmwareVersion'),
      sortable: true,
      render: (device) => device.firmwareVersion ?? t('devicesPage.unknown'),
    },
    {
      id: 'lastSeenAt',
      label: t('devicesPage.lastSeen'),
      sortable: true,
      render: (device) => formatDateTime(device.lastSeenAt),
    },
    {
      id: 'isActive',
      label: t('devicesPage.status'),
      sortable: true,
      render: (device) => (
        <StatusBadge
          label={device.isActive ? t('records.active') : t('records.inactive')}
          variant={device.isActive ? 'success' : 'neutral'}
        />
      ),
    },
    {
      id: 'hasSecretConfigured',
      label: t('devicesPage.secret'),
      align: 'center',
      render: (device) => (
        <StatusBadge
          label={device.hasSecretConfigured ? t('devicesPage.configured') : t('devicesPage.missing')}
          variant={device.hasSecretConfigured ? 'info' : 'warning'}
        />
      ),
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
    const normalizedField = nextField as DeviceSortField;

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
        title={t('devicesPage.title')}
        subtitle={t('devicesPage.subtitle')}
        actions={(
          <button className="primary-button" type="button" onClick={() => navigate('/devices/new')}>
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
            <span>{t('devicesPage.deviceCode')}</span>
            <input type="text" value={draftFilters.code} onChange={(event) => setDraftFilters((current) => ({ ...current, code: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>{t('devicesPage.name')}</span>
            <input type="text" value={draftFilters.name} onChange={(event) => setDraftFilters((current) => ({ ...current, name: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>{t('devicesPage.serialNumber')}</span>
            <input type="text" value={draftFilters.serialNumber} onChange={(event) => setDraftFilters((current) => ({ ...current, serialNumber: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>{t('devicesPage.firmwareVersion')}</span>
            <input type="text" value={draftFilters.firmwareVersion} onChange={(event) => setDraftFilters((current) => ({ ...current, firmwareVersion: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>{t('devicesPage.installation')}</span>
            <select value={draftFilters.installationId} onChange={(event) => setDraftFilters((current) => ({ ...current, installationId: event.target.value }))}>
              <option value="">{t('devicesPage.allInstallations')}</option>
              {(installationsQuery.data ?? []).map((installation) => (
                <option key={installation.id} value={installation.id}>
                  {installation.name ?? installation.code ?? installation.id}
                </option>
              ))}
            </select>
          </label>

          <label className="records-field">
            <span>{t('records.active')}</span>
            <select value={draftFilters.isActive} onChange={(event) => setDraftFilters((current) => ({ ...current, isActive: event.target.value as DeviceFiltersDraft['isActive'] }))}>
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
            <strong>{t('devicesPage.catalogTitle')}</strong>
            <p>{t('devicesPage.catalogSubtitle')}</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          emptyState={<EmptyState title={t('devicesPage.emptyTitle')} description={t('devicesPage.emptyDescription')} />}
          getRowKey={(device) => device.id}
          isLoading={devicesQuery.isLoading}
          items={devicesQuery.data?.items ?? []}
          sortDirection={sortDirection}
          sortField={sortField}
          onRowClick={(device) => navigate(`/devices/${device.id}`)}
          onSortChange={handleSortChange}
        />

        <PaginationControls
          page={devicesQuery.data?.page ?? page}
          pageSize={devicesQuery.data?.pageSize ?? pageSize}
          totalItems={devicesQuery.data?.totalItems ?? 0}
          totalPages={devicesQuery.data?.totalPages ?? 0}
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
