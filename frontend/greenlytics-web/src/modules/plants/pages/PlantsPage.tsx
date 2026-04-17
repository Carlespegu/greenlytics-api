import { useQuery } from '@tanstack/react-query';
import { Columns3, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { postSearch } from '@/api/search';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { useActiveClient } from '@/modules/clients/hooks/ActiveClientContext';
import { plantsApi, type PlantListItem, type PlantSearchFiltersInput, type PlantSortField } from '@/modules/plants/api/plantsApi';
import { tableMetadataApi } from '@/modules/table-metadata/api/tableMetadataApi';
import { EmptyState } from '@/shared/components/EmptyState';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { ColumnSelectorModal } from '@/shared/ui/data-grid/ColumnSelectorModal';
import { DataTable, type DataTableColumn } from '@/shared/ui/data-grid/DataTable';
import { FilterBar } from '@/shared/ui/data-grid/FilterBar';
import { PaginationControls } from '@/shared/ui/data-grid/PaginationControls';
import { RecordsPageHeader } from '@/shared/ui/data-grid/RecordsPageHeader';
import type { SearchRequest, SortDirection } from '@/types/api';

type PlantFiltersDraft = {
  code: string;
  name: string;
  description: string;
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

const defaultFilters: PlantFiltersDraft = {
  code: '',
  name: '',
  description: '',
  installationId: '',
  isActive: 'all',
  createdAtFrom: '',
  createdAtTo: '',
};

const pageSizeOptions = [10, 20, 50, 100];

function buildPlantsRequest(
  filters: PlantFiltersDraft,
  page: number,
  pageSize: number,
  sortField: PlantSortField,
  sortDirection: SortDirection,
  activeClientId: string | null,
): SearchRequest<PlantSearchFiltersInput, PlantSortField> {
  return {
    filters: {
      code: filters.code.trim() || undefined,
      name: filters.name.trim() || undefined,
      description: filters.description.trim() || undefined,
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

function countActiveFilters(filters: PlantFiltersDraft) {
  return [
    filters.code,
    filters.name,
    filters.description,
    filters.installationId,
    filters.createdAtFrom,
    filters.createdAtTo,
    filters.isActive !== 'all' ? filters.isActive : '',
  ].filter(Boolean).length;
}

function resolveStatusVariant(status: string | null | undefined) {
  const normalizedStatus = (status ?? '').trim().toLowerCase();

  if (!normalizedStatus) {
    return 'neutral' as const;
  }

  if (normalizedStatus.includes('alert') || normalizedStatus.includes('risk')) {
    return 'warning' as const;
  }

  if (normalizedStatus.includes('healthy') || normalizedStatus.includes('stable') || normalizedStatus.includes('active')) {
    return 'success' as const;
  }

  return 'info' as const;
}

function readPlantField(plant: PlantListItem, fieldKey: string) {
  return (plant as unknown as Record<string, unknown>)[fieldKey];
}

export function PlantsPage() {
  const navigate = useNavigate();
  const { clientId: activeClientId } = useActiveClient();

  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<PlantFiltersDraft>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<PlantFiltersDraft>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortField, setSortField] = useState<PlantSortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const plantsRequest = useMemo(
    () => buildPlantsRequest(appliedFilters, page, pageSize, sortField, sortDirection, activeClientId),
    [activeClientId, appliedFilters, page, pageSize, sortDirection, sortField],
  );

  const plantsQuery = useQuery({
    queryKey: ['plants-search', plantsRequest],
    queryFn: () => plantsApi.search(plantsRequest),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const installationsQuery = useQuery({
    queryKey: ['plants-installation-options', activeClientId],
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

  const tableFieldsQuery = useQuery({
    queryKey: ['table-fields', 'plants'],
    queryFn: () => tableMetadataApi.getFields('plants'),
    staleTime: 300_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const renderers = useMemo<Record<string, DataTableColumn<PlantListItem>['render']>>(
    () => ({
      code: (plant) => <span className="records-table__primary">{plant.code}</span>,
      name: (plant) => (
        <div className="records-table__stack">
          <span className="records-table__primary">{plant.name}</span>
          <span>{plant.description ?? 'No description'}</span>
        </div>
      ),
      description: (plant) => plant.description ?? 'No description',
      installationName: (plant) => plant.installationName ?? 'Unassigned',
      plantTypeName: (plant) => plant.plantTypeName ?? 'Unspecified',
      plantStatusName: (plant) => <StatusBadge label={plant.plantStatusName ?? 'Unknown'} variant={resolveStatusVariant(plant.plantStatusName)} />,
      isActive: (plant) => <StatusBadge label={plant.isActive ? 'Active' : 'Inactive'} variant={plant.isActive ? 'success' : 'neutral'} />,
      thresholdsCount: (plant) => String(plant.thresholdsCount),
      eventsCount: (plant) => String(plant.eventsCount),
    }),
    [],
  );

  const [selectedColumnKeys, setSelectedColumnKeys] = useLocalStorageState<string[]>(
    'greenlytics:plants-table-columns',
    [],
  );

  const tableFields = useMemo(() => tableFieldsQuery.data ?? [], [tableFieldsQuery.data]);

  const effectiveSelectedColumnKeys = useMemo(() => {
    if (tableFields.length === 0) {
      return [];
    }

    const availableKeys = tableFields.map((field) => field.key);
    const storedKeys = selectedColumnKeys.filter((key) => availableKeys.includes(key));

    if (storedKeys.length > 0) {
      return storedKeys;
    }

    return tableFields.filter((field) => field.defaultVisible).map((field) => field.key);
  }, [selectedColumnKeys, tableFields]);

  const columns = useMemo<DataTableColumn<PlantListItem>[]>(() => (
    tableFields
      .filter((field) => effectiveSelectedColumnKeys.includes(field.key))
      .sort((left, right) => effectiveSelectedColumnKeys.indexOf(left.key) - effectiveSelectedColumnKeys.indexOf(right.key))
      .map((field) => ({
        id: field.key,
        label: field.label,
        sortable: field.sortable && (
          field.key === 'code'
          || field.key === 'name'
          || field.key === 'description'
          || field.key === 'installationName'
          || field.key === 'plantTypeName'
          || field.key === 'plantStatusName'
          || field.key === 'isActive'
        ),
        sortField: (
          field.key === 'code'
          || field.key === 'name'
          || field.key === 'description'
          || field.key === 'installationName'
          || field.key === 'plantTypeName'
          || field.key === 'plantStatusName'
          || field.key === 'isActive'
        ) ? field.key : undefined,
        render: renderers[field.key] ?? ((plant) => String(readPlantField(plant, field.key) ?? '-')),
      }))
  ), [effectiveSelectedColumnKeys, renderers, tableFields]);

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
    const normalizedField = nextField as PlantSortField;

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
        title="Plants"
        subtitle="Client-scoped plant inventory aligned with the new Plants backend contracts."
        actions={(
          <button className="primary-button" type="button" onClick={() => navigate('/plants/new')}>
            <Plus size={16} />
            <span>New</span>
          </button>
        )}
      />

      <FilterBar
        activeCount={activeFilterCount}
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
            <span>Plant code</span>
            <input
              type="text"
              value={draftFilters.code}
              onChange={(event) => setDraftFilters((current) => ({ ...current, code: event.target.value }))}
            />
          </label>

          <label className="records-field">
            <span>Name</span>
            <input
              type="text"
              value={draftFilters.name}
              onChange={(event) => setDraftFilters((current) => ({ ...current, name: event.target.value }))}
            />
          </label>

          <label className="records-field">
            <span>Description</span>
            <input
              type="text"
              value={draftFilters.description}
              onChange={(event) => setDraftFilters((current) => ({ ...current, description: event.target.value }))}
            />
          </label>

          <label className="records-field">
            <span>Installation</span>
            <select
              value={draftFilters.installationId}
              onChange={(event) => setDraftFilters((current) => ({ ...current, installationId: event.target.value }))}
            >
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
            <select
              value={draftFilters.isActive}
              onChange={(event) => setDraftFilters((current) => ({ ...current, isActive: event.target.value as PlantFiltersDraft['isActive'] }))}
            >
              <option value="all">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>

          <label className="records-field">
            <span>Created from</span>
            <input
              type="date"
              value={draftFilters.createdAtFrom}
              onChange={(event) => setDraftFilters((current) => ({ ...current, createdAtFrom: event.target.value }))}
            />
          </label>

          <label className="records-field">
            <span>Created to</span>
            <input
              type="date"
              value={draftFilters.createdAtTo}
              onChange={(event) => setDraftFilters((current) => ({ ...current, createdAtTo: event.target.value }))}
            />
          </label>
        </div>
      </FilterBar>

      <section className="panel-card records-card">
        <div className="records-card__toolbar">
          <div className="records-card__summary">
            <strong>Plants catalog</strong>
            <p>Sortable rows, client-aware filters and current plant operational context.</p>
          </div>

          <button
            className="records-column-trigger"
            disabled={tableFields.length === 0 && tableFieldsQuery.isLoading}
            type="button"
            onClick={() => setIsColumnModalOpen(true)}
          >
            <Columns3 size={16} />
            <span>Columns</span>
          </button>
        </div>

        <DataTable
          columns={columns}
          emptyState={<EmptyState title="No plants found" description="Try adjusting the filters or clear them to broaden the search." />}
          getRowKey={(plant) => plant.id}
          isLoading={plantsQuery.isLoading}
          items={plantsQuery.data?.items ?? []}
          sortDirection={sortDirection}
          sortField={sortField}
          onRowClick={(plant) => navigate(`/plants/${plant.id}`, { state: { fromPlantsList: true } })}
          onSortChange={handleSortChange}
        />

        <PaginationControls
          page={plantsQuery.data?.page ?? page}
          pageSize={plantsQuery.data?.pageSize ?? pageSize}
          totalItems={plantsQuery.data?.totalItems ?? 0}
          totalPages={plantsQuery.data?.totalPages ?? 0}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPageSizeChange={(nextPageSize) => {
            setPageSize(nextPageSize);
            setPage(1);
          }}
        />
      </section>

      <ColumnSelectorModal
        fields={tableFields.map((field) => ({ key: field.key, label: field.label }))}
        open={isColumnModalOpen}
        selectedKeys={effectiveSelectedColumnKeys}
        onClose={(nextSelectedKeys) => {
          setSelectedColumnKeys(nextSelectedKeys);
          setIsColumnModalOpen(false);
        }}
      />
    </div>
  );
}
