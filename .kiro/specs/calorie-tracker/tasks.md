# Implementation Plan: Calorie Tracker

## Overview

This plan implements a comprehensive calorie tracking system for InTracker Mobile. The implementation follows a bottom-up approach: pure engine functions first (independently testable), then Zustand stores, then Supabase data layer, then UI components, and finally external service integrations. Each step builds incrementally on the previous, ensuring no orphaned code.

## Tasks

- [x] 1. Implement core calculation engines
  - [x] 1.1 Create `src/engines/nutritionEngine.ts` with BMR, TDEE, calorie target, macro, and weekly rate functions
    - Implement `calculateBmr(input: BmrInput): BmrOutput` using Mifflin-St Jeor equation with input validation (weight 20-300, height 100-250, age 13-120, sex male/female)
    - Implement `calculateTdee(input: TdeeInput): number` multiplying BMR by activity multiplier (1.2, 1.375, 1.55, 1.725, 1.9)
    - Implement `calculateCalorieTarget(input: CalorieTargetInput): number` with goal adjustments (-20%, -30%, +10%, +20%, 0%), floor enforcement (1200F/1500M adults, 1400F/1600M teens), and 5000 cap
    - Implement `calculateMacros(input: MacroInput): MacroTargets` with dietary preference splits, goal adjustments (+5% protein for fat loss/recomp), age adjustments (+5% protein for 13-17 and 50+), 15pp protein cap, 10% carbs floor, and ≤10 kcal tolerance check
    - Implement `calculateWeeklyRate(input: WeeklyRateInput): WeeklyRateResult` with rate calculation and aggressive flag
    - Export all types: BmrInput, BmrOutput, TdeeInput, ActivityMultiplier, FitnessGoal, DietaryPreference, CalorieTargetInput, MacroInput, MacroTargets, WeeklyRateInput, WeeklyRateResult
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 7.1–7.10, 8.1–8.8, 19.1–19.6, 3.3, 3.4_

  - [ ]* 1.2 Write property tests for BMR calculation (Property 1)
    - **Property 1: BMR Calculation Correctness**
    - Test that for any valid sex, weight (20-300), height (100-250), age (13-120), the result equals round((10×weight) + (6.25×height) − (5×age) + offset) where offset is +5 male, −161 female
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [ ]* 1.3 Write property tests for TDEE calculation (Property 2)
    - **Property 2: TDEE Calculation Correctness**
    - Test that for any valid BMR and multiplier (1.2, 1.375, 1.55, 1.725, 1.9), result equals round(BMR × multiplier)
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ]* 1.4 Write property tests for calorie target floor/cap (Property 3)
    - **Property 3: Calorie Target Floor and Cap Enforcement**
    - Test that result is never below 1200 (female 18+), 1500 (male 18+), 1400 (female 13-17), 1600 (male 13-17), and never above 5000
    - **Validates: Requirements 7.7, 7.8, 7.9, 19.6**

  - [ ]* 1.5 Write property tests for calorie target goal adjustment (Property 4)
    - **Property 4: Calorie Target Goal Adjustment**
    - Test correct percentage adjustments per goal before floor/cap constraints
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

  - [ ]* 1.6 Write property tests for macro calorie sum invariant (Property 5)
    - **Property 5: Macro Calorie Sum Invariant**
    - Test that |(protein×4 + carbs×4 + fat×9) − dailyCalories| ≤ 10 for all valid inputs
    - **Validates: Requirements 8.7**

  - [ ]* 1.7 Write property tests for macro percentage split (Property 6)
    - **Property 6: Macro Percentage Split Correctness**
    - Test that percentages sum to 100%, carbs never below 10%, combined protein increase never exceeds 15pp above base
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 19.1, 19.2, 19.3, 19.4, 19.5**

  - [ ]* 1.8 Write property tests for weekly rate calculation (Property 7)
    - **Property 7: Weekly Change Rate Calculation**
    - Test rate = (targetWeight − currentWeight) / durationWeeks rounded to 1 decimal, isAggressive true iff rate < −1.0 or > +0.5
    - **Validates: Requirements 3.3, 3.4**

