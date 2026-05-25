import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { getDefaultSchedule, calculateScheduleAwareStreak, filterHabitsByDay } from '../utils/scheduleHelpers';
import { useProgressionStore } from './useProgressionStore';

export interface HabitItem {
  id: string; // Changed to string for UUID
  user_id?: string;
  name: string;
  subtitle: string;
  frequency: string;
  difficulty: number;
  iconName: string;
  category: string;
  color: string;
  completed: boolean;
  skipped: boolean;
  isSpecial?: boolean;
  specialLabel?: string;
  imageUrl: string;
  imagePosition?: string;
  streak: number; 
  target_intensity?: number | null;
  current_intensity?: number;
  position: number;
  // Schedule fields
  schedule_type: 'daily' | 'weekly' | 'custom';
  schedule_days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
}

export const INITIAL_HABITS_DATA: HabitItem[] = [];

interface HabitStore {
  habits: HabitItem[];
  loading: boolean;
  currentUserId: string | null;
  lastSyncDate: string | null;
  totalStreak: number;
  setHabits: (habits: HabitItem[] | ((prev: HabitItem[]) => HabitItem[])) => void;
  fetchHabits: () => Promise<void>;
  addHabit: (habit: Omit<HabitItem, 'id' | 'user_id' | 'streak'>) => Promise<void>;
  toggleHabit: (id: string, field: 'completed' | 'skipped') => Promise<void>;
  completeWithIntensity: (habitId: string, intensityValue: number) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  updateHabit: (id: string, updates: Partial<HabitItem>) => Promise<void>;
  calculateStreak: (habitId: string, logs: any[]) => number;
  getScheduledHabitsForToday: () => HabitItem[];
  completingHabitId: string | null;
  setCompletingHabitId: (id: string | null) => void;
  brokenStreaks: Array<{ habitId: string; lastDate: string; daysMissing: number }>;
  rescueStreak: (habitId: string) => Promise<void>;
  reorderHabits: (newOrder: HabitItem[]) => Promise<void>;
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: INITIAL_HABITS_DATA,
      loading: false,
      currentUserId: null,
      lastSyncDate: null,
      totalStreak: 0,
      brokenStreaks: [],
      setHabits: (updater) => set((state) => ({
        habits: typeof updater === 'function' ? updater(state.habits) : updater
      })),

