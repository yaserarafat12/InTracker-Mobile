# Requirements Document

## Introduction

The Calorie Tracker feature adds a comprehensive nutrition tracking system to InTracker Mobile. Users complete a multi-step onboarding wizard to configure their body metrics, fitness goals, timeframe, and activity level. The system calculates personalized daily calorie and macronutrient targets using established metabolic equations. Users log food entries via AI-powered search, photo-based food recognition, or manual input. A dashboard displays daily progress with circular calorie rings, macro breakdowns, and weekly charts.

## Glossary

- **Onboarding_Wizard**: The multi-step setup flow (4 steps) that collects user body metrics, fitness goal, timeframe, and activity level to generate a personalized nutrition plan
- **BMR_Calculator**: The module responsible for calculating Basal Metabolic Rate using the Mifflin-St Jeor equation based on sex, weight, height, and age
- **TDEE_Calculator**: The module responsible for calculating Total Daily Energy Expenditure by applying an activity multiplier to the BMR
- **Plan_Generator**: The module responsible for computing daily calorie targets and macro splits based on TDEE, selected goal, and timeframe parameters
- **Calorie_Dashboard**: The main screen displaying daily calorie progress, macro breakdown, weekly chart, and food log entries
- **Food_Logger**: The module responsible for creating, storing, and retrieving food log entries associated with a specific date and meal type
- **AI_Food_Search**: The module responsible for searching food items by keyword using a hybrid approach (Supabase local database + USDA FoodData Central API + AI for photo scan) and returning nutritional data (calories, protein, carbs, fat, serving size)
- **Food_Database**: The Supabase table containing common food items with verified nutritional data, organized by categories (protein sources, grains, vegetables, fruits, dairy, snacks, beverages, Indonesian foods), seeded with 500+ items and expanded via USDA API caching
- **USDA_API**: The free USDA FoodData Central REST API (api.nal.usda.gov) providing access to 300k+ food items with nutritional data, rate limited to 1000 requests per hour, requiring only a free API key
- **Food_Scanner**: The module responsible for analyzing food photos using AI to detect food items and estimate their nutritional content
- **Meal_Type**: One of four meal categories: Breakfast, Lunch, Dinner, Snack
- **Macro_Target**: The daily gram targets for protein, carbs, and fat calculated by the Plan_Generator
- **Activity_Level**: One of five activity classifications: Sedentary (1.2), Lightly Active (1.375), Moderately Active (1.55), Very Active (1.725), Extremely Active (1.9)
- **Fitness_Goal**: One of six goal options that determines calorie adjustment: Lose Fat Keep Muscle, Aggressive Fat Loss, Lean Bulk, Bulk, Body Recomposition, Maintain Weight
- **Dietary_Preference**: One of five dietary options: No Preference, Vegetarian, Vegan, Keto, Paleo
- **Food_Entry**: A single logged food item containing food name, calories, protein, carbs, fat, meal type, and date
- **User_Profile**: The stored onboarding data including sex, height, weight, age, goal, activity level, dietary preference, target weight, and duration

## Requirements

### Requirement 1: Onboarding Step 1 — Body Metrics Collection

**User Story:** As a user, I want to input my body metrics (sex, height, weight, age), so that the system can calculate my metabolic rate accurately.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL display Step 1 "About You" with input fields for sex (Male/Female toggle), height (in cm, accepting integer values only), weight (in kg, accepting up to one decimal place), and age (in years, accepting integer values only)
2. WHEN the user selects a sex option, THE Onboarding_Wizard SHALL visually distinguish the selected option from the unselected option and store the value as "male" or "female"
3. THE Onboarding_Wizard SHALL accept height values between 100 and 250 cm inclusive, weight values between 30.0 and 300.0 kg inclusive, and age values between 13 and 100 years inclusive
4. IF the user attempts to proceed without providing all four fields (sex, height, weight, age), THEN THE Onboarding_Wizard SHALL prevent navigation to Step 2 and display a validation indicator adjacent to each missing field
5. IF the user enters a value outside the accepted range for height, weight, or age, THEN THE Onboarding_Wizard SHALL display a validation error message adjacent to the out-of-range field indicating the acceptable range
6. IF the user enters non-numeric characters in the height, weight, or age fields, THEN THE Onboarding_Wizard SHALL prevent those characters from being entered into the field
7. WHEN the user navigates back to Step 1 from a subsequent step, THE Onboarding_Wizard SHALL retain and display all previously entered body metric values

