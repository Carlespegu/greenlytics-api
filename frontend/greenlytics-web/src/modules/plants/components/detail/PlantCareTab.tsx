import { Activity, RadioTower, Ruler } from 'lucide-react';

import { useI18n } from '@/app/i18n/LanguageProvider';
import type { PlantDetail, PlantThresholdRecord } from '@/modules/plants/api/plantsApi';
import { formatDateTime } from '@/modules/plants/components/detail/plantDetailViewModel';
import { EmptyState } from '@/shared/components/EmptyState';
import { SectionHeading } from '@/shared/ui/SectionHeading';
import { StatusBadge } from '@/shared/ui/StatusBadge';

interface PlantCareTabProps {
  plant: PlantDetail;
}

export function PlantCareTab({ plant }: PlantCareTabProps) {
  const { locale, t } = useI18n();
  const latestReadingLabel = plant.latestReading?.readAt
    ? formatDateTime(plant.latestReading.readAt, locale) ?? t('records.unknown')
    : 'Encara no hi ha cap lectura recent disponible.';

  return (
    <div className="plant-detail-v3__tab-stack">
      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title="Base de cures"
          subtitle="Resum del marc de referència actual de la planta segons els llindars definits."
        />
        <div className="plant-detail-v3__context-card-list">
          <article className="plant-detail-v3__context-card">
            <span className="plant-detail-v3__care-icon"><Ruler size={18} /></span>
            <div>
              <strong>{t('plantDetail.thresholdsCount')}</strong>
              <p>{`${plant.thresholdsCount} llindars definits actualment`}</p>
            </div>
          </article>
          <article className="plant-detail-v3__context-card">
            <span className="plant-detail-v3__care-icon"><Activity size={18} /></span>
            <div>
              <strong>{t('plantDetail.latestReading')}</strong>
              <p>{latestReadingLabel}</p>
            </div>
          </article>
          {plant.latestReading?.source ? (
            <article className="plant-detail-v3__context-card">
              <span className="plant-detail-v3__care-icon"><RadioTower size={18} /></span>
              <div>
                <strong>{t('plantDetail.source')}</strong>
                <p>{plant.latestReading.source}</p>
              </div>
            </article>
          ) : null}
        </div>
      </section>

      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title="Valors ideals per a la planta"
          subtitle="Cada llindar defineix el rang òptim de cura d’aquesta planta."
        />

        {plant.thresholds.length === 0 ? (
          <EmptyState
            title="Encara no hi ha valors ideals definits"
            description="Aquesta planta encara no té llindars configurats, així que no hi ha una línia base de cures disponible."
          />
        ) : (
          <div className="plant-detail-v3__care-grid">
            {plant.thresholds.map((threshold) => (
              <CareThresholdCard key={threshold.id} threshold={threshold} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CareThresholdCard({ threshold }: { threshold: PlantThresholdRecord }) {
  const { t } = useI18n();
  const readingTypeLabel = threshold.readingTypeName ?? t('plantDetail.notSpecified');
  const unitTypeLabel = threshold.unitTypeName ?? t('plantDetail.notSpecified');

  return (
    <article className="plant-detail-v3__care-card plant-detail-v3__care-threshold-card">
      <div className="plant-detail-v3__care-card-header">
        <div>
          <strong>{readingTypeLabel}</strong>
          <p>{unitTypeLabel}</p>
        </div>
        <StatusBadge label={threshold.isActive ? t('records.active') : t('records.inactive')} variant={threshold.isActive ? 'success' : 'neutral'} />
      </div>

      <dl className="plant-detail-v3__care-threshold-values">
        <div>
          <dt>Mínim</dt>
          <dd>{formatNumericValue(threshold.minValue, unitTypeLabel, t)}</dd>
        </div>
        <div>
          <dt>Màxim</dt>
          <dd>{formatNumericValue(threshold.maxValue, unitTypeLabel, t)}</dd>
        </div>
        <div>
          <dt>Òptim</dt>
          <dd>{formatNumericValue(threshold.optimalValue, unitTypeLabel, t)}</dd>
        </div>
      </dl>
    </article>
  );
}

function formatNumericValue(
  value: number | null,
  unitLabel: string,
  t: (key: string) => string,
) {
  if (value === null || value === undefined) {
    return t('records.unknown');
  }

  return `${value}${unitLabel && unitLabel !== t('plantDetail.notSpecified') ? ` ${unitLabel}` : ''}`;
}
