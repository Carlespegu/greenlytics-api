import { ArrowLeft, CalendarPlus, ChevronRight, ImagePlus, MapPinned, Pencil, SlidersHorizontal, ToggleLeft } from 'lucide-react';

import { useI18n } from '@/app/i18n/LanguageProvider';
import type { PlantDetail } from '@/modules/plants/api/plantsApi';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import { formatDateTime, resolveToneFromStatus } from '@/modules/plants/components/detail/plantDetailViewModel';

interface PlantDetailHeaderProps {
  plant: PlantDetail;
  primaryPhotoUrl: string | null;
  onBack: () => void;
  onViewInstallation: () => void;
  onOpenPhotos: () => void;
  onOpenHistory: () => void;
  onOpenCare: () => void;
}

export function PlantDetailHeader({
  plant,
  primaryPhotoUrl,
  onBack,
  onViewInstallation,
  onOpenPhotos,
  onOpenHistory,
  onOpenCare,
}: PlantDetailHeaderProps) {
  const { t } = useI18n();
  const statusTone = resolveToneFromStatus(plant.plantStatusName, plant.isActive);
  const updatedLabel = formatDateTime(plant.updatedAt ?? plant.createdAt) ?? t('records.unknown');

  return (
    <section className="panel-card plant-detail-v3__header">
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

      <div className="plant-detail-v3__header-main">
        <div className="plant-detail-v3__hero">
          {primaryPhotoUrl ? (
            <div className="plant-detail-v3__hero-photo">
              <img alt={`${plant.name} primary`} src={primaryPhotoUrl} />
            </div>
          ) : null}

          <div className="plant-detail-v3__hero-copy">
            <div className="plant-detail-v3__eyebrow">{t('plantDetail.workspaceEyebrow')}</div>
            <div className="plant-detail-v3__title-row">
              <div>
                <h1>{plant.name}</h1>
                <p>{plant.code} · {plant.installationName ?? t('plantDetail.noInstallationAssigned')}</p>
              </div>
              <div className="plant-detail-v3__badges">
                <StatusBadge label={plant.plantTypeName ?? t('plantDetail.unspecifiedType')} variant="info" />
                <StatusBadge label={plant.plantStatusName ?? t('plantDetail.unknownStatus')} variant={statusTone} />
                <StatusBadge label={plant.isActive ? t('records.active') : t('records.inactive')} variant={plant.isActive ? 'success' : 'neutral'} />
              </div>
            </div>

            <div className="plant-detail-v3__meta-strip">
              <div>
                <span>{t('plantDetail.installation')}</span>
                <strong>{plant.installationName ?? plant.installationCode ?? t('records.unassigned')}</strong>
              </div>
              <div>
                <span>{t('plantDetail.client')}</span>
                <strong>{plant.clientName ?? plant.clientCode ?? t('plantDetail.unknownClient')}</strong>
              </div>
              <div>
                <span>{t('plantDetail.updated')}</span>
                <strong>{updatedLabel}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="plant-detail-v3__header-actions">
          <button className="secondary-button" disabled title="Edit plant UI is the next step." type="button">
            <Pencil size={16} />
            <span>{t('plantDetail.editPlant')}</span>
          </button>
          <button className="secondary-button" type="button" onClick={onOpenPhotos}>
            <ImagePlus size={16} />
            <span>{t('plantDetail.uploadPhoto')}</span>
          </button>
          <button className="secondary-button" type="button" onClick={onOpenHistory}>
            <CalendarPlus size={16} />
            <span>{t('plantDetail.addEvent')}</span>
          </button>
          <button className="secondary-button" type="button" onClick={onOpenCare}>
            <SlidersHorizontal size={16} />
            <span>{t('plantDetail.addThreshold')}</span>
          </button>
          <button className="secondary-button" type="button" onClick={onViewInstallation}>
            <MapPinned size={16} />
            <span>{t('plantDetail.viewInstallation')}</span>
          </button>
          <button className="ghost-button" disabled title="Activate/deactivate hook pending frontend mutation." type="button">
            <ToggleLeft size={16} />
            <span>{plant.isActive ? t('plantDetail.deactivate') : t('plantDetail.activate')}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
