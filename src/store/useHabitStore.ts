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
  addHabit: (habit: Omit<HabitItem, 'id' | 'user_id'>) => Promise<void>;
  toggleHabit: (id: string, field: 'completed' | 'skipped') => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set, get) => ({
      habits: INITIAL_HABITS_DATA,
      loading: false,
      currentUserId: null,
      lastSyncDate: null,
      totalStreak: 0,
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

        const { data, error } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (!error && data) {
          const mappedData = data.map(h => ({
            ...h,
            iconName: h.icon_name,
            isSpecial: h.is_special,
            specialLabel: h.special_label,
            imageUrl: h.image_url,
            imagePosition: h.image_position
          }));
          set({ habits: mappedData as HabitItem[] });
        }

        // --- STREAK CALCULATION ---
        const { data: logData } = await supabase
          .from('habit_logs')
          .select('date')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        if (logData) {
          const uniqueDates = Array.from(new Set(logData.map(l => l.date))).sort().reverse();
          let streak = 0;
          let checkDate = new Date();
          
          // Check if today or yesterday has a log to start/continue streak
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
          set({ totalStreak: streak });
        }

        set({ loading: false });
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
          image_position: habit.imagePosition
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
            imagePosition: data.image_position
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
          // Insert or update log
          await supabase.from('habit_logs').upsert({
            user_id: user.id,
            habit_id: id,
            date: today,
            status: field === 'completed' ? 'completed' : 'skipped'
          }, { onConflict: 'user_id, habit_id, date' });
        } else {
          // If unchecking, we might want to delete the log or change status
          // For simplicity, if unchecking 'completed', delete the 'completed' log
          await supabase.from('habit_logs').delete().eq('habit_id', id).eq('date', today).eq('status', field === 'completed' ? 'completed' : 'skipped');
        }

        // Recalculate streak after toggle
        get().fetchHabits();
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
    }),
    {
      name: 'intracker-habits-v2', // New name for Supabase-ready store
      version: 1,
    }
  )
);
