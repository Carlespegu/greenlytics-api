import type { ReactNode } from 'react';

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
  return (
    <section className="plant-create-v2__section">
      <div className="plant-create-v2__section-head">
        <h4>Revisio proposta</h4>
        <p>Aquests camps provenen de l analisi backend i es poden editar abans del guardat final.</p>
      </div>

      <div className="plant-create-v2__inline-badges">
        <StatusBadge
          label={proposal.confidence !== null ? `Confidence ${Math.round(proposal.confidence * 100)}%` : 'Confidence pendent'}
          variant={proposal.confidence !== null ? 'success' : 'neutral'}
        />
        <StatusBadge label="Analisi backend" variant="info" />
      </div>

      <div className="plant-create-v2__form-grid plant-create-v2__form-grid--two">
        <Field label="Code" error={fieldErrors.code}>
          <input value={draft.code} onChange={(event) => onChange('code', event.target.value)} placeholder="PLT-SPAT-001" />
        </Field>

        <Field label="Name" error={fieldErrors.name}>
          <input value={draft.name} onChange={(event) => onChange('name', event.target.value)} placeholder="Espatifil" />
        </Field>

        <Field label="Scientific name" error={fieldErrors.scientificName}>
          <input value={draft.scientificName} onChange={(event) => onChange('scientificName', event.target.value)} placeholder="Spathiphyllum" />
        </Field>

        <Field label="Common name" error={fieldErrors.commonName}>
          <input value={draft.commonName} onChange={(event) => onChange('commonName', event.target.value)} placeholder="Lliri de la pau" />
        </Field>

        <Field label="Installation" error={fieldErrors.installationId}>
          <select
            value={draft.installationId}
            disabled={installationsLoading}
            onChange={(event) => onChange('installationId', event.target.value)}
          >
            <option value="">{installationsLoading ? 'Carregant installacions...' : 'Seleccionar installacio'}</option>
            {installations.map((installation) => (
              <option key={installation.id} value={installation.id}>
                {installation.name ?? installation.code ?? installation.id}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Plant type" error={fieldErrors.plantTypeId}>
          <select
            value={draft.plantTypeId}
            disabled={catalogsLoading}
            onChange={(event) => onChange('plantTypeId', event.target.value)}
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
            disabled={catalogsLoading}
            onChange={(event) => onChange('plantingTypeId', event.target.value)}
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
            disabled={catalogsLoading}
            onChange={(event) => onChange('locationTypeId', event.target.value)}
          >
            <option value="">{catalogsLoading ? 'Carregant tipologies...' : 'Seleccionar tipus d ubicacio'}</option>
            {locationTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name ?? option.code ?? option.id}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={draft.notes}
          onChange={(event) => onChange('notes', event.target.value)}
          placeholder="Resum visible de l estat actual de la planta..."
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
