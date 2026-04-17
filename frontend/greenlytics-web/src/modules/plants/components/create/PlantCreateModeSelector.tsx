import type { CreateMode } from '@/modules/plants/types/plant.types';

interface PlantCreateModeSelectorProps {
  mode: CreateMode;
  onChange: (mode: CreateMode) => void;
}

export function PlantCreateModeSelector({ mode, onChange }: PlantCreateModeSelectorProps) {
  return (
    <section className="plant-create-v2__modes">
      <button
        type="button"
        className={`plant-create-v2__mode-card${mode === 'manual' ? ' plant-create-v2__mode-card--active' : ''}`}
        onClick={() => onChange('manual')}
      >
        <div className="plant-create-v2__mode-header">
          <strong>Alta manual</strong>
          <span className={`plant-create-v2__mode-dot${mode === 'manual' ? ' plant-create-v2__mode-dot--active' : ''}`} />
        </div>
        <span>Introdueix manualment el Code i el Nom.</span>
      </button>

      <button
        type="button"
        className={`plant-create-v2__mode-card${mode === 'ai' ? ' plant-create-v2__mode-card--active' : ''}`}
        onClick={() => onChange('ai')}
      >
        <div className="plant-create-v2__mode-header">
          <strong>Alta amb IA</strong>
          <span className={`plant-create-v2__mode-dot${mode === 'ai' ? ' plant-create-v2__mode-dot--active' : ''}`} />
        </div>
        <span>Puja 3 fotos i deixa que la IA proposi els camps.</span>
      </button>
    </section>
  );
}