### Requirement 2: Onboarding Step 2 — Fitness Goal Selection

**User Story:** As a user, I want to select my fitness goal, so that the system adjusts my calorie targets to match my objective.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL display Step 2 "Your Goal" with six selectable goal options: Lose Fat Keep Muscle, Aggressive Fat Loss, Lean Bulk, Bulk, Body Recomposition, and Maintain Weight
2. THE Onboarding_Wizard SHALL display a brief description for each goal option: "moderate deficit with high protein" for Lose Fat Keep Muscle, "larger deficit, maximum protein" for Aggressive Fat Loss, "small surplus, gain muscle with minimal fat" for Lean Bulk, "larger surplus for maximum muscle growth" for Bulk, "maintenance calories with high protein" for Body Recomposition, and "keep current weight and body composition" for Maintain Weight
3. WHEN the user selects a goal option, THE Onboarding_Wizard SHALL visually distinguish the selected option from unselected options, deselect any previously selected option so that exactly one goal is selected at a time, and store the corresponding Fitness_Goal value
4. IF the user attempts to proceed without selecting a goal, THEN THE Onboarding_Wizard SHALL prevent navigation to Step 3 and display an inline error message indicating that a goal selection is required
5. WHEN the user navigates back to Step 2 from a subsequent step, THE Onboarding_Wizard SHALL display the previously selected goal option in its selected state

### Requirement 3: Onboarding Step 3 — Timeframe Configuration

**User Story:** As a user, I want to set a target weight and duration, so that the system can calculate my required weekly change rate.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL display Step 3 "Timeframe" with an optional target weight input (in kg, accepting up to one decimal place) and a duration selector with options of 4, 8, 12, and 16 weeks
2. WHEN the user has entered a target weight and selected a duration, THE Onboarding_Wizard SHALL display the user's current weight (from Step 1), the entered target weight, and the calculated change per week in kg; IF no target weight has been entered, THEN THE Onboarding_Wizard SHALL display only the current weight and omit the target weight and weekly change rate
3. WHEN the user enters a target weight and selects a duration, THE Onboarding_Wizard SHALL calculate and display the weekly change rate as (target weight minus current weight) divided by the number of weeks, formatted to one decimal place
4. IF the calculated weekly change rate exceeds 1.0 kg loss per week or 0.5 kg gain per week, THEN THE Onboarding_Wizard SHALL display a warning indicating the rate may be aggressive
5. THE Onboarding_Wizard SHALL allow the user to proceed to Step 4 without entering a target weight, treating the plan as open-ended; IF the user enters a target weight, THEN THE Onboarding_Wizard SHALL require a duration selection before allowing navigation to Step 4
6. IF the user enters a target weight outside the range of 30 to 300 kg, THEN THE Onboarding_Wizard SHALL display a validation error for the target weight field and prevent navigation to Step 4

### Requirement 4: Onboarding Step 4 — Activity Level and Dietary Preference

**User Story:** As a user, I want to specify my activity level and dietary preference, so that the system tailors my nutrition plan accordingly.

#### Acceptance Criteria

1. THE Onboarding_Wizard SHALL display Step 4 "Final Details" with an Activity_Level selector (Sedentary, Lightly Active, Moderately Active, Very Active, Extremely Active) and a Dietary_Preference selector (No Preference, Vegetarian, Vegan, Keto, Paleo), with no Activity_Level option pre-selected and Dietary_Preference defaulted to "No Preference"
2. WHEN the user selects an Activity_Level, THE Onboarding_Wizard SHALL store the corresponding multiplier value: 1.2 for Sedentary, 1.375 for Lightly Active, 1.55 for Moderately Active, 1.725 for Very Active, 1.9 for Extremely Active
3. IF the user attempts to proceed without selecting an Activity_Level, THEN THE Onboarding_Wizard SHALL prevent plan generation, visually highlight the Activity_Level field, and display an inline error message indicating that Activity_Level selection is required
4. IF the user does not make a Dietary_Preference selection, THEN THE Onboarding_Wizard SHALL use "No Preference" as the Dietary_Preference value for plan generation
5. WHEN the user presses the "Generate My Plan" button and an Activity_Level has been selected, THE Onboarding_Wizard SHALL trigger the Plan_Generator and display a loading indicator within 200ms of the button press
6. IF the Plan_Generator fails to produce a plan after being triggered, THEN THE Onboarding_Wizard SHALL display an error message indicating plan generation failed and allow the user to retry by pressing the "Generate My Plan" button again without losing their selections

