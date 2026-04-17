import type { PropsWithChildren, ReactNode } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

import { useI18n } from '@/app/i18n/LanguageProvider';

interface FilterBarProps extends PropsWithChildren {
  activeCount: number;
  isOpen: boolean;
  actions?: ReactNode;
  onToggle: () => void;
}

export function FilterBar({ activeCount, isOpen, actions, onToggle, children }: FilterBarProps) {
  const { t } = useI18n();

  return (
    <section className={`records-filter-bar${isOpen ? ' records-filter-bar--open' : ''}`}>
      <button
        aria-expanded={isOpen}
        className="records-filter-bar__toggle"
        type="button"
        onClick={onToggle}
      >
        <span className="records-filter-bar__toggle-copy">
          <SlidersHorizontal size={16} />
          <span>{t('records.filters')}</span>
        </span>
        <span className="records-filter-bar__toggle-meta">
          <span className="records-filter-bar__count">{activeCount}</span>
          <ChevronDown className={`records-filter-bar__chevron${isOpen ? ' records-filter-bar__chevron--open' : ''}`} size={16} />
        </span>
      </button>

      {isOpen ? (
        <div className="records-filter-bar__panel records-filter-bar__panel--open">
          <div className="records-filter-bar__content">
            {children}
            {actions ? <div className="records-filter-bar__actions">{actions}</div> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
