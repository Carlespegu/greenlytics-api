import type { SearchResponse } from '@/types/api';

export interface ReadingValueRecord {
  readingTypeId: string;
  type: string;
  unit: string | null;
  value: number;
}

export interface ReadingSearchApiItem {
  readingId: string;
  clientId: string;
  deviceId: string;
  deviceCode: string | null;
  deviceName: string | null;
  installationId: string | null;
  installationCode: string | null;
  installationName: string | null;
  readAt: string;
  source: string | null;
  createdAt: string;
  values: ReadingValueRecord[];
}

export interface ReadingListItem {
  id: string;
  recordedAt: string | null;
  readAt: string | null;
  deviceId: string | null;
  deviceCode: string | null;
  deviceName: string | null;
  installationName: string | null;
  source: string | null;
  readingTypeName: string | null;
  readingTypeSummary: string | null;
  value: string | null;
  rawValues: ReadingValueRecord[];
}

function formatReadingValue(value: ReadingValueRecord) {
  return value.unit ? `${value.value} ${value.unit}` : `${value.value}`;
}

export function mapReadingSearchItem(item: ReadingSearchApiItem): ReadingListItem {
  const typeSummary = item.values.map((entry) => entry.type).join(', ');
  const valueSummary = item.values.map(formatReadingValue).join(' · ');

  return {
    id: item.readingId,
    recordedAt: item.readAt ?? null,
    readAt: item.readAt ?? null,
    deviceId: item.deviceId ?? null,
    deviceCode: item.deviceCode ?? null,
    deviceName: item.deviceName ?? null,
    installationName: item.installationName ?? null,
    source: item.source ?? null,
    readingTypeName: item.values[0]?.type ?? null,
    readingTypeSummary: typeSummary || null,
    value: valueSummary || null,
    rawValues: item.values,
  };
}

export function mapReadingSearchResponse(response: SearchResponse<ReadingSearchApiItem>): SearchResponse<ReadingListItem> {
  return {
    ...response,
    items: response.items.map(mapReadingSearchItem),
  };
}
