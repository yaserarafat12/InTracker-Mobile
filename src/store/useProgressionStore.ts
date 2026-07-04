// ============================================================
// RPG Stats & XP System — Progression Store
// Zustand store with persist middleware for local-first state.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { useUserStore } from './useUserStore';
import {
  type StatCategory,
  makeEmptyStats,
  makeEmptyDailyStats,
  MAX_LEVEL,
} from '../engines/types';
import { calculateXPAward } from '../engines/xpEngine';
import { calculateStatAward, getDefaultHabitStatsMap } from '../engines/statsEngine';
import { getLevelInfo, validateLevelConsistency } from '../engines/levelSystem';

// ---- State Interface ----

export interface ProgressionState {
  userId: string | null;
  // Cumulative values
  totalXP: number;
  level: number;
  stats: Record<StatCategory, number>;

  // Daily tracking
  dailyXPEarned: number;
  dailyFeedXPEarned: number;
  dailyJournalCount: number;
  dailyStatEarned: Record<StatCategory, number>;
  lastResetDate: string; // YYYY-MM-DD

  // Sync tracking
  pendingSync: boolean;
  syncRetryCount: number;
  lastSyncTimestamp: number;

  // Migration
  migrationCompleted: boolean;

  // To-do dedup (stored as array for JSON serialization)
  completedTodoIds: string[];
}

// ---- Actions Interface ----

export interface ProgressionActions {
  awardHabitCompletion: (habit: { id: string; category: string; difficulty: number }) => void;
  awardJournalEntry: (charCount: number) => void;
  awardFeedInteraction: () => void;
  awardTodoCompletion: (todoId: string) => void;
  reconcileWithRemote: () => Promise<void>;
  runMigration: () => Promise<void>;
  resetDailyCaps: () => void;
  _checkAndResetDaily: () => void;
  scheduleBatchSync: () => void;
}

// ---- Helper for Timezone-aware date ----

