import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

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
  deleteHabit: (id: string) => Promise<void>;
  updateHabit: (id: string, updates: Partial<HabitItem>) => Promise<void>;
  calculateStreak: (habitId: string, logs: any[]) => number;
  completingHabitId: string | null;
  setCompletingHabitId: (id: string | null) => void;
  brokenStreaks: Array<{ habitId: string; lastDate: string; daysMissing: number }>;
  rescueStreak: (habitId: string) => Promise<void>;
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
          .order('created_at', { ascending: true });

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
            
            let streak = 0;
            let checkDate = new Date();
            checkDate.setHours(0,0,0,0);
            
            for (const dateStr of uniqueDates) {
              const logDate = new Date(dateStr);
              logDate.setHours(0,0,0,0);
              
              const diff = Math.floor((checkDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
              
              if (diff <= 1) {
                streak++;
                checkDate = logDate;
              } else {
                break;
              }
            }

            return {
              ...h,
              iconName: h.icon_name,
              isSpecial: h.is_special,
              specialLabel: h.special_label,
              imageUrl: h.image_url,
              imagePosition: h.image_position,
              streak: streak || 0,
              target_intensity: h.target_intensity,
              current_intensity: h.current_intensity || 0
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
        const uniqueDates = Array.from(new Set(habitLogs.map(l => l.date))).sort().reverse();
        
        let streak = 0;
        let checkDate = new Date();
        checkDate.setHours(0,0,0,0);
        
        for (const dateStr of uniqueDates) {
          const logDate = new Date(dateStr);
          logDate.setHours(0,0,0,0);
          
          const diff = Math.floor((checkDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diff <= 1) {
            streak++;
            checkDate = logDate;
          } else {
            break;
          }
        }
        return streak;
      },

      addHabit: async (habit) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

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
          current_intensity: habit.current_intensity || 0
        };

        const { data, error } = await supabase
          .from('habits')
          .insert([dbHabit])
          .select()
          .single();

        if (!error && data) {
          const mapped = {
            ...data,
            iconName: data.icon_name,
            isSpecial: data.is_special,
            specialLabel: data.special_label,
            imageUrl: data.image_url,
            imagePosition: data.image_position,
            target_intensity: data.target_intensity,
            current_intensity: data.current_intensity
          };
          set((state) => ({ habits: [...state.habits, mapped as HabitItem] }));
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
            status: field === 'completed' ? 'completed' : 'skipped'
          }, { onConflict: 'user_id, habit_id, date' });
        } else {
          await supabase.from('habit_logs').delete().eq('habit_id', id).eq('date', today).eq('status', field === 'completed' ? 'completed' : 'skipped');
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
    }),
    {
      name: 'intracker-habits-v2', // New name for Supabase-ready store
      version: 1,
    }
  )
);
