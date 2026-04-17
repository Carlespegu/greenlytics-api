import { useState } from 'react';
import { Activity, CalendarRange, RadioTower } from 'lucide-react';

import type { PlantDetail } from '@/modules/plants/api/plantsApi';
import type { PlantReadingsMetric } from '@/modules/plants/components/detail/plantDetailViewModel';
import { EmptyState } from '@/shared/components/EmptyState';
import { SectionHeading } from '@/shared/ui/SectionHeading';
import { StatusBadge } from '@/shared/ui/StatusBadge';

interface PlantReadingsTabProps {
  plant: PlantDetail;
  metrics: PlantReadingsMetric[];
}

const rangeOptions = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
] as const;

export function PlantReadingsTab({ plant, metrics }: PlantReadingsTabProps) {
  const [range, setRange] = useState<(typeof rangeOptions)[number]['id']>('7d');

  return (
    <div className="plant-detail-v3__tab-stack">
      <section className="plant-detail-v3__readings-grid">
        {metrics.map((metric) => (
          <article className="panel-card plant-detail-v3__reading-card" key={metric.id}>
            <div className="plant-detail-v3__reading-card-header">
              <span>{metric.label}</span>
              <StatusBadge label={metric.tone === 'neutral' ? 'Pending' : 'Tracked'} variant={metric.tone} />
            </div>
            <strong>{metric.value}</strong>
            <p>{metric.hint}</p>
          </article>
        ))}
      </section>

      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title="Charts and trends"
          subtitle="The layout is ready for time-series charts once the plant detail view consumes readings timeseries."
          action={(
            <div className="plant-detail-v3__range-selector">
              {rangeOptions.map((item) => (
                <button
                  key={item.id}
                  className={`plant-detail-v3__range-chip${range === item.id ? ' plant-detail-v3__range-chip--active' : ''}`}
                  type="button"
                  onClick={() => setRange(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        />
        <div className="plant-detail-v3__chart-placeholder">
          <div>
            <CalendarRange size={18} />
            <strong>{range} trend window</strong>
          </div>
          <p>
            Current backend detail exposes only the latest reading summary for the plant. Connect this section next to
            readings search and timeseries endpoints to render real charts.
          </p>
        </div>
      </section>

      <section className="plant-detail-v3__tab-columns">
        <section className="panel-card plant-detail-v3__section-card">
          <SectionHeading
            title="Recent readings"
            subtitle="Latest telemetry available today in plant context."
          />
          {plant.latestReading ? (
            <div className="plant-detail-v3__simple-table">
              <div className="plant-detail-v3__simple-row">
                <span>Reading timestamp</span>
                <strong>{new Intl.DateTimeFormat('ca-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(plant.latestReading.readAt))}</strong>
              </div>
              <div className="plant-detail-v3__simple-row">
                <span>Device</span>
                <strong>{plant.latestReading.deviceCode}</strong>
              </div>
              <div className="plant-detail-v3__simple-row">
                <span>Source</span>
                <strong>{plant.latestReading.source ?? 'Not provided'}</strong>
              </div>
            </div>
          ) : (
            <EmptyState title="No recent readings" description="This plant detail still has no telemetry summary attached." />
          )}
        </section>

        <section className="panel-card plant-detail-v3__section-card">
          <SectionHeading
            title="Context"
            subtitle="Operational bridge between the plant and installation/device context."
          />
          <div className="plant-detail-v3__context-card-list">
            <article className="plant-detail-v3__context-card">
              <RadioTower size={18} />
              <div>
                <strong>Device name</strong>
                <p>{plant.latestReading?.deviceCode ?? 'No device associated through plant detail yet.'}</p>
              </div>
            </article>
            <article className="plant-detail-v3__context-card">
              <Activity size={18} />
              <div>
                <strong>Last seen</strong>
                <p>{plant.latestReading ? new Intl.DateTimeFormat('ca-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(plant.latestReading.readAt)) : 'Pending installation/device context.'}</p>
              </div>
            </article>
          </div>
        </section>
      </section>
    </div>
  );
}
