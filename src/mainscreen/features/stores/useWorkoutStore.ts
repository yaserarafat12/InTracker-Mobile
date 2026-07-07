import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ExerciseEntry {
  name: string;
  reps: number;
  timeSeconds: number;
  sets: number;
}

export interface WorkoutSession {
  id: string;
  date: string; // ISO string
  exercises: ExerciseEntry[];
  totalDurationSeconds: number;
  completedAt: string; // ISO string
}

interface WorkoutState {
  sessions: WorkoutSession[];
  weeklyCompleted: Record<string, boolean>;
}

interface WorkoutActions {
  addSession: (session: WorkoutSession) => void;
  getWeeklyProgress: () => boolean[];
  clearHistory: () => void;
}

export const useWorkoutStore = create<WorkoutState & WorkoutActions>()(
  persist(
    (set, get) => ({
      sessions: [],
      weeklyCompleted: {},

      addSession: (session) => {
        set((state) => ({
          sessions: [...state.sessions, session],
        }));
      },

      getWeeklyProgress: () => {
        const sessions = get().sessions;
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(now.getDate() + mondayOffset);

        const weekDays: boolean[] = [];
        for (let i = 0; i < 7; i++) {
          const day = new Date(monday);
          day.setDate(monday.getDate() + i);
          const dayStr = day.toLocaleDateString('en-CA'); // YYYY-MM-DD
          const hasSession = sessions.some((s) => {
            const sessionDate = new Date(s.completedAt).toLocaleDateString('en-CA');
            return sessionDate === dayStr;
          });
          weekDays.push(hasSession);
        }
        return weekDays;
      },

      clearHistory: () => {
        set({ sessions: [], weeklyCompleted: {} });
      },
    }),
    {
      name: 'inrising-workout-store',
    }
  )
);
