import { useCallback, useState } from 'react';

import { plantsApi, type AnalyzePlantPhotosResult } from '@/modules/plants/api/plantsApi';
import { getSunExposureLabel } from '@/modules/plants/helpers/sunExposure';
import type { AiSimulationPhase, PhotoSlotKey, PlantAiProposal, PlantDraft, PlantPhotoDraft } from '@/modules/plants/types/plant.types';

const defaultLightExposureCode = 'indoor_bright_indirect_light';

const defaultCareProfile = {
  lightExposureCode: defaultLightExposureCode,
  lightExposureLabel: getSunExposureLabel(defaultLightExposureCode),
  soilType: 'Substrat organic, amb bon drenatge i retencio moderada',
  fertilizer: 'Fertilitzant liquid equilibrat cada 2-3 setmanes',
  soilMoistureMin: '38',
  soilMoistureMax: '62',
  airHumidityMin: '50',
  airHumidityMax: '75',
  temperatureMin: '18',
  temperatureMax: '28',
  lightMin: '2500',
  lightMax: '9000',
  floweringMonths: [3, 4, 5, 6],
  fertilizationSeasons: ['spring', 'summer'],
} satisfies Omit<PlantAiProposal, 'confidence' | 'code' | 'name' | 'scientificName' | 'commonName' | 'notes'>;

export const defaultAiProposal: PlantAiProposal = {
  confidence: null,
  code: null,
  name: null,
  scientificName: null,
  commonName: null,
  notes: null,
  ...defaultCareProfile,
};

function buildCodeBase(source: string) {
  const normalized = source
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase();

  return normalized.split('-').filter(Boolean).slice(0, 2).join('-') || 'PLANT';
}

function titleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(' ');
}

function deriveCommonName(speciesName: string | null) {
  if (!speciesName) {
    return null;
  }

  const primaryToken = speciesName.split(/\s+/)[0];
  return titleCase(primaryToken);
}

function buildCode(draft: PlantDraft, speciesName: string | null) {
  if (draft.code.trim()) {
    return draft.code.trim();
  }

  const base = buildCodeBase(speciesName ?? draft.name ?? 'plant');
  return `PLT-${base}-001`;
}

function buildProposalFromAnalysis(draft: PlantDraft, analysis: AnalyzePlantPhotosResult): PlantAiProposal {
  const scientificName = analysis.speciesName?.trim() || null;
  const commonName = draft.commonName.trim() || deriveCommonName(scientificName);
  const normalizedNotes = analysis.observations?.trim() || null;
  const name = draft.name.trim() || commonName || scientificName || 'Planta analitzada';

  return {
    confidence: analysis.confidence,
    code: buildCode(draft, scientificName),
    name,
    scientificName,
    commonName,
    notes: normalizedNotes,
    ...defaultCareProfile,
  };
}

function mergeDraftWithProposal(draft: PlantDraft, proposal: PlantAiProposal): PlantDraft {
  return {
    ...draft,
    code: draft.code || proposal.code || '',
    name: draft.name || proposal.name || '',
    scientificName: draft.scientificName || proposal.scientificName || '',
    commonName: draft.commonName || proposal.commonName || '',
    notes: draft.notes || proposal.notes || '',
    lightExposureCode: draft.lightExposureCode || proposal.lightExposureCode,
    lightExposureLabel: draft.lightExposureLabel || proposal.lightExposureLabel,
    soilType: draft.soilType || proposal.soilType,
    fertilizer: draft.fertilizer || proposal.fertilizer,
    soilMoistureMin: draft.soilMoistureMin || proposal.soilMoistureMin,
    soilMoistureMax: draft.soilMoistureMax || proposal.soilMoistureMax,
    airHumidityMin: draft.airHumidityMin || proposal.airHumidityMin,
    airHumidityMax: draft.airHumidityMax || proposal.airHumidityMax,
    temperatureMin: draft.temperatureMin || proposal.temperatureMin,
    temperatureMax: draft.temperatureMax || proposal.temperatureMax,
    lightMin: draft.lightMin || proposal.lightMin,
    lightMax: draft.lightMax || proposal.lightMax,
  };
}

export function usePlantAiSimulation(clientId: string | null) {
  const [phase, setPhase] = useState<AiSimulationPhase>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [proposal, setProposal] = useState<PlantAiProposal>(defaultAiProposal);
  const [isRunning, setIsRunning] = useState(false);

  const reset = useCallback(() => {
    setPhase('idle');
    setLog([]);
    setProposal(defaultAiProposal);
    setIsRunning(false);
  }, []);

  const run = useCallback(async (
    currentDraft: PlantDraft,
    photosBySlot: Record<PhotoSlotKey, PlantPhotoDraft | null>,
  ) => {
    setIsRunning(true);
    setPhase('preparing');
    setLog(['Preparant payload amb les 3 vistes requerides...']);

    try {
      setPhase('sending');
      setLog((current) => [...current, 'Enviant les fotos al backend per a l analisi...']);

      if (!clientId) {
        throw new Error('No active client selected for AI analysis.');
      }

      const analysis = await plantsApi.analyzePhotos({
        clientId,
        language: 'ca',
        leafImage: photosBySlot.leaf?.file,
        trunkImage: photosBySlot.stem?.file,
        generalImage: photosBySlot.general?.file,
      });

      setPhase('analyzing');
      setLog((current) => [...current, 'Processant la resposta i preparant la proposta editable...']);

      const nextProposal = buildProposalFromAnalysis(currentDraft, analysis);

      setPhase('completed');
      setLog((current) => [...current, 'Analisi completada. Ja pots revisar i ajustar la proposta.']);
      setProposal(nextProposal);

      return {
        draft: mergeDraftWithProposal(currentDraft, nextProposal),
        floweringMonths: nextProposal.floweringMonths,
        fertilizationSeasons: nextProposal.fertilizationSeasons,
        proposal: nextProposal,
      };
    } finally {
      setIsRunning(false);
    }
  }, [clientId]);

  return {
    phase,
    log,
    proposal,
    isRunning,
    reset,
    run,
  };
}
