import { ArrowLeft, ChevronRight, ImageOff } from 'lucide-react';

import { useI18n } from '@/app/i18n/LanguageProvider';
import type { PlantDetail, PlantPhotoRecord } from '@/modules/plants/api/plantsApi';

interface PlantDetailHeaderProps {
  plant: PlantDetail;
  headerPhoto: PlantPhotoRecord | null;
  onBack: () => void;
}

export function PlantDetailHeader({ plant, headerPhoto, onBack }: PlantDetailHeaderProps) {
  const { t } = useI18n();
  const initials = plant.name
    .split(/\s+/)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <section className="panel-card plant-detail-v3__header plant-detail-v3__header--compact">
      <div className="plant-detail-v3__breadcrumb-row">
        <button className="secondary-button" type="button" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>{t('plantDetail.backToList')}</span>
        </button>

        <nav aria-label="Breadcrumb" className="plant-detail-v3__breadcrumbs">
          <button type="button" onClick={onBack}>{t('plantDetail.breadcrumbRoot')}</button>
          <ChevronRight size={14} />
          <span>{plant.name}</span>
        </nav>
      </div>

      <div className="plant-detail-v3__hero plant-detail-v3__hero--compact">
        <div className={`plant-detail-v3__hero-photo${headerPhoto ? '' : ' plant-detail-v3__hero-photo--placeholder'}`}>
          {headerPhoto ? (
            <>
              <img alt={`${plant.name} general`} src={headerPhoto.fileUrl} />
              <span className="plant-detail-v3__hero-photo-tag">{t('plantDetail.generalPhotoLabel')}</span>
            </>
          ) : (
            <div className="plant-detail-v3__hero-photo-empty">
              <span className="plant-detail-v3__hero-photo-initials">{initials || plant.code.slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{t('plantDetail.noGeneralPhoto')}</strong>
                <span>{t('plantDetail.generalPhotoLabel')}</span>
              </div>
              <ImageOff size={20} />
            </div>
          )}
        </div>

        <div className="plant-detail-v3__hero-copy plant-detail-v3__hero-copy--compact">
          <div className="plant-detail-v3__title-block">
            <span className="plant-detail-v3__eyebrow">{t('plantDetail.plantIdentityEyebrow')}</span>
            <h1>{plant.name}</h1>
          </div>
          <div className="plant-detail-v3__identity-strip">
            <span>{t('plantDetail.plantCodeLabel')}</span>
            <strong>{plant.code}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
