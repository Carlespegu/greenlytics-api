import { useState } from 'react';
import { Activity, CalendarRange, RadioTower } from 'lucide-react';

import { useI18n } from '@/app/i18n/LanguageProvider';
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
  const { locale, t } = useI18n();
  const [range, setRange] = useState<(typeof rangeOptions)[number]['id']>('7d');

  const formatDateTime = (value: string) => (
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  );

  return (
    <div className="plant-detail-v3__tab-stack">
      <section className="plant-detail-v3__readings-grid">
        {metrics.map((metric) => (
          <article className="panel-card plant-detail-v3__reading-card" key={metric.id}>
            <div className="plant-detail-v3__reading-card-header">
              <span>{metric.label}</span>
              <StatusBadge label={metric.tone === 'neutral' ? t('plantDetail.pending') : t('plantDetail.tracked')} variant={metric.tone} />
            </div>
            <strong>{metric.value}</strong>
            <p>{metric.hint}</p>
          </article>
        ))}
      </section>

      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title={t('plantDetail.chartsAndTrends')}
          subtitle={t('plantDetail.chartsAndTrendsSubtitle')}
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
            <strong>{t('plantDetail.trendWindow', { range })}</strong>
          </div>
          <p>{t('plantDetail.chartsPlaceholder')}</p>
        </div>
      </section>

      <section className="plant-detail-v3__tab-columns">
        <section className="panel-card plant-detail-v3__section-card">
          <SectionHeading
            title={t('plantDetail.recentReadings')}
            subtitle={t('plantDetail.recentReadingsSubtitle')}
          />
          {plant.latestReading ? (
            <div className="plant-detail-v3__simple-table">
              <div className="plant-detail-v3__simple-row">
                <span>{t('plantDetail.readingTimestamp')}</span>
                <strong>{formatDateTime(plant.latestReading.readAt)}</strong>
              </div>
              <div className="plant-detail-v3__simple-row">
                <span>{t('plantDetail.device')}</span>
                <strong>{plant.latestReading.deviceCode}</strong>
              </div>
              <div className="plant-detail-v3__simple-row">
                <span>{t('plantDetail.source')}</span>
                <strong>{plant.latestReading.source ?? t('plantDetail.notProvided')}</strong>
              </div>
            </div>
          ) : (
            <EmptyState title={t('plantDetail.noRecentReadings')} description={t('plantDetail.noRecentReadingsDescription')} />
          )}
        </section>

        <section className="panel-card plant-detail-v3__section-card">
          <SectionHeading
            title={t('plantDetail.context')}
            subtitle={t('plantDetail.contextSubtitle')}
          />
          <div className="plant-detail-v3__context-card-list">
            <article className="plant-detail-v3__context-card">
              <RadioTower size={18} />
              <div>
                <strong>{t('plantDetail.deviceName')}</strong>
                <p>{plant.latestReading?.deviceCode ?? t('plantDetail.noDeviceContext')}</p>
              </div>
            </article>
            <article className="plant-detail-v3__context-card">
              <Activity size={18} />
              <div>
                <strong>{t('plantDetail.lastSeen')}</strong>
                <p>{plant.latestReading ? formatDateTime(plant.latestReading.readAt) : t('plantDetail.pendingDeviceContext')}</p>
              </div>
            </article>
          </div>
        </section>
      </section>
    </div>
  );
}
