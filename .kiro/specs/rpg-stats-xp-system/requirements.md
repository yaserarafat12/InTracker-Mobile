# Requirements Document

## Introduction

This feature replaces the current formula-based stats calculation in InTracker Mobile with a persistent RPG progression system. Users earn XP and stat points through habit completions, journaling, feed interactions, and to-do completions. The system includes a level progression curve (max level 100), daily caps for anti-abuse, and persistent storage via Supabase with local-first state management through Zustand.

## Glossary

- **XP_Engine**: The module responsible for calculating, awarding, and capping experience points from all reward sources
- **Stats_Engine**: The module responsible for calculating, awarding, and capping stat point gains across the five stat categories
- **Level_System**: The module responsible for determining user level from total accumulated XP using a progressive curve
- **Stat_Category**: One of the five RPG stat dimensions: Kebijaksanaan (Wisdom), Kepercayaan Diri (Confidence), Kekuatan (Strength), Disiplin (Discipline), Fokus (Focus)
- **Habit_Stats_Map**: The configuration that defines which 2-3 stat categories a habit rewards and the point values (+1 or +2) for each
- **Daily_Cap**: The maximum amount of XP or stat points a user can earn in a single calendar day
- **User_Stats_Row**: A single Supabase database row per user storing all persistent progression data (total XP, level, stat values, daily cap tracking)
- **Local_State**: The Zustand persisted store that holds progression data locally for instant UI updates
- **Batch_Sync**: The process of writing accumulated local state changes to Supabase in batched operations
- **Reward_Source**: An activity that grants XP and/or stats (habit completion, journaling, feed interaction, to-do completion)

## Requirements

### Requirement 1: XP Award on Habit Completion

**User Story:** As a user, I want to earn XP every time I complete a habit, so that I feel rewarded for my consistency.

#### Acceptance Criteria

1. WHEN a habit is marked as completed, THE XP_Engine SHALL award XP to the user and add the awarded amount to both the user's total accumulated XP and the current day's XP counter
2. IF a habit completion would cause the user's daily XP total to exceed 1000, THEN THE XP_Engine SHALL award only the remaining XP needed to reach the 1000 daily cap
3. IF the user has already earned 1000 XP for the current day, THEN THE XP_Engine SHALL award zero XP for additional habit completions
4. THE XP_Engine SHALL award XP values based on habit difficulty: difficulty 1 awards 15 XP, difficulty 2 awards 25 XP, difficulty 3 awards 40 XP
5. WHEN the same habit is marked as completed more than once in a single calendar day, THE XP_Engine SHALL award XP for each completion independently, subject to the daily cap of 1000 XP
6. IF a habit has no assigned difficulty level, THEN THE XP_Engine SHALL treat it as difficulty 1 and award 15 XP

### Requirement 2: XP Award on Journaling

**User Story:** As a user, I want to earn XP when I write a journal entry, so that reflective activities are also rewarded.

#### Acceptance Criteria

1. WHEN a user submits a journal entry containing at least 20 characters of content, THE XP_Engine SHALL award 30 XP to the user; IF the journal entry contains fewer than 20 characters, THEN THE XP_Engine SHALL reject the entry and award zero XP regardless of daily cap status (validation occurs before cap logic)
2. IF the journal XP award would cause the user's daily XP total to exceed the daily cap of 1000, THEN THE XP_Engine SHALL award only the remaining XP up to the cap
3. IF the user has already earned 1000 XP for the current day, THEN THE XP_Engine SHALL award zero XP for the journal entry submission
4. THE XP_Engine SHALL award journal XP for a maximum of 5 journal entries per calendar day

### Requirement 3: XP Award on Feed Interaction

**User Story:** As a user, I want to earn XP when I interact with the global feed, so that community engagement is rewarded.

#### Acceptance Criteria

1. WHEN a user creates a new post or submits a new comment on the global feed, THE XP_Engine SHALL award 10 XP per interaction
2. IF the feed XP award would cause the user's daily XP total to exceed the daily XP cap of 1000, THEN THE XP_Engine SHALL award only the remaining XP up to the cap
3. THE XP_Engine SHALL award feed interaction XP without any stat point gains
4. THE XP_Engine SHALL count only new post creation and new comment submission as XP-eligible feed interactions, excluding edits, deletions, and reactions
5. THE XP_Engine SHALL limit feed interaction XP to a maximum of 200 XP per calendar day (20 interactions), independent of the global daily XP cap of 1000; IF a feed interaction would cause the feed-specific daily total to reach or exceed 200 XP, THEN THE XP_Engine SHALL still award the full 10 XP for that interaction (allowing partial overshoot above 200)

### Requirement 4: XP Award on To-Do Completion

**User Story:** As a user, I want to earn XP when I complete to-do items, so that task management is also part of my progression.

#### Acceptance Criteria

1. WHEN a user marks a to-do item as completed for the first time, THE XP_Engine SHALL award 10 XP to the user
2. IF the to-do XP award would cause the user's daily XP total to exceed the daily XP cap of 1000, THEN THE XP_Engine SHALL award only the remaining XP up to the cap
3. THE XP_Engine SHALL award to-do completion XP without any stat point gains
4. IF a user uncompletes and re-completes the same to-do item, THEN THE XP_Engine SHALL NOT award additional XP for that item

