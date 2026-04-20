import { MapPinned, RadioTower } from 'lucide-react';

import { useI18n } from '@/app/i18n/LanguageProvider';
import type { PlantDetail } from '@/modules/plants/api/plantsApi';
import { formatDateTime } from '@/modules/plants/components/detail/plantDetailViewModel';
import { SectionHeading } from '@/shared/ui/SectionHeading';

interface PlantInstallationsTabProps {
  plant: PlantDetail;
  onViewInstallation: () => void;
}

export function PlantInstallationsTab({ plant, onViewInstallation }: PlantInstallationsTabProps) {
  const { locale, t } = useI18n();
  const latestTelemetryLabel = plant.latestReading?.readAt
    ? formatDateTime(plant.latestReading.readAt, locale) ?? t('plantDetail.pendingDeviceContext')
    : t('plantDetail.pendingDeviceContext');

  return (
    <div className="plant-detail-v3__tab-stack">
      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title={t('plantDetail.installationTabTitle')}
          subtitle={t('plantDetail.installationTabSubtitle')}
          action={(
            <button className="secondary-button" type="button" onClick={onViewInstallation}>
              <MapPinned size={16} />
              <span>{t('plantDetail.viewInstallation')}</span>
            </button>
          )}
        />

        <div className="plant-detail-v3__info-grid">
          <InfoItem label={t('plantDetail.installation')} value={plant.installationName ?? plant.installationCode ?? t('records.unassigned')} />
          <InfoItem label={t('plantDetail.installationCode')} value={plant.installationCode ?? t('plantDetail.notProvided')} />
          <InfoItem label={t('plantDetail.client')} value={plant.clientName ?? plant.clientCode ?? t('plantDetail.unknownClient')} />
          <InfoItem label={t('plantDetail.operationalState')} value={plant.isActive ? t('records.active') : t('records.inactive')} />
        </div>
      </section>

      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title={t('plantDetail.installationContextTitle')}
          subtitle={t('plantDetail.installationContextSubtitle')}
        />
        <div className="plant-detail-v3__context-card-list">
          <article className="plant-detail-v3__context-card">
            <span className="plant-detail-v3__care-icon"><RadioTower size={18} /></span>
            <div>
              <strong>{t('plantDetail.latestTelemetry')}</strong>
              <p>{latestTelemetryLabel}</p>
            </div>
          </article>
          <article className="plant-detail-v3__context-card">
            <span className="plant-detail-v3__care-icon"><MapPinned size={18} /></span>
            <div>
              <strong>{t('plantDetail.deviceContext')}</strong>
              <p>{plant.latestReading?.deviceCode ?? t('plantDetail.noDeviceContext')}</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <article className="plant-detail-v3__info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
