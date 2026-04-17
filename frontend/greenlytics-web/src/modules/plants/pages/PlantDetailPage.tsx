import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useActiveClient } from '@/modules/clients/hooks/ActiveClientContext';
import { plantsApi } from '@/modules/plants/api/plantsApi';
import { PlantCareTab } from '@/modules/plants/components/detail/PlantCareTab';
import { PlantDetailAside } from '@/modules/plants/components/detail/PlantDetailAside';
import { PlantDetailHeader } from '@/modules/plants/components/detail/PlantDetailHeader';
import { PlantHistoryTab } from '@/modules/plants/components/detail/PlantHistoryTab';
import { PlantOverviewTab } from '@/modules/plants/components/detail/PlantOverviewTab';
import { PlantPhotosTab } from '@/modules/plants/components/detail/PlantPhotosTab';
import { PlantReadingsTab } from '@/modules/plants/components/detail/PlantReadingsTab';
import { PlantRecommendationsTab } from '@/modules/plants/components/detail/PlantRecommendationsTab';
import { PlantSummaryCards } from '@/modules/plants/components/detail/PlantSummaryCards';
import { buildPlantDetailViewModel } from '@/modules/plants/components/detail/plantDetailViewModel';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';
import { Tabs } from '@/shared/ui/Tabs';

const tabItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'care', label: 'Care' },
  { id: 'photos', label: 'Photos' },
  { id: 'readings', label: 'Readings' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'history', label: 'History' },
] as const;

type DetailTabId = (typeof tabItems)[number]['id'];

export function PlantDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { plantId } = useParams();
  const { clientId: activeClientId } = useActiveClient();
  const [activeTab, setActiveTab] = useState<DetailTabId>('overview');

  const plantDetailQuery = useQuery({
    queryKey: ['plant-detail', activeClientId, plantId],
    enabled: Boolean(activeClientId && plantId),
    queryFn: () => plantsApi.getById(activeClientId!, plantId!),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const plant = plantDetailQuery.data;
  const viewModel = useMemo(() => (plant ? buildPlantDetailViewModel(plant) : null), [plant]);

  function handleBackToList() {
    if ((location.state as { fromPlantsList?: boolean } | null)?.fromPlantsList) {
      navigate(-1);
      return;
    }

    navigate('/plants/search');
  }

  if (plantDetailQuery.isLoading) {
    return <LoadingScreen />;
  }

  if (!plant || !viewModel) {
    return (
      <div className="module-page plant-detail-v3">
        <EmptyState title="Plant not found" description="The requested plant detail is not available in the current client scope." />
      </div>
    );
  }

  return (
    <div className="module-page plant-detail-v3">
      <PlantDetailHeader
        plant={plant}
        primaryPhotoUrl={viewModel.primaryPhoto?.fileUrl ?? plant.primaryPhotoUrl}
        onBack={handleBackToList}
        onOpenCare={() => setActiveTab('care')}
        onOpenHistory={() => setActiveTab('history')}
        onOpenPhotos={() => setActiveTab('photos')}
        onViewInstallation={() => navigate(`/installations/${plant.installationId}`)}
      />

      <PlantSummaryCards cards={viewModel.summaryCards} />

      <div className="plant-detail-v3__layout">
        <main className="plant-detail-v3__main">
          <section className="panel-card plant-detail-v3__tabs-card">
            <Tabs activeTab={activeTab} items={[...tabItems]} onChange={(tab) => setActiveTab(tab as DetailTabId)} />
          </section>

          {activeTab === 'overview' ? (
            <PlantOverviewTab
              plant={plant}
              lastEventLabel={viewModel.lastEventLabel}
              lastPhotoLabel={viewModel.lastPhotoLabel}
              lastReadingLabel={viewModel.lastReadingLabel}
              updatedLabel={viewModel.updatedLabel}
            />
          ) : null}

          {activeTab === 'care' ? <PlantCareTab plant={plant} thresholdMap={viewModel.thresholdMap} /> : null}
          {activeTab === 'photos' ? <PlantPhotosTab photos={plant.photos} /> : null}
          {activeTab === 'readings' ? <PlantReadingsTab metrics={viewModel.readingsMetrics} plant={plant} /> : null}
          {activeTab === 'recommendations' ? <PlantRecommendationsTab recommendations={viewModel.recommendations} /> : null}
          {activeTab === 'history' ? <PlantHistoryTab entries={viewModel.historyEntries} /> : null}
        </main>

        <PlantDetailAside
          nextCareAction={viewModel.nextCareAction}
          plant={plant}
          topRecommendation={viewModel.recommendations[0] ?? null}
        />
      </div>
    </div>
  );
}
