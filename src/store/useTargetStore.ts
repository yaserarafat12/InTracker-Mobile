import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export type TargetMode = 'checklist' | 'number';
export type TargetWindow = 'today' | 'upcoming' | 'someday' | 'delayed';
export type TargetPriority = 'tinggi' | 'sedang' | 'rendah';

export interface TargetStep {
  id: string;
  title: string;
  completed: boolean;
}

export interface TargetItem {
  id: string;
  user_id?: string;
  title: string;
  icon: string;
  accent: string;
  window: TargetWindow;
  priority: TargetPriority;
  mode: TargetMode;
  steps: TargetStep[];
  currentValue: number;
  targetValue: number;
  unit: string;
  completed: boolean;
  starred: boolean;
  createdAt: string;
}

interface TargetStore {
  targets: TargetItem[];
  loading: boolean;
  currentUserId: string | null;
  fetchTargets: () => Promise<void>;
  addTarget: (target: Omit<TargetItem, 'id' | 'createdAt' | 'completed' | 'user_id'>) => Promise<void>;
  deleteTarget: (id: string) => Promise<void>;
  toggleStep: (targetId: string, stepId: string) => Promise<void>;
  updateNumberProgress: (targetId: string, value: number) => Promise<void>;
  completeTarget: (targetId: string) => Promise<void>;
  toggleStar: (targetId: string) => Promise<void>;
  updateTargetWindow: (targetId: string, window: TargetWindow) => Promise<void>;
  toggleComplete: (targetId: string) => Promise<void>;
  updateTarget: (id: string, updates: Partial<TargetItem>) => Promise<void>;
}

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const getTargetProgress = (target: TargetItem) => {
  if (target.completed) return 100;

  if (target.mode === 'number') {
    if (!target.targetValue) return 0;
    return Math.min(100, Math.round((target.currentValue / target.targetValue) * 100));
  }

  if (!target.steps.length) return 0;
  const done = target.steps.filter((step) => step.completed).length;
  return Math.round((done / target.steps.length) * 100);
};