### Requirement 5: BMR Calculation Using Mifflin-St Jeor Equation

**User Story:** As a user, I want my basal metabolic rate calculated accurately, so that my calorie targets reflect my actual energy needs.

#### Acceptance Criteria

1. THE BMR_Calculator SHALL calculate BMR for males using the formula: (10 × weight in kg) + (6.25 × height in cm) − (5 × age in years) + 5
2. THE BMR_Calculator SHALL calculate BMR for females using the formula: (10 × weight in kg) + (6.25 × height in cm) − (5 × age in years) − 161
3. THE BMR_Calculator SHALL accept weight as a decimal value with up to one decimal place in the range 20.0 to 300.0 kg, height as an integer in the range 100 to 250 cm, and age as an integer in the range 13 to 120 years
4. THE BMR_Calculator SHALL return the BMR result as a whole number in kcal/day, rounded to the nearest integer using round-half-up
5. IF weight, height, or age is outside the accepted range or not provided, THEN THE BMR_Calculator SHALL reject the input and not return a BMR result, indicating which field failed validation
6. IF sex is not specified or is a value other than male or female, THEN THE BMR_Calculator SHALL reject the input and not return a BMR result, indicating that a valid sex selection is required

### Requirement 6: TDEE Calculation

**User Story:** As a user, I want my total daily energy expenditure calculated from my BMR and activity level, so that my calorie target accounts for my lifestyle.

#### Acceptance Criteria

1. WHEN the BMR_Calculator produces a BMR value, THE TDEE_Calculator SHALL multiply the BMR by the user's selected Activity_Level multiplier to produce the TDEE value
2. THE TDEE_Calculator SHALL return the TDEE result as a whole number rounded to the nearest integer using round-half-up
3. THE TDEE_Calculator SHALL use the multiplier values: 1.2 for Sedentary, 1.375 for Lightly Active, 1.55 for Moderately Active, 1.725 for Very Active, 1.9 for Extremely Active
4. IF the Activity_Level multiplier is not one of the five defined values (1.2, 1.375, 1.55, 1.725, 1.9), THEN THE TDEE_Calculator SHALL reject the input and not return a TDEE result

### Requirement 7: Daily Calorie Target Based on Goal

**User Story:** As a user, I want my daily calorie target adjusted for my fitness goal, so that I eat the right amount to achieve my objective.

#### Acceptance Criteria

1. WHEN the Fitness_Goal is "Lose Fat Keep Muscle", THE Plan_Generator SHALL set the daily calorie target to TDEE minus 20 percent
2. WHEN the Fitness_Goal is "Aggressive Fat Loss", THE Plan_Generator SHALL set the daily calorie target to TDEE minus 30 percent
3. WHEN the Fitness_Goal is "Lean Bulk", THE Plan_Generator SHALL set the daily calorie target to TDEE plus 10 percent
4. WHEN the Fitness_Goal is "Bulk", THE Plan_Generator SHALL set the daily calorie target to TDEE plus 20 percent
5. WHEN the Fitness_Goal is "Body Recomposition", THE Plan_Generator SHALL set the daily calorie target equal to TDEE
6. WHEN the Fitness_Goal is "Maintain Weight", THE Plan_Generator SHALL set the daily calorie target equal to TDEE
7. THE Plan_Generator SHALL apply the calorie floor check first, then round the daily calorie target to the nearest whole number as the final step
8. IF the calculated daily calorie target falls below 1200 for users with sex set to female or below 1500 for users with sex set to male, THEN THE Plan_Generator SHALL set the daily calorie target to the minimum floor value (1200 for female, 1500 for male)
9. IF the calculated daily calorie target exceeds 5000, THEN THE Plan_Generator SHALL cap the daily calorie target at 5000
10. IF the Fitness_Goal does not match any of the six defined values ("Lose Fat Keep Muscle", "Aggressive Fat Loss", "Lean Bulk", "Bulk", "Body Recomposition", "Maintain Weight"), THEN THE Plan_Generator SHALL reject the calculation and return an error indicating an invalid fitness goal

