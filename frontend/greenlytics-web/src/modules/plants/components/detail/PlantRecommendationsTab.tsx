import { Bot, Sparkles, TriangleAlert } from 'lucide-react';

import type { PlantRecommendation } from '@/modules/plants/components/detail/plantDetailViewModel';
import { EmptyState } from '@/shared/components/EmptyState';
import { SectionHeading } from '@/shared/ui/SectionHeading';
import { StatusBadge } from '@/shared/ui/StatusBadge';

interface PlantRecommendationsTabProps {
  recommendations: PlantRecommendation[];
}

const sourceMeta = {
  'threshold-based': { label: 'Threshold-based', icon: <TriangleAlert size={15} /> },
  manual: { label: 'Manual', icon: <Sparkles size={15} /> },
  'rule-based': { label: 'Rule-based', icon: <Sparkles size={15} /> },
  'ai-generated': { label: 'AI-generated', icon: <Bot size={15} /> },
} as const;

export function PlantRecommendationsTab({ recommendations }: PlantRecommendationsTabProps) {
  return (
    <div className="plant-detail-v3__tab-stack">
      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title="Current recommendations"
          subtitle="Operational actions derived from the current plant detail, ready to evolve as backend logic grows."
        />
        {recommendations.length === 0 ? (
          <EmptyState title="No recommendations" description="No rule-based or manual recommendations are available yet." />
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
                    <span>Reason / evidence</span>
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
