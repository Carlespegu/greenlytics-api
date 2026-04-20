import type { PlantDetail, PlantEventRecord, PlantPhotoRecord, PlantThresholdRecord } from '@/modules/plants/api/plantsApi';

export type PlantStatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export interface PlantReadingSample {
  id: string;
  recordedAt?: string | null;
  readAt?: string | null;
  deviceId?: string | null;
  device?: string | null;
  deviceCode?: string | null;
  deviceName?: string | null;
  readingTypeId?: string | null;
  readingTypeCode?: string | null;
  readingType?: string | null;
  readingTypeName?: string | null;
  value?: number | string | null;
  unit?: string | null;
  unitName?: string | null;
  source?: string | null;
}

export interface PlantThresholdSummary {
  id: string;
  label: string;
  unit: string;
  min: number | null;
  max: number | null;
  optimal: number | null;
  readingTypeName: string;
  readingTypeId: string;
  readingTypeCode: string | null;
}

export interface PlantRecommendation {
  id: string;
  title: string;
  reason: string;
  source: 'threshold-based' | 'manual' | 'rule-based' | 'ai-generated';
  tone: PlantStatusTone;
}

export interface PlantKpiCard {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: PlantStatusTone;
}

export interface PlantHistoryEntry {
  id: string;
  timestamp: string;
  dateLabel: string;
  title: string;
  summary: string;
  type: string;
  source: 'event' | 'photo';
}

export interface PlantLatestVsIdealMetric {
  id: string;
  label: string;
  unit: string;
  latestValue: number | null;
  latestValueLabel: string;
  idealLabel: string;
  latestTimestampLabel: string;
  deviceLabel: string;
  tone: PlantStatusTone;
  state: 'below' | 'within' | 'above' | 'pending';
  scaleMin: number;
  scaleMax: number;
  markerPosition: number | null;
  idealStart: number | null;
  idealEnd: number | null;
  optimalPosition: number | null;
}

export interface PlantTrendPoint {
  id: string;
  timestamp: string;
  xLabel: string;
  value: number;
}

export interface PlantTrendSeries {
  id: string;
  label: string;
  unit: string;
  idealMin: number | null;
  idealMax: number | null;
  idealOptimal: number | null;
  points: PlantTrendPoint[];
}

export interface PlantReadingsMetric {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: PlantStatusTone;
}

export interface PlantDetailViewModel {
  headerPhoto: PlantPhotoRecord | null;
  primaryPhoto: PlantPhotoRecord | null;
  photosCount: number;
  eventsCount: number;
  thresholdsCount: number;
  updatedLabel: string;
  lastReadingLabel: string;
  lastPhotoLabel: string;
  lastEventLabel: string;
  nextCareAction: string;
  summaryCards: PlantKpiCard[];
  readingsMetrics: PlantReadingsMetric[];
  thresholdSummaries: PlantThresholdSummary[];
  thresholdMap: Record<'soilMoisture' | 'temperature' | 'light' | 'airHumidity', PlantThresholdSummary | null>;
  recommendations: PlantRecommendation[];
  historyEntries: PlantHistoryEntry[];
  latestVsIdealMetrics: PlantLatestVsIdealMetric[];
  trendSeries: PlantTrendSeries[];
}

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface NormalizedReadingSample {
  id: string;
  timestamp: string;
  metricKey: string;
  metricLabel: string;
  value: number;
  unit: string;
  source: string | null;
  deviceLabel: string;
}

