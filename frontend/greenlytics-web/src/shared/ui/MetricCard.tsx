import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
  tone?: 'green' | 'amber' | 'red' | 'blue';
  icon: ReactNode;
  hint: string;
}

export function MetricCard({ label, value, delta, trend, tone = 'green', icon, hint }: MetricCardProps) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__header">
        <span className="metric-card__icon">{icon}</span>
        <span className="metric-card__label">{label}</span>
      </div>
      <div className="metric-card__value">{value}</div>
      <div className="metric-card__footer">
        <span className={`metric-card__delta metric-card__delta--${trend}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {delta}
        </span>
        <span className="metric-card__hint">{hint}</span>
      </div>
    </article>
  );
}
