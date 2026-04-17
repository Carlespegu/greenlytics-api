import { Bot, Sparkles, TriangleAlert } from 'lucide-react';

import { useI18n } from '@/app/i18n/LanguageProvider';
import type { PlantRecommendation } from '@/modules/plants/components/detail/plantDetailViewModel';
import { EmptyState } from '@/shared/components/EmptyState';
import { SectionHeading } from '@/shared/ui/SectionHeading';
import { StatusBadge } from '@/shared/ui/StatusBadge';

interface PlantRecommendationsTabProps {
  recommendations: PlantRecommendation[];
}

export function PlantRecommendationsTab({ recommendations }: PlantRecommendationsTabProps) {
  const { t } = useI18n();
  const sourceMeta = {
    'threshold-based': { label: t('plantDetail.sourceThresholdBased'), icon: <TriangleAlert size={15} /> },
    manual: { label: t('plantDetail.sourceManual'), icon: <Sparkles size={15} /> },
    'rule-based': { label: t('plantDetail.sourceRuleBased'), icon: <Sparkles size={15} /> },
    'ai-generated': { label: t('plantDetail.sourceAiGenerated'), icon: <Bot size={15} /> },
  } as const;

  return (
    <div className="plant-detail-v3__tab-stack">
      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title={t('plantDetail.currentRecommendations')}
          subtitle={t('plantDetail.currentRecommendationsSubtitle')}
        />
        {recommendations.length === 0 ? (
          <EmptyState title={t('plantDetail.noRecommendations')} description={t('plantDetail.noRecommendationsDescription')} />
        ) : (
          <div className="plant-detail-v3__recommendation-list">
            {recommendations.map((recommendation) => {
              const source = sourceMeta[recommendation.source];

              return (
                <article className="plant-detail-v3__recommendation-card" key={recommendation.id}>
                  <div className="plant-detail-v3__recommendation-head">
                    <div>
                      <strong>{recommendation.title}</strong>
                      <p>{recommendation.reason}</p>
                    </div>
                    <StatusBadge label={source.label} variant={recommendation.tone} icon={source.icon} />
                  </div>
                  <div className="plant-detail-v3__recommendation-meta">
                    <span>{t('plantDetail.reasonEvidence')}</span>
                    <strong>{recommendation.reason}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
