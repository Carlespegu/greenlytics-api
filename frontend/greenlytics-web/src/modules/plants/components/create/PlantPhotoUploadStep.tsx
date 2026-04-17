import { ImagePlus, LoaderCircle, Sparkles, Upload, X } from 'lucide-react';
import { useMemo, useRef } from 'react';

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

const photoSlots: Array<{ key: PhotoSlotKey; title: string; hint: string }> = [
  { key: 'leaf', title: '1. Fulles i flors', hint: 'Primer pla de fulles i, si n hi ha, de la flor.' },
  { key: 'stem', title: '2. Tija', hint: 'Foto de la tija o base per ajudar a la identificacio.' },
  { key: 'general', title: '3. General', hint: 'Vista completa de la planta i del seu port.' },
];

export function PlantPhotoUploadStep({
  photosBySlot,
  fieldErrors,
  isAnalyzing,
  onSelectFile,
  onRemovePhoto,
  onAnalyze,
  mode = 'ai',
}: PlantPhotoUploadStepProps) {
  const inputRefs = {
    leaf: useRef<HTMLInputElement | null>(null),
    stem: useRef<HTMLInputElement | null>(null),
    general: useRef<HTMLInputElement | null>(null),
  };

  const uploadedCount = useMemo(
    () => Object.values(photosBySlot).filter(Boolean).length,
    [photosBySlot],
  );
  const isAiMode = mode === 'ai';

  return (
    <section className="plant-create-v2__section plant-create-v2__section--accent">
      <div className="plant-create-v2__section-head plant-create-v2__section-head--split">
        <div>
          <h4>{isAiMode ? 'Alta amb IA' : 'Fotos de referencia'}</h4>
          <p>{isAiMode ? 'Puja 3 fotos i executa l analisi al backend per preomplir la fitxa.' : 'Puja 3 fotos per adjuntar-les al guardat final sense executar IA.'}</p>
        </div>
        <span className="plant-create-v2__counter">{uploadedCount}/3 fotos</span>
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
                  <span>Sense preview</span>
                </button>
              )}

              <div className="plant-create-v2__photo-actions">
                <input
                  ref={inputRefs[slot.key]}
                  accept="image/png,image/jpeg"
                  className="create-plant-modal__input"
                  type="file"
                  onChange={(event) => onSelectFile(slot.key, event.target.files)}
                />

                <button type="button" className="secondary-button" onClick={() => inputRefs[slot.key].current?.click()}>
                  <Upload size={16} />
                  <span>{photo ? 'Canviar foto' : 'Pujar foto'}</span>
                </button>

                {photo ? (
                  <button type="button" className="ghost-button" onClick={() => onRemovePhoto(slot.key)}>
                    <X size={16} />
                    <span>Eliminar</span>
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
          <p>L analisi retornara una proposta inicial de code, noms i observacions per revisar.</p>
          <button type="button" className="primary-button" disabled={uploadedCount !== 3 || isAnalyzing} onClick={onAnalyze}>
            {isAnalyzing ? <LoaderCircle className="spin" size={16} /> : <Sparkles size={16} />}
            <span>{isAnalyzing ? 'Analitzant...' : 'Analitzar amb IA'}</span>
          </button>
        </div>
      ) : (
        <div className="plant-create-v2__inline-actions">
          <p>Aquestes tres fotos s enviaran directament al backend quan guardis la planta.</p>
        </div>
      )}
    </section>
  );
}
