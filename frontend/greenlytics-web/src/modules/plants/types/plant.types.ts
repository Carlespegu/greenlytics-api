import type { CreatePlantWithPhotosResult } from '@/modules/plants/api/plantsApi';

export type OptionItem = {
  id: string;
  code?: string;
  name?: string;
};

export type CreateMode = 'manual' | 'ai';

export type PhotoSlotKey = 'leaf' | 'stem' | 'general';

export type PlantDraft = {
  code: string;
  name: string;
  installationId: string;
  plantTypeId: string;
  plantingTypeId: string;
  locationTypeId: string;
  scientificName: string;
  commonName: string;
  notes: string;
  lightExposureCode: string;
  lightExposureLabel: string;
  soilType: string;
  fertilizer: string;
  soilMoistureMin: string;
  soilMoistureMax: string;
  airHumidityMin: string;
  airHumidityMax: string;
  temperatureMin: string;
  temperatureMax: string;
  lightMin: string;
  lightMax: string;
};

export type PlantPhotoDraft = {
  id: string;
  file: File;
  previewUrl: string;
  slot: PhotoSlotKey;
};

export type AiSimulationPhase = 'idle' | 'preparing' | 'sending' | 'analyzing' | 'completed';

export type PlantAiProposal = {
  confidence: number | null;
  code: string | null;
  name: string | null;
  scientificName: string | null;
  commonName: string | null;
  notes: string | null;
  lightExposureCode: string;
  lightExposureLabel: string;
  soilType: string;
  fertilizer: string;
  soilMoistureMin: string;
  soilMoistureMax: string;
  airHumidityMin: string;
  airHumidityMax: string;
  temperatureMin: string;
  temperatureMax: string;
  lightMin: string;
  lightMax: string;
  floweringMonths: number[];
  fertilizationSeasons: string[];
};

export type CreatePlantSubmitInput = {
  code: string;
  name: string;
  installationId?: string;
  plantTypeId?: string;
  plantingTypeId?: string;
  locationTypeId?: string;
  commonName?: string;
  scientificName?: string;
  notes?: string;
  photos?: File[];
  leafImage?: File;
  trunkImage?: File;
  generalImage?: File;
};

export type CreatePlantModalProps = {
  open: boolean;
  clientId: string | null;
  installations: OptionItem[];
  plantTypes: OptionItem[];
  plantingTypes: OptionItem[];
  locationTypes: OptionItem[];
  installationsLoading?: boolean;
  catalogsLoading?: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePlantSubmitInput) => Promise<CreatePlantWithPhotosResult>;
};