### Requirement 5: Stat Points Award on Habit Completion

**User Story:** As a user, I want my habits to increase specific RPG stats, so that my character grows in ways that reflect my real-life activities.

#### Acceptance Criteria

1. WHEN a habit is marked as completed, THE Stats_Engine SHALL award stat points to the 2 or 3 Stat_Categories defined in the habit's Habit_Stats_Map, awarding each category independently
2. THE Stats_Engine SHALL award either +1 or +2 points per Stat_Category per habit completion, as defined in the Habit_Stats_Map, with a maximum total of 4 stat points awarded across all categories per single completion
3. WHEN a stat award would cause a Stat_Category's daily total to exceed 10, THE Stats_Engine SHALL award only the remaining points up to the daily cap of 10 for that category while still awarding full points to other uncapped categories in the same completion
4. WHEN a Stat_Category has already received 10 points for the current day, THE Stats_Engine SHALL award zero points to that category for additional completions
5. IF a habit's Habit_Stats_Map is not defined or contains zero Stat_Categories, THEN THE Stats_Engine SHALL award zero stat points for that habit completion

### Requirement 6: Stat Points Award on Journaling

**User Story:** As a user, I want journaling to also improve my RPG stats, so that reflective practice contributes to character growth.

#### Acceptance Criteria

1. WHEN a user submits a journal entry, THE Stats_Engine SHALL award exactly +1 to Kebijaksanaan and exactly +1 to Fokus (fixed amounts, not variable)
2. WHEN the journaling stat award would exceed the daily cap of 10 for a Stat_Category, THE Stats_Engine SHALL award only the remaining points up to the cap (e.g., if Fokus is at 10, award 0 to Fokus while still awarding +1 to Kebijaksanaan if uncapped)

### Requirement 7: Habit-to-Stats Mapping Configuration

**User Story:** As a user, I want each habit to map to stats that make logical sense, so that my character progression feels meaningful.

#### Acceptance Criteria

1. THE Stats_Engine SHALL map habits in the "Latihan Fisik" category to Kekuatan (+2) and Disiplin (+1) as the default Habit_Stats_Map for that category
2. THE Stats_Engine SHALL map habits in the "Ketenangan Diri" category to Kebijaksanaan (+2) and Fokus (+1) as the default Habit_Stats_Map for that category
3. THE Stats_Engine SHALL map habits in the "Evolusi Diri" category to Fokus (+2) and Kepercayaan Diri (+1) as the default Habit_Stats_Map for that category
4. THE Stats_Engine SHALL map habits in the "Rutinitas" category to Disiplin (+2) and Kepercayaan Diri (+1) as the default Habit_Stats_Map for that category
5. THE Stats_Engine SHALL assign each habit exactly 2 or 3 Stat_Categories with point values of +1 or +2 each, where the total stat points awarded per single habit completion does not exceed 4 points across all categories
6. IF a habit has a difficulty of 3, THEN THE Stats_Engine SHALL assign 3 Stat_Categories in its Habit_Stats_Map with a distribution of +2, +1, +1
7. IF a habit has a difficulty of 1 or 2, THEN THE Stats_Engine SHALL assign 2 Stat_Categories in its Habit_Stats_Map with a distribution of +2, +1
8. IF a user creates a custom habit and selects a category, THEN THE Stats_Engine SHALL apply the default Habit_Stats_Map for that category to the custom habit

### Requirement 8: Level Progression System

**User Story:** As a user, I want to level up as I earn XP, so that I have a clear sense of long-term progression.

#### Acceptance Criteria

1. THE Level_System SHALL calculate user level from total accumulated XP using a progressive curve where each level requires more XP than the previous level, with the XP increment between levels increasing by a fixed scaling factor
2. THE Level_System SHALL set the maximum achievable level to 100
3. THE Level_System SHALL use a curve where level 1 requires 100 XP, level 2 requires a cumulative total greater than level 1, and the XP required to advance from level N to level N+1 is greater than the XP required to advance from level N-1 to level N for all levels
4. THE Level_System SHALL ensure a consistent daily player (earning 500 XP/day) reaches between level 28 and level 32 by day 90 (45,000 total XP)
5. WHEN a user's total XP crosses one or more level thresholds, THE Level_System SHALL update the user's level to the highest level whose cumulative XP threshold has been met, within the same state update cycle in Local_State
6. IF a user's total XP equals or exceeds the cumulative XP threshold for level 100, THEN THE Level_System SHALL keep the user's level at 100 and continue accumulating XP without further level increases; THE Level_System SHALL validate that the calculated level is consistent with total XP and force corrections when inconsistencies are detected (e.g., if a user has sufficient XP for level 50 but is stored at level 30, the system SHALL correct to level 50)
7. THE Level_System SHALL expose the XP required for the next level and the user's progress toward it (current XP minus current level threshold) so that the UI can display level progress