### Requirement 8: Macronutrient Target Calculation

**User Story:** As a user, I want daily protein, carbs, and fat targets in grams, so that I can track my macronutrient balance.

#### Acceptance Criteria

1. WHEN the Dietary_Preference is "No Preference" or "Vegetarian" or "Vegan", THE Plan_Generator SHALL calculate macros using a balanced split: protein at 30 percent of daily calories, carbs at 40 percent of daily calories, fat at 30 percent of daily calories
2. WHEN the Dietary_Preference is "Keto", THE Plan_Generator SHALL calculate macros using: protein at 25 percent of daily calories, carbs at 5 percent of daily calories, fat at 70 percent of daily calories
3. WHEN the Dietary_Preference is "Paleo", THE Plan_Generator SHALL calculate macros using: protein at 35 percent of daily calories, carbs at 25 percent of daily calories, fat at 40 percent of daily calories
4. WHEN the Fitness_Goal is "Lose Fat Keep Muscle" or "Aggressive Fat Loss" or "Body Recomposition", THE Plan_Generator SHALL increase the protein percentage by 5 percentage points and reduce the carbs percentage by 5 percentage points from the base split determined by Dietary_Preference; WHEN the Fitness_Goal is any other value, THE Plan_Generator SHALL use the base split from the Dietary_Preference without modification
5. THE Plan_Generator SHALL convert calorie percentages to grams using: protein grams = (calories × percentage) / 4, carbs grams = (calories × percentage) / 4, fat grams = (calories × percentage) / 9
6. THE Plan_Generator SHALL return all macro targets as whole numbers rounded to the nearest integer
7. THE Plan_Generator SHALL verify that the sum of macro calories (protein grams × 4 + carbs grams × 4 + fat grams × 9) is within 10 calories of the daily calorie target; IF the sum deviates by more than 10 calories, THEN THE Plan_Generator SHALL adjust the carbs gram value up or down by 1 gram and re-verify until the sum is within the 10-calorie tolerance
8. IF the Dietary_Preference is not one of "No Preference", "Vegetarian", "Vegan", "Keto", or "Paleo", THEN THE Plan_Generator SHALL default to the balanced split (protein 30 percent, carbs 40 percent, fat 30 percent)

### Requirement 9: User Profile Persistence

**User Story:** As a user, I want my onboarding data and calculated plan saved, so that I do not need to repeat the setup process.

#### Acceptance Criteria

1. WHEN the user completes the Onboarding_Wizard and the Plan_Generator produces results, THE Food_Logger SHALL store the User_Profile (sex, height, weight, age, goal, activity level, dietary preference, target weight, duration) and calculated targets (daily calories, protein, carbs, fat) in both Local_State and Supabase
2. WHEN the app launches and a User_Profile exists in Local_State, THE Calorie_Dashboard SHALL render the stored targets within 500ms of app launch without requiring re-onboarding
3. IF no User_Profile exists in Local_State or Supabase for the current user, THEN THE app SHALL navigate to the Onboarding_Wizard
4. WHEN the user modifies any calculation-affecting profile field (weight, height, age, goal, activity level, target weight, or duration), THE Plan_Generator SHALL recalculate all targets (daily calories, protein, carbs, fat) and update both Local_State and Supabase within 5 seconds
5. IF the app launches and no User_Profile exists in Local_State but a User_Profile exists in Supabase for the current user, THEN THE Food_Logger SHALL restore the User_Profile from Supabase into Local_State and display the Calorie_Dashboard without requiring re-onboarding
6. IF the initial User_Profile save to Supabase fails after onboarding completion, THEN THE Food_Logger SHALL retain the User_Profile in Local_State and retry the Supabase write on the next sync opportunity, allowing the user to proceed to the Calorie_Dashboard without interruption

