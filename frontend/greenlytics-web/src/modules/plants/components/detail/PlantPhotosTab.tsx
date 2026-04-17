import { useMemo, useState } from 'react';
import { ImagePlus, Star, Trash2 } from 'lucide-react';

import type { PlantPhotoRecord } from '@/modules/plants/api/plantsApi';
import { EmptyState } from '@/shared/components/EmptyState';
import { ImageCarouselModal } from '@/shared/ui/ImageCarouselModal';
import { SectionHeading } from '@/shared/ui/SectionHeading';

interface PlantPhotosTabProps {
  photos: PlantPhotoRecord[];
}

export function PlantPhotosTab({ photos }: PlantPhotosTabProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const primaryPhoto = photos.find((photo) => photo.isPrimary) ?? photos[0] ?? null;
  const imageUrls = useMemo(() => photos.map((photo) => photo.fileUrl), [photos]);

  return (
    <>
      <div className="plant-detail-v3__tab-stack">
        <section className="panel-card plant-detail-v3__section-card">
          <SectionHeading
            title="Primary photo"
            subtitle="Current visual reference used to identify the plant at a glance."
            action={(
              <button className="secondary-button" disabled title="Photo upload UI is the next step." type="button">
                <ImagePlus size={16} />
                <span>Upload photo</span>
              </button>
            )}
          />

          {primaryPhoto ? (
            <div className="plant-detail-v3__primary-photo">
              <img alt={`${primaryPhoto.fileName} primary`} src={primaryPhoto.fileUrl} />
              <div className="plant-detail-v3__primary-photo-meta">
                <strong>{primaryPhoto.photoTypeName ?? primaryPhoto.fileName}</strong>
                <p>{new Intl.DateTimeFormat('ca-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(primaryPhoto.createdAt))}</p>
              </div>
            </div>
          ) : (
            <EmptyState title="No primary photo" description="Upload a photo to start visual monitoring of the plant." />
          )}
        </section>

        <section className="panel-card plant-detail-v3__section-card">
          <SectionHeading
            title="Photo gallery"
            subtitle="Visual history of the plant with metadata and future-ready actions."
          />

          {photos.length === 0 ? (
            <EmptyState title="No photos yet" description="This plant still has no visual history in the current backend." />
          ) : (
            <div className="plant-detail-v3__photo-grid">
              {photos.map((photo, index) => (
                <article className="plant-detail-v3__photo-card" key={photo.id}>
                  <button className="plant-detail-v3__photo-card-image" type="button" onClick={() => setActiveIndex(index)}>
                    <img alt={photo.fileName} src={photo.fileUrl} />
                  </button>
                  <div className="plant-detail-v3__photo-card-meta">
                    <div>
                      <strong>{photo.photoTypeName ?? photo.fileName}</strong>
                      <p>{new Intl.DateTimeFormat('ca-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(photo.createdAt))}</p>
                    </div>
                    <div className="plant-detail-v3__photo-card-actions">
                      <button className="ghost-button" disabled title="Set primary action hook pending." type="button">
                        <Star size={15} />
                        <span>{photo.isPrimary ? 'Primary' : 'Set primary'}</span>
                      </button>
                      <button className="ghost-button" disabled title="Delete photo action hook pending." type="button">
                        <Trash2 size={15} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <ImageCarouselModal
        images={imageUrls}
        index={activeIndex ?? 0}
        open={activeIndex !== null && imageUrls.length > 0}
        onClose={() => setActiveIndex(null)}
        onNext={() => setActiveIndex((current) => (current === null ? 0 : (current + 1) % imageUrls.length))}
        onPrev={() => setActiveIndex((current) => (current === null ? 0 : (current - 1 + imageUrls.length) % imageUrls.length))}
      />
    </>
  );
}
