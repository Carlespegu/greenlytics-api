import { BellRing } from 'lucide-react';

import { useI18n } from '@/app/i18n/LanguageProvider';
import type { PlantRecommendation } from '@/modules/plants/components/detail/plantDetailViewModel';
import { EmptyState } from '@/shared/components/EmptyState';
import { SectionHeading } from '@/shared/ui/SectionHeading';
import { StatusBadge } from '@/shared/ui/StatusBadge';

interface PlantAlertsTabProps {
  recommendations: PlantRecommendation[];
}

export function PlantAlertsTab({ recommendations }: PlantAlertsTabProps) {
  const { t } = useI18n();
  const alertEntries = recommendations.filter((item) => item.tone === 'warning' || item.tone === 'danger');

  return (
    <div className="plant-detail-v3__tab-stack">
      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title={t('plantDetail.alertsTitle')}
          subtitle={t('plantDetail.alertsSubtitle')}
        />

        {alertEntries.length === 0 ? (
          <EmptyState
            title={t('plantDetail.noAlertsTitle')}
            description={t('plantDetail.noAlertsDescription')}
          />
        ) : (
          <div className="plant-detail-v3__recommendation-list">
            {alertEntries.map((recommendation) => (
              <article className="plant-detail-v3__recommendation-card" key={recommendation.id}>
                <div className="plant-detail-v3__recommendation-head">
                  <div>
                    <strong>{recommendation.title}</strong>
                    <p>{recommendation.reason}</p>
                  </div>
                  <StatusBadge label={resolveSourceLabel(recommendation.source, t)} variant={recommendation.tone} />
                </div>
                <div className="plant-detail-v3__recommendation-meta">
                  <span>{t('plantDetail.alertReasonLabel')}</span>
                  <strong>{recommendation.reason}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel-card plant-detail-v3__section-card">
        <div className="plant-detail-v3__context-card">
          <span className="plant-detail-v3__care-icon"><BellRing size={18} /></span>
          <div>
            <strong>{t('plantDetail.futureAlertsHookTitle')}</strong>
            <p>{t('plantDetail.futureAlertsHookDescription')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function resolveSourceLabel(
  source: PlantRecommendation['source'],
  t: (key: string) => string,
) {
  switch (source) {
    case 'threshold-based':
      return t('plantDetail.thresholdSource');
    case 'manual':
      return t('plantDetail.manualSource');
    case 'ai-generated':
      return t('plantDetail.aiGeneratedSource');
    default:
      return t('plantDetail.ruleBasedSource');
  }
}