### Requirement 10: Calorie Dashboard — Daily Progress Display

**User Story:** As a user, I want to see my daily calorie progress at a glance, so that I know how much I can still eat today.

#### Acceptance Criteria

1. THE Calorie_Dashboard SHALL display a circular progress ring whose fill percentage equals (total calories consumed for the current date divided by the daily calorie target) multiplied by 100, capped at 100 percent fill, with the consumed calorie value displayed numerically in the center and the daily calorie target displayed below it
2. THE Calorie_Dashboard SHALL display "X calories remaining" below the progress ring, calculated as daily calorie target minus total calories consumed for the current date; WHEN no Food_Entry records exist for the current date, THE Calorie_Dashboard SHALL display the full daily calorie target as the remaining value and show zero as the consumed value
3. THE Calorie_Dashboard SHALL display macro progress bars for Protein, Carbs, and Fat, each showing grams consumed versus the gram target with the bar fill percentage calculated as (grams consumed divided by gram target) multiplied by 100; WHEN a macro's consumed grams exceed its gram target, THE Calorie_Dashboard SHALL fill the bar to 100 percent and visually indicate the over-target status
4. WHEN the user has consumed more calories than the daily target, THE Calorie_Dashboard SHALL display the remaining calories as a negative value and change the progress ring color to indicate over-target status
5. WHEN a new Food_Entry is added or removed, THE Calorie_Dashboard SHALL update all displayed values (calories consumed, calories remaining, progress ring fill, and all three macro progress bars) within 500 milliseconds

### Requirement 11: Date Navigation

**User Story:** As a user, I want to navigate between days, so that I can review past food logs or pre-log future meals.

#### Acceptance Criteria

1. THE Calorie_Dashboard SHALL display the currently selected date with left and right arrow buttons for navigating to the previous and next day
2. WHEN the user taps the left arrow, THE Calorie_Dashboard SHALL display the food log and progress for the previous calendar day
3. WHEN the user taps the right arrow, THE Calorie_Dashboard SHALL display the food log and progress for the next calendar day
4. WHEN the Calorie_Dashboard is first opened or the app returns from background, THE Calorie_Dashboard SHALL set the selected date to the current device date and display that day's food log and progress
5. IF the user navigates to a day that contains no food log entries, THEN THE Calorie_Dashboard SHALL display the empty day with zero consumed calories and an empty food list while still showing the daily calorie goal and navigation controls
6. THE Calorie_Dashboard SHALL allow navigation up to 90 days in the past and up to 7 days in the future from the current device date; IF the selected date is at the boundary of the navigable range, THEN THE Calorie_Dashboard SHALL disable the corresponding arrow button

### Requirement 12: Weekly Calorie Chart

**User Story:** As a user, I want to see my weekly calorie intake trend, so that I can assess my consistency over the week.

#### Acceptance Criteria

1. THE Calorie_Dashboard SHALL display a "This Week" section with a bar chart showing daily calorie intake for Monday through Sunday of the week containing the currently selected date (as determined by date navigation)
2. THE Calorie_Dashboard SHALL display the average calories per day (total calories across all days with at least one Food_Entry divided by the number of such days) and the number of days logged (days with at least one Food_Entry) as summary statistics below the chart
3. WHEN a day has no logged Food_Entry records, THE Calorie_Dashboard SHALL display a zero-height bar for that day in the chart and exclude that day from the average calories calculation
4. THE Calorie_Dashboard SHALL visually differentiate the current device date's bar from other days' bars in the weekly chart using a distinct fill color
5. WHEN the user navigates to a date in a different week via the date navigation arrows, THE Calorie_Dashboard SHALL update the weekly chart to display Monday through Sunday of the navigated week
6. IF all seven days of the displayed week have no logged Food_Entry records, THEN THE Calorie_Dashboard SHALL display zero-height bars for all days and show the average as 0 and days logged as 0

