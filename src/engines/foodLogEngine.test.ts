import { describe, it, expect } from 'vitest';
import {
  groupEntriesByMealType,
  getMealTypeByTime,
  calculateDailyTotals,
  MEAL_TYPE_ORDER,
  type FoodEntry,
} from './foodLogEngine';

// --- Test Helpers ---

function makeFoodEntry(overrides: Partial<FoodEntry> = {}): FoodEntry {
  return {
    id: 'test-id-1',
    userId: 'user-1',
    date: '2024-01-15',
    mealType: 'breakfast',
    foodName: 'Test Food',
    calories: 200,
    protein: 10,
    carbs: 25,
    fat: 8,
    createdAt: '2024-01-15T08:00:00Z',
    ...overrides,
  };
}

describe('foodLogEngine', () => {
  describe('MEAL_TYPE_ORDER', () => {
    it('has the fixed order [breakfast, lunch, dinner, snack]', () => {
      expect(MEAL_TYPE_ORDER).toEqual(['breakfast', 'lunch', 'dinner', 'snack']);
    });
  });

  describe('groupEntriesByMealType', () => {
    it('returns empty array for no entries', () => {
      expect(groupEntriesByMealType([])).toEqual([]);
    });

    it('groups entries by meal type in fixed order', () => {
      const entries: FoodEntry[] = [
        makeFoodEntry({ id: '1', mealType: 'dinner', calories: 500 }),
        makeFoodEntry({ id: '2', mealType: 'breakfast', calories: 300 }),
        makeFoodEntry({ id: '3', mealType: 'dinner', calories: 400 }),
        makeFoodEntry({ id: '4', mealType: 'snack', calories: 150 }),
      ];

      const result = groupEntriesByMealType(entries);

      // Should be in fixed order: breakfast, dinner, snack (no lunch entries)
      expect(result).toHaveLength(3);
      expect(result[0].mealType).toBe('breakfast');
      expect(result[1].mealType).toBe('dinner');
      expect(result[2].mealType).toBe('snack');
    });

    it('only includes groups with at least one entry', () => {
      const entries: FoodEntry[] = [
        makeFoodEntry({ id: '1', mealType: 'lunch', calories: 600 }),
      ];

      const result = groupEntriesByMealType(entries);

      expect(result).toHaveLength(1);
      expect(result[0].mealType).toBe('lunch');
    });

    it('calculates totalCalories per group', () => {
      const entries: FoodEntry[] = [
        makeFoodEntry({ id: '1', mealType: 'breakfast', calories: 300 }),
        makeFoodEntry({ id: '2', mealType: 'breakfast', calories: 200 }),
        makeFoodEntry({ id: '3', mealType: 'lunch', calories: 700 }),
      ];

      const result = groupEntriesByMealType(entries);

      expect(result[0].mealType).toBe('breakfast');
      expect(result[0].totalCalories).toBe(500);
      expect(result[1].mealType).toBe('lunch');
      expect(result[1].totalCalories).toBe(700);
    });

    it('places every entry in exactly one group matching its mealType', () => {
      const entries: FoodEntry[] = [
        makeFoodEntry({ id: '1', mealType: 'breakfast' }),
        makeFoodEntry({ id: '2', mealType: 'lunch' }),
        makeFoodEntry({ id: '3', mealType: 'dinner' }),
        makeFoodEntry({ id: '4', mealType: 'snack' }),
      ];

      const result = groupEntriesByMealType(entries);
      const allGroupedEntries = result.flatMap((g) => g.entries);

      // Every entry appears exactly once
      expect(allGroupedEntries).toHaveLength(entries.length);
      for (const entry of entries) {
        const group = result.find((g) => g.mealType === entry.mealType);
        expect(group).toBeDefined();
        expect(group!.entries).toContainEqual(entry);
      }
    });
  });

  describe('getMealTypeByTime', () => {
    it('returns breakfast for hours 0-10', () => {
      for (let hour = 0; hour <= 10; hour++) {
        expect(getMealTypeByTime(hour)).toBe('breakfast');
      }
    });

    it('returns lunch for hours 11-14', () => {
      for (let hour = 11; hour <= 14; hour++) {
        expect(getMealTypeByTime(hour)).toBe('lunch');
      }
    });

    it('returns dinner for hours 15-20', () => {
      for (let hour = 15; hour <= 20; hour++) {
        expect(getMealTypeByTime(hour)).toBe('dinner');
      }
    });

    it('returns snack for hours 21-23', () => {
      for (let hour = 21; hour <= 23; hour++) {
        expect(getMealTypeByTime(hour)).toBe('snack');
      }
    });
  });

  describe('calculateDailyTotals', () => {
    it('returns zeros for empty entries', () => {
      expect(calculateDailyTotals([])).toEqual({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      });
    });

    it('sums all nutrition values across entries', () => {
      const entries: FoodEntry[] = [
        makeFoodEntry({ calories: 300, protein: 20, carbs: 30, fat: 10 }),
        makeFoodEntry({ id: '2', calories: 500, protein: 35, carbs: 45, fat: 15 }),
        makeFoodEntry({ id: '3', calories: 200, protein: 10, carbs: 20, fat: 8 }),
      ];

      const result = calculateDailyTotals(entries);

      expect(result.calories).toBe(1000);
      expect(result.protein).toBe(65);
      expect(result.carbs).toBe(95);
      expect(result.fat).toBe(33);
    });

    it('handles a single entry', () => {
      const entries: FoodEntry[] = [
        makeFoodEntry({ calories: 450, protein: 30, carbs: 50, fat: 12 }),
      ];

      const result = calculateDailyTotals(entries);

      expect(result.calories).toBe(450);
      expect(result.protein).toBe(30);
      expect(result.carbs).toBe(50);
      expect(result.fat).toBe(12);
    });

    it('handles decimal values for macros', () => {
      const entries: FoodEntry[] = [
        makeFoodEntry({ calories: 100, protein: 5.5, carbs: 12.3, fat: 3.7 }),
        makeFoodEntry({ id: '2', calories: 200, protein: 8.2, carbs: 20.1, fat: 6.4 }),
      ];

      const result = calculateDailyTotals(entries);

      expect(result.calories).toBe(300);
      expect(result.protein).toBeCloseTo(13.7);
      expect(result.carbs).toBeCloseTo(32.4);
      expect(result.fat).toBeCloseTo(10.1);
    });
  });
});
