# Implementation Plan: Habit Schedule System

## Overview

Implement a schedule system for habits that introduces three schedule types (daily, weekly, custom), filters habit visibility by day, adds a Schedule Editor bottom sheet, adjusts streak calculation to be schedule-aware, and updates the analytics grid to reflect scheduled days. All changes are backward-compatible with existing habits defaulting to daily.

## Tasks

- [x] 1. Database migration and schedule utility helpers
  - [x] 1.1 Create Supabase migration for schedule columns
    - Create `supabase/migrations/add_schedule_columns.sql`
    - Add `schedule_type TEXT NOT NULL DEFAULT 'daily'` with CHECK constraint (`daily`, `weekly`, `custom`)
    - Add `schedule_days INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}'`
    - Update existing rows to ensure defaults are populated
    - _Requirements: 1.1, 1.2, 1.6, 7.3_

  - [x] 1.2 Create schedule helper utilities
    - Create `src/utils/scheduleHelpers.ts`
    - Implement `ScheduleType` type and `ScheduleConfig` interface
    - Implement `getDefaultSchedule()` returning `{ schedule_type: 'daily', schedule_days: [0,1,2,3,4,5,6] }`
    - Implement `isValidSchedule(config)` that validates consistency between schedule_type and schedule_days
    - Implement `getScheduleLabel(config)` returning "HARIAN", abbreviated day name, or comma-separated day names
    - Implement `filterHabitsByDay(habits, dayOfWeek)` filtering habits by schedule_days inclusion
    - Implement `isScheduledDay(date, scheduleDays)` checking if a date's day-of-week is in scheduleDays
    - Implement `calculateScheduleAwareStreak(scheduleDays, completionDates, today?)` walking backward from today, skipping non-scheduled days, counting consecutive completions
    - _Requirements: 1.3, 1.4, 1.5, 3.1, 3.2, 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 1.3 Write property tests for schedule helpers (Property 1: Schedule Data Model Consistency)
    - **Property 1: Schedule Data Model Consistency**
    - Generate random schedule configs and validate: daily → days=[0..6], weekly → exactly 1 day in 0-6, custom → 1+ days all in 0-6
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

  - [ ]* 1.4 Write property tests for default schedule (Property 2: Default Schedule Application)
    - **Property 2: Default Schedule Application**
    - Generate habits with missing/null schedule fields, verify `getDefaultSchedule()` produces daily + [0..6]
    - **Validates: Requirements 1.6, 7.1**

  - [ ]* 1.5 Write property tests for filtering (Property 3: Day-Based Filtering Correctness)
    - **Property 3: Day-Based Filtering Correctness**
    - Generate random habit lists with various schedule_days + random day (0-6), verify filterHabitsByDay returns exactly habits containing that day
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 1.6 Write property tests for schedule labels (Property 4: Schedule Label Formatting)
    - **Property 4: Schedule Label Formatting**
    - Generate all valid schedule configs, verify getScheduleLabel returns correct Indonesian abbreviated day names
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ]* 1.7 Write property tests for streak calculation (Property 6: Schedule-Aware Streak Calculation)
    - **Property 6: Schedule-Aware Streak Calculation**
    - Generate random schedule_days + random completion dates, verify streak equals consecutive scheduled days with completions walking backward from today
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Update HabitItem interface and store logic
  - [x] 3.1 Extend HabitItem interface with schedule fields
    - Add `schedule_type: 'daily' | 'weekly' | 'custom'` to `HabitItem` in `src/store/useHabitStore.ts`
    - Add `schedule_days: number[]` to `HabitItem`
    - Update `fetchHabits()` to read schedule columns from Supabase, applying defaults for null values using `getDefaultSchedule()`
    - Update `addHabit()` to accept and persist schedule_type and schedule_days
    - Update `updateHabit()` to support schedule field updates
    - _Requirements: 1.1, 1.2, 1.6, 7.1_

  - [x] 3.2 Integrate schedule-aware streak calculation into store
    - Replace or augment the existing `calculateStreak()` method in `useHabitStore.ts` to use `calculateScheduleAwareStreak()` from scheduleHelpers
    - Ensure streak calculation reads the habit's `schedule_days` and passes completion log dates
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [x] 3.3 Add day-based filtering to the Berjalan tab
    - In the main habits list rendering logic, apply `filterHabitsByDay(habits, new Date().getDay())` before rendering in the Berjalan (active) tab
    - Ensure daily habits always appear, weekly/custom habits only appear on their scheduled days
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 4. Schedule Editor UI component
  - [x] 4.1 Create ScheduleEditor bottom sheet component
    - Create `src/mainscreen/habits/ScheduleEditor.tsx`
    - Implement bottom sheet with Framer Motion slide-up animation
    - Add schedule type selector with three pill buttons: Harian, Mingguan, Custom Days
    - Add Day Picker with 7 circular day buttons (Min, Sen, Sel, Rab, Kam, Jum, Sab)
    - Hide Day Picker when Harian is selected; show for Mingguan (single-select) and Custom (multi-select)
    - Add Save button that validates selection and calls `onSave` with the ScheduleConfig
    - Show validation message when Mingguan/Custom has no day selected, prevent save
    - Style with Tailwind CSS consistent with existing bottom sheets in the app
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [x] 4.2 Wire ScheduleEditor to habit card EDIT action
    - In `src/mainscreen/habits/displaycardhabit.tsx`, update the EDIT swipe-left action to open the ScheduleEditor
    - Pass the current habit's schedule config as initial state
    - On save, call `updateHabit(habit.id, { schedule_type, schedule_days })` to persist to Supabase
    - Handle save errors with toast notification and local state revert
    - _Requirements: 2.1, 2.6_

  - [ ]* 4.3 Write unit tests for ScheduleEditor component
    - Test rendering for each schedule type (daily hides picker, weekly shows single-select, custom shows multi-select)
    - Test validation prevents save without day selection for weekly/custom
    - Test save callback receives correct ScheduleConfig
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.7, 2.8_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Habit Card schedule label and Analytics grid updates
  - [x] 6.1 Add schedule label to Habit Card
    - In `src/mainscreen/habits/displaycardhabit.tsx`, display the schedule label using `getScheduleLabel()` from scheduleHelpers
    - Show "HARIAN" for daily, abbreviated day name for weekly, comma-separated names for custom
    - Position the label appropriately on the card (e.g., near frequency/subtitle area)
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 6.2 Update Analytics grid to be schedule-aware
    - In `src/mainscreen/analytics/AnalyticsView.tsx`, update `HabitInlineDetail` and related grid components
    - Accept `schedule_days` from the habit object
    - For each grid cell, check `isScheduledDay(cellDate, habit.schedule_days)`
    - Mark non-scheduled day cells as grayed out / inactive (different styling from missed days)
    - Only color cells (green for completed, empty for missed) on scheduled days
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 6.3 Write property test for analytics grid schedule awareness (Property 5)
    - **Property 5: Analytics Grid Schedule Awareness**
    - Generate schedule + date range, verify cell active state matches `isScheduledDay` for each date
    - **Validates: Requirements 5.2, 5.3**

  - [ ]* 6.4 Write unit tests for schedule label display and analytics grid
    - Test habit card renders correct label for each schedule type
    - Test analytics grid renders grayed cells for non-scheduled days
    - Test analytics grid renders colored cells only for scheduled days
    - _Requirements: 4.1, 4.2, 4.3, 5.2, 5.3_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The design uses TypeScript throughout — all implementations use TypeScript
- Existing habits default to `daily` schedule with all 7 days, ensuring backward compatibility
- The `fast-check` library is used for property-based tests with Vitest

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5", "1.6", "1.7", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["4.2", "4.3"] },
    { "id": 5, "tasks": ["6.1", "6.2"] },
    { "id": 6, "tasks": ["6.3", "6.4"] }
  ]
}
```