### Requirement 13: Food Entry via Quick Add

**User Story:** As a user, I want to quickly add food entries by searching or manual input, so that logging meals is fast and convenient.

#### Acceptance Criteria

1. WHEN the user taps the "+ Quick Add" button, THE Food_Logger SHALL display a bottom sheet with a Meal_Type selector (Breakfast, Lunch, Dinner, Snack), a food search field, and manual entry fields
2. WHEN the user types at least 2 characters in the search field, THE AI_Food_Search SHALL return a maximum of 20 matching food items within 3 seconds, displaying food name, serving size, and macros (protein, carbs, fat) for each result; IF no matching food items are found, THEN THE AI_Food_Search SHALL display a message indicating no results were found
3. WHEN the user taps "Apply" on a search result, THE Food_Logger SHALL populate the entry fields with the selected food's nutritional data, and the user SHALL be able to edit any pre-populated field before submitting
4. THE Food_Logger SHALL provide manual entry fields for: Food Name (text, maximum 100 characters), Calories (number, 1 to 99999), Protein in grams (number, 0 to 9999), Carbs in grams (number, 0 to 9999), and Fat in grams (number, 0 to 9999)
5. WHEN the user taps "Add Entry" with at least a food name and calorie value provided, THE Food_Logger SHALL create a Food_Entry for the selected date and Meal_Type and update the Calorie_Dashboard totals
6. IF the user taps "Add Entry" without providing a food name or calorie value, THEN THE Food_Logger SHALL display an inline validation error indicating which required field is missing and prevent the entry from being created
7. THE Food_Logger SHALL default the Meal_Type based on the current time of day: Breakfast before 11:00, Lunch between 11:00 and 14:59, Dinner between 15:00 and 20:59, Snack after 21:00
8. IF the AI_Food_Search fails to respond within 3 seconds or is unreachable, THEN THE Food_Logger SHALL display a message indicating the search is unavailable and allow the user to continue with manual entry

### Requirement 14: Food Entry via Photo Scan

**User Story:** As a user, I want to scan food with my camera, so that I can log meals without manually searching or typing.

#### Acceptance Criteria

1. WHEN the user taps the "Scan Food" button, THE Food_Scanner SHALL display a screen with options to capture a photo using the device camera or select a photo from the device library
2. THE Food_Scanner SHALL display a Meal_Type selector (Breakfast, Lunch, Dinner, Snack) on the scan screen, with the default selection set based on the current local time: Breakfast (05:00–10:59), Lunch (11:00–13:59), Dinner (14:00–20:59), Snack (21:00–04:59)
3. WHEN the user captures or selects a photo and taps "Analyze Food", THE Food_Scanner SHALL send the image to the AI food recognition service, display a loading indicator during processing, and enforce a maximum processing timeout of 30 seconds
4. IF the AI food recognition service does not respond within 30 seconds, THEN THE Food_Scanner SHALL cancel the request, hide the loading indicator, and display an error message indicating the request timed out with the option to retry or use Quick Add instead
5. WHEN the AI food recognition service returns results, THE Food_Scanner SHALL display up to 10 detected food items, each showing the item name, estimated calories (whole number in kcal), protein (one decimal in grams), carbs (one decimal in grams), and fat (one decimal in grams), with each item individually selectable via a checkbox defaulting to selected
6. WHEN the user confirms the detected food items, THE Food_Scanner SHALL create Food_Entry records only for items that remain selected (checked), associating each with the chosen Meal_Type and current date
7. IF the user taps confirm with no items selected, THEN THE Food_Scanner SHALL display a message indicating at least one item must be selected and SHALL NOT create any Food_Entry records
8. IF the AI food recognition service fails to detect food in the image, THEN THE Food_Scanner SHALL display a message indicating no food was detected and offer the option to retry or use Quick Add instead
9. IF the AI food recognition service is unreachable, THEN THE Food_Scanner SHALL display an error message and offer the option to use Quick Add as a fallback
10. IF the selected image file exceeds 10 MB in size, THEN THE Food_Scanner SHALL display a message indicating the image is too large and SHALL NOT send the image to the AI food recognition service