      fetchHabits: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          set({ loading: false, habits: [], currentUserId: null });
          return;
        }

        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const state = get();

        // Collision Guard: Clear data if user changed
        if (state.currentUserId !== user.id) {
          set({ habits: [], currentUserId: user.id, lastSyncDate: null });
        }

        set({ loading: true });

        // --- DAILY RESET LOGIC ---
        if (state.lastSyncDate && state.lastSyncDate !== today) {
          console.log("New day detected. Resetting habits...");
          await supabase
            .from('habits')
            .update({ completed: false, skipped: false })
            .eq('user_id', user.id);
          set({ lastSyncDate: today });
        } else if (!state.lastSyncDate) {
          set({ lastSyncDate: today });
        }

        // Fetch all habits
        const { data: habitsData, error: habitsError } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .order('position', { ascending: true });

        // Fetch all logs for streak calculation
        const { data: logsData } = await supabase
          .from('habit_logs')
          .select('habit_id, date, status')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('date', { ascending: false });

        if (!habitsError && habitsData) {
          // Calculate streaks for each habit
          const habitsWithStreaks = habitsData.map(h => {
            const habitLogs = logsData?.filter(l => l.habit_id === h.id) || [];
            const uniqueDates = Array.from(new Set(habitLogs.map(l => l.date)));

            // Apply schedule defaults for null values
            const defaults = getDefaultSchedule();
            const schedule_type = h.schedule_type || defaults.schedule_type;
            const schedule_days = h.schedule_days || defaults.schedule_days;
            
            // Use schedule-aware streak calculation
            const streak = calculateScheduleAwareStreak(schedule_days, uniqueDates);

            return {
              ...h,
              iconName: h.icon_name,
              isSpecial: h.is_special,
              specialLabel: h.special_label,
              imageUrl: h.image_url,
              imagePosition: h.image_position,
              streak: streak || 0,
              target_intensity: h.target_intensity,
              current_intensity: h.current_intensity || 0,
              position: h.position || 0,
              schedule_type,
              schedule_days,
            };
          });

          set({ habits: habitsWithStreaks as HabitItem[] });
          
          // Total streak logic (max streak from any habit or unique days active)
          const allUniqueDates = Array.from(new Set(logsData?.map(l => l.date) || [])).sort().reverse();
          let totalStreakCount = 0;
          let totalCheckDate = new Date();
          totalCheckDate.setHours(0,0,0,0);

          for (const dateStr of allUniqueDates) {
            const logDate = new Date(dateStr);
            logDate.setHours(0,0,0,0);
            const diff = Math.floor((totalCheckDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diff <= 1) {
              totalStreakCount++;
              totalCheckDate = logDate;
            } else {
              break;
            }
          }
          set({ totalStreak: totalStreakCount });

          // Sync streak_count to profile in Supabase
          if (user) {
            await supabase
              .from('profiles')
              .update({ streak_count: totalStreakCount })
              .eq('id', user.id);
          }

          // --- DETECT BROKEN STREAKS ---
          const broken: Array<{ habitId: string; lastDate: string; daysMissing: number }> = [];
          habitsWithStreaks.forEach(h => {
            const habitLogs = logsData?.filter(l => l.habit_id === h.id) || [];
            const uniqueDates = Array.from(new Set(habitLogs.map(l => l.date))).sort().reverse();
            
            if (uniqueDates.length > 0) {
              const latestLogDate = new Date(uniqueDates[0]);
              latestLogDate.setHours(0,0,0,0);
              const todayObj = new Date();
              todayObj.setHours(0,0,0,0);
              
              const diff = Math.floor((todayObj.getTime() - latestLogDate.getTime()) / (1000 * 60 * 60 * 24));
              
              // If missing for more than 1 day but less than 3 days (mercy limit)
              // and the habit is not completed today
              if (diff > 1 && diff <= 3 && !h.completed) {
                broken.push({
                  habitId: h.id,
                  lastDate: uniqueDates[0],
                  daysMissing: diff - 1
                });
              }
            }
          });
          set({ brokenStreaks: broken });
        }

        set({ loading: false });
      },

      calculateStreak: (habitId: string, logs: any[]) => {
        const habitLogs = logs.filter(l => l.habit_id === habitId && l.status === 'completed') || [];
        const uniqueDates = Array.from(new Set(habitLogs.map(l => l.date)));
        
        // Find the habit to get its schedule_days
        const habit = get().habits.find(h => h.id === habitId);
        const defaults = getDefaultSchedule();
        const scheduleDays = habit?.schedule_days || defaults.schedule_days;
        
        // Use schedule-aware streak calculation
        return calculateScheduleAwareStreak(scheduleDays, uniqueDates);
      },

      getScheduledHabitsForToday: () => {
        const { habits } = get();
        return filterHabitsByDay(habits, new Date().getDay());
      },

      addHabit: async (habit) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Apply schedule defaults if not provided
        const defaults = getDefaultSchedule();
        const schedule_type = habit.schedule_type || defaults.schedule_type;
        const schedule_days = habit.schedule_days || defaults.schedule_days;

        const dbHabit = {
          user_id: user.id,
          name: habit.name,
          subtitle: habit.subtitle,
          frequency: habit.frequency,
          difficulty: habit.difficulty,
          icon_name: habit.iconName,
          category: habit.category,
          color: habit.color,
          completed: habit.completed,
          skipped: habit.skipped,
          is_special: habit.isSpecial,
          special_label: habit.specialLabel,
          image_url: habit.imageUrl,
          image_position: habit.imagePosition,
          target_intensity: habit.target_intensity,
          current_intensity: habit.current_intensity || 0,
          schedule_type,
          schedule_days,
          position: get().habits.length > 0 
            ? Math.max(...get().habits.map(h => h.position)) + 1 
            : 1
        };

        const { data, error } = await supabase
          .from('habits')
          .insert([dbHabit])
          .select()
          .single();

        if (!error && data) {
          const mappedDefaults = getDefaultSchedule();
          const mapped = {
            ...data,
            iconName: data.icon_name,
            isSpecial: data.is_special,
            specialLabel: data.special_label,
            imageUrl: data.image_url,
            imagePosition: data.image_position,
            target_intensity: data.target_intensity,
            current_intensity: data.current_intensity,
            position: data.position,
            schedule_type: data.schedule_type || mappedDefaults.schedule_type,
            schedule_days: data.schedule_days || mappedDefaults.schedule_days,
          };
          set((state) => ({ habits: [...state.habits, mapped as HabitItem].sort((a, b) => a.position - b.position) }));
        }
      },

      toggleHabit: async (id, field) => {
        const habit = get().habits.find(h => h.id === id);
        if (!habit) return;

        const newValue = !habit[field];
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Optimistic update
        set((state) => ({
          habits: state.habits.map(h => h.id === id ? { ...h, [field]: newValue } : h)
        }));

        const dbField = field === 'completed' ? 'completed' : 'skipped';
        const { error } = await supabase
          .from('habits')
          .update({ [dbField]: newValue })
          .eq('id', id);

        if (error) {
          set((state) => ({
            habits: state.habits.map(h => h.id === id ? { ...h, [field]: !newValue } : h)
          }));
          return;
        }

        // --- LOG SYNC ---
        const today = new Date().toLocaleDateString('en-CA');
        if (newValue) {
          await supabase.from('habit_logs').upsert({
            user_id: user.id,
            habit_id: id,
            date: today,
            status: field === 'completed' ? 'completed' : 'skipped',
            intensity_value: null
          }, { onConflict: 'user_id, habit_id, date' });
        } else {
          await supabase.from('habit_logs').delete().eq('habit_id', id).eq('date', today).eq('status', field === 'completed' ? 'completed' : 'skipped');
        }

        // Award XP and stats via progression store when habit is completed
        if (field === 'completed' && newValue) {
          useProgressionStore.getState().awardHabitCompletion({
            id: habit.id,
            category: habit.category,
            difficulty: habit.difficulty,
          });
        }

        // Instead of a full refetch which can cause race conditions and flickering,
        // we fetch only the logs for THIS habit and update its streak locally.
        const { data: updatedLogs } = await supabase
          .from('habit_logs')
          .select('date, status')
          .eq('habit_id', id)
          .eq('status', 'completed');

        if (updatedLogs) {
          const newStreak = get().calculateStreak(id, updatedLogs.map(l => ({ ...l, habit_id: id })));
          set((state) => ({
            habits: state.habits.map(h => h.id === id ? { ...h, streak: newStreak } : h)
          }));
        }
      },

      completeWithIntensity: async (habitId: string, intensityValue: number) => {
        const habit = get().habits.find(h => h.id === habitId);
        if (!habit) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date().toLocaleDateString('en-CA');

        // Update habit as completed in Supabase
        const { error: habitError } = await supabase
          .from('habits')
          .update({ completed: true })
          .eq('id', habitId);

        if (habitError) {
          // Don't change local state on failure
          return;
        }

        // Insert habit_log with intensity_value
        const { error: logError } = await supabase.from('habit_logs').upsert({
          user_id: user.id,
          habit_id: habitId,
          date: today,
          status: 'completed',
          intensity_value: intensityValue
        }, { onConflict: 'user_id, habit_id, date' });

        if (logError) {
          // Rollback the habit completion in DB
          await supabase
            .from('habits')
            .update({ completed: false })
            .eq('id', habitId);
          return;
        }

        // Success: update local state
        set((state) => ({
          habits: state.habits.map(h =>
            h.id === habitId
              ? { ...h, completed: true, current_intensity: intensityValue }
              : h
          )
        }));

        // Award XP and stats via progression store
        useProgressionStore.getState().awardHabitCompletion({
          id: habit.id,
          category: habit.category,
          difficulty: habit.difficulty,
        });

        // Recalculate streak
        const { data: updatedLogs } = await supabase
          .from('habit_logs')
          .select('date, status')
          .eq('habit_id', habitId)
          .eq('status', 'completed');

        if (updatedLogs) {
          const newStreak = get().calculateStreak(habitId, updatedLogs.map(l => ({ ...l, habit_id: habitId })));
          set((state) => ({
            habits: state.habits.map(h => h.id === habitId ? { ...h, streak: newStreak } : h)
          }));
        }
      },

      deleteHabit: async (id: string) => {
        const { error } = await supabase
          .from('habits')
          .delete()
          .eq('id', id);

        if (!error) {
          set((state) => ({
            habits: state.habits.filter(h => h.id !== id)
          }));
        }
      },

      updateHabit: async (id: string, updates: Partial<HabitItem>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Map camelCase to snake_case for DB
        const dbUpdates: any = { ...updates };
        if (updates.iconName) { dbUpdates.icon_name = updates.iconName; delete dbUpdates.iconName; }
        if (updates.isSpecial !== undefined) { dbUpdates.is_special = updates.isSpecial; delete dbUpdates.isSpecial; }
        if (updates.specialLabel !== undefined) { dbUpdates.special_label = updates.specialLabel; delete dbUpdates.specialLabel; }
        if (updates.imageUrl) { dbUpdates.image_url = updates.imageUrl; delete dbUpdates.imageUrl; }
        if (updates.imagePosition) { dbUpdates.image_position = updates.imagePosition; delete dbUpdates.imagePosition; }
        // schedule_type and schedule_days use the same column names in DB — no mapping needed

        // Optimistic update
        set((state) => ({
          habits: state.habits.map(h => h.id === id ? { ...h, ...updates } : h)
        }));

        const { error } = await supabase
          .from('habits')
          .update(dbUpdates)
          .eq('id', id);

        if (error) {
          console.error("Error updating habit:", error);
          // Rollback could be implemented here
          await get().fetchHabits();
        }
      },

      completingHabitId: null,
      setCompletingHabitId: (id) => set({ completingHabitId: id }),

      rescueStreak: async (habitId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const broken = get().brokenStreaks.find(b => b.habitId === habitId);
        if (!broken) return;

        // Fill the gap (yesterday usually)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toLocaleDateString('en-CA');

        await supabase.from('habit_logs').upsert({
          user_id: user.id,
          habit_id: habitId,
          date: dateStr,
          status: 'completed'
        }, { onConflict: 'user_id, habit_id, date' });

        // Remove from broken streaks and refetch
        set(state => ({
          brokenStreaks: state.brokenStreaks.filter(b => b.habitId !== habitId)
        }));
        await get().fetchHabits();
      },

      reorderHabits: async (newOrder: HabitItem[]) => {
        const state = get();
        
        // Get IDs of habits being reordered
        const reorderedIds = new Set(newOrder.map(h => h.id));
        
        // Keep habits that are NOT in the newOrder
        const otherHabits = state.habits.filter(h => !reorderedIds.has(h.id));
        
        // Combine them: newOrder items get positions 1...N, others get N+1...M
        const allHabits = [
          ...newOrder.map((h, i) => ({ ...h, position: i + 1 })),
          ...otherHabits.map((h, i) => ({ ...h, position: newOrder.length + i + 1 }))
        ].sort((a, b) => a.position - b.position);

        set({ habits: allHabits });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from('habits')
          .upsert(
            allHabits.map(h => ({
              id: h.id,
              user_id: user.id,
              position: h.position,
              name: h.name,
              subtitle: h.subtitle,
              frequency: h.frequency,
              difficulty: h.difficulty,
              icon_name: h.iconName,
              category: h.category,
              color: h.color,
              completed: h.completed,
              skipped: h.skipped,
              is_special: h.isSpecial,
              special_label: h.specialLabel,
              image_url: h.imageUrl,
              image_position: h.imagePosition,
              target_intensity: h.target_intensity,
              current_intensity: h.current_intensity,
              schedule_type: h.schedule_type,
              schedule_days: h.schedule_days
            })),
            { onConflict: 'id' }
          );

        if (error) {
          console.error("Error reordering habits:", error);
          await get().fetchHabits(); // Rollback
        }
      },
    }),
    {
      name: 'intracker-habits-v2', // New name for Supabase-ready store
      version: 1,
    }
  )
);
