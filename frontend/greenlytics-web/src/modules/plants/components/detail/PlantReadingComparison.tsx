import { RangeIndicator } from '@/shared/ui/RangeIndicator';

export interface ReadingComparisonItem {
  label: string;
  min: number;
  max: number;
  current: number;
  unit: string;
}

interface PlantReadingComparisonProps {
  items: ReadingComparisonItem[];
}

export function PlantReadingComparison({ items }: PlantReadingComparisonProps) {
  return (
    <section className="panel-card">
      <div className="section-heading">
        <div>
          <strong>Latest readings vs expected range</strong>
          <p>Bar goes from 0 to the configured maximum and marks the current reading position.</p>
        </div>
      </div>
      <div className="stack-list">
        {items.map((item) => (
          <RangeIndicator key={item.label} current={item.current} label={item.label} max={item.max} min={item.min} unit={item.unit} />
        ))}
      </div>
    </section>
  );
}
