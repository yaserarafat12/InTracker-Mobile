# Requirements Document

## Introduction

The Habit Schedule System extends InTracker Mobile's habit tracking capabilities by allowing users to assign schedule types to their habits. Currently, all habits are treated as daily ("Harian"). This feature introduces three schedule types: Harian (daily), Mingguan (weekly — one specific day), and Custom Days (user-selected days). The system filters habit visibility based on the current day, adjusts the analytics grid to reflect scheduled days, and modifies streak calculation to skip non-scheduled days.

## Glossary

- **Habit_Schedule_System**: The subsystem responsible for managing schedule types, filtering habits by day, and adjusting analytics and streak calculations based on schedule configuration.
- **Schedule_Type**: A classification for a habit's recurrence pattern. One of: `daily`, `weekly`, or `custom`.
- **Schedule_Days**: An array of integers (0–6) representing the days of the week a habit is active. 0 = Minggu (Sunday), 1 = Senin (Monday), 2 = Selasa (Tuesday), 3 = Rabu (Wednesday), 4 = Kamis (Thursday), 5 = Jumat (Friday), 6 = Sabtu (Saturday).
- **Schedule_Editor**: A bottom sheet UI component that allows users to configure a habit's schedule type and selected days.
- **Berjalan_Tab**: The "active" tab in the main screen that displays habits scheduled for the current day.
- **Rekam_Jejak**: The analytics view (90-day grid and weekly checkboxes) that shows a habit's completion history.
- **Streak_Calculator**: The logic that computes consecutive completion counts, considering only scheduled days.
- **Habit_Card**: The swipeable card component that displays a single habit in the main list.
- **Day_Picker**: A UI component within the Schedule Editor showing 7 day buttons for selecting schedule days.

## Requirements

### Requirement 1: Schedule Data Model

**User Story:** As a developer, I want habits to store schedule type and schedule days data, so that the system can determine when each habit should appear.

#### Acceptance Criteria

1. THE Habit_Schedule_System SHALL store a `schedule_type` field with value `daily`, `weekly`, or `custom` for each habit.
2. THE Habit_Schedule_System SHALL store a `schedule_days` field as an array of integers (0–6) for each habit.
3. WHEN a habit has schedule_type `daily`, THE Habit_Schedule_System SHALL set schedule_days to [0, 1, 2, 3, 4, 5, 6].
4. WHEN a habit has schedule_type `weekly`, THE Habit_Schedule_System SHALL store exactly one integer in schedule_days representing the selected day.
5. WHEN a habit has schedule_type `custom`, THE Habit_Schedule_System SHALL store one or more integers in schedule_days representing the selected days.
6. THE Habit_Schedule_System SHALL default schedule_type to `daily` and schedule_days to [0, 1, 2, 3, 4, 5, 6] for all existing habits without schedule configuration.

### Requirement 2: Schedule Editor UI

**User Story:** As a user, I want to configure my habit's schedule through an editor, so that I can control which days the habit appears.

#### Acceptance Criteria

1. WHEN the user taps the EDIT button (swipe left on Habit_Card), THE Schedule_Editor SHALL open as a bottom sheet.
2. THE Schedule_Editor SHALL display three selectable schedule type options: Harian, Mingguan, and Custom Days.
3. WHEN the user selects Harian, THE Schedule_Editor SHALL hide the Day_Picker.
4. WHEN the user selects Mingguan, THE Schedule_Editor SHALL display the Day_Picker with 7 day buttons allowing exactly one selection.
5. WHEN the user selects Custom Days, THE Schedule_Editor SHALL display the Day_Picker with 7 day buttons allowing multiple selections.
6. WHEN the user taps Save in the Schedule_Editor, THE Habit_Schedule_System SHALL persist the selected schedule_type and schedule_days to the habit record in Supabase.
7. IF the user selects Mingguan but does not pick a day, THEN THE Schedule_Editor SHALL prevent saving and display a validation message.
8. IF the user selects Custom Days but does not pick at least one day, THEN THE Schedule_Editor SHALL prevent saving and display a validation message.

### Requirement 3: Habit Visibility Filtering

**User Story:** As a user, I want to see only habits scheduled for today in my active list, so that I focus on relevant habits.

#### Acceptance Criteria

1. WHEN the Berjalan_Tab is displayed, THE Habit_Schedule_System SHALL show only habits whose schedule_days array contains the current day of the week (0–6).
2. WHEN a habit's schedule_days does not contain the current day, THE Habit_Schedule_System SHALL hide that habit from the Berjalan_Tab.
3. WHEN a habit has schedule_type `daily`, THE Habit_Schedule_System SHALL display that habit in the Berjalan_Tab every day.

### Requirement 4: Habit Card Schedule Label

**User Story:** As a user, I want to see my habit's schedule displayed on the card, so that I know which days it is active.

#### Acceptance Criteria

1. WHEN a habit has schedule_type `daily`, THE Habit_Card SHALL display the label "HARIAN".
2. WHEN a habit has schedule_type `weekly`, THE Habit_Card SHALL display the abbreviated name of the scheduled day (e.g., "SENIN").
3. WHEN a habit has schedule_type `custom`, THE Habit_Card SHALL display a comma-separated list of abbreviated day names (e.g., "SEN, RAB, JUM").

### Requirement 5: Analytics Grid Schedule Awareness

**User Story:** As a user, I want the 90-day analytics grid to reflect my habit's schedule, so that I can see which days are relevant.

#### Acceptance Criteria

1. WHEN a habit has schedule_type `daily`, THE Rekam_Jejak SHALL display all 90 days as active (current behavior).
2. WHEN a habit has schedule_type `weekly` or `custom`, THE Rekam_Jejak SHALL display only days matching schedule_days as active (colored based on completion status).
3. WHEN a habit has schedule_type `weekly` or `custom`, THE Rekam_Jejak SHALL display days not matching schedule_days as grayed out and non-interactive.

### Requirement 6: Schedule-Aware Streak Calculation

**User Story:** As a user, I want my streak to count only scheduled days, so that non-scheduled days do not break my streak.

#### Acceptance Criteria

1. THE Streak_Calculator SHALL count only days present in the habit's schedule_days when computing streak length.
2. WHEN a non-scheduled day occurs between two scheduled days, THE Streak_Calculator SHALL skip that day without breaking the streak.
3. WHEN a scheduled day is missed (no completion log), THE Streak_Calculator SHALL treat it as a streak break.
4. WHEN a habit has schedule_type `daily`, THE Streak_Calculator SHALL count all days (preserving current behavior).

### Requirement 7: Backward Compatibility

**User Story:** As a user with existing habits, I want my habits to continue working as before without manual migration, so that the update does not disrupt my tracking.

#### Acceptance Criteria

1. WHEN a habit record lacks schedule_type or schedule_days fields, THE Habit_Schedule_System SHALL treat it as schedule_type `daily` with schedule_days [0, 1, 2, 3, 4, 5, 6].
2. THE Habit_Schedule_System SHALL not alter existing habit completion logs or streak history during migration.
3. WHEN the database migration adds schedule_type and schedule_days columns, THE Habit_Schedule_System SHALL populate existing rows with default values (`daily` and [0, 1, 2, 3, 4, 5, 6]).
