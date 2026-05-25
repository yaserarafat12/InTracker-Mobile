// ============================================================
// Calorie Tracker — Dashboard Engine
// Pure functions for progress ring, macro bars, and weekly
// chart calculations.
// ============================================================

import type { MacroTargets } from './nutritionEngine';

// --- Types ---

/**
 * Minimal FoodEntry shape needed by dashboard calculations.
 * The full FoodEntry type lives in foodLogEngine.ts (task 2.2).
 */
export interface FoodEntry {
  id: string;
  userId: string;
  date: string;            // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
  isDeleted?: boolean;
  source?: 'manual' | 'search' | 'usda' | 'ai_scan';
}

export interface ProgressRingData {
  fillPercentage: number;    // 0-100, capped at 100
  consumed: number;          // total kcal consumed
  target: number;            // daily target kcal
  remaining: number;         // can be negative if over-target
}

export interface MacroBarData {
  protein: { consumed: number; target: number; fillPercentage: number; isOver: boolean };
  carbs: { consumed: number; target: number; fillPercentage: number; isOver: boolean };
  fat: { consumed: number; target: number; fillPercentage: number; isOver: boolean };
}

export interface WeeklyChartDay {
  date: string;       // YYYY-MM-DD
  dayLabel: string;   // e.g. "Mon", "Tue"
  calories: number;
  isToday: boolean;
}

export interface WeeklyChartData {
  days: WeeklyChartDay[];
  averageCalories: number;   // average of days with entries only
  daysLogged: number;        // count of days with at least one entry
}

// --- Constants ---

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// --- Helper ---

/**
 * Format a Date to YYYY-MM-DD string.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- Progress Ring Calculation ---

/**
 * Calculate progress ring data for the calorie dashboard.
 *
 * - fillPercentage = min(100, (consumed / target) × 100), capped at 0 minimum
 * - remaining = target − consumed (can be negative when over-target)
 *
 * Validates: Requirements 10.1, 10.2, 10.4
 */
export function calculateProgressRing(consumed: number, target: number): ProgressRingData {
  const rawPercentage = target > 0 ? (consumed / target) * 100 : 0;
  const fillPercentage = Math.min(100, Math.max(0, rawPercentage));
  const remaining = target - consumed;

  return {
    fillPercentage,
    consumed,
    target,
    remaining,
  };
}

// --- Macro Bars Calculation ---

/**
 * Calculate macro bar data for protein, carbs, and fat.
 *
 * Each bar has:
 * - fillPercentage capped at 100
 * - isOver flag when consumed > target
 *
 * Validates: Requirements 10.3
 */
export function calculateMacroBars(consumed: MacroTargets, target: MacroTargets): MacroBarData {
  function calcBar(consumedVal: number, targetVal: number) {
    const rawPercentage = targetVal > 0 ? (consumedVal / targetVal) * 100 : 0;
    const fillPercentage = Math.min(100, Math.max(0, rawPercentage));
    const isOver = consumedVal > targetVal;
    return { consumed: consumedVal, target: targetVal, fillPercentage, isOver };
  }

  return {
    protein: calcBar(consumed.protein, target.protein),
    carbs: calcBar(consumed.carbs, target.carbs),
    fat: calcBar(consumed.fat, target.fat),
  };
}

// --- Weekly Chart Calculation ---

/**
 * Calculate weekly chart data for the 7-day bar chart.
 *
 * - weekStartDate should be a Monday
 * - Generates 7 days (Mon-Sun) from weekStartDate
 * - Sums calories per day from entries matching each date
 * - averageCalories = sum of calories on days with entries / count of such days
 * - daysLogged = count of days with at least one entry
 * - If no days have entries, averageCalories = 0 and daysLogged = 0
 * - isToday flag set for the day matching `today`
 *
 * Validates: Requirements 12.1, 12.2, 12.3, 12.6
 */
export function calculateWeeklyChart(
  entries: FoodEntry[],
  weekStartDate: Date,
  today: Date
): WeeklyChartData {
  const todayStr = formatDate(today);

  // Build 7 days starting from weekStartDate (Monday)
  const days: WeeklyChartDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + i);
    const dateStr = formatDate(dayDate);

    days.push({
      date: dateStr,
      dayLabel: DAY_LABELS[i],
      calories: 0,
      isToday: dateStr === todayStr,
    });
  }

  // Filter out deleted entries and sum calories per day
  const activeEntries = entries.filter(e => !e.isDeleted);

  // Track which days have at least one entry (even if 0 calories)
  const daysWithEntries = new Set<string>();

  for (const entry of activeEntries) {
    const dayIndex = days.findIndex(d => d.date === entry.date);
    if (dayIndex !== -1) {
      days[dayIndex].calories += entry.calories;
      daysWithEntries.add(entry.date);
    }
  }

  // Calculate average and daysLogged (only days with at least one entry)
  let totalCalories = 0;
  let daysLogged = 0;

  for (const day of days) {
    if (daysWithEntries.has(day.date)) {
      totalCalories += day.calories;
      daysLogged++;
    }
  }

  const averageCalories = daysLogged > 0 ? Math.round(totalCalories / daysLogged) : 0;

  return {
    days,
    averageCalories,
    daysLogged,
  };
}
