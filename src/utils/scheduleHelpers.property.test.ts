import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getDefaultSchedule,
  isValidSchedule,
  getScheduleLabel,
  filterHabitsByDay,
  isScheduledDay,
  calculateScheduleAwareStreak,
  type ScheduleConfig,
} from './scheduleHelpers';

// ============================================================================
// Generators
// ============================================================================

/** Generates a valid daily schedule config. */
const dailyScheduleArb: fc.Arbitrary<ScheduleConfig> = fc.constant({
  schedule_type: 'daily' as const,
  schedule_days: [0, 1, 2, 3, 4, 5, 6],
});

/** Generates a valid weekly schedule config (exactly 1 day in 0-6). */
const weeklyScheduleArb: fc.Arbitrary<ScheduleConfig> = fc.integer({ min: 0, max: 6 }).map(
  (day) => ({ schedule_type: 'weekly' as const, schedule_days: [day] })
);

/** Generates a valid custom schedule config (1+ unique days in 0-6). */
const customScheduleArb: fc.Arbitrary<ScheduleConfig> = fc
  .uniqueArray(fc.integer({ min: 0, max: 6 }), { minLength: 1, maxLength: 7 })
  .map((days) => ({ schedule_type: 'custom' as const, schedule_days: days }));

/** Generates any valid schedule config. */
const validScheduleArb: fc.Arbitrary<ScheduleConfig> = fc.oneof(
  dailyScheduleArb,
  weeklyScheduleArb,
  customScheduleArb
);

/** Generates a day of week (0-6). */
const dayOfWeekArb = fc.integer({ min: 0, max: 6 });

/** Generates a habit-like object with schedule_days. */
const habitWithScheduleArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  schedule_days: fc.uniqueArray(fc.integer({ min: 0, max: 6 }), { minLength: 1, maxLength: 7 }),
});

// ============================================================================
// Property 1: Schedule Data Model Consistency
// Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
// ============================================================================

