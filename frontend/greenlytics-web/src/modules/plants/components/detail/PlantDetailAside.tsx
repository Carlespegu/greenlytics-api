import { ClipboardList, Leaf, RadioTower, Sparkles } from 'lucide-react';

import type { PlantDetail } from '@/modules/plants/api/plantsApi';
import type { PlantRecommendation } from '@/modules/plants/components/detail/plantDetailViewModel';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { formatDateTime, resolveToneFromStatus } from '@/modules/plants/components/detail/plantDetailViewModel';

interface PlantDetailAsideProps {
  plant: PlantDetail;
  nextCareAction: string;
  topRecommendation: PlantRecommendation | null;
}

export function PlantDetailAside({ plant, nextCareAction, topRecommendation }: PlantDetailAsideProps) {
  return (
    <aside className="plant-detail-v3__aside">
      <section className="panel-card plant-detail-v3__aside-card">
        <div className="plant-detail-v3__aside-head">
          <span className="plant-detail-v3__aside-icon"><Leaf size={18} /></span>
          <div>
            <strong>Current status</strong>
            <p>Fast operational snapshot for desktop users.</p>
          </div>
        </div>
        <StatusBadge
          label={plant.plantStatusName ?? (plant.isActive ? 'Active' : 'Inactive')}
          variant={resolveToneFromStatus(plant.plantStatusName, plant.isActive)}
        />
        <div className="plant-detail-v3__aside-list">
          <AsideRow label="Latest reading" value={formatDateTime(plant.latestReading?.readAt) ?? 'No readings yet'} />
          <AsideRow label="Next care action" value={nextCareAction} />
          <AsideRow label="Quick recommendation" value={topRecommendation?.title ?? 'No recommendation'} />
        </div>
      </section>

      <section className="panel-card plant-detail-v3__aside-card">
        <div className="plant-detail-v3__aside-head">
          <span className="plant-detail-v3__aside-icon"><RadioTower size={18} /></span>
          <div>
            <strong>Telemetry</strong>
            <p>Current backend context for readings and devices.</p>
          </div>
        </div>
        <div className="plant-detail-v3__aside-list">
          <AsideRow label="Device" value={plant.latestReading?.deviceCode ?? 'Pending device context'} />
          <AsideRow label="Source" value={plant.latestReading?.source ?? 'Not provided'} />
          <AsideRow label="Thresholds" value={String(plant.thresholdsCount)} />
        </div>
      </section>

      <section className="panel-card plant-detail-v3__aside-card">
        <div className="plant-detail-v3__aside-head">
          <span className="plant-detail-v3__aside-icon"><Sparkles size={18} /></span>
          <div>
            <strong>Quick notes</strong>
            <p>Future-ready hooks for recommendations and care follow-up.</p>
          </div>
        </div>
        <div className="plant-detail-v3__aside-note">
          <ClipboardList size={16} />
          <span>{topRecommendation?.reason ?? 'No recommendation reason available yet.'}</span>
        </div>
      </section>
    </aside>
  );
}

function AsideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="plant-detail-v3__aside-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