export function buildPlantDetailViewModel(
  plant: PlantDetail,
  readings: PlantReadingSample[],
  t: TranslateFn,
  locale: string,
): PlantDetailViewModel {
  const primaryPhoto = selectPrimaryPhoto(plant.photos);
  const headerPhoto = selectGeneralPhoto(plant.photos);
  const sortedPhotos = [...plant.photos].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  const sortedEvents = [...plant.events].sort((left, right) => Date.parse(right.eventDate) - Date.parse(left.eventDate));
  const thresholdSummaries = plant.thresholds.map(mapThresholdSummary);
  const normalizedReadings = readings
    .map((reading) => normalizeReading(reading))
    .filter((reading): reading is NormalizedReadingSample => reading !== null)
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));

  const thresholdMap = {
    soilMoisture: findThreshold(thresholdSummaries, ['soil moisture', 'soil_moisture', 'soilmoisture']),
    temperature: findThreshold(thresholdSummaries, ['temperature']),
    light: findThreshold(thresholdSummaries, ['light', 'lux']),
    airHumidity: findThreshold(thresholdSummaries, ['air humidity', 'air_humidity', 'humidity']),
  } satisfies Record<'soilMoisture' | 'temperature' | 'light' | 'airHumidity', PlantThresholdSummary | null>;

  const latestVsIdealMetrics = buildLatestVsIdealMetrics(thresholdSummaries, normalizedReadings, t, locale);
  const trendSeries = buildTrendSeries(thresholdSummaries, normalizedReadings, locale);
  const recommendations = buildRecommendations(plant, thresholdMap, latestVsIdealMetrics, t);
  const historyEntries = buildHistoryEntries(sortedEvents, sortedPhotos, t, locale);
  const lastReadingLabel = formatDateTime(plant.latestReading?.readAt, locale) ?? t('plantDetail.noReadingsLabel');
  const lastPhotoLabel = formatDateTime(sortedPhotos[0]?.createdAt, locale) ?? t('plantDetail.noPhotosLabel');
  const lastEventLabel = formatDateTime(sortedEvents[0]?.eventDate, locale) ?? t('plantDetail.noEventsLabel');
  const nextCareAction = recommendations[0]?.title ?? t('plantDetail.noImmediateAction');

  return {
    headerPhoto,
    primaryPhoto,
    photosCount: plant.photos.length,
    eventsCount: plant.events.length,
    thresholdsCount: plant.thresholds.length,
    updatedLabel: formatDateTime(plant.updatedAt ?? plant.createdAt, locale) ?? t('records.unknown'),
    lastReadingLabel,
    lastPhotoLabel,
    lastEventLabel,
    nextCareAction,
    summaryCards: buildSummaryCards(plant, recommendations, lastReadingLabel, lastPhotoLabel, lastEventLabel, nextCareAction, t),
    readingsMetrics: buildReadingMetrics(plant, thresholdMap, t, locale),
    thresholdSummaries,
    thresholdMap,
    recommendations,
    historyEntries,
    latestVsIdealMetrics,
    trendSeries,
  };
}

function buildSummaryCards(
  plant: PlantDetail,
  recommendations: PlantRecommendation[],
  lastReadingLabel: string,
  lastPhotoLabel: string,
  lastEventLabel: string,
  nextCareAction: string,
  t: TranslateFn,
): PlantKpiCard[] {
  return [
    {
      id: 'status',
      label: t('plantDetail.currentStatusCard'),
      value: plant.plantStatusName ?? (plant.isActive ? t('records.active') : t('records.inactive')),
      hint: plant.isActive ? t('plantDetail.currentStatusHintActive') : t('plantDetail.currentStatusHintInactive'),
      tone: resolveToneFromStatus(plant.plantStatusName, plant.isActive),
    },
    {
      id: 'last-reading',
      label: t('plantDetail.lastReadingCard'),
      value: lastReadingLabel,
      hint: plant.latestReading?.deviceCode ? `${t('plantDetail.device')} ${plant.latestReading.deviceCode}` : t('plantDetail.noTelemetryDevice'),
      tone: plant.latestReading ? 'info' : 'neutral',
    },
    {
      id: 'alerts',
      label: t('plantDetail.thresholdAlerts'),
      value: String(recommendations.filter((item) => item.tone === 'warning' || item.tone === 'danger').length),
      hint: t('plantDetail.thresholdAlertsHint'),
      tone: recommendations.some((item) => item.tone === 'warning' || item.tone === 'danger') ? 'warning' : 'success',
    },
    {
      id: 'next-action',
      label: t('plantDetail.pendingCare'),
      value: nextCareAction,
      hint: recommendations[0]?.reason ?? t('plantDetail.noImmediateCare'),
      tone: recommendations[0]?.tone ?? 'neutral',
    },
    {
      id: 'photos',
      label: t('plantDetail.photosCard'),
      value: String(plant.photos.length),
      hint: lastPhotoLabel,
      tone: plant.photos.length > 0 ? 'info' : 'neutral',
    },
    {
      id: 'events',
      label: t('plantDetail.eventsCard'),
      value: String(plant.events.length),
      hint: lastEventLabel,
      tone: plant.events.length > 0 ? 'info' : 'neutral',
    },
  ];
}

