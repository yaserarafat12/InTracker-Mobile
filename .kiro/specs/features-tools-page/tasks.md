# Implementation Plan: Features Tools Page

## Overview

Replace the existing placeholder "Experimental Laboratory" FeaturesView with a fully functional Tools Hub containing five tool cards in a 2-column grid. Each tool opens a full-screen view: Pomodoro Timer, Workout Counter, Deep Breathing, Book Summary (Perpustakaan), and Screen Blocker (Coming Soon). Tools with completable sessions award XP via `useProgressionStore.getState().awardFeedInteraction()`. Navigation is managed internally via component state (no sub-routes). All components live in `src/mainscreen/features/` with shared hooks, utils, and stores in subdirectories.

## Tasks

- [ ] 1. Set up directory structure, shared utilities, and stores
  - [ ] 1.1 Create the `src/mainscreen/features/` directory with subdirectories `hooks/`, `utils/`, and `stores/`, and implement the `breathingPhase.ts` pure utility function that exports `getBreathingPhase(elapsedSeconds)` returning `{ phase, phaseProgress, cycleCount }`
    - Implement the formula: `phases[Math.floor(elapsed / 4) % 4]` where phases = ['Inhale', 'Hold', 'Exhale', 'Hold2']
    - `phaseProgress` = `(elapsed % 4) / 4` (0-1 float)
    - `cycleCount` = `Math.floor(elapsed / 16)`
    - _Requirements: 4.2, 4.4, 4.7_

  - [ ] 1.2 Implement the `useCountdownTimer` custom hook in `src/mainscreen/features/hooks/useCountdownTimer.ts`
    - Accept `{ initialSeconds, onComplete, onTick? }` options
    - Return `{ remaining, isRunning, isPaused, start, pause, resume, stop, reset }`
    - Use `setInterval` with 1-second tick, cleanup on unmount
    - `stop()` resets to `initialSeconds`, `pause()` freezes, `resume()` continues
    - Call `onComplete()` when remaining reaches 0
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 3.5_

  - [ ] 1.3 Implement `useWorkoutStore` in `src/mainscreen/features/stores/useWorkoutStore.ts`
    - Zustand store with `persist` middleware, key: `'intracker-workout-store'`
    - State: `sessions: WorkoutSession[]`, `weeklyCompleted: Record<string, boolean>`
    - Actions: `addSession(session)`, `getWeeklyProgress(): boolean[]`, `clearHistory()`
    - `getWeeklyProgress` checks sessions against current week's Mon-Sun dates
    - _Requirements: 3.7, 3.9_

  - [ ] 1.4 Implement `useBookStore` in `src/mainscreen/features/stores/useBookStore.ts`
    - Zustand store with `persist` middleware, key: `'intracker-book-store'`
    - State: `completedBookIds: string[]`
    - Actions: `markAsDone(bookId)`, `isBookDone(bookId): boolean`, `getCompletedBooks(): string[]`
    - _Requirements: 5.7_

  - [ ] 1.5 Create the static book data file `src/data/bookSummaries.ts`
    - Export `BOOK_LIBRARY: BookEntry[]` with at least 5-7 sample books across categories
    - Categories: Psychology, Productivity, Wealth, Philosophy, Personal Development, Leadership, Life
    - Each entry: `{ id, title, author, category, rating, readingTimeMinutes, coverImage?, summary }`
    - _Requirements: 5.1, 5.2, 5.6_

- [ ] 2. Implement ToolsHub container and ToolCard component
  - [ ] 2.1 Create `ToolCard.tsx` in `src/mainscreen/features/`
    - Props: `{ id, title, description, backgroundImage?, gradientFrom?, gradientTo?, comingSoon?, onPress }`
    - Render card with background image (fallback to gradient `#1c1e22` → `#141518`), title, description
    - If `comingSoon` is true, overlay a "Coming Soon" badge and visually dim the card
    - Use Framer Motion `whileTap` for press feedback
    - _Requirements: 1.2, 6.1, 6.3, 8.5_

  - [ ] 2.2 Create `ComingSoonModal.tsx` in `src/mainscreen/features/`
    - Modal overlay explaining the feature is in development
    - Accept `isOpen` and `onClose` props
    - Dark themed with green accent, Outfit font
    - _Requirements: 6.2_

  - [ ] 2.3 Create `ToolsHub.tsx` in `src/mainscreen/features/`
    - Internal state: `activeView: 'grid' | 'pomodoro' | 'workout' | 'breathing' | 'books'`
    - Grid view: render TOOL_CARDS registry as 2-column grid of ToolCard components
    - Include "Send a suggestion" card as last grid item (opens mailto or feedback mechanism)
    - Tool views: render corresponding tool component with `onBack` prop
    - Use `AnimatePresence` for view transitions
    - Render back button overlay when not on grid view
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6_

  - [ ] 2.4 Replace `FeaturesView` import in `src/mainscreen/beranda/Beranda.tsx` with the new `ToolsHub` component
    - Change `import { FeaturesView }` to `import { ToolsHub }` from `../../mainscreen/features/ToolsHub`
    - Replace `{activeTab === 'features' && <FeaturesView />}` with `{activeTab === 'features' && <ToolsHub />}`
    - _Requirements: 9.2_

