import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BreathingSession {
  id: string;
  date: string; // YYYY-MM-DD
  durationSeconds: number;
  completedAt: string; // ISO string
}

interface BreathingState {
  sessions: BreathingSession[];
}

interface BreathingActions {
  addSession: (durationSeconds: number) => void;
  getWeeklyProgress: () => boolean[];
  getTodayDurationMinutes: () => number;
  getWeekDurationMinutes: () => number;
  getMonthDurationMinutes: () => number;
  clearHistory: () => void;
}

export const useBreathingStore = create<BreathingState & BreathingActions>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (durationSeconds) => {
        const now = new Date();
        const session: BreathingSession = {
          id: Date.now().toString(),
          date: now.toLocaleDateString('en-CA'),
          durationSeconds,
          completedAt: now.toISOString(),
        };
        set((state) => ({ sessions: [...state.sessions, session] }));
      },

      getWeeklyProgress: () => {
        const sessions = get().sessions;
        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(now.getDate() + mondayOffset);

        const weekDays: boolean[] = [];
        for (let i = 0; i < 7; i++) {
          const day = new Date(monday);
          day.setDate(monday.getDate() + i);
          const dayStr = day.toLocaleDateString('en-CA');
          const hasSession = sessions.some((s) => s.date === dayStr);
          weekDays.push(hasSession);
        }
        return weekDays;
      },

      getTodayDurationMinutes: () => {
        const today = new Date().toLocaleDateString('en-CA');
        const seconds = get().sessions
          .filter((s) => s.date === today)
          .reduce((sum, s) => sum + s.durationSeconds, 0);
        return Math.round(seconds / 60);
      },

      getWeekDurationMinutes: () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(now.getDate() + mondayOffset);

        const seconds = get().sessions
          .filter((s) => new Date(s.completedAt) >= monday)
          .reduce((sum, s) => sum + s.durationSeconds, 0);
        return Math.round(seconds / 60);
      },

      getMonthDurationMinutes: () => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const seconds = get().sessions
          .filter((s) => new Date(s.completedAt) >= firstDayOfMonth)
          .reduce((sum, s) => sum + s.durationSeconds, 0);
        return Math.round(seconds / 60);
      },

      clearHistory: () => set({ sessions: [] }),
    }),
    {
      name: 'inrising-breathing-store',
    }
  )
);
