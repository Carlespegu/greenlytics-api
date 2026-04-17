import type { ReactNode } from 'react';

interface TimelineListProps {
  children: ReactNode;
}

export function TimelineList({ children }: TimelineListProps) {
  return <div className="timeline-list timeline-list--cards">{children}</div>;
}
