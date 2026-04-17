interface PlantNeedsSectionProps {
  floweringMonths: string[];
  fertilizationSeasons: string[];
}

export function PlantNeedsSection({ floweringMonths, fertilizationSeasons }: PlantNeedsSectionProps) {
  return (
    <section className="panel-card plant-needs-section">
      <article className="detail-item detail-item--wide">
        <span>Flowering months</span>
        <strong>{floweringMonths.join(', ')}</strong>
      </article>
      <article className="detail-item detail-item--wide">
        <span>Fertilization seasons</span>
        <strong>{fertilizationSeasons.join(', ')}</strong>
      </article>
    </section>
  );
}
