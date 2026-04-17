import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useI18n } from '@/app/i18n/LanguageProvider';
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
  const { t } = useI18n();
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
  const steps = useMemo(
    () => (
      mode === 'manual'
        ? [
            { id: 1, label: t('plantCreate.requiredDataStep') },
            { id: 2, label: t('plantCreate.botanicalRecordStep') },
            { id: 3, label: t('plantCreate.parametersValidationStep') },
          ]
        : [
            { id: 1, label: t('plantCreate.photosAndAiStep') },
            { id: 2, label: t('plantCreate.reviewProposalStep') },
            { id: 3, label: t('plantCreate.parametersValidationStep') },
          ]
    ),
    [mode, t],
  );
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
      setFieldErrors((current) => ({ ...current, photos: t('plantCreate.invalidPhotoType') }));
      return;
    }

    if (file.size > maxPhotoSizeBytes) {
      setFieldErrors((current) => ({ ...current, photos: t('plantCreate.invalidPhotoSize') }));
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
      setFieldErrors((current) => ({ ...current, photos: t('plantCreate.uploadThreePhotosBeforeAi') }));
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
        setSubmitMessage(t('plantCreate.aiAnalysisError'));
      }
    }
  }

  function validateCurrentStep() {
    const errors: Record<string, string> = {};

    if (step === 1 && mode === 'manual') {
      if (!draft.code.trim()) {
        errors.code = t('plantCreate.codeRequired');
      }

      if (!draft.name.trim()) {
        errors.name = t('plantCreate.nameRequired');
      }
    }

    if (step === 1 && mode === 'ai') {
      if (uploadedCount !== 3) {
        errors.photos = t('plantCreate.uploadThreePhotosBeforeContinue');
      } else if (aiPhase !== 'completed') {
        errors.photos = t('plantCreate.runAiBeforeContinue');
      }
    }

    if (step === 2 && mode === 'ai') {
      if (!draft.code.trim()) {
        errors.code = t('plantCreate.codeRequired');
      }

      if (!draft.name.trim()) {
        errors.name = t('plantCreate.nameRequired');
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleFinalSave() {
    const errors: Record<string, string> = {};
    if (!draft.code.trim()) {
      errors.code = t('plantCreate.codeRequired');
    }

    if (!draft.name.trim()) {
      errors.name = t('plantCreate.nameRequired');
    }

    if (!draft.installationId.trim()) {
      errors.installationId = t('plantCreate.installationRequired');
    }

    if (mode === 'ai' && uploadedCount !== 3) {
      errors.photos = t('plantCreate.photosRequiredForBackend');
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSubmitMessage(t('plantCreate.completeRequiredFields'));
      setStep(uploadedCount !== 3 && mode === 'ai' ? 1 : 2);
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(t('plantCreate.savingPlant'));

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
        setSubmitMessage(t('plantCreate.saveFailed'));
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
                <strong>{draft.name || result.analysis.species || t('plantCreate.createdTitleFallback')}</strong>
                <span>{t('plantCreate.createdSubtitle')}</span>
              </div>
            </div>

            <div className="create-plant-result-card__stats">
              <div>
                <strong>{result.plantId}</strong>
                <span>{t('plantCreate.plantId')}</span>
              </div>
              <div>
                <strong>{result.photos.length}</strong>
                <span>{t('plantCreate.persistedPhotos')}</span>
              </div>
              <div>
                <strong>{result.analysis.confidence !== null ? `${Math.round(result.analysis.confidence * 100)}%` : 'N/A'}</strong>
                <span>{t('plantCreate.backendConfidence')}</span>
              </div>
            </div>

            <div className="create-plant-review-card">
              <div className="create-plant-review-card__header">
                <strong>{t('plantCreate.analysisSummary')}</strong>
                <StatusBadge label={result.analysis.healthStatus ?? t('plantCreate.unknown')} variant={resolveHealthVariant(result.analysis.healthStatus)} />
              </div>
              <span>{result.analysis.species ?? t('plantCreate.noSpeciesReturned')}</span>
              <p className="create-plant-result-card__insights">{result.analysis.insights ?? t('plantCreate.noAdditionalInsights')}</p>
            </div>
          </article>
        </section>

        <div className="plant-create-v2__actions">
          <button className="secondary-button" type="button" onClick={onClose}>{t('plantCreate.backToList')}</button>
          <a className="primary-button" href={`/plants/${result.plantId}`}>{t('plantCreate.openPlant')}</a>
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
              <span>{t('plantCreate.step', { count: item.id })}</span>
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
              title={t('plantCreate.requiredDataTitle')}
              subtitle={t('plantCreate.requiredDataSubtitle')}
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
                title={t('plantCreate.commonDataTitle')}
                subtitle={t('plantCreate.commonDataSubtitle')}
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
        <button className="ghost-button" type="button" onClick={onClose} disabled={isSubmitting || isAiRunning}>{t('plantCreate.cancel')}</button>
        {step > 1 ? (
          <button
            className="secondary-button"
            type="button"
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            disabled={isSubmitting || isAiRunning}
          >
            {t('plantCreate.back')}
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
            {t('plantCreate.continue')}
          </button>
        ) : (
          <button
            className="primary-button"
            type="button"
            onClick={() => void handleFinalSave()}
            disabled={isSubmitting || isAiRunning || !canSaveToBackend}
          >
            {isSubmitting ? <LoaderCircle className="spin" size={16} /> : null}
            <span>{isSubmitting ? t('plantCreate.savingPlantButton') : t('plantCreate.save')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
