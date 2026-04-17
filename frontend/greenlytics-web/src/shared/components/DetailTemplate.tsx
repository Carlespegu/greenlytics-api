import { PageHeader } from '@/shared/components/PageHeader';

interface DetailTemplateProps {
  title: string;
  description: string;
  identifier: string;
  facts: Array<{ label: string; value: string }>;
}

export function DetailTemplate({ title, description, identifier, facts }: DetailTemplateProps) {
  return (
    <div className="module-page">
      <PageHeader title={title} description={description} />
      <section className="panel-card">
        <div className="badge">Context: {identifier}</div>
      </section>
      <section className="detail-grid">
        {facts.map((fact) => (
          <article className="detail-item" key={fact.label}>
            <span>{fact.label}</span>
            <strong>{fact.value}</strong>
          </article>
        ))}
      </section>
    </div>
  );
}
