import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { useI18n } from '@/app/i18n/LanguageProvider';
import { plantsApi, type PlantDetail } from '@/modules/plants/api/plantsApi';
import { PlantParametersStep } from '@/modules/plants/components/create/PlantParametersStep';
import { findOptionByTokens, findThresholdByMetric, parameterMetricDefinitions } from '@/modules/plants/helpers/parameterMetrics';
import type { OptionItem, PlantDraft } from '@/modules/plants/types/plant.types';
import { typesApi } from '@/modules/types/api/typesApi';
import { SectionHeading } from '@/shared/ui/SectionHeading';

interface PlantCareTabProps {
  plant: PlantDetail;
}

const emptyDraft: PlantDraft = {
  code: '',
  name: '',
  installationId: '',
  plantTypeId: '',
  plantingTypeId: '',
  locationTypeId: '',
  scientificName: '',
  commonName: '',
  notes: '',
  lightExposureCode: '',
  lightExposureLabel: '',
  soilType: '',
  fertilizer: '',
  soilMoistureMin: '',
  soilMoistureMax: '',
  airHumidityMin: '',
  airHumidityMax: '',
  temperatureMin: '',
  temperatureMax: '',
  lightMin: '',
  lightMax: '',
};

export function PlantCareTab({ plant }: PlantCareTabProps) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<PlantDraft>(buildDraftFromPlant(plant));
  const [floweringMonths, setFloweringMonths] = useState<number[]>([]);
  const [fertilizationSeasons, setFertilizationSeasons] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraft(buildDraftFromPlant(plant));
    setFloweringMonths(plant.floweringMonths ?? []);
    setFertilizationSeasons(plant.fertilizationSeasons ?? []);
    setMessage(null);
  }, [plant]);

  const readingTypesQuery = useQuery({
    queryKey: ['plant-parameter-reading-types'],
    queryFn: async () => {
      const response = await typesApi.getOptions('ReadingType');
      return response.map((option) => ({ id: option.id, code: option.code, name: option.name } satisfies OptionItem));
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const unitTypesQuery = useQuery({
    queryKey: ['plant-parameter-unit-types'],
    queryFn: async () => {
      const response = await typesApi.getOptions('UnitType');
      return response.map((option) => ({ id: option.id, code: option.code, name: option.name } satisfies OptionItem));
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const readingTypes = readingTypesQuery.data ?? [];
      const unitTypes = unitTypesQuery.data ?? [];

      for (const metric of parameterMetricDefinitions) {
        const threshold = findThresholdByMetric(plant.thresholds, metric);
        const readingType = threshold
          ? { id: threshold.readingTypeId, code: threshold.readingTypeCode ?? undefined, name: threshold.readingTypeName ?? undefined }
          : findOptionByTokens(readingTypes, metric.readingTokens);

        if (!readingType) {
          continue;
        }

        const minValue = parseOptionalNumber(draft[metric.minField]);
        const maxValue = parseOptionalNumber(draft[metric.maxField]);
        const existingOptimal = threshold?.optimalValue ?? null;
        const optimalValue = existingOptimal ?? (minValue !== null && maxValue !== null ? Number(((minValue + maxValue) / 2).toFixed(2)) : null);
        const unitType = threshold?.unitTypeId
          ? { id: threshold.unitTypeId }
          : findOptionByTokens(unitTypes, metric.unitTokens);

        const payload = {
          readingTypeId: readingType.id,
          unitTypeId: unitType?.id,
          minValue,
          maxValue,
          optimalValue,
          isActive: threshold?.isActive ?? true,
        };

        if (threshold) {
          await plantsApi.updateThreshold(plant.clientId, plant.id, threshold.id, payload);
        } else if (minValue !== null || maxValue !== null || optimalValue !== null) {
          await plantsApi.createThreshold(plant.clientId, plant.id, payload);
        }
      }

      await plantsApi.update(plant.clientId, plant.id, {
        lightExposureCode: draft.lightExposureCode || undefined,
        lightExposureLabel: draft.lightExposureLabel || undefined,
        soilType: draft.soilType.trim() || undefined,
        fertilizer: draft.fertilizer.trim() || undefined,
        floweringMonths,
        fertilizationSeasons,
      });
    },
    onSuccess: async () => {
      setMessage('Paràmetres guardats correctament.');
      await queryClient.invalidateQueries({ queryKey: ['plant-detail', plant.clientId, plant.id] });
    },
    onError: () => {
      setMessage('No s’han pogut guardar els paràmetres.');
    },
  });

  const thresholdsCount = useMemo(
    () => parameterMetricDefinitions.filter((metric) => {
      const minValue = draft[metric.minField];
      const maxValue = draft[metric.maxField];
      return Boolean(minValue || maxValue);
    }).length,
    [draft],
  );

  function setDraftField<K extends keyof PlantDraft>(field: K, value: PlantDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setMessage(null);
  }

  return (
    <div className="plant-detail-v3__tab-stack">
      <section className="plant-detail-v3__parameters-summary">
        <SectionHeading
          title="Paràmetres de la planta"
          subtitle="Mateix esquema operatiu que al pas d’alta: edita els rangs que sí tenen backend i deixa preparada la resta de context agronòmic."
        />

        <div className="plant-detail-v3__context-card-list">
          <article className="plant-detail-v3__context-card">
            <div>
              <strong>{t('plantDetail.thresholdsCount')}</strong>
              <p>{`${thresholdsCount} rangs editables disponibles ara mateix.`}</p>
            </div>
          </article>
          <article className="plant-detail-v3__context-card">
            <div>
              <strong>Persistència actual</strong>
              <p>Els llindars, l’exposició lumínica, el tipus de sòl, el fertilitzant, la floració i la temporada de fertilització es guarden al backend.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="plant-detail-v3__parameters-panel">
        {plant.thresholds.length === 0 && !readingTypesQuery.isLoading ? (
          <div className="plant-detail-v3__inline-empty">
            <strong>Encara no hi ha paràmetres definits</strong>
            <p>Configura els primers rangs ideals perquè la planta tingui una línia base comparable amb les lectures.</p>
          </div>
        ) : null}

        <PlantParametersStep
          draft={draft}
          floweringMonths={floweringMonths}
          fertilizationSeasons={fertilizationSeasons}
          onChange={setDraftField}
          onFloweringMonthsChange={setFloweringMonths}
          onFertilizationSeasonsChange={setFertilizationSeasons}
        />

        <div className="plant-detail-v3__parameter-actions">
          {message ? <p className="plant-detail-v3__parameter-message">{message}</p> : <span />}
          <button
            className="primary-button"
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || readingTypesQuery.isLoading || unitTypesQuery.isLoading}
          >
            {mutation.isPending ? 'Guardant...' : 'Guardar paràmetres'}
          </button>
        </div>
      </section>
    </div>
  );
}

function buildDraftFromPlant(plant: PlantDetail): PlantDraft {
  const nextDraft = {
    ...emptyDraft,
    lightExposureCode: plant.lightExposureCode ?? '',
    lightExposureLabel: plant.lightExposureLabel ?? '',
    soilType: plant.soilType ?? '',
    fertilizer: plant.fertilizer ?? '',
  };

  for (const metric of parameterMetricDefinitions) {
    const threshold = findThresholdByMetric(plant.thresholds, metric);
    if (!threshold) {
      continue;
    }

    nextDraft[metric.minField] = threshold.minValue?.toString() ?? '';
    nextDraft[metric.maxField] = threshold.maxValue?.toString() ?? '';
  }

  return nextDraft;
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
