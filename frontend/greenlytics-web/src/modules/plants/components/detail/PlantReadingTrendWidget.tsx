import { useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
import type { TypeOption } from '@/modules/types/api/typesApi';
import { EmptyState } from '@/shared/components/EmptyState';
import { Dropdown } from '@/shared/ui/Dropdown';
import { SectionHeading } from '@/shared/ui/SectionHeading';

interface PlantReadingTrendWidgetProps {
  readingTypeOptions?: TypeOption[];
  series: PlantTrendSeries[];
}

type SelectableTrendSeries = {
  id: string;
  label: string;
  series: PlantTrendSeries;
};

const EMPTY_SERIES: Omit<PlantTrendSeries, 'id' | 'label'> = {
  unit: '',
  idealMin: null,
  idealMax: null,
  idealOptimal: null,
  points: [],
};

export function PlantReadingTrendWidget({ readingTypeOptions = [], series }: PlantReadingTrendWidgetProps) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<string>('');

  const selectableSeries = useMemo<SelectableTrendSeries[]>(() => {
    if (readingTypeOptions.length === 0) {
      return series.map((item) => ({
        id: item.id,
        label: item.label,
        series: item,
      }));
    }

    return readingTypeOptions.map((option) => {
      const matchedSeries = series.find((item) => item.id === option.id);

      return {
        id: option.id,
        label: option.name,
        series: matchedSeries ?? {
          id: option.id,
          label: option.name,
          ...EMPTY_SERIES,
        },
      };
    });
  }, [readingTypeOptions, series]);

  useEffect(() => {
    if (!selectableSeries.length) {
      setSelectedId('');
      return;
    }

    if (!selectedId || !selectableSeries.some((item) => item.id === selectedId)) {
      const preferredSeries = selectableSeries.find((item) => item.series.points.length > 0) ?? selectableSeries[0];
      setSelectedId(preferredSeries.id);
    }
  }, [selectableSeries, selectedId]);

  const selectedSeries = useMemo(
    () => selectableSeries.find((item) => item.id === selectedId)?.series
      ?? selectableSeries.find((item) => item.series.points.length > 0)?.series
      ?? selectableSeries[0]?.series
      ?? null,
    [selectableSeries, selectedId],
  );
  const selectedOptionLabel = useMemo(
    () => selectableSeries.find((item) => item.id === (selectedSeries?.id ?? ''))?.label ?? t('plantDetail.selectReadingType'),
    [selectableSeries, selectedSeries?.id, t],
  );

  return (
    <section className="panel-card plant-detail-v3__widget-card">
      <SectionHeading
        title={t('plantDetail.sevenDayTrendTitle')}
        subtitle={t('plantDetail.sevenDayTrendSubtitle')}
        action={(
          <label className="plant-detail-v3__trend-selector">
            <span>{t('plantDetail.selectReadingType')}</span>
            <Dropdown
              className="plant-detail-v3__trend-select-dropdown"
              panelClassName="plant-detail-v3__trend-select-panel"
              triggerClassName="plant-detail-v3__trend-select-trigger"
              trigger={() => (
                <>
                  <span className="plant-detail-v3__trend-select-value">{selectedOptionLabel}</span>
                  <ChevronDown size={16} />
                </>
              )}
            >
              {({ close }) => (
                <div className="plant-detail-v3__trend-select-list" role="listbox">
                  {selectableSeries.map((item) => {
                    const isActive = item.id === (selectedSeries?.id ?? '');

                    return (
                      <button
                        key={item.id}
                        aria-selected={isActive}
                        className={`plant-detail-v3__trend-select-item${isActive ? ' plant-detail-v3__trend-select-item--active' : ''}`}
                        role="option"
                        type="button"
                        onClick={() => {
                          setSelectedId(item.id);
                          close();
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </Dropdown>
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
