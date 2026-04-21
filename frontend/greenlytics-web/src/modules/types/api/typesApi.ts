import { httpClient } from '@/shared/api/httpClient';

export interface TypeOption {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export const typesApi = {
  getOptions: (category: string) => httpClient.get<TypeOption[]>(`/api/types/options?category=${encodeURIComponent(category)}`),
};
