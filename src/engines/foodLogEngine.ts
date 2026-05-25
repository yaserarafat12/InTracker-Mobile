// ============================================================
// Calorie Tracker — Food Log Engine
// Pure functions for food entry grouping, meal type detection,
// and daily nutrition totals.
// ============================================================

// --- Types ---

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodEntry {
  id: string;
  userId: string;
  date: string;            // YYYY-MM-DD
  mealType: MealType;
  foodName: string;        // 1-100 chars
  calories: number;        // 0-99999
  protein: number;         // 0-9999.9
  carbs: number;           // 0-9999.9
  fat: number;             // 0-9999.9
  createdAt: string;       // ISO timestamp
  isDeleted?: boolean;     // soft delete for sync
  source?: 'manual' | 'search' | 'usda' | 'ai_scan';
}

export interface GroupedFoodLog {
  mealType: MealType;
  entries: FoodEntry[];
  totalCalories: number;
}

// --- Constants ---

export const MEAL_TYPE_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

// --- Functions ---

/**
 * Group food entries by meal type in the fixed order:
 * [breakfast, lunch, dinner, snack].
 *
 * Only groups that contain at least one entry are included in the result.
 * Every entry appears in exactly one group matching its `mealType` field.
 */
export function groupEntriesByMealType(entries: FoodEntry[]): GroupedFoodLog[] {
  const groups: GroupedFoodLog[] = [];

  for (const mealType of MEAL_TYPE_ORDER) {
    const mealEntries = entries.filter((entry) => entry.mealType === mealType);

    if (mealEntries.length > 0) {
      const totalCalories = mealEntries.reduce((sum, entry) => sum + entry.calories, 0);
      groups.push({
        mealType,
        entries: mealEntries,
        totalCalories,
      });
    }
  }

  return groups;
}

/**
 * Determine the default meal type based on the hour of day (0-23).
 *
 * - Breakfast: hours 0–10
 * - Lunch: hours 11–14
 * - Dinner: hours 15–20
 * - Snack: hours 21–23
 */
export function getMealTypeByTime(hour: number): MealType {
  if (hour >= 0 && hour <= 10) {
    return 'breakfast';
  }
  if (hour >= 11 && hour <= 14) {
    return 'lunch';
  }
  if (hour >= 15 && hour <= 20) {
    return 'dinner';
  }
  // hours 21-23
  return 'snack';
}

/**
 * Calculate daily nutrition totals from a set of food entries.
 *
 * Returns the sum of calories, protein, carbs, and fat across all entries.
 */
export function calculateDailyTotals(entries: FoodEntry[]): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fat: totals.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