### Requirement 9: Day 90 Stat Progression Target

**User Story:** As a user, I want to feel meaningful stat growth over 90 days of consistent use, so that the system feels rewarding without being too easy.

#### Acceptance Criteria

1. THE Stats_Engine SHALL be calibrated so that a consistent user (completing 6 habits daily plus one journal entry) accumulates between 810 and 990 total stat points across all five Stat_Categories by day 90
2. THE Stats_Engine SHALL impose no hard cap on cumulative stat point totals, allowing users who maintain 5-7 daily habit completions plus journaling beyond day 90 to exceed 1000 total stat points
3. THE Stats_Engine SHALL produce an average daily stat gain of 9 to 12 total points across all categories for a user completing 6 habits (each awarding 2 Stat_Categories) plus one journal entry per day

### Requirement 10: Daily Cap Reset

**User Story:** As a user, I want my daily caps to reset each new day, so that I can earn rewards fresh every day.

#### Acceptance Criteria

1. WHEN the device's current local date differs from the stored last-reset date at the time any Reward_Source event is processed, THE XP_Engine SHALL reset the daily XP counter to zero before processing the new reward
2. WHEN the device's current local date differs from the stored last-reset date at the time any Reward_Source event is processed, THE Stats_Engine SHALL reset all five per-category daily stat counters to zero before processing the new reward
3. THE XP_Engine SHALL track the current day's earned XP in Local_State as an integer value between 0 and 1000; IF a counter value is detected outside the range 0–1000 due to a bug or data corruption, THEN THE XP_Engine SHALL reject the invalid state and prevent any further XP operations until the counter is corrected
4. THE Stats_Engine SHALL track each Stat_Category's daily earned points in Local_State as an integer value between 0 and 10 per category; IF a stat counter value is detected outside the range 0–10 due to a bug or data corruption, THEN THE Stats_Engine SHALL reject the invalid state and prevent any further stat operations for that category until the counter is corrected
5. WHEN the daily cap counters are reset, THE Local_State SHALL update the stored last-reset date to the current device local date

### Requirement 11: Persistent Storage in Supabase

**User Story:** As a user, I want my progression data saved to the cloud, so that I never lose my progress.

#### Acceptance Criteria

1. THE User_Stats_Row SHALL store total XP, current level, and all five Stat_Category cumulative values in a single row per user in the user_stats table
2. THE User_Stats_Row SHALL store daily cap tracking fields (daily XP earned, per-category daily stats earned, last reset date)
3. WHEN a Reward_Source event updates Local_State, THE Batch_Sync SHALL write all pending progression data to Supabase within 30 seconds of the most recent change
4. IF a Batch_Sync operation fails, THEN THE Local_State SHALL retain the pending changes and retry on the next Batch_Sync trigger, up to a maximum of 5 consecutive retry attempts before requiring a new Reward_Source event to re-initiate sync; WHEN the retry count reaches 5 or more (inclusive boundary), THEN THE system SHALL stop automatic retries and wait for the next Reward_Source event
5. IF all 5 retry attempts for a Batch_Sync operation fail, THEN THE Local_State SHALL continue to retain the pending changes and resume sync attempts when the next Reward_Source event occurs

### Requirement 12: Local-First State Management

**User Story:** As a user, I want instant UI feedback when I earn XP or stats, so that the app feels responsive.

#### Acceptance Criteria

1. WHEN a Reward_Source event occurs, THE Local_State SHALL update XP and stat values within 100ms without waiting for Supabase confirmation
2. THE Local_State SHALL persist progression data using Zustand persist middleware so that data survives app restarts
3. WHEN the app launches and Supabase is reachable, THE Local_State SHALL reconcile with the User_Stats_Row by taking the higher value for each field (total XP, current level, and each of the five Stat_Category cumulative values)
4. IF the local device date differs from the stored last reset date, THEN THE Local_State SHALL reset daily cap counters before processing new rewards
5. IF Supabase is unreachable during app launch reconciliation, THEN THE Local_State SHALL continue using persisted local data and retry reconciliation on the next Batch_Sync opportunity

### Requirement 13: Migration from Formula-Based Stats

**User Story:** As a user, I want my existing progress to be preserved when the system migrates to persistent stats, so that I do not lose my current standing.

#### Acceptance Criteria

1. WHEN a user loads the app and no User_Stats_Row exists for that user, THE Stats_Engine SHALL calculate initial values for all five Stat_Categories, total XP, and current level from existing habit_logs and streak data using the pre-migration formula
2. WHEN the Stats_Engine has calculated initial migration values, THE Stats_Engine SHALL write the calculated values to the User_Stats_Row as the baseline and mark the migration as complete by setting a migration_completed flag in the User_Stats_Row
3. WHEN the User_Stats_Row exists with the migration_completed flag set, THE Stats_Engine SHALL use only the persistent stored values for all future stat displays and SHALL NOT re-run the migration calculation
4. IF the migration calculation fails or habit_logs data is unavailable, THEN THE Stats_Engine SHALL initialize all stat values, total XP, and level to zero in the User_Stats_Row and mark migration as complete
