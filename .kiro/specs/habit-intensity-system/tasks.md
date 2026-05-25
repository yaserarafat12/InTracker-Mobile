# Implementation Plan: Habit Intensity System

## Overview

This plan implements the complete intensity tracking pipeline: display (habit card target labels), input (premium scroll-wheel picker for numeric habits), persistence (intensity_value in habit_logs), and output (analytics bar chart using actual intensity values). Tasks are ordered to build incrementally — utilities and types first, then UI components, then store integration, then analytics, and finally wiring everything together.

## Tasks

- [x] 1. Set up intensity helpers and type definitions
  - [x] 1.1 Create `src/utils/intensityHelpers.ts` with helper functions
    - Implement `getIntensityConfig(habitName)` to look up intensity config from HABIT_OPTIONS
    - Implement `formatIntensityLabel(habitName, targetIntensity?)` to return `"{value} {unit}"` or null
    - Implement `shouldShowIntensityPicker(habitName)` to check if intensity type is 'numeric'
    - Implement `calculateBarHeights(logs, weekDates, isNumeric)` to compute chart bar data
    - Import HABIT_OPTIONS from `src/mainscreen/habits/icons/index.ts`
    - _Requirements: 1.1, 1.3, 1.4, 5.1, 5.2, 5.3, 5.6_

  - [ ]* 1.2 Write property tests for intensity helpers (setup fast-check)
    - Install `fast-check` and `vitest` as dev dependencies
    - Create `src/utils/__tests__/intensityHelpers.test.ts`
    - **Property 1: Numeric habit card displays correct intensity label**
    - **Property 4: All 27 numeric habits have valid intensity configuration**
    - **Validates: Requirements 1.1, 1.2, 1.4, 3.4**

  - [ ]* 1.3 Write property test for calculateBarHeights
    - **Property 6: Analytics chart data transformation for numeric habits**
    - **Property 7: Analytics chart binary representation for single-action habits**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5, 5.6**

- [x] 2. Implement IntensityPicker component
  - [x] 2.1 Create `src/mainscreen/habits/IntensityPicker.tsx`
    - Build modal scroll-wheel component with `IntensityPickerProps` interface
    - Implement vertical scroll list with CSS `scroll-snap-type: y mandatory`
    - Style with dark theme: background `#1c1e22`, text `#E3DAC9`, accent `#00FF85`
    - Use Outfit font bold for numeric values (28px selected, 18px adjacent)
    - Display unit label to the right of selected value
    - Add confirm button at bottom; dismiss on tap outside or swipe down
    - Pre-select defaultValue as initial scroll position
    - Add debounce to prevent rapid double-tap during animation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

  - [ ]* 2.2 Write property test for IntensityPicker initialization
    - **Property 3: Intensity picker initializes correctly for any numeric habit**
    - **Validates: Requirements 2.5, 3.1, 3.2**

- [x] 3. Modify HabitCard to display target intensity
  - [x] 3.1 Update `src/mainscreen/habits/displaycardhabit.tsx` intensity display
    - Replace `{habit.current_intensity || 0}/{habit.target_intensity}` with `{target_intensity} {unit}` format
    - Use `formatIntensityLabel()` helper to generate the label
    - Only render intensity label when `shouldShowIntensityPicker()` returns true
    - When `target_intensity` is null/undefined, fall back to HABIT_OPTIONS defaultValue
    - Ensure Single_Action_Habits render no intensity label
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 3.2 Write property test for single-action habit no-artifact behavior
    - **Property 2: Single-action habits produce no intensity artifacts**
    - **Validates: Requirements 1.3, 3.5, 4.2**

- [x] 4. Checkpoint - Verify display and picker components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement completion flow with intensity in useHabitStore
  - [x] 5.1 Add Supabase migration for `intensity_value` column
    - Create SQL migration: `ALTER TABLE habit_logs ADD COLUMN intensity_value NUMERIC NULL;`
    - Document the unique constraint `(user_id, habit_id, date)` remains unchanged
    - _Requirements: 4.3_

  - [x] 5.2 Add `completeWithIntensity` function to `src/store/useHabitStore.ts`
    - Implement `completeWithIntensity(habitId: string, intensityValue: number): Promise<void>`
    - Perform atomic upsert: both `status` and `intensity_value` in a single call
    - On success: mark habit completed locally, trigger streak recalculation
    - On failure: no local state change, surface error to UI
    - _Requirements: 3.3, 4.1, 6.1, 6.2, 6.3_

  - [x] 5.3 Modify existing `toggleHabit` to pass `intensity_value: null` for single-action habits
    - Ensure single-action completions explicitly set `intensity_value: null` in the upsert
    - _Requirements: 4.2, 3.5_

  - [ ]* 5.4 Write property test for round-trip persistence
    - **Property 5: Intensity value round-trip persistence**
    - **Validates: Requirements 3.3, 4.1, 4.4, 6.1**

  - [ ]* 5.5 Write property tests for failure rollback and dismissal
    - **Property 8: Failed persistence rolls back local state**
    - **Property 9: Picker dismissal preserves unchanged state**
    - **Validates: Requirements 6.3, 6.4**

- [x] 6. Integrate IntensityPicker into HabitCard completion flow
  - [x] 6.1 Wire IntensityPicker into `displaycardhabit.tsx` completion handler
    - On double-tap completion: check `shouldShowIntensityPicker(habitName)`
    - If numeric: show IntensityPicker with options/defaultValue/unit from HABIT_OPTIONS
    - On picker confirm: call `completeWithIntensity(habitId, selectedValue)`
    - On picker dismiss: do nothing (habit stays uncompleted)
    - If single-action: call existing `toggleHabit` directly (no picker)
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 6.1, 6.4_

- [x] 7. Checkpoint - Verify end-to-end completion flow
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement analytics chart integration
  - [x] 8.1 Modify `src/mainscreen/analytics/AnalyticsView.tsx` to use intensity data
    - Fetch `intensity_value` field from habit_logs query in HabitInlineDetail
    - For numeric habits: Y-axis represents actual intensity values with dynamic scale
    - For single-action habits: Y-axis remains binary (0/1)
    - Calculate bar heights: `(dayIntensity / maxIntensityInWeek) * chartHeight`
    - Generate Y-axis labels dynamically from 0 to max value in the week
    - Render 7 bars (Mon–Sun), height 0 for days with no log
    - Use `calculateBarHeights()` helper from intensityHelpers
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 8.2 Write unit tests for analytics chart rendering
    - Test empty state (no logs) renders flat bars
    - Test numeric habit with mixed values renders proportional bars
    - Test single-action habit renders only 0/1 bars
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project currently has no test framework; task 1.2 sets up vitest + fast-check
- All UI components use the existing dark theme palette and Outfit font
- HABIT_OPTIONS in `src/mainscreen/habits/icons/index.ts` is the single source of truth for intensity config

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1", "3.1", "5.1"] },
    { "id": 2, "tasks": ["2.2", "3.2", "5.2", "5.3"] },
    { "id": 3, "tasks": ["5.4", "5.5", "6.1"] },
    { "id": 4, "tasks": ["8.1"] },
    { "id": 5, "tasks": ["8.2"] }
  ]
}
```
