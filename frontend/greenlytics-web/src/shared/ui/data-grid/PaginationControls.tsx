interface PaginationControlsProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export function PaginationControls({
  page,
  pageSize,
  totalItems,
  totalPages,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: PaginationControlsProps) {
  const safeTotalPages = Math.max(totalPages, 1);
  const pageNumbers = Array.from({ length: safeTotalPages }, (_, index) => index + 1);
  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="records-pagination">
      <div className="records-pagination__summary">
        <span>Showing {startItem}-{endItem} of {totalItems}</span>
      </div>

      <div className="records-pagination__controls">
        <label className="records-pagination__field">
          <span>Rows</span>
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <label className="records-pagination__field">
          <span>Page</span>
          <select value={page} onChange={(event) => onPageChange(Number(event.target.value))}>
            {pageNumbers.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <div className="records-pagination__buttons">
          <button disabled={page <= 1} type="button" onClick={() => onPageChange(page - 1)}>Previous</button>
          <button disabled={page >= safeTotalPages} type="button" onClick={() => onPageChange(page + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
