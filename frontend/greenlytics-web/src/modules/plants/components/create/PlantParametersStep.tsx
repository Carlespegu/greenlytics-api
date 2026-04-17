import type { ReactNode } from 'react';

import { sunExposureOptions } from '@/modules/plants/helpers/sunExposure';
import type { PlantDraft } from '@/modules/plants/types/plant.types';

interface PlantParametersStepProps {
  draft: PlantDraft;
  floweringMonths: number[];
  fertilizationSeasons: string[];
  onChange: <K extends keyof PlantDraft>(field: K, value: PlantDraft[K]) => void;
  onFloweringMonthsChange: (value: number[]) => void;
  onFertilizationSeasonsChange: (value: string[]) => void;
}

const months = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
const seasons = [
  { id: 'winter', label: 'Hivern' },
  { id: 'spring', label: 'Primavera' },
  { id: 'summer', label: 'Estiu' },
  { id: 'autumn', label: 'Tardor' },
];

export function PlantParametersStep({
  draft,
  floweringMonths,
  fertilizationSeasons,
  onChange,
  onFloweringMonthsChange,
  onFertilizationSeasonsChange,
}: PlantParametersStepProps) {
  function handleLightExposureChange(value: string) {
    const selectedOption = sunExposureOptions.find((option) => option.value === value);
    onChange('lightExposureCode', value);
    onChange('lightExposureLabel', selectedOption?.label ?? '');
  }

  return (
    <section className="plant-create-v2__section">
      <div className="plant-create-v2__section-head">
        <h4>Necessitats i parametres</h4>
        <p>Aquests rangs serviran despres per comparar les lectures dels dispositius.</p>
      </div>

      <div className="plant-create-v2__parameters-layout">
        <div className="plant-create-v2__parameters-main">
          <div className="plant-create-v2__ranges">
            <RangeField
              label="Humitat sol"
              minValue={draft.soilMoistureMin}
              maxValue={draft.soilMoistureMax}
              minPlaceholder="Min %"
              maxPlaceholder="Max %"
              onMinChange={(value) => onChange('soilMoistureMin', value)}
              onMaxChange={(value) => onChange('soilMoistureMax', value)}
            />
            <RangeField
              label="Humitat aire"
              minValue={draft.airHumidityMin}
              maxValue={draft.airHumidityMax}
              minPlaceholder="Min %"
              maxPlaceholder="Max %"
              onMinChange={(value) => onChange('airHumidityMin', value)}
              onMaxChange={(value) => onChange('airHumidityMax', value)}
            />
            <RangeField
              label="Temperatura"
              minValue={draft.temperatureMin}
              maxValue={draft.temperatureMax}
              minPlaceholder="Min C"
              maxPlaceholder="Max C"
              onMinChange={(value) => onChange('temperatureMin', value)}
              onMaxChange={(value) => onChange('temperatureMax', value)}
            />
            <RangeField
              label="Llum"
              minValue={draft.lightMin}
              maxValue={draft.lightMax}
              minPlaceholder="Min lux"
              maxPlaceholder="Max lux"
              onMinChange={(value) => onChange('lightMin', value)}
              onMaxChange={(value) => onChange('lightMax', value)}
            />
          </div>

          <div className="plant-create-v2__form-grid plant-create-v2__form-grid--two">
            <Field label="Exposicio lum">
              <select value={draft.lightExposureCode} onChange={(event) => handleLightExposureChange(event.target.value)}>
                <option value="">Seleccionar exposicio</option>
                {sunExposureOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Soil type">
              <input value={draft.soilType} onChange={(event) => onChange('soilType', event.target.value)} placeholder="Organic, drenat, acid..." />
            </Field>
            <Field label="Fertilizer">
              <input value={draft.fertilizer} onChange={(event) => onChange('fertilizer', event.target.value)} placeholder="NPK, organic, liquid..." />
            </Field>
          </div>
        </div>

        <div className="plant-create-v2__parameters-side">
          <div className="plant-create-v2__selector-card">
            <strong>Floracio</strong>
            <div className="plant-create-v2__chip-grid plant-create-v2__chip-grid--months">
              {months.map((month, index) => {
                const active = floweringMonths.includes(index);
                return (
                  <button
                    key={month}
                    type="button"
                    className={`plant-create-v2__chip${active ? ' plant-create-v2__chip--green' : ''}`}
                    onClick={() => onFloweringMonthsChange(toggleMonth(floweringMonths, index))}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="plant-create-v2__selector-card">
            <strong>Epoca fertilitzacio</strong>
            <div className="plant-create-v2__chip-grid plant-create-v2__chip-grid--seasons">
              {seasons.map((season) => {
                const active = fertilizationSeasons.includes(season.id);
                return (
                  <button
                    key={season.id}
                    type="button"
                    className={`plant-create-v2__chip${active ? ' plant-create-v2__chip--amber' : ''}`}
                    onClick={() => onFertilizationSeasonsChange(toggleSeason(fertilizationSeasons, season.id))}
                  >
                    {season.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type RangeFieldProps = {
  label: string;
  minValue: string;
  maxValue: string;
  minPlaceholder: string;
  maxPlaceholder: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
};

function RangeField({ label, minValue, maxValue, minPlaceholder, maxPlaceholder, onMinChange, onMaxChange }: RangeFieldProps) {
  return (
    <div className="plant-create-v2__range-field">
      <span>{label}</span>
      <div className="plant-create-v2__range-grid">
        <input value={minValue} onChange={(event) => onMinChange(event.target.value)} placeholder={minPlaceholder} />
        <input value={maxValue} onChange={(event) => onMaxChange(event.target.value)} placeholder={maxPlaceholder} />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="plant-create-v2__field">
      <span>{label}</span>
      <div className="plant-create-v2__field-control">{children}</div>
    </label>
  );
}

function toggleMonth(values: number[], monthIndex: number) {
  return values.includes(monthIndex)
    ? values.filter((value) => value !== monthIndex)
    : [...values, monthIndex].sort((left, right) => left - right);
}

function toggleSeason(values: string[], seasonId: string) {
  return values.includes(seasonId)
    ? values.filter((value) => value !== seasonId)
    : [...values, seasonId];
}
