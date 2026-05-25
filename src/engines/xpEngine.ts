// ============================================================
// RPG Stats & XP System — XP Engine
// Pure functions for XP calculation and cap enforcement.
// ============================================================

import {
  type XPAwardInput,
  type XPAwardResult,
  XP_VALUES,
  JOURNAL_XP,
  FEED_XP,
  TODO_XP,
  DAILY_XP_CAP,
  DAILY_FEED_XP_CAP,
  DAILY_JOURNAL_CAP,
  JOURNAL_MIN_CHARS,
} from './types';

/**
 * Calculate the base XP for a habit based on difficulty.
 * Defaults to difficulty 1 (15 XP) for undefined/invalid difficulty.
 */
export function calculateHabitXP(difficulty?: number): number {
  if (difficulty === 2) return XP_VALUES[2];
  if (difficulty === 3) return XP_VALUES[3];
  return XP_VALUES[1]; // default: difficulty 1
}

/**
 * Calculate base XP for a journal entry.
 * Returns 0 if charCount < 20 (validation before cap logic).
 * Returns 0 if dailyJournalCount >= 5.
 */
export function calculateJournalXP(charCount: number, dailyJournalCount: number): number {
  if (charCount < JOURNAL_MIN_CHARS) return 0;
  if (dailyJournalCount >= DAILY_JOURNAL_CAP) return 0;
  return JOURNAL_XP;
}

/**
 * Calculate base XP for a feed interaction.
 * Returns 0 if dailyFeedXPEarned >= 200.
 */
export function calculateFeedXP(dailyFeedXPEarned: number): number {
  if (dailyFeedXPEarned >= DAILY_FEED_XP_CAP) return 0;
  return FEED_XP;
}

/**
 * Calculate base XP for a todo completion.
 */
export function calculateTodoXP(): number {
  return TODO_XP;
}

/**
 * Apply the global daily XP cap.
 * Returns the actual XP to award (clamped to remaining cap).
 */
export function applyDailyCap(
  baseXP: number,
  dailyXPEarned: number,
): { awarded: number; capped: boolean } {
  const remaining = Math.max(0, DAILY_XP_CAP - dailyXPEarned);
  const awarded = Math.min(baseXP, remaining);
  return { awarded, capped: awarded < baseXP };
}

/**
 * Main XP award function.
 * Handles all sources: habit, journal, feed, todo.
 * Applies all caps and returns full result.
 */
export function calculateXPAward(input: XPAwardInput): XPAwardResult {
  const {
    source,
    difficulty,
    charCount = 0,
    dailyXPEarned,
    dailyFeedXPEarned,
    dailyJournalCount,
  } = input;

  // Validate daily state ranges — reject corrupted state
  if (dailyXPEarned < 0 || dailyXPEarned > DAILY_XP_CAP) {
    return {
      awarded: 0,
      capped: true,
      feedCapped: false,
      journalCapped: false,
      newDailyXPTotal: dailyXPEarned,
      newDailyFeedXPTotal: dailyFeedXPEarned,
      newDailyJournalCount: dailyJournalCount,
    };
  }

  let baseXP = 0;
  let feedCapped = false;
  let journalCapped = false;
  let newDailyFeedXPTotal = dailyFeedXPEarned;
  let newDailyJournalCount = dailyJournalCount;

  switch (source) {
    case 'habit': {
      baseXP = calculateHabitXP(difficulty);
      break;
    }

    case 'journal': {
      // Validation: charCount < 20 → 0 XP regardless of caps
      if (charCount < JOURNAL_MIN_CHARS) {
        return {
          awarded: 0,
          capped: false,
          feedCapped: false,
          journalCapped: false,
          newDailyXPTotal: dailyXPEarned,
          newDailyFeedXPTotal: dailyFeedXPEarned,
          newDailyJournalCount: dailyJournalCount,
        };
      }
      // Journal count cap
      if (dailyJournalCount >= DAILY_JOURNAL_CAP) {
        journalCapped = true;
        return {
          awarded: 0,
          capped: false,
          feedCapped: false,
          journalCapped: true,
          newDailyXPTotal: dailyXPEarned,
          newDailyFeedXPTotal: dailyFeedXPEarned,
          newDailyJournalCount: dailyJournalCount,
        };
      }
      baseXP = JOURNAL_XP;
      newDailyJournalCount = dailyJournalCount + 1;
      break;
    }

    case 'feed': {
      // Feed sub-cap: if already at or above 200, award 0
      if (dailyFeedXPEarned >= DAILY_FEED_XP_CAP) {
        feedCapped = true;
        return {
          awarded: 0,
          capped: false,
          feedCapped: true,
          journalCapped: false,
          newDailyXPTotal: dailyXPEarned,
          newDailyFeedXPTotal: dailyFeedXPEarned,
          newDailyJournalCount: dailyJournalCount,
        };
      }
      baseXP = FEED_XP;
      break;
    }

    case 'todo': {
      baseXP = TODO_XP;
      break;
    }
  }

  // Apply global daily XP cap
  const { awarded, capped } = applyDailyCap(baseXP, dailyXPEarned);

  // Update feed daily total if feed source
  if (source === 'feed' && awarded > 0) {
    newDailyFeedXPTotal = dailyFeedXPEarned + awarded;
  }

  return {
    awarded,
    capped,
    feedCapped,
    journalCapped,
    newDailyXPTotal: dailyXPEarned + awarded,
    newDailyFeedXPTotal,
    newDailyJournalCount,
  };
}
