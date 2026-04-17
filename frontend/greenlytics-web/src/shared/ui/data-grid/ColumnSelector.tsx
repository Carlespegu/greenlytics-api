import { Check, ChevronDown, ChevronDownIcon, ChevronUp, Columns3 } from 'lucide-react';

import { Dropdown } from '@/shared/ui/Dropdown';

interface ColumnSelectorItem {
  id: string;
  label: string;
  visible: boolean;
}

interface ColumnSelectorProps {
  columns: ColumnSelectorItem[];
  onMoveDown: (columnId: string) => void;
  onMoveUp: (columnId: string) => void;
  onToggle: (columnId: string) => void;
}

export function ColumnSelector({ columns, onMoveDown, onMoveUp, onToggle }: ColumnSelectorProps) {
  return (
    <Dropdown
      align="right"
      className="records-column-selector"
      panelClassName="records-column-selector__panel"
      triggerClassName="records-column-selector__trigger"
      trigger={() => (
        <>
          <Columns3 size={16} />
          <span>Columns</span>
          <ChevronDown size={16} />
        </>
      )}
    >
      <div className="records-column-selector__list" role="menu">
        {columns.map((column, index) => (
          <div className="records-column-selector__item" key={column.id}>
            <button className="records-column-selector__toggle" type="button" onClick={() => onToggle(column.id)}>
              <span className={`records-column-selector__check${column.visible ? ' records-column-selector__check--visible' : ''}`}>
                {column.visible ? <Check size={14} /> : null}
              </span>
              <span>{column.label}</span>
            </button>
            <div className="records-column-selector__order">
              <button aria-label={`Move ${column.label} up`} disabled={index === 0} type="button" onClick={() => onMoveUp(column.id)}>
                <ChevronUp size={14} />
              </button>
              <button aria-label={`Move ${column.label} down`} disabled={index === columns.length - 1} type="button" onClick={() => onMoveDown(column.id)}>
                <ChevronDownIcon size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Dropdown>
  );
}
