import { useI18n } from '@/app/i18n/LanguageProvider';
import type { CreateMode } from '@/modules/plants/types/plant.types';

interface PlantCreateModeSelectorProps {
  mode: CreateMode;
  onChange: (mode: CreateMode) => void;
}

export function PlantCreateModeSelector({ mode, onChange }: PlantCreateModeSelectorProps) {
  const { t } = useI18n();

  return (
    <section className="plant-create-v2__modes">
      <button
        type="button"
        className={`plant-create-v2__mode-card${mode === 'manual' ? ' plant-create-v2__mode-card--active' : ''}`}
        onClick={() => onChange('manual')}
      >
        <div className="plant-create-v2__mode-header">
          <strong>{t('plantCreate.manualModeTitle')}</strong>
          <span className={`plant-create-v2__mode-dot${mode === 'manual' ? ' plant-create-v2__mode-dot--active' : ''}`} />
        </div>
        <span>{t('plantCreate.manualModeDescription')}</span>
      </button>

      <button
        type="button"
        className={`plant-create-v2__mode-card${mode === 'ai' ? ' plant-create-v2__mode-card--active' : ''}`}
        onClick={() => onChange('ai')}
      >
        <div className="plant-create-v2__mode-header">
          <strong>{t('plantCreate.aiModeTitle')}</strong>
          <span className={`plant-create-v2__mode-dot${mode === 'ai' ? ' plant-create-v2__mode-dot--active' : ''}`} />
        </div>
        <span>{t('plantCreate.aiModeDescription')}</span>
      </button>
    </section>
  );
}
