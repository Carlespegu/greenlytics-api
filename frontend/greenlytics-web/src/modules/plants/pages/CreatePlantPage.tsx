import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { postSearch } from '@/api/search';
import { useI18n } from '@/app/i18n/LanguageProvider';
import { useActiveClient } from '@/modules/clients/hooks/ActiveClientContext';
import { plantsApi, type CreatePlantWithPhotosResult } from '@/modules/plants/api/plantsApi';
import { PlantCreateWizard } from '@/modules/plants/components/create/PlantCreateWizard';
import { findOptionByTokens, parameterMetricDefinitions } from '@/modules/plants/helpers/parameterMetrics';
import type { CreatePlantSubmitInput, OptionItem } from '@/modules/plants/types/plant.types';
import { typesApi } from '@/modules/types/api/typesApi';
import { isApiError } from '@/shared/api/errors';
import { RecordsPageHeader } from '@/shared/ui/data-grid/RecordsPageHeader';

export function CreatePlantPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { clientId: activeClientId } = useActiveClient();

  const installationsQuery = useQuery({
    queryKey: ['plants-create-installation-options', activeClientId],
    enabled: Boolean(activeClientId),
    queryFn: async () => {
      const response = await postSearch<OptionItem, { clientId: string }, 'name'>('/api/installations/search', {
        filters: { clientId: activeClientId! },
        pagination: { page: 1, pageSize: 100 },
        sort: { field: 'name', direction: 'asc' },
      });

      return response.items;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const plantTypesQuery = useQuery({
    queryKey: ['plant-type-options'],
    queryFn: async () => {
      const response = await typesApi.getOptions('PlantType');
      return response.map((option) => ({ id: option.id, code: option.code, name: option.name } satisfies OptionItem));
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const readingTypesQuery = useQuery({
    queryKey: ['reading-type-options'],
    queryFn: async () => {
      const response = await typesApi.getOptions('ReadingType');
      return response.map((option) => ({ id: option.id, code: option.code, name: option.name } satisfies OptionItem));
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const unitTypesQuery = useQuery({
    queryKey: ['unit-type-options'],
    queryFn: async () => {
      const response = await typesApi.getOptions('UnitType');
      return response.map((option) => ({ id: option.id, code: option.code, name: option.name } satisfies OptionItem));
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const createPlantMutation = useMutation({
    mutationFn: async (input: CreatePlantSubmitInput): Promise<CreatePlantWithPhotosResult> => {
      if (!activeClientId) {
        throw new Error(t('plantCreate.noActiveClient'));
      }

      if (!input.installationId) {
        throw new Error(t('plantCreate.installationRequiredCreate'));
      }

      const detail = await plantsApi.create(activeClientId, {
        installationId: input.installationId,
        code: input.code,
        name: input.name,
        description: input.notes?.trim() || input.commonName?.trim() || input.scientificName?.trim() || undefined,
        plantTypeId: input.plantTypeId || undefined,
        isActive: true,
      });

      const readingTypes = readingTypesQuery.data ?? [];
      const unitTypes = unitTypesQuery.data ?? [];
      const thresholdRequests = parameterMetricDefinitions
        .map((metric) => {
          const readingType = findOptionByTokens(readingTypes, metric.readingTokens);
          if (!readingType) {
            return null;
          }

          const minRaw = input[metric.minField];
          const maxRaw = input[metric.maxField];
          const minValue = parseOptionalNumber(minRaw);
          const maxValue = parseOptionalNumber(maxRaw);
          const optimalValue = minValue !== null && maxValue !== null
            ? Number(((minValue + maxValue) / 2).toFixed(2))
            : null;
          const unitType = findOptionByTokens(unitTypes, metric.unitTokens);

          if (minValue === null && maxValue === null && optimalValue === null) {
            return null;
          }

          return {
            readingTypeId: readingType.id,
            unitTypeId: unitType?.id,
            minValue,
            maxValue,
            optimalValue,
            isActive: true,
          };
        })
        .filter((request): request is NonNullable<typeof request> => Boolean(request));

      for (const thresholdRequest of thresholdRequests) {
        await plantsApi.createThreshold(activeClientId, detail.id, thresholdRequest);
      }

      return {
        plantId: detail.id,
        analysis: {
          species: input.scientificName?.trim() || null,
          healthStatus: null,
          confidence: null,
          insights: input.notes?.trim() || null,
          possibleIssues: [],
          careRecommendations: [],
        },
        photos: [],
      };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['plants-search'] });
    },
  });

  async function handleSubmit(input: CreatePlantSubmitInput) {
    try {
      return await createPlantMutation.mutateAsync(input);
    } catch (error) {
      if (isApiError(error)) {
        throw error;
      }

      throw new Error(t('plantCreate.genericCreateError'));
    }
  }

  return (
    <div className="module-page records-page records-page--create">
      <RecordsPageHeader
        className="records-page-header--sticky"
        title={t('plantCreate.pageTitle')}
        subtitle={t('plantCreate.pageSubtitle')}
        actions={(
          <button className="secondary-button" type="button" onClick={() => navigate('/plants/search')}>
            <ArrowLeft size={16} />
            <span>{t('plantCreate.backToPlants')}</span>
          </button>
        )}
      />

      <section className="panel-card records-card records-card--create">
        <PlantCreateWizard
          open
          clientId={activeClientId}
          installations={installationsQuery.data ?? []}
          installationsLoading={installationsQuery.isLoading}
          plantTypes={plantTypesQuery.data ?? []}
          plantingTypes={[]}
          locationTypes={[]}
          catalogsLoading={plantTypesQuery.isLoading}
          onClose={() => navigate('/plants/search')}
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}

function parseOptionalNumber(value: string | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
