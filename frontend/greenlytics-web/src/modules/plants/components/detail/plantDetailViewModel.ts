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

export function buildPlantDetailViewModel(plant: PlantDetail): PlantDetailViewModel {
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

  const recommendations = buildRecommendations(plant, thresholdMap);
  const historyEntries = buildHistoryEntries(sortedEvents, sortedPhotos);
  const lastReadingLabel = formatDateTime(plant.latestReading?.readAt) ?? 'No readings yet';
  const lastPhotoLabel = formatDateTime(sortedPhotos[0]?.createdAt) ?? 'No photos yet';
  const lastEventLabel = formatDateTime(sortedEvents[0]?.eventDate) ?? 'No events yet';
  const nextCareAction = recommendations[0]?.title ?? 'No immediate action';

  return {
    primaryPhoto,
    photosCount: plant.photos.length,
    eventsCount: plant.events.length,
    thresholdsCount: plant.thresholds.length,
    updatedLabel: formatDateTime(plant.updatedAt ?? plant.createdAt) ?? 'Unknown',
    lastReadingLabel,
    lastPhotoLabel,
    lastEventLabel,
    nextCareAction,
    summaryCards: [
      {
        id: 'status',
        label: 'Current status',
        value: plant.plantStatusName ?? (plant.isActive ? 'Active' : 'Inactive'),
        hint: plant.isActive ? 'Operational in current client scope' : 'Visible historically but non-operational',
        tone: resolveToneFromStatus(plant.plantStatusName, plant.isActive),
      },
      {
        id: 'last-reading',
        label: 'Last reading',
        value: lastReadingLabel,
        hint: plant.latestReading?.deviceCode ? `Device ${plant.latestReading.deviceCode}` : 'No telemetry device linked yet',
        tone: plant.latestReading ? 'info' : 'neutral',
      },
      {
        id: 'alerts',
        label: 'Threshold alerts',
        value: String(recommendations.filter((item) => item.tone === 'warning' || item.tone === 'danger').length),
        hint: 'Derived from thresholds and current operational context',
        tone: recommendations.some((item) => item.tone === 'warning' || item.tone === 'danger') ? 'warning' : 'success',
      },
      {
        id: 'next-action',
        label: 'Pending care',
        value: nextCareAction,
        hint: recommendations[0]?.reason ?? 'No immediate care action inferred',
        tone: recommendations[0]?.tone ?? 'neutral',
      },
      {
        id: 'photos',
        label: 'Photos',
        value: String(plant.photos.length),
        hint: lastPhotoLabel,
        tone: plant.photos.length > 0 ? 'info' : 'neutral',
      },
      {
        id: 'events',
        label: 'Events',
        value: String(plant.events.length),
        hint: lastEventLabel,
        tone: plant.events.length > 0 ? 'info' : 'neutral',
      },
    ],
    thresholdSummaries,
    thresholdMap,
    recommendations,
    historyEntries,
    readingsMetrics: buildReadingMetrics(plant, thresholdMap),
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
): PlantRecommendation[] {
  const recommendations: PlantRecommendation[] = [];

  if (!plant.isActive) {
    recommendations.push({
      id: 'inactive-plant',
      title: 'Review inactive plant',
      reason: 'This plant is currently marked as inactive and should be reviewed before new operational actions.',
      source: 'manual',
      tone: 'warning',
    });
  }

  if (!plant.latestReading) {
    recommendations.push({
      id: 'capture-first-reading',
      title: 'Capture first reading',
      reason: 'No telemetry is currently linked to this plant detail, so the operational state cannot be confirmed.',
      source: 'rule-based',
      tone: 'warning',
    });
  }

  if (plant.thresholdsCount === 0) {
    recommendations.push({
      id: 'define-thresholds',
      title: 'Define care thresholds',
      reason: 'Without thresholds there is no quantitative baseline for humidity, temperature or light follow-up.',
      source: 'threshold-based',
      tone: 'warning',
    });
  }

  if (!plant.primaryPhotoUrl) {
    recommendations.push({
      id: 'upload-primary-photo',
      title: 'Upload reference photo',
      reason: 'A primary photo helps operators validate the latest visual condition before interventions.',
      source: 'manual',
      tone: 'info',
    });
  }

  if (thresholdMap.soilMoisture && thresholdMap.light && plant.latestReading) {
    recommendations.push({
      id: 'monitor-environment',
      title: 'Monitor environment trend',
      reason: 'The plant already has a basic threshold baseline, so the next step is comparing upcoming readings against it.',
      source: 'threshold-based',
      tone: 'success',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'no-action-needed',
      title: 'No action needed',
      reason: 'The plant has enough operational context for now and there are no immediate care gaps detected.',
      source: 'rule-based',
      tone: 'success',
    });
  }

  return recommendations;
}

function buildHistoryEntries(events: PlantEventRecord[], photos: PlantPhotoRecord[]): PlantHistoryEntry[] {
  const eventEntries = events.map((event) => ({
    id: `event-${event.id}`,
    timestamp: event.eventDate,
    dateLabel: formatDateTime(event.eventDate) ?? 'Unknown date',
    title: event.title,
    summary: event.notes ?? event.description ?? (event.eventTypeName ?? event.eventTypeCode ?? 'Plant event'),
    type: event.eventTypeName ?? event.eventTypeCode ?? 'Event',
    source: 'event' as const,
  }));

  const photoEntries = photos.map((photo) => ({
    id: `photo-${photo.id}`,
    timestamp: photo.createdAt,
    dateLabel: formatDateTime(photo.createdAt) ?? 'Unknown date',
    title: photo.fileName,
    summary: photo.isPrimary
      ? `Primary ${photo.photoTypeName?.toLowerCase() ?? 'plant'} photo uploaded`
      : `${photo.photoTypeName ?? 'Plant photo'} uploaded`,
    type: photo.photoTypeName ?? 'Photo upload',
    source: 'photo' as const,
  }));

  return [...eventEntries, ...photoEntries]
    .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));
}

function buildReadingMetrics(
  plant: PlantDetail,
  thresholdMap: Record<'soilMoisture' | 'temperature' | 'light' | 'airHumidity', PlantThresholdSummary | null>,
): PlantReadingsMetric[] {
  const lastReadingContext = plant.latestReading
    ? `Latest reading at ${formatDateTime(plant.latestReading.readAt)}`
    : 'No reading values available in the current plant detail contract';

  return [
    {
      id: 'temperature',
      label: 'Temperature',
      value: thresholdMap.temperature ? thresholdValueHint(thresholdMap.temperature) : 'Pending telemetry',
      hint: lastReadingContext,
      tone: plant.latestReading ? 'info' : 'neutral',
    },
    {
      id: 'air-humidity',
      label: 'Air humidity',
      value: thresholdMap.airHumidity ? thresholdValueHint(thresholdMap.airHumidity) : 'Pending telemetry',
      hint: lastReadingContext,
      tone: plant.latestReading ? 'info' : 'neutral',
    },
    {
      id: 'soil-moisture',
      label: 'Soil moisture',
      value: thresholdMap.soilMoisture ? thresholdValueHint(thresholdMap.soilMoisture) : 'Pending telemetry',
      hint: lastReadingContext,
      tone: plant.latestReading ? 'info' : 'neutral',
    },
    {
      id: 'light',
      label: 'Light',
      value: thresholdMap.light ? thresholdValueHint(thresholdMap.light) : 'Pending telemetry',
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

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('ca-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('ca-ES', {
    dateStyle: 'medium',
  }).format(date);
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
