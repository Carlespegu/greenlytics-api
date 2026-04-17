import type { ReactNode } from 'react';

interface RecordsPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function RecordsPageHeader({ title, subtitle, actions, className }: RecordsPageHeaderProps) {
  return (
    <section className={`records-page-header${className ? ` ${className}` : ''}`}>
      <div className="records-page-header__copy">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="records-page-header__actions">{actions}</div> : null}
    </section>
  );
}
