interface PlantFactsGridProps {
  facts: Array<{ label: string; value: string }>;
}

export function PlantFactsGrid({ facts }: PlantFactsGridProps) {
  return (
    <section className="detail-grid">
      {facts.map((fact) => (
        <article className="detail-item" key={fact.label}>
          <span>{fact.label}</span>
          <strong>{fact.value}</strong>
        </article>
      ))}
    </section>
  );
}
