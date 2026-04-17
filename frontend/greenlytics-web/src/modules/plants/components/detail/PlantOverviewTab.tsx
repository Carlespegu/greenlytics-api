import type { PlantDetail } from '@/modules/plants/api/plantsApi';
import { SectionHeading } from '@/shared/ui/SectionHeading';

interface PlantOverviewTabProps {
  plant: PlantDetail;
  updatedLabel: string;
  lastEventLabel: string;
  lastPhotoLabel: string;
  lastReadingLabel: string;
}

export function PlantOverviewTab({
  plant,
  updatedLabel,
  lastEventLabel,
  lastPhotoLabel,
  lastReadingLabel,
}: PlantOverviewTabProps) {
  return (
    <div className="plant-detail-v3__tab-stack">
      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title="General information"
          subtitle="Operational identity and ownership context for the plant."
        />
        <div className="plant-detail-v3__info-grid">
          <InfoItem label="Client" value={plant.clientName ?? plant.clientCode ?? 'Unknown client'} />
          <InfoItem label="Installation" value={plant.installationName ?? plant.installationCode ?? 'Unassigned'} />
          <InfoItem label="Code" value={plant.code} />
          <InfoItem label="Name" value={plant.name} />
          <InfoItem label="Description / notes" value={plant.description ?? 'No notes available yet.'} wide />
          <InfoItem label="Plant type" value={plant.plantTypeName ?? plant.plantTypeCode ?? 'Not specified'} />
          <InfoItem label="Plant status" value={plant.plantStatusName ?? plant.plantStatusCode ?? 'Unknown'} />
          <InfoItem label="Operational state" value={plant.isActive ? 'Active' : 'Inactive'} />
        </div>
      </section>

      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title="Botanical / catalog information"
          subtitle="Current backend detail does not expose the full plant catalog yet, but the layout is ready for it."
        />
        <div className="plant-detail-v3__info-grid">
          <InfoItem label="Species" value="Pending catalog enrichment" />
          <InfoItem label="Family" value="Pending catalog enrichment" />
          <InfoItem label="Exposure" value="Pending catalog enrichment" />
          <InfoItem label="Soil type" value="Pending catalog enrichment" />
          <InfoItem label="Flowering season" value="Pending catalog enrichment" />
          <InfoItem label="Watering profile" value="Pending catalog enrichment" />
        </div>
      </section>

      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title="Operational summary"
          subtitle="Fast references to the most recent operational activity around the plant."
        />
        <div className="plant-detail-v3__info-grid">
          <InfoItem label="Thresholds count" value={String(plant.thresholdsCount)} />
          <InfoItem label="Last event" value={lastEventLabel} />
          <InfoItem label="Last photo date" value={lastPhotoLabel} />
          <InfoItem label="Last reading date" value={lastReadingLabel} />
          <InfoItem label="Created" value={updatedLabel} />
          <InfoItem label="Updated" value={updatedLabel} />
        </div>
      </section>
    </div>
  );
}

function InfoItem({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <article className={`plant-detail-v3__info-item${wide ? ' plant-detail-v3__info-item--wide' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
