import type { ReactNode } from 'react';

import { useI18n } from '@/app/i18n/LanguageProvider';
import { StatusBadge } from '@/shared/ui/StatusBadge';
import type { OptionItem, PlantAiProposal, PlantDraft } from '@/modules/plants/types/plant.types';

interface PlantAiReviewStepProps {
  draft: PlantDraft;
  fieldErrors: Record<string, string>;
  installations: OptionItem[];
  plantTypes: OptionItem[];
  plantingTypes: OptionItem[];
  locationTypes: OptionItem[];
  installationsLoading?: boolean;
  catalogsLoading?: boolean;
  proposal: PlantAiProposal;
  onChange: <K extends keyof PlantDraft>(field: K, value: PlantDraft[K]) => void;
}

export function PlantAiReviewStep({
  draft,
  fieldErrors,
  installations,
  plantTypes,
  plantingTypes,
  locationTypes,
  installationsLoading = false,
  catalogsLoading = false,
  proposal,
  onChange,
}: PlantAiReviewStepProps) {
  const { t } = useI18n();

  return (
    <section className="plant-create-v2__section">
      <div className="plant-create-v2__section-head">
        <h4>{t('plantCreate.reviewTitle')}</h4>
        <p>{t('plantCreate.reviewSubtitle')}</p>
      </div>

      <div className="plant-create-v2__inline-badges">
        <StatusBadge
          label={proposal.confidence !== null ? t('plantCreate.confidence', { value: Math.round(proposal.confidence * 100) }) : t('plantCreate.confidencePending')}
          variant={proposal.confidence !== null ? 'success' : 'neutral'}
        />
        <StatusBadge label={t('plantCreate.backendAnalysis')} variant="info" />
      </div>

      <div className="plant-create-v2__form-grid plant-create-v2__form-grid--two">
        <Field label={t('plantCreate.code')} error={fieldErrors.code}>
          <input value={draft.code} onChange={(event) => onChange('code', event.target.value)} placeholder={t('plantCreate.reviewCodePlaceholder')} />
        </Field>

        <Field label={t('plantCreate.name')} error={fieldErrors.name}>
          <input value={draft.name} onChange={(event) => onChange('name', event.target.value)} placeholder={t('plantCreate.reviewNamePlaceholder')} />
        </Field>

        <Field label={t('plantCreate.scientificName')} error={fieldErrors.scientificName}>
          <input value={draft.scientificName} onChange={(event) => onChange('scientificName', event.target.value)} placeholder={t('plantCreate.scientificNamePlaceholder')} />
        </Field>

        <Field label={t('plantCreate.commonName')} error={fieldErrors.commonName}>
          <input value={draft.commonName} onChange={(event) => onChange('commonName', event.target.value)} placeholder={t('plantCreate.reviewCommonNamePlaceholder')} />
        </Field>

        <Field label={t('plantCreate.installation')} error={fieldErrors.installationId}>
          <select
            value={draft.installationId}
            disabled={installationsLoading}
            onChange={(event) => onChange('installationId', event.target.value)}
          >
            <option value="">{installationsLoading ? t('plantCreate.loadingInstallations') : t('plantCreate.selectInstallation')}</option>
            {installations.map((installation) => (
              <option key={installation.id} value={installation.id}>
                {installation.name ?? installation.code ?? installation.id}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('plantCreate.plantType')} error={fieldErrors.plantTypeId}>
          <select
            value={draft.plantTypeId}
            disabled={catalogsLoading}
            onChange={(event) => onChange('plantTypeId', event.target.value)}
          >
            <option value="">{catalogsLoading ? t('plantCreate.loadingTypes') : t('plantCreate.selectPlantType')}</option>
            {plantTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name ?? option.code ?? option.id}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('plantCreate.plantingType')} error={fieldErrors.plantingTypeId}>
          <select
            value={draft.plantingTypeId}
            disabled={catalogsLoading}
            onChange={(event) => onChange('plantingTypeId', event.target.value)}
          >
            <option value="">{catalogsLoading ? t('plantCreate.loadingTypes') : t('plantCreate.selectPlantingType')}</option>
            {plantingTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name ?? option.code ?? option.id}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('plantCreate.locationType')} error={fieldErrors.locationTypeId}>
          <select
            value={draft.locationTypeId}
            disabled={catalogsLoading}
            onChange={(event) => onChange('locationTypeId', event.target.value)}
          >
            <option value="">{catalogsLoading ? t('plantCreate.loadingTypes') : t('plantCreate.selectLocationType')}</option>
            {locationTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name ?? option.code ?? option.id}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t('plantCreate.notes')}>
        <textarea
          value={draft.notes}
          onChange={(event) => onChange('notes', event.target.value)}
          placeholder={t('plantCreate.reviewNotesPlaceholder')}
        />
      </Field>
    </section>
  );
}

type FieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

function Field({ label, error, children }: FieldProps) {
  return (
    <label className="plant-create-v2__field">
      <span>{label}</span>
      <div className="plant-create-v2__field-control">{children}</div>
      {error ? <small className="records-field__error">{error}</small> : null}
    </label>
  );
}
