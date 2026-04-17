import type { ReactNode } from 'react';
import { Droplets, Eye, Flower2, Scissors, Sprout, TestTube2 } from 'lucide-react';

import type { PlantDetail } from '@/modules/plants/api/plantsApi';
import type { PlantThresholdSummary } from '@/modules/plants/components/detail/plantDetailViewModel';
import { SectionHeading } from '@/shared/ui/SectionHeading';

interface PlantCareTabProps {
  plant: PlantDetail;
  thresholdMap: Record<'soilMoisture' | 'temperature' | 'light' | 'airHumidity', PlantThresholdSummary | null>;
}

export function PlantCareTab({ plant, thresholdMap }: PlantCareTabProps) {
  return (
    <div className="plant-detail-v3__tab-stack">
      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title="Current care plan"
          subtitle="Current care guidance based on thresholds already configured for the plant."
        />
        <div className="plant-detail-v3__care-grid">
          <CareCard
            icon={<Droplets size={18} />}
            title="Watering recommendation"
            value={thresholdMap.soilMoisture ? describeThreshold(thresholdMap.soilMoisture) : 'Define a soil moisture threshold to operationalize watering.'}
          />
          <CareCard
            icon={<Eye size={18} />}
            title="Light recommendation"
            value={thresholdMap.light ? describeThreshold(thresholdMap.light) : 'No light range configured yet.'}
          />
          <CareCard
            icon={<Sprout size={18} />}
            title="Temperature comfort range"
            value={thresholdMap.temperature ? describeThreshold(thresholdMap.temperature) : 'No temperature comfort range configured yet.'}
          />
          <CareCard
            icon={<Flower2 size={18} />}
            title="Humidity comfort range"
            value={thresholdMap.airHumidity ? describeThreshold(thresholdMap.airHumidity) : 'No humidity comfort range configured yet.'}
          />
          <CareCard
            icon={<TestTube2 size={18} />}
            title="Operator notes"
            value={plant.description ?? 'No operator notes available yet.'}
            wide
          />
        </div>
      </section>

      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title="Thresholds summary"
          subtitle="Operational baseline configured today for the most relevant metrics."
        />
        <div className="plant-detail-v3__care-grid">
          <ThresholdCard label="Soil moisture" threshold={thresholdMap.soilMoisture} />
          <ThresholdCard label="Temperature" threshold={thresholdMap.temperature} />
          <ThresholdCard label="Light" threshold={thresholdMap.light} />
          <ThresholdCard label="Air humidity" threshold={thresholdMap.airHumidity} />
        </div>
      </section>

      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title="Care actions"
          subtitle="Structured action hooks for the most common operational interventions."
        />
        <div className="plant-detail-v3__action-grid">
          <FutureAction label="Register watering" icon={<Droplets size={16} />} />
          <FutureAction label="Register pruning" icon={<Scissors size={16} />} />
          <FutureAction label="Register fertilization" icon={<TestTube2 size={16} />} />
          <FutureAction label="Register transplant" icon={<Sprout size={16} />} />
          <FutureAction label="Add manual observation" icon={<Eye size={16} />} />
        </div>
      </section>
    </div>
  );
}

function CareCard({ icon, title, value, wide = false }: { icon: ReactNode; title: string; value: string; wide?: boolean }) {
  return (
    <article className={`plant-detail-v3__care-card${wide ? ' plant-detail-v3__care-card--wide' : ''}`}>
      <div className="plant-detail-v3__care-card-header">
        <span className="plant-detail-v3__care-icon">{icon}</span>
        <strong>{title}</strong>
      </div>
      <p>{value}</p>
    </article>
  );
}

function ThresholdCard({ label, threshold }: { label: string; threshold: PlantThresholdSummary | null }) {
  return (
    <article className="plant-detail-v3__threshold-card">
      <span>{label}</span>
      {threshold ? (
        <strong>
          Min {threshold.min ?? '-'} · Opt {threshold.optimal ?? '-'} · Max {threshold.max ?? '-'} {threshold.unit}
        </strong>
      ) : (
        <strong>No threshold configured</strong>
      )}
    </article>
  );
}

function FutureAction({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <button className="secondary-button plant-detail-v3__future-action" disabled title="Frontend action hook pending." type="button">
      {icon}
      <span>{label}</span>
    </button>
  );
}

function describeThreshold(threshold: PlantThresholdSummary) {
  const unit = threshold.unit ? ` ${threshold.unit}` : '';
  return `Target range ${threshold.min ?? '-'} to ${threshold.max ?? '-'}${unit}${threshold.optimal !== null ? ` · optimal ${threshold.optimal}${unit}` : ''}.`;
}
