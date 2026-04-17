import { PageHeader } from '@/shared/components/PageHeader';

interface PlantDetailHeaderProps {
  code: string;
  installation: string;
  title: string;
}

export function PlantDetailHeader({ code, installation, title }: PlantDetailHeaderProps) {
  return (
    <div className="module-page">
      <PageHeader title={title} description="Detail workspace ready for summary, readings, reviews and image chronology." />
      <section className="panel-card plant-detail-header">
        <div className="badge">Code: {code}</div>
        <div className="badge">Installation: {installation}</div>
      </section>
    </div>
  );
}
