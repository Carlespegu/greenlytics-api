import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { postSearch } from '@/api/search';
import { useActiveClient } from '@/modules/clients/hooks/ActiveClientContext';
import { plantsApi } from '@/modules/plants/api/plantsApi';
import { isApiError } from '@/shared/api/errors';
import { RecordsPageHeader } from '@/shared/ui/data-grid/RecordsPageHeader';

type OptionItem = {
  id: string;
  code?: string;
  name?: string;
};

export function CreatePlantPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clientId: activeClientId } = useActiveClient();
  const [installationId, setInstallationId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    mutationFn: async () => {
      if (!activeClientId) {
        throw new Error('No active client selected.');
      }

      return plantsApi.create(activeClientId, {
        installationId,
        code,
        name,
        description: description.trim() || undefined,
        isActive,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['plants-search'] });
    },
  });

  async function handleSubmit() {
    setSubmitError(null);

    try {
      const result = await createPlantMutation.mutateAsync();
      navigate(`/plants/${result.id}`);
    } catch (error) {
      setSubmitError(isApiError(error) ? error.message : 'The plant could not be created.');
    }
  }

  return (
    <div className="module-page records-page records-page--create">
      <RecordsPageHeader
        className="records-page-header--sticky"
        title="Create plant"
        subtitle="Create flow aligned with the current client-scoped Plants backend."
        actions={(
          <button className="secondary-button" type="button" onClick={() => navigate('/plants/search')}>
            <ArrowLeft size={16} />
            <span>Back to plants</span>
          </button>
        )}
      />

      <section className="panel-card records-card records-card--create">
        <div className="records-filters-grid">
          <label className="records-field">
            <span>Installation</span>
            <select value={installationId} onChange={(event) => setInstallationId(event.target.value)}>
              <option value="">Select installation</option>
              {(installationsQuery.data ?? []).map((installation) => (
                <option key={installation.id} value={installation.id}>
                  {installation.name ?? installation.code ?? installation.id}
                </option>
              ))}
            </select>
          </label>

          <label className="records-field">
            <span>Code</span>
            <input type="text" value={code} onChange={(event) => setCode(event.target.value)} />
          </label>

          <label className="records-field">
            <span>Name</span>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label className="records-field records-field--full">
            <span>Description</span>
            <textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>

          <label className="records-field">
            <span>Status</span>
            <select value={isActive ? 'true' : 'false'} onChange={(event) => setIsActive(event.target.value === 'true')}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
        </div>

        {submitError ? <div className="create-plant-modal__message">{submitError}</div> : null}

        <div className="plant-create-v2__actions">
          <button className="secondary-button" type="button" onClick={() => navigate('/plants/search')}>
            Cancel
          </button>
          <button
            className="primary-button"
            type="button"
            disabled={!installationId || !code.trim() || !name.trim() || createPlantMutation.isPending}
            onClick={() => void handleSubmit()}
          >
            {createPlantMutation.isPending ? 'Creating plant...' : 'Create plant'}
          </button>
        </div>
      </section>
    </div>
  );
}
