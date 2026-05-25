# Requirements Document

## Introduction

The Features Tools Page is a mini-tools hub accessible from the "Features" tab in the InTracker Mobile app. It provides users with a grid of interactive tool cards that open full-screen tool views. The hub contains five tools: Pomodoro Timer, Workout Counter, Deep Breathing, Book Summary (Perpustakaan), and Screen Blocker (Coming Soon placeholder). Tools that involve completing sessions award XP via the existing progression system. The page follows the app's premium dark theme with green accent styling.

## Glossary

- **Tools_Hub**: The main grid page displayed at the `/features` route, showing all available tool cards in a 2-column layout
- **Tool_Card**: A tappable card in the Tools_Hub grid displaying a background image, tool name, and short description
- **Pomodoro_Timer**: A focus timer tool with customizable duration, countdown display, and session completion XP reward
- **Workout_Counter**: A workout session tool allowing users to select exercises, configure reps/time/sets, and track progress with XP reward
- **Deep_Breathing**: A box breathing exercise tool with animated visual guide and session completion XP reward
- **Book_Summary**: A static library of book summaries organized by category with reading progress tracking
- **Screen_Blocker**: A placeholder tool card indicating a feature under development
- **Session**: A completed run of a tool (timer elapsed, workout finished, breathing exercise completed) that qualifies for XP reward
- **Exercise_Entry**: A single exercise configuration within a Workout_Counter session containing exercise name, reps, time in seconds, and number of sets
- **Weekly_Progress_Grid**: A Mon-Sun visual grid in the Workout_Counter showing which days the user completed workout sessions
- **Breathing_Phase**: One of the four phases in box breathing: Inhale, Hold, Exhale, Hold (each lasting 4 seconds)

## Requirements

### Requirement 1: Tools Hub Page Layout

**User Story:** As a user, I want to see all available tools in a visually appealing grid when I open the Features tab, so that I can quickly find and access the tool I need.

#### Acceptance Criteria

1. WHEN the user navigates to the `/features` route, THE Tools_Hub SHALL display all tool cards in a 2-column grid layout
2. THE Tools_Hub SHALL display each Tool_Card with a background image, tool name, and short description text
3. THE Tools_Hub SHALL display a "Send a suggestion" card as the last item in the grid
4. THE Tools_Hub SHALL apply the app's dark theme using background color #141518 or #1c1e22, green accent #00FF85, and Outfit font family
5. WHEN a user taps a Tool_Card, THE Tools_Hub SHALL navigate to the corresponding tool's full-screen view
6. WHEN a user taps the "Send a suggestion" card, THE Tools_Hub SHALL provide a mechanism for the user to submit feedback

### Requirement 2: Pomodoro Timer Tool

**User Story:** As a user, I want a focus timer with customizable duration, so that I can maintain concentration during work sessions and earn XP for completing them.

#### Acceptance Criteria

1. WHEN the user opens the Pomodoro_Timer, THE Pomodoro_Timer SHALL display a full-screen view with a large countdown in MM:SS format and an anime-style background image
2. THE Pomodoro_Timer SHALL provide a scroll picker for selecting focus duration from the following options: 15, 25, 30, 45, 60, 75, and 90 minutes
3. WHEN the user taps the Start control, THE Pomodoro_Timer SHALL begin counting down from the selected duration
4. WHILE the Pomodoro_Timer is running, THE Pomodoro_Timer SHALL display Pause and Stop controls
5. WHEN the user taps Pause, THE Pomodoro_Timer SHALL freeze the countdown at the current remaining time and display a Resume control
6. WHEN the user taps Stop, THE Pomodoro_Timer SHALL reset the countdown to the selected duration and return to the idle state without awarding XP
7. WHEN the countdown reaches 00:00, THE Pomodoro_Timer SHALL trigger device vibration and play a notification sound
8. WHEN the countdown reaches 00:00, THE Pomodoro_Timer SHALL award XP by calling the progression store's feed interaction method
9. WHEN a focus session completes, THE Pomodoro_Timer SHALL offer an optional 5-minute break timer

### Requirement 3: Workout Counter Tool

**User Story:** As a user, I want to configure and track workout sessions with multiple exercises, so that I can follow structured routines and earn XP for completing them.

#### Acceptance Criteria

1. WHEN the user opens the Workout_Counter, THE Workout_Counter SHALL display options to "Start a new session" and view "All workouts" (history)
2. THE Workout_Counter SHALL provide a list of selectable exercises limited to: Push-Up, Sit-Up, Plank, Lari, Yoga, Stretching, Lompat Tali, Squat, and Burpee
3. WHEN the user selects an exercise, THE Workout_Counter SHALL allow configuration of Reps (count), Time (seconds), and Sets (count) for that exercise
4. THE Workout_Counter SHALL allow the user to select multiple exercises for a single session
5. WHEN the user starts a workout session, THE Workout_Counter SHALL display a timer countdown per exercise with set tracking showing the current set number out of total sets (e.g., "Set 1/3")
6. WHEN all exercises and sets in a session are completed, THE Workout_Counter SHALL award XP by calling the progression store's feed interaction method
7. THE Workout_Counter SHALL display a Weekly_Progress_Grid showing Monday through Sunday with visual indicators for days that had completed workout sessions
8. THE Workout_Counter SHALL display an anime-style background image in the full-screen view
9. WHEN the user taps "All workouts", THE Workout_Counter SHALL display a history of previously completed workout sessions

### Requirement 4: Deep Breathing Tool

