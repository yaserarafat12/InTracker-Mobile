import { describe, it, expect } from 'vitest';
import {
  getDefaultSchedule,
  isValidSchedule,
  getScheduleLabel,
  filterHabitsByDay,
  isScheduledDay,
  calculateScheduleAwareStreak,
} from './scheduleHelpers';

describe('getDefaultSchedule', () => {
  it('returns daily schedule with all 7 days', () => {
    const result = getDefaultSchedule();
    expect(result.schedule_type).toBe('daily');
    expect(result.schedule_days).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe('isValidSchedule', () => {
  it('validates daily schedule with all days', () => {
    expect(isValidSchedule({ schedule_type: 'daily', schedule_days: [0, 1, 2, 3, 4, 5, 6] })).toBe(true);
  });

  it('rejects daily schedule with missing days', () => {
    expect(isValidSchedule({ schedule_type: 'daily', schedule_days: [0, 1, 2] })).toBe(false);
  });

  it('rejects daily schedule with extra days', () => {
    expect(isValidSchedule({ schedule_type: 'daily', schedule_days: [0, 1, 2, 3, 4, 5, 6, 7] })).toBe(false);
  });

  it('validates weekly schedule with exactly one day', () => {
    expect(isValidSchedule({ schedule_type: 'weekly', schedule_days: [3] })).toBe(true);
  });

  it('rejects weekly schedule with multiple days', () => {
    expect(isValidSchedule({ schedule_type: 'weekly', schedule_days: [1, 3] })).toBe(false);
  });

  it('rejects weekly schedule with invalid day value', () => {
    expect(isValidSchedule({ schedule_type: 'weekly', schedule_days: [7] })).toBe(false);
  });

  it('validates custom schedule with multiple days', () => {
    expect(isValidSchedule({ schedule_type: 'custom', schedule_days: [1, 3, 5] })).toBe(true);
  });

  it('validates custom schedule with single day', () => {
    expect(isValidSchedule({ schedule_type: 'custom', schedule_days: [4] })).toBe(true);
  });

  it('rejects custom schedule with empty days', () => {
    expect(isValidSchedule({ schedule_type: 'custom', schedule_days: [] })).toBe(false);
  });

  it('rejects custom schedule with invalid day value', () => {
    expect(isValidSchedule({ schedule_type: 'custom', schedule_days: [1, 8] })).toBe(false);
  });
});

describe('getScheduleLabel', () => {
  it('returns HARIAN for daily schedule', () => {
    expect(getScheduleLabel({ schedule_type: 'daily', schedule_days: [0, 1, 2, 3, 4, 5, 6] })).toBe('HARIAN');
  });

  it('returns full day name for weekly schedule - SENIN', () => {
    expect(getScheduleLabel({ schedule_type: 'weekly', schedule_days: [1] })).toBe('SENIN');
  });

  it('returns full day name for weekly schedule - MINGGU', () => {
    expect(getScheduleLabel({ schedule_type: 'weekly', schedule_days: [0] })).toBe('MINGGU');
  });

  it('returns full day name for weekly schedule - SABTU', () => {
    expect(getScheduleLabel({ schedule_type: 'weekly', schedule_days: [6] })).toBe('SABTU');
  });

  it('returns comma-separated abbreviated names for custom schedule', () => {
    expect(getScheduleLabel({ schedule_type: 'custom', schedule_days: [1, 3, 5] })).toBe('SEN, RAB, JUM');
  });

  it('sorts custom days in week order', () => {
    expect(getScheduleLabel({ schedule_type: 'custom', schedule_days: [5, 1, 3] })).toBe('SEN, RAB, JUM');
  });

  it('handles single custom day', () => {
    expect(getScheduleLabel({ schedule_type: 'custom', schedule_days: [2] })).toBe('SEL');
  });
});

describe('filterHabitsByDay', () => {
  const habits = [
    { id: '1', name: 'Daily', schedule_days: [0, 1, 2, 3, 4, 5, 6] },
    { id: '2', name: 'Monday only', schedule_days: [1] },
    { id: '3', name: 'Weekdays', schedule_days: [1, 2, 3, 4, 5] },
    { id: '4', name: 'No schedule', schedule_days: null },
    { id: '5', name: 'Empty schedule', schedule_days: undefined },
  ];

  it('returns all habits for a day when all are scheduled', () => {
    const result = filterHabitsByDay(habits, 1); // Monday
    expect(result.map((h) => h.id)).toEqual(['1', '2', '3', '4', '5']);
  });

  it('filters out habits not scheduled for Saturday', () => {
    const result = filterHabitsByDay(habits, 6); // Saturday
    expect(result.map((h) => h.id)).toEqual(['1', '4', '5']);
  });

  it('includes habits without schedule_days (defaults to all days)', () => {
    const result = filterHabitsByDay(habits, 0); // Sunday
    expect(result.map((h) => h.id)).toContain('4');
    expect(result.map((h) => h.id)).toContain('5');
  });
});

describe('isScheduledDay', () => {
  it('returns true when day is in scheduleDays', () => {
    const monday = new Date(2024, 0, 1); // Jan 1, 2024 is Monday (1)
    expect(isScheduledDay(monday, [1, 3, 5])).toBe(true);
  });

  it('returns false when day is not in scheduleDays', () => {
    const monday = new Date(2024, 0, 1); // Monday (1)
    expect(isScheduledDay(monday, [2, 4, 6])).toBe(false);
  });

  it('returns true for Sunday (0) when included', () => {
    const sunday = new Date(2024, 0, 7); // Jan 7, 2024 is Sunday (0)
    expect(isScheduledDay(sunday, [0, 6])).toBe(true);
  });
});

describe('calculateScheduleAwareStreak', () => {
  it('returns 0 for empty completion dates', () => {
    expect(calculateScheduleAwareStreak([1, 3, 5], [])).toBe(0);
  });

  it('returns 0 for empty schedule days', () => {
    expect(calculateScheduleAwareStreak([], ['2024-01-01'])).toBe(0);
  });

  it('counts consecutive daily completions', () => {
    const today = new Date(2024, 0, 5); // Friday Jan 5
    const completions = ['2024-01-05', '2024-01-04', '2024-01-03'];
    expect(calculateScheduleAwareStreak([0, 1, 2, 3, 4, 5, 6], completions, today)).toBe(3);
  });

  it('skips non-scheduled days without breaking streak', () => {
    // Schedule: Mon(1), Wed(3), Fri(5)
    // Today: Fri Jan 5, 2024
    // Completions: Fri Jan 5, Wed Jan 3, Mon Jan 1
    // Tue Jan 2 and Thu Jan 4 are skipped (not scheduled)
    const today = new Date(2024, 0, 5); // Friday
    const completions = ['2024-01-05', '2024-01-03', '2024-01-01'];
    expect(calculateScheduleAwareStreak([1, 3, 5], completions, today)).toBe(3);
  });

  it('breaks streak on missed scheduled day', () => {
    // Schedule: Mon(1), Wed(3), Fri(5)
    // Today: Fri Jan 5, 2024
    // Completions: Fri Jan 5 (missed Wed Jan 3)
    const today = new Date(2024, 0, 5); // Friday
    const completions = ['2024-01-05'];
    expect(calculateScheduleAwareStreak([1, 3, 5], completions, today)).toBe(1);
  });

  it('returns 0 when today is scheduled but not completed', () => {
    // Schedule: daily, today not completed
    const today = new Date(2024, 0, 5);
    const completions = ['2024-01-04', '2024-01-03'];
    expect(calculateScheduleAwareStreak([0, 1, 2, 3, 4, 5, 6], completions, today)).toBe(0);
  });

  it('handles weekly schedule correctly', () => {
    // Schedule: Monday only (1)
    // Today: Mon Jan 8, 2024
    // Completions: Jan 8 (Mon), Jan 1 (Mon)
    const today = new Date(2024, 0, 8); // Monday
    const completions = ['2024-01-08', '2024-01-01'];
    expect(calculateScheduleAwareStreak([1], completions, today)).toBe(2);
  });
});