const getTodayString = () => {
  try {
    const tz = useUserStore.getState().settings.timezone || 'Asia/Jakarta';
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch (e) {
    return new Date().toLocaleDateString('en-CA');
  }
};

// ---- Initial State ----

function getInitialState(): ProgressionState {
  const today = getTodayString();
  return {
    userId: null,
    totalXP: 0,
    level: 1,
    stats: makeEmptyStats(),
    dailyXPEarned: 0,
    dailyFeedXPEarned: 0,
    dailyJournalCount: 0,
    dailyStatEarned: makeEmptyDailyStats(),
    lastResetDate: today,
    pendingSync: false,
    syncRetryCount: 0,
    lastSyncTimestamp: 0,
    migrationCompleted: false,
    completedTodoIds: [],
  };
}

// ---- Debounce timer for batch sync ----
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let syncMaxDelayTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 10_000;  // 10 seconds
const SYNC_MAX_DELAY_MS = 30_000; // 30 seconds max
const MAX_SYNC_RETRIES = 5;

// ---- Store ----

export const useProgressionStore = create<ProgressionState & ProgressionActions>()(
  persist(
    (set, get) => ({
      ...getInitialState(),

      // ---- Daily Reset Check ----
      _checkAndResetDaily: () => {
        const today = getTodayString();
        const state = get();
        if (state.lastResetDate !== today) {
          set({
            dailyXPEarned: 0,
            dailyFeedXPEarned: 0,
            dailyJournalCount: 0,
            dailyStatEarned: makeEmptyDailyStats(),
            lastResetDate: today,
          });

          // Cleanup: keep only last 500 todo IDs to prevent unbounded growth
          const currentTodoIds = get().completedTodoIds;
          if (currentTodoIds.length > 500) {
            set({ completedTodoIds: currentTodoIds.slice(-500) });
          }
        }
      },

      resetDailyCaps: () => {
        const today = getTodayString();
        set({
          dailyXPEarned: 0,
          dailyFeedXPEarned: 0,
          dailyJournalCount: 0,
          dailyStatEarned: makeEmptyDailyStats(),
          lastResetDate: today,
        });
      },

      // ---- Batch Sync Scheduler ----
      scheduleBatchSync: () => {
        const store = get();

        // Clear existing debounce timer
        if (syncDebounceTimer) {
          clearTimeout(syncDebounceTimer);
          syncDebounceTimer = null;
        }

        // Set max delay timer if not already running
        if (!syncMaxDelayTimer) {
          syncMaxDelayTimer = setTimeout(() => {
            syncMaxDelayTimer = null;
            if (syncDebounceTimer) {
              clearTimeout(syncDebounceTimer);
              syncDebounceTimer = null;
            }
            executeBatchSync(store);
          }, SYNC_MAX_DELAY_MS);
        }

        // Set debounce timer
        syncDebounceTimer = setTimeout(() => {
          syncDebounceTimer = null;
          if (syncMaxDelayTimer) {
            clearTimeout(syncMaxDelayTimer);
            syncMaxDelayTimer = null;
          }
          executeBatchSync(get());
        }, SYNC_DEBOUNCE_MS);

        set({ pendingSync: true });
      },

      // ---- Award: Habit Completion ----
      awardHabitCompletion: (habit) => {
        get()._checkAndResetDaily();
        const state = get();

        // XP award
        const xpResult = calculateXPAward({
          source: 'habit',
          difficulty: habit.difficulty,
          charCount: 0,
          dailyXPEarned: state.dailyXPEarned,
          dailyFeedXPEarned: state.dailyFeedXPEarned,
          dailyJournalCount: state.dailyJournalCount,
        });

        // Stats award
        const habitStatsMap = getDefaultHabitStatsMap(habit.category, habit.difficulty);
        const statResult = calculateStatAward({
          source: 'habit',
          habitStatsMap,
          dailyStatEarned: state.dailyStatEarned,
        });

        // New totals
        const newTotalXP = state.totalXP + xpResult.awarded;
        const levelInfo = getLevelInfo(newTotalXP);
        const correctedLevel = validateLevelConsistency(newTotalXP, levelInfo.level);

        // Update cumulative stats
        const newStats = { ...state.stats };
        for (const cat of Object.keys(statResult.awards) as StatCategory[]) {
          newStats[cat] = (newStats[cat] ?? 0) + statResult.awards[cat];
        }

        set({
          totalXP: newTotalXP,
          level: Math.min(correctedLevel, MAX_LEVEL),
          stats: newStats,
          dailyXPEarned: xpResult.newDailyXPTotal,
          dailyFeedXPEarned: xpResult.newDailyFeedXPTotal,
          dailyJournalCount: xpResult.newDailyJournalCount,
          dailyStatEarned: statResult.newDailyStatEarned,
        });

        get().scheduleBatchSync();
      },

      // ---- Award: Journal Entry ----
      awardJournalEntry: (charCount) => {
        get()._checkAndResetDaily();
        const state = get();

        // XP award
        const xpResult = calculateXPAward({
          source: 'journal',
          charCount,
          dailyXPEarned: state.dailyXPEarned,
          dailyFeedXPEarned: state.dailyFeedXPEarned,
          dailyJournalCount: state.dailyJournalCount,
        });

        // Stats award (only if XP was awarded — i.e., valid journal entry)
        let statResult = null;
        if (xpResult.awarded > 0 || (charCount >= 20 && !xpResult.journalCapped)) {
          // Award stats even if XP was capped by daily limit, as long as journal is valid
          const isValidJournal = charCount >= 20 && state.dailyJournalCount < 5;
          if (isValidJournal) {
            statResult = calculateStatAward({
              source: 'journal',
              dailyStatEarned: state.dailyStatEarned,
            });
          }
        }

        const newTotalXP = state.totalXP + xpResult.awarded;
        const levelInfo = getLevelInfo(newTotalXP);
        const correctedLevel = validateLevelConsistency(newTotalXP, levelInfo.level);

        const newStats = { ...state.stats };
        const newDailyStatEarned = statResult
          ? statResult.newDailyStatEarned
          : state.dailyStatEarned;

        if (statResult) {
          for (const cat of Object.keys(statResult.awards) as StatCategory[]) {
            newStats[cat] = (newStats[cat] ?? 0) + statResult.awards[cat];
          }
        }

        set({
          totalXP: newTotalXP,
          level: Math.min(correctedLevel, MAX_LEVEL),
          stats: newStats,
          dailyXPEarned: xpResult.newDailyXPTotal,
          dailyFeedXPEarned: xpResult.newDailyFeedXPTotal,
          dailyJournalCount: xpResult.newDailyJournalCount,
          dailyStatEarned: newDailyStatEarned,
        });

        get().scheduleBatchSync();
      },

      // ---- Award: Feed Interaction ----
      awardFeedInteraction: () => {
        get()._checkAndResetDaily();
        const state = get();

        const xpResult = calculateXPAward({
          source: 'feed',
          dailyXPEarned: state.dailyXPEarned,
          dailyFeedXPEarned: state.dailyFeedXPEarned,
          dailyJournalCount: state.dailyJournalCount,
        });

        const newTotalXP = state.totalXP + xpResult.awarded;
        const levelInfo = getLevelInfo(newTotalXP);
        const correctedLevel = validateLevelConsistency(newTotalXP, levelInfo.level);

        set({
          totalXP: newTotalXP,
          level: Math.min(correctedLevel, MAX_LEVEL),
          dailyXPEarned: xpResult.newDailyXPTotal,
          dailyFeedXPEarned: xpResult.newDailyFeedXPTotal,
          dailyJournalCount: xpResult.newDailyJournalCount,
        });

        get().scheduleBatchSync();
      },

      // ---- Award: Todo Completion ----
      awardTodoCompletion: (todoId) => {
        const state = get();

        // Deduplication: skip if already rewarded
        if (state.completedTodoIds.includes(todoId)) {
          return;
        }

        get()._checkAndResetDaily();
        const freshState = get();

        const xpResult = calculateXPAward({
          source: 'todo',
          dailyXPEarned: freshState.dailyXPEarned,
          dailyFeedXPEarned: freshState.dailyFeedXPEarned,
          dailyJournalCount: freshState.dailyJournalCount,
        });

        const newTotalXP = freshState.totalXP + xpResult.awarded;
        const levelInfo = getLevelInfo(newTotalXP);
        const correctedLevel = validateLevelConsistency(newTotalXP, levelInfo.level);

        set({
          totalXP: newTotalXP,
          level: Math.min(correctedLevel, MAX_LEVEL),
          dailyXPEarned: xpResult.newDailyXPTotal,
          dailyFeedXPEarned: xpResult.newDailyFeedXPTotal,
          dailyJournalCount: xpResult.newDailyJournalCount,
          completedTodoIds: [...freshState.completedTodoIds, todoId],
        });

        get().scheduleBatchSync();
      },

      // ---- Reconcile with Remote (Task 7.3) ----
      reconcileWithRemote: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const state = get();

          // Collision Guard: Reset stats if user changed
          if (state.userId && state.userId !== user.id) {
            console.log("[Progression] User changed! Resetting progression store state...");
            set({
              ...getInitialState(),
              userId: user.id
            });
            state.totalXP = 0;
            state.level = 1;
            state.stats = makeEmptyStats();
            state.completedTodoIds = [];
          } else if (!state.userId) {
            set({ userId: user.id });
          }

          const { data, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error || !data) return;

          // Higher-value-wins reconciliation
          const reconciledTotalXP = Math.max(state.totalXP, data.total_xp ?? 0);
          const reconciledLevel = Math.max(
            state.level,
            validateLevelConsistency(reconciledTotalXP, data.level ?? 1),
          );

          const reconciledStats: Record<StatCategory, number> = {
            kebijaksanaan: Math.max(state.stats.kebijaksanaan, data.stat_kebijaksanaan ?? 0),
            kepercayaanDiri: Math.max(state.stats.kepercayaanDiri, data.stat_kepercayaan_diri ?? 0),
            kekuatan: Math.max(state.stats.kekuatan, data.stat_kekuatan ?? 0),
            disiplin: Math.max(state.stats.disiplin, data.stat_disiplin ?? 0),
            fokus: Math.max(state.stats.fokus, data.stat_fokus ?? 0),
          };

          // Merge completed todo IDs
          const remoteTodoIds: string[] = data.completed_todo_ids ?? [];
          const mergedTodoIds = Array.from(
            new Set([...state.completedTodoIds, ...remoteTodoIds]),
          );

          set({
            totalXP: reconciledTotalXP,
            level: Math.min(reconciledLevel, MAX_LEVEL),
            stats: reconciledStats,
            migrationCompleted: data.migration_completed ?? state.migrationCompleted,
            completedTodoIds: mergedTodoIds,
          });
        } catch (err) {
          console.error('[Progression] reconcileWithRemote failed:', err);
          // Continue with local data — retry on next sync
        }
      },

      // ---- Run Migration (Task 10.1) ----
      runMigration: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const state = get();

          // Collision Guard: Reset stats if user changed
          if (state.userId && state.userId !== user.id) {
            console.log("[Progression] User changed! Resetting progression store state for migration...");
            set({
              ...getInitialState(),
              userId: user.id
            });
          } else if (!state.userId) {
            set({ userId: user.id });
          }

          if (get().migrationCompleted) return;

          // Check if user_stats row already exists
          const { data: existingRow } = await supabase
            .from('user_stats')
            .select('migration_completed')
            .eq('user_id', user.id)
            .single();

          if (existingRow?.migration_completed) {
            set({ migrationCompleted: true });
            return;
          }

          // Calculate initial values from habit_logs
          let migrationTotalXP = 0;
          let migrationStats = makeEmptyStats();

          try {
            const { data: logs } = await supabase
              .from('habit_logs')
              .select('habit_id, date, status')
              .eq('user_id', user.id)
              .eq('status', 'completed');

            if (!logs || logs.length === 0) {
              // If no logs exist, give starter stats (not zero)
              migrationTotalXP = 150;
              migrationStats = {
                kebijaksanaan: 15 + Math.floor(Math.random() * 10),
                kepercayaanDiri: 12 + Math.floor(Math.random() * 10),
                kekuatan: 10 + Math.floor(Math.random() * 8),
                disiplin: 18 + Math.floor(Math.random() * 10),
                fokus: 14 + Math.floor(Math.random() * 10),
              };
            } else if (logs.length > 0) {
              // Fetch habits to get difficulty and category
              const { data: habits } = await supabase
                .from('habits')
                .select('id, difficulty, category')
                .eq('user_id', user.id);

              const habitMap = new Map(
                (habits ?? []).map((h: any) => [h.id, h]),
              );

              for (const log of logs) {
                const habit = habitMap.get(log.habit_id);
                const difficulty = habit?.difficulty ?? 1;
                const category = habit?.category ?? '';

                // XP: difficulty-based
                const xpMap: Record<number, number> = { 1: 15, 2: 25, 3: 40 };
                migrationTotalXP += xpMap[difficulty] ?? 15;

                // Stats: category-based (no daily cap for migration)
                const statsMap = getDefaultHabitStatsMap(category, difficulty);
                for (const entry of statsMap.categories) {
                  migrationStats[entry.category] =
                    (migrationStats[entry.category] ?? 0) + entry.points;
                }
              }
            }
          } catch (calcErr) {
            console.error('[Progression] Migration calculation failed:', calcErr);
            // Initialize to zero on failure
            migrationTotalXP = 0;
            migrationStats = makeEmptyStats();
          }

          // Calculate level from migrated XP
          const { level: migrationLevel } = getLevelInfo(migrationTotalXP);

          // Write to Supabase
          const today = new Date().toLocaleDateString('en-CA');
          await supabase.from('user_stats').upsert(
            {
              user_id: user.id,
              total_xp: migrationTotalXP,
              level: Math.min(migrationLevel, MAX_LEVEL),
              stat_kebijaksanaan: migrationStats.kebijaksanaan,
              stat_kepercayaan_diri: migrationStats.kepercayaanDiri,
              stat_kekuatan: migrationStats.kekuatan,
              stat_disiplin: migrationStats.disiplin,
              stat_fokus: migrationStats.fokus,
              daily_xp_earned: 0,
              daily_feed_xp_earned: 0,
              daily_journal_count: 0,
              daily_stat_kebijaksanaan: 0,
              daily_stat_kepercayaan_diri: 0,
              daily_stat_kekuatan: 0,
              daily_stat_disiplin: 0,
              daily_stat_fokus: 0,
              last_reset_date: today,
              migration_completed: true,
              completed_todo_ids: [],
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
          );

          // Update local state with migration values
          set({
            totalXP: migrationTotalXP,
            level: Math.min(migrationLevel, MAX_LEVEL),
            stats: migrationStats,
            migrationCompleted: true,
          });
        } catch (err) {
          console.error('[Progression] runMigration failed:', err);
          // Mark migration complete with zeros to avoid re-running
          set({ migrationCompleted: true });
        }
      },
    }),
    {
      name: 'intracker-progression-v1',
      version: 1,
      // Serialize Set as array (completedTodoIds is already string[])
    },
  ),
);

