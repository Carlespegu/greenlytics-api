import type { ReactNode } from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export function SectionHeading({ title, subtitle, action }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
