import { ClipboardList, Leaf, RadioTower, Sparkles } from 'lucide-react';

import { useI18n } from '@/app/i18n/LanguageProvider';
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
  const { t } = useI18n();

  return (
    <aside className="plant-detail-v3__aside">
      <section className="panel-card plant-detail-v3__aside-card">
        <div className="plant-detail-v3__aside-head">
          <span className="plant-detail-v3__aside-icon"><Leaf size={18} /></span>
          <div>
            <strong>{t('plantDetail.currentStatus')}</strong>
            <p>{t('plantDetail.currentStatusSubtitle')}</p>
          </div>
        </div>
        <StatusBadge
          label={plant.plantStatusName ?? (plant.isActive ? t('records.active') : t('records.inactive'))}
          variant={resolveToneFromStatus(plant.plantStatusName, plant.isActive)}
        />
        <div className="plant-detail-v3__aside-list">
          <AsideRow label={t('plantDetail.latestReading')} value={formatDateTime(plant.latestReading?.readAt) ?? t('plantDetail.noReadingsYet')} />
          <AsideRow label={t('plantDetail.nextCareAction')} value={nextCareAction} />
          <AsideRow label={t('plantDetail.quickRecommendation')} value={topRecommendation?.title ?? t('plantDetail.noRecommendation')} />
        </div>
      </section>

      <section className="panel-card plant-detail-v3__aside-card">
        <div className="plant-detail-v3__aside-head">
          <span className="plant-detail-v3__aside-icon"><RadioTower size={18} /></span>
          <div>
            <strong>{t('plantDetail.telemetry')}</strong>
            <p>{t('plantDetail.telemetrySubtitle')}</p>
          </div>
        </div>
        <div className="plant-detail-v3__aside-list">
          <AsideRow label={t('plantDetail.device')} value={plant.latestReading?.deviceCode ?? t('plantDetail.pendingDeviceContextShort')} />
          <AsideRow label={t('plantDetail.source')} value={plant.latestReading?.source ?? t('plantDetail.notProvided')} />
          <AsideRow label={t('plantDetail.thresholdsCount')} value={String(plant.thresholdsCount)} />
        </div>
      </section>

      <section className="panel-card plant-detail-v3__aside-card">
        <div className="plant-detail-v3__aside-head">
          <span className="plant-detail-v3__aside-icon"><Sparkles size={18} /></span>
          <div>
            <strong>{t('plantDetail.quickNotes')}</strong>
            <p>{t('plantDetail.quickNotesSubtitle')}</p>
          </div>
        </div>
        <div className="plant-detail-v3__aside-note">
          <ClipboardList size={16} />
          <span>{topRecommendation?.reason ?? t('plantDetail.noRecommendationReason')}</span>
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
