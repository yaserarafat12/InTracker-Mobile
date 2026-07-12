import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useHabitStore } from '../../store/useHabitStore';
import { useUserStore } from '../../store/useUserStore';
import { useTargetStore } from '../../store/useTargetStore';
import { useJourneyStore } from '../../store/useJourneyStore';
import { useProgressionStore } from '../../store/useProgressionStore';
import { supabase } from '../../lib/supabase';
import { HABIT_OPTIONS } from '../habits/icons/index';
import { calculateBarHeights, shouldShowIntensityPicker } from '../../utils/intensityHelpers';
import { isScheduledDay } from '../../utils/scheduleHelpers';
import { getLevelInfo } from '../../engines/levelSystem';
import LoadingScreen from '../../components/LoadingScreen';
import { useTranslation } from '../../i18n';
import { getGenderedImageUrl } from '../../utils/imageHelpers';

// --- Types ---
type MainTab = 'recap' | 'pattern' | 'stats';
type TimeRange = 'weekly' | 'monthly' | '90days';

interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'skipped';
  intensity_value?: number | null;
}

interface DayStatus {
  date: Date;
  dateStr: string;
  active: boolean;
  isToday: boolean;
  isFuture: boolean;
  dayOfMonth: number;
  dayNumber?: number; // Day 1-90 for 90-day view
}

interface AnalyticsData {
  habitLogs: HabitLog[];
  loading: boolean;
}

