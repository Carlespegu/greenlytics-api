import { useState, type ReactNode } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, ImageOff } from 'lucide-react';

import { useI18n } from '@/app/i18n/LanguageProvider';
import type { PlantDetail, PlantPhotoRecord } from '@/modules/plants/api/plantsApi';

interface PlantDetailHeaderProps {
  plant: PlantDetail;
  headerPhoto: PlantPhotoRecord | null;
  onBack: () => void;
  children?: ReactNode;
}

export function PlantDetailHeader({ plant, headerPhoto, onBack, children }: PlantDetailHeaderProps) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const initials = plant.name
    .split(/\s+/)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <section
      className={`panel-card plant-detail-v3__header plant-detail-v3__header--compact${collapsed ? ' plant-detail-v3__header--collapsed' : ''}`}
    >
      <div className="plant-detail-v3__breadcrumb-row">
        <button className="secondary-button" type="button" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>{t('plantDetail.backToList')}</span>
        </button>

        <button
          aria-expanded={!collapsed}
          className="plant-detail-v3__collapse-toggle"
          type="button"
          onClick={() => setCollapsed((current) => !current)}
        >
          <span>{collapsed ? t('plantDetail.expandHeader') : t('plantDetail.collapseHeader')}</span>
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      <div className="plant-detail-v3__header-body">
        <div className="plant-detail-v3__identity-column">
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
          </div>
        </div>

        <div className="plant-detail-v3__header-widgets">
          {children}
        </div>
      </div>
    </section>
  );
}