export const useTargetStore = create<TargetStore>()(
  persist(
    (set, get) => ({
      targets: [],
      loading: false,
      currentUserId: null,

      fetchTargets: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          set({ loading: false, targets: [], currentUserId: null });
          return;
        }

        // Collision Guard: Clear data if user changed
        if (get().currentUserId !== user.id) {
          set({ targets: [], currentUserId: user.id });
        }

        set({ loading: true });

        const { data, error } = await supabase
          .from('targets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const today = new Date().toLocaleDateString('en-CA');
          const mappedData = data.map((t) => ({
            ...t,
            currentValue: t.current_value,
            targetValue: t.target_value,
            starred: t.starred ?? false,
            createdAt: t.created_at,
          }));

          // AUTO-SWEEP LOGIC: Move uncompleted 'today' targets from previous days to 'delayed'
          const toDelay: string[] = [];
          const updatedTargets = mappedData.map(t => {
            const itemDate = new Date(t.createdAt).toLocaleDateString('en-CA');
            if (t.window === 'today' && !t.completed && itemDate < today) {
              toDelay.push(t.id);
              return { ...t, window: 'delayed' as const };
            }
            return t;
          });

          if (toDelay.length > 0) {
            console.log(`Auto-delaying ${toDelay.length} expired targets.`);
            // Background update to Supabase
            supabase.from('targets').update({ window: 'delayed' }).in('id', toDelay).then();
          }

          set({ targets: updatedTargets as TargetItem[] });
        }
        set({ loading: false });
      },

      addTarget: async (target) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const dbTarget = {
          user_id: user.id,
          title: target.title,
          icon: target.icon,
          accent: target.accent,
          window: target.window,
          priority: target.priority,
          mode: target.mode,
          steps: target.steps,
          current_value: 0,
          target_value: target.targetValue,
          unit: target.unit,
          completed: false,
          starred: target.starred ?? false,
        };

        const { data, error } = await supabase
          .from('targets')
          .insert([dbTarget])
          .select()
          .single();

        if (!error && data) {
          const mapped = {
            ...data,
            currentValue: data.current_value,
            targetValue: data.target_value,
            starred: data.starred ?? false,
            createdAt: data.created_at,
          };
          set((state) => ({ targets: [mapped as TargetItem, ...state.targets] }));
        }
      },

      deleteTarget: async (id) => {
        const { error } = await supabase.from('targets').delete().eq('id', id);
        if (!error) {
          set((state) => ({
            targets: state.targets.filter((target) => target.id !== id),
          }));
        }
      },

      toggleStep: async (targetId, stepId) => {
        const target = get().targets.find((t) => t.id === targetId);
        if (!target) return;

        const nextSteps = target.steps.map((step) =>
          step.id === stepId ? { ...step, completed: !step.completed } : step
        );
        const nextCompleted = nextSteps.length > 0 && nextSteps.every((s) => s.completed);

        // Optimistic update
        set((state) => ({
          targets: state.targets.map((t) =>
            t.id === targetId ? { ...t, steps: nextSteps, completed: nextCompleted } : t
          ),
        }));

        await supabase
          .from('targets')
          .update({ steps: nextSteps, completed: nextCompleted })
          .eq('id', targetId);
      },

      updateNumberProgress: async (targetId, value) => {
        const target = get().targets.find((t) => t.id === targetId);
        if (!target) return;

        const nextValue = Math.max(0, Math.min(value, target.targetValue));
        const nextCompleted = target.targetValue > 0 && nextValue >= target.targetValue;

        // Optimistic update
        set((state) => ({
          targets: state.targets.map((t) =>
            t.id === targetId ? { ...t, currentValue: nextValue, completed: nextCompleted } : t
          ),
        }));

        await supabase
          .from('targets')
          .update({ current_value: nextValue, completed: nextCompleted })
          .eq('id', targetId);
      },

      completeTarget: async (targetId) => {
        const target = get().targets.find((t) => t.id === targetId);
        if (!target) return;

        const nextSteps = target.steps.map((s) => ({ ...s, completed: true }));
        const nextValue = target.mode === 'number' ? target.targetValue : target.currentValue;

        // Optimistic update
        set((state) => ({
          targets: state.targets.map((t) =>
            t.id === targetId ? { ...t, completed: true, steps: nextSteps, currentValue: nextValue } : t
          ),
        }));

        await supabase
          .from('targets')
          .update({
            completed: true,
            steps: nextSteps,
            current_value: nextValue,
          })
          .eq('id', targetId);
      },

      toggleStar: async (targetId: string) => {
        const target = get().targets.find((t) => t.id === targetId);
        if (!target) return;

        const nextStarred = !target.starred;

        // Optimistic update
        set((state) => ({
          targets: state.targets.map((t) =>
            t.id === targetId ? { ...t, starred: nextStarred } : t
          ),
        }));

        await supabase
          .from('targets')
          .update({ starred: nextStarred })
          .eq('id', targetId);
      },

      updateTargetWindow: async (targetId: string, window: TargetWindow) => {
        const target = get().targets.find((t) => t.id === targetId);
        if (!target) return;

        set((state) => ({
          targets: state.targets.map((t) =>
            t.id === targetId ? { ...t, window } : t
          ),
        }));

        await supabase
          .from('targets')
          .update({ window })
          .eq('id', targetId);
      },

      toggleComplete: async (targetId: string) => {
        const target = get().targets.find((t) => t.id === targetId);
        if (!target) return;

        const nextCompleted = !target.completed;
        const nextSteps = target.steps.map((s) => ({ ...s, completed: nextCompleted }));
        const nextValue = target.mode === 'number' 
          ? (nextCompleted ? target.targetValue : 0) 
          : target.currentValue;

        // Optimistic update
        set((state) => ({
          targets: state.targets.map((t) =>
            t.id === targetId 
            ? { ...t, completed: nextCompleted, steps: nextSteps, currentValue: nextValue } 
            : t
          ),
        }));

        await supabase
          .from('targets')
          .update({
            completed: nextCompleted,
            steps: nextSteps,
            current_value: nextValue,
          })
          .eq('id', targetId);
      },

      updateTarget: async (id, updates) => {
        // Prepare DB fields
        const dbUpdates: any = { ...updates };
        if (updates.targetValue !== undefined) dbUpdates.target_value = updates.targetValue;
        if (updates.currentValue !== undefined) dbUpdates.current_value = updates.currentValue;

        // Clean up JS-only fields
        delete dbUpdates.id;
        delete dbUpdates.createdAt;
        delete dbUpdates.targetValue;
        delete dbUpdates.currentValue;

        // Optimistic update
        set((state) => ({
          targets: state.targets.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));

        const { error } = await supabase.from('targets').update(dbUpdates).eq('id', id);
        if (error) {
          console.error('Error updating target:', error);
          // Rollback could be implemented here if needed
        }
      },
    }),
    {
      name: 'intracker-targets-v2', // Changed name for Supabase sync
      version: 1,
    }
  )
);

export const createTargetStep = (title: string): TargetStep => ({
  id: createId(),
  title,
  completed: false,
});
