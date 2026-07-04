import { HABIT_OPTIONS, type HabitIntensity } from '../mainscreen/habits/icons/index';
import { dictionaries } from '../i18n/index';

/**
 * Look up the intensity configuration for a habit by its name.
 * Returns the HabitIntensity config if found, or null if the habit
 * doesn't exist in HABIT_OPTIONS or has no intensity defined.
 */
export function getIntensityConfig(habitName: string): HabitIntensity | null {
  if (!habitName) return null;
  
  // 1. Direct match in HABIT_OPTIONS (English/Indonesian preset name)
  let habit = HABIT_OPTIONS.find((h) => h.name.toLowerCase() === habitName.toLowerCase());
  if (habit && habit.intensity) return habit.intensity;

  // 2. Match against translated preset names in all dictionaries
  for (const h of HABIT_OPTIONS) {
    for (const dict of Object.values(dictionaries)) {
      const presetsDict = dict.presets || {};
      const translatedName = presetsDict[h.name];
      if (translatedName && typeof translatedName === 'string' && translatedName.toLowerCase() === habitName.toLowerCase()) {
        if (h.intensity) return h.intensity;
      }
    }
  }

  return null;
}

/**
 * Format the intensity display label for a habit card.
 * Returns a string like "8 Gelas" or "30 Menit" for numeric habits.
 * Returns null for single-action habits or habits not found in HABIT_OPTIONS.
 *
 * If targetIntensity is provided, uses that value; otherwise falls back
 * to the defaultValue from HABIT_OPTIONS.
 */
export function formatIntensityLabel(
  habitName: string,
  targetIntensity?: number | null,
  t?: (key: string) => string
): string | null {
  const config = getIntensityConfig(habitName);
  if (!config || config.type !== 'numeric') return null;

  const value = targetIntensity != null ? targetIntensity : config.defaultValue;
  if (value == null) return null;

  const unitLabel = t ? (t(`units.${config.unit}`) || config.unit) : config.unit;
  return `${value} ${unitLabel}`;
}

/**
 * Determine if a habit should show the intensity picker on completion.
 * Returns true only for habits with intensity type 'numeric'.
 */
export function shouldShowIntensityPicker(habitName: string): boolean {
  const config = getIntensityConfig(habitName);
  return config?.type === 'numeric';
}

/**
 * Calculate chart bar heights from habit logs for a 7-day week.
 *
 * For numeric habits: Y-axis = 0 to user's target intensity.
 * Bar height = logged value / target.
 * For single-action habits: bars are binary (0 or 1).
 */
export function calculateBarHeights(
  logs: Array<{ date: string; intensity_value: number | null }>,
  weekDates: string[],
  isNumeric: boolean,
  defaultIntensity?: number,
  options?: number[]
): { heights: number[]; maxValue: number; yAxisLabels: number[] } {
  if (!isNumeric) {
    const heights = weekDates.map((date) => {
      const log = logs.find((l) => l.date === date);
      return log ? 1 : 0;
    });
    return { heights, maxValue: 1, yAxisLabels: [0, 1] };
  }

  // Use the user's target (defaultIntensity) as the base
  const target = defaultIntensity || 1;
  const optionsMax = options && options.length > 0 ? Math.max(...options) : target;

  const dayValues = weekDates.map((date) => {
    const log = logs.find((l) => l.date === date);
    if (!log) return 0;
    if (log.intensity_value == null) return target; // legacy log = assume target was met
    return log.intensity_value;
  });

  // maxValue = highest of: options max, target, or actual logged values
  const actualMax = Math.max(...dayValues, 0);
  const maxValue = Math.max(optionsMax, actualMax, 1);

  // Normalize heights: value / maxValue
  const heights = dayValues.map((v) => (maxValue > 0 ? Math.min(1, v / maxValue) : 0));

  // Y-axis ticks generation based on maxValue
  let tickStep = 1;
  if (maxValue <= 5) {
    tickStep = 1;
  } else if (maxValue <= 10) {
    tickStep = 2;
  } else if (maxValue <= 15) {
    tickStep = 3;
  } else if (maxValue <= 20) {
    tickStep = 5;
  } else if (maxValue <= 40) {
    tickStep = 10;
  } else if (maxValue <= 60) {
    tickStep = 15;
  } else if (maxValue <= 100) {
    tickStep = 20;
  } else {
    tickStep = 30;
  }

  const yAxisLabels: number[] = [];
  for (let val = 0; val <= maxValue; val += tickStep) {
    yAxisLabels.push(val);
  }
  if (yAxisLabels[yAxisLabels.length - 1] !== maxValue) {
    yAxisLabels.push(maxValue);
  }

  return { heights, maxValue, yAxisLabels };
}