function mapThresholdSummary(threshold: PlantThresholdRecord): PlantThresholdSummary {
  return {
    id: threshold.id,
    label: threshold.readingTypeName ?? threshold.readingTypeCode ?? 'Threshold',
    unit: threshold.unitTypeCode ?? threshold.unitTypeName ?? '',
    min: threshold.minValue,
    max: threshold.maxValue,
    optimal: threshold.optimalValue,
    readingTypeName: threshold.readingTypeName ?? threshold.readingTypeCode ?? 'Threshold',
    readingTypeId: threshold.readingTypeId,
    readingTypeCode: threshold.readingTypeCode,
  };
}

function buildLatestVsIdealMetrics(
  thresholds: PlantThresholdSummary[],
  readings: NormalizedReadingSample[],
  t: TranslateFn,
  locale: string,
): PlantLatestVsIdealMetric[] {
  return thresholds.map((threshold) => {
    const latestReading = readings.find((reading) => matchesThreshold(reading, threshold));
    const latestValue = latestReading?.value ?? null;
    const scale = resolveScale(threshold, latestValue);
    const state = resolveMetricState(latestValue, threshold);
    const tone = resolveMetricTone(state);

    return {
      id: threshold.id,
      label: threshold.label,
      unit: threshold.unit,
      latestValue,
      latestValueLabel: latestValue !== null
        ? `${formatCompactNumber(latestValue, locale)}${threshold.unit ? ` ${threshold.unit}` : ''}`
        : t('plantDetail.metricPendingValue'),
      idealLabel: describeIdealRange(threshold, t, locale),
      latestTimestampLabel: latestReading ? formatDateTime(latestReading.timestamp, locale) ?? t('plantDetail.metricPendingTime') : t('plantDetail.metricPendingTime'),
      deviceLabel: latestReading?.deviceLabel ?? t('plantDetail.metricPendingDevice'),
      tone,
      state,
      scaleMin: scale.min,
      scaleMax: scale.max,
      markerPosition: latestValue !== null ? scalePercent(latestValue, scale.min, scale.max) : null,
      idealStart: threshold.min !== null ? scalePercent(threshold.min, scale.min, scale.max) : threshold.optimal !== null ? scalePercent(threshold.optimal, scale.min, scale.max) : null,
      idealEnd: threshold.max !== null
        ? scalePercent(threshold.max, scale.min, scale.max)
        : threshold.optimal !== null
          ? scalePercent(threshold.optimal, scale.min, scale.max)
          : null,
      optimalPosition: threshold.optimal !== null ? scalePercent(threshold.optimal, scale.min, scale.max) : null,
    };
  });
}

function buildTrendSeries(
  thresholds: PlantThresholdSummary[],
  readings: NormalizedReadingSample[],
  locale: string,
): PlantTrendSeries[] {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const thresholdSeries = thresholds.map((threshold) => {
    const points = readings
      .filter((reading) => matchesThreshold(reading, threshold) && Date.parse(reading.timestamp) >= sevenDaysAgo.getTime())
      .sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp))
      .map((reading) => ({
        id: reading.id,
        timestamp: reading.timestamp,
        xLabel: formatChartLabel(reading.timestamp, locale),
        value: reading.value,
      }));

    return {
      id: threshold.readingTypeId,
      label: threshold.label,
      unit: threshold.unit,
      idealMin: threshold.min,
      idealMax: threshold.max,
      idealOptimal: threshold.optimal,
      points,
    } satisfies PlantTrendSeries;
  });

  return thresholdSeries;
}

