import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { getDefaultSchedule, calculateScheduleAwareStreak, filterHabitsByDay } from '../utils/scheduleHelpers';
import { shouldShowIntensityPicker } from '../utils/intensityHelpers';
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
  created_at?: string;
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
  toggleHabit: (id: string, field: 'completed' | 'skipped', date?: Date, currentValue?: boolean) => Promise<void>;
  completeWithIntensity: (habitId: string, intensityValue: number, date?: Date) => Promise<void>;
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
        if (localStorage.getItem('guest_mode') === 'true') {
          set({ loading: false });
          return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          set({ loading: false, habits: [], currentUserId: null });
          return;
        }

        // Timezone-aware date helper
        let today = new Date().toLocaleDateString('en-CA');
        try {
          const userStore = (await import('./useUserStore')).useUserStore;
          const userTimeZone = userStore.getState().settings.timezone || 'Asia/Jakarta';
          const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: userTimeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          });
          today = formatter.format(new Date());
        } catch (e) {
          console.error("Timezone format failed:", e);
        }
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
          // Deduplicate habitsData by name (case-insensitive) to prevent multiple identical cards
          const seenNames = new Set<string>();
          const uniqueHabits: typeof habitsData = [];
          const duplicateIds: string[] = [];

          habitsData.forEach(h => {
            const normalizedName = h.name.trim().toLowerCase();
            if (seenNames.has(normalizedName)) {
              duplicateIds.push(h.id);
            } else {
              seenNames.add(normalizedName);
              uniqueHabits.push(h);
            }
          });

          // Delete duplicates from Supabase asynchronously if any exist
          if (duplicateIds.length > 0) {
            console.log("Removing duplicate habits from Supabase:", duplicateIds);
            supabase
              .from('habits')
              .delete()
              .in('id', duplicateIds)
              .then(({ error }) => {
                if (error) console.error("Failed to delete duplicate habits:", error);
              });
          }

          // Calculate streaks for each unique habit
          const habitsWithStreaks = uniqueHabits.map(h => {
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
          
          let programPaused = false;
          try {
            const userStore = (await import('./useUserStore')).useUserStore;
            programPaused = userStore.getState().settings.programPaused;
          } catch (e) {
            console.error("Could not read programPaused state:", e);
          }

          if (!programPaused) {
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
          }
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
        // Prevent duplicate habit names
        const exists = get().habits.some(h => h.name.toLowerCase() === habit.name.toLowerCase());
        if (exists) {
          console.warn(`Habit with name "${habit.name}" already exists. Skipping.`);
          return;
        }

        const isGuest = localStorage.getItem('guest_mode') === 'true';
        if (isGuest) {
          const guestHabit: HabitItem = {
            id: 'guest-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
            name: habit.name,
            subtitle: habit.subtitle,
            frequency: habit.frequency,
            difficulty: habit.difficulty,
            iconName: habit.iconName,
            category: habit.category,
            color: habit.color,
            completed: habit.completed,
            skipped: habit.skipped,
            isSpecial: habit.isSpecial,
            specialLabel: habit.specialLabel,
            imageUrl: habit.imageUrl,
            imagePosition: habit.imagePosition,
            target_intensity: habit.target_intensity,
            current_intensity: habit.current_intensity || 0,
            streak: 0,
            schedule_type: habit.schedule_type || 'daily',
            schedule_days: habit.schedule_days || [0, 1, 2, 3, 4, 5, 6],
            position: get().habits.length > 0 
              ? Math.max(...get().habits.map(h => h.position)) + 1 
              : 1,
            created_at: new Date().toISOString()
          };
          set((state) => ({ habits: [...state.habits, guestHabit].sort((a, b) => a.position - b.position) }));
          return;
        }

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

      toggleHabit: async (id, field, date, currentValue) => {
        const habit = get().habits.find(h => h.id === id);
        if (!habit) return;

        const isToday = !date || (
          date.getFullYear() === new Date().getFullYear() &&
          date.getMonth() === new Date().getMonth() &&
          date.getDate() === new Date().getDate()
        );

        if (isToday) {
          const newValue = !habit[field];
          
          // Optimistic update
          set((state) => ({
            habits: state.habits.map(h => h.id === id ? { ...h, [field]: newValue } : h)
          }));

          if (newValue && field === 'completed') {
            useProgressionStore.getState().awardHabitCompletion({
              id: habit.id,
              category: habit.category,
              difficulty: habit.difficulty,
            });
          }

          const isNumeric = shouldShowIntensityPicker(habit.name);
          const finalIntensityValue = field === 'completed'
            ? (isNumeric ? (habit.target_intensity || 1) : null)
            : null;

          if (localStorage.getItem('guest_mode') === 'true') {
            // Local guest logging for today
            const localLogsStr = localStorage.getItem('guest_habit_logs') || '[]';
            let allLocalLogs = JSON.parse(localLogsStr);
            const dateStr = new Date().toLocaleDateString('en-CA');
            if (newValue) {
              allLocalLogs = allLocalLogs.filter((l: any) => !(l.habit_id === id && l.date === dateStr && l.status === (field === 'completed' ? 'completed' : 'skipped')));
              allLocalLogs.push({
                habit_id: id,
                date: dateStr,
                status: field === 'completed' ? 'completed' : 'skipped',
                intensity_value: finalIntensityValue
              });
            } else {
              allLocalLogs = allLocalLogs.filter((l: any) => !(l.habit_id === id && l.date === dateStr && l.status === (field === 'completed' ? 'completed' : 'skipped')));
            }
            localStorage.setItem('guest_habit_logs', JSON.stringify(allLocalLogs));
            return;
          }

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

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
              intensity_value: finalIntensityValue
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

          // Recalculate streak
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
        } else {
          // HISTORICAL PAST DATE
          const newValue = currentValue !== undefined ? !currentValue : true;
          const dateStr = date.toLocaleDateString('en-CA');

          const isNumeric = shouldShowIntensityPicker(habit.name);
          const finalIntensityValue = field === 'completed'
            ? (isNumeric ? (habit.target_intensity || 1) : null)
            : null;

          if (localStorage.getItem('guest_mode') === 'true') {
            const localLogsStr = localStorage.getItem('guest_habit_logs') || '[]';
            let allLocalLogs = JSON.parse(localLogsStr);
            if (newValue) {
              allLocalLogs = allLocalLogs.filter((l: any) => !(l.habit_id === id && l.date === dateStr && l.status === (field === 'completed' ? 'completed' : 'skipped')));
              allLocalLogs.push({
                habit_id: id,
                date: dateStr,
                status: field === 'completed' ? 'completed' : 'skipped',
                intensity_value: finalIntensityValue
              });
            } else {
              allLocalLogs = allLocalLogs.filter((l: any) => !(l.habit_id === id && l.date === dateStr && l.status === (field === 'completed' ? 'completed' : 'skipped')));
            }
            localStorage.setItem('guest_habit_logs', JSON.stringify(allLocalLogs));

            // Recalculate streak locally for guest
            const completedLogs = allLocalLogs.filter((l: any) => l.habit_id === id && l.status === 'completed');
            const newStreak = get().calculateStreak(id, completedLogs);
            set((state) => ({
              habits: state.habits.map(h => h.id === id ? { ...h, streak: newStreak } : h)
            }));
            return;
          }

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          if (newValue) {
            await supabase.from('habit_logs').upsert({
              user_id: user.id,
              habit_id: id,
              date: dateStr,
              status: field === 'completed' ? 'completed' : 'skipped',
              intensity_value: finalIntensityValue
            }, { onConflict: 'user_id, habit_id, date' });
          } else {
            await supabase.from('habit_logs').delete().eq('habit_id', id).eq('date', dateStr).eq('status', field === 'completed' ? 'completed' : 'skipped');
          }

          // Recalculate streak
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
        }
      },

      completeWithIntensity: async (habitId: string, intensityValue: number, date?: Date) => {
        const isToday = !date || (
          date.getFullYear() === new Date().getFullYear() &&
          date.getMonth() === new Date().getMonth() &&
          date.getDate() === new Date().getDate()
        );

        if (isToday) {
          const habit = get().habits.find(h => h.id === habitId);
          if (!habit) return;

          if (localStorage.getItem('guest_mode') === 'true') {
            set((state) => ({
              habits: state.habits.map(h =>
                h.id === habitId
                  ? { ...h, completed: true, current_intensity: intensityValue }
                  : h
              )
            }));
            useProgressionStore.getState().awardHabitCompletion({
              id: habit.id,
              category: habit.category,
              difficulty: habit.difficulty,
            });
            set((state) => ({
              habits: state.habits.map(h => h.id === habitId ? { ...h, streak: h.streak + 1 } : h)
            }));

            // Guest local logging
            const localLogsStr = localStorage.getItem('guest_habit_logs') || '[]';
            let allLocalLogs = JSON.parse(localLogsStr);
            const dateStr = new Date().toLocaleDateString('en-CA');
            allLocalLogs = allLocalLogs.filter((l: any) => !(l.habit_id === habitId && l.date === dateStr));
            allLocalLogs.push({
              habit_id: habitId,
              date: dateStr,
              status: 'completed',
              intensity_value: intensityValue
            });
            localStorage.setItem('guest_habit_logs', JSON.stringify(allLocalLogs));
            return;
          }

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
        } else {
          // HISTORICAL PAST DATE
          const dateStr = date.toLocaleDateString('en-CA');

          if (localStorage.getItem('guest_mode') === 'true') {
            const localLogsStr = localStorage.getItem('guest_habit_logs') || '[]';
            let allLocalLogs = JSON.parse(localLogsStr);
            allLocalLogs = allLocalLogs.filter((l: any) => !(l.habit_id === habitId && l.date === dateStr));
            allLocalLogs.push({
              habit_id: habitId,
              date: dateStr,
              status: 'completed',
              intensity_value: intensityValue
            });
            localStorage.setItem('guest_habit_logs', JSON.stringify(allLocalLogs));

            // Recalculate streak locally for guest
            const completedLogs = allLocalLogs.filter((l: any) => l.habit_id === habitId && l.status === 'completed');
            const newStreak = get().calculateStreak(habitId, completedLogs);
            set((state) => ({
              habits: state.habits.map(h => h.id === habitId ? { ...h, streak: newStreak } : h)
            }));
            return;
          }

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          await supabase.from('habit_logs').upsert({
            user_id: user.id,
            habit_id: habitId,
            date: dateStr,
            status: 'completed',
            intensity_value: intensityValue
          }, { onConflict: 'user_id, habit_id, date' });

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
        }
      },

      deleteHabit: async (id: string) => {
        if (localStorage.getItem('guest_mode') === 'true') {
          set((state) => ({
            habits: state.habits.filter(h => h.id !== id)
          }));
          return;
        }
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
        // Optimistic update
        set((state) => ({
          habits: state.habits.map(h => h.id === id ? { ...h, ...updates } : h)
        }));

        if (localStorage.getItem('guest_mode') === 'true') {
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const dbUpdates: any = { ...updates };
        if (updates.iconName !== undefined) dbUpdates.icon_name = updates.iconName;
        if (updates.isSpecial !== undefined) dbUpdates.is_special = updates.isSpecial;
        if (updates.specialLabel !== undefined) dbUpdates.special_label = updates.specialLabel;
        if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
        if (updates.imagePosition !== undefined) dbUpdates.image_position = updates.imagePosition;

        delete dbUpdates.iconName;
        delete dbUpdates.isSpecial;
        delete dbUpdates.specialLabel;
        delete dbUpdates.imageUrl;
        delete dbUpdates.imagePosition;

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
        if (localStorage.getItem('guest_mode') === 'true') {
          set(state => ({
            brokenStreaks: state.brokenStreaks.filter(b => b.habitId !== habitId),
            habits: state.habits.map(h => h.id === habitId ? { ...h, streak: h.streak + 1 } : h)
          }));
          return;
        }
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

        if (localStorage.getItem('guest_mode') === 'true') {
          return;
        }

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
      name: 'inrising-habits-v2', // New name for Supabase-ready store
      version: 1,
    }
  )
);
