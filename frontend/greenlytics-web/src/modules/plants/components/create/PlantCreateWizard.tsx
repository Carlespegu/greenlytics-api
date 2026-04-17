import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { isApiError } from '@/shared/api/errors';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import type { BackendValidationError } from '@/types/api';
import { usePlantAiSimulation } from '@/modules/plants/hooks/usePlantAiSimulation';
import type { CreatePlantModalProps, CreateMode, PhotoSlotKey, PlantDraft, PlantPhotoDraft } from '@/modules/plants/types/plant.types';
import { PlantAiReviewStep } from './PlantAiReviewStep';
import { PlantBasicDataStep } from './PlantBasicDataStep';
import { PlantCreateModeSelector } from './PlantCreateModeSelector';
import { PlantParametersStep } from './PlantParametersStep';
import { PlantPhotoUploadStep } from './PlantPhotoUploadStep';

const defaultDraft: PlantDraft = {
  code: '',
  name: '',
  installationId: '',
  plantTypeId: '',
  plantingTypeId: '',
  locationTypeId: '',
  scientificName: '',
  commonName: '',
  notes: '',
  lightExposureCode: '',
  lightExposureLabel: '',
  soilType: '',
  fertilizer: '',
  soilMoistureMin: '',
  soilMoistureMax: '',
  airHumidityMin: '',
  airHumidityMax: '',
  temperatureMin: '',
  temperatureMax: '',
  lightMin: '',
  lightMax: '',
};

const defaultPhotosBySlot: Record<PhotoSlotKey, PlantPhotoDraft | null> = {
  leaf: null,
  stem: null,
  general: null,
};

const maxPhotoSizeBytes = 5 * 1024 * 1024;
const acceptedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

function mapErrorsByField(errors: BackendValidationError[]) {
  return errors.reduce<Record<string, string>>((accumulator, error) => {
    if (!accumulator[error.field]) {
      accumulator[error.field] = error.message;
    }

    return accumulator;
  }, {});
}

function getSteps(mode: CreateMode) {
  return mode === 'manual'
    ? [
        { id: 1, label: 'Dades obligatories' },
        { id: 2, label: 'Fitxa botanica' },
        { id: 3, label: 'Parametres i validacio' },
      ]
    : [
        { id: 1, label: 'Fotos i IA' },
        { id: 2, label: 'Revisio proposta' },
        { id: 3, label: 'Parametres i validacio' },
      ];
}

function resolveHealthVariant(healthStatus: string | null) {
  switch ((healthStatus ?? '').toLowerCase()) {
    case 'healthy':
      return 'success' as const;
    case 'warning':
      return 'warning' as const;
    case 'critical':
      return 'danger' as const;
    default:
      return 'neutral' as const;
  }
}