function buildReadingMetrics(
  plant: PlantDetail,
  thresholdMap: Record<'soilMoisture' | 'temperature' | 'light' | 'airHumidity', PlantThresholdSummary | null>,
  t: TranslateFn,
  locale: string,
): PlantReadingsMetric[] {
  const lastReadingContext = plant.latestReading
    ? t('plantDetail.latestReadingAt', { value: formatDateTime(plant.latestReading.readAt, locale) ?? t('plantDetail.unknownDate') })
    : t('plantDetail.noReadingValues');

  return [
    {
      id: 'temperature',
      label: t('plantDetail.temperature'),
      value: thresholdMap.temperature ? thresholdValueHint(thresholdMap.temperature) : t('plantDetail.pendingTelemetry'),
      hint: lastReadingContext,
      tone: plant.latestReading ? 'info' : 'neutral',
    },
    {
      id: 'air-humidity',
      label: t('plantDetail.airHumidity'),
      value: thresholdMap.airHumidity ? thresholdValueHint(thresholdMap.airHumidity) : t('plantDetail.pendingTelemetry'),
      hint: lastReadingContext,
      tone: plant.latestReading ? 'info' : 'neutral',
    },
    {
      id: 'soil-moisture',
      label: t('plantDetail.soilMoisture'),
      value: thresholdMap.soilMoisture ? thresholdValueHint(thresholdMap.soilMoisture) : t('plantDetail.pendingTelemetry'),
      hint: lastReadingContext,
      tone: plant.latestReading ? 'info' : 'neutral',
    },
    {
      id: 'light',
      label: t('plantDetail.light'),
      value: thresholdMap.light ? thresholdValueHint(thresholdMap.light) : t('plantDetail.pendingTelemetry'),
      hint: lastReadingContext,
      tone: plant.latestReading ? 'info' : 'neutral',
    },
  ];
}

function buildRecommendations(
  plant: PlantDetail,
  thresholdMap: Record<'soilMoisture' | 'temperature' | 'light' | 'airHumidity', PlantThresholdSummary | null>,
  comparisonMetrics: PlantLatestVsIdealMetric[],
  t: TranslateFn,
): PlantRecommendation[] {
  const recommendations: PlantRecommendation[] = [];
  const metricsOutsideIdeal = comparisonMetrics.filter((metric) => metric.state === 'below' || metric.state === 'above');

  if (!plant.isActive) {
    recommendations.push({
      id: 'inactive-plant',
      title: t('plantDetail.reviewInactivePlant'),
      reason: t('plantDetail.reviewInactivePlantReason'),
      source: 'manual',
      tone: 'warning',
    });
  }

  if (metricsOutsideIdeal.length > 0) {
    recommendations.push(...metricsOutsideIdeal.map((metric) => ({
      id: `metric-${metric.id}`,
      title: metric.state === 'below'
        ? t('plantDetail.metricBelowIdealAction', { metric: metric.label })
        : t('plantDetail.metricAboveIdealAction', { metric: metric.label }),
      reason: metric.state === 'below'
        ? t('plantDetail.metricBelowIdealReason', { metric: metric.label, ideal: metric.idealLabel })
        : t('plantDetail.metricAboveIdealReason', { metric: metric.label, ideal: metric.idealLabel }),
      source: 'threshold-based' as const,
      tone: 'warning' as const,
    })));
  }

  if (!plant.latestReading) {
    recommendations.push({
      id: 'capture-first-reading',
      title: t('plantDetail.captureFirstReading'),
      reason: t('plantDetail.captureFirstReadingReason'),
      source: 'rule-based',
      tone: 'warning',
    });
  }

  if (plant.thresholdsCount === 0) {
    recommendations.push({
      id: 'define-thresholds',
      title: t('plantDetail.defineCareThresholds'),
      reason: t('plantDetail.defineCareThresholdsReason'),
      source: 'threshold-based',
      tone: 'warning',
    });
  }

  if (!plant.primaryPhotoUrl) {
    recommendations.push({
      id: 'upload-primary-photo',
      title: t('plantDetail.uploadReferencePhoto'),
      reason: t('plantDetail.uploadReferencePhotoReason'),
      source: 'manual',
      tone: 'info',
    });
  }

  if (recommendations.length === 0 && thresholdMap.soilMoisture && thresholdMap.light) {
    recommendations.push({
      id: 'monitor-environment',
      title: t('plantDetail.monitorEnvironmentTrend'),
      reason: t('plantDetail.monitorEnvironmentTrendReason'),
      source: 'threshold-based',
      tone: 'success',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'no-action-needed',
      title: t('plantDetail.noActionNeeded'),
      reason: t('plantDetail.noActionNeededReason'),
      source: 'rule-based',
      tone: 'success',
    });
  }

  return recommendations;
}

