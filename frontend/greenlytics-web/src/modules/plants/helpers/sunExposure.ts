export const sunExposureLabels: Record<string, string> = {
  indoor_low_direct_light: "Planta d'interior amb poca llum directa",
  indoor_bright_indirect_light: "Planta d'interior amb llum indirecta brillant",
  indoor_near_window_filtered_light: "Planta d'interior prop d'una finestra amb llum filtrada",
  outdoor_partial_sun: 'Planta exterior amb exposicio parcial a la llum solar',
  outdoor_full_sun: 'Planta exterior amb exposicio directa a la llum solar',
  outdoor_shade: 'Planta exterior en ombra o semiombra',
};

export const sunExposureOptions = Object.entries(sunExposureLabels).map(([value, label]) => ({
  value,
  label,
}));

export function getSunExposureLabel(value: string | null | undefined) {
  if (!value) {
    return 'Unspecified';
  }

  return sunExposureLabels[value] ?? value;
}
