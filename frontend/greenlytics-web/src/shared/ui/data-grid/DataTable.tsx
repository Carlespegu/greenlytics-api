import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import type { SortDirection } from '@/types/api';

export interface DataTableColumn<TItem> {
  id: string;
  label: string;
  render: (item: TItem) => ReactNode;
  sortable?: boolean;
  sortField?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<TItem> {
  columns: DataTableColumn<TItem>[];
  items: TItem[];
  sortDirection: SortDirection;
  sortField: string;
  emptyState: ReactNode;
  isLoading?: boolean;
  getRowKey: (item: TItem) => string;
  onRowClick?: (item: TItem) => void;
  onSortChange?: (field: string) => void;
}

export function DataTable<TItem>({
  columns,
  items,
  sortDirection,
  sortField,
  emptyState,
  isLoading,
  getRowKey,
  onRowClick,
  onSortChange,
}: DataTableProps<TItem>) {
  if (isLoading) {
    return <div className="records-table__empty"><div className="empty-state"><h3>Loading data</h3><p>Fetching the latest records for this client scope.</p></div></div>;
  }

  if (items.length === 0) {
    return <div className="records-table__empty">{emptyState}</div>;
  }

  return (
    <div className="records-table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => {
              const columnSortField = column.sortField ?? column.id;
              const isSorted = columnSortField === sortField;

              return (
                <th className={`records-table__head records-table__head--${column.align ?? 'left'}`} key={column.id} scope="col">
                  {column.sortable && onSortChange ? (
                    <button className="records-table__sort" type="button" onClick={() => onSortChange(columnSortField)}>
                      <span>{column.label}</span>
                      {isSorted ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} />
                      )}
                    </button>
                  ) : (
                    <span className="records-table__label">{column.label}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              className={onRowClick ? 'records-table__row records-table__row--interactive' : 'records-table__row'}
              key={getRowKey(item)}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
            >
              {columns.map((column) => (
                <td className={`records-table__cell records-table__cell--${column.align ?? 'left'}`} key={column.id}>
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
