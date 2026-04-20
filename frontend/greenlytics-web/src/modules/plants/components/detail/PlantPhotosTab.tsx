import { useMemo, useState } from 'react';
import { CheckCircle2, ImagePlus, ImageUp, Star, Trash2 } from 'lucide-react';

import { useI18n } from '@/app/i18n/LanguageProvider';
import type { PlantPhotoRecord } from '@/modules/plants/api/plantsApi';
import { EmptyState } from '@/shared/components/EmptyState';
import { ImageCarouselModal } from '@/shared/ui/ImageCarouselModal';
import { SectionHeading } from '@/shared/ui/SectionHeading';
import { StatusBadge } from '@/shared/ui/StatusBadge';

interface PlantPhotosTabProps {
  plantName: string;
  primaryPhotoUrl: string | null;
  photos: PlantPhotoRecord[];
}

export function PlantPhotosTab({ plantName, primaryPhotoUrl, photos }: PlantPhotosTabProps) {
  const { locale, t } = useI18n();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const sortedPhotos = useMemo(
    () => [...photos].sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary) || Date.parse(right.createdAt) - Date.parse(left.createdAt)),
    [photos],
  );
  const primaryPhoto = sortedPhotos.find((photo) => photo.isPrimary)
    ?? sortedPhotos.find((photo) => primaryPhotoUrl && photo.fileUrl === primaryPhotoUrl)
    ?? sortedPhotos[0]
    ?? null;
  const featuredPhotoUrl = primaryPhoto?.fileUrl ?? primaryPhotoUrl ?? null;
  const imageUrls = useMemo(() => sortedPhotos.map((photo) => photo.fileUrl), [sortedPhotos]);

  const formatPhotoDate = (value: string) => (
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  );

  return (
    <>
      <div className="plant-detail-v3__tab-stack">
        <section className="panel-card plant-detail-v3__section-card">
          <SectionHeading
            title={t('plantDetail.primaryPhoto')}
            subtitle={t('plantDetail.primaryPhotoSubtitle')}
            action={(
              <button className="secondary-button" disabled title="Photo upload UI is the next step." type="button">
                <ImagePlus size={16} />
                <span>{t('plantDetail.uploadPhoto')}</span>
              </button>
            )}
          />

          {featuredPhotoUrl ? (
            <div className="plant-detail-v3__primary-photo">
              <img alt={`${plantName} primary`} src={featuredPhotoUrl} />
              <div className="plant-detail-v3__primary-photo-meta">
                <div>
                  <strong>{primaryPhoto?.photoTypeName ?? t('plantDetail.generalPhotoLabel')}</strong>
                  <p>{primaryPhoto ? formatPhotoDate(primaryPhoto.createdAt) : 'Imatge principal disponible'}</p>
                </div>
                <StatusBadge label={t('plantDetail.primary')} variant="success" />
              </div>
            </div>
          ) : (
            <EmptyState title={t('plantDetail.noPrimaryPhoto')} description={t('plantDetail.noPrimaryPhotoDescription')} />
          )}
        </section>

        <section className="panel-card plant-detail-v3__section-card">
          <SectionHeading
            title={t('plantDetail.photoGallery')}
            subtitle={t('plantDetail.photoGallerySubtitle')}
          />

          {sortedPhotos.length === 0 ? (
            <EmptyState title={t('plantDetail.noPhotosYet')} description={t('plantDetail.noPhotosDescription')} />
          ) : (
            <div className="plant-detail-v3__photo-grid">
              {sortedPhotos.map((photo, index) => (
                <article className={`plant-detail-v3__photo-card${photo.isPrimary ? ' plant-detail-v3__photo-card--primary' : ''}`} key={photo.id}>
                  <button className="plant-detail-v3__photo-card-image" type="button" onClick={() => setActiveIndex(index)}>
                    <img alt={photo.fileName} src={photo.fileUrl} />
                  </button>
                  <div className="plant-detail-v3__photo-card-meta">
                    <div className="plant-detail-v3__photo-card-copy">
                      <strong>{photo.photoTypeName ?? t('plantDetail.notSpecified')}</strong>
                      <p>{photo.fileName}</p>
                    </div>
                    <div className="plant-detail-v3__photo-card-badges">
                      {photo.isPrimary ? <StatusBadge label={t('plantDetail.primary')} variant="success" /> : null}
                      <StatusBadge label={photo.isActive ? t('records.active') : t('records.inactive')} variant={photo.isActive ? 'success' : 'neutral'} />
                    </div>
                  </div>
                  <dl className="plant-detail-v3__photo-card-details">
                    <div>
                      <dt>Tipus de foto</dt>
                      <dd>{photo.photoTypeName ?? t('plantDetail.notSpecified')}</dd>
                    </div>
                    <div>
                      <dt>Data de la foto</dt>
                      <dd>{formatPhotoDate(photo.createdAt)}</dd>
                    </div>
                  </dl>
                  <div className="plant-detail-v3__photo-card-actions">
                    <button className="ghost-button" disabled title="Set primary action hook pending." type="button">
                      {photo.isPrimary ? <CheckCircle2 size={15} /> : <Star size={15} />}
                      <span>{photo.isPrimary ? t('plantDetail.primary') : t('plantDetail.setPrimary')}</span>
                    </button>
                    <button className="ghost-button" disabled title="Delete photo action hook pending." type="button">
                      <Trash2 size={15} />
                      <span>{t('plantDetail.delete')}</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {featuredPhotoUrl && sortedPhotos.length === 0 ? (
          <section className="panel-card plant-detail-v3__section-card">
            <div className="plant-detail-v3__context-card">
              <span className="plant-detail-v3__care-icon"><ImageUp size={18} /></span>
              <div>
                <strong>Imatge principal disponible</strong>
                <p>Hi ha una imatge principal registrada, però la galeria detallada encara no està sincronitzada en aquesta resposta.</p>
              </div>
            </div>
          </section>
        ) : null}
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
