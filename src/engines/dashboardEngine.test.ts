import { describe, it, expect } from 'vitest';
import {
  calculateProgressRing,
  calculateMacroBars,
  calculateWeeklyChart,
  type FoodEntry,
} from './dashboardEngine';

describe('dashboardEngine', () => {
  describe('calculateProgressRing', () => {
    it('returns correct fill percentage for partial consumption', () => {
      const result = calculateProgressRing(500, 2000);
      expect(result.fillPercentage).toBe(25);
      expect(result.consumed).toBe(500);
      expect(result.target).toBe(2000);
      expect(result.remaining).toBe(1500);
    });

    it('caps fill percentage at 100 when over-target', () => {
      const result = calculateProgressRing(2500, 2000);
      expect(result.fillPercentage).toBe(100);
      expect(result.remaining).toBe(-500);
    });

    it('returns 0 fill when nothing consumed', () => {
      const result = calculateProgressRing(0, 2000);
      expect(result.fillPercentage).toBe(0);
      expect(result.remaining).toBe(2000);
    });

    it('handles target of 0 gracefully', () => {
      const result = calculateProgressRing(100, 0);
      expect(result.fillPercentage).toBe(0);
      expect(result.remaining).toBe(-100);
    });

    it('returns negative remaining when consumed exceeds target', () => {
      const result = calculateProgressRing(3000, 2000);
      expect(result.remaining).toBe(-1000);
    });
  });

  describe('calculateMacroBars', () => {
    it('returns correct fill percentages for each macro', () => {
      const consumed = { protein: 75, carbs: 100, fat: 30 };
      const target = { protein: 150, carbs: 200, fat: 60 };
      const result = calculateMacroBars(consumed, target);

      expect(result.protein.fillPercentage).toBe(50);
      expect(result.protein.isOver).toBe(false);
      expect(result.carbs.fillPercentage).toBe(50);
      expect(result.carbs.isOver).toBe(false);
      expect(result.fat.fillPercentage).toBe(50);
      expect(result.fat.isOver).toBe(false);
    });

    it('sets isOver flag when consumed exceeds target', () => {
      const consumed = { protein: 200, carbs: 250, fat: 80 };
      const target = { protein: 150, carbs: 200, fat: 60 };
      const result = calculateMacroBars(consumed, target);

      expect(result.protein.isOver).toBe(true);
      expect(result.protein.fillPercentage).toBe(100);
      expect(result.carbs.isOver).toBe(true);
      expect(result.carbs.fillPercentage).toBe(100);
      expect(result.fat.isOver).toBe(true);
      expect(result.fat.fillPercentage).toBe(100);
    });

    it('handles zero targets gracefully', () => {
      const consumed = { protein: 50, carbs: 50, fat: 50 };
      const target = { protein: 0, carbs: 0, fat: 0 };
      const result = calculateMacroBars(consumed, target);

      expect(result.protein.fillPercentage).toBe(0);
      expect(result.protein.isOver).toBe(true);
    });
  });

  describe('calculateWeeklyChart', () => {
    // Monday 2024-01-08
    const weekStart = new Date(2024, 0, 8);
    const today = new Date(2024, 0, 10); // Wednesday

    function makeEntry(date: string, calories: number): FoodEntry {
      return {
        id: `entry-${date}-${calories}`,
        userId: 'user1',
        date,
        mealType: 'lunch',
        foodName: 'Test Food',
        calories,
        protein: 10,
        carbs: 20,
        fat: 5,
        createdAt: new Date().toISOString(),
      };
    }

    it('generates 7 days starting from weekStartDate', () => {
      const result = calculateWeeklyChart([], weekStart, today);
      expect(result.days).toHaveLength(7);
      expect(result.days[0].date).toBe('2024-01-08');
      expect(result.days[0].dayLabel).toBe('Mon');
      expect(result.days[6].date).toBe('2024-01-14');
      expect(result.days[6].dayLabel).toBe('Sun');
    });

    it('sets isToday flag correctly', () => {
      const result = calculateWeeklyChart([], weekStart, today);
      expect(result.days[2].isToday).toBe(true); // Wednesday
      expect(result.days[0].isToday).toBe(false);
    });

    it('sums calories per day from entries', () => {
      const entries = [
        makeEntry('2024-01-08', 500),
        makeEntry('2024-01-08', 300),
        makeEntry('2024-01-10', 700),
      ];
      const result = calculateWeeklyChart(entries, weekStart, today);
      expect(result.days[0].calories).toBe(800); // Mon
      expect(result.days[2].calories).toBe(700); // Wed
      expect(result.days[1].calories).toBe(0);   // Tue
    });

    it('calculates average only over days with entries', () => {
      const entries = [
        makeEntry('2024-01-08', 600),
        makeEntry('2024-01-10', 800),
      ];
      const result = calculateWeeklyChart(entries, weekStart, today);
      expect(result.daysLogged).toBe(2);
      expect(result.averageCalories).toBe(700); // (600+800)/2
    });

    it('returns 0 average and 0 daysLogged when no entries', () => {
      const result = calculateWeeklyChart([], weekStart, today);
      expect(result.daysLogged).toBe(0);
      expect(result.averageCalories).toBe(0);
    });

    it('excludes deleted entries', () => {
      const entries: FoodEntry[] = [
        { ...makeEntry('2024-01-08', 500), isDeleted: true },
        makeEntry('2024-01-08', 300),
      ];
      const result = calculateWeeklyChart(entries, weekStart, today);
      expect(result.days[0].calories).toBe(300);
      expect(result.daysLogged).toBe(1);
    });

    it('counts day as logged even if total calories is 0', () => {
      const entries = [makeEntry('2024-01-09', 0)];
      const result = calculateWeeklyChart(entries, weekStart, today);
      expect(result.daysLogged).toBe(1);
      expect(result.averageCalories).toBe(0);
    });
  });
});
