export interface BackendValidationError {
  field: string;
  code: string;
  message: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string | null;
  errorCode: string | null;
  errors: BackendValidationError[] | null;
}

export interface PaginationInput {
  page: number;
  pageSize: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortInput<Field extends string = string> {
  field: Field;
  direction: SortDirection;
}

export interface SearchRequest<TFilters, TSortField extends string = string> {
  filters: TFilters;
  pagination: PaginationInput;
  sort: SortInput<TSortField>;
}

export interface SearchResponse<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
