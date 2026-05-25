# Requirements Document

## Introduction

The Habit Intensity System completes and polishes the existing intensity tracking infrastructure in InTracker Mobile. Currently, some habits support intensity (numeric targets like glasses of water or pages read), but the display, picker experience, and analytics integration are incomplete. This feature ensures all numeric-type habits display their target on the card, present a premium intensity picker during completion, and feed actual intensity values into the analytics bar chart for historical tracking.

## Glossary

- **Habit_Card**: The visual card component (displaycardhabit.tsx) that renders a single habit in the main screen list
- **Intensity_Picker**: The scroll/roller wheel UI component that appears when a user completes a numeric-type habit, allowing selection of an actual intensity value
- **Target_Intensity**: The goal value a user sets when adding a habit (e.g., 8 Gelas for Hidrasi Harian)
- **Actual_Intensity**: The value a user logs when completing a habit on a given day via the Intensity_Picker
- **Numeric_Habit**: A habit whose intensity type is 'numeric' in HABIT_OPTIONS, meaning it tracks a quantifiable value with a unit
- **Single_Action_Habit**: A habit whose intensity type is 'none' in HABIT_OPTIONS, representing a binary done/not-done action
- **Habit_Log**: A record in the habit_logs Supabase table storing a single completion event including date, status, and intensity value
- **Analytics_Chart**: The bar chart displayed in HabitInlineDetail (Rekam Jejak expanded view) showing historical completion data per day
- **HABIT_OPTIONS**: The configuration array in icons/index.ts defining all available habits with their intensity settings (type, unit, options, defaultValue)
- **Intensity_Unit**: The measurement label for a numeric habit (e.g., Gelas, Menit, Halaman, Rep, Km, Detik, Jam, Sesi, Kali, Pil, Waktu)

## Requirements

### Requirement 1: Target Intensity Display on Habit Card

**User Story:** As a user, I want to see the target intensity value with its unit directly on the habit card, so that I know my daily goal at a glance without extra interaction.

#### Acceptance Criteria

1. WHEN a Numeric_Habit is rendered, THE Habit_Card SHALL display the Target_Intensity value followed by the Intensity_Unit (e.g., "8 Gelas", "30 Menit", "10 Halaman")
2. THE Habit_Card SHALL NOT display a "0/" prefix before the Target_Intensity value
3. WHEN a Single_Action_Habit is rendered, THE Habit_Card SHALL NOT display any intensity label or value
4. WHEN a Numeric_Habit has no Target_Intensity set, THE Habit_Card SHALL display the defaultValue from HABIT_OPTIONS followed by the Intensity_Unit

### Requirement 2: Premium Intensity Picker Styling

**User Story:** As a user, I want the intensity selection picker to feel smooth and visually premium, so that the completion experience matches the overall dark-theme aesthetic of the app.

#### Acceptance Criteria

1. THE Intensity_Picker SHALL use the Outfit font family with bold weight for all numeric values displayed in the scroll wheel
2. THE Intensity_Picker SHALL use a dark color scheme consistent with the app theme (background color #1c1e22 or darker, text color #E3DAC9 or white)
3. THE Intensity_Picker SHALL provide smooth scroll behavior with momentum-based deceleration when the user swipes through values
4. THE Intensity_Picker SHALL visually highlight the currently selected value with increased font size or opacity compared to adjacent values
5. THE Intensity_Picker SHALL display the Intensity_Unit label adjacent to the selected value so the user understands what they are selecting

### Requirement 3: Complete Intensity Picker Coverage for All Numeric Habits

**User Story:** As a user, I want every habit that has a numeric intensity type to present the intensity picker when I complete it, so that I can log my actual achievement for all trackable habits.

#### Acceptance Criteria

1. WHEN a user completes a Numeric_Habit, THE Intensity_Picker SHALL appear with the options array defined in HABIT_OPTIONS for that habit
2. THE Intensity_Picker SHALL pre-select the defaultValue from HABIT_OPTIONS as the initial scroll position
3. WHEN the user confirms a selection in the Intensity_Picker, THE system SHALL save the selected value as the Actual_Intensity in the Habit_Log
4. THE Intensity_Picker SHALL support all 27 Numeric_Habits defined in HABIT_OPTIONS: Hidrasi Harian, Minum Pil, Beribadah, Latihan Napas, Latihan Musik, Deep Work, Membaca Buku, Deep Learning, Belajar Bahasa, Latihan Beban, Push-Up, Sit-Up, Sesi Kardio, Basket, Lompat Tali, Bersepeda, Makan Teratur, Sikat Gigi, Meditasi, Jalan Santai, Belajar Coding, Menggambar, Yoga, Plank, Lari, Renang, and Stretching
5. WHEN a user completes a Single_Action_Habit, THE system SHALL NOT display the Intensity_Picker and SHALL log the completion without an intensity value

### Requirement 4: Intensity Value Persistence in Habit Logs

**User Story:** As a user, I want my logged intensity values to be stored reliably, so that my historical data is available for analytics and progress tracking.

#### Acceptance Criteria

1. WHEN a Numeric_Habit completion is saved, THE Habit_Log SHALL store the Actual_Intensity value in a dedicated intensity_value field
2. WHEN a Single_Action_Habit completion is saved, THE Habit_Log SHALL store null or omit the intensity_value field
3. THE habit_logs table SHALL include an intensity_value column of numeric type that accepts null values
4. WHEN a Habit_Log with an intensity_value is queried, THE system SHALL return the exact numeric value that was logged

### Requirement 5: Analytics Bar Chart Integration with Intensity Data

**User Story:** As a user, I want the weekly bar chart in Rekam Jejak to show my actual intensity values per day, so that I can visualize my performance trends over time.

#### Acceptance Criteria

1. WHEN a Numeric_Habit is expanded in the Analytics_Chart, THE Y-axis SHALL represent the Actual_Intensity values logged per day
2. WHEN a Single_Action_Habit is expanded in the Analytics_Chart, THE Y-axis SHALL represent binary completion (1 for completed, 0 for not completed)
3. WHEN a Numeric_Habit has a Habit_Log with an intensity_value for a given day, THE Analytics_Chart SHALL render a bar at the height corresponding to that intensity_value
4. WHEN a Numeric_Habit has no Habit_Log for a given day, THE Analytics_Chart SHALL render no bar or a bar at height zero for that day
5. THE Analytics_Chart SHALL display 7 bars in the weekly view, one for each day from Monday to Sunday
6. THE Analytics_Chart Y-axis scale SHALL dynamically adjust based on the maximum intensity_value in the displayed week for Numeric_Habits

### Requirement 6: Completion Flow Data Integrity

**User Story:** As a user, I want the completion flow to correctly pass my selected intensity value from the picker through to storage, so that my analytics reflect what I actually logged.

#### Acceptance Criteria

1. WHEN the user selects a value in the Intensity_Picker and confirms, THE system SHALL pass the selected Actual_Intensity value to the Habit_Log creation function
2. WHEN the Habit_Log is created with an Actual_Intensity value, THE system SHALL persist the value to the Supabase habit_logs table within the same operation as the completion status
3. IF the Supabase write operation fails, THEN THE system SHALL display an error indication to the user and SHALL NOT mark the habit as completed locally
4. WHEN the user dismisses the Intensity_Picker without confirming, THE system SHALL NOT create a Habit_Log and SHALL NOT mark the habit as completed