**User Story:** As a user, I want a guided box breathing exercise with visual animation, so that I can practice calming techniques and earn XP for completing a session.

#### Acceptance Criteria

1. WHEN the user opens the Deep_Breathing tool, THE Deep_Breathing SHALL display a full-screen animated breathing guide with a blue/teal gradient color theme
2. THE Deep_Breathing SHALL implement box breathing with a fixed pattern of Inhale 4 seconds, Hold 4 seconds, Exhale 4 seconds, Hold 4 seconds
3. THE Deep_Breathing SHALL display an animated circle or shape that expands during Inhale, holds size during Hold, contracts during Exhale, and holds size during the second Hold
4. THE Deep_Breathing SHALL display a step indicator showing the current Breathing_Phase name (Inhale, Hold, Exhale, or Hold)
5. THE Deep_Breathing SHALL display a timer showing total exercise duration with a default session length of 3 minutes
6. WHEN the total exercise duration reaches the session length, THE Deep_Breathing SHALL end the session and award XP by calling the progression store's feed interaction method
7. WHEN the breathing session is active, THE Deep_Breathing SHALL cycle through the four Breathing_Phases continuously until the session ends

### Requirement 5: Book Summary (Perpustakaan) Tool

**User Story:** As a user, I want to browse and read book summaries organized by category, so that I can learn from curated content within the app.

#### Acceptance Criteria

1. WHEN the user opens the Book_Summary tool, THE Book_Summary SHALL display a library of book cards organized by category
2. THE Book_Summary SHALL support the following categories: Psychology, Productivity, Wealth, Philosophy, Personal Development, Leadership, and Life
3. THE Book_Summary SHALL display each book card with a cover image, title, author, star rating, and estimated reading time in minutes
4. WHEN the user taps "Start reading" on a book card, THE Book_Summary SHALL open the full summary text for that book
5. THE Book_Summary SHALL provide filter tabs for Recommended, Done, and a Category dropdown
6. THE Book_Summary SHALL load all book data from a static JSON or TypeScript file without requiring backend API calls
7. WHEN the user marks a book as "Done", THE Book_Summary SHALL persist that status and display the book under the Done filter tab
8. THE Book_Summary SHALL apply premium card design styling with anime-style cover art placeholders

### Requirement 6: Screen Blocker Placeholder

**User Story:** As a user, I want to see that a Screen Blocker feature is planned, so that I know it will be available in the future.

#### Acceptance Criteria

1. THE Tools_Hub SHALL display a Screen_Blocker Tool_Card in the grid with a "Coming Soon" label
2. WHEN the user taps the Screen_Blocker card, THE Tools_Hub SHALL display a modal explaining that the feature is currently in development
3. THE Screen_Blocker card SHALL be visually distinct from active tool cards to indicate its unavailable status

### Requirement 7: XP Award on Tool Session Completion

**User Story:** As a user, I want to earn XP when I complete tool sessions, so that using the tools contributes to my overall progression.

#### Acceptance Criteria

1. WHEN a Pomodoro_Timer session countdown reaches 00:00, THE Pomodoro_Timer SHALL call `useProgressionStore.getState().awardFeedInteraction()` to award XP
2. WHEN a Workout_Counter session completes all configured exercises and sets, THE Workout_Counter SHALL call `useProgressionStore.getState().awardFeedInteraction()` to award XP
3. WHEN a Deep_Breathing session reaches its total duration, THE Deep_Breathing SHALL call `useProgressionStore.getState().awardFeedInteraction()` to award XP
4. IF the user stops or cancels a session before completion, THEN THE tool SHALL NOT award any XP for that session

### Requirement 8: Visual Assets and Placeholder Images

**User Story:** As a developer, I want a clear list of required image assets with dimensions, so that placeholder images can be replaced with final anime-style art when ready.

#### Acceptance Criteria

1. THE Tools_Hub SHALL require the following Tool_Card background images at 16:9 aspect ratio (recommended 800x450px):
   - `pomodoro_card.png` — Pomodoro Timer card background
   - `workout_card.png` — Workout Counter card background
   - `breathing_card.png` — Deep Breathing card background
   - `book_card.png` — Book Summary card background
   - `blocker_card.png` — Screen Blocker card background
2. THE Pomodoro_Timer SHALL require one full-screen background image at 9:16 aspect ratio (recommended 1080x1920px): `pomodoro_bg.png`
3. THE Workout_Counter SHALL require one full-screen background image at 9:16 aspect ratio (recommended 1080x1920px): `workout_bg.png`
4. THE Book_Summary SHALL require book cover images at 2:3 aspect ratio (recommended 400x600px) for each book entry in the library
5. THE Tools_Hub SHALL use solid color gradient placeholders (#1c1e22 to #141518) for all image slots until final assets are provided
6. WHEN final image assets are provided, THE Tools_Hub SHALL load images from the `public/all_images/features/` directory

### Requirement 9: Tool Component Architecture

**User Story:** As a developer, I want each tool to be its own component file in a dedicated directory, so that the codebase remains organized and maintainable.

#### Acceptance Criteria

1. THE Tools_Hub SHALL render each tool as a separate component file located in `src/mainscreen/features/`
2. THE Tools_Hub SHALL use React Router or equivalent navigation to transition between the grid view and individual tool full-screen views
3. THE Tools_Hub SHALL maintain consistent styling across all tools using Tailwind CSS utility classes with the app's dark theme tokens (#141518, #1c1e22, #00FF85, Outfit font)
4. THE Tools_Hub SHALL use placeholder images for all anime-style background art until final assets are provided by the user
