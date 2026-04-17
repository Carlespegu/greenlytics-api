import { postSearch } from '@/api/search';
import type { SearchRequest } from '@/types/api';

export interface DeviceListItem {
  id: string;
  clientId: string;
  installationId: string;
  deviceTypeId: string;
  code: string;
  name: string;
  serialNumber: string | null;
  firmwareVersion: string | null;
  lastSeenAt: string | null;
  lastAuthenticatedAt: string | null;
  isActive: boolean;
  hasSecretConfigured: boolean;
  installationName: string | null;
  deviceTypeName: string | null;
  latestReadingAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface DeviceSearchFiltersInput {
  code?: string;
  name?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  clientId?: string;
  installationId?: string;
  deviceTypeId?: string;
  isActive?: boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
}

export type DeviceSortField =
  | 'code'
  | 'name'
  | 'serialNumber'
  | 'firmwareVersion'
  | 'installationName'
  | 'deviceTypeName'
  | 'lastSeenAt'
  | 'lastAuthenticatedAt'
  | 'latestReadingAt'
  | 'isActive'
  | 'updatedAt';

export type DeviceSearchRequest = SearchRequest<DeviceSearchFiltersInput, DeviceSortField>;

export const devicesApi = {
  search: (request: DeviceSearchRequest) =>
    postSearch<DeviceListItem, DeviceSearchFiltersInput, DeviceSortField>('/api/devices/search', request),
};
