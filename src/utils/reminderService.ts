import { useUserStore } from '../store/useUserStore';
import { useHabitStore } from '../store/useHabitStore';
import { useTargetStore } from '../store/useTargetStore';
import { useJourneyStore } from '../store/useJourneyStore';
import { filterHabitsByDay } from './scheduleHelpers';

// Helper to format date as local YYYY-MM-DD
const getLocalTodayString = (date: Date): string => {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// Generates personalized dynamic messages based on current phase of day and actual user data
export const getReminderMessage = (language: string): { title: string; body: string } | null => {
  const now = new Date();
  const hours = now.getHours();
  const isIndonesian = language === 'Bahasa Indonesia';
  const todayStr = getLocalTodayString(now);

  // 1. Fetch incomplete habits scheduled for today
  const habits = useHabitStore.getState().habits || [];
  const scheduledToday = filterHabitsByDay(habits, now.getDay());
  const incompleteHabits = scheduledToday.filter(h => !h.completed && !h.skipped);
  const incompleteHabitsCount = incompleteHabits.length;

  // 2. Fetch incomplete todo items (targets)
  const targets = useTargetStore.getState().targets || [];
  const incompleteTodos = targets.filter(t => !t.completed);
  const incompleteTodosCount = incompleteTodos.length;

  // 3. Fetch daily journal text
  const entries = useJourneyStore.getState().entries || {};
  const todayEntry = entries[todayStr];
  const missingJournal = !todayEntry || !todayEntry.journal_text;

  // PAGI (Morning: 04:00 - 11:59)
  if (hours >= 4 && hours < 12) {
    return {
      title: isIndonesian ? "Awali Hari Anda 🌅" : "Start Your Day 🌅",
      body: isIndonesian 
        ? "Jadwalkan daftar tugas (todo list) dan mulai kebiasaan harian Anda hari ini."
        : "Schedule your todo list and start your daily habits today."
    };
  }

  // SIANG (Afternoon: 12:00 - 14:59)
  if (hours >= 12 && hours < 15) {
    return {
      title: isIndonesian ? "Tetap Fokus Siang Ini! ⚡" : "Stay Focused! ⚡",
      body: isIndonesian
        ? `Lanjutkan progres Anda. Ada ${incompleteHabitsCount} kebiasaan dan ${incompleteTodosCount} tugas tersisa.`
        : `Keep up your progress. There are ${incompleteHabitsCount} habits and ${incompleteTodosCount} tasks remaining.`
    };
  }

  // SORE (Evening/Last Nudge: 15:00 - 17:59)
  if (hours >= 15 && hours < 18) {
    return {
      title: isIndonesian ? "Pengingat Terakhir Hari Ini ⏰" : "Last Reminder Today ⏰",
      body: isIndonesian
        ? `Hari mulai sore. Selesaikan ${incompleteHabitsCount} kebiasaan dan ${incompleteTodosCount} tugas Anda sebelum hari berganti.`
        : `Evening is coming. Complete your ${incompleteHabitsCount} remaining habits and ${incompleteTodosCount} tasks before the day ends.`
    };
  }

  // MALAM (Night: 18:00 - 03:59)
  if (missingJournal) {
    return {
      title: isIndonesian ? "Catat Perjalanan Hari Ini 📝" : "Write Today's Journal 📝",
      body: isIndonesian
        ? "Evaluasi hari Anda. Catat pencapaian dan refleksi hari ini di menu Jurnal."
        : "Evaluate your day. Record today's achievements and reflections in the Journal."
    };
  }

  if (incompleteHabitsCount > 0 || incompleteTodosCount > 0) {
    return {
      title: isIndonesian ? "Selesaikan Hari Anda 🌙" : "Wrap Up Your Day 🌙",
      body: isIndonesian
        ? `Anda masih memiliki beberapa kebiasaan atau tugas yang belum diselesaikan malam ini.`
        : `You still have some incomplete habits or tasks to wrap up tonight.`
    };
  }

  // All completed
  return {
    title: isIndonesian ? "Luar Biasa! 🎉" : "Outstanding! 🎉",
    body: isIndonesian
      ? "Semua kebiasaan, tugas, dan jurnal Anda hari ini telah tuntas diselesaikan. Pertahankan streak Anda!"
      : "All your habits, tasks, and journals today have been completed. Keep up the streak!"
  };
};

const triggerNotification = (title: string, body: string) => {
  // 1. Mobile Capacitor Local Notifications Bridge
  const win = window as any;
  if (win.Capacitor?.isPluginAvailable('LocalNotifications')) {
    try {
      win.Capacitor.Plugins.LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 500) }
          }
        ]
      });
      console.log("[InTracker] Capacitor local notification fired:", { title, body });
      return;
    } catch (e) {
      console.error("[InTracker] Capacitor local notifications failed:", e);
    }
  }

  // 2. Web Browser Notification Fallback
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/logo.png',
    });
    console.log("[InTracker] Web notification fired:", { title, body });
  }
};

let reminderInterval: any = null;

export const initReminderEngine = () => {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }

  const checkReminders = () => {
    const settings = useUserStore.getState().settings;
    if (!settings.dailyReminder) return;

    const timeStr = settings.dailyReminderTime || '08:00 PM';
    const [time, modifier] = timeStr.split(' ');
    if (!time || !modifier) return;

    let [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const now = new Date();
    if (now.getHours() === hours && now.getMinutes() === minutes) {
      // Prevent double notifications in the same minute
      const lastSentStr = localStorage.getItem('last_reminder_sent');
      const todaySentKey = `${now.toDateString()}_${hours}_${minutes}`;

      if (lastSentStr !== todaySentKey) {
        localStorage.setItem('last_reminder_sent', todaySentKey);

        const msg = getReminderMessage(settings.language || 'English');
        if (msg) {
          triggerNotification(msg.title, msg.body);
        }
      }
    }
  };

  // Run initial check and then run every 30 seconds
  checkReminders();
  reminderInterval = setInterval(checkReminders, 30000);
  console.log("[InTracker] Reminder check engine initialized.");
};

export const startReminderService = () => {
  initReminderEngine();

  // Re-initialize reminder engine on store changes
  useUserStore.subscribe(() => {
    initReminderEngine();
  });
};
