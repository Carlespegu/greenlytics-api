import type { SearchRequest, SearchResponse } from '@/types/api';
import { httpClient } from '@/shared/api/httpClient';

export function postSearch<TItem, TFilters, TSortField extends string = string>(path: string, request: SearchRequest<TFilters, TSortField>) {
  return httpClient.post<SearchResponse<TItem>>(path, request);
}
