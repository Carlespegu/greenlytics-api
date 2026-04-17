interface RangeIndicatorProps {
  label: string;
  min: number;
  max: number;
  current: number;
  unit: string;
}

export function RangeIndicator({ label, min, max, current, unit }: RangeIndicatorProps) {
  const effectiveMax = Math.max(max, current, 1);
  const rangeStart = (min / effectiveMax) * 100;
  const rangeEnd = (max / effectiveMax) * 100;
  const markerPosition = Math.max(0, Math.min(100, (current / effectiveMax) * 100));
  const below = current < min;
  const above = current > max;
  const inRange = !below && !above;

  return (
    <div className="range-indicator">
      <div className="range-indicator__header">
        <strong>{label}</strong>
        <span className={`range-indicator__value${inRange ? ' range-indicator__value--ok' : ' range-indicator__value--alert'}`}>
          {current} {unit}
        </span>
      </div>

      <div className="range-indicator__track">
        <div className="range-indicator__track-base" />
        <div className="range-indicator__track-range" style={{ left: `${rangeStart}%`, width: `${Math.max(0, rangeEnd - rangeStart)}%` }} />
        <div className={`range-indicator__marker${inRange ? '' : ' range-indicator__marker--alert'}`} style={{ left: `calc(${markerPosition}% - 2px)` }} />
      </div>

      <div className="range-indicator__legend">
        <span>0</span>
        <span>{max} {unit}</span>
      </div>

      <small className={`range-indicator__message${inRange ? ' range-indicator__message--ok' : ' range-indicator__message--alert'}`}>
        {below ? `Per sota del mínim (${min} ${unit})` : above ? `Per sobre del màxim (${max} ${unit})` : `Dins del rang (${min} - ${max} ${unit})`}
      </small>
    </div>
  );
}
