import type { ReactNode } from 'react';
import { Droplets, Eye, Flower2, Scissors, Sprout, TestTube2 } from 'lucide-react';

import { useI18n } from '@/app/i18n/LanguageProvider';
import type { PlantDetail } from '@/modules/plants/api/plantsApi';
import type { PlantThresholdSummary } from '@/modules/plants/components/detail/plantDetailViewModel';
import { SectionHeading } from '@/shared/ui/SectionHeading';

interface PlantCareTabProps {
  plant: PlantDetail;
  thresholdMap: Record<'soilMoisture' | 'temperature' | 'light' | 'airHumidity', PlantThresholdSummary | null>;
}

export function PlantCareTab({ plant, thresholdMap }: PlantCareTabProps) {
  const { t } = useI18n();

  return (
    <div className="plant-detail-v3__tab-stack">
      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title={t('plantDetail.currentCarePlan')}
          subtitle={t('plantDetail.currentCarePlanSubtitle')}
        />
        <div className="plant-detail-v3__care-grid">
          <CareCard
            icon={<Droplets size={18} />}
            title={t('plantDetail.wateringRecommendation')}
            value={thresholdMap.soilMoisture ? describeThreshold(thresholdMap.soilMoisture, t) : t('plantDetail.defineSoilMoistureThreshold')}
          />
          <CareCard
            icon={<Eye size={18} />}
            title={t('plantDetail.lightRecommendation')}
            value={thresholdMap.light ? describeThreshold(thresholdMap.light, t) : t('plantDetail.noLightRangeConfigured')}
          />
          <CareCard
            icon={<Sprout size={18} />}
            title={t('plantDetail.temperatureComfortRange')}
            value={thresholdMap.temperature ? describeThreshold(thresholdMap.temperature, t) : t('plantDetail.noTemperatureRangeConfigured')}
          />
          <CareCard
            icon={<Flower2 size={18} />}
            title={t('plantDetail.humidityComfortRange')}
            value={thresholdMap.airHumidity ? describeThreshold(thresholdMap.airHumidity, t) : t('plantDetail.noHumidityRangeConfigured')}
          />
          <CareCard
            icon={<TestTube2 size={18} />}
            title={t('plantDetail.operatorNotes')}
            value={plant.description ?? t('plantDetail.noNotesYet')}
            wide
          />
        </div>
      </section>

      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title={t('plantDetail.thresholdsSummary')}
          subtitle={t('plantDetail.thresholdsSummarySubtitle')}
        />
        <div className="plant-detail-v3__care-grid">
          <ThresholdCard label={t('plantDetail.soilMoisture')} threshold={thresholdMap.soilMoisture} noThresholdLabel={t('plantDetail.noThresholdConfigured')} />
          <ThresholdCard label={t('plantDetail.temperature')} threshold={thresholdMap.temperature} noThresholdLabel={t('plantDetail.noThresholdConfigured')} />
          <ThresholdCard label={t('plantDetail.light')} threshold={thresholdMap.light} noThresholdLabel={t('plantDetail.noThresholdConfigured')} />
          <ThresholdCard label={t('plantDetail.airHumidity')} threshold={thresholdMap.airHumidity} noThresholdLabel={t('plantDetail.noThresholdConfigured')} />
        </div>
      </section>

      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title={t('plantDetail.careActions')}
          subtitle={t('plantDetail.careActionsSubtitle')}
        />
        <div className="plant-detail-v3__action-grid">
          <FutureAction label={t('plantDetail.registerWatering')} icon={<Droplets size={16} />} />
          <FutureAction label={t('plantDetail.registerPruning')} icon={<Scissors size={16} />} />
          <FutureAction label={t('plantDetail.registerFertilization')} icon={<TestTube2 size={16} />} />
          <FutureAction label={t('plantDetail.registerTransplant')} icon={<Sprout size={16} />} />
          <FutureAction label={t('plantDetail.addManualObservation')} icon={<Eye size={16} />} />
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

function ThresholdCard({
  label,
  threshold,
  noThresholdLabel,
}: {
  label: string;
  threshold: PlantThresholdSummary | null;
  noThresholdLabel: string;
}) {
  const { t } = useI18n();

  return (
    <article className="plant-detail-v3__threshold-card">
      <span>{label}</span>
      {threshold ? (
        <strong>
          {t('plantDetail.thresholdRangeSummary', {
            min: threshold.min ?? '-',
            optimal: threshold.optimal ?? '-',
            max: threshold.max ?? '-',
            unit: threshold.unit ? ` ${threshold.unit}` : '',
          })}
        </strong>
      ) : (
        <strong>{noThresholdLabel}</strong>
      )}
    </article>
  );
}

function FutureAction({ label, icon }: { label: string; icon: ReactNode }) {
  const { t } = useI18n();

  return (
    <button className="secondary-button plant-detail-v3__future-action" disabled title={t('plantDetail.futureActionPending')} type="button">
      {icon}
      <span>{label}</span>
    </button>
  );
}

function describeThreshold(threshold: PlantThresholdSummary, t: (key: string, vars?: Record<string, string | number>) => string) {
  return t('plantDetail.thresholdDescription', {
    min: threshold.min ?? '-',
    max: threshold.max ?? '-',
    optimal: threshold.optimal ?? '-',
    unit: threshold.unit ? ` ${threshold.unit}` : '',
  });
}
