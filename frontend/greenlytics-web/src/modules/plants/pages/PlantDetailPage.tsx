import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { postSearch } from '@/api/search';
import { useI18n } from '@/app/i18n/LanguageProvider';
import { useActiveClient } from '@/modules/clients/hooks/ActiveClientContext';
import { plantsApi, type PlantLatestReadingSummary } from '@/modules/plants/api/plantsApi';
import { PlantAlertsTab } from '@/modules/plants/components/detail/PlantAlertsTab';
import { PlantCareTab } from '@/modules/plants/components/detail/PlantCareTab';
import { PlantDetailHeader } from '@/modules/plants/components/detail/PlantDetailHeader';
import { PlantHistoryTab } from '@/modules/plants/components/detail/PlantHistoryTab';
import { PlantInstallationsTab } from '@/modules/plants/components/detail/PlantInstallationsTab';
import { PlantLatestVsIdealWidget } from '@/modules/plants/components/detail/PlantLatestVsIdealWidget';
import { PlantOverviewTab } from '@/modules/plants/components/detail/PlantOverviewTab';
import { PlantPhotosTab } from '@/modules/plants/components/detail/PlantPhotosTab';
import { PlantReadingsTab } from '@/modules/plants/components/detail/PlantReadingsTab';
import type { PlantReadingSample } from '@/modules/plants/components/detail/plantDetailViewModel';
import { buildPlantDetailViewModel } from '@/modules/plants/components/detail/plantDetailViewModel';
import { PlantReadingTrendWidget } from '@/modules/plants/components/detail/PlantReadingTrendWidget';
import { typesApi } from '@/modules/types/api/typesApi';
import { EmptyState } from '@/shared/components/EmptyState';
import { LoadingScreen } from '@/shared/ui/LoadingScreen';
import { Tabs } from '@/shared/ui/Tabs';
import type { SearchRequest } from '@/types/api';

const tabIds = ['basic-data', 'history', 'photos', 'care', 'readings', 'alerts', 'installations'] as const;
type DetailTabId = (typeof tabIds)[number];

type ReadingSearchFiltersInput = {
  clientId?: string;
  installationId?: string;
  dateFrom?: string;
  dateTo?: string;
};

type ReadingSortField = 'recordedAt';

function buildReadingsRequest(clientId: string, installationId: string): SearchRequest<ReadingSearchFiltersInput, ReadingSortField> {
  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(today.getDate() - 30);
  fromDate.setHours(0, 0, 0, 0);

  return {
    filters: {
      clientId,
      installationId,
      dateFrom: fromDate.toISOString(),
      dateTo: today.toISOString(),
    },
    pagination: {
      page: 1,
      pageSize: 250,
    },
    sort: {
      field: 'recordedAt',
      direction: 'desc',
    },
  };
}

export function PlantDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { plantId } = useParams();
  const { clientId: activeClientId } = useActiveClient();
  const { locale, t } = useI18n();
  const [activeTab, setActiveTab] = useState<DetailTabId>('basic-data');

  const plantDetailQuery = useQuery({
    queryKey: ['plant-detail', activeClientId, plantId],
    enabled: Boolean(activeClientId && plantId),
    queryFn: () => plantsApi.getById(activeClientId!, plantId!),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const readingsQuery = useQuery({
    queryKey: ['plant-detail-readings', activeClientId, plantDetailQuery.data?.installationId],
    enabled: Boolean(activeClientId && plantDetailQuery.data?.installationId),
    queryFn: () => postSearch<PlantReadingSample, ReadingSearchFiltersInput, ReadingSortField>(
      '/api/readings/search',
      buildReadingsRequest(activeClientId!, plantDetailQuery.data!.installationId),
    ),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const readingTypesQuery = useQuery({
    queryKey: ['reading-type-options'],
    queryFn: () => typesApi.getOptions('ReadingType'),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const plant = plantDetailQuery.data;
  const viewModel = useMemo(
    () => (plant ? buildPlantDetailViewModel(plant, readingsQuery.data?.items ?? [], t, locale) : null),
    [locale, plant, readingsQuery.data?.items, t],
  );
  const tabItems = useMemo(
    () => tabIds.map((id) => ({ id, label: t(`plantDetail.${id}`) })),
    [t],
  );

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
        <EmptyState title={t('plantDetail.notFoundTitle')} description={t('plantDetail.notFoundDescription')} />
      </div>
    );
  }

  return (
    <div className="module-page plant-detail-v3">
      <PlantDetailHeader
        headerPhoto={viewModel.headerPhoto}
        plant={plant}
        onBack={handleBackToList}
      >
        <section className="plant-detail-v3__widgets">
          <PlantLatestVsIdealWidget metrics={viewModel.latestVsIdealMetrics} />
          <PlantReadingTrendWidget
            readingTypeOptions={readingTypesQuery.data ?? []}
            series={viewModel.trendSeries}
          />
        </section>
      </PlantDetailHeader>

      <section className="panel-card plant-detail-v3__tabs-card plant-detail-v3__tabs-card--nav">
        <Tabs activeTab={activeTab} items={[...tabItems]} onChange={(tab) => setActiveTab(tab as DetailTabId)} />
      </section>

      <main className="plant-detail-v3__content">
        {activeTab === 'basic-data' ? (
          <PlantOverviewTab
            plant={plant}
            updatedLabel={viewModel.updatedLabel}
          />
        ) : null}

        {activeTab === 'history' ? <PlantHistoryTab entries={viewModel.historyEntries} /> : null}
        {activeTab === 'photos' ? <PlantPhotosTab photos={plant.photos} plantName={plant.name} primaryPhotoUrl={plant.primaryPhotoUrl} /> : null}
        {activeTab === 'care' ? <PlantCareTab plant={plant} /> : null}
        {activeTab === 'readings' ? <PlantReadingsTab plant={plant} metrics={viewModel.readingsMetrics} /> : null}
        {activeTab === 'alerts' ? <PlantAlertsTab recommendations={viewModel.recommendations} /> : null}
        {activeTab === 'installations' ? (
          <PlantInstallationsTab
            plant={{
              ...plant,
              latestReading: readingsQuery.data?.items?.[0]
                ? ({
                  readingId: readingsQuery.data.items[0].id,
                  readAt: readingsQuery.data.items[0].recordedAt ?? readingsQuery.data.items[0].readAt ?? plant.latestReading?.readAt ?? '',
                  deviceId: readingsQuery.data.items[0].deviceId ?? plant.latestReading?.deviceId ?? '',
                  deviceCode: readingsQuery.data.items[0].deviceCode ?? readingsQuery.data.items[0].deviceName ?? plant.latestReading?.deviceCode ?? '',
                  source: readingsQuery.data.items[0].source ?? plant.latestReading?.source ?? null,
                } satisfies PlantLatestReadingSummary)
                : plant.latestReading,
            }}
            onViewInstallation={() => navigate(`/installations/${plant.installationId}`)}
          />
        ) : null}
      </main>
    </div>
  );
}
