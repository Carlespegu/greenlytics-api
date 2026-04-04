function buildVisiblePages(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
  if (currentPage <= 4) return [1, 2, 3, 4, 5, 'ellipsis', totalPages]
  if (currentPage >= totalPages - 3) return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  return [1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages]
}

export default function CompactPagination({
  page,
  pageSize,
  total,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize))
  const visiblePages = buildVisiblePages(page, totalPages)

  return (
    <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600">Files</label>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Pàgina anterior"
          title="Pàgina anterior"
        >
          ‹
        </button>

        {visiblePages.map((pageItem, index) =>
          pageItem === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-sm text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={pageItem}
              onClick={() => onPageChange(pageItem)}
              disabled={isLoading}
              className={[
                'inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-medium transition',
                pageItem === page
                  ? 'text-white shadow-sm'
                  : 'border border-transparent bg-white text-slate-600 hover:bg-slate-50',
              ].join(' ')}
              style={pageItem === page ? { backgroundColor: 'var(--brand-primary)' } : undefined}
            >
              {pageItem}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Pàgina següent"
          title="Pàgina següent"
        >
          ›
        </button>
      </div>
    </div>
  )
}