### Requirement 15: Today's Food Log Display

**User Story:** As a user, I want to see all food entries for the selected day grouped by meal, so that I can review what I have eaten.

#### Acceptance Criteria

1. THE Calorie_Dashboard SHALL display a "Today's Food" section listing all Food_Entry records for the selected date, grouped by Meal_Type in the fixed order: Breakfast, Lunch, Dinner, Snack
2. THE Calorie_Dashboard SHALL display each Food_Entry with its food name and calorie value (as a whole number in kcal)
3. WHEN the user taps on a Food_Entry, THE Food_Logger SHALL display a delete confirmation prompt before removing the entry
4. WHEN the user confirms deletion of a Food_Entry, THE Calorie_Dashboard SHALL recalculate and update the daily totals for calories and macros within 100ms
5. IF no Food_Entry records exist for the selected date, THEN THE Calorie_Dashboard SHALL display an empty state message in the "Today's Food" section indicating no food has been logged
6. THE Calorie_Dashboard SHALL only display Meal_Type group headers for groups that contain at least one Food_Entry for the selected date

### Requirement 16: Food Entry Data Persistence

**User Story:** As a user, I want my food log saved reliably, so that my tracking history is preserved across sessions.

#### Acceptance Criteria

1. WHEN a Food_Entry is created, THE Food_Logger SHALL store the entry in Local_State within 100ms and sync to Supabase within 30 seconds of creation
2. THE Food_Logger SHALL store each Food_Entry with: unique ID, user ID, date, Meal_Type, food name (1 to 100 characters), calories (0 to 99999 kcal), protein grams (0 to 9999.9g), carbs grams (0 to 9999.9g), fat grams (0 to 9999.9g), and creation timestamp
3. WHEN the app launches, THE Food_Logger SHALL load Food_Entry records for the current date from Local_State within 100ms for display, then reconcile with Supabase data when connectivity is available by merging entries from both sources using unique ID as the key: entries present in Supabase but not locally SHALL be added locally, entries marked as deleted locally SHALL remain deleted, and entries present in both SHALL retain the most recent creation timestamp version
4. IF a sync to Supabase fails, THEN THE Food_Logger SHALL retain the Food_Entry in Local_State and retry sync when the next Food_Entry is created, when the next Food_Entry is deleted, or when the app next launches, up to a maximum of 5 consecutive retry attempts per entry
5. IF all 5 retry attempts for a Food_Entry sync fail, THEN THE Food_Logger SHALL retain the entry in Local_State and resume sync attempts when the next app launch triggers reconciliation
6. WHEN a Food_Entry is deleted locally, THE Food_Logger SHALL mark the entry as deleted in Local_State and propagate the deletion to Supabase on the next sync within 30 seconds

### Requirement 17: Settings Access

**User Story:** As a user, I want to access settings to modify my profile or plan, so that I can adjust my targets as my body or goals change.

#### Acceptance Criteria

1. THE Calorie_Dashboard SHALL display a settings gear icon in the top-right corner
2. WHEN the user taps the settings icon, THE app SHALL navigate to a settings screen within 500ms, displaying the current User_Profile values (sex, height, weight, age, goal, activity level, dietary preference, target weight, duration) and the calculated daily calorie and macro targets
3. THE settings screen SHALL allow the user to modify any onboarding field (sex, height, weight, age, goal, activity level, dietary preference, target weight, duration) with input validation enforcing: age between 13 and 120 years, height between 50 and 300 cm, weight between 20 and 500 kg, target weight between 20 and 500 kg, and duration between 1 and 52 weeks
4. WHEN the user saves modified settings, THE Plan_Generator SHALL recalculate daily calorie and macro targets and update the Calorie_Dashboard within 2 seconds, and the app SHALL display a confirmation indicating the settings were saved successfully
5. IF the user attempts to save settings with one or more fields failing validation, THEN THE app SHALL prevent the save operation and display an error indication identifying each invalid field
6. IF the Plan_Generator fails to recalculate targets after a save, THEN THE app SHALL retain the previously stored targets on the Calorie_Dashboard, display an error indication that recalculation failed, and preserve the user's modified field values so they can retry without re-entering data

