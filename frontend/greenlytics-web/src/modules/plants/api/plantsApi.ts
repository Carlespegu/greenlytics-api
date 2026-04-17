import { postSearch } from '@/api/search';
import { httpClient } from '@/shared/api/httpClient';
import type { SearchRequest } from '@/types/api';

export interface PlantListItem {
  id: string;
  clientId: string;
  installationId: string;
  code: string;
  name: string;
  description: string | null;
  plantTypeId: string | null;
  plantStatusId: string | null;
  isActive: boolean;
  installationName: string | null;
  plantTypeName: string | null;
  plantStatusName: string | null;
  primaryPhotoUrl: string | null;
  thresholdsCount: number;
  eventsCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface PlantSearchFiltersInput {
  code?: string;
  name?: string;
  description?: string;
  clientId?: string;
  installationId?: string;
  plantTypeId?: string;
  plantStatusId?: string;
  isActive?: boolean;
  createdAtFrom?: string;
  createdAtTo?: string;
}

export type PlantSortField =
  | 'createdAt'
  | 'code'
  | 'name'
  | 'description'
  | 'installationName'
  | 'plantTypeName'
  | 'plantStatusName'
  | 'thresholdsCount'
  | 'eventsCount'
  | 'updatedAt'
  | 'isActive';

export type PlantSearchRequest = SearchRequest<PlantSearchFiltersInput, PlantSortField>;

export interface PlantPhotoRecord {
  id: string;
  plantId: string;
  photoTypeId: string | null;
  photoTypeCode: string | null;
  photoTypeName: string | null;
  fileName: string;
  fileUrl: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  createdByUserId: string | null;
}

export interface PlantThresholdRecord {
  id: string;
  plantId: string;
  readingTypeId: string;
  readingTypeCode: string | null;
  readingTypeName: string | null;
  unitTypeId: string | null;
  unitTypeCode: string | null;
  unitTypeName: string | null;
  minValue: number | null;
  maxValue: number | null;
  optimalValue: number | null;
  isActive: boolean;
  createdAt: string;
  createdByUserId: string | null;
  updatedAt: string | null;
  updatedByUserId: string | null;
}

export interface PlantEventRecord {
  id: string;
  clientId: string;
  plantId: string;
  eventTypeId: string;
  eventTypeCode: string | null;
  eventTypeName: string | null;
  title: string;
  description: string | null;
  notes: string | null;
  eventDate: string;
  isActive: boolean;
  createdAt: string;
  createdByUserId: string | null;
  updatedAt: string | null;
  updatedByUserId: string | null;
}

export interface PlantLatestReadingSummary {
  readingId: string;
  readAt: string;
  deviceId: string;
  deviceCode: string;
  source: string | null;
}

export interface AnalyzePlantPhotosResult {
  speciesName: string | null;
  confidence: number | null;
  healthStatus: string | null;
  observations: string | null;
  possibleIssues: string[];
  careRecommendations: string[];
}

interface AnalyzePlantPhotosInput {
  language?: string;
  leafImage?: File;
  trunkImage?: File;
  generalImage?: File;
}

export interface PlantDetail {
  id: string;
  clientId: string;
  clientCode: string | null;
  clientName: string | null;
  installationId: string;
  installationCode: string | null;
  installationName: string | null;
  code: string;
  name: string;
  description: string | null;
  plantTypeId: string | null;
  plantTypeCode: string | null;
  plantTypeName: string | null;
  plantStatusId: string | null;
  plantStatusCode: string | null;
  plantStatusName: string | null;
  isActive: boolean;
  primaryPhotoUrl: string | null;
  thresholdsCount: number;
  eventsCount: number;
  latestReading: PlantLatestReadingSummary | null;
  photos: PlantPhotoRecord[];
  thresholds: PlantThresholdRecord[];
  events: PlantEventRecord[];
  createdAt: string;
  createdByUserId: string | null;
  updatedAt: string | null;
  updatedByUserId: string | null;
}

export interface CreatePlantInput {
  installationId: string;
  code: string;
  name: string;
  description?: string;
  plantTypeId?: string;
  plantStatusId?: string;
  isActive?: boolean;
}

export interface CreatePlantWithPhotosResult {
  plantId: string;
  analysis: {
    species: string | null;
    healthStatus: string | null;
    confidence: number | null;
    insights: string | null;
    possibleIssues: string[];
    careRecommendations: string[];
  };
  photos: PlantPhotoRecord[];
}

export const plantsApi = {
  getById: (clientId: string, plantId: string) => httpClient.get<PlantDetail>(`/api/clients/${clientId}/plants/${plantId}`),
  search: (request: PlantSearchRequest) => postSearch<PlantListItem, PlantSearchFiltersInput, PlantSortField>('/api/plants/search', request),
  create: (clientId: string, input: CreatePlantInput) => httpClient.post<PlantDetail>(`/api/clients/${clientId}/plants`, input),
  analyzePhotos: async (input: AnalyzePlantPhotosInput): Promise<AnalyzePlantPhotosResult> => {
    const files = [input.leafImage, input.trunkImage, input.generalImage].filter((file): file is File => Boolean(file));
    const seed = files.map((file) => file.name).join(' ').toLowerCase();
    const suggestedSpecies = seed.includes('ficus')
      ? 'Ficus elastica'
      : seed.includes('monstera')
        ? 'Monstera deliciosa'
        : seed.includes('spath')
          ? 'Spathiphyllum wallisii'
          : 'Plant specimen';

    await new Promise((resolve) => setTimeout(resolve, 900));

    return {
      speciesName: suggestedSpecies,
      confidence: files.length === 3 ? 0.84 : 0.62,
      healthStatus: files.length === 3 ? 'healthy' : 'warning',
      observations: input.language === 'en'
        ? 'Visual review completed with the current frontend simulation flow.'
        : 'Revisio visual completada amb el flux de simulacio actual del frontend.',
      possibleIssues: files.length === 3 ? [] : ['incomplete_visual_input'],
      careRecommendations: [
        'Monitor substrate moisture before watering again.',
        'Maintain indirect bright light and stable humidity.',
      ],
    };
  },
};
