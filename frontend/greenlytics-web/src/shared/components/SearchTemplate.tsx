import type { ReactNode } from 'react';
import type { SearchResponse } from '@/types/api';

import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';

interface SearchTemplateProps<TItem> {
  title: string;
  description: string;
  filtersSummary: string;
  data: SearchResponse<TItem>;
  columns: Array<{ key: keyof TItem; label: string }>;
  primaryAction?: ReactNode;
}

export function SearchTemplate<TItem extends Record<string, unknown>>({ title, description, filtersSummary, data, columns, primaryAction }: SearchTemplateProps<TItem>) {
  const hasItems = data.items.length > 0;

  return (
    <div className="module-page">
      <PageHeader title={title} description={description} actions={primaryAction} />
      <section className="panel-card search-layout">
        <div className="search-toolbar">
          <div>
            <strong>POST search contract ready</strong>
            <p className="card-muted">{filtersSummary}</p>
          </div>
          <div className="badge">Page {data.page} / {Math.max(data.totalPages, 1)}</div>
        </div>
        {hasItems ? (
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>{columns.map((column) => <th key={String(column.key)}>{column.label}</th>)}</tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={index}>{columns.map((column) => <td key={String(column.key)}>{String(item[column.key] ?? '-')}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No data loaded yet" description="This page is scaffolded and ready to bind to the V3 POST search contract with filters, pagination and sorting." />
        )}
      </section>
    </div>
  );
}