describe('Property 1: Schedule Data Model Consistency', () => {
  it('daily schedules always have days=[0,1,2,3,4,5,6]', () => {
    fc.assert(
      fc.property(dailyScheduleArb, (config) => {
        expect(isValidSchedule(config)).toBe(true);
        expect(config.schedule_days.sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
      }),
      { numRuns: 100 }
    );
  });

  it('weekly schedules have exactly 1 day in range 0-6', () => {
    fc.assert(
      fc.property(weeklyScheduleArb, (config) => {
        expect(isValidSchedule(config)).toBe(true);
        expect(config.schedule_days).toHaveLength(1);
        expect(config.schedule_days[0]).toBeGreaterThanOrEqual(0);
        expect(config.schedule_days[0]).toBeLessThanOrEqual(6);
      }),
      { numRuns: 100 }
    );
  });

  it('custom schedules have 1+ days all in range 0-6', () => {
    fc.assert(
      fc.property(customScheduleArb, (config) => {
        expect(isValidSchedule(config)).toBe(true);
        expect(config.schedule_days.length).toBeGreaterThanOrEqual(1);
        config.schedule_days.forEach((day) => {
          expect(day).toBeGreaterThanOrEqual(0);
          expect(day).toBeLessThanOrEqual(6);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('invalid configs are rejected by isValidSchedule', () => {
    // daily with wrong days
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.integer({ min: 0, max: 6 }), { minLength: 1, maxLength: 6 }),
        (days) => {
          if (days.length !== 7 || [...days].sort((a, b) => a - b).some((d, i) => d !== i)) {
            expect(isValidSchedule({ schedule_type: 'daily', schedule_days: days })).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 2: Default Schedule Application
// Validates: Requirements 1.6, 7.1
// ============================================================================

describe('Property 2: Default Schedule Application', () => {
  it('getDefaultSchedule always returns daily with all 7 days', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), (_) => {
        const result = getDefaultSchedule();
        expect(result.schedule_type).toBe('daily');
        expect(result.schedule_days).toEqual([0, 1, 2, 3, 4, 5, 6]);
        expect(isValidSchedule(result)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('default schedule is always a valid schedule', () => {
    fc.assert(
      fc.property(fc.constant(null), (_) => {
        const defaultSchedule = getDefaultSchedule();
        expect(isValidSchedule(defaultSchedule)).toBe(true);
        expect(defaultSchedule.schedule_days).toHaveLength(7);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 3: Day-Based Filtering Correctness
// Validates: Requirements 3.1, 3.2, 3.3
// ============================================================================

describe('Property 3: Day-Based Filtering Correctness', () => {
  it('filterHabitsByDay returns exactly habits scheduled for that day', () => {
    fc.assert(
      fc.property(
        fc.array(habitWithScheduleArb, { minLength: 0, maxLength: 20 }),
        dayOfWeekArb,
        (habits, day) => {
          const filtered = filterHabitsByDay(habits, day);

          // Every returned habit must include the day
          filtered.forEach((habit) => {
            expect(habit.schedule_days).toContain(day);
          });

          // Every habit that includes the day must be in the result
          const expected = habits.filter((h) => h.schedule_days.includes(day));
          expect(filtered).toHaveLength(expected.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('filtering preserves habit identity (no duplicates, no fabrication)', () => {
    fc.assert(
      fc.property(
        fc.array(habitWithScheduleArb, { minLength: 0, maxLength: 20 }),
        dayOfWeekArb,
        (habits, day) => {
          const filtered = filterHabitsByDay(habits, day);

          // All filtered habits must be from the original list
          const originalIds = habits.map((h) => h.id);
          filtered.forEach((h) => {
            expect(originalIds).toContain(h.id);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('habits with null/undefined schedule_days always pass filter', () => {
    fc.assert(
      fc.property(dayOfWeekArb, (day) => {
        const habits = [
          { id: 'null-habit', name: 'Null', schedule_days: null as unknown as number[] },
          { id: 'undef-habit', name: 'Undef', schedule_days: undefined as unknown as number[] },
        ];
        const filtered = filterHabitsByDay(habits, day);
        expect(filtered).toHaveLength(2);
      }),
      { numRuns: 7 }
    );
  });
});

// ============================================================================
// Property 4: Schedule Label Formatting
// Validates: Requirements 4.1, 4.2, 4.3
// ============================================================================

describe('Property 4: Schedule Label Formatting', () => {
  const dayNamesShort: Record<number, string> = {
    0: 'MIN', 1: 'SEN', 2: 'SEL', 3: 'RAB', 4: 'KAM', 5: 'JUM', 6: 'SAB',
  };
  const dayNamesFull: Record<number, string> = {
    0: 'MINGGU', 1: 'SENIN', 2: 'SELASA', 3: 'RABU', 4: 'KAMIS', 5: 'JUMAT', 6: 'SABTU',
  };

  it('daily schedule always returns "HARIAN"', () => {
    fc.assert(
      fc.property(dailyScheduleArb, (config) => {
        expect(getScheduleLabel(config)).toBe('HARIAN');
      }),
      { numRuns: 100 }
    );
  });

  it('weekly schedule returns the correct full Indonesian day name', () => {
    fc.assert(
      fc.property(weeklyScheduleArb, (config) => {
        const expected = dayNamesFull[config.schedule_days[0]];
        expect(getScheduleLabel(config)).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('custom schedule returns comma-separated abbreviated day names in week order', () => {
    fc.assert(
      fc.property(customScheduleArb, (config) => {
        const label = getScheduleLabel(config);
        const sortedDays = [...config.schedule_days].sort((a, b) => a - b);
        const expected = sortedDays.map((d) => dayNamesShort[d]).join(', ');
        expect(label).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('label is always a non-empty uppercase string', () => {
    fc.assert(
      fc.property(validScheduleArb, (config) => {
        const label = getScheduleLabel(config);
        expect(label.length).toBeGreaterThan(0);
        expect(label).toBe(label.toUpperCase());
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 5: Analytics Grid Schedule Awareness
// Validates: Requirements 5.2, 5.3
// ============================================================================

describe('Property 5: Analytics Grid Schedule Awareness', () => {
  it('isScheduledDay matches scheduleDays.includes(date.getDay()) for any date', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.integer({ min: 0, max: 6 }), { minLength: 1, maxLength: 7 }),
        fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) }),
        (scheduleDays, date) => {
          const result = isScheduledDay(date, scheduleDays);
          const expected = scheduleDays.includes(date.getDay());
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('grid cell active state is true iff date day-of-week is in schedule_days', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.integer({ min: 0, max: 6 }), { minLength: 1, maxLength: 7 }),
        fc.integer({ min: 0, max: 89 }), // 90-day grid offset
        (scheduleDays, dayOffset) => {
          const baseDate = new Date(2024, 0, 1); // Jan 1, 2024
          const cellDate = new Date(baseDate);
          cellDate.setDate(baseDate.getDate() + dayOffset);

          const isActive = isScheduledDay(cellDate, scheduleDays);
          const dayOfWeek = cellDate.getDay();

          if (scheduleDays.includes(dayOfWeek)) {
            expect(isActive).toBe(true);
          } else {
            expect(isActive).toBe(false);
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});

// ============================================================================
// Property 6: Schedule-Aware Streak Calculation
// Validates: Requirements 6.1, 6.2, 6.3, 6.4
// ============================================================================

describe('Property 6: Schedule-Aware Streak Calculation', () => {
  /** Helper to format date as YYYY-MM-DD */
  function formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  it('streak equals consecutive scheduled days with completions walking backward', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.integer({ min: 0, max: 6 }), { minLength: 1, maxLength: 7 }),
        fc.integer({ min: 0, max: 30 }), // number of consecutive completions from today
        fc.date({ min: new Date(2024, 0, 1), max: new Date(2024, 11, 31) }),
        (scheduleDays, streakLength, today) => {
          if (isNaN(today.getTime())) return;
          today.setHours(0, 0, 0, 0);

          // Build completion dates: walk backward from today, find scheduled days, complete `streakLength` of them
          const completions: string[] = [];
          let found = 0;
          for (let i = 0; i < 365 && found < streakLength; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            if (scheduleDays.includes(d.getDay())) {
              completions.push(formatDate(d));
              found++;
            }
          }

          const result = calculateScheduleAwareStreak(scheduleDays, completions, today);
          expect(result).toBe(streakLength);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('missing a scheduled day breaks the streak', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.integer({ min: 0, max: 6 }), { minLength: 1, maxLength: 7 }),
        fc.integer({ min: 2, max: 10 }), // at least 2 scheduled days to have a gap
        fc.date({ min: new Date(2024, 0, 15), max: new Date(2024, 11, 31) }),
        (scheduleDays, totalScheduledDays, today) => {
          if (isNaN(today.getTime())) return;
          today.setHours(0, 0, 0, 0);

          // Find scheduled days walking backward
          const scheduledDates: Date[] = [];
          for (let i = 0; i < 365 && scheduledDates.length < totalScheduledDays; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            if (scheduleDays.includes(d.getDay())) {
              scheduledDates.push(d);
            }
          }

          if (scheduledDates.length < 2) return; // not enough data to test

          // Complete all except the second scheduled day (index 1) to create a gap
          const completions = scheduledDates
            .filter((_, idx) => idx !== 1)
            .map(formatDate);

          const result = calculateScheduleAwareStreak(scheduleDays, completions, today);
          // Streak should be at most 1 (only today if completed)
          expect(result).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty completions always yields streak of 0', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.integer({ min: 0, max: 6 }), { minLength: 1, maxLength: 7 }),
        (scheduleDays) => {
          const result = calculateScheduleAwareStreak(scheduleDays, []);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('empty schedule_days always yields streak of 0', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 1, maxLength: 10 }),
        (completions) => {
          const result = calculateScheduleAwareStreak([], completions);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
