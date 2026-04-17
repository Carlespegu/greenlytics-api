import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';

import { Modal } from '@/shared/ui/Modal';

interface ColumnField {
  key: string;
  label: string;
}

interface ColumnSelectorModalProps {
  fields: ColumnField[];
  open: boolean;
  selectedKeys: string[];
  onClose: (nextSelectedKeys: string[]) => void;
}

export function ColumnSelectorModal({ fields, open, selectedKeys, onClose }: ColumnSelectorModalProps) {
  const [draftSelectedKeys, setDraftSelectedKeys] = useState<string[]>(selectedKeys);
  const [selectedAvailableKey, setSelectedAvailableKey] = useState<string | null>(null);
  const [selectedUsedKey, setSelectedUsedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraftSelectedKeys(selectedKeys);
    setSelectedAvailableKey(null);
    setSelectedUsedKey(null);
  }, [open, selectedKeys]);

  const usedFields = useMemo(
    () => draftSelectedKeys
      .map((key) => fields.find((field) => field.key === key))
      .filter((field): field is ColumnField => Boolean(field)),
    [draftSelectedKeys, fields],
  );

  const availableFields = useMemo(
    () => fields.filter((field) => !draftSelectedKeys.includes(field.key)),
    [draftSelectedKeys, fields],
  );

  function moveToUsed(fieldKey: string | null) {
    if (!fieldKey || draftSelectedKeys.includes(fieldKey)) {
      return;
    }

    setDraftSelectedKeys((current) => [...current, fieldKey]);
    setSelectedAvailableKey(null);
    setSelectedUsedKey(fieldKey);
  }

  function moveToAvailable(fieldKey: string | null) {
    if (!fieldKey) {
      return;
    }

    setDraftSelectedKeys((current) => {
      if (current.length <= 1) {
        return current;
      }

      return current.filter((key) => key !== fieldKey);
    });
    setSelectedUsedKey(null);
    setSelectedAvailableKey(fieldKey);
  }

  function moveAllToUsed() {
    setDraftSelectedKeys(fields.map((field) => field.key));
    setSelectedAvailableKey(null);
  }

  function cleanUsed() {
    setDraftSelectedKeys((current) => current.slice(0, 1));
    setSelectedUsedKey(null);
  }

  function moveUsed(fieldKey: string | null, direction: -1 | 1) {
    if (!fieldKey) {
      return;
    }

    setDraftSelectedKeys((current) => {
      const currentIndex = current.indexOf(fieldKey);
      const nextIndex = currentIndex + direction;

      if (currentIndex === -1 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const nextItems = [...current];
      const [moved] = nextItems.splice(currentIndex, 1);
      nextItems.splice(nextIndex, 0, moved);
      return nextItems;
    });
  }

  return (
    <Modal
      footer={(
        <button className="primary-button" type="button" onClick={() => onClose(draftSelectedKeys)}>
          Close
        </button>
      )}
      open={open}
      title="Select Columns"
      onClose={() => onClose(draftSelectedKeys)}
    >
      <div className="column-modal">
        <section className="column-modal__group">
          <header className="column-modal__header">
            <span>Available</span>
            <strong>{availableFields.length}</strong>
          </header>
          <div className="column-modal__list" role="listbox">
            {availableFields.map((field) => (
              <button
                className={`column-modal__item${selectedAvailableKey === field.key ? ' column-modal__item--selected' : ''}`}
                key={field.key}
                type="button"
                onClick={() => setSelectedAvailableKey(field.key)}
                onDoubleClick={() => moveToUsed(field.key)}
              >
                {field.label}
              </button>
            ))}
          </div>
        </section>

        <div className="column-modal__actions">
          <button className="secondary-button" disabled={!selectedAvailableKey} type="button" onClick={() => moveToUsed(selectedAvailableKey)}>
            <ArrowRight size={16} />
            <span>&gt;&gt;</span>
          </button>
          <button className="secondary-button" disabled={!selectedUsedKey || draftSelectedKeys.length <= 1} type="button" onClick={() => moveToAvailable(selectedUsedKey)}>
            <ArrowLeft size={16} />
            <span>&lt;&lt;</span>
          </button>
          <button className="ghost-button" disabled={availableFields.length === 0} type="button" onClick={moveAllToUsed}>
            All
          </button>
          <button className="ghost-button" disabled={draftSelectedKeys.length <= 1} type="button" onClick={cleanUsed}>
            Clean
          </button>
        </div>

        <section className="column-modal__group">
          <header className="column-modal__header">
            <span>Used</span>
            <strong>{usedFields.length}</strong>
          </header>
          <div className="column-modal__list" role="listbox">
            {usedFields.map((field, index) => (
              <div className={`column-modal__used-row${selectedUsedKey === field.key ? ' column-modal__used-row--selected' : ''}`} key={field.key}>
                <button
                  className="column-modal__item column-modal__item--used"
                  type="button"
                  onClick={() => setSelectedUsedKey(field.key)}
                  onDoubleClick={() => moveToAvailable(field.key)}
                >
                  {field.label}
                </button>
                <div className="column-modal__reorder">
                  <button aria-label={`Move ${field.label} up`} disabled={index === 0} type="button" onClick={() => moveUsed(field.key, -1)}>
                    <ChevronUp size={14} />
                  </button>
                  <button aria-label={`Move ${field.label} down`} disabled={index === usedFields.length - 1} type="button" onClick={() => moveUsed(field.key, 1)}>
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Modal>
  );
}