function buildHistoryEntries(events: PlantEventRecord[], photos: PlantPhotoRecord[], t: TranslateFn, locale: string): PlantHistoryEntry[] {
  const eventEntries = events.map((event) => ({
    id: `event-${event.id}`,
    timestamp: event.eventDate,
    dateLabel: formatDateTime(event.eventDate, locale) ?? t('plantDetail.unknownDate'),
    title: event.title,
    summary: event.notes ?? event.description ?? (event.eventTypeName ?? event.eventTypeCode ?? t('plantDetail.plantEvents')),
    type: event.eventTypeName ?? event.eventTypeCode ?? t('plantDetail.event'),
    source: 'event' as const,
  }));

  const photoEntries = photos.map((photo) => ({
    id: `photo-${photo.id}`,
    timestamp: photo.createdAt,
    dateLabel: formatDateTime(photo.createdAt, locale) ?? t('plantDetail.unknownDate'),
    title: photo.fileName,
    summary: photo.isPrimary
      ? `${t('plantDetail.primary')} ${photo.photoTypeName?.toLowerCase() ?? t('plantDetail.photos').toLowerCase()}`
      : t('plantDetail.photoUploadedSummary', { type: photo.photoTypeName ?? t('plantDetail.photos') }),
    type: photo.photoTypeName ?? t('plantDetail.photoUpload'),
    source: 'photo' as const,
  }));

  return [...eventEntries, ...photoEntries]
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));
}

export function selectGeneralPhoto(photos: PlantPhotoRecord[]) {
  const generalCandidates = photos.filter((photo) => {
    const type = `${photo.photoTypeCode ?? ''} ${photo.photoTypeName ?? ''}`.toLowerCase();
    return type.includes('general');
  });

  return generalCandidates.find((photo) => photo.isPrimary) ?? generalCandidates[0] ?? null;
}

function selectPrimaryPhoto(photos: PlantPhotoRecord[]) {
  return photos.find((photo) => photo.isPrimary) ?? photos[0] ?? null;
}

function normalizeReading(reading: PlantReadingSample): NormalizedReadingSample | null {
  const value = parseNumericValue(reading.value);
  const timestamp = reading.recordedAt ?? reading.readAt;
  const metricLabel = reading.readingTypeName ?? reading.readingType ?? reading.readingTypeCode;

  if (value === null || !timestamp || !metricLabel) {
    return null;
  }

  return {
    id: reading.id,
    timestamp,
    metricKey: normalizeMetricKey(metricLabel),
    metricLabel,
    value,
    unit: reading.unit ?? reading.unitName ?? '',
    source: reading.source ?? null,
    deviceLabel: reading.deviceName ?? reading.deviceCode ?? reading.device ?? '',
  };
}

function parseNumericValue(value: number | string | null | undefined) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeMetricKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function matchesThreshold(reading: NormalizedReadingSample, threshold: PlantThresholdSummary) {
  const thresholdKeys = [
    threshold.readingTypeName,
    threshold.label,
    threshold.readingTypeCode ?? '',
  ]
    .map((value) => normalizeMetricKey(value))
    .filter(Boolean);

  return thresholdKeys.includes(reading.metricKey);
}

