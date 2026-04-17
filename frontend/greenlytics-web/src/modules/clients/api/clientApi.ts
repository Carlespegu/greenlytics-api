import { postSearch } from '@/api/search';
import { httpClient } from '@/shared/api/httpClient';

interface ClientSearchFilters {
  name?: string;
}

export interface ClientOption {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

export const clientApi = {
  getById: (clientId: string) => httpClient.get<ClientOption>(`/api/clients/${clientId}`),
  searchByName: async (name: string) => {
    const response = await postSearch<ClientOption, ClientSearchFilters, 'name'>('/api/clients/search', {
      filters: {
        name: name.trim() || undefined,
      },
      pagination: {
        page: 1,
        pageSize: 20,
      },
      sort: {
        field: 'name',
        direction: 'asc',
      },
    });

    return response.items;
  },
};