- [x] 2. Implement dashboard and food log engines
  - [x] 2.1 Create `src/engines/dashboardEngine.ts` with progress ring, macro bars, and weekly chart functions
    - Implement `calculateProgressRing(consumed, target): ProgressRingData` with fillPercentage capped at 100, remaining = target − consumed (can be negative)
    - Implement `calculateMacroBars(consumed, target): MacroBarData` with isOver flag when consumed > target
    - Implement `calculateWeeklyChart(entries, weekStartDate, today): WeeklyChartData` with average only over days with entries, daysLogged count, isToday flag
    - Export all types: ProgressRingData, MacroBarData, WeeklyChartData
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 12.1, 12.2, 12.3, 12.6_

  - [x] 2.2 Create `src/engines/foodLogEngine.ts` with food entry grouping and daily totals
    - Implement `groupEntriesByMealType(entries): GroupedFoodLog[]` returning groups in fixed order [breakfast, lunch, dinner, snack], only groups with entries
    - Implement `getMealTypeByTime(hour): MealType` returning breakfast 0-10, lunch 11-14, dinner 15-20, snack 21-23
    - Implement `calculateDailyTotals(entries): { calories, protein, carbs, fat }`
    - Export all types: FoodEntry, MealType, GroupedFoodLog, MEAL_TYPE_ORDER
    - _Requirements: 13.7, 14.2, 15.1, 15.6_

  - [ ]* 2.3 Write property tests for progress ring (Property 8)
    - **Property 8: Dashboard Progress Ring Calculation**
    - Test fillPercentage = min(100, (consumed/target)×100), remaining = target − consumed
    - **Validates: Requirements 10.1, 10.2, 10.4**

  - [ ]* 2.4 Write property tests for weekly average (Property 9)
    - **Property 9: Weekly Average Calculation**
    - Test averageCalories = sum of calories on logged days / count of logged days, daysLogged = count of days with entries, both 0 if no entries
    - **Validates: Requirements 12.2, 12.3, 12.6**

  - [ ]* 2.5 Write property tests for food log grouping (Property 10)
    - **Property 10: Food Log Grouping by Meal Type**
    - Test groups in fixed order, only groups with entries included, every entry in exactly one group matching its mealType
    - **Validates: Requirements 15.1, 15.6**

  - [ ]* 2.6 Write property tests for meal type by time (Property 11)
    - **Property 11: Meal Type Default by Time of Day**
    - Test breakfast for 0-10, lunch for 11-14, dinner for 15-20, snack for 21-23
    - **Validates: Requirements 13.7, 14.2**

- [x] 3. Checkpoint - Core engines complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Zustand stores
  - [x] 4.1 Create `src/store/useNutritionStore.ts` with profile management and plan generation
    - Implement UserProfile, NutritionTargets, and NutritionStore interfaces
    - Implement `setProfile` storing full profile and triggering `generatePlan`
    - Implement `generatePlan` calling calculateBmr → calculateTdee → calculateCalorieTarget → calculateMacros pipeline
    - Implement `updateProfile` for partial updates with automatic recalculation
    - Use Zustand `persist` middleware with localStorage
    - Implement `syncToSupabase` and `restoreFromSupabase` methods (stubs initially, wired in task 6)
    - Track `onboardingComplete` and `loading` state
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 4.5_

  - [x] 4.2 Create `src/store/useFoodLogStore.ts` with food entry management and date selection
    - Implement FoodLogStore interface with entries array, selectedDate, pendingSync queue
    - Implement `addEntry` with optimistic local insert and ID generation
    - Implement `deleteEntry` with soft-delete (isDeleted flag)
    - Implement `setSelectedDate` and `getEntriesForDate` filtering by date and excluding deleted
    - Use Zustand `persist` middleware with localStorage
    - Implement `syncToSupabase` and `reconcileWithSupabase` methods (stubs initially, wired in task 6)
    - Track `syncRetryCount` per entry (max 5 retries)
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 15.4_

  - [ ]* 4.3 Write unit tests for useNutritionStore
    - Test setProfile triggers generatePlan and produces correct targets
    - Test updateProfile recalculates targets
    - Test onboardingComplete flag transitions
    - Test persistence across store rehydration
    - _Requirements: 9.1, 9.4_

  - [ ]* 4.4 Write unit tests for useFoodLogStore
    - Test addEntry creates entry with correct fields
    - Test deleteEntry soft-deletes
    - Test getEntriesForDate filters correctly
    - Test pendingSync queue management
    - _Requirements: 16.1, 16.2, 16.6_

