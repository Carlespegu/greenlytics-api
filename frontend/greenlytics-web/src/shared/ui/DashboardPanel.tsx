import type { PropsWithChildren, ReactNode } from 'react';

interface DashboardPanelProps extends PropsWithChildren {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}

export function DashboardPanel({ title, eyebrow, action, className, children }: DashboardPanelProps) {
  return (
    <section className={`dashboard-panel ${className ?? ''}`.trim()}>
      <header className="dashboard-panel__header">
        <div>
          {eyebrow ? <span className="dashboard-panel__eyebrow">{eyebrow}</span> : null}
          <h3>{title}</h3>
        </div>
        {action ? <div>{action}</div> : null}
      </header>
      {children}
    </section>
  );
}
