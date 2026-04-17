import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Never';
  }

  return new Date(value).toLocaleString();
}

export function InstallationsPage() {
  const navigate = useNavigate();
  const { clientId: activeClientId } = useActiveClient();

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

  const columns = useMemo<DataTableColumn<InstallationListItem>[]>(() => ([
    {
      id: 'code',
      label: 'Code',
      sortable: true,
      render: (installation) => <span className="records-table__primary">{installation.code}</span>,
    },
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      render: (installation) => (
        <div className="records-table__stack">
          <span className="records-table__primary">{installation.name}</span>
          <span>{installation.description ?? 'No description'}</span>
        </div>
      ),
    },
    {
      id: 'location',
      label: 'Location',
      sortable: true,
      render: (installation) => installation.location ?? 'Unspecified',
    },
    {
      id: 'plantsCount',
      label: 'Plants',
      sortable: true,
      align: 'center',
      render: (installation) => String(installation.plantsCount),
    },
    {
      id: 'devicesCount',
      label: 'Devices',
      sortable: true,
      align: 'center',
      render: (installation) => String(installation.devicesCount),
    },
    {
      id: 'isActive',
      label: 'Status',
      sortable: true,
      render: (installation) => <StatusBadge label={installation.isActive ? 'Active' : 'Inactive'} variant={installation.isActive ? 'success' : 'neutral'} />,
    },
    {
      id: 'updatedAt',
      label: 'Updated',
      sortable: true,
      render: (installation) => formatDateTime(installation.updatedAt ?? installation.createdAt),
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
        title="Installations"
        subtitle="Operational locations with counts for plants and devices."
        actions={(
          <button className="primary-button" type="button" onClick={() => navigate('/installations/new')}>
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
            <span>Installation code</span>
            <input type="text" value={draftFilters.code} onChange={(event) => setDraftFilters((current) => ({ ...current, code: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>Name</span>
            <input type="text" value={draftFilters.name} onChange={(event) => setDraftFilters((current) => ({ ...current, name: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>Location</span>
            <input type="text" value={draftFilters.location} onChange={(event) => setDraftFilters((current) => ({ ...current, location: event.target.value }))} />
          </label>

          <label className="records-field">
            <span>Active</span>
            <select value={draftFilters.isActive} onChange={(event) => setDraftFilters((current) => ({ ...current, isActive: event.target.value as InstallationFiltersDraft['isActive'] }))}>
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
            <strong>Installation catalog</strong>
            <p>Current operational context with location and inventory counts.</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          emptyState={<EmptyState title="No installations found" description="Try adjusting the filters or clear them to broaden the search." />}
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
