import { useI18n } from '@/app/i18n/LanguageProvider';
import type { PlantDetail } from '@/modules/plants/api/plantsApi';
import { formatDateTime } from '@/modules/plants/components/detail/plantDetailViewModel';
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
  const { locale, t } = useI18n();
  const createdLabel = formatDateTime(plant.createdAt, locale) ?? t('records.unknown');

  return (
    <div className="plant-detail-v3__tab-stack">
      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title={t('plantDetail.generalInformation')}
          subtitle={t('plantDetail.generalInformationSubtitle')}
        />
        <div className="plant-detail-v3__info-grid">
          <InfoItem label={t('plantDetail.client')} value={plant.clientName ?? plant.clientCode ?? t('plantDetail.unknownClient')} />
          <InfoItem label={t('plantDetail.installation')} value={plant.installationName ?? plant.installationCode ?? t('records.unassigned')} />
          <InfoItem label={t('plantsPage.code')} value={plant.code} />
          <InfoItem label={t('plantsPage.name')} value={plant.name} />
          <InfoItem label={t('plantDetail.descriptionNotes')} value={plant.description ?? t('plantDetail.noNotesYet')} wide />
          <InfoItem label={t('plantDetail.plantType')} value={plant.plantTypeName ?? plant.plantTypeCode ?? t('plantDetail.notSpecified')} />
          <InfoItem label={t('plantDetail.plantStatus')} value={plant.plantStatusName ?? plant.plantStatusCode ?? t('records.unknown')} />
          <InfoItem label={t('plantDetail.operationalState')} value={plant.isActive ? t('records.active') : t('records.inactive')} />
        </div>
      </section>

      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title={t('plantDetail.botanicalInfo')}
          subtitle={t('plantDetail.botanicalInfoSubtitle')}
        />
        <div className="plant-detail-v3__info-grid">
          <InfoItem label={t('plantDetail.species')} value={t('plantDetail.pendingCatalogEnrichment')} />
          <InfoItem label={t('plantDetail.family')} value={t('plantDetail.pendingCatalogEnrichment')} />
          <InfoItem label={t('plantDetail.exposure')} value={t('plantDetail.pendingCatalogEnrichment')} />
          <InfoItem label={t('plantDetail.soilType')} value={t('plantDetail.pendingCatalogEnrichment')} />
          <InfoItem label={t('plantDetail.floweringSeason')} value={t('plantDetail.pendingCatalogEnrichment')} />
          <InfoItem label={t('plantDetail.wateringProfile')} value={t('plantDetail.pendingCatalogEnrichment')} />
        </div>
      </section>

      <section className="panel-card plant-detail-v3__section-card">
        <SectionHeading
          title={t('plantDetail.operationalSummary')}
          subtitle={t('plantDetail.operationalSummarySubtitle')}
        />
        <div className="plant-detail-v3__info-grid">
          <InfoItem label={t('plantDetail.thresholdsCount')} value={String(plant.thresholdsCount)} />
          <InfoItem label={t('plantDetail.lastEvent')} value={lastEventLabel} />
          <InfoItem label={t('plantDetail.lastPhotoDate')} value={lastPhotoLabel} />
          <InfoItem label={t('plantDetail.lastReadingDate')} value={lastReadingLabel} />
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
