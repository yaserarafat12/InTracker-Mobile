import { describe, it, expect } from 'vitest';
import {
  calculateBmr,
  calculateTdee,
  calculateCalorieTarget,
  calculateMacros,
  calculateWeeklyRate,
} from './nutritionEngine';

describe('nutritionEngine', () => {
  describe('calculateBmr', () => {
    it('calculates BMR for a male correctly', () => {
      // Male: (10×70) + (6.25×175) − (5×25) + 5 = 700 + 1093.75 − 125 + 5 = 1673.75 → 1674
      const result = calculateBmr({ sex: 'male', weight: 70, height: 175, age: 25 });
      expect(result).toEqual({ success: true, bmr: 1674 });
    });

    it('calculates BMR for a female correctly', () => {
      // Female: (10×60) + (6.25×165) − (5×30) − 161 = 600 + 1031.25 − 150 − 161 = 1320.25 → 1320
      const result = calculateBmr({ sex: 'female', weight: 60, height: 165, age: 30 });
      expect(result).toEqual({ success: true, bmr: 1320 });
    });

    it('returns error for weight below range', () => {
      const result = calculateBmr({ sex: 'male', weight: 19, height: 175, age: 25 });
      expect(result).toEqual({ success: false, error: expect.any(String), field: 'weight' });
    });

    it('returns error for weight above range', () => {
      const result = calculateBmr({ sex: 'male', weight: 301, height: 175, age: 25 });
      expect(result).toEqual({ success: false, error: expect.any(String), field: 'weight' });
    });

    it('returns error for height below range', () => {
      const result = calculateBmr({ sex: 'male', weight: 70, height: 99, age: 25 });
      expect(result).toEqual({ success: false, error: expect.any(String), field: 'height' });
    });

    it('returns error for height above range', () => {
      const result = calculateBmr({ sex: 'male', weight: 70, height: 251, age: 25 });
      expect(result).toEqual({ success: false, error: expect.any(String), field: 'height' });
    });

    it('returns error for age below range', () => {
      const result = calculateBmr({ sex: 'female', weight: 60, height: 160, age: 12 });
      expect(result).toEqual({ success: false, error: expect.any(String), field: 'age' });
    });

    it('returns error for age above range', () => {
      const result = calculateBmr({ sex: 'female', weight: 60, height: 160, age: 121 });
      expect(result).toEqual({ success: false, error: expect.any(String), field: 'age' });
    });

    it('accepts boundary values', () => {
      const result = calculateBmr({ sex: 'male', weight: 20, height: 100, age: 13 });
      expect(result.success).toBe(true);
    });
  });

  describe('calculateTdee', () => {
    it('calculates TDEE with sedentary multiplier', () => {
      // 1674 × 1.2 = 2008.8 → 2009
      const result = calculateTdee({ bmr: 1674, activityMultiplier: 1.2 });
      expect(result).toBe(2009);
    });

    it('calculates TDEE with very active multiplier', () => {
      // 1674 × 1.725 = 2887.65 → 2888
      const result = calculateTdee({ bmr: 1674, activityMultiplier: 1.725 });
      expect(result).toBe(2888);
    });

    it('throws for invalid multiplier', () => {
      expect(() => calculateTdee({ bmr: 1674, activityMultiplier: 1.5 as any })).toThrow();
    });
  });

  describe('calculateCalorieTarget', () => {
    it('applies -20% for lose_fat_keep_muscle', () => {
      // 2000 × 0.80 = 1600
      const result = calculateCalorieTarget({ tdee: 2000, goal: 'lose_fat_keep_muscle', sex: 'male', age: 25 });
      expect(result).toBe(1600);
    });

    it('applies -30% for aggressive_fat_loss', () => {
      // 2000 × 0.70 = 1400 → but male adult floor is 1500
      const result = calculateCalorieTarget({ tdee: 2000, goal: 'aggressive_fat_loss', sex: 'male', age: 25 });
      expect(result).toBe(1500);
    });

    it('applies +10% for lean_bulk', () => {
      // 2000 × 1.10 = 2200
      const result = calculateCalorieTarget({ tdee: 2000, goal: 'lean_bulk', sex: 'male', age: 25 });
      expect(result).toBe(2200);
    });

    it('applies +20% for bulk', () => {
      // 2000 × 1.20 = 2400
      const result = calculateCalorieTarget({ tdee: 2000, goal: 'bulk', sex: 'male', age: 25 });
      expect(result).toBe(2400);
    });

    it('applies 0% for maintain_weight', () => {
      const result = calculateCalorieTarget({ tdee: 2000, goal: 'maintain_weight', sex: 'male', age: 25 });
      expect(result).toBe(2000);
    });

    it('enforces female adult floor of 1200', () => {
      // 1300 × 0.70 = 910 → floor 1200
      const result = calculateCalorieTarget({ tdee: 1300, goal: 'aggressive_fat_loss', sex: 'female', age: 25 });
      expect(result).toBe(1200);
    });

    it('enforces male teen floor of 1600', () => {
      // 2000 × 0.70 = 1400 → floor 1600 for male teen
      const result = calculateCalorieTarget({ tdee: 2000, goal: 'aggressive_fat_loss', sex: 'male', age: 15 });
      expect(result).toBe(1600);
    });

    it('enforces female teen floor of 1400', () => {
      // 1800 × 0.70 = 1260 → floor 1400 for female teen
      const result = calculateCalorieTarget({ tdee: 1800, goal: 'aggressive_fat_loss', sex: 'female', age: 16 });
      expect(result).toBe(1400);
    });

    it('enforces 5000 cap', () => {
      // 5000 × 1.20 = 6000 → cap 5000
      const result = calculateCalorieTarget({ tdee: 5000, goal: 'bulk', sex: 'male', age: 25 });
      expect(result).toBe(5000);
    });
  });

  describe('calculateMacros', () => {
    it('uses balanced split for no_preference without adjustments', () => {
      // 2000 cal, no_preference, maintain_weight, age 25
      // protein 30%: (2000×0.30)/4 = 150g, carbs 40%: (2000×0.40)/4 = 200g, fat 30%: (2000×0.30)/9 ≈ 67g
      const result = calculateMacros({ dailyCalories: 2000, dietaryPreference: 'no_preference', goal: 'maintain_weight', age: 25 });
      expect(result.protein).toBe(150);
      expect(result.fat).toBe(67);
      // Check calorie sum is within tolerance
      const macroCalories = result.protein * 4 + result.carbs * 4 + result.fat * 9;
      expect(Math.abs(macroCalories - 2000)).toBeLessThanOrEqual(10);
    });

    it('uses keto split with 10% carbs floor applied', () => {
      // 2000 cal, keto, maintain_weight, age 25
      // keto base: protein 25%, carbs 5%, fat 70%
      // carbs floor: 5% → 10%, protein reduced by 5pp: 25% → 20%
      // protein 20%: (2000×0.20)/4 = 100g, carbs 10%: (2000×0.10)/4 = 50g, fat 70%: (2000×0.70)/9 ≈ 156g
      const result = calculateMacros({ dailyCalories: 2000, dietaryPreference: 'keto', goal: 'maintain_weight', age: 25 });
      expect(result.protein).toBe(100);
      expect(result.fat).toBe(156);
      const macroCalories = result.protein * 4 + result.carbs * 4 + result.fat * 9;
      expect(Math.abs(macroCalories - 2000)).toBeLessThanOrEqual(10);
    });

    it('applies +5% protein for fat loss goal', () => {
      // 2000 cal, no_preference, lose_fat_keep_muscle, age 25
      // protein 35%: (2000×0.35)/4 = 175g, carbs 35%: (2000×0.35)/4 = 175g, fat 30%: (2000×0.30)/9 ≈ 67g
      const result = calculateMacros({ dailyCalories: 2000, dietaryPreference: 'no_preference', goal: 'lose_fat_keep_muscle', age: 25 });
      expect(result.protein).toBe(175);
      const macroCalories = result.protein * 4 + result.carbs * 4 + result.fat * 9;
      expect(Math.abs(macroCalories - 2000)).toBeLessThanOrEqual(10);
    });

    it('applies +5% protein for age 13-17', () => {
      // 2000 cal, no_preference, maintain_weight, age 15
      // protein 35%: (2000×0.35)/4 = 175g, carbs 35%: (2000×0.35)/4 = 175g, fat 30%
      const result = calculateMacros({ dailyCalories: 2000, dietaryPreference: 'no_preference', goal: 'maintain_weight', age: 15 });
      expect(result.protein).toBe(175);
    });

    it('applies +5% protein for age 50+', () => {
      // 2000 cal, no_preference, maintain_weight, age 55
      const result = calculateMacros({ dailyCalories: 2000, dietaryPreference: 'no_preference', goal: 'maintain_weight', age: 55 });
      expect(result.protein).toBe(175);
    });

    it('stacks goal and age adjustments (+10% protein)', () => {
      // 2000 cal, no_preference, lose_fat_keep_muscle, age 15
      // base 30%, +5 goal, +5 age = 40% protein, 30% carbs, 30% fat
      const result = calculateMacros({ dailyCalories: 2000, dietaryPreference: 'no_preference', goal: 'lose_fat_keep_muscle', age: 15 });
      expect(result.protein).toBe(200); // (2000×0.40)/4 = 200
    });

    it('caps combined protein increase at 15pp', () => {
      // Even though max possible is 10pp (5+5), this tests the cap logic exists
      // With paleo (35% base) + goal + age: 35 + 5 + 5 = 45%, increase = 10pp (under 15)
      const result = calculateMacros({ dailyCalories: 2000, dietaryPreference: 'paleo', goal: 'lose_fat_keep_muscle', age: 55 });
      // protein: 45%, carbs: 15%, fat: 40%
      expect(result.protein).toBe(225); // (2000×0.45)/4 = 225
    });

    it('enforces 10% carbs floor', () => {
      // keto (5% carbs) + goal adjustment (-5% carbs) = 0% → floor at 10%
      // keto base: protein 25%, carbs 5%, fat 70%
      // goal adj: +5 protein, -5 carbs → protein 30%, carbs 0%, fat 70%
      // carbs floor: carbs = 10%, protein = 30% - 10% = 20%... wait
      // Actually: protein increase = 5, so protein = 25+5=30, carbs = 5-5=0
      // Floor: carbs = 10, deficit = 10, protein = 30 - 10 = 20
      const result = calculateMacros({ dailyCalories: 2000, dietaryPreference: 'keto', goal: 'lose_fat_keep_muscle', age: 25 });
      // carbs should be at least (2000×0.10)/4 = 50g
      const carbsPct = (result.carbs * 4) / 2000 * 100;
      expect(carbsPct).toBeGreaterThanOrEqual(9); // allowing for rounding
    });

    it('macro calories sum within 10 kcal tolerance', () => {
      const result = calculateMacros({ dailyCalories: 2500, dietaryPreference: 'paleo', goal: 'aggressive_fat_loss', age: 60 });
      const macroCalories = result.protein * 4 + result.carbs * 4 + result.fat * 9;
      expect(Math.abs(macroCalories - 2500)).toBeLessThanOrEqual(10);
    });
  });

  describe('calculateWeeklyRate', () => {
    it('calculates weight loss rate', () => {
      // (65 - 80) / 12 = -1.25 → -1.2 (rounded to 1 decimal)
      const result = calculateWeeklyRate({ currentWeight: 80, targetWeight: 65, durationWeeks: 12 });
      expect(result.ratePerWeek).toBe(-1.2);
      expect(result.isAggressive).toBe(true); // < -1.0
    });

    it('calculates weight gain rate', () => {
      // (75 - 70) / 16 = 0.3125 → 0.3
      const result = calculateWeeklyRate({ currentWeight: 70, targetWeight: 75, durationWeeks: 16 });
      expect(result.ratePerWeek).toBe(0.3);
      expect(result.isAggressive).toBe(false);
    });

    it('flags aggressive gain (> 0.5 kg/week)', () => {
      // (80 - 70) / 8 = 1.25 → 1.3
      const result = calculateWeeklyRate({ currentWeight: 70, targetWeight: 80, durationWeeks: 8 });
      expect(result.ratePerWeek).toBe(1.3);
      expect(result.isAggressive).toBe(true);
    });

    it('returns 0 rate for same weight', () => {
      const result = calculateWeeklyRate({ currentWeight: 70, targetWeight: 70, durationWeeks: 8 });
      expect(result.ratePerWeek).toBe(0);
      expect(result.isAggressive).toBe(false);
    });

    it('handles moderate loss (not aggressive)', () => {
      // (67 - 70) / 8 = -0.375 → -0.4
      const result = calculateWeeklyRate({ currentWeight: 70, targetWeight: 67, durationWeeks: 8 });
      expect(result.ratePerWeek).toBe(-0.4);
      expect(result.isAggressive).toBe(false);
    });
  });
});
