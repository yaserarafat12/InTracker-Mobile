// Schedule helper utilities for the Habit Schedule System

export type ScheduleType = 'daily' | 'weekly' | 'custom';

export interface ScheduleConfig {
  schedule_type: ScheduleType;
  schedule_days: number[];
}

/** Indonesian abbreviated day names indexed by day-of-week (0=Sunday). */
const DAY_NAMES_SHORT: Record<number, string> = {
  0: 'MIN',
  1: 'SEN',
  2: 'SEL',
  3: 'RAB',
  4: 'KAM',
  5: 'JUM',
  6: 'SAB',
};

/** Full Indonesian day names for weekly label display. */
const DAY_NAMES_FULL: Record<number, string> = {
  0: 'MINGGU',
  1: 'SENIN',
  2: 'SELASA',
  3: 'RABU',
  4: 'KAMIS',
  5: 'JUMAT',
  6: 'SABTU',
};

/**
 * Returns the default schedule config for habits without schedule data.
 * Defaults to daily with all 7 days active.
 */
export function getDefaultSchedule(): ScheduleConfig {
  return { schedule_type: 'daily', schedule_days: [0, 1, 2, 3, 4, 5, 6] };
}

/**
 * Validates that a schedule config is internally consistent.
 * - daily → days must be exactly [0,1,2,3,4,5,6]
 * - weekly → exactly 1 day, value in 0-6
 * - custom → 1 or more days, all values in 0-6
 */
export function isValidSchedule(config: ScheduleConfig): boolean {
  const { schedule_type, schedule_days } = config;

  if (!Array.isArray(schedule_days)) return false;

  switch (schedule_type) {
    case 'daily': {
      if (schedule_days.length !== 7) return false;
      const sorted = [...schedule_days].sort((a, b) => a - b);
      return sorted.every((day, i) => day === i);
    }
    case 'weekly': {
      if (schedule_days.length !== 1) return false;
      const day = schedule_days[0];
      return Number.isInteger(day) && day >= 0 && day <= 6;
    }
    case 'custom': {
      if (schedule_days.length < 1) return false;
      return schedule_days.every(
        (day) => Number.isInteger(day) && day >= 0 && day <= 6
      );
    }
    default:
      return false;
  }
}

/**
 * Returns the display label for a habit's schedule.
 * - daily → "HARIAN"
 * - weekly → full Indonesian day name uppercase (e.g., "SENIN")
 * - custom → comma-separated abbreviated day names (e.g., "SEN, RAB, JUM")
 */
export function getScheduleLabel(config: ScheduleConfig): string {
  const { schedule_type, schedule_days } = config;

  switch (schedule_type) {
    case 'daily':
      return 'HARIAN';
    case 'weekly':
      return DAY_NAMES_FULL[schedule_days[0]] ?? 'HARIAN';
    case 'custom': {
      // Sort days in week order (0-6) for consistent display
      const sorted = [...schedule_days].sort((a, b) => a - b);
      return sorted.map((day) => DAY_NAMES_SHORT[day] ?? '').join(', ');
    }
    default:
      return 'HARIAN';
  }
}

/**
 * Filters habits to only those scheduled for the given day of week (0-6).
 * Habits without schedule_days default to all days (always shown).
 */
export function filterHabitsByDay<
  T extends { schedule_days?: number[] | null }
>(habits: T[], dayOfWeek: number): T[] {
  return habits.filter((habit) => {
    const days = habit.schedule_days;
    // Habits without schedule_days default to all days
    if (!days || days.length === 0) return true;
    return days.includes(dayOfWeek);
  });
}

/**
 * Determines if a specific date is a scheduled day for a habit.
 * Returns true if the date's day-of-week is in scheduleDays.
 */
export function isScheduledDay(date: Date, scheduleDays: number[]): boolean {
  return scheduleDays.includes(date.getDay());
}

/**
 * Calculates streak considering only scheduled days.
 * Walks backward from today, skipping non-scheduled days,
 * counting consecutive scheduled days with completion logs.
 *
 * If today is scheduled but not yet completed, starts counting from yesterday
 * (shows the streak that will continue if user completes today).
 */
export function calculateScheduleAwareStreak(
  scheduleDays: number[],
  completionDates: string[],
  today?: Date
): number {
  if (scheduleDays.length === 0 || completionDates.length === 0) return 0;

  const completionSet = new Set(completionDates);
  const current = today ? new Date(today) : new Date();
  current.setHours(0, 0, 0, 0);

  const todayStr = formatDateStr(current);
  const todayIsScheduled = scheduleDays.includes(current.getDay());
  const todayIsCompleted = completionSet.has(todayStr);

  let streak = 0;
  // If today is completed, count it
  // If today is scheduled but NOT completed, start from yesterday (show "continuing" streak)
  const startOffset = (todayIsScheduled && todayIsCompleted) ? 0 : 1;

  for (let i = startOffset; i < 365; i++) {
    const checkDate = new Date(current);
    checkDate.setDate(current.getDate() - i);

    const dayOfWeek = checkDate.getDay();

    // Skip non-scheduled days
    if (!scheduleDays.includes(dayOfWeek)) continue;

    // This is a scheduled day — check if completed
    const dateStr = formatDateStr(checkDate);
    if (completionSet.has(dateStr)) {
      streak++;
    } else {
      break;
    }
  }

  // If today is completed, add it to the count
  if (todayIsScheduled && todayIsCompleted && startOffset === 0) {
    // Already counted in the loop
  }

  return streak;
}

/** Formats a Date to 'YYYY-MM-DD' string. */
function formatDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
