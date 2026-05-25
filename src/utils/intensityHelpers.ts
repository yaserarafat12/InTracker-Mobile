import { HABIT_OPTIONS, type HabitIntensity } from '../mainscreen/habits/icons/index';

/**
 * Look up the intensity configuration for a habit by its name.
 * Returns the HabitIntensity config if found, or null if the habit
 * doesn't exist in HABIT_OPTIONS or has no intensity defined.
 */
export function getIntensityConfig(habitName: string): HabitIntensity | null {
  const habit = HABIT_OPTIONS.find((h) => h.name === habitName);
  if (!habit || !habit.intensity) return null;
  return habit.intensity;
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
  targetIntensity?: number | null
): string | null {
  const config = getIntensityConfig(habitName);
  if (!config || config.type !== 'numeric') return null;

  const value = targetIntensity != null ? targetIntensity : config.defaultValue;
  if (value == null) return null;

  return `${value} ${config.unit}`;
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

  // Use the user's target (defaultIntensity) as the chart max
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

  // Y-axis: simple evenly spaced from 0 to maxValue (5 labels)
  const step = maxValue / 4;
  const yAxisLabels = [
    0,
    Math.round(step),
    Math.round(step * 2),
    Math.round(step * 3),
    maxValue,
  ];

  return { heights, maxValue, yAxisLabels };
}
