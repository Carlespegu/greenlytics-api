import type { PlantDetail, PlantEventRecord, PlantPhotoRecord, PlantThresholdRecord } from '@/modules/plants/api/plantsApi';

export type PlantStatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export interface PlantKpiCard {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: PlantStatusTone;
}

export interface PlantThresholdSummary {
  id: string;
  label: string;
  unit: string;
  min: number | null;
  max: number | null;
  optimal: number | null;
  readingTypeName: string;
}

export interface PlantRecommendation {
  id: string;
  title: string;
  reason: string;
  source: 'threshold-based' | 'manual' | 'rule-based' | 'ai-generated';
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

export interface PlantReadingsMetric {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: PlantStatusTone;
}

export interface PlantDetailViewModel {
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
  thresholdSummaries: PlantThresholdSummary[];
  thresholdMap: Record<'soilMoisture' | 'temperature' | 'light' | 'airHumidity', PlantThresholdSummary | null>;
  recommendations: PlantRecommendation[];
  historyEntries: PlantHistoryEntry[];
  readingsMetrics: PlantReadingsMetric[];
}

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

export function buildPlantDetailViewModel(plant: PlantDetail, t: TranslateFn, locale: string): PlantDetailViewModel {
  const primaryPhoto = plant.photos.find((photo) => photo.isPrimary) ?? plant.photos[0] ?? null;
  const sortedPhotos = [...plant.photos].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  const sortedEvents = [...plant.events].sort((left, right) => Date.parse(right.eventDate) - Date.parse(left.eventDate));
  const thresholdSummaries = plant.thresholds.map(mapThresholdSummary);

  const thresholdMap = {
    soilMoisture: findThreshold(thresholdSummaries, ['soil moisture', 'soil_moisture', 'soilmoisture']),
    temperature: findThreshold(thresholdSummaries, ['temperature']),
    light: findThreshold(thresholdSummaries, ['light', 'lux']),
    airHumidity: findThreshold(thresholdSummaries, ['air humidity', 'air_humidity', 'humidity']),
  } satisfies Record<'soilMoisture' | 'temperature' | 'light' | 'airHumidity', PlantThresholdSummary | null>;

  const recommendations = buildRecommendations(plant, thresholdMap, t);
  const historyEntries = buildHistoryEntries(sortedEvents, sortedPhotos, t, locale);
  const lastReadingLabel = formatDateTime(plant.latestReading?.readAt, locale) ?? t('plantDetail.noReadingsLabel');
  const lastPhotoLabel = formatDateTime(sortedPhotos[0]?.createdAt, locale) ?? t('plantDetail.noPhotosLabel');
  const lastEventLabel = formatDateTime(sortedEvents[0]?.eventDate, locale) ?? t('plantDetail.noEventsLabel');
  const nextCareAction = recommendations[0]?.title ?? t('plantDetail.noImmediateAction');

  return {
    primaryPhoto,
    photosCount: plant.photos.length,
    eventsCount: plant.events.length,
    thresholdsCount: plant.thresholds.length,
    updatedLabel: formatDateTime(plant.updatedAt ?? plant.createdAt, locale) ?? t('records.unknown'),
    lastReadingLabel,
    lastPhotoLabel,
    lastEventLabel,
    nextCareAction,
    summaryCards: [
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
    ],
    thresholdSummaries,
    thresholdMap,
    recommendations,
    historyEntries,
    readingsMetrics: buildReadingMetrics(plant, thresholdMap, t, locale),
  };
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
  };
}

function findThreshold(thresholds: PlantThresholdSummary[], tokens: string[]) {
  return thresholds.find((threshold) => {
    const haystack = `${threshold.label} ${threshold.readingTypeName}`.toLowerCase();
    return tokens.some((token) => haystack.includes(token));
  }) ?? null;
}

function buildRecommendations(
  plant: PlantDetail,
  thresholdMap: Record<'soilMoisture' | 'temperature' | 'light' | 'airHumidity', PlantThresholdSummary | null>,
  t: TranslateFn,
): PlantRecommendation[] {
  const recommendations: PlantRecommendation[] = [];

  if (!plant.isActive) {
    recommendations.push({
      id: 'inactive-plant',
      title: t('plantDetail.reviewInactivePlant'),
      reason: t('plantDetail.reviewInactivePlantReason'),
      source: 'manual',
      tone: 'warning',
    });
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

  if (thresholdMap.soilMoisture && thresholdMap.light && plant.latestReading) {
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

function thresholdValueHint(threshold: PlantThresholdSummary) {
  const unit = threshold.unit ? ` ${threshold.unit}` : '';
  const min = threshold.min ?? '-';
  const max = threshold.max ?? '-';
  return `${min} - ${max}${unit}`;
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

  const normalized = (status ?? '').trim().toLowerCase();
  if (!normalized) {
    return 'info';
  }

  if (normalized.includes('critical') || normalized.includes('disease') || normalized.includes('risk')) {
    return 'danger';
  }

  if (normalized.includes('warning') || normalized.includes('alert')) {
    return 'warning';
  }

  if (normalized.includes('healthy') || normalized.includes('good') || normalized.includes('stable')) {
    return 'success';
  }

  return 'info';
}