// --- Helpers ---
function formatDate(d: Date): string {
  // Use local date format YYYY-MM-DD (same as habit store)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

function getDateRange(range: TimeRange, programDuration: number = 90): { startDate: string; endDate: string; days: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = formatDate(today);

  if (range === 'weekly') {
    // Monday to today (current week)
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const startDate = formatDate(monday);
    const days = Math.floor((today.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return { startDate, endDate, days };
  }

  let daysCount: number;
  switch (range) {
    case 'monthly': daysCount = 30; break;
    case '90days': daysCount = programDuration; break;
    default: daysCount = 7;
  }

  const start = new Date(today);
  start.setDate(start.getDate() - (daysCount - 1));
  const startDate = formatDate(start);

  return { startDate, endDate, days: daysCount };
}

function buildDayStatuses(range: TimeRange, activeDates: Set<string>, programDuration: number = 90): DayStatus[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDate(today);

  if (range === 'weekly') {
    // Show Monday to Sunday of current week
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const result: DayStatus[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = formatDate(date);
      result.push({
        date,
        dateStr,
        active: activeDates.has(dateStr),
        isToday: dateStr === todayStr,
        isFuture: date > today,
        dayOfMonth: date.getDate(),
      });
    }
    return result;
  }

  // Monthly & 90 days: show last N days
  const { days } = getDateRange(range, programDuration);
  const result: DayStatus[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = formatDate(date);
    result.push({
      date,
      dateStr,
      active: activeDates.has(dateStr),
      isToday: dateStr === todayStr,
      isFuture: date > today,
      dayOfMonth: date.getDate(),
    });
  }
  return result;
}

// --- Day labels (Senin - Minggu) ---
const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

// --- Main Component ---
export const AnalyticsView = ({ tutorialStep }: { tutorialStep?: number }) => {
  const { t } = useTranslation();
  const { habits, fetchHabits } = useHabitStore();
  const { profile, settings } = useUserStore();
  const gender = settings?.gender || 'Male';
  const { targets } = useTargetStore();
  const { entries: journeyEntries, fetchEntries } = useJourneyStore();

  const [mainTab, setMainTab] = useState<MainTab>('pattern');
  const [recapRange, setRecapRange] = useState<TimeRange>('weekly');
  const [patternRange, setPatternRange] = useState<TimeRange>('weekly');

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    habitLogs: [],
    loading: true,
  });

  // Fetch habit logs from Supabase or Local Storage (Guest Mode)
  const fetchAnalytics = useCallback(async () => {
    const isGuest = localStorage.getItem('guest_mode') === 'true';
    if (isGuest) {
      setAnalyticsData(prev => ({ ...prev, loading: true }));
      const guestLogsStr = localStorage.getItem('guest_habit_logs') || '[]';
      try {
        const guestLogs = JSON.parse(guestLogsStr);
        const mappedLogs = guestLogs.map((l: any) => ({
          id: l.id || Math.random().toString(),
          user_id: 'guest-id',
          habit_id: l.habit_id,
          date: l.date,
          status: l.status,
          intensity_value: l.intensity_value ?? null,
        }));
        setAnalyticsData({ habitLogs: mappedLogs, loading: false });
      } catch {
        setAnalyticsData({ habitLogs: [], loading: false });
      }
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAnalyticsData({ habitLogs: [], loading: false });
      return;
    }

    setAnalyticsData(prev => ({ ...prev, loading: true }));

    // Fetch data from join date or 90 days ago (whichever is earlier)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // Use profile join date if available and earlier than 90 days ago
    let fetchFrom = ninetyDaysAgo;
    if (profile?.created_at) {
      const joinDate = new Date(profile.created_at);
      if (joinDate < fetchFrom) {
        fetchFrom = joinDate;
      }
    }
    
    // Fetch ALL habit logs (no date filter) to ensure 90-day program has full data
    const { data: logs, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id);

    if (!error && logs) {
      setAnalyticsData({ habitLogs: logs as HabitLog[], loading: false });
    } else {
      setAnalyticsData({ habitLogs: [], loading: false });
    }
  }, [profile?.created_at]);

  useEffect(() => {
    fetchAnalytics();
    fetchHabits();
    fetchEntries();
  }, [fetchAnalytics, fetchHabits, fetchEntries]);

  const mainTabs: { id: MainTab; label: string }[] = [
    { id: 'pattern', label: t('analytics.tabs.pattern') },
    { id: 'stats', label: t('analytics.tabs.stats') },
    { id: 'recap', label: t('analytics.tabs.activity') },
  ];

  const programDuration = settings.programDuration || 90;
  const timeRanges: { id: TimeRange; label: string }[] = [
    { id: 'weekly', label: t('analytics.ranges.week') },
    { id: 'monthly', label: t('analytics.ranges.month') },
    { id: '90days', label: `${programDuration} Hari` },
  ];

  if (analyticsData.loading) {
    return <LoadingScreen message={t('analytics.loading')} />;
  }

  const isLight = !document.documentElement.classList.contains('dark');

  return (
    <div className={`flex flex-col h-full font-['Outfit'] px-5 pt-8 pb-32 ${isLight ? 'text-black' : 'text-[#E3DAC9]'}`}>
      {/* Main Tabs */}
      <div className="flex items-center gap-3 mb-14">
        {mainTabs.map((tab) => (
          <motion.button
            key={tab.id}
            id={`analytics-tab-${tab.id}`}
            whileTap={{ scale: 0.96 }}
            onClick={() => setMainTab(tab.id)}
            className={`flex-1 py-2.5 rounded-[8px] text-[10px] font-black uppercase tracking-wider transition-all border-2 ${
              mainTab === tab.id ? 'sheen-active-tab transform scale-[1.05]' : 'transform scale-100'
            } ${
              mainTab === tab.id
                ? isLight
                  ? 'border-neutral-300 bg-gradient-to-br from-white to-[#F2F4F7] text-neutral-900 shadow-[0_6px_16px_rgba(0,0,0,0.12)]'
                  : 'border-white/15 bg-gradient-to-br from-[#2D3035] to-[#1C1E22] text-white shadow-[0_6px_16px_rgba(0,0,0,0.15)]'
                : isLight
                  ? 'bg-white text-neutral-400 border-neutral-200 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:text-neutral-600'
                  : 'bg-[#1C1E22]/50 border-white/[0.07] text-[#E3DAC9]/40 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:text-[#E3DAC9]/60'
            }`}
          >
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {mainTab === 'recap' && (
          <motion.div
            key="recap"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ActivityRecap
              habits={habits}
              habitLogs={analyticsData.habitLogs}
              targets={targets}
              journeyEntries={journeyEntries}
              timeRange={recapRange}
              setTimeRange={setRecapRange}
              timeRanges={timeRanges}
              profile={profile}
            />
          </motion.div>
        )}
        {mainTab === 'pattern' && (
          <motion.div
            key="pattern"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <HabitPattern
              habits={habits}
              habitLogs={analyticsData.habitLogs}
              timeRange={patternRange}
              setTimeRange={setPatternRange}
              timeRanges={timeRanges}
              tutorialStep={tutorialStep}
            />
          </motion.div>
        )}
        {mainTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <StatsRPG
              profile={profile}
              habits={habits}
              habitLogs={analyticsData.habitLogs}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// ============================================
// SECTION A: ACTIVITY RECAP (REAL DATA)
// ============================================
function ActivityRecap({ habits, habitLogs, targets, journeyEntries, timeRange, setTimeRange, timeRanges, profile }: {
  habits: any[];
  habitLogs: HabitLog[];
  targets: any[];
  journeyEntries: Record<string, any>;
  timeRange: TimeRange;
  setTimeRange: (r: TimeRange) => void;
  timeRanges: { id: TimeRange; label: string }[];
  profile: any;
}) {
  const { t } = useTranslation();
  const { settings } = useUserStore();
  const isLight = !document.documentElement.classList.contains('dark');
  const programDuration = settings.programDuration || 90;
  const { startDate, endDate, days: daysInRange } = useMemo(() => getDateRange(timeRange, programDuration), [timeRange, programDuration]);

  // Filter logs for current time range
  const logsInRange = useMemo(() => {
    return habitLogs.filter(log => log.date >= startDate && log.date <= endDate);
  }, [habitLogs, startDate, endDate]);

  // Completed logs only for active habits
  const completedLogs = useMemo(() => {
    const activeHabitIds = new Set(habits.map(h => h.id));
    return logsInRange.filter(log => log.status === 'completed' && activeHabitIds.has(log.habit_id));
  }, [logsInRange, habits]);

  // Active dates (days with at least 1 completed habit)
  // For program duration view, use ALL logs from join date (not just last N days)
  const activeDates = useMemo(() => {
    const dates = new Set<string>();
    if (timeRange === '90days') {
      const activeHabitIds = new Set(habits.map(h => h.id));
      // Use all completed logs regardless of range filter
      habitLogs
        .filter(log => log.status === 'completed' && activeHabitIds.has(log.habit_id))
        .forEach(log => dates.add(log.date));
    } else {
      completedLogs.forEach(log => dates.add(log.date));
    }
    return dates;
  }, [timeRange, completedLogs, habitLogs, habits]);

  // Build day statuses for calendar
  const dayStatuses = useMemo(() => {
    if (timeRange === '90days') {
      // Find the earliest date: use profile.created_at or earliest habit log
      let joinDate: Date | null = null;
      
      if (profile?.created_at) {
        joinDate = new Date(profile.created_at);
      }
      
      // Fallback: use the earliest habit log date
      if (!joinDate && habitLogs.length > 0) {
        const sortedDates = habitLogs.map(l => l.date).sort();
        joinDate = new Date(sortedDates[0] + 'T00:00:00');
      }
      
      // Final fallback: N days ago
      if (!joinDate) {
        joinDate = new Date();
        joinDate.setDate(joinDate.getDate() - (programDuration - 1));
      }
      
      joinDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = formatDate(today);
      
      const result: DayStatus[] = [];
      for (let i = 0; i < programDuration; i++) {
        const date = new Date(joinDate);
        date.setDate(joinDate.getDate() + i);
        const dateStr = formatDate(date);
        result.push({
          date,
          dateStr,
          active: activeDates.has(dateStr),
          isToday: dateStr === todayStr,
          isFuture: date > today,
          dayOfMonth: date.getDate(),
          dayNumber: i + 1,
        });
      }
      return result;
    }
    return buildDayStatuses(timeRange, activeDates, programDuration);
  }, [timeRange, activeDates, profile?.created_at, habitLogs, programDuration]);

  // Habit Rate = completed logs on scheduled days / total possible scheduled days x 100
  const habitRate = useMemo(() => {
    let totalPossible = 0;
    let completedCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const habitIds = new Set(habits.map(h => h.id));
    const activeCompletedLogs = completedLogs.filter(log => habitIds.has(log.habit_id));

    habits.forEach(h => {
      const created = h.created_at ? new Date(h.created_at) : new Date(0);
      created.setHours(0, 0, 0, 0);

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const rangeStart = created > start ? created : start;

      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);
      const rangeEnd = end < today ? end : today;

      const scheduleDays = h.schedule_days && h.schedule_days.length > 0
        ? h.schedule_days
        : [0, 1, 2, 3, 4, 5, 6];

      if (rangeStart <= rangeEnd) {
        const temp = new Date(rangeStart);
        while (temp <= rangeEnd) {
          if (scheduleDays.includes(temp.getDay())) {
            totalPossible++;
            const dateStr = formatDate(temp);
            const isCompleted = activeCompletedLogs.some(log => log.habit_id === h.id && log.date === dateStr);
            if (isCompleted) {
              completedCount++;
            }
          }
          temp.setDate(temp.getDate() + 1);
        }
      }
    });

    if (totalPossible === 0) return 0;
    return Math.min(100, Math.round((completedCount / totalPossible) * 100));
  }, [completedLogs, habits, startDate, endDate]);

  // To-Do Selesai = completed targets in range (using local date from completedAt)
  const todosCompleted = useMemo(() => {
    return targets.filter(t => {
      if (!t.completed) return false;
      // If no completedAt, still count it (legacy data)
      if (!t.completedAt) return true;
      // Convert UTC timestamp to local date string for comparison
      const localDate = new Date(t.completedAt).toLocaleDateString('en-CA'); // YYYY-MM-DD local
      return localDate >= startDate && localDate <= endDate;
    }).length;
  }, [targets, startDate, endDate]);

  // Hari Jurnal = days with any journey activity (mood, journal, or photo) in range
  const journalDays = useMemo(() => {
    let count = 0;
    Object.values(journeyEntries).forEach((entry: any) => {
      if (entry.entry_date >= startDate && entry.entry_date <= endDate) {
        // Count if ANY of: mood selected, journal written, or photo uploaded
        const hasMood = entry.mood_id !== null && entry.mood_id !== undefined;
        const hasJournal = entry.journal_text && entry.journal_text.trim().length > 0;
        const hasMedia = entry.media_urls && entry.media_urls.length > 0;
        if (hasMood || hasJournal || hasMedia) {
          count++;
        }
      }
    });
    return count;
  }, [journeyEntries, startDate, endDate]);

  return (
    <div id="analytics-activity-recap-container" className="space-y-4">
      {/* Time Range Toggle - compact */}
      <div className={`border-[1.5px] border-white/10 rounded-[14px] px-2 py-2 flex items-center gap-3 w-fit transition-all ${
        isLight ? 'bg-[#1c1e22]/60' : 'bg-[#1c1e22] '
      }`}>
        {timeRanges.map((r) => (
          <button
            key={r.id}
            onClick={() => setTimeRange(r.id)}
            className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-all ${
              timeRange === r.id
                ? (isLight
                    ? 'bg-[#7BE495] text-black border border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#7BE495]/15 text-[#7BE495] border border-[#7BE495]/30')
                : (isLight
                    ? 'text-black/55 border border-transparent'
                    : 'text-[#E3DAC9]/30 border border-transparent')
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Dot Calendar */}
      <div className={`backdrop-blur-md rounded-[20px] p-5 border-[1.5px] border-white/10 transition-all ${
        isLight ? 'bg-[#1c1e22]/60' : 'bg-[#1c1e22]/70'
      }`}>

        {timeRange === 'weekly' && <WeeklyGrid days={dayStatuses} />}
        {timeRange === 'monthly' && <MonthlyGrid days={dayStatuses} />}
        {timeRange === '90days' && <CompactGrid key="90days-grid" days={dayStatuses} />}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard icon="solar:checklist-minimalistic-bold" value={`${habitRate}%`} label={t('analytics.summary.habitRate')} color="#7BE495" />
        <SummaryCard icon="solar:target-bold" value={`${todosCompleted}`} label={t('analytics.summary.todoCompleted')} color="#7BE495" />
        <SummaryCard icon="solar:notebook-bold" value={`${journalDays}`} label={t('analytics.summary.journalDays')} color="#7BE495" />
      </div>

      {/* Empty state */}
      {completedLogs.length === 0 && (
        <div className="bg-os-card-bg border border-os-green/20 rounded-[20px] p-5 text-center shadow-[0_0_15px_rgba(0,255,133,0.05)]">
          <Icon icon="solar:ghost-bold" className="text-os-green/30 mx-auto mb-2" width={28} />
          <p className="text-[11px] text-white/50 font-bold">{t('analytics.empty.title')}</p>
          <p className="text-[9px] text-white/30 mt-1">{t('analytics.empty.subtitle')}</p>
        </div>
      )}
    </div>
  );
}


// ============================================
// SECTION B: HABIT PATTERN (REAL DATA)
// ============================================
function HabitPattern({ habits, habitLogs, timeRange, setTimeRange, timeRanges, tutorialStep }: {
  habits: any[];
  habitLogs: HabitLog[];
  timeRange: TimeRange;
  setTimeRange: (r: TimeRange) => void;
  timeRanges: { id: TimeRange; label: string }[];
  tutorialStep?: number;
}) {
  const { t } = useTranslation();
  const { settings } = useUserStore();
  const gender = settings?.gender || 'Male';
  const isLight = !document.documentElement.classList.contains('dark');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

  const getCategoryStyles = (cat: string) => {
    switch (cat) {
      case 'Rutinitas':
        return isLight
          ? 'border-[#90CDF4] bg-gradient-to-br from-[#EBF8FF] to-[#BEE3F8] text-[#2A4365] shadow-[0_4px_12px_rgba(42,67,101,0.08)]'
          : 'border-[#1A365D] bg-gradient-to-br from-[#0F1E36] to-[#0A1424] text-[#4299E1] shadow-[0_6px_16px_rgba(66,153,225,0.12)]';
      case 'Ketenangan Diri':
        return isLight
          ? 'border-[#9AE6B4] bg-gradient-to-br from-[#F0FFF4] to-[#C6F6D5] text-[#22543D] shadow-[0_4px_12px_rgba(34,84,61,0.08)]'
          : 'border-[#1C4D38] bg-gradient-to-br from-[#102A1E] to-[#0A1A12] text-[#48BB78] shadow-[0_6px_16px_rgba(72,187,120,0.12)]';
      case 'Perkembangan Diri':
        return isLight
          ? 'border-[#FBD38D] bg-gradient-to-br from-[#FFFDF5] to-[#FEEBC8] text-[#744210] shadow-[0_4px_12px_rgba(116,66,16,0.08)]'
          : 'border-[#5F370E] bg-gradient-to-br from-[#36220F] to-[#24160A] text-[#ECC94B] shadow-[0_6px_16px_rgba(236,201,75,0.12)]';
      case 'Latihan Fisik':
        return isLight
          ? 'border-[#FEB2B2] bg-gradient-to-br from-[#FFF5F5] to-[#FED7D7] text-[#742A2A] shadow-[0_4px_12px_rgba(116,42,42,0.08)]'
          : 'border-[#742A2A]/50 bg-gradient-to-br from-[#3A1414] to-[#260D0D] text-[#FC8181] shadow-[0_6px_16px_rgba(252,129,129,0.12)]';
      case 'Semua':
      default:
        return isLight
          ? 'border-neutral-300 bg-gradient-to-br from-white to-[#F2F4F7] text-neutral-900 shadow-[0_4px_12px_rgba(0,0,0,0.08)]'
          : 'border-white/15 bg-gradient-to-br from-[#2D3035] to-[#1C1E22] text-white shadow-[0_6px_16px_rgba(0,0,0,0.15)]';
    }
  };

  // Sync expanded habit card with tutorial steps
  useEffect(() => {
    const isTutorialActive = localStorage.getItem('interactive_tutorial_active') === 'true';
    if (!isTutorialActive || tutorialStep === undefined) return;

    if (tutorialStep === 13) {
      // step 13 (array index 13) = "Drink Water Analytics Card"
      // Card must be CLOSED — user has to tap it themselves to open
      setExpandedHabit(null);
    } else if (tutorialStep === 14) {
      // step 14 (array index 14) = "Weekly Chart Explanation"
      // Card must be OPEN to show the chart
      const hidrasi = habits.find((h: any) => 
        h.name === 'Drink Water' || 
        h.name === 'Hidrasi Harian' || 
        h.name === 'Minum Air' ||
        h.iconName === 'ph:drop-bold' ||
        h.iconName === 'WaterGlass'
      );
      if (hidrasi) {
        setExpandedHabit(hidrasi.id);
      }
    }
  }, [tutorialStep, habits]);

  // Scroll indicator for category tabs
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [showCatScroll, setShowCatScroll] = useState(false);
  const [catThumbWidth, setCatThumbWidth] = useState(40);
  const [catScrollLeftPos, setCatScrollLeftPos] = useState(0);

  const handleCatScroll = () => {
    const el = catScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) { setShowCatScroll(false); return; }
    setShowCatScroll(true);
    const thumb = Math.max(30, (el.clientWidth / el.scrollWidth) * 100);
    const left = (el.scrollLeft / maxScroll) * (100 - thumb);
    setCatThumbWidth(thumb);
    setCatScrollLeftPos(left);
  };

  useEffect(() => {
    const el = catScrollRef.current;
    if (el && el.scrollWidth > el.clientWidth) {
      setShowCatScroll(true);
      setCatThumbWidth(Math.max(30, (el.clientWidth / el.scrollWidth) * 100));
    }
  }, []);

  // Fixed categories matching addhabit modal
  const categories = ['Semua', 'Rutinitas', 'Ketenangan Diri', 'Perkembangan Diri', 'Latihan Fisik'];

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Semua': return t('habits.categories.all');
      case 'Rutinitas': return t('habits.categories.routine');
      case 'Ketenangan Diri': return t('habits.categories.mindfulness');
      case 'Perkembangan Diri': return t('habits.categories.evolution');
      case 'Latihan Fisik': return t('habits.categories.exercise');
      default: return cat;
    }
  };

  // Filter habits by category
  const filteredHabits = useMemo(() => {
    if (selectedCategory === 'Semua') return habits;
    return habits.filter((h: any) => (h.category || 'Lainnya') === selectedCategory);
  }, [habits, selectedCategory]);

  // Per-habit analytics (all time)
  const habitAnalytics = useMemo(() => {
    const mapped = filteredHabits.map((habit: any) => {
      const habitCompletedLogs = habitLogs.filter(
        log => log.habit_id === habit.id && log.status === 'completed'
      );
      const startDate = habit.created_at ? new Date(habit.created_at) : (habitCompletedLogs[0]?.date ? new Date(habitCompletedLogs[0].date + 'T00:00:00') : new Date());
      startDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const totalDays = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const completionRate = Math.min(100, Math.round((habitCompletedLogs.length / Math.min(totalDays, 90)) * 100));

      return {
        ...habit,
        id: habit.id,
        name: habit.name,
        iconName: habit.iconName || habit.icon_name || '',
        category: habit.category || 'Lainnya',
        color: habit.color || '#00FF85',
        streak: habit.streak || 0,
        completionRate,
        totalCompleted: habitCompletedLogs.length,
        hasIntensity: shouldShowIntensityPicker(habit.name) || (habit.targetIntensity || habit.target_intensity || 0) > 0,
      };
    });

    return [...mapped].sort((a, b) => {
      if (a.name === 'Drink Water') return -1;
      if (b.name === 'Drink Water') return 1;
      return 0;
    });
  }, [filteredHabits, habitLogs]);

  return (
    <div className="relative space-y-5">
      {/* Atmospheric glow - top area */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-[#00FF85]/[0.04] blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -top-10 -left-10 w-[150px] h-[150px] bg-[#00FF85]/[0.03] blur-[60px] rounded-full pointer-events-none" />

      {/* Category Tabs - matching addhabit */}
      <div className="relative mt-2 mb-8">
        <div 
          ref={catScrollRef}
          onScroll={handleCatScroll}
          className="flex gap-3 overflow-x-auto no-scrollbar pb-3"
        >
          {categories.map((cat) => (
            <motion.button
              key={cat}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2.5 rounded-[8px] text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border-2 shrink-0 ${
                selectedCategory === cat ? 'transform scale-[1.05]' : 'transform scale-100'
              } ${
                selectedCategory === cat
                  ? getCategoryStyles(cat)
                  : isLight
                    ? 'bg-white text-neutral-400 border-neutral-200 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:text-neutral-600'
                    : 'bg-[#1C1E22]/50 border-white/[0.07] text-[#E3DAC9]/40 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:text-[#E3DAC9]/60'
              }`}
            >
              {getCategoryLabel(cat)}
            </motion.button>
          ))}
        </div>
        {/* Custom Scroll Indicator - thin & premium */}
        {showCatScroll && (
          <div className="mx-auto mt-2 w-20 h-[2.5px] rounded-full bg-white/[0.06] overflow-hidden">
            <div 
              className="h-full rounded-full bg-white/25 shadow-[0_0_6px_rgba(255,255,255,0.15)] transition-all duration-100"
              style={{ width: `${catThumbWidth}%`, marginLeft: `${catScrollLeftPos}%` }}
            />
          </div>
        )}
      </div>

      {/* Habit Cards */}
      {habitAnalytics.length > 0 ? (
        <div className="space-y-6">
          {habitAnalytics.map((h) => {
            const option = HABIT_OPTIONS.find(o => o.name.toLowerCase() === h.name.toLowerCase()) 
              || HABIT_OPTIONS.find(o => o.iconName === h.iconName);
            const isExpanded = expandedHabit === h.id;

            return (
              <div key={h.id}>
                {/* Card - persis kayak habits display */}
                <motion.button
                  id={h.name === 'Drink Water' ? 'analytics-drink-water-card' : undefined}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setExpandedHabit(isExpanded ? null : h.id)}
                  className={`w-full relative overflow-visible border-2 text-left h-[120px] habit-analytics-card transition-all ${
                    isLight 
                      ? 'border-neutral-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.08)]' 
                      : 'border-white/15 shadow-[0_8px_25px_rgba(0,0,0,0.3)]'
                  } ${
                    isExpanded ? 'rounded-t-[8px] rounded-b-none border-b-0' : 'rounded-[8px]'
                  }`}
                >
                  {/* Streak Badge - matching displaycardhabit style */}
                  {h.streak > 0 && (
                    <div 
                      className={`
                        absolute top-[-6px] right-[-5px] z-20 flex items-center gap-1 px-[10px] py-[5px] rounded-[8px] border-2 w-fit whitespace-nowrap
                        ${isLight 
                          ? 'border-[#FF4D00] bg-[#FFF0EB] text-[#FF4D00] shadow-[0_4px_12px_rgba(255,77,0,0.12)]' 
                          : 'border-[#FF4D00]/30 bg-[#FF4D00]/12 text-[#FF7A45] shadow-[0_6px_16px_rgba(255,77,0,0.15)]'}
                      `}
                    >
                      <Icon icon="solar:fire-bold" className={`w-3.5 h-3.5 ${isLight ? 'text-[#FF4D00]' : 'text-[#FF7A45]'}`} />
                      <span className={`text-[12px] font-black font-['Outfit'] leading-none mt-[1px] ${isLight ? 'text-[#FF4D00]' : 'text-[#FF7A45]'}`}>{h.streak}</span>
                    </div>
                  )}

                  <div className={`absolute inset-0 overflow-hidden ${isExpanded ? 'rounded-t-[6px]' : 'rounded-[6px]'}`}>
                    {/* Background Image */}
                    {option && option.imageUrl ? (
                      <img src={getGenderedImageUrl(option.imageUrl, gender)} alt="" className={`absolute inset-0 w-full h-full object-cover ${option.imagePosition || 'object-center'} opacity-[0.85]`} />
                    ) : (
                      <img src="/all_images/custom_habit_bg.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.7]" />
                    )}
                    <div className="absolute inset-0 bg-black/40 z-[1]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-[2]" />
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-end z-10">
                    <span className="text-[15px] font-black text-white font-['Outfit'] drop-shadow-lg">
                      {t(`presets.${h.name}`) === `presets.${h.name}` ? h.name : t(`presets.${h.name}`)}
                    </span>
                  </div>
                </motion.button>

                {/* Inline Expand Detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <HabitInlineDetail habit={h} habitLogs={habitLogs} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center min-h-[320px] rounded-[20px] p-8 text-center border-2 transition-all duration-300 ${
          isLight
            ? 'bg-white border-black text-black shadow-[4px_4px_0px_rgba(0,0,0,1)]'
            : 'bg-os-card-bg border-os-green/20 text-white shadow-[0_0_15px_rgba(0,255,133,0.05)]'
        }`}>
          <Icon icon="solar:ghost-bold" className={`mx-auto mb-3 ${isLight ? 'text-black/30' : 'text-[#00FF85]/30'}`} width={32} />
          <p className={`text-[12px] font-bold ${isLight ? 'text-black/60' : 'text-white/50'}`}>
            {t('analytics.emptyHabits')}
          </p>
        </div>
      )}
    </div>
  );
}
// --- Inline Detail (expands below card) ---
function HabitInlineDetail({ habit, habitLogs }: { habit: any; habitLogs: HabitLog[] }) {
  const { t, language } = useTranslation();
  const { settings } = useUserStore();
  const isLight = !document.documentElement.classList.contains('dark');
  const [recordMonth, setRecordMonth] = useState<1 | 2 | 3>(1);

  const allHabitLogs = useMemo(() => {
    return habitLogs.filter(l => l.habit_id === habit.id && l.status === 'completed');
  }, [habitLogs, habit.id]);

  // First log date = Day 1 (or habit creation date)
  const firstLogDate = useMemo(() => {
    if (habit.created_at) {
      const d = new Date(habit.created_at);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const sorted = allHabitLogs.map(l => l.date).sort();
    if (sorted.length > 0) {
      const d = new Date(sorted[0] + 'T00:00:00');
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [allHabitLogs, habit.created_at]);

  // Current day & week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const pausedDays = settings.pausedDays || [];
  const pausedBeforeToday = pausedDays.filter(dStr => {
    const d = new Date(dStr + 'T00:00:00');
    d.setHours(0, 0, 0, 0);
    return d >= firstLogDate && d <= today;
  }).length;

  const currentDayNumber = Math.max(1, Math.floor((today.getTime() - firstLogDate.getTime()) / (1000 * 60 * 60 * 24)) - pausedBeforeToday + 1);
  const totalWeeks = Math.ceil(currentDayNumber / 7);
  const [currentWeek, setCurrentWeek] = useState(totalWeeks);

  // Sync to latest week when totalWeeks changes (e.g. new day)
  useEffect(() => {
    setCurrentWeek(totalWeeks);
  }, [totalWeeks]);

  // Weekly data
  const weeklyData = useMemo(() => {
    const logSet = new Set(allHabitLogs.map(l => l.date));
    const scheduleDays = habit.schedule_days || [0, 1, 2, 3, 4, 5, 6];
    const result: { done: boolean; isFuture: boolean; isScheduled: boolean }[] = [];
    const weekStartDay = (currentWeek - 1) * 7;
    for (let i = 0; i < 7; i++) {
      const d = new Date(firstLogDate);
      d.setDate(firstLogDate.getDate() + weekStartDay + i);
      const dateStr = formatDate(d);
      result.push({ done: logSet.has(dateStr), isFuture: d > today, isScheduled: scheduleDays.includes(d.getDay()) });
    }
    return result;
  }, [allHabitLogs, currentWeek, firstLogDate, habit.schedule_days]);

  const completedThisWeek = weeklyData.filter(d => d.done && !d.isFuture && d.isScheduled).length;

  // Determine if this is a numeric habit using shouldShowIntensityPicker or database target_intensity
  const isNumericHabit = useMemo(() => {
    return shouldShowIntensityPicker(habit.name) || (habit.target_intensity || habit.targetIntensity || 0) > 0;
  }, [habit.name, habit.target_intensity, habit.targetIntensity]);

  // Calculate week dates for bar height computation
  const weekDates = useMemo(() => {
    const weekStartDay = (currentWeek - 1) * 7;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(firstLogDate);
      d.setDate(firstLogDate.getDate() + weekStartDay + i);
      return formatDate(d);
    });
  }, [currentWeek, firstLogDate]);

  // Calculate intensity-based bar heights for numeric habits
  const barChartData = useMemo(() => {
    if (!isNumericHabit) return null;
    const logsWithIntensity = allHabitLogs.map(l => ({
      date: l.date,
      intensity_value: l.intensity_value ?? null,
    }));
    const habitOption = HABIT_OPTIONS.find(o => o.name === habit.name);
    const intensityConfig = habitOption?.intensity;
    const defaultIntensity = habit.target_intensity ?? intensityConfig?.defaultValue ?? 1;
    const options = intensityConfig?.options;
    return calculateBarHeights(logsWithIntensity, weekDates, true, defaultIntensity, options);
  }, [isNumericHabit, allHabitLogs, weekDates, habit.name, habit.target_intensity]);

  // 84-day record (28 per page × 3 pages)
  const allTimeRecord = useMemo(() => {
    const logSet = new Set(allHabitLogs.map(l => l.date));
    const scheduleDays = habit.schedule_days || [0, 1, 2, 3, 4, 5, 6];
    const result: { done: boolean; isFuture: boolean; isScheduled: boolean }[] = [];
    for (let i = 0; i < 84; i++) {
      const d = new Date(firstLogDate);
      d.setDate(firstLogDate.getDate() + i);
      result.push({ done: logSet.has(formatDate(d)), isFuture: d > today, isScheduled: scheduleDays.includes(d.getDay()) });
    }
    return result;
  }, [allHabitLogs, firstLogDate, habit.schedule_days]);

  const startIdx = (recordMonth - 1) * 28;
  const monthSlice = allTimeRecord.slice(startIdx, startIdx + 28);
  const dayNames = language === 'Bahasa Indonesia'
    ? ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Dynamic day labels based on actual dates in current week
  const dayLabels = useMemo(() => {
    const weekStartDay = (currentWeek - 1) * 7;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(firstLogDate);
      d.setDate(firstLogDate.getDate() + weekStartDay + i);
      return dayNames[d.getDay()];
    });
  }, [currentWeek, firstLogDate, dayNames]);

  return (
    <div className={`backdrop-blur-sm border-[3px] border-t-0 rounded-b-[14px] p-4 pt-5 space-y-4 transition-all ${
      isLight
        ? 'bg-[#fbfbfb] border-black shadow-[4px_4px_0px_rgba(0,0,0,0.65)] text-black'
        : 'bg-[#1c1e22]/70 border-white/20 text-white shadow-[0_8px_40px_rgba(0,255,133,0.04)]'
    } habit-analytics-detail`}>

      {/* Weekly Section */}
      <div id="habit-analytics-weekly-chart">
        <div className="flex items-center justify-between mb-6">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-black/50' : 'text-white/40'}`}>
            {t('analytics.weekNum')} {currentWeek}
          </span>
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentWeek(w => Math.max(1, w - 1))} disabled={currentWeek <= 1}
               className="p-0 bg-transparent border-none outline-none">
              <Icon icon="ph:triangle-bold" className={currentWeek <= 1 ? (isLight ? 'text-black/20' : 'text-white/15') : (isLight ? 'text-black' : 'text-white')} width={12} style={{ transform: 'rotate(-90deg)' }} />
            </button>
            <button onClick={() => setCurrentWeek(w => Math.min(totalWeeks, w + 1))} disabled={currentWeek >= totalWeeks}
               className="p-0 bg-transparent border-none outline-none">
              <Icon icon="ph:triangle-bold" className={currentWeek >= totalWeeks ? (isLight ? 'text-black/20' : 'text-white/15') : (isLight ? 'text-black' : 'text-white')} width={12} style={{ transform: 'rotate(90deg)' }} />
            </button>
          </div>
        </div>

        {habit.hasIntensity ? (
          /* Bar chart with Y-axis - like reference */
          <>
          <div className="relative flex gap-2">
            {/* Radial glow behind chart */}
            {!isLight && <div className="absolute inset-0 bg-[#00FF85]/[0.02] blur-[30px] rounded-full pointer-events-none" />}
            {/* Y-axis labels - dynamic based on intensity data */}
            <div className="flex flex-col justify-between h-[120px] pr-1 py-0">
              {barChartData && barChartData.yAxisLabels.length > 0 ? (
                [...barChartData.yAxisLabels].reverse().map((label, i) => (
                  <span key={i} className={`text-[8px] font-bold ${isLight ? 'text-black/35' : 'text-white/20'}`}>{label}</span>
                ))
              ) : (
                <>
                  <span className={`text-[8px] font-bold ${isLight ? 'text-black/35' : 'text-white/20'}`}>5</span>
                  <span className={`text-[8px] font-bold ${isLight ? 'text-black/35' : 'text-white/20'}`}>4</span>
                  <span className={`text-[8px] font-bold ${isLight ? 'text-black/35' : 'text-white/20'}`}>3</span>
                  <span className={`text-[8px] font-bold ${isLight ? 'text-black/35' : 'text-white/20'}`}>2</span>
                  <span className={`text-[8px] font-bold ${isLight ? 'text-black/35' : 'text-white/20'}`}>1</span>
                  <span className={`text-[8px] font-bold ${isLight ? 'text-black/35' : 'text-white/20'}`}>0</span>
                </>
              )}
            </div>
            {/* Chart area */}
            <div className="flex-1 relative h-[120px]">
              {/* Horizontal guide lines - rendered dynamically to match ticks exactly */}
              {barChartData && barChartData.yAxisLabels.length > 1 ? (
                [...barChartData.yAxisLabels].reverse().map((_, index) => {
                  const topPercent = (index / (barChartData.yAxisLabels.length - 1)) * 100;
                  const isMajor = index === 0 || index === barChartData.yAxisLabels.length - 1 || index === Math.floor((barChartData.yAxisLabels.length - 1) / 2);
                  return (
                    <div 
                      key={index} 
                      className={`absolute left-0 right-0 border-t ${isMajor ? (isLight ? 'border-black/[0.12]' : 'border-white/[0.12]') : (isLight ? 'border-black/[0.06]' : 'border-white/[0.06]')}`} 
                      style={{ top: `${topPercent}%` }} 
                    />
                  );
                })
              ) : (
                <>
                  <div className={`absolute top-0 left-0 right-0 border-t ${isLight ? 'border-black/[0.12]' : 'border-white/[0.12]'}`} />
                  <div className={`absolute top-1/2 left-0 right-0 border-t ${isLight ? 'border-black/[0.12]' : 'border-white/[0.12]'}`} />
                  <div className={`absolute bottom-0 left-0 right-0 border-t ${isLight ? 'border-black/[0.12]' : 'border-white/[0.12]'}`} />
                </>
              )}
              {/* Bars */}
              <div className="flex items-end gap-2 h-full">
                {weeklyData.map((day, i) => {
                  const barHeight = barChartData ? barChartData.heights[i] : (day.done ? 0.6 : 0);
                  const heightPercent = !day.isScheduled ? '0%' : day.isFuture ? '0%' : barHeight > 0 ? `${Math.max(6, barHeight * 100)}%` : '6%';
                  const hasValue = barChartData ? barChartData.heights[i] > 0 : day.done;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div className="flex-1 w-full flex items-end justify-center">
                        <div className={`w-[50%] rounded-t-[2px] ${!day.isScheduled ? (isLight ? 'bg-black/[0.03]' : 'bg-white/[0.03]') : day.isFuture ? 'bg-transparent' : hasValue ? 'bg-[#00FF85]/80 shadow-[0_0_10px_rgba(0,255,133,0.25)] border-[1.5px] border-black/30 border-b-0' : (isLight ? 'bg-black/[0.15]' : 'bg-white/[0.18]')}`}
                           style={{ height: heightPercent, minHeight: !day.isScheduled ? 2 : day.isFuture ? 0 : 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* X-axis day labels — below chart, aligned with bars */}
          <div className="flex gap-2 ml-[28px]">
            {weeklyData.map((day, i) => (
              <div key={i} className="flex-1 text-center">
                <span className={`text-[8px] font-bold ${!day.isScheduled ? (isLight ? 'text-black/20' : 'text-white/20') : (isLight ? 'text-black/40' : 'text-white/30')}`}>{dayLabels[i]}</span>
              </div>
            ))}
          </div>
          </>
        ) : (
          /* Checkbox squares - bold stroke */
          <div className="flex items-center gap-2">
            {weeklyData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-[6px] flex items-center justify-center transition-all ${
                  !day.isScheduled
                    ? (isLight ? 'bg-black/[0.02] border-[2px] border-black/10' : 'bg-white/[0.03] border-[2px] border-white/5')
                    : day.isFuture
                      ? (isLight ? 'border-[2px] border-black/15' : 'border-[2px] border-white/10')
                      : day.done
                        ? 'bg-[#00FF85]/80 shadow-[0_0_8px_rgba(0,255,133,0.25)] border-[2px] border-black/30'
                        : (isLight ? 'bg-white border-[2px] border-black/30' : 'border-[2px] border-white/40')
                }`}>
                  {day.done && !day.isFuture && day.isScheduled && <Icon icon="ph:check-bold" className="text-black" width={14} style={{ strokeWidth: 2 }} />}
                </div>
                <span className={`text-[8px] font-black ${!day.isScheduled ? (isLight ? 'text-black/20' : 'text-white/20') : (isLight ? 'text-black/60' : 'text-white/60')}`}>{dayLabels[i]}</span>
              </div>
            ))}
          </div>
        )}

        <p className={`text-[9px] font-bold mt-2 ${isLight ? 'text-black/80' : 'text-[#00FF85]'}`}>{completedThisWeek} {t('analytics.daysCompletedThisWeek')}</p>
      </div>

      {/* Monthly Record */}
      <div id="habit-analytics-monthly-record" className={`rounded-2xl p-4 border transition-all ${
        isLight
          ? 'bg-white border-black shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
          : 'bg-[#1c1e22]/40 border-white/5'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <span className={`text-[9px] font-bold uppercase tracking-widest ${isLight ? 'text-black/55' : 'text-white/25'}`}>{t('analytics.recordTrack')}</span>
          <div className="flex items-center gap-1.5">
            {([1, 2, 3] as const).map((m) => (
              <button key={m} onClick={() => setRecordMonth(m)}
                className={`w-6 h-6 rounded-md text-[9px] font-black flex items-center justify-center transition-all ${
                  recordMonth === m
                    ? (isLight ? 'bg-black text-white border border-black shadow-[0_0_4px_rgba(0,0,0,0.15)]' : 'bg-[#00FF85]/15 text-[#00FF85] border border-[#00FF85]/30 shadow-[0_0_8px_rgba(0,255,133,0.15)]')
                    : (isLight ? 'text-black/60 border border-black/20 hover:border-black/50 bg-white' : 'text-white/45 border border-white/15 hover:text-white/80 hover:border-white/30')
                }`}>{m}</button>
            ))}
          </div>
        </div>
        
        <div className="max-w-[280px] mx-auto grid grid-cols-7 gap-2">
          {monthSlice.map((day, idx) => (
            <div key={idx} className={`aspect-square rounded-[8px] flex items-center justify-center transition-all ${
              !day.isScheduled
                ? (isLight ? 'bg-black/[0.02] border border-black/10' : 'bg-white/[0.03] border border-white/5')
                : day.isFuture
                  ? (isLight ? 'bg-black/[0.02] border border-black/10' : 'bg-white/[0.03] border border-white/5')
                  : day.done
                    ? 'bg-[#00FF85]/80 shadow-[0_2px_8px_rgba(0,255,133,0.25)] border border-black/30'
                    : (isLight ? 'bg-white border border-black/25' : 'bg-white/[0.14] border border-white/20')
            }`}>
              <span className={`text-[9px] font-black ${
                !day.isScheduled
                  ? 'text-black/20 dark:text-white/20'
                  : day.isFuture
                    ? 'text-black/20 dark:text-white/20'
                    : day.done
                      ? 'text-black/80'
                      : (isLight ? 'text-black/60' : 'text-white/45')
              }`}>
                {startIdx + idx + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function HabitDetailModal({ habit, habitLogs, onClose }: { habit: any; habitLogs: HabitLog[]; onClose: () => void }) {
  const { t, language } = useTranslation();
  const { settings } = useUserStore();
  const gender = settings?.gender || 'Male';
  const isLight = !document.documentElement.classList.contains('dark');
  const [recordMonth, setRecordMonth] = useState<1 | 2 | 3>(1);

  // Get all completed logs for this habit (all time)
  const allHabitLogs = useMemo(() => {
    return habitLogs.filter(l => l.habit_id === habit.id && l.status === 'completed');
  }, [habitLogs, habit.id]);

  // Find the earliest log date (Day 1 or habit creation date)
  const firstLogDate = useMemo(() => {
    if (habit.created_at) {
      const d = new Date(habit.created_at);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const sorted = allHabitLogs.map(l => l.date).sort();
    if (sorted.length > 0) {
      const d = new Date(sorted[0] + 'T00:00:00');
      d.setHours(0, 0, 0, 0);
      return d;
    }
    // Fallback: today
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [allHabitLogs, habit.created_at]);

  // Current day number (from Day 1)
  const currentDayNumber = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - firstLogDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const pausedDays = settings.pausedDays || [];
    const pausedSinceCreation = pausedDays.filter(dStr => {
      const d = new Date(dStr + 'T00:00:00');
      d.setHours(0, 0, 0, 0);
      return d >= firstLogDate && d <= today;
    }).length;
    
    return Math.max(1, diff - pausedSinceCreation + 1);
  }, [firstLogDate, settings.pausedDays]);

  // Current week number
  const totalWeeks = Math.ceil(currentDayNumber / 7);
  const [currentWeek, setCurrentWeek] = useState(totalWeeks);

  // Weekly data for the selected week
  const weeklyData = useMemo(() => {
    const logSet = new Set(allHabitLogs.map(l => l.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const result: { done: boolean; isFuture: boolean }[] = [];
    const weekStartDay = (currentWeek - 1) * 7; // 0-indexed day offset

    for (let i = 0; i < 7; i++) {
      const d = new Date(firstLogDate);
      d.setDate(firstLogDate.getDate() + weekStartDay + i);
      const dateStr = formatDate(d);
      result.push({ done: logSet.has(dateStr), isFuture: d > today });
    }
    return result;
  }, [allHabitLogs, currentWeek, firstLogDate]);

  // Count completed days this week
  const completedThisWeek = weeklyData.filter(d => d.done).length;

  // 90-day all-time record (from first log date)
  const allTimeRecord = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const logSet = new Set(allHabitLogs.map(l => l.date));

    const result: { done: boolean; isFuture: boolean }[] = [];
    for (let i = 0; i < 90; i++) {
      const d = new Date(firstLogDate);
      d.setDate(firstLogDate.getDate() + i);
      const dateStr = formatDate(d);
      result.push({ done: logSet.has(dateStr), isFuture: d > today });
    }
    return result;
  }, [allHabitLogs, firstLogDate]);

  // Slice for current month page (30 days per page)
  const startIdx = (recordMonth - 1) * 30;
  const monthSlice = allTimeRecord.slice(startIdx, startIdx + 30);

  // Day labels
  const dayLabels = language === 'Bahasa Indonesia'
    ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Get habit action text for summary
  const getHabitAction = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('hidrasi') || lower.includes('minum')) return t('habits.actions.drink');
    if (lower.includes('bangun')) return t('habits.actions.wakeUp');
    if (lower.includes('tidur')) return t('habits.actions.sleep');
    if (lower.includes('baca') || lower.includes('membaca')) return t('habits.actions.read');
    if (lower.includes('olahraga') || lower.includes('workout') || lower.includes('push') || lower.includes('sit')) return t('habits.actions.workout');
    if (lower.includes('ibadah') || lower.includes('beribadah')) return t('habits.actions.pray');
    if (lower.includes('journal')) return t('habits.actions.journal');
    if (lower.includes('deep work')) return t('habits.actions.deepWork');
    if (lower.includes('napas')) return t('habits.actions.breathe');
    if (lower.includes('musik')) return t('habits.actions.music');
    const transName = t(`presets.${name}`) === `presets.${name}` ? name : t(`presets.${name}`);
    return `${t('habits.actions.do')} ${transName.toLowerCase()}`;
  };

  // Find HABIT_OPTIONS match for image
  const habitOption = HABIT_OPTIONS.find(o => o.name.toLowerCase() === habit.name.toLowerCase()) 
    || HABIT_OPTIONS.find(o => o.iconName === habit.iconName);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto transition-all ${
        isLight ? 'bg-white text-black' : 'bg-[#16181c] text-white'
      }`}
    >
      {/* Close Button */}
      <div className="absolute top-12 right-5 z-20">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className={`w-9 h-9 rounded-xl border-[2px] flex items-center justify-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
            isLight
              ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,1)]'
              : 'border-white/10 bg-[#2a2c32] text-white shadow-none'
          }`}
        >
          <Icon icon="ph:x-bold" width={16} />
        </motion.button>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-10 pb-10 space-y-6">

        {/* 1. Header Card (bigger image card) */}
        <div className={`relative rounded-[20px] overflow-hidden border-[2px] h-[140px] ${
          isLight ? 'border-black shadow-[3.5px_3.5px_0px_rgba(0,0,0,0.65)]' : 'border-white/15'
        }`}>
          {habitOption && (
            <img
              src={getGenderedImageUrl(habitOption.imageUrl, gender)}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover ${habitOption.imagePosition || 'object-center'} opacity-90`}
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative z-10 p-5 h-full flex flex-col justify-end">
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-black text-white font-['Outfit'] drop-shadow-lg">
                {t(`presets.${habit.name}`) === `presets.${habit.name}` ? habit.name : t(`presets.${habit.name}`)}
              </span>
              <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-lg border border-white/10">
                <Icon icon="solar:fire-bold" className="text-[#FF4D00]" width={14} />
                <span className="text-[12px] font-black text-[#FF4D00]">{habit.streak}d</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Weekly Chart Section */}
        <div className={`rounded-[16px] p-4 space-y-4 border-[2px] transition-all ${
          isLight 
            ? 'bg-[#fbfbfb] border-black shadow-[3.5px_3.5px_0px_rgba(0,0,0,0.65)] text-black' 
            : 'bg-[#1c1e22] border-white/10 text-white'
        }`}>
          {/* Title + Week Navigation */}
          <div className="flex items-center justify-between">
            <span className={`text-[13px] font-black font-['Outfit'] ${isLight ? 'text-black' : 'text-[#E3DAC9]'}`}>
              {t(`presets.${habit.name}`) === `presets.${habit.name}` ? habit.name : t(`presets.${habit.name}`)}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentWeek(w => Math.max(1, w - 1))}
                className={`w-6 h-6 rounded-md border flex items-center justify-center ${
                  isLight ? 'bg-white border-black text-black' : 'bg-[#2a2c32] border-white/10 text-[#E3DAC9]'
                }`}
                disabled={currentWeek <= 1}
              >
                <Icon icon="ph:caret-left-bold" className={`${currentWeek <= 1 ? (isLight ? 'text-black/20' : 'text-white/20') : (isLight ? 'text-black' : 'text-[#E3DAC9]')}`} width={12} />
              </button>
              <span className={`text-[10px] font-bold min-w-[60px] text-center ${isLight ? 'text-black/50' : 'text-white/50'}`}>{t('analytics.weekNum')} {currentWeek}</span>
              <button
                onClick={() => setCurrentWeek(w => Math.min(totalWeeks, w + 1))}
                className={`w-6 h-6 rounded-md border flex items-center justify-center ${
                  isLight ? 'bg-white border-black text-black' : 'bg-[#2a2c32] border-white/10 text-[#E3DAC9]'
                }`}
                disabled={currentWeek >= totalWeeks}
              >
                <Icon icon="ph:caret-right-bold" className={`${currentWeek >= totalWeeks ? (isLight ? 'text-black/20' : 'text-white/20') : (isLight ? 'text-black' : 'text-[#E3DAC9]')}`} width={12} />
              </button>
            </div>
          </div>

          {/* Chart Area */}
          {habit.hasIntensity ? (
            /* Bar Chart for intensity habits */
            <div className="flex items-end gap-2 h-[100px] pt-2">
              {weeklyData.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div className="flex-1 w-full flex items-end justify-center">
                    <div
                      className={`w-full rounded-t-[4px] transition-all ${
                        day.isFuture 
                          ? 'bg-transparent' 
                          : day.done 
                            ? 'bg-[#00FF85] border-[1.5px] border-black border-b-0 shadow-[1.5px_0_0_rgba(0,0,0,1)]' 
                            : (isLight ? 'bg-black/[0.12]' : 'bg-[#2a2c32]')
                      }`}
                      style={{
                        height: day.isFuture ? '0%' : day.done ? '100%' : '8%',
                        minHeight: day.isFuture ? 0 : 4,
                      }}
                    />
                  </div>
                  <span className={`text-[8px] font-bold ${isLight ? 'text-black/40' : 'text-white/30'}`}>{dayLabels[i]}</span>
                </div>
              ))}
            </div>
          ) : (
            /* Checkbox circles for non-intensity habits */
            <div className="flex items-center gap-2 py-3">
              {weeklyData.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    day.isFuture
                      ? (isLight ? 'border-[2px] border-black/10' : 'border-[2px] border-white/5')
                      : day.done
                        ? 'bg-[#00FF85] border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                        : (isLight ? 'border-[2px] border-black/30 bg-white' : 'border-[2px] border-white/20')
                  }`}>
                    {day.done && !day.isFuture && (
                      <Icon icon="ph:check-bold" className="text-black" width={14} />
                    )}
                  </div>
                  <span className={`text-[8px] font-bold ${isLight ? 'text-black/40' : 'text-white/30'}`}>{dayLabels[i]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Summary Text */}
        <div className="px-1">
          <p className={`text-[12px] font-bold font-['Outfit'] ${isLight ? 'text-black/80' : 'text-[#E3DAC9]/60'}`}>
            {t('analytics.weeklySummaryText')
              .replace('{action}', getHabitAction(habit.name))
              .replace('{count}', String(completedThisWeek))}
          </p>
        </div>

        {/* 4. Monthly Record (Rekam Jejak) */}
        <div className={`rounded-[16px] p-4 space-y-3 border-[2px] transition-all ${
          isLight 
            ? 'bg-[#fbfbfb] border-black shadow-[3.5px_3.5px_0px_rgba(0,0,0,0.65)] text-black' 
            : 'bg-[#1c1e22] border-white/10 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-black uppercase tracking-widest font-['Outfit'] ${isLight ? 'text-black/50' : 'text-[#E3DAC9]/50'}`}>{t('analytics.recordTrack')}</span>
            <div className="flex items-center gap-1">
              {([1, 2, 3] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setRecordMonth(m)}
                  className={`w-6 h-6 rounded-md text-[9px] font-black flex items-center justify-center transition-all ${
                    recordMonth === m
                      ? (isLight ? 'bg-black text-white border border-black shadow-[0_0_4px_rgba(0,0,0,0.15)]' : 'bg-[#00FF85]/15 text-[#00FF85] border border-[#00FF85]/30')
                      : (isLight ? 'text-black/60 border border-black/20 bg-white hover:border-black/50' : 'text-white/45 border border-white/15 hover:text-white/80 hover:border-white/30')
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-10 gap-[6px]">
            {monthSlice.map((day, idx) => (
              <div
                key={idx}
                className={`aspect-square rounded-[4px] border transition-all ${
                  day.isFuture 
                    ? (isLight ? 'bg-black/[0.02] border-black/10' : 'bg-white/5 border-transparent') 
                    : day.done 
                      ? 'bg-[#00FF85] border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]' 
                      : (isLight ? 'bg-white border-black/25' : 'bg-[#2a2c32] border-transparent')
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}


// ============================================
// SECTION C: RPG STATS (Persistent progression store)
// ============================================
function StatsRPG({ profile, habits, habitLogs }: {
  profile: any;
  habits: any[];
  habitLogs: HabitLog[];
}) {
  const { t, language } = useTranslation();
  const streakCount = profile?.streak_count || 0;
  const isLight = !document.documentElement.classList.contains('dark');

  // Use persistent progression store values
  const { totalXP, level, stats: progressionStats, dailyXPEarned } = useProgressionStore();
  const levelInfo = useMemo(() => getLevelInfo(totalXP), [totalXP]);

  const xpProgress = Math.min(100, Math.round(levelInfo.progress * 100));
  const xpForNext = levelInfo.xpNeededForNext;

  const statsList = [
    { name: t('rpg.stats.wisdom'), value: progressionStats.kebijaksanaan, icon: 'ph:brain-bold', color: '#A855F7' },
    { name: t('rpg.stats.confidence'), value: progressionStats.kepercayaanDiri, icon: 'ph:crown-bold', color: '#7BE495' },
    { name: t('rpg.stats.strength'), value: progressionStats.kekuatan, icon: 'ph:lightning-bold', color: '#FF4D00' },
    { name: t('rpg.stats.discipline'), value: progressionStats.disiplin, icon: 'ph:sword-bold', color: '#3B82F6' },
    { name: t('rpg.stats.focus'), value: progressionStats.fokus, icon: 'ph:crosshair-bold', color: '#F59E0B' },
  ];

  return (
    <div id="analytics-rpg-stats-container" className="relative space-y-6">
      {/* Background image - RPG themed */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="/all_images/statistik_bg.png" alt="" className="w-full h-full object-cover opacity-[0.25]" />
      </div>

      <div className="relative z-10 space-y-6">

      {/* Level Card - Bold style */}
      <div className={`relative border-2 rounded-[8px] p-5 overflow-hidden transition-all ${
        isLight 
          ? 'bg-white border-neutral-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.04)]' 
          : 'bg-[#1C1E22]/70 border-white/15 shadow-[0_8px_25px_rgba(0,0,0,0.3)]'
      }`}>
        {/* Subtle glow behind */}
        <div className={`absolute top-0 left-0 w-32 h-32 blur-[60px] rounded-full pointer-events-none ${isLight ? 'bg-[#7BE495]/5' : 'bg-[#7BE495]/10'}`} />
        
        <div className="relative flex items-center gap-4 mb-5">
          {/* Level Badge */}
          <div className="w-[72px] h-[72px] bg-[#7BE495] rounded-[8px] flex flex-col items-center justify-center shadow-[0_4px_20px_rgba(123,228,149,0.25)] border-[1.5px] border-[#7BE495]/40">
            <span className="text-[28px] font-black text-black leading-none">{level}</span>
            <span className="text-[8px] font-black text-black/60 uppercase tracking-wider">{t('rpg.level')}</span>
          </div>
          
          {/* XP Info */}
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className={`text-[32px] font-black leading-none ${isLight ? 'text-neutral-900' : 'text-white'}`}>{totalXP}</span>
              <span className={`text-[11px] font-bold uppercase ${isLight ? 'text-neutral-400' : 'text-[#E3DAC9]/40'}`}>XP</span>
            </div>
          </div>

          {/* Streak */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Icon icon="solar:fire-bold" className="text-[#FF4D00]" width={16} />
              <span className="text-[18px] font-black text-[#FF4D00]">{streakCount}</span>
            </div>
            <span className={`text-[7px] font-bold uppercase ${isLight ? 'text-neutral-400' : 'text-[#E3DAC9]/30'}`}>{t('rpg.streakDays')}</span>
          </div>
        </div>

        {/* Segmented XP Bar */}
        <div className="flex gap-[3px] mb-2">
          {Array.from({ length: 20 }).map((_, i) => {
            const filled = i < Math.round(xpProgress / 5);
            return (
              <div
                key={i}
                className={`flex-1 h-[10px] rounded-[2px] transition-all ${
                  filled 
                    ? 'bg-[#7BE495]' 
                    : isLight ? 'bg-neutral-200' : 'bg-[#2a2c32]'
                }`}
              />
            );
          })}
        </div>
        <p className={`text-[12px] font-black text-center mt-1 ${isLight ? 'text-neutral-500' : 'text-[#E3DAC9]/50'}`}>
          {language === 'Bahasa Indonesia'
            ? `${xpForNext - levelInfo.xpIntoCurrentLevel} XP tersisa untuk Level Up`
            : `${xpForNext - levelInfo.xpIntoCurrentLevel} XP remaining for Level Up`}
        </p>
      </div>

      {/* Stats List - Big numbers, glass container */}
      <div className={`border-2 rounded-[8px] px-5 py-2 transition-all ${
        isLight 
          ? 'bg-white border-neutral-200/90 shadow-[0_4px_12px_rgba(0,0,0,0.04)]' 
          : 'bg-[#1C1E22]/70 border-white/15 shadow-[0_8px_25px_rgba(0,0,0,0.3)]'
      }`}>
        {statsList.map((stat, idx) => (
          <div key={stat.name} className={`flex items-center gap-4 py-4 ${idx < statsList.length - 1 ? (isLight ? 'border-b border-neutral-100' : 'border-b border-white/10') : ''}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-[1.5px]" style={{ backgroundColor: `${stat.color}12`, borderColor: `${stat.color}35` }}>
              <Icon icon={stat.icon} style={{ color: stat.color }} width={22} />
            </div>
            <span className={`text-[15px] font-bold flex-1 ${isLight ? 'text-neutral-700' : 'text-[#E3DAC9]'}`}>{stat.name}</span>
            <span className="text-[11px] font-bold text-[#7BE495] mr-1">▲</span>
            <span className={`text-[28px] font-black leading-none ${isLight ? 'text-neutral-900' : 'text-white'}`}>{stat.value}</span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}


// ============================================
// SHARED COMPONENTS
// ============================================

function TimeRangeToggle({ timeRange, setTimeRange, timeRanges }: {
  timeRange: TimeRange;
  setTimeRange: (r: TimeRange) => void;
  timeRanges: { id: TimeRange; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      {timeRanges.map((r) => (
        <button
          key={r.id}
          onClick={() => setTimeRange(r.id)}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
            timeRange === r.id
              ? 'bg-[#00FF85]/15 text-[#00FF85] border border-[#00FF85]/30'
              : 'text-[#E3DAC9]/30 border border-transparent'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function SummaryCard({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <div className="bg-[#1c1e22]/60 backdrop-blur-md border-[1.5px] border-white/10 rounded-[14px] p-3 flex flex-col items-center text-center">
      <Icon icon={icon} style={{ color }} width={16} className="mb-1.5" />
      <span className="text-[16px] font-black text-white">{value}</span>
      <span className="text-[8px] font-bold uppercase tracking-wider text-[#E3DAC9]/40 mt-0.5">{label}</span>
    </div>
  );
}

// --- Calendar Grids ---

function WeeklyGrid({ days }: { days: DayStatus[] }) {
  const { language } = useTranslation();
  const dayLabels = language === 'Bahasa Indonesia'
    ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-2">
        {dayLabels.map((l, i) => (
          <span key={i} className="text-center text-[9px] font-bold text-[#E3DAC9]/30">{l}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 place-items-center">
        {days.map((day, i) => (
          <DayCell key={i} day={day} size="lg" />
        ))}
      </div>
    </div>
  );
}

function MonthlyGrid({ days }: { days: DayStatus[] }) {
  const { language } = useTranslation();
  const dayLabels = language === 'Bahasa Indonesia'
    ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Show full current month (1st to last day)
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1);
  
  // Monday-based offset
  const jsDay = firstDayOfMonth.getDay();
  const offset = jsDay === 0 ? 6 : jsDay - 1;

  // Build active dates set from the days prop
  const activeDates = new Set(days.filter(d => d.active).map(d => d.dateStr));
  const todayStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  // Build month days
  const monthDays: DayStatus[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    monthDays.push({
      date,
      dateStr,
      active: activeDates.has(dateStr),
      isToday: dateStr === todayStr,
      isFuture: date > today,
      dayOfMonth: i,
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-2">
        {dayLabels.map((l, i) => (
          <span key={i} className="text-center text-[9px] font-bold text-[#E3DAC9]/30">{l}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 place-items-center">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} className="w-[34px] h-[34px]" />
        ))}
        {monthDays.map((day, i) => (
          <DayCell key={i} day={day} size="lg" />
        ))}
      </div>
    </div>
  );
}

function CompactGrid({ days }: { days: DayStatus[] }) {
  const { t } = useTranslation();
  const [programMonth, setProgramMonth] = useState<1 | 2 | 3>(1);

  // Slice days for current program month (30 days each)
  const startIdx = (programMonth - 1) * 30;
  const monthDays = days.slice(startIdx, startIdx + 30);

  return (
    <div className="flex flex-col gap-5">
      {/* Header row: title left, month toggle right */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold text-[#E3DAC9]/30 uppercase tracking-wider">
          {t('analytics.program90Days')}
        </span>

        {/* Compact month toggle - top right */}
        <div className="flex items-center gap-1.5">
          {([1, 2, 3] as const).map((m) => (
            <button
              key={m}
              onClick={() => setProgramMonth(m)}
              className={`w-6 h-6 rounded-md text-[9px] font-black transition-all flex items-center justify-center ${
                programMonth === m
                  ? 'bg-[#7BE495]/15 text-[#7BE495] border border-[#7BE495]/30'
                  : 'text-[#E3DAC9]/30 border border-[#E3DAC9]/10'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Grid - 6 columns, no weekday header, pure sequential */}
      <div className="grid grid-cols-6 gap-2 place-items-center">
        {monthDays.map((day, i) => {
          const overriddenDay = { ...day, dayNumber: startIdx + i + 1 };
          return <DayCell key={i} day={overriddenDay} size="lg" showDayNumber />;
        })}
      </div>
    </div>
  );
}

function DayCell({ day, size, showDayNumber }: { day: DayStatus; size: 'sm' | 'md' | 'lg'; showDayNumber?: boolean }) {
  const { settings } = useUserStore();
  const isLight = !document.documentElement.classList.contains('dark');

  const sizeClasses = {
    sm: 'w-[14px] h-[14px] rounded-[3px]',
    md: 'w-[26px] h-[26px] rounded-[7px]',
    lg: 'w-[38px] h-[38px] rounded-[9px]',
  };

  const fontSizes = {
    sm: 'text-[6px]',
    md: 'text-[9px]',
    lg: 'text-[11px]',
  };

  let bg = '';
  let border = '';
  let textColor = '';

  if (isLight) {
    if (day.isFuture) {
      bg = 'bg-white/40';
      border = 'border border-dashed border-black/10';
      textColor = 'text-black/25';
    } else if (day.active) {
      bg = 'bg-[#7BE495]/80 shadow-[0_2px_8px_rgba(123,228,149,0.25)]';
      textColor = 'text-black/80';
    } else {
      bg = 'bg-white';
      border = 'border-[1.5px] border-black/20';
      textColor = 'text-black/60';
    }
  } else {
    if (day.isFuture) {
      bg = 'bg-[#E3DAC9]/5';
      textColor = 'text-[#E3DAC9]/10';
    } else if (day.active) {
      bg = 'bg-[#7BE495]/80 shadow-[0_2px_8px_rgba(123,228,149,0.25)]';
      textColor = 'text-black/45';
    } else {
      bg = 'bg-[#3a3a3a]';
      textColor = 'text-white';
    }
  }

  const ring = day.isToday && !day.active
    ? (isLight ? 'ring-1 ring-black/45' : 'ring-1 ring-[#E3DAC9]/30')
    : '';

  const displayNumber = showDayNumber && day.dayNumber ? day.dayNumber : day.dayOfMonth;

  return (
    <div className={`${sizeClasses[size]} ${bg} ${border} ${ring} flex items-center justify-center relative`}>
      <span className={`${fontSizes[size]} font-bold ${textColor} select-none`}>
        {displayNumber}
      </span>
    </div>
  );
}
