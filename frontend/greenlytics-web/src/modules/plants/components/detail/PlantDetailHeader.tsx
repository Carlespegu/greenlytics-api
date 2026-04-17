import { ArrowLeft, CalendarPlus, ChevronRight, ImagePlus, MapPinned, Pencil, SlidersHorizontal, ToggleLeft } from 'lucide-react';

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
  const statusTone = resolveToneFromStatus(plant.plantStatusName, plant.isActive);
  const updatedLabel = formatDateTime(plant.updatedAt ?? plant.createdAt) ?? 'Unknown';

  return (
    <section className="panel-card plant-detail-v3__header">
      <div className="plant-detail-v3__breadcrumb-row">
        <button className="secondary-button" type="button" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to list</span>
        </button>

        <nav aria-label="Breadcrumb" className="plant-detail-v3__breadcrumbs">
          <button type="button" onClick={onBack}>Plants</button>
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
            <div className="plant-detail-v3__eyebrow">Plant detail workspace</div>
            <div className="plant-detail-v3__title-row">
              <div>
                <h1>{plant.name}</h1>
                <p>{plant.code} · {plant.installationName ?? 'No installation assigned'}</p>
              </div>
              <div className="plant-detail-v3__badges">
                <StatusBadge label={plant.plantTypeName ?? 'Unspecified type'} variant="info" />
                <StatusBadge label={plant.plantStatusName ?? 'Unknown status'} variant={statusTone} />
                <StatusBadge label={plant.isActive ? 'Active' : 'Inactive'} variant={plant.isActive ? 'success' : 'neutral'} />
              </div>
            </div>

            <div className="plant-detail-v3__meta-strip">
              <div>
                <span>Installation</span>
                <strong>{plant.installationName ?? plant.installationCode ?? 'Unassigned'}</strong>
              </div>
              <div>
                <span>Client</span>
                <strong>{plant.clientName ?? plant.clientCode ?? 'Unknown client'}</strong>
              </div>
              <div>
                <span>Updated</span>
                <strong>{updatedLabel}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="plant-detail-v3__header-actions">
          <button className="secondary-button" disabled title="Edit plant UI is the next step." type="button">
            <Pencil size={16} />
            <span>Edit plant</span>
          </button>
          <button className="secondary-button" type="button" onClick={onOpenPhotos}>
            <ImagePlus size={16} />
            <span>Upload photo</span>
          </button>
          <button className="secondary-button" type="button" onClick={onOpenHistory}>
            <CalendarPlus size={16} />
            <span>Add event</span>
          </button>
          <button className="secondary-button" type="button" onClick={onOpenCare}>
            <SlidersHorizontal size={16} />
            <span>Add threshold</span>
          </button>
          <button className="secondary-button" type="button" onClick={onViewInstallation}>
            <MapPinned size={16} />
            <span>View installation</span>
          </button>
          <button className="ghost-button" disabled title="Activate/deactivate hook pending frontend mutation." type="button">
            <ToggleLeft size={16} />
            <span>{plant.isActive ? 'Deactivate' : 'Activate'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
