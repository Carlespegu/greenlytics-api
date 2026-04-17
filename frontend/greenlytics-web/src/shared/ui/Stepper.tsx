import type { ReactNode } from 'react';

interface StepItem {
  id: number;
  label: string;
  description?: string;
}

interface StepperProps {
  currentStep: number;
  items: StepItem[];
  completedStepIds?: number[];
  trailing?: ReactNode;
}

export function Stepper({ currentStep, items, completedStepIds = [], trailing }: StepperProps) {
  return (
    <div className="stepper-shell">
      <div className="stepper-list">
        {items.map((item) => {
          const isActive = item.id == currentStep;
          const isComplete = completedStepIds.includes(item.id) || item.id < currentStep
          return (
            <div
              key={item.id}
              className={`stepper-item${isActive ? ' stepper-item--active' : ''}${isComplete ? ' stepper-item--complete' : ''}`}
            >
              <span className="stepper-item__index">{item.id}</span>
              <div className="stepper-item__body">
                <strong>{item.label}</strong>
                {item.description ? <small>{item.description}</small> : null}
              </div>
            </div>
          );
        })}
      </div>
      {trailing ? <div className="stepper-shell__trailing">{trailing}</div> : null}
    </div>
  );
}
