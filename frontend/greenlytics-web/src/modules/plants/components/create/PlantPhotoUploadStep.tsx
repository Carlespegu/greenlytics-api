import { ImagePlus, LoaderCircle, Sparkles, Upload, X } from 'lucide-react';
import { useMemo, useRef } from 'react';

import { useI18n } from '@/app/i18n/LanguageProvider';
import type { PhotoSlotKey, PlantPhotoDraft } from '@/modules/plants/types/plant.types';

interface PlantPhotoUploadStepProps {
  photosBySlot: Record<PhotoSlotKey, PlantPhotoDraft | null>;
  fieldErrors: Record<string, string>;
  isAnalyzing: boolean;
  onSelectFile: (slot: PhotoSlotKey, files: FileList | null) => void;
  onRemovePhoto: (slot: PhotoSlotKey) => void;
  onAnalyze?: () => void;
  mode?: 'manual' | 'ai';
}

export function PlantPhotoUploadStep({
  photosBySlot,
  fieldErrors,
  isAnalyzing,
  onSelectFile,
  onRemovePhoto,
  onAnalyze,
  mode = 'ai',
}: PlantPhotoUploadStepProps) {
  const { t } = useI18n();
  const inputRefs = {
    leaf: useRef<HTMLInputElement | null>(null),
    stem: useRef<HTMLInputElement | null>(null),
    general: useRef<HTMLInputElement | null>(null),
  };

  const photoSlots: Array<{ key: PhotoSlotKey; title: string; hint: string }> = [
    { key: 'leaf', title: t('plantCreate.slotLeafTitle'), hint: t('plantCreate.slotLeafHint') },
    { key: 'stem', title: t('plantCreate.slotStemTitle'), hint: t('plantCreate.slotStemHint') },
    { key: 'general', title: t('plantCreate.slotGeneralTitle'), hint: t('plantCreate.slotGeneralHint') },
  ];

  const uploadedCount = useMemo(
    () => Object.values(photosBySlot).filter(Boolean).length,
    [photosBySlot],
  );
  const isAiMode = mode === 'ai';

  return (
    <section className="plant-create-v2__section plant-create-v2__section--accent">
      <div className="plant-create-v2__section-head plant-create-v2__section-head--split">
        <div>
          <h4>{isAiMode ? t('plantCreate.photosAiTitle') : t('plantCreate.referencePhotosTitle')}</h4>
          <p>{isAiMode ? t('plantCreate.photosAiSubtitle') : t('plantCreate.referencePhotosSubtitle')}</p>
        </div>
        <span className="plant-create-v2__counter">{t('plantCreate.photosCounter', { count: uploadedCount })}</span>
      </div>

      <div className="plant-create-v2__photos-grid">
        {photoSlots.map((slot) => {
          const photo = photosBySlot[slot.key];

          return (
            <div key={slot.key} className="plant-create-v2__photo-card">
              <div>
                <strong>{slot.title}</strong>
                <span>{slot.hint}</span>
              </div>

              {photo ? (
                <img alt={slot.title} className="plant-create-v2__photo-preview" src={photo.previewUrl} />
              ) : (
                <button
                  type="button"
                  className="plant-create-v2__photo-placeholder plant-create-v2__photo-placeholder--button"
                  onClick={() => inputRefs[slot.key].current?.click()}
                >
                  <ImagePlus size={18} />
                  <span>{t('plantCreate.noPreview')}</span>
                </button>
              )}

              <div className="plant-create-v2__photo-actions">
                <input
                  ref={inputRefs[slot.key]}
                  accept="image/png,image/jpeg,image/webp"
                  className="create-plant-modal__input"
                  type="file"
                  onChange={(event) => onSelectFile(slot.key, event.target.files)}
                />

                <button type="button" className="secondary-button" onClick={() => inputRefs[slot.key].current?.click()}>
                  <Upload size={16} />
                  <span>{photo ? t('plantCreate.changePhoto') : t('plantCreate.uploadPhoto')}</span>
                </button>

                {photo ? (
                  <button type="button" className="ghost-button" onClick={() => onRemovePhoto(slot.key)}>
                    <X size={16} />
                    <span>{t('plantCreate.remove')}</span>
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {fieldErrors.photos ? <small className="records-field__error">{fieldErrors.photos}</small> : null}

      {isAiMode ? (
        <div className="plant-create-v2__inline-actions">
          <p>{t('plantCreate.aiProposalHint')}</p>
          <button type="button" className="primary-button" disabled={uploadedCount !== 3 || isAnalyzing} onClick={onAnalyze}>
            {isAnalyzing ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
            <span>{isAnalyzing ? t('plantCreate.analyzing') : t('plantCreate.analyzeWithAi')}</span>
          </button>
        </div>
      ) : (
        <div className="plant-create-v2__inline-actions">
          <p>{t('plantCreate.directUploadHint')}</p>
        </div>
      )}
    </section>
  );
}
