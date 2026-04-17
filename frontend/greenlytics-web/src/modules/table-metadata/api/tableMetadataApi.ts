import { httpClient } from '@/shared/api/httpClient';

export interface TableFieldMetadata {
  key: string;
  label: string;
  dataType: string;
  sortable: boolean;
  defaultVisible: boolean;
}

export const tableMetadataApi = {
  getFields: (tableName: string) => httpClient.get<TableFieldMetadata[]>(`/api/table-metadata/${tableName}`),
};
