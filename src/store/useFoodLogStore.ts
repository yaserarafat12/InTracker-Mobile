import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import type { FoodEntry } from '../engines/foodLogEngine';

// --- Interfaces ---

export interface FoodLogStore {
  entries: FoodEntry[];
  selectedDate: string; // YYYY-MM-DD
  pendingSync: FoodEntry[]; // entries awaiting Supabase sync
  syncRetryCount: Record<string, number>; // entryId -> retry count (max 5)

  addEntry: (entry: Omit<FoodEntry, 'id' | 'userId' | 'createdAt'>) => void;
  deleteEntry: (id: string) => void;
  setSelectedDate: (date: string) => void;
  getEntriesForDate: (date: string) => FoodEntry[];
  syncToSupabase: () => Promise<void>;
  reconcileWithSupabase: () => Promise<void>;
}

// --- Helpers ---

function getTodayDateString(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}

const MAX_SYNC_RETRIES = 5;

// --- Store ---

export const useFoodLogStore = create<FoodLogStore>()(
  persist(
    (set, get) => ({
      entries: [],
      selectedDate: getTodayDateString(),
      pendingSync: [],
      syncRetryCount: {},

      addEntry: (entryData) => {
        const newEntry: FoodEntry = {
          ...entryData,
          id: crypto.randomUUID(),
          userId: '', // Will be populated by sync layer with actual user ID
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          entries: [...state.entries, newEntry],
          pendingSync: [...state.pendingSync, newEntry],
        }));

        // Trigger background sync (retry pending entries on each add)
        void get().syncToSupabase();
      },

      deleteEntry: (id: string) => {
        set((state) => {
          const updatedEntries = state.entries.map((entry) =>
            entry.id === id ? { ...entry, isDeleted: true } : entry
          );

          // Add the soft-deleted entry to pendingSync for Supabase propagation
          const deletedEntry = updatedEntries.find((e) => e.id === id);
          const updatedPendingSync = deletedEntry
            ? [...state.pendingSync.filter((e) => e.id !== id), deletedEntry]
            : state.pendingSync;

          return {
            entries: updatedEntries,
            pendingSync: updatedPendingSync,
          };
        });

        // Trigger background sync (retry pending entries on each delete)
        void get().syncToSupabase();
      },

      setSelectedDate: (date: string) => {
        set({ selectedDate: date });
      },

      getEntriesForDate: (date: string) => {
        const { entries } = get();
        return entries.filter(
          (entry) => entry.date === date && !entry.isDeleted
        );
      },

      syncToSupabase: async () => {
        const { pendingSync, syncRetryCount } = get();
        if (pendingSync.length === 0) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const synced: string[] = [];
        const updatedRetryCount = { ...syncRetryCount };

        for (const entry of pendingSync) {
          const currentRetries = updatedRetryCount[entry.id] || 0;
          if (currentRetries >= MAX_SYNC_RETRIES) {
            // Skip entries that have exceeded max retries
            continue;
          }

          try {
            const { error } = await supabase.from('food_entries').upsert(
              {
                id: entry.id,
                user_id: user.id,
                date: entry.date,
                meal_type: entry.mealType,
                food_name: entry.foodName,
                calories: entry.calories,
                protein: entry.protein,
                carbs: entry.carbs,
                fat: entry.fat,
                source: entry.source || 'manual',
                is_deleted: entry.isDeleted || false,
                created_at: entry.createdAt,
              },
              { onConflict: 'id' }
            );

            if (error) {
              updatedRetryCount[entry.id] = currentRetries + 1;
            } else {
              synced.push(entry.id);
              delete updatedRetryCount[entry.id];
            }
          } catch {
            updatedRetryCount[entry.id] = currentRetries + 1;
          }
        }

        set((state) => ({
          pendingSync: state.pendingSync.filter((e) => !synced.includes(e.id)),
          syncRetryCount: updatedRetryCount,
        }));
      },

      reconcileWithSupabase: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Reset retry counts on app launch so entries that exceeded max retries
        // get another chance (Requirement 16.5)
        set((state) => ({
          syncRetryCount: Object.fromEntries(
            Object.entries(state.syncRetryCount).filter(
              ([, count]) => count < MAX_SYNC_RETRIES
            )
          ),
        }));

        const { data: remoteEntries, error } = await supabase
          .from('food_entries')
          .select('*')
          .eq('user_id', user.id);

        if (error || !remoteEntries) return;

        set((state) => {
          const localEntriesMap = new Map(
            state.entries.map((e) => [e.id, e])
          );

          // Merge remote entries into local state
          for (const remote of remoteEntries) {
            const mapped: FoodEntry = {
              id: remote.id,
              userId: remote.user_id,
              date: remote.date,
              mealType: remote.meal_type,
              foodName: remote.food_name,
              calories: remote.calories,
              protein: remote.protein,
              carbs: remote.carbs,
              fat: remote.fat,
              createdAt: remote.created_at,
              isDeleted: remote.is_deleted,
              source: remote.source,
            };

            const local = localEntriesMap.get(remote.id);

            if (!local) {
              // Entry exists in Supabase but not locally — add it
              localEntriesMap.set(remote.id, mapped);
            } else if (local.isDeleted) {
              // Entry marked as deleted locally — keep it deleted
              // Do not overwrite local soft-delete
            } else {
              // Entry exists in both — keep the most recent version
              const localTime = new Date(local.createdAt).getTime();
              const remoteTime = new Date(mapped.createdAt).getTime();
              if (remoteTime > localTime) {
                localEntriesMap.set(remote.id, mapped);
              }
            }
          }

          return {
            entries: Array.from(localEntriesMap.values()),
          };
        });

        // After reconciliation, retry syncing any remaining pending entries
        void get().syncToSupabase();
      },
    }),
    {
      name: 'intracker-food-log-v1',
      version: 1,
    }
  )
);