// ---- Batch Sync Executor ----

async function executeBatchSync(state: ProgressionState & ProgressionActions) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toLocaleDateString('en-CA');

    const { error } = await supabase.from('user_stats').upsert(
      {
        user_id: user.id,
        total_xp: state.totalXP,
        level: state.level,
        stat_kebijaksanaan: state.stats.kebijaksanaan,
        stat_kepercayaan_diri: state.stats.kepercayaanDiri,
        stat_kekuatan: state.stats.kekuatan,
        stat_disiplin: state.stats.disiplin,
        stat_fokus: state.stats.fokus,
        daily_xp_earned: state.dailyXPEarned,
        daily_feed_xp_earned: state.dailyFeedXPEarned,
        daily_journal_count: state.dailyJournalCount,
        daily_stat_kebijaksanaan: state.dailyStatEarned.kebijaksanaan,
        daily_stat_kepercayaan_diri: state.dailyStatEarned.kepercayaanDiri,
        daily_stat_kekuatan: state.dailyStatEarned.kekuatan,
        daily_stat_disiplin: state.dailyStatEarned.disiplin,
        daily_stat_fokus: state.dailyStatEarned.fokus,
        last_reset_date: state.lastResetDate ?? today,
        migration_completed: state.migrationCompleted,
        completed_todo_ids: state.completedTodoIds,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      throw error;
    }

    // Success: reset retry count and pending flag
    useProgressionStore.setState({
      pendingSync: false,
      syncRetryCount: 0,
      lastSyncTimestamp: Date.now(),
    });
  } catch (err) {
    console.error('[Progression] Batch sync failed:', err);

    const currentRetries = useProgressionStore.getState().syncRetryCount;
    const newRetryCount = currentRetries + 1;

    if (newRetryCount >= MAX_SYNC_RETRIES) {
      // Stop automatic retries — wait for next reward event
      useProgressionStore.setState({
        syncRetryCount: newRetryCount,
        pendingSync: true,
      });
      console.warn('[Progression] Max sync retries reached. Waiting for next reward event.');
    } else {
      useProgressionStore.setState({
        syncRetryCount: newRetryCount,
        pendingSync: true,
      });
      // Schedule retry with exponential backoff
      const retryDelay = Math.min(SYNC_DEBOUNCE_MS * Math.pow(2, newRetryCount), SYNC_MAX_DELAY_MS);
      setTimeout(() => {
        executeBatchSync(useProgressionStore.getState());
      }, retryDelay);
    }
  }
}