- [ ] 3. Implement Pomodoro Timer tool
  - [ ] 3.1 Create `PomodoroTimer.tsx` in `src/mainscreen/features/`
    - Full-screen view with anime-style background image placeholder (gradient fallback)
    - Scroll picker for duration selection: [15, 25, 30, 45, 60, 75, 90] minutes
    - Large countdown display in MM:SS format
    - State machine: 'idle' | 'running' | 'paused' | 'break'
    - Controls: Start (idle), Pause/Stop (running), Resume/Stop (paused)
    - Use `useCountdownTimer` hook for countdown logic
    - On completion: vibrate (`navigator.vibrate`), play notification sound, call `useProgressionStore.getState().awardFeedInteraction()`
    - Offer optional 5-minute break timer after completion
    - Stop resets without awarding XP
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 7.1, 7.4_

  - [ ]* 3.2 Write property test for countdown timer initialization
    - **Property 3: Inisialisasi countdown timer**
    - For any duration from [15, 25, 30, 45, 60, 75, 90], starting the timer initializes remaining to `duration × 60` seconds
    - **Validates: Requirements 2.3**

  - [ ]* 3.3 Write property test for pause freezing timer state
    - **Property 4: Pause membekukan state timer**
    - For any remaining time T where 0 < T ≤ selectedDuration × 60, pausing keeps remaining constant at T
    - **Validates: Requirements 2.5**

  - [ ]* 3.4 Write property test for stop resetting without XP
    - **Property 5: Stop mereset tanpa XP**
    - For any timer state (running/paused), stop resets remaining to initial duration and does not call awardFeedInteraction
    - **Validates: Requirements 2.6, 7.4**

- [ ] 4. Checkpoint - Verify core infrastructure and Pomodoro
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Workout Counter tool
  - [ ] 5.1 Create `WorkoutCounter.tsx` in `src/mainscreen/features/`
    - Full-screen view with anime-style background image placeholder (gradient fallback)
    - View states: 'menu' | 'configure' | 'active' | 'history'
    - Menu view: "Start a new session" button and "All workouts" (history) button
    - Configure view: exercise list (Push-Up, Sit-Up, Plank, Lari, Yoga, Stretching, Lompat Tali, Squat, Burpee), multi-select with Reps/Time/Sets config per exercise
    - Active view: timer countdown per exercise, "Set X/N" display, current exercise indicator
    - Use `useCountdownTimer` for per-exercise timing
    - On all exercises/sets complete: call `useProgressionStore.getState().awardFeedInteraction()`, save session to `useWorkoutStore`
    - History view: list of completed WorkoutSession entries from store
    - Weekly_Progress_Grid: Mon-Sun visual indicators from `useWorkoutStore.getWeeklyProgress()`
    - Validate inputs: Start disabled until all entries have reps ≥ 1 and sets ≥ 1
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 7.2, 7.4_

  - [ ]* 5.2 Write property test for exercise configuration availability
    - **Property 6: Ketersediaan konfigurasi exercise**
    - For any non-empty subset of valid exercises, each selected exercise has configurable Reps, Time, and Sets fields
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 5.3 Write property test for set tracking format
    - **Property 7: Kebenaran format set tracking**
    - For any exercise with N sets (1 ≤ N ≤ 20), display shows "Set X/N" where X increments from 1 to N
    - **Validates: Requirements 3.5**

  - [ ]* 5.4 Write property test for weekly progress grid accuracy
    - **Property 8: Akurasi weekly progress grid**
    - For any subset of days with completed sessions, the grid shows active indicators for exactly those days
    - **Validates: Requirements 3.7**