- [x] 5. Implement UI components — Onboarding Wizard
  - [x] 5.1 Create `src/mainscreen/nutrition/OnboardingWizard.tsx` with 4-step flow
    - Step 1: Body metrics (sex toggle, height cm, weight kg, age) with validation (height 100-250, weight 30-300, age 13-100, non-numeric prevention)
    - Step 2: Fitness goal selection (6 options with descriptions, single select)
    - Step 3: Timeframe (optional target weight 30-300 kg, duration 4/8/12/16 weeks, weekly rate display with aggressive warning)
    - Step 4: Activity level (5 options, required) and dietary preference (5 options, default "No Preference")
    - "Generate My Plan" button triggering useNutritionStore.setProfile → generatePlan with loading indicator
    - Step navigation with back/next, retaining values on back navigation
    - Error handling: plan generation failure shows retry option
    - _Requirements: 1.1–1.7, 2.1–2.5, 3.1–3.6, 4.1–4.6_

  - [ ]* 5.2 Write unit tests for OnboardingWizard
    - Test step navigation and value retention
    - Test validation rules per step
    - Test plan generation trigger and error handling
    - _Requirements: 1.4, 1.5, 2.4, 3.4, 4.3_

- [x] 6. Implement Supabase data layer
  - [x] 6.1 Create Supabase migration for nutrition tables
    - Create `nutrition_profiles` table with all columns, constraints, and RLS policies
    - Create `food_entries` table with indexes and RLS policies
    - Create `food_items` table with GIN indexes for search and RLS policies
    - Create `food_translations` table for Indonesian-English lookup
    - _Requirements: 9.1, 16.2, 18.1, 18.2, 18.7_

  - [x] 6.2 Wire Supabase sync into useNutritionStore
    - Implement `syncToSupabase` upserting nutrition_profiles row
    - Implement `restoreFromSupabase` loading profile on app launch when local state is empty
    - Handle sync failures with retry on next opportunity
    - _Requirements: 9.1, 9.5, 9.6_

  - [x] 6.3 Wire Supabase sync into useFoodLogStore
    - Implement `syncToSupabase` inserting/updating food_entries with retry logic (max 5 attempts)
    - Implement `reconcileWithSupabase` merging remote entries by unique ID, respecting soft deletes
    - Queue failed syncs in pendingSync, retry on next entry add/delete/app launch
    - _Requirements: 16.1, 16.3, 16.4, 16.5, 16.6_

  - [ ]* 6.4 Write unit tests for Supabase sync logic
    - Test sync retry counting and max attempts
    - Test reconciliation merge logic (remote-only added, local deletes preserved, timestamp conflict resolution)
    - _Requirements: 16.3, 16.4, 16.5_