function findThreshold(thresholds: PlantThresholdSummary[], tokens: string[]) {
  return thresholds.find((threshold) => {
    const haystack = `${threshold.label} ${threshold.readingTypeName} ${threshold.readingTypeCode ?? ''}`.toLowerCase();
    return tokens.some((token) => haystack.includes(token));
  }) ?? null;
}

function resolveMetricState(value: number | null, threshold: PlantThresholdSummary): PlantLatestVsIdealMetric['state'] {
  if (value === null) {
    return 'pending';
  }

  if (threshold.min !== null && value < threshold.min) {
    return 'below';
  }

  if (threshold.max !== null && value > threshold.max) {
    return 'above';
  }

  if (threshold.optimal !== null && threshold.min === null && threshold.max === null) {
    if (value < threshold.optimal) {
      return 'below';
    }

    if (value > threshold.optimal) {
      return 'above';
    }
  }

  return 'within';
}

function resolveMetricTone(state: PlantLatestVsIdealMetric['state']): PlantStatusTone {
  switch (state) {
    case 'below':
    case 'above':
      return 'warning';
    case 'within':
      return 'success';
    default:
      return 'neutral';
  }
}

function describeIdealRange(threshold: PlantThresholdSummary, t: TranslateFn, locale: string) {
  const unitSuffix = threshold.unit ? ` ${threshold.unit}` : '';

  if (threshold.min !== null || threshold.max !== null) {
    return t('plantDetail.idealRangeLabel', {
      min: threshold.min !== null ? formatCompactNumber(threshold.min, locale) : '-',
      max: threshold.max !== null ? formatCompactNumber(threshold.max, locale) : '-',
      unit: unitSuffix,
    });
  }

  if (threshold.optimal !== null) {
    return t('plantDetail.idealValueLabel', {
      value: formatCompactNumber(threshold.optimal, locale),
      unit: unitSuffix,
    });
  }

  return t('plantDetail.noIdealRangeConfigured');
}

function thresholdValueHint(threshold: PlantThresholdSummary) {
  const unit = threshold.unit ? ` ${threshold.unit}` : '';
  const min = threshold.min ?? '-';
  const max = threshold.max ?? '-';
  return `${min} - ${max}${unit}`;
}

function resolveScale(threshold: PlantThresholdSummary, latestValue: number | null) {
  const values = [threshold.min, threshold.max, threshold.optimal, latestValue].filter((value): value is number => value !== null);

  if (values.length === 0) {
    return { min: 0, max: 1 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = (max - min) * 0.18 || Math.max(Math.abs(max) * 0.15, 1);

  return {
    min: min - padding,
    max: max + padding,
  };
}

function scalePercent(value: number, min: number, max: number) {
  if (max <= min) {
    return 50;
  }

  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

function formatCompactNumber(value: number, locale: string) {
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 1,
  }).format(value);
}

function formatChartLabel(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    weekday: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(value: string | null | undefined, locale = 'ca') {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDate(value: string | null | undefined, locale = 'ca') {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    dateStyle: 'medium',
  }).format(date);
}

function resolveIntlLocale(locale: string) {
  switch (locale) {
    case 'es':
      return 'es-ES';
    case 'en':
      return 'en-GB';
    default:
      return 'ca-ES';
  }
}

export function resolveToneFromStatus(status: string | null | undefined, isActive: boolean): PlantStatusTone {
  if (!isActive) {
    return 'neutral';
  }

  const normalizedStatus = (status ?? '').trim().toLowerCase();

  if (!normalizedStatus) {
    return 'info';
  }

  if (normalizedStatus.includes('alert') || normalizedStatus.includes('risk') || normalizedStatus.includes('dry')) {
    return 'warning';
  }

  if (normalizedStatus.includes('healthy') || normalizedStatus.includes('stable')) {
    return 'success';
  }

  return 'info';
}
