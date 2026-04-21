import type { PlantThresholdRecord } from '@/modules/plants/api/plantsApi';
import type { OptionItem } from '@/modules/plants/types/plant.types';

export type ParameterMetricKey = 'soilMoisture' | 'airHumidity' | 'temperature' | 'light';

export interface ParameterMetricDefinition {
  key: ParameterMetricKey;
  readingTokens: string[];
  unitTokens: string[];
  minField: 'soilMoistureMin' | 'airHumidityMin' | 'temperatureMin' | 'lightMin';
  maxField: 'soilMoistureMax' | 'airHumidityMax' | 'temperatureMax' | 'lightMax';
}

export const parameterMetricDefinitions: ParameterMetricDefinition[] = [
  {
    key: 'soilMoisture',
    readingTokens: ['soil moisture', 'soil_moisture', 'soilmoisture'],
    unitTokens: ['percent', 'percentage', 'percentatge', '%'],
    minField: 'soilMoistureMin',
    maxField: 'soilMoistureMax',
  },
  {
    key: 'airHumidity',
    readingTokens: ['air humidity', 'air_humidity', 'humidity', 'ambient humidity'],
    unitTokens: ['percent', 'percentage', 'percentatge', '%'],
    minField: 'airHumidityMin',
    maxField: 'airHumidityMax',
  },
  {
    key: 'temperature',
    readingTokens: ['temperature', 'temp'],
    unitTokens: ['celsius', 'centigrade', 'ºc', '°c', 'c'],
    minField: 'temperatureMin',
    maxField: 'temperatureMax',
  },
  {
    key: 'light',
    readingTokens: ['light', 'lux'],
    unitTokens: ['lux', 'lx'],
    minField: 'lightMin',
    maxField: 'lightMax',
  },
];

export function findThresholdByMetric(thresholds: PlantThresholdRecord[], metric: ParameterMetricDefinition) {
  return thresholds.find((threshold) => matchesTokens(threshold.readingTypeCode, threshold.readingTypeName, metric.readingTokens)) ?? null;
}

export function findOptionByTokens(options: OptionItem[], tokens: string[]) {
  return options.find((option) => matchesTokens(option.code, option.name, tokens)) ?? null;
}

function matchesTokens(code: string | undefined | null, name: string | undefined | null, tokens: string[]) {
  const haystack = `${code ?? ''} ${name ?? ''}`.toLowerCase();
  return tokens.some((token) => haystack.includes(token.toLowerCase()));
}