export function PlantCreateWizard({
  clientId,
  installations,
  plantTypes,
  plantingTypes,
  locationTypes,
  installationsLoading = false,
  catalogsLoading = false,
  onClose,
  onSubmit,
  open,
}: Omit<CreatePlantModalProps, 'open'> & { open: boolean }) {
  const [mode, setMode] = useState<CreateMode>('ai');
  const [step, setStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);
  const [draft, setDraft] = useState<PlantDraft>(defaultDraft);
  const [photosBySlot, setPhotosBySlot] = useState<Record<PhotoSlotKey, PlantPhotoDraft | null>>(defaultPhotosBySlot);
  const [floweringMonths, setFloweringMonths] = useState<number[]>([]);
  const [fertilizationSeasons, setFertilizationSeasons] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<CreatePlantModalProps['onSubmit']>> | null>(null);
  const photosBySlotRef = useRef<Record<PhotoSlotKey, PlantPhotoDraft | null>>(defaultPhotosBySlot);

  const aiSimulation = usePlantAiSimulation(clientId);
  const { phase: aiPhase, proposal: aiProposal, isRunning: isAiRunning, reset: resetAiSimulation, run: runAiSimulation } = aiSimulation;
  const steps = useMemo(() => getSteps(mode), [mode]);
  const uploadedCount = useMemo(() => Object.values(photosBySlot).filter(Boolean).length, [photosBySlot]);
  const canContinueFromManualStepOne = draft.code.trim().length > 0 && draft.name.trim().length > 0;
  const canContinueFromAiStepOne = uploadedCount === 3 && aiPhase === 'completed';
  const canSaveToBackend = mode === 'manual' || uploadedCount === 3;

  useEffect(() => {
    photosBySlotRef.current = photosBySlot;
  }, [photosBySlot]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setMode('ai');
    setStep(1);
    setMaxReachedStep(1);
    setDraft(defaultDraft);
    setPhotosBySlot(defaultPhotosBySlot);
    setFloweringMonths([]);
    setFertilizationSeasons([]);
    setFieldErrors({});
    setSubmitMessage(null);
    setIsSubmitting(false);
    setResult(null);
    resetAiSimulation();
  }, [open, resetAiSimulation]);

  useEffect(() => () => {
    Object.values(photosBySlotRef.current).forEach((photo) => {
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl);
      }
    });
  }, []);

  useEffect(() => {
    setMaxReachedStep((current) => Math.max(current, step));
  }, [step]);

  function handleModeChange(nextMode: CreateMode) {
    setMode(nextMode);
    setStep(1);
    setMaxReachedStep(1);
    setDraft(defaultDraft);
    setFieldErrors({});
    setSubmitMessage(null);
    setResult(null);
    setFloweringMonths([]);
    setFertilizationSeasons([]);
    setPhotosBySlot((current) => {
      Object.values(current).forEach((photo) => {
        if (photo) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      });
      return defaultPhotosBySlot;
    });
    resetAiSimulation();
  }

  function setDraftField<K extends keyof PlantDraft>(field: K, value: PlantDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function handlePhotoSelection(slot: PhotoSlotKey, files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const file = files[0];
    if (!acceptedMimeTypes.has(file.type)) {
      setFieldErrors((current) => ({ ...current, photos: 'Only JPG, PNG and WEBP photos are allowed.' }));
      return;
    }

    if (file.size > maxPhotoSizeBytes) {
      setFieldErrors((current) => ({ ...current, photos: 'Each photo must be 5 MB or smaller.' }));
      return;
    }

    setPhotosBySlot((current) => {
      const previous = current[slot];
      if (previous) {
        URL.revokeObjectURL(previous.previewUrl);
      }

      return {
        ...current,
        [slot]: {
          id: `${slot}-${file.name}-${file.size}-${file.lastModified}`,
          file,
          previewUrl: URL.createObjectURL(file),
          slot,
        },
      };
    });
    resetAiSimulation();

    setFieldErrors((current) => {
      const next = { ...current };
      delete next.photos;
      return next;
    });
  }

  function removePhoto(slot: PhotoSlotKey) {
    setPhotosBySlot((current) => {
      const previous = current[slot];
      if (previous) {
        URL.revokeObjectURL(previous.previewUrl);
      }

      return {
        ...current,
        [slot]: null,
      };
    });
    resetAiSimulation();
  }

  async function handleSimulateAi() {
    if (uploadedCount !== 3) {
      setFieldErrors((current) => ({ ...current, photos: 'Upload the 3 required photos before running the AI simulation.' }));
      return;
    }

    try {
      const simulated = await runAiSimulation(draft, photosBySlot);
      setDraft(simulated.draft);
      setFloweringMonths(simulated.floweringMonths);
      setFertilizationSeasons(simulated.fertilizationSeasons);
      setSubmitMessage(null);
      setStep(2);
    } catch (error) {
      if (isApiError(error)) {
        setFieldErrors(mapErrorsByField(error.validationErrors));
        setSubmitMessage(error.message);
      } else if (error instanceof Error) {
        setSubmitMessage(error.message);
      } else {
        setSubmitMessage('No hem pogut completar l analisi amb IA. Torna-ho a provar.');
      }
    }
  }

  function validateCurrentStep() {
    const errors: Record<string, string> = {};

    if (step === 1 && mode === 'manual') {
      if (!draft.code.trim()) {
        errors.code = 'Code is required.';
      }

      if (!draft.name.trim()) {
        errors.name = 'Name is required.';
      }
    }

    if (step === 1 && mode === 'ai') {
      if (uploadedCount !== 3) {
        errors.photos = 'Upload the 3 required photos before continuing.';
      } else if (aiPhase !== 'completed') {
        errors.photos = 'Run AI analysis before continuing.';
      }
    }

    if (step === 2 && mode === 'ai') {
      if (!draft.code.trim()) {
        errors.code = 'Code is required.';
      }

      if (!draft.name.trim()) {
        errors.name = 'Name is required.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleFinalSave() {
    const errors: Record<string, string> = {};
    if (!draft.code.trim()) {
      errors.code = 'Code is required.';
    }

    if (!draft.name.trim()) {
      errors.name = 'Name is required.';
    }

    if (!draft.installationId.trim()) {
      errors.installationId = 'Installation is required.';
    }

    if (mode === 'ai' && uploadedCount !== 3) {
      errors.photos = 'The 3 photo views are required for the current backend create flow.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSubmitMessage('Completa els camps obligatoris abans de guardar la planta.');
      setStep(uploadedCount !== 3 && mode === 'ai' ? 1 : 2);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('Saving plant with the current backend create endpoint...');

    try {
      const nextResult = await onSubmit({
        code: draft.code.trim(),
        name: draft.name.trim(),
        installationId: draft.installationId || undefined,
        plantTypeId: draft.plantTypeId || undefined,
        plantingTypeId: draft.plantingTypeId || undefined,
        locationTypeId: draft.locationTypeId || undefined,
        commonName: draft.commonName.trim() || undefined,
        scientificName: draft.scientificName.trim() || undefined,
        notes: draft.notes.trim() || undefined,
        leafImage: photosBySlot.leaf?.file,
        trunkImage: photosBySlot.stem?.file,
        generalImage: photosBySlot.general?.file,
      });

      setResult(nextResult);
      setSubmitMessage(null);
    } catch (error) {
      if (isApiError(error)) {
        setFieldErrors(mapErrorsByField(error.validationErrors));
        setSubmitMessage(error.message);
      } else {
        setSubmitMessage('The plant could not be created. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function nextStep() {
    if (!validateCurrentStep()) {
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length));
  }

  function canNavigateToStep(targetStep: number) {
    return targetStep === 1 || targetStep <= maxReachedStep;
  }

  function handleStepClick(targetStep: number) {
    if (!canNavigateToStep(targetStep) || isSubmitting || isAiRunning) {
      return;
    }

    setSubmitMessage(null);
    setStep(targetStep);
  }

  if (result) {
    return (
      <div className="plant-create-v2">
        <section className="create-plant-modal__section create-plant-modal__result">
          <article className="create-plant-result-card">
            <div className="create-plant-result-card__header">
              <CheckCircle2 color="#4ade80" size={22} />
              <div>
                <strong>{draft.name || result.analysis.species || 'Plant created'}</strong>
                <span>La planta s'ha guardat correctament amb el flux actual del backend.</span>
              </div>
            </div>

            <div className="create-plant-result-card__stats">
              <div>
                <strong>{result.plantId}</strong>
                <span>Plant ID</span>
              </div>
              <div>
                <strong>{result.photos.length}</strong>
                <span>Fotos persistides</span>
              </div>
              <div>
                <strong>{result.analysis.confidence !== null ? `${Math.round(result.analysis.confidence * 100)}%` : 'N/A'}</strong>
                <span>Confidence backend</span>
              </div>
            </div>

            <div className="create-plant-review-card">
              <div className="create-plant-review-card__header">
                <strong>Resum analisi backend</strong>
                <StatusBadge label={result.analysis.healthStatus ?? 'Unknown'} variant={resolveHealthVariant(result.analysis.healthStatus)} />
              </div>
              <span>{result.analysis.species ?? 'Sense especie retornada'}</span>
              <p className="create-plant-result-card__insights">{result.analysis.insights ?? 'El backend no ha retornat insights addicionals.'}</p>
            </div>
          </article>
        </section>

        <div className="plant-create-v2__actions">
          <button className="secondary-button" type="button" onClick={onClose}>Tornar al llistat</button>
          <a className="primary-button" href={`/plants/${result.plantId}`}>Obrir planta</a>
        </div>
      </div>
    );
  }

  return (
    <div className="plant-create-v2">
      <section className="plant-create-v2__steps">
        {steps.map((item) => {
          const active = step === item.id;
          const done = step > item.id;
          const clickable = canNavigateToStep(item.id);

          return (
            <button
              key={item.id}
              type="button"
              disabled={!clickable || isSubmitting || isAiRunning}
              onClick={() => handleStepClick(item.id)}
              className={`plant-create-v2__step-card${active ? ' plant-create-v2__step-card--active' : ''}${done ? ' plant-create-v2__step-card--done' : ''}`}
            >
              <span>Step {item.id}</span>
              <strong>{item.label}</strong>
            </button>
          );
        })}
      </section>

      {step === 1 ? <PlantCreateModeSelector mode={mode} onChange={handleModeChange} /> : null}

      {submitMessage ? <div className="create-plant-modal__message">{submitMessage}</div> : null}

      <div className="plant-create-v2__grid plant-create-v2__grid--single">
        <div className="plant-create-v2__content">
          {mode === 'manual' && step === 1 ? (
            <PlantBasicDataStep
              draft={draft}
              fieldErrors={fieldErrors}
              installations={installations}
              plantTypes={plantTypes}
              plantingTypes={plantingTypes}
              locationTypes={locationTypes}
              installationsLoading={installationsLoading}
              catalogsLoading={catalogsLoading}
              mode={mode}
              showRequiredOnly
              title="Dades obligatories"
              subtitle="En aquest mode nomes cal comencar per Code i Nom."
              onChange={setDraftField}
            />
          ) : null}

          {mode === 'manual' && step === 2 ? (
            <>
              <PlantBasicDataStep
                draft={draft}
                fieldErrors={fieldErrors}
                installations={installations}
                plantTypes={plantTypes}
                plantingTypes={plantingTypes}
                locationTypes={locationTypes}
                installationsLoading={installationsLoading}
                catalogsLoading={catalogsLoading}
                mode={mode}
                title="Dades comunes"
                subtitle="Completa la fitxa botanica abans de passar a la validacio final."
                onChange={setDraftField}
              />
              <PlantPhotoUploadStep
                mode="manual"
                photosBySlot={photosBySlot}
                fieldErrors={fieldErrors}
                isAnalyzing={false}
                onRemovePhoto={removePhoto}
                onSelectFile={handlePhotoSelection}
              />
            </>
          ) : null}

          {mode === 'ai' && step === 1 ? (
            <PlantPhotoUploadStep
              mode="ai"
              photosBySlot={photosBySlot}
              fieldErrors={fieldErrors}
              isAnalyzing={isAiRunning}
              onAnalyze={() => void handleSimulateAi()}
              onRemovePhoto={removePhoto}
              onSelectFile={handlePhotoSelection}
            />
          ) : null}

          {mode === 'ai' && step === 2 ? (
            <PlantAiReviewStep
              draft={draft}
              fieldErrors={fieldErrors}
              installations={installations}
              plantTypes={plantTypes}
              plantingTypes={plantingTypes}
              locationTypes={locationTypes}
              installationsLoading={installationsLoading}
              catalogsLoading={catalogsLoading}
              proposal={aiProposal}
              onChange={setDraftField}
            />
          ) : null}

          {step === 3 ? (
            <PlantParametersStep
              draft={draft}
              floweringMonths={floweringMonths}
              fertilizationSeasons={fertilizationSeasons}
              onChange={setDraftField}
              onFloweringMonthsChange={setFloweringMonths}
              onFertilizationSeasonsChange={setFertilizationSeasons}
            />
          ) : null}
        </div>
      </div>

      <div className="plant-create-v2__actions">
        <button className="ghost-button" type="button" onClick={onClose} disabled={isSubmitting || isAiRunning}>Cancel·lar</button>
        {step > 1 ? (
          <button
            className="secondary-button"
            type="button"
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            disabled={isSubmitting || isAiRunning}
          >
            Enrere
          </button>
        ) : null}
        {step < steps.length ? (
          <button
            className="primary-button"
            type="button"
            onClick={nextStep}
            disabled={
              isSubmitting ||
              isAiRunning ||
              (mode === 'manual' ? step === 1 && !canContinueFromManualStepOne : step === 1 && !canContinueFromAiStepOne)
            }
          >
            Continuar
          </button>
        ) : (
          <button
            className="primary-button"
            type="button"
            onClick={() => void handleFinalSave()}
            disabled={isSubmitting || isAiRunning || !canSaveToBackend}
          >
            {isSubmitting ? <LoaderCircle className="spin" size={16} /> : null}
            <span>{isSubmitting ? 'Guardant planta...' : 'Guardar'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
