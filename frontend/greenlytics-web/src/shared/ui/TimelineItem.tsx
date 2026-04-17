import type { ReactNode } from 'react';

interface TimelineItemProps {
  title: string;
  date: string;
  summary?: string;
  meta?: ReactNode;
  children?: ReactNode;
  highlight?: boolean;
}

export function TimelineItem({ title, date, summary, meta, children, highlight = false }: TimelineItemProps) {
  return (
    <article className={`timeline-card${highlight ? ' timeline-card--highlight' : ''}`}>
      <div className="timeline-card__header">
        <div>
          <span className="timeline-card__date">{date}</span>
          <strong>{title}</strong>
        </div>
        {meta ? <div className="timeline-card__meta">{meta}</div> : null}
      </div>
      {summary ? <p className="timeline-card__summary">{summary}</p> : null}
      {children}
    </article>
  );
}