### Requirement 18: Food Database and Nutritional Data Source

**User Story:** As a user, I want accurate nutritional data for common foods available instantly, so that I can log meals quickly without relying solely on internet connectivity.

#### Acceptance Criteria

1. THE Food_Database SHALL contain a minimum of 500 pre-seeded food items in Supabase organized into categories: Protein Sources (chicken breast, chicken thigh, beef, fish, eggs, tofu, tempeh), Grains (white rice, brown rice, basmati rice, oats, bread, noodles), Vegetables, Fruits, Dairy, Snacks, Beverages, and Indonesian Foods (nasi goreng, mie goreng, rendang, soto, gado-gado, bakso, sate)
2. THE Food_Database SHALL store each food item with: food name, category, serving size description, serving weight in grams, calories per serving, protein grams per serving, carbs grams per serving, fat grams per serving, and data source (seed, usda, or ai)
3. WHEN the user searches in Quick Add, THE AI_Food_Search SHALL first query the Supabase Food_Database for matches using text search; IF local results are found, THEN THE AI_Food_Search SHALL display local results immediately while simultaneously querying the USDA FoodData Central API for additional results
4. WHEN the USDA API returns results not present in the Food_Database, THE AI_Food_Search SHALL merge USDA results below the local results, visually distinguishing them with a "USDA" badge
5. IF the device has no internet connectivity, THEN THE AI_Food_Search SHALL return results exclusively from the Supabase Food_Database (cached locally) and display a subtle indicator that results are from offline data only
6. THE AI_Food_Search SHALL call the USDA FoodData Central API at endpoint api.nal.usda.gov/fdc/v1/foods/search with the user's search query, parsing the response to extract food name, serving size, calories, protein, carbs, and fat per serving
7. THE AI_Food_Search SHALL support search queries in both English and Bahasa Indonesia (e.g., "ayam" maps to "chicken", "nasi" maps to "rice") by maintaining a translation lookup table for common Indonesian food terms
8. WHEN the user adds a Food_Entry from a USDA API result, THE Food_Database SHALL cache that item in Supabase so subsequent searches for the same food return instant results without requiring another API call
9. THE Food_Database SHALL store cached USDA results with no eviction limit, growing the database over time as users search for new foods
10. THE AI_Food_Search SHALL respect the USDA API rate limit of 1000 requests per hour; IF the rate limit is reached, THEN THE AI_Food_Search SHALL return only local Food_Database results and display a message indicating external search is temporarily unavailable

### Requirement 19: Age-Adjusted Nutritional Recommendations

**User Story:** As a user, I want my nutritional targets adjusted for my age group, so that my plan accounts for age-specific metabolic and nutritional needs.

#### Acceptance Criteria

1. THE Plan_Generator SHALL apply age-based protein adjustment: for users aged 13 to 17, increase protein percentage by 5 percentage points from the base split; for users aged 50 and above, increase protein percentage by 5 percentage points from the base split to support muscle preservation; for users aged 18 to 49, use the base protein percentage without age adjustment
2. WHEN the age-based protein adjustment increases the protein percentage, THE Plan_Generator SHALL reduce the carbs percentage by the same number of percentage points to maintain a 100 percent total macro split
3. THE Plan_Generator SHALL apply the age-based adjustment after the Fitness_Goal adjustment (Requirement 8, criterion 4), stacking both adjustments if applicable; the combined protein increase from goal and age adjustments SHALL NOT exceed 15 percentage points above the base split
4. IF the combined protein increase from goal and age adjustments would exceed 15 percentage points, THEN THE Plan_Generator SHALL cap the protein increase at 15 percentage points and reduce carbs accordingly
5. THE Plan_Generator SHALL enforce minimum carbs percentage of 10 percent regardless of combined adjustments; IF adjustments would reduce carbs below 10 percent, THEN THE Plan_Generator SHALL cap the carbs at 10 percent and reduce the protein increase to maintain a 100 percent total
6. FOR users aged 13 to 17, THE Plan_Generator SHALL enforce a minimum daily calorie target of 1600 for males and 1400 for females, overriding the standard floor values in Requirement 7
