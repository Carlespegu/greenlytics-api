import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <section className="module-hero">
      <div>
        <span className="kicker">GreenLytics V3</span>
        <h1>{title}</h1>
        <p className="page-subtitle">{description}</p>
        {children}
      </div>
      {actions ? <div className="module-actions">{actions}</div> : null}
    </section>
  );
}
