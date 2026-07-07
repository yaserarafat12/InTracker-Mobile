import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PomodoroSession {
  id: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  completedAt: string; // ISO string
}

interface PomodoroState {
  sessions: PomodoroSession[];
}

interface PomodoroActions {
  addSession: (durationMinutes: number) => void;
  getTodaySessions: () => PomodoroSession[];
  getWeekSessions: () => PomodoroSession[];
  getTotalFocusMinutes: () => number;
  getTodayFocusMinutes: () => number;
  getWeekFocusMinutes: () => number;
  getStreak: () => number;
  clearHistory: () => void;
}

export const usePomodoroStore = create<PomodoroState & PomodoroActions>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (durationMinutes) => {
        const now = new Date();
        const session: PomodoroSession = {
          id: Date.now().toString(),
          date: now.toLocaleDateString('en-CA'),
          durationMinutes,
          completedAt: now.toISOString(),
        };
        set((state) => ({ sessions: [...state.sessions, session] }));
      },

      getTodaySessions: () => {
        const today = new Date().toLocaleDateString('en-CA');
        return get().sessions.filter((s) => s.date === today);
      },

      getWeekSessions: () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(now.getDate() + mondayOffset);
        return get().sessions.filter((s) => new Date(s.completedAt) >= monday);
      },

      getTotalFocusMinutes: () => {
        return get().sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      },

      getTodayFocusMinutes: () => {
        const today = new Date().toLocaleDateString('en-CA');
        return get().sessions
          .filter((s) => s.date === today)
          .reduce((sum, s) => sum + s.durationMinutes, 0);
      },

      getWeekFocusMinutes: () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(now.getDate() + mondayOffset);
        return get().sessions
          .filter((s) => new Date(s.completedAt) >= monday)
          .reduce((sum, s) => sum + s.durationMinutes, 0);
      },

      getStreak: () => {
        const sessions = get().sessions;
        if (sessions.length === 0) return 0;

        const uniqueDates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
        const today = new Date().toLocaleDateString('en-CA');
        
        // Check if today or yesterday has a session
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA');
        
        if (uniqueDates[0] !== today && uniqueDates[0] !== yesterdayStr) return 0;

        let streak = 0;
        let checkDate = new Date();
        if (uniqueDates[0] !== today) {
          checkDate.setDate(checkDate.getDate() - 1);
        }

        for (let i = 0; i < 365; i++) {
          const dateStr = checkDate.toLocaleDateString('en-CA');
          if (uniqueDates.includes(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        return streak;
      },

      clearHistory: () => set({ sessions: [] }),
    }),
    {
      name: 'inrising-pomodoro-store',
    }
  )
);
