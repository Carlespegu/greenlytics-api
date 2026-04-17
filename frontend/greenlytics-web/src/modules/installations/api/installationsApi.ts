import { postSearch } from '@/api/search';
import type { SearchRequest } from '@/types/api';

export interface InstallationListItem {
  id: string;
  clientId: string;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  isActive: boolean;
  plantsCount: number;
  devicesCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface InstallationSearchFiltersInput {
  code?: string;
  name?: string;
  location?: string;
  clientId?: string;
  isActive?: boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
}

export type InstallationSortField =
  | 'code'
  | 'name'
  | 'location'
  | 'isActive'
  | 'plantsCount'
  | 'devicesCount'
  | 'createdAt'
  | 'updatedAt';

export type InstallationSearchRequest = SearchRequest<InstallationSearchFiltersInput, InstallationSortField>;

export const installationsApi = {
  search: (request: InstallationSearchRequest) =>
    postSearch<InstallationListItem, InstallationSearchFiltersInput, InstallationSortField>('/api/installations/search', request),
};
