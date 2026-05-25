# Implementation Plan: RPG Stats & XP System

## Overview

This plan implements a persistent RPG progression system replacing the formula-based stats calculation. The implementation follows a bottom-up approach: pure engine modules first, then the Zustand store, then Supabase persistence, then integration with existing stores, and finally migration logic. Property-based tests validate correctness properties throughout.

## Tasks

- [ ] 1. Set up project structure, testing framework, and core types
  - [ ] 1.1 Install dev dependencies and configure Vitest
    - Add `vitest`, `fast-check`, and `@testing-library/react` to devDependencies
    - Create `vitest.config.ts` at project root with TypeScript support
    - Add `"test": "vitest --run"` script to `package.json`
    - Create `src/engines/` directory and `src/engines/__tests__/` directory
    - _Requirements: Design Testing Strategy_

  - [ ] 1.2 Define shared types and constants
    - Create `src/engines/types.ts` with `StatCategory`, `HabitStatsMap`, `XPAwardInput`, `XPAwardResult`, `StatAwardInput`, `StatAwardResult`, `LevelInfo` interfaces
    - Define all constants: `XP_VALUES`, `JOURNAL_XP`, `FEED_XP`, `TODO_XP`, `DAILY_XP_CAP`, `DAILY_FEED_XP_CAP`, `DAILY_JOURNAL_CAP`, `DAILY_STAT_CAP_PER_CATEGORY`, `MAX_LEVEL`
    - _Requirements: 1.4, 2.1, 3.1, 4.1, 5.2, 8.2_

- [ ] 2. Implement XP Engine
  - [ ] 2.1 Implement `calculateXPAward` function in `src/engines/xpEngine.ts`
    - Handle habit source: map difficulty (1→15, 2→25, 3→40), default undefined to difficulty 1
    - Handle journal source: award 30 XP if charCount >= 20, enforce 5 entries/day cap
    - Handle feed source: award 10 XP, enforce 200 XP/day feed sub-cap
    - Handle todo source: award 10 XP
    - Apply global daily XP cap of 1000 to all sources
    - Return `XPAwardResult` with capping flags
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.4, 3.5, 4.1, 4.2_

  - [ ]* 2.2 Write property test: Daily XP cap invariant (Property 1)
    - **Property 1: Daily XP cap invariant**
    - Generate arbitrary sequences of XP award operations from any source combination
    - Assert `dailyXPEarned` never exceeds 1000 after any operation
    - Assert `xpAwarded == min(baseXP, 1000 - dailyXPEarned)` for each operation
    - File: `src/engines/__tests__/xpEngine.property.test.ts`
    - **Validates: Requirements 1.2, 1.3, 2.2, 2.3, 3.2, 4.2, 10.3**

  - [ ]* 2.3 Write property test: XP award correctness (Property 2)
    - **Property 2: XP award correctness**
    - Generate arbitrary habits with valid/defaulted difficulty and arbitrary dailyXPEarned in [0, 1000]
    - Assert totalXP increases by exactly xpAwarded
    - Assert dailyXPEarned increases by exactly xpAwarded
    - Assert xpAwarded == min(XP_VALUES[difficulty], 1000 - dailyXPEarned)
    - File: `src/engines/__tests__/xpEngine.property.test.ts`
    - **Validates: Requirements 1.1, 1.5, 1.6**

  - [ ]* 2.4 Write property test: Journal XP character threshold (Property 8)
    - **Property 8: Journal XP character threshold**
    - Generate arbitrary character counts (0 to 10000)
    - Assert XP awarded is 30 (subject to cap) if and only if charCount >= 20
    - Assert zero XP for charCount < 20
    - File: `src/engines/__tests__/xpEngine.property.test.ts`
    - **Validates: Requirements 2.1**

  - [ ]* 2.5 Write property test: Journal entry count cap (Property 9)
    - **Property 9: Journal entry count cap**
    - Generate arbitrary dailyJournalCount values [0, 20]
    - Assert zero XP when dailyJournalCount >= 5
    - Assert normal XP award when dailyJournalCount < 5 (subject to daily XP cap)
    - File: `src/engines/__tests__/xpEngine.property.test.ts`
    - **Validates: Requirements 2.4**

  - [ ]* 2.6 Write property test: Feed XP sub-cap (Property 10)
    - **Property 10: Feed XP sub-cap**
    - Generate arbitrary dailyFeedXPEarned [0, 300] and dailyXPEarned [0, 1100]
    - Assert xpAwarded == min(10, 200 - dailyFeedXPEarned, 1000 - dailyXPEarned)
    - Assert dailyFeedXPEarned never exceeds 200
    - File: `src/engines/__tests__/xpEngine.property.test.ts`
    - **Validates: Requirements 3.5**

