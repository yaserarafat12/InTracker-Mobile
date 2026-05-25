// ============================================================
// RPG Stats & XP System — Level System
// Pure functions for level calculation from total XP.
// ============================================================

import {
  type LevelInfo,
  MAX_LEVEL,
  LEVEL_BASE_XP,
  LEVEL_SCALING_FACTOR,
} from './types';

/**
 * XP required to advance FROM level n TO level n+1.
 * Formula: Math.floor(100 * (1.08 ^ (n - 1)))
 * Level 1 → 2 costs 100 XP
 * Level 2 → 3 costs floor(100 * 1.08) = 108 XP
 * etc.
 */
export function xpForLevel(n: number): number {
  return Math.floor(LEVEL_BASE_XP * Math.pow(LEVEL_SCALING_FACTOR, n - 1));
}

/**
 * Cumulative XP threshold to REACH level n (i.e., total XP needed to be at level n).
 * Level 1 threshold = 0 (you start at level 1 with 0 XP)
 * Level 2 threshold = xpForLevel(1) = 100
 * Level 3 threshold = xpForLevel(1) + xpForLevel(2) = 100 + 108 = 208
 */
export function getXPThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let n = 1; n < level; n++) {
    total += xpForLevel(n);
  }
  return total;
}

/**
 * Calculate the user's current level from total accumulated XP.
 * Caps at MAX_LEVEL (100).
 * Level 1 starts at 0 XP.
 */
export function calculateLevel(totalXP: number): number {
  if (totalXP < 0) return 1;

  let level = 1;
  let cumulativeXP = 0;

  while (level < MAX_LEVEL) {
    const cost = xpForLevel(level);
    if (cumulativeXP + cost > totalXP) break;
    cumulativeXP += cost;
    level++;
  }

  return level;
}

/**
 * Get full LevelInfo for a given total XP.
 * Includes progress arithmetic for UI display.
 */
export function getLevelInfo(totalXP: number): LevelInfo {
  const safeXP = Math.max(0, totalXP);
  const level = calculateLevel(safeXP);

  const totalXPForCurrentLevel = getXPThresholdForLevel(level);

  let totalXPForNextLevel: number;
  let xpNeededForNext: number;

  if (level >= MAX_LEVEL) {
    // At max level — no next level
    totalXPForNextLevel = totalXPForCurrentLevel;
    xpNeededForNext = 0;
  } else {
    xpNeededForNext = xpForLevel(level);
    totalXPForNextLevel = totalXPForCurrentLevel + xpNeededForNext;
  }

  const xpIntoCurrentLevel = safeXP - totalXPForCurrentLevel;

  let progress: number;
  if (level >= MAX_LEVEL || xpNeededForNext === 0) {
    progress = 1;
  } else {
    progress = Math.min(1, Math.max(0, xpIntoCurrentLevel / xpNeededForNext));
  }

  return {
    level,
    xpIntoCurrentLevel,
    xpNeededForNext,
    totalXPForCurrentLevel,
    totalXPForNextLevel,
    progress,
  };
}

/**
 * Validate level consistency: if stored level doesn't match XP, correct it.
 * Returns the correct level for the given totalXP.
 */
export function validateLevelConsistency(totalXP: number, _storedLevel: number): number {
  return calculateLevel(totalXP);
}
