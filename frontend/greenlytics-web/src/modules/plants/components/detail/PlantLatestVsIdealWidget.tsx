import { Gauge } from 'lucide-react';

import { useI18n } from '@/app/i18n/LanguageProvider';
import type { PlantLatestVsIdealMetric } from '@/modules/plants/components/detail/plantDetailViewModel';
import { EmptyState } from '@/shared/components/EmptyState';
import { SectionHeading } from '@/shared/ui/SectionHeading';
import { StatusBadge } from '@/shared/ui/StatusBadge';

interface PlantLatestVsIdealWidgetProps {
  metrics: PlantLatestVsIdealMetric[];
}

export function PlantLatestVsIdealWidget({ metrics }: PlantLatestVsIdealWidgetProps) {
  const { t } = useI18n();

  return (
    <section className="panel-card plant-detail-v3__widget-card">
      <SectionHeading
        title={t('plantDetail.latestVsIdealTitle')}
        subtitle={t('plantDetail.latestVsIdealSubtitle')}
      />

      {metrics.length === 0 ? (
        <EmptyState
          title={t('plantDetail.noThresholdMetricsTitle')}
          description={t('plantDetail.noThresholdMetricsDescription')}
        />
      ) : (
        <div className="plant-detail-v3__comparison-list">
          {metrics.map((metric) => (
            <article className="plant-detail-v3__comparison-card" key={metric.id}>
              <div className="plant-detail-v3__comparison-head">
                <div>
                  <span>{metric.label}</span>
                  <strong>{metric.latestValueLabel}</strong>
                </div>
                <StatusBadge label={resolveStateLabel(metric.state, t)} variant={metric.tone} />
              </div>

              <div className="plant-detail-v3__comparison-meta">
                <span>{t('plantDetail.idealRange')}</span>
                <strong>{metric.idealLabel}</strong>
              </div>

              <div className="plant-detail-v3__comparison-scale">
                {metric.idealStart !== null && metric.idealEnd !== null ? (
                  <span
                    className="plant-detail-v3__comparison-ideal-band"
                    style={{
                      left: `${Math.min(metric.idealStart, metric.idealEnd)}%`,
                      width: `${Math.max(Math.abs(metric.idealEnd - metric.idealStart), 2)}%`,
                    }}
                  />
                ) : null}

                {metric.optimalPosition !== null ? (
                  <span
                    className="plant-detail-v3__comparison-optimal-line"
                    style={{ left: `${metric.optimalPosition}%` }}
                  />
                ) : null}

                {metric.markerPosition !== null ? (
                  <span
                    className="plant-detail-v3__comparison-marker"
                    style={{ left: `${metric.markerPosition}%` }}
                    title={metric.latestValueLabel}
                  />
                ) : null}
              </div>

              <div className="plant-detail-v3__comparison-foot">
                <div className="plant-detail-v3__comparison-reading-meta">
                  <Gauge size={16} />
                  <span>{metric.latestTimestampLabel}</span>
                </div>
                <span>{metric.deviceLabel}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function resolveStateLabel(
  state: PlantLatestVsIdealMetric['state'],
  t: (key: string) => string,
) {
  switch (state) {
    case 'below':
      return t('plantDetail.belowIdeal');
    case 'above':
      return t('plantDetail.aboveIdeal');
    case 'within':
      return t('plantDetail.withinIdeal');
    default:
      return t('plantDetail.pendingMetric');
  }
}
