import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useActiveClient } from '@/modules/clients/hooks/ActiveClientContext';
import { plantsApi } from '@/modules/plants/api/plantsApi';
import { PlantDetailHeader } from '@/modules/plants/components/detail/PlantDetailHeader';
import { PlantPhotoTimeline, type PlantPhotoTimelineEntry } from '@/modules/plants/components/detail/PlantPhotoTimeline';
import { PlantSummarySection } from '@/modules/plants/components/detail/PlantSummarySection';
import { Tabs } from '@/shared/ui/Tabs';

export function PlantDetailPage() {
  const { plantId } = useParams();
  const { clientId: activeClientId } = useActiveClient();
  const [activeTab, setActiveTab] = useState('summary');

  const plantDetailQuery = useQuery({
    queryKey: ['plant-detail', activeClientId, plantId],
    enabled: Boolean(activeClientId && plantId),
    queryFn: () => plantsApi.getById(activeClientId!, plantId!),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const plant = plantDetailQuery.data;

  const facts = useMemo(() => [
    { label: 'Client', value: plant?.clientName ?? 'No client' },
    { label: 'Installation', value: plant?.installationName ?? 'No installation' },
    { label: 'Plant type', value: plant?.plantTypeName ?? 'No plant type' },
    { label: 'Plant status', value: plant?.plantStatusName ?? 'No plant status' },
    { label: 'Thresholds', value: String(plant?.thresholdsCount ?? 0) },
    { label: 'Events', value: String(plant?.eventsCount ?? 0) },
  ], [plant]);

  const timelineEntries = useMemo<PlantPhotoTimelineEntry[]>(
    () =>
      (plant?.photos ?? []).map((photo) => ({
        id: photo.id,
        date: new Date(photo.createdAt).toLocaleString(),
        title: photo.photoTypeName ?? photo.fileName,
        summary: photo.isPrimary ? 'Primary photo' : 'Plant photo',
        images: [photo.fileUrl],
      })),
    [plant?.photos],
  );

  return (
    <div className="module-page plant-detail-page">
      <PlantDetailHeader
        code={plant?.code ?? plantId ?? 'unknown-plant'}
        installation={plant?.installationName ?? plant?.installationCode ?? 'Unassigned'}
        title={plant?.name ?? 'Plant detail'}
      />

      <div className="detail-stack">
        <PlantSummarySection facts={facts} notes={plant?.description ?? 'No description available.'} />

        <section className="panel-card">
          <Tabs
            activeTab={activeTab}
            items={[
              { id: 'summary', label: 'Summary' },
              { id: 'photos', label: 'Photo history' },
              { id: 'thresholds', label: 'Thresholds' },
              { id: 'events', label: 'Events' },
            ]}
            onChange={setActiveTab}
          />
        </section>

        {activeTab === 'summary' ? (
          <section className="panel-card">
            <div className="section-heading">
              <div>
                <strong>Operational summary</strong>
                <p>Current plant status, latest reading context and primary photo.</p>
              </div>
            </div>
            <div className="detail-grid">
              <article className="detail-item">
                <span>Active</span>
                <strong>{plant?.isActive ? 'Yes' : 'No'}</strong>
              </article>
              <article className="detail-item">
                <span>Latest reading</span>
                <strong>{plant?.latestReading ? new Date(plant.latestReading.readAt).toLocaleString() : 'No readings'}</strong>
              </article>
              <article className="detail-item">
                <span>Latest device</span>
                <strong>{plant?.latestReading?.deviceCode ?? 'No device'}</strong>
              </article>
              <article className="detail-item">
                <span>Primary photo</span>
                <strong>{plant?.primaryPhotoUrl ? 'Configured' : 'Not configured'}</strong>
              </article>
            </div>
          </section>
        ) : null}

        {activeTab === 'photos' ? <PlantPhotoTimeline entries={timelineEntries} /> : null}

        {activeTab === 'thresholds' ? (
          <section className="panel-card">
            <div className="section-heading">
              <div>
                <strong>Thresholds</strong>
                <p>Configured reading thresholds for this plant.</p>
              </div>
            </div>
            <div className="detail-grid">
              {(plant?.thresholds ?? []).length === 0 ? <p className="card-muted">No thresholds configured yet.</p> : null}
              {(plant?.thresholds ?? []).map((threshold) => (
                <article className="detail-item" key={threshold.id}>
                  <span>{threshold.readingTypeName ?? threshold.readingTypeCode ?? 'Threshold'}</span>
                  <strong>
                    Min {threshold.minValue ?? '-'} / Opt {threshold.optimalValue ?? '-'} / Max {threshold.maxValue ?? '-'} {threshold.unitTypeCode ?? ''}
                  </strong>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeTab === 'events' ? (
          <section className="panel-card">
            <div className="section-heading">
              <div>
                <strong>Events</strong>
                <p>Business events registered for this plant.</p>
              </div>
            </div>
            <div className="detail-grid">
              {(plant?.events ?? []).length === 0 ? <p className="card-muted">No events registered yet.</p> : null}
              {(plant?.events ?? []).map((event) => (
                <article className="detail-item detail-item--wide" key={event.id}>
                  <span>{event.eventTypeName ?? event.eventTypeCode ?? 'Event'} · {new Date(event.eventDate).toLocaleDateString()}</span>
                  <strong>{event.title}</strong>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
