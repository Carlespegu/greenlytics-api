import type { ReactNode } from 'react';

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
  return (
    <section className="plant-create-v2__section">
      <div className="plant-create-v2__section-head">
        <h4>{title}</h4>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>

      <div className="plant-create-v2__form-grid plant-create-v2__form-grid--two">
        <Field label="Code" error={fieldErrors.code} required>
          <input
            value={draft.code}
            onChange={(event) => onChange('code', event.target.value)}
            placeholder="PLT-001"
          />
        </Field>

        <Field label="Name" error={fieldErrors.name} required>
          <input
            value={draft.name}
            onChange={(event) => onChange('name', event.target.value)}
            placeholder="Plant name"
          />
        </Field>

        {!showRequiredOnly ? (
          <>
            <Field label="Installation" error={fieldErrors.installationId}>
              <select
                value={draft.installationId}
                onChange={(event) => onChange('installationId', event.target.value)}
                disabled={installationsLoading}
              >
                <option value="">Seleccionar installacio</option>
                {installations.map((installation) => (
                  <option key={installation.id} value={installation.id}>
                    {installation.name ?? installation.code ?? installation.id}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Scientific name" error={fieldErrors.scientificName}>
              <input
                value={draft.scientificName}
                onChange={(event) => onChange('scientificName', event.target.value)}
                placeholder="Spathiphyllum"
              />
            </Field>

            <Field label="Common name" error={fieldErrors.commonName}>
              <input
                value={draft.commonName}
                onChange={(event) => onChange('commonName', event.target.value)}
                placeholder={mode === 'ai' ? 'Proposta editable del backend' : 'Nom popular de la planta'}
              />
            </Field>

            <Field label="Plant type" error={fieldErrors.plantTypeId}>
              <select
                value={draft.plantTypeId}
                onChange={(event) => onChange('plantTypeId', event.target.value)}
                disabled={catalogsLoading}
              >
                <option value="">{catalogsLoading ? 'Carregant tipologies...' : 'Seleccionar tipus de planta'}</option>
                {plantTypes.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name ?? option.code ?? option.id}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Planting type" error={fieldErrors.plantingTypeId}>
              <select
                value={draft.plantingTypeId}
                onChange={(event) => onChange('plantingTypeId', event.target.value)}
                disabled={catalogsLoading}
              >
                <option value="">{catalogsLoading ? 'Carregant tipologies...' : 'Seleccionar tipus de plantacio'}</option>
                {plantingTypes.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name ?? option.code ?? option.id}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Location type" error={fieldErrors.locationTypeId}>
              <select
                value={draft.locationTypeId}
                onChange={(event) => onChange('locationTypeId', event.target.value)}
                disabled={catalogsLoading}
              >
                <option value="">{catalogsLoading ? 'Carregant tipologies...' : 'Seleccionar tipus d ubicacio'}</option>
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
        <Field label="Notes">
          <textarea
            value={draft.notes}
            onChange={(event) => onChange('notes', event.target.value)}
            placeholder="Observacions visibles, estat general o incidencies..."
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
