import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useI18n } from '@/app/i18n/LanguageProvider';
import type { PlantTrendSeries } from '@/modules/plants/components/detail/plantDetailViewModel';
import { EmptyState } from '@/shared/components/EmptyState';
import { SectionHeading } from '@/shared/ui/SectionHeading';

interface PlantReadingTrendWidgetProps {
  series: PlantTrendSeries[];
}

export function PlantReadingTrendWidget({ series }: PlantReadingTrendWidgetProps) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    if (!series.length) {
      setSelectedId('');
      return;
    }

    if (!selectedId || !series.some((item) => item.id === selectedId)) {
      setSelectedId(series[0].id);
    }
  }, [selectedId, series]);

  const selectedSeries = useMemo(
    () => series.find((item) => item.id === selectedId) ?? series[0] ?? null,
    [selectedId, series],
  );

  return (
    <section className="panel-card plant-detail-v3__widget-card">
      <SectionHeading
        title={t('plantDetail.sevenDayTrendTitle')}
        subtitle={t('plantDetail.sevenDayTrendSubtitle')}
        action={(
          <label className="plant-detail-v3__trend-selector">
            <span>{t('plantDetail.selectReadingType')}</span>
            <select value={selectedSeries?.id ?? ''} onChange={(event) => setSelectedId(event.target.value)}>
              {series.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        )}
      />

      {!selectedSeries ? (
        <EmptyState
          title={t('plantDetail.noTrendMetricsTitle')}
          description={t('plantDetail.noTrendMetricsDescription')}
        />
      ) : selectedSeries.points.length === 0 ? (
        <div className="plant-detail-v3__chart-placeholder">
          <div>
            <strong>{selectedSeries.label}</strong>
            <span>{describeIdeal(selectedSeries, t)}</span>
          </div>
          <p>{t('plantDetail.noTrendDataDescription')}</p>
        </div>
      ) : (
        <div className="plant-detail-v3__trend-chart-shell">
          <div className="plant-detail-v3__trend-meta">
            <strong>{selectedSeries.label}</strong>
            <span>{describeIdeal(selectedSeries, t)}</span>
          </div>

          <div className="plant-detail-v3__trend-chart">
            <ResponsiveContainer height={280} width="100%">
              <LineChart data={selectedSeries.points}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="xLabel"
                  stroke="rgba(191, 219, 254, 0.7)"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="rgba(191, 219, 254, 0.7)"
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip
                  formatter={(value) => [`${value ?? '-'}${selectedSeries.unit ? ` ${selectedSeries.unit}` : ''}`, t('plantDetail.actualSeriesLabel')]}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{
                    background: '#10213a',
                    borderRadius: 16,
                    border: '1px solid rgba(148, 163, 184, 0.14)',
                    color: '#ecf7ff',
                  }}
                />
                {selectedSeries.idealMin !== null ? (
                  <ReferenceLine
                    ifOverflow="extendDomain"
                    label={t('plantDetail.idealMinLabel')}
                    stroke="rgba(251, 191, 36, 0.75)"
                    strokeDasharray="4 4"
                    y={selectedSeries.idealMin}
                  />
                ) : null}
                {selectedSeries.idealMax !== null ? (
                  <ReferenceLine
                    ifOverflow="extendDomain"
                    label={t('plantDetail.idealMaxLabel')}
                    stroke="rgba(251, 191, 36, 0.75)"
                    strokeDasharray="4 4"
                    y={selectedSeries.idealMax}
                  />
                ) : null}
                {selectedSeries.idealOptimal !== null ? (
                  <ReferenceLine
                    ifOverflow="extendDomain"
                    label={t('plantDetail.idealTargetLabel')}
                    stroke="rgba(74, 222, 128, 0.75)"
                    strokeDasharray="2 4"
                    y={selectedSeries.idealOptimal}
                  />
                ) : null}
                <Line
                  dataKey="value"
                  dot={{ r: 3 }}
                  name={t('plantDetail.actualSeriesLabel')}
                  stroke="#38bdf8"
                  strokeWidth={3}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}

function describeIdeal(series: PlantTrendSeries, t: (key: string, vars?: Record<string, string | number>) => string) {
  const unit = series.unit ? ` ${series.unit}` : '';

  if (series.idealMin !== null || series.idealMax !== null) {
    return t('plantDetail.idealRangeLabel', {
      min: series.idealMin ?? '-',
      max: series.idealMax ?? '-',
      unit,
    });
  }

  if (series.idealOptimal !== null) {
    return t('plantDetail.idealValueLabel', {
      value: series.idealOptimal,
      unit,
    });
  }

  return t('plantDetail.noIdealRangeConfigured');
}
