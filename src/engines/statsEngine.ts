// ============================================================
// RPG Stats & XP System — Stats Engine
// Pure functions for stat point calculation and cap enforcement.
// ============================================================

import {
  type StatCategory,
  type HabitStatsMap,
  type StatAwardInput,
  type StatAwardResult,
  DAILY_STAT_CAP_PER_CATEGORY,
  makeEmptyDailyStats,
} from './types';

/**
 * Returns the default HabitStatsMap for a given habit category and difficulty.
 *
 * Mapping:
 *   Latihan Fisik:   kekuatan+1, disiplin+1 (diff3: +fokus+1)
 *   Ketenangan Diri: kebijaksanaan+1, fokus+1 (diff3: +kepercayaanDiri+1)
 *   Evolusi Diri:    fokus+1, kepercayaanDiri+1 (diff3: +kebijaksanaan+1)
 *   Rutinitas:       disiplin+1, kepercayaanDiri+1 (diff3: +kekuatan+1)
 *
 * Returns empty map for unknown categories.
 */
export function getDefaultHabitStatsMap(habitCategory: string, difficulty: number): HabitStatsMap {
  const cat = habitCategory?.trim();

  switch (cat) {
    case 'Latihan Fisik': {
      const base: HabitStatsMap = {
        categories: [
          { category: 'kekuatan', points: 1 },
          { category: 'disiplin', points: 1 },
        ],
      };
      if (difficulty === 3) {
        base.categories.push({ category: 'fokus', points: 1 });
      }
      return base;
    }

    case 'Ketenangan Diri': {
      const base: HabitStatsMap = {
        categories: [
          { category: 'kebijaksanaan', points: 1 },
          { category: 'fokus', points: 1 },
        ],
      };
      if (difficulty === 3) {
        base.categories.push({ category: 'kepercayaanDiri', points: 1 });
      }
      return base;
    }

    case 'Evolusi Diri': {
      const base: HabitStatsMap = {
        categories: [
          { category: 'fokus', points: 1 },
          { category: 'kepercayaanDiri', points: 1 },
        ],
      };
      if (difficulty === 3) {
        base.categories.push({ category: 'kebijaksanaan', points: 1 });
      }
      return base;
    }

    case 'Rutinitas': {
      const base: HabitStatsMap = {
        categories: [
          { category: 'disiplin', points: 1 },
          { category: 'kepercayaanDiri', points: 1 },
        ],
      };
      if (difficulty === 3) {
        base.categories.push({ category: 'kekuatan', points: 1 });
      }
      return base;
    }

    default:
      return { categories: [] };
  }
}

/**
 * Returns the fixed stats map for journal entries.
 * Always: kebijaksanaan+1, fokus+1
 */
export function getJournalStatsMap(): HabitStatsMap {
  return {
    categories: [
      { category: 'kebijaksanaan', points: 1 },
      { category: 'fokus', points: 1 },
    ],
  };
}

/**
 * Apply per-category stat caps to a HabitStatsMap.
 * Each category is capped independently at DAILY_STAT_CAP_PER_CATEGORY (10).
 * Returns actual points awarded per category and updated daily counters.
 */
export function applyStatCaps(
  statsMap: HabitStatsMap,
  dailyStatEarned: Record<StatCategory, number>,
  categoryCap: number = DAILY_STAT_CAP_PER_CATEGORY,
): StatAwardResult {
  const awards: Record<StatCategory, number> = {
    kebijaksanaan: 0,
    kepercayaanDiri: 0,
    kekuatan: 0,
    disiplin: 0,
    fokus: 0,
  };
  const capped: Record<StatCategory, boolean> = {
    kebijaksanaan: false,
    kepercayaanDiri: false,
    kekuatan: false,
    disiplin: false,
    fokus: false,
  };
  const newDailyStatEarned = { ...dailyStatEarned };

  for (const entry of statsMap.categories) {
    const { category, points } = entry;
    const currentDaily = dailyStatEarned[category] ?? 0;

    // Validate daily stat counter range
    if (currentDaily < 0 || currentDaily > categoryCap) {
      // Corrupted state — skip this category
      capped[category] = true;
      continue;
    }

    const remaining = Math.max(0, categoryCap - currentDaily);
    const awarded = Math.min(points, remaining);
    awards[category] = awarded;
    capped[category] = awarded < points;
    newDailyStatEarned[category] = currentDaily + awarded;
  }

  return { awards, capped, newDailyStatEarned };
}

/**
 * Main stat award function.
 * Handles habit and journal sources.
 * Returns zero awards if habitStatsMap is undefined or empty.
 */
export function calculateStatAward(input: StatAwardInput): StatAwardResult {
  const { source, habitStatsMap, dailyStatEarned } = input;

  let statsMap: HabitStatsMap;

  if (source === 'journal') {
    statsMap = getJournalStatsMap();
  } else if (!habitStatsMap || habitStatsMap.categories.length === 0) {
    // No map defined — award zero stats
    return {
      awards: makeEmptyDailyStats(),
      capped: {
        kebijaksanaan: false,
        kepercayaanDiri: false,
        kekuatan: false,
        disiplin: false,
        fokus: false,
      },
      newDailyStatEarned: { ...dailyStatEarned },
    };
  } else {
    statsMap = habitStatsMap;
  }

  return applyStatCaps(statsMap, dailyStatEarned);
}
