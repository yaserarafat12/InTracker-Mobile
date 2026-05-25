// ============================================================
// RPG Stats & XP System — Shared Types and Constants
// ============================================================

// --- Stat Categories ---
export type StatCategory =
  | 'kebijaksanaan'
  | 'kepercayaanDiri'
  | 'kekuatan'
  | 'disiplin'
  | 'fokus';

export const STAT_CATEGORIES: StatCategory[] = [
  'kebijaksanaan',
  'kepercayaanDiri',
  'kekuatan',
  'disiplin',
  'fokus',
];

// --- Habit Stats Map ---
export interface HabitStatEntry {
  category: StatCategory;
  points: 1 | 2;
}

export interface HabitStatsMap {
  categories: HabitStatEntry[];
}

// --- XP Engine Types ---
export type XPSource = 'habit' | 'journal' | 'feed' | 'todo';

export interface XPAwardInput {
  source: XPSource;
  // habit-specific
  difficulty?: number;
  // journal-specific
  charCount?: number;
  // daily state
  dailyXPEarned: number;
  dailyFeedXPEarned: number;
  dailyJournalCount: number;
}

export interface XPAwardResult {
  awarded: number;
  capped: boolean;
  feedCapped: boolean;
  journalCapped: boolean;
  newDailyXPTotal: number;
  newDailyFeedXPTotal: number;
  newDailyJournalCount: number;
}

// --- Stats Engine Types ---
export interface StatAwardInput {
  source: 'habit' | 'journal';
  habitStatsMap?: HabitStatsMap;
  dailyStatEarned: Record<StatCategory, number>;
}

export interface StatAwardResult {
  awards: Record<StatCategory, number>;
  capped: Record<StatCategory, boolean>;
  newDailyStatEarned: Record<StatCategory, number>;
}

// --- Level System Types ---
export interface LevelInfo {
  level: number;
  xpIntoCurrentLevel: number;  // XP earned within current level
  xpNeededForNext: number;     // XP needed to reach next level
  totalXPForCurrentLevel: number; // cumulative XP threshold for current level
  totalXPForNextLevel: number;    // cumulative XP threshold for next level
  progress: number;               // 0-1 fraction toward next level
}

// --- XP Constants ---
export const XP_VALUES: Record<1 | 2 | 3, number> = {
  1: 15,
  2: 25,
  3: 40,
};

export const JOURNAL_XP = 30;
export const FEED_XP = 10;
export const TODO_XP = 10;

export const DAILY_XP_CAP = 1000;
export const DAILY_FEED_XP_CAP = 200;
export const DAILY_JOURNAL_CAP = 5;
export const JOURNAL_MIN_CHARS = 20;

// --- Stats Constants ---
export const DAILY_STAT_CAP_PER_CATEGORY = 10;

// --- Level Constants ---
export const MAX_LEVEL = 100;
export const LEVEL_BASE_XP = 100;
export const LEVEL_SCALING_FACTOR = 1.08;

// --- Default empty daily stat record ---
export function makeEmptyDailyStats(): Record<StatCategory, number> {
  return {
    kebijaksanaan: 0,
    kepercayaanDiri: 0,
    kekuatan: 0,
    disiplin: 0,
    fokus: 0,
  };
}

// --- Default empty cumulative stats record ---
export function makeEmptyStats(): Record<StatCategory, number> {
  return {
    kebijaksanaan: 0,
    kepercayaanDiri: 0,
    kekuatan: 0,
    disiplin: 0,
    fokus: 0,
  };
}
