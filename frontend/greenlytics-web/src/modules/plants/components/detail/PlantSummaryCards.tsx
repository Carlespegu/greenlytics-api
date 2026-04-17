import { Activity, BellRing, Camera, ClipboardList, HeartPulse, Waves } from 'lucide-react';

import type { PlantKpiCard } from '@/modules/plants/components/detail/plantDetailViewModel';
import { StatusBadge } from '@/shared/ui/StatusBadge';

const iconMap = {
  status: HeartPulse,
  'last-reading': Waves,
  alerts: BellRing,
  'next-action': ClipboardList,
  photos: Camera,
  events: Activity,
} as const;

interface PlantSummaryCardsProps {
  cards: PlantKpiCard[];
}

export function PlantSummaryCards({ cards }: PlantSummaryCardsProps) {
  return (
    <section className="plant-detail-v3__summary-strip">
      {cards.map((card) => {
        const Icon = iconMap[card.id as keyof typeof iconMap] ?? ClipboardList;

        return (
          <article className="panel-card plant-detail-v3__summary-card" key={card.id}>
            <div className="plant-detail-v3__summary-card-header">
              <span className="plant-detail-v3__summary-icon"><Icon size={18} /></span>
              <StatusBadge label={card.label} variant={card.tone} />
            </div>
            <strong>{card.value}</strong>
            <p>{card.hint}</p>
          </article>
        );
      })}
    </section>
  );
}
