import type { ReactNode } from 'react';

import { useI18n } from '@/app/i18n/LanguageProvider';
import type { OptionItem, PlantDraft } from '@/modules/plants/types/plant.types';

interface PlantBasicDataStepProps {
  mode: 'manual' | 'ai';
  draft: PlantDraft;
  fieldErrors: Record<string, string>;
  installations: OptionItem[];
  plantTypes: OptionItem[];
  plantingTypes: OptionItem[];
  locationTypes: OptionItem[];
  installationsLoading: boolean;
  catalogsLoading?: boolean;
  showRequiredOnly?: boolean;
  title: string;
  subtitle?: string;
  onChange: <K extends keyof PlantDraft>(field: K, value: PlantDraft[K]) => void;
}

export function PlantBasicDataStep({
  mode,
  draft,
  fieldErrors,
  installations,
  plantTypes,
  plantingTypes,
  locationTypes,
  installationsLoading,
  catalogsLoading = false,
  showRequiredOnly = false,
  title,
  subtitle,
  onChange,
}: PlantBasicDataStepProps) {
  const { t } = useI18n();

  return (
    <section className="plant-create-v2__section">
      <div className="plant-create-v2__section-head">
        <h4>{title}</h4>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>

      <div className="plant-create-v2__form-grid plant-create-v2__form-grid--two">
        <Field label={t('plantCreate.code')} error={fieldErrors.code} required>
          <input
            value={draft.code}
            onChange={(event) => onChange('code', event.target.value)}
            placeholder="PLT-001"
          />
        </Field>

        <Field label={t('plantCreate.name')} error={fieldErrors.name} required>
          <input
            value={draft.name}
            onChange={(event) => onChange('name', event.target.value)}
            placeholder={t('plantCreate.plantNamePlaceholder')}
          />
        </Field>

        {!showRequiredOnly ? (
          <>
            <Field label={t('plantCreate.installation')} error={fieldErrors.installationId}>
              <select
                value={draft.installationId}
                onChange={(event) => onChange('installationId', event.target.value)}
                disabled={installationsLoading}
              >
                <option value="">{installationsLoading ? t('plantCreate.loadingInstallations') : t('plantCreate.selectInstallation')}</option>
                {installations.map((installation) => (
                  <option key={installation.id} value={installation.id}>
                    {installation.name ?? installation.code ?? installation.id}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t('plantCreate.scientificName')} error={fieldErrors.scientificName}>
              <input
                value={draft.scientificName}
                onChange={(event) => onChange('scientificName', event.target.value)}
                placeholder={t('plantCreate.scientificNamePlaceholder')}
              />
            </Field>

            <Field label={t('plantCreate.commonName')} error={fieldErrors.commonName}>
              <input
                value={draft.commonName}
                onChange={(event) => onChange('commonName', event.target.value)}
                placeholder={mode === 'ai' ? t('plantCreate.backendProposalPlaceholder') : t('plantCreate.commonNamePlaceholder')}
              />
            </Field>

            <Field label={t('plantCreate.plantType')} error={fieldErrors.plantTypeId}>
              <select
                value={draft.plantTypeId}
                onChange={(event) => onChange('plantTypeId', event.target.value)}
                disabled={catalogsLoading}
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
                onChange={(event) => onChange('plantingTypeId', event.target.value)}
                disabled={catalogsLoading}
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
                onChange={(event) => onChange('locationTypeId', event.target.value)}
                disabled={catalogsLoading}
              >
                <option value="">{catalogsLoading ? t('plantCreate.loadingTypes') : t('plantCreate.selectLocationType')}</option>
                {locationTypes.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name ?? option.code ?? option.id}
                  </option>
                ))}
              </select>
            </Field>
          </>
        ) : null}
      </div>

      {!showRequiredOnly ? (
        <Field label={t('plantCreate.notes')}>
          <textarea
            value={draft.notes}
            onChange={(event) => onChange('notes', event.target.value)}
            placeholder={t('plantCreate.notesPlaceholder')}
          />
        </Field>
      ) : null}
    </section>
  );
}

type FieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
};

function Field({ label, required = false, error, children }: FieldProps) {
  return (
    <label className="plant-create-v2__field">
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      <div className="plant-create-v2__field-control">{children}</div>
      {error ? <small className="records-field__error">{error}</small> : null}
    </label>
  );
}