- [ ] 3. Implement Stats Engine
  - [ ] 3.1 Implement `getDefaultHabitStatsMap` function in `src/engines/statsEngine.ts`
    - Map "Latihan Fisik" → Kekuatan +2, Disiplin +1 (difficulty 3 adds Fokus +1)
    - Map "Ketenangan Diri" → Kebijaksanaan +2, Fokus +1 (difficulty 3 adds Kepercayaan Diri +1)
    - Map "Evolusi Diri" → Fokus +2, Kepercayaan Diri +1 (difficulty 3 adds Kebijaksanaan +1)
    - Map "Rutinitas" → Disiplin +2, Kepercayaan Diri +1 (difficulty 3 adds Kekuatan +1)
    - Return empty map for unknown categories
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [ ] 3.2 Implement `calculateStatAward` function in `src/engines/statsEngine.ts`
    - For habit source: award points per HabitStatsMap categories, respecting per-category daily cap of 10
    - For journal source: award Kebijaksanaan +1, Fokus +1, respecting per-category daily cap
    - Cap each category independently (one capped category doesn't block others)
    - Enforce max 4 total stat points per single habit completion
    - Return zero stat points if habitStatsMap is undefined or empty
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2_

  - [ ]* 3.3 Write property test: Per-category stat cap invariant (Property 3)
    - **Property 3: Per-category stat cap invariant**
    - Generate arbitrary sequences of stat award operations with random initial daily counters
    - Assert each category's daily counter never exceeds 10
    - Assert stat points awarded == min(mapPoints, 10 - dailyStatCounter[category])
    - File: `src/engines/__tests__/statsEngine.property.test.ts`
    - **Validates: Requirements 5.3, 5.4, 6.2, 10.4**

  - [ ]* 3.4 Write property test: Stat award matches map with max 4 points (Property 12)
    - **Property 12: Stat award matches map with max 4 points total**
    - Generate arbitrary valid HabitStatsMaps (2-3 categories, +1 or +2 each)
    - Assert points awarded only to categories in the map
    - Assert point values match map (subject to daily cap)
    - Assert total points per completion never exceeds 4
    - File: `src/engines/__tests__/statsEngine.property.test.ts`
    - **Validates: Requirements 5.1, 5.2, 5.5**

  - [ ]* 3.5 Write property test: No cumulative stat ceiling (Property 13)
    - **Property 13: No cumulative stat ceiling**
    - Generate arbitrary large cumulative stat values (up to 100,000)
    - Assert stat awards are determined solely by daily cap, not cumulative totals
    - Assert awards continue normally regardless of cumulative magnitude
    - File: `src/engines/__tests__/statsEngine.property.test.ts`
    - **Validates: Requirements 9.2**

- [ ] 4. Implement Level System
  - [ ] 4.1 Implement `calculateLevel` and `getXPThresholdForLevel` in `src/engines/levelSystem.ts`
    - Implement curve: `xpForLevel(n) = Math.floor(100 * (1.08 ^ (n - 1)))`
    - Implement cumulative threshold calculation
    - Return full `LevelInfo` object with progress arithmetic
    - Cap at MAX_LEVEL = 100
    - Validate: 45,000 XP → level 28-32 range
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 4.2 Write property test: Level curve monotonicity and correctness (Property 4)
    - **Property 4: Level curve monotonicity and correctness**
    - Generate arbitrary pairs of XP values (a, b) where a <= b
    - Assert calculateLevel(a).level <= calculateLevel(b).level
    - Generate arbitrary levels n in [1, 99]
    - Assert XP cost from n to n+1 > XP cost from n-1 to n
    - File: `src/engines/__tests__/levelSystem.property.test.ts`
    - **Validates: Requirements 8.1, 8.3, 8.5**

  - [ ]* 4.3 Write property test: Max level cap (Property 5)
    - **Property 5: Max level cap**
    - Generate arbitrarily large XP values (up to Number.MAX_SAFE_INTEGER)
    - Assert calculateLevel(totalXP).level never exceeds 100
    - File: `src/engines/__tests__/levelSystem.property.test.ts`
    - **Validates: Requirements 8.2, 8.6**

  - [ ]* 4.4 Write property test: Level progress arithmetic consistency (Property 6)
    - **Property 6: Level progress arithmetic consistency**
    - Generate arbitrary total XP values [0, 2,000,000]
    - Assert: xpIntoCurrentLevel + xpNeededForNext == totalXPForNextLevel - totalXPForCurrentLevel
    - Assert: totalXPForCurrentLevel + xpIntoCurrentLevel <= totalXP < totalXPForNextLevel (except max level)
    - File: `src/engines/__tests__/levelSystem.property.test.ts`
    - **Validates: Requirements 8.7**

- [ ] 5. Checkpoint - Core engines complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement useProgressionStore with daily reset and local persistence
  - [ ] 6.1 Create `src/store/useProgressionStore.ts` with Zustand persist middleware
    - Define full `ProgressionState` interface with all fields from design
    - Configure Zustand persist with localStorage adapter
    - Implement daily reset logic: compare current date vs `lastResetDate`, reset all daily counters when date differs
    - Implement `awardHabitCompletion` action: call XP_Engine + Stats_Engine + Level_System, update state atomically
    - Implement `awardJournalEntry` action: validate charCount >= 20, call engines, update state
    - Implement `awardFeedInteraction` action: call XP_Engine (no stats), update state
    - Implement `awardTodoCompletion` action: check `completedTodoIds` for dedup, call XP_Engine (no stats), update state
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 4.4, 10.1, 10.2, 10.3, 10.4, 10.5, 12.1, 12.2, 12.4_

  - [ ]* 6.2 Write property test: Daily reset correctness (Property 7)
    - **Property 7: Daily reset correctness**
    - Generate arbitrary progression states with lastResetDate differing from current date
    - Assert processing a reward resets dailyXPEarned to 0, all dailyStatCounters to 0, dailyFeedXPEarned to 0, dailyJournalCount to 0
    - Assert lastResetDate updates to current date before applying new award
    - File: `src/engines/__tests__/progression.property.test.ts`
    - **Validates: Requirements 10.1, 10.2, 10.5, 12.4**

  - [ ]* 6.3 Write property test: Todo deduplication (Property 11)
    - **Property 11: Todo deduplication**
    - Generate arbitrary sequences of todo completion events with duplicate todoIds
    - Assert XP awarded only for first occurrence of each unique todoId
    - Assert zero XP for subsequent completions of same todoId
    - File: `src/engines/__tests__/progression.property.test.ts`
    - **Validates: Requirements 4.4**

- [ ] 7. Implement Supabase persistence layer
  - [ ] 7.1 Create Supabase `user_stats` table migration
    - Write SQL migration file at `supabase/migrations/` with full table schema
    - Include all columns: cumulative progression, daily cap tracking, migration flag, metadata
    - Add RLS policies: users can SELECT, UPDATE, INSERT own row only
    - Add unique constraint on `user_id`
    - _Requirements: 11.1, 11.2_

  - [ ] 7.2 Implement batch sync with debounce in `useProgressionStore`
    - Add debounced sync function (10-second debounce, max 30-second delay)
    - Write all pending progression data to Supabase `user_stats` via upsert
    - Implement retry logic: up to 5 consecutive retries on failure
    - Reset retry counter on next reward event after exhausting retries
    - Track `pendingSync` and `syncRetryCount` in state
    - _Requirements: 11.3, 11.4, 11.5_

  - [ ] 7.3 Implement reconciliation logic
    - On app launch, fetch remote `user_stats` row
    - Apply higher-value-wins: `Math.max(local, remote)` for totalXP, level, and all 5 stat categories
    - If Supabase unreachable, continue with local data and retry on next sync
    - _Requirements: 12.3, 12.5_

  - [ ]* 7.4 Write property test: Higher-value-wins reconciliation (Property 14)
    - **Property 14: Higher-value-wins reconciliation**
    - Generate arbitrary pairs of local and remote state values
    - Assert reconciled state == Math.max(local, remote) for totalXP, level, and all 5 stat categories
    - File: `src/engines/__tests__/progression.property.test.ts`
    - **Validates: Requirements 12.3**

- [ ] 8. Checkpoint - Store and persistence complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Integrate with existing stores
  - [ ] 9.1 Integrate with `useHabitStore` for habit completion rewards
    - In `useHabitStore.toggleHabit`, when `completed = true`, call `useProgressionStore.getState().awardHabitCompletion(habit)`
    - Pass full habit object including category and difficulty
    - Ensure XP and stats are awarded for each independent completion (including multiple per day)
    - _Requirements: 1.1, 1.5, 5.1_

  - [ ] 9.2 Integrate with `useJourneyStore` for journal entry rewards
    - In `useJourneyStore.saveEntry`, after successful save, call `useProgressionStore.getState().awardJournalEntry(charCount)`
    - Pass the character count of the journal content
    - _Requirements: 2.1, 6.1_

  - [ ] 9.3 Integrate with `useSocialStore` for feed interaction rewards
    - In feed post creation and comment submission handlers, call `useProgressionStore.getState().awardFeedInteraction()`
    - Only trigger on new post/comment creation (not edits, deletions, or reactions)
    - _Requirements: 3.1, 3.4_

  - [ ] 9.4 Integrate with `useTargetStore` for to-do completion rewards
    - In `useTargetStore` when a to-do is marked complete, call `useProgressionStore.getState().awardTodoCompletion(todoId)`
    - Deduplication handled by the progression store via `completedTodoIds`
    - _Requirements: 4.1, 4.4_

- [ ] 10. Implement migration from formula-based stats
  - [ ] 10.1 Implement `runMigration` in `useProgressionStore`
    - Check if `user_stats` row exists for current user
    - If no row exists: calculate initial values from existing `habit_logs` and streak data using pre-migration formula
    - Write calculated values to `user_stats` with `migration_completed = true`
    - If calculation fails or data unavailable: initialize all values to zero, mark migration complete
    - If row exists with `migration_completed = true`: skip migration entirely
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ]* 10.2 Write unit tests for migration logic
    - Test migration calculates correct baseline from seeded habit_logs
    - Test migration skipped when migration_completed flag is set
    - Test migration initializes to zero on failure/missing data
    - Test migration writes to user_stats and sets flag
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 11. Checkpoint - Integration and migration complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Wire up app initialization and final integration
  - [ ] 12.1 Add progression store initialization to app startup
    - On app launch, call `reconcileWithRemote()` to sync with Supabase
    - Call `runMigration()` for first-time users
    - Ensure daily reset check runs before any reward processing
    - _Requirements: 12.3, 12.5, 13.1_

  - [ ] 12.2 Update StatsRPG view to consume useProgressionStore
    - Replace formula-based stat display with values from `useProgressionStore`
    - Display all 5 stat categories from persistent store
    - Display current level and XP progress bar (xpIntoCurrentLevel / xpNeededForNext)
    - _Requirements: 8.7, 12.1_

  - [ ]* 12.3 Write unit tests for integration and calibration
    - Test 45,000 XP → level 28-32 calibration
    - Test 90-day stat accumulation: 6 habits/day + 1 journal → 810-990 total stat points
    - Test average daily stat gain of 9-12 points for typical usage
    - Test batch sync fires within 30 seconds
    - Test retry logic with mocked Supabase failures
    - _Requirements: 8.4, 9.1, 9.3_

- [ ] 13. Final checkpoint - All features complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The pure engine modules (xpEngine, statsEngine, levelSystem) have no side effects and are fully testable in isolation
- Integration with existing stores uses `getState()` pattern to avoid circular dependencies
- Batch sync uses debounce (10s) with max delay (30s) to reduce Supabase write frequency

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "3.2", "4.2", "4.3", "4.4"] },
    { "id": 3, "tasks": ["3.3", "3.4", "3.5"] },
    { "id": 4, "tasks": ["6.1", "7.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "7.2"] },
    { "id": 6, "tasks": ["7.3", "7.4"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3", "9.4", "10.1"] },
    { "id": 8, "tasks": ["10.2", "12.1"] },
    { "id": 9, "tasks": ["12.2", "12.3"] }
  ]
}
```
