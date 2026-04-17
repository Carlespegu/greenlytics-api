import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { postSearch } from '@/api/search';
import { useActiveClient } from '@/modules/clients/hooks/ActiveClientContext';
import { plantsApi, type CreatePlantWithPhotosResult } from '@/modules/plants/api/plantsApi';
import { PlantCreateWizard } from '@/modules/plants/components/create/PlantCreateWizard';
import type { CreatePlantSubmitInput, OptionItem } from '@/modules/plants/types/plant.types';
import { isApiError } from '@/shared/api/errors';
import { RecordsPageHeader } from '@/shared/ui/data-grid/RecordsPageHeader';

export function CreatePlantPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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

  const createPlantMutation = useMutation({
    mutationFn: async (input: CreatePlantSubmitInput): Promise<CreatePlantWithPhotosResult> => {
      if (!activeClientId) {
        throw new Error('No active client selected.');
      }

      if (!input.installationId) {
        throw new Error('Installation is required to create a plant.');
      }

      const detail = await plantsApi.create(activeClientId, {
        installationId: input.installationId,
        code: input.code,
        name: input.name,
        description: input.notes?.trim() || input.commonName?.trim() || input.scientificName?.trim() || undefined,
        plantTypeId: input.plantTypeId || undefined,
        isActive: true,
      });

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

      throw new Error('The plant could not be created.');
    }
  }

  return (
    <div className="module-page records-page records-page--create">
      <RecordsPageHeader
        className="records-page-header--sticky"
        title="Create plant"
        subtitle="Recovered guided flow for plant onboarding, with the current V3 backend as the source of truth."
        actions={(
          <button className="secondary-button" type="button" onClick={() => navigate('/plants/search')}>
            <ArrowLeft size={16} />
            <span>Back to plants</span>
          </button>
        )}
      />

      <section className="panel-card records-card records-card--create">
        <PlantCreateWizard
          open
          installations={installationsQuery.data ?? []}
          installationsLoading={installationsQuery.isLoading}
          plantTypes={[]}
          plantingTypes={[]}
          locationTypes={[]}
          catalogsLoading={false}
          onClose={() => navigate('/plants/search')}
          onSubmit={handleSubmit}
        />
      </section>
    </div>
  );
}
