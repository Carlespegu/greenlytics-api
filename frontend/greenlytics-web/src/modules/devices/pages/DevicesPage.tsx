import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { postSearch } from '@/api/search';
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

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Never';
  }

  return new Date(value).toLocaleString();
}

export function DevicesPage() {
  const navigate = useNavigate();
  const { clientId: activeClientId } = useActiveClient();

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

  const columns = useMemo<DataTableColumn<DeviceListItem>[]>(() => ([
    {
      id: 'code',
      label: 'Code',
      sortable: true,
      render: (device) => <span className="records-table__primary">{device.code}</span>,
    },
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      render: (device) => (
        <div className="records-table__stack">
          <span className="records-table__primary">{device.name}</span>
          <span>{device.installationName ?? 'No installation assigned'}</span>
        </div>
      ),
    },
    {
      id: 'deviceTypeName',
      label: 'Device type',
      sortable: true,
      render: (device) => device.deviceTypeName ?? 'Unspecified',
    },
    {
      id: 'serialNumber',
      label: 'Serial',
      sortable: true,
      render: (device) => device.serialNumber ?? 'No serial',
    },
    {
      id: 'firmwareVersion',
      label: 'Firmware',
      sortable: true,
      render: (device) => device.firmwareVersion ?? 'Unknown',
    },
    {
      id: 'lastSeenAt',
      label: 'Last seen',
      sortable: true,
      render: (device) => formatDateTime(device.lastSeenAt),
    },
    {
      id: 'isActive',
      label: 'Status',
      sortable: true,
      render: (device) => <StatusBadge label={device.isActive ? 'Active' : 'Inactive'} variant={device.isActive ? 'success' : 'neutral'} />,
    },
    {
      id: 'hasSecretConfigured',
      label: 'Secret',
      align: 'center',
      render: (device) => <StatusBadge label={device.hasSecretConfigured ? 'Configured' : 'Missing'} variant={device.hasSecretConfigured ? 'info' : 'warning'} />,
    },
  ]), []);

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
        title="Devices"
        subtitle="Live device inventory with installation context, firmware and operability."
        actions={(
          <button className="primary-button" type="button" onClick={() => navigate('/devices/new')}>
            <Plus size={16} />
            <span>New</span>
          </button>
        )}
      />

      <FilterBar
        activeCount={isFilterBarOpen ? countActiveFilters(draftFilters) : countActiveFilters(appliedFilters)}
        isOpen={isFilterBarOpen}
        onToggle={() => setIsFilterBarOpen((current) => !current)}
        actions={(
          <>
            <button className="secondary-button" type="button" onClick={handleClearFilters}>Clean all</button>
            <button className="primary-button" type="button" onClick={handleApplyFilters}>Apply</button>
          </>
        )}
      >
        <div className="records-filters-grid">
          <label className="records-field">
            <span>Device code</span>
            <input type="text" value={draftFilters.code} onChange={(event) => setDraftFilters((current) => ({ ...current, code: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>Name</span>
            <input type="text" value={draftFilters.name} onChange={(event) => setDraftFilters((current) => ({ ...current, name: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>Serial number</span>
            <input type="text" value={draftFilters.serialNumber} onChange={(event) => setDraftFilters((current) => ({ ...current, serialNumber: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>Firmware version</span>
            <input type="text" value={draftFilters.firmwareVersion} onChange={(event) => setDraftFilters((current) => ({ ...current, firmwareVersion: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>Installation</span>
            <select value={draftFilters.installationId} onChange={(event) => setDraftFilters((current) => ({ ...current, installationId: event.target.value }))}>
              <option value="">All installations</option>
              {(installationsQuery.data ?? []).map((installation) => (
                <option key={installation.id} value={installation.id}>
                  {installation.name ?? installation.code ?? installation.id}
                </option>
              ))}
            </select>
          </label>

          <label className="records-field">
            <span>Active</span>
            <select value={draftFilters.isActive} onChange={(event) => setDraftFilters((current) => ({ ...current, isActive: event.target.value as DeviceFiltersDraft['isActive'] }))}>
              <option value="all">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>

          <label className="records-field">
            <span>Created from</span>
            <input type="date" value={draftFilters.createdAtFrom} onChange={(event) => setDraftFilters((current) => ({ ...current, createdAtFrom: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>Created to</span>
            <input type="date" value={draftFilters.createdAtTo} onChange={(event) => setDraftFilters((current) => ({ ...current, createdAtTo: event.target.value }))} />
          </label>
        </div>
      </FilterBar>

      <section className="panel-card records-card">
        <div className="records-card__toolbar">
          <div className="records-card__summary">
            <strong>Device inventory</strong>
            <p>Operational units, installation assignment and current authentication state.</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          emptyState={<EmptyState title="No devices found" description="Try adjusting the filters or clear them to broaden the search." />}
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