- [ ] 6. Implement Deep Breathing tool
  - [ ] 6.1 Create `DeepBreathing.tsx` in `src/mainscreen/features/`
    - Full-screen view with blue/teal gradient background
    - Animated circle: scale 1.0 → 1.5 (Inhale), hold (Hold), 1.5 → 1.0 (Exhale), hold (Hold2) using Framer Motion
    - Use `getBreathingPhase(elapsedSeconds)` from `breathingPhase.ts` to determine current phase
    - Display current phase name text (Inhale, Hold, Exhale, Hold)
    - Display total elapsed timer, default session length 3 minutes (180 seconds)
    - On session complete (180s elapsed): call `useProgressionStore.getState().awardFeedInteraction()`
    - Cycle phases continuously until session ends
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 7.3, 7.4_

  - [ ]* 6.2 Write property test for breathing phase determinism
    - **Property 9: Determinisme fase breathing**
    - For any elapsed time T (0 ≤ T < 180), `getBreathingPhase(T).phase` equals `phases[Math.floor(T / 4) % 4]`
    - **Validates: Requirements 4.2, 4.4, 4.7**

  - [ ]* 6.3 Write property test for cancellation preventing XP
    - **Property 12: Pembatalan mencegah XP award**
    - For any tool and any time before session completion, stopping/cancelling results in zero calls to awardFeedInteraction
    - **Validates: Requirements 7.4**

- [ ] 7. Checkpoint - Verify Workout and Breathing tools
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Book Summary (Perpustakaan) tool
  - [ ] 8.1 Create `BookSummary.tsx` in `src/mainscreen/features/`
    - Display book cards organized by category from `BOOK_LIBRARY` data
    - Each card shows: cover image (placeholder gradient), title, author, star rating, reading time
    - Filter tabs: Recommended, Done, Category dropdown
    - "Start reading" button on each card opens BookReader
    - Premium card design with dark theme styling
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.8_

  - [ ] 8.2 Create `BookReader.tsx` in `src/mainscreen/features/`
    - Full-screen reader for book summary text (markdown content)
    - "Mark as Done" button that calls `useBookStore.markAsDone(bookId)`
    - Back navigation to BookSummary list
    - _Requirements: 5.4, 5.7_

  - [ ]* 8.3 Write property test for tool card rendering completeness
    - **Property 1: Kelengkapan rendering tool card**
    - For any valid tool card data with title, description, and image path, rendered output contains title and description text
    - **Validates: Requirements 1.2**

  - [ ]* 8.4 Write property test for book card rendering completeness
    - **Property 10: Kelengkapan rendering book card**
    - For any valid BookEntry with title, author, rating (1-5), readingTimeMinutes (> 0), rendered card contains all fields
    - **Validates: Requirements 5.3**

  - [ ]* 8.5 Write property test for book "Done" round-trip
    - **Property 11: Round-trip status "Done" buku**
    - For any bookId, calling markAsDone then isBookDone returns true, and book appears in Done filter
    - **Validates: Requirements 5.7**

- [ ] 9. Final integration and polish
  - [ ] 9.1 Wire all tool views into ToolsHub with AnimatePresence transitions and ensure consistent dark theme styling (#141518, #1c1e22, #00FF85, Outfit font) across all components
    - Verify navigation: grid → tool → back to grid works for all tools
    - Verify Screen Blocker card opens ComingSoonModal
    - Verify "Send a suggestion" card functionality
    - _Requirements: 1.4, 1.5, 6.2, 9.3, 9.4_

  - [ ]* 9.2 Write property test for tool card navigation correctness
    - **Property 2: Kebenaran navigasi tool card**
    - For any non-comingSoon tool card, pressing it changes activeView to the corresponding tool identifier
    - **Validates: Requirements 1.5**

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The existing `FeaturesView.tsx` in `src/mainscreen/beranda/views/` can be kept as a backup or deleted after ToolsHub is confirmed working
- All image assets use gradient placeholders until final anime-style art is provided
- `useProgressionStore` is imported from `../../store/useProgressionStore` (existing store)
- `fast-check` library is used for property-based tests with Vitest as the runner

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3", "1.4", "1.5"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "2.2"] },
    { "id": 3, "tasks": ["2.3", "2.4"] },
    { "id": 4, "tasks": ["3.1", "5.1", "6.1"] },
    { "id": 5, "tasks": ["3.2", "3.3", "3.4", "5.2", "5.3", "5.4", "6.2", "6.3"] },
    { "id": 6, "tasks": ["8.1"] },
    { "id": 7, "tasks": ["8.2", "8.3", "8.4", "8.5"] },
    { "id": 8, "tasks": ["9.1"] },
    { "id": 9, "tasks": ["9.2"] }
  ]
}
```
