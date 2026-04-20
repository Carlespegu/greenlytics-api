import { useI18n } from '@/app/i18n/LanguageProvider';
import type { PlantDetail } from '@/modules/plants/api/plantsApi';
import { formatDateTime } from '@/modules/plants/components/detail/plantDetailViewModel';
import { SectionHeading } from '@/shared/ui/SectionHeading';

interface PlantOverviewTabProps {
  plant: PlantDetail;
  updatedLabel: string;
}

export function PlantOverviewTab({
  plant,
  updatedLabel,
}: PlantOverviewTabProps) {
  const { locale, t } = useI18n();
  const createdLabel = formatDateTime(plant.createdAt, locale) ?? t('records.unknown');
  const statusLabel = plant.plantStatusName ?? t('plantDetail.notSpecified');
  const descriptionLabel = plant.description ?? t('plantDetail.notSpecified');
  const clientLabel = plant.clientName ?? t('plantDetail.notSpecified');
  const installationLabel = plant.installationName ?? t('records.unassigned');
  const plantTypeLabel = plant.plantTypeName ?? t('plantDetail.notSpecified');
  const operationalStateLabel = plant.isActive ? t('records.active') : t('records.inactive');

  return (
    <div className="plant-detail-v3__tab-stack">
      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title={t('plantDetail.generalInformation')}
          subtitle="Informació essencial i llegible de la planta."
        />
        <div className="plant-detail-v3__info-grid">
          <InfoItem label={t('plantsPage.name')} value={plant.name} />
          <InfoItem label={t('plantDetail.descriptionNotes')} value={descriptionLabel} wide />
          <InfoItem label={t('plantDetail.operationalState')} value={operationalStateLabel} />
          <InfoItem label={t('plantDetail.plantStatus')} value={statusLabel} />
        </div>
      </section>

      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title={t('plantDetail.context')}
          subtitle="Relació de la planta amb el client, la instal·lació i la seva tipologia."
        />
        <div className="plant-detail-v3__info-grid">
          <InfoItem label={t('plantDetail.client')} value={clientLabel} />
          <InfoItem label={t('plantDetail.installation')} value={installationLabel} />
          <InfoItem label={t('plantDetail.plantType')} value={plantTypeLabel} />
        </div>
      </section>

      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title="Metadades"
          subtitle="Traçabilitat bàsica de creació i actualització."
        />
        <div className="plant-detail-v3__info-grid">
          <InfoItem label={t('plantDetail.created')} value={createdLabel} />
          <InfoItem label={t('plantDetail.updated')} value={updatedLabel} />
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
