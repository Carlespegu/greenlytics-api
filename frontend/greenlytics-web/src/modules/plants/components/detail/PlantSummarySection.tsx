import { PlantFactsGrid } from '@/modules/plants/components/shared/PlantFactsGrid';

interface PlantSummarySectionProps {
  facts: Array<{ label: string; value: string }>;
  notes: string;
}

export function PlantSummarySection({ facts, notes }: PlantSummarySectionProps) {
  return (
    <section className="panel-card">
      <div className="section-heading">
        <div>
          <strong>Plant summary</strong>
          <p>Consult the core botanical information and current operator notes.</p>
        </div>
      </div>
      <PlantFactsGrid facts={facts} />
      <article className="detail-item detail-item--wide">
        <span>Notes</span>
        <strong>{notes}</strong>
      </article>
    </section>
  );
}