- [x] 7. Checkpoint - Stores and data layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement UI components — Calorie Dashboard
  - [x] 8.1 Create `src/mainscreen/nutrition/CalorieDashboard.tsx` as main nutrition view
    - Integrate useNutritionStore and useFoodLogStore
    - Conditionally render OnboardingWizard if !onboardingComplete, else render dashboard
    - Settings gear icon in top-right navigating to NutritionSettings
    - Layout: ProgressRing → MacroBars → DateNavigator → WeeklyChart → FoodLog
    - _Requirements: 9.2, 9.3, 10.5, 17.1_

  - [x] 8.2 Create `src/mainscreen/nutrition/components/ProgressRing.tsx`
    - Circular SVG progress ring with fill percentage from calculateProgressRing
    - Center: consumed calories numeric display
    - Below ring: "X calories remaining" (negative when over-target)
    - Color change when over-target
    - _Requirements: 10.1, 10.2, 10.4_

  - [x] 8.3 Create `src/mainscreen/nutrition/components/MacroBars.tsx`
    - Three horizontal bars for protein, carbs, fat
    - Each shows grams consumed / gram target with fill percentage
    - Visual over-target indicator when consumed > target
    - _Requirements: 10.3_

  - [x] 8.4 Create `src/mainscreen/nutrition/components/DateNavigator.tsx`
    - Display selected date with left/right arrow buttons
    - Navigate previous/next day via useFoodLogStore.setSelectedDate
    - Disable arrows at boundaries (90 days past, 7 days future)
    - Default to current device date on mount
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 8.5 Create `src/mainscreen/nutrition/components/WeeklyChart.tsx`
    - Bar chart for Monday-Sunday of the week containing selected date
    - Distinct color for today's bar
    - Summary: average calories (only days with entries) and days logged count
    - Zero-height bars for days with no entries
    - Update when navigating to different week
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 8.6 Create `src/mainscreen/nutrition/components/FoodLog.tsx`
    - Display food entries grouped by meal type in fixed order [breakfast, lunch, dinner, snack]
    - Only show groups with entries
    - Each entry shows food name and calories
    - Tap entry → delete confirmation → recalculate totals
    - Empty state message when no entries
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [x] 9. Implement food entry UI
  - [x] 9.1 Create `src/mainscreen/nutrition/QuickAddSheet.tsx` bottom sheet
    - Meal type selector defaulting by time of day (getMealTypeByTime)
    - Food search field triggering search after 2+ characters
    - Display up to 20 results with name, serving, macros within 3 seconds
    - "Apply" on result populates editable fields
    - Manual entry fields: food name (max 100 chars), calories (1-99999), protein (0-9999), carbs (0-9999), fat (0-9999)
    - "Add Entry" validation: require food name + calories, show inline errors
    - On submit: call useFoodLogStore.addEntry, close sheet
    - Search unavailable fallback message
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

  - [x] 9.2 Create `src/mainscreen/nutrition/FoodScanner.tsx` photo scan screen
    - Camera capture or photo library selection
    - Meal type selector with time-based default
    - "Analyze Food" button → send to AI service with 30s timeout
    - Display up to 10 detected items with name, calories, protein, carbs, fat
    - Checkbox per item (default selected), confirm creates entries for checked items
    - Error states: timeout, no food detected, service unreachable, image >10MB
    - Fallback to Quick Add on all error states
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10_

  - [x] 9.3 Create `src/mainscreen/nutrition/NutritionSettings.tsx`
    - Display all current profile fields with edit capability
    - Validation: age 13-120, height 50-300, weight 20-500, target weight 20-500, duration 1-52
    - Save triggers useNutritionStore.updateProfile → recalculate → show confirmation
    - Error handling: validation errors prevent save, recalculation failure retains old targets
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [x] 10. Implement external service integrations
  - [x] 10.1 Create `src/lib/usdaApi.ts` for USDA FoodData Central API
    - Implement `searchUsda(query): Promise<UsdaSearchResult[]>` calling api.nal.usda.gov/fdc/v1/foods/search
    - Parse response to extract food name, serving size, calories, protein, carbs, fat
    - 3-second timeout, return empty array on failure
    - Rate limit awareness (1000/hr), return empty on limit reached
    - _Requirements: 18.3, 18.4, 18.6, 18.10_

  - [x] 10.2 Create `src/lib/foodScanner.ts` for AI food recognition
    - Implement `analyzeFoodPhoto(imageBase64): Promise<ScannedFoodItem[]>` calling Supabase Edge Function
    - 30-second timeout, throw on timeout
    - Return array of detected items with name, calories, protein, carbs, fat, confidence
    - _Requirements: 14.3, 14.5_

  - [x] 10.3 Implement food search integration in QuickAddSheet
    - Query Supabase food_items table first (text search)
    - Query USDA API in parallel
    - Merge results: local first, USDA below with badge
    - Cache USDA results to food_items table on selection
    - Support Indonesian-English translation via food_translations table
    - Offline mode: local results only with indicator
    - _Requirements: 18.3, 18.4, 18.5, 18.7, 18.8, 18.9_

  - [ ]* 10.4 Write unit tests for usdaApi and foodScanner
    - Test USDA response parsing
    - Test timeout handling
    - Test rate limit fallback
    - Test food scanner timeout and error states
    - _Requirements: 18.6, 18.10, 14.4, 14.8_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project uses TypeScript, React, Zustand, Supabase, Vitest, and fast-check (all already in package.json)
- Engine functions follow the existing `src/engines/` pattern (statsEngine.ts, xpEngine.ts)
- Stores follow the existing Zustand persist pattern (useHabitStore)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.5", "2.6", "4.1", "4.2"] },
    { "id": 3, "tasks": ["4.3", "4.4", "5.1", "6.1"] },
    { "id": 4, "tasks": ["5.2", "6.2", "6.3"] },
    { "id": 5, "tasks": ["6.4", "8.1"] },
    { "id": 6, "tasks": ["8.2", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 7, "tasks": ["9.1", "9.2", "9.3", "10.1", "10.2"] },
    { "id": 8, "tasks": ["10.3", "10.4"] }
  ]
}
```
