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

function getDateRange(range: TimeRange): { startDate: string; endDate: string; days: number } {
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
    case '90days': daysCount = 90; break;
    default: daysCount = 7;
  }

  const start = new Date(today);
  start.setDate(start.getDate() - (daysCount - 1));
  const startDate = formatDate(start);

  return { startDate, endDate, days: daysCount };
}

function buildDayStatuses(range: TimeRange, activeDates: Set<string>): DayStatus[] {
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
  const { days } = getDateRange(range);
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
export const AnalyticsView = () => {
  const { habits, fetchHabits } = useHabitStore();
  const { profile } = useUserStore();
  const { targets } = useTargetStore();
  const { entries: journeyEntries, fetchEntries } = useJourneyStore();

  const [mainTab, setMainTab] = useState<MainTab>('pattern');
  const [recapRange, setRecapRange] = useState<TimeRange>('weekly');
  const [patternRange, setPatternRange] = useState<TimeRange>('weekly');

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    habitLogs: [],
    loading: true,
  });

  // Fetch habit logs from Supabase
  const fetchAnalytics = useCallback(async () => {
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
    
    // Always fetch from at least 90 days ago to cover full program
    const startDate = formatDate(fetchFrom);
    const endDate = formatDate(new Date());

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
    { id: 'pattern', label: 'Pola' },
    { id: 'recap', label: 'Aktivitas' },
    { id: 'stats', label: 'Statistik' },
  ];

  const timeRanges: { id: TimeRange; label: string }[] = [
    { id: 'weekly', label: 'Minggu' },
    { id: 'monthly', label: 'Bulan' },
    { id: '90days', label: '90 Hari' },
  ];

  if (analyticsData.loading) {
    return <LoadingScreen message="Memuat analytics..." />;
  }

  return (
    <div className="flex flex-col h-full text-[#E3DAC9] font-['Outfit'] px-5 pt-8 pb-32">
      {/* Main Tabs */}
      <div className="flex items-center gap-2 mb-14">
        {mainTabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMainTab(tab.id)}
            className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
              mainTab === tab.id
                ? 'bg-[#E3DAC9] text-black border-[#E3DAC9] shadow-[0_2px_10px_rgba(227,218,201,0.15)]'
                : 'bg-[#1c1e22]/80 backdrop-blur-md text-[#E3DAC9]/50 border-white/10'
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
  const { startDate, endDate, days: daysInRange } = useMemo(() => getDateRange(timeRange), [timeRange]);

  // Filter logs for current time range
  const logsInRange = useMemo(() => {
    return habitLogs.filter(log => log.date >= startDate && log.date <= endDate);
  }, [habitLogs, startDate, endDate]);

  // Completed logs only
  const completedLogs = useMemo(() => {
    return logsInRange.filter(log => log.status === 'completed');
  }, [logsInRange]);

  // Active dates (days with at least 1 completed habit)
  // For 90-day view, use ALL logs from join date (not just last 90 days)
  const activeDates = useMemo(() => {
    const dates = new Set<string>();
    if (timeRange === '90days') {
      // Use all completed logs regardless of range filter
      habitLogs
        .filter(log => log.status === 'completed')
        .forEach(log => dates.add(log.date));
    } else {
      completedLogs.forEach(log => dates.add(log.date));
    }
    return dates;
  }, [timeRange, completedLogs, habitLogs]);

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
      
      // Final fallback: 90 days ago
      if (!joinDate) {
        joinDate = new Date();
        joinDate.setDate(joinDate.getDate() - 89);
      }
      
      joinDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = formatDate(today);
      
      const result: DayStatus[] = [];
      for (let i = 0; i < 90; i++) {
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
    return buildDayStatuses(timeRange, activeDates);
  }, [timeRange, activeDates, profile?.created_at, habitLogs]);

  // Habit Rate = completed logs / (total habits × days in range) × 100
  const habitRate = useMemo(() => {
    const totalHabits = habits.length || 1;
    const totalPossible = totalHabits * daysInRange;
    if (totalPossible === 0) return 0;
    return Math.round((completedLogs.length / totalPossible) * 100);
  }, [completedLogs.length, habits.length, daysInRange]);

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
    <div className="space-y-4">
      {/* Time Range Toggle - compact */}
      <div className="bg-[#1c1e22] border-[2px] border-white/15 rounded-[10px] px-2 py-2 flex items-center gap-3 w-fit">
        {timeRanges.map((r) => (
          <button
            key={r.id}
            onClick={() => setTimeRange(r.id)}
            className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider transition-all ${
              timeRange === r.id
                ? 'bg-[#00FF85]/15 text-[#00FF85] border border-[#00FF85]/30'
                : 'text-[#E3DAC9]/30 border border-transparent'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Dot Calendar */}
      <div className="bg-[#1c1e22]/70 backdrop-blur-md border-[2px] border-white/10 rounded-[20px] p-5">

        {timeRange === 'weekly' && <WeeklyGrid days={dayStatuses} />}
        {timeRange === 'monthly' && <MonthlyGrid days={dayStatuses} />}
        {timeRange === '90days' && <CompactGrid key="90days-grid" days={dayStatuses} />}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard icon="solar:checklist-minimalistic-bold" value={`${habitRate}%`} label="Rasio Habit" color="#00FF85" />
        <SummaryCard icon="solar:target-bold" value={`${todosCompleted}`} label="To-Do Selesai" color="#00FF85" />
        <SummaryCard icon="solar:notebook-bold" value={`${journalDays}`} label="Hari Jurnal" color="#00FF85" />
      </div>

      {/* Empty state */}
      {completedLogs.length === 0 && (
        <div className="bg-os-card-bg border border-os-green/20 rounded-[20px] p-5 text-center shadow-[0_0_15px_rgba(0,255,133,0.05)]">
          <Icon icon="solar:ghost-bold" className="text-os-green/30 mx-auto mb-2" width={28} />
          <p className="text-[11px] text-white/50 font-bold">Belum ada aktivitas di periode ini</p>
          <p className="text-[9px] text-white/30 mt-1">Selesaikan habit untuk melihat progress-mu!</p>
        </div>
      )}
    </div>
  );
}


// ============================================
// SECTION B: HABIT PATTERN (REAL DATA)
// ============================================
function HabitPattern({ habits, habitLogs, timeRange, setTimeRange, timeRanges }: {
  habits: any[];
  habitLogs: HabitLog[];
  timeRange: TimeRange;
  setTimeRange: (r: TimeRange) => void;
  timeRanges: { id: TimeRange; label: string }[];
}) {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

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
  const categories = ['Semua', 'Rutinitas', 'Ketenangan Diri', 'Evolusi Diri', 'Latihan Fisik'];

  // Filter habits by category
  const filteredHabits = useMemo(() => {
    if (selectedCategory === 'Semua') return habits;
    return habits.filter((h: any) => (h.category || 'Lainnya') === selectedCategory);
  }, [habits, selectedCategory]);

  // Per-habit analytics (all time)
  const habitAnalytics = useMemo(() => {
    return filteredHabits.map((habit: any) => {
      const habitCompletedLogs = habitLogs.filter(
        log => log.habit_id === habit.id && log.status === 'completed'
      );
      const totalDays = Math.max(1, Math.floor((Date.now() - new Date(habitCompletedLogs[0]?.date || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const completionRate = Math.min(100, Math.round((habitCompletedLogs.length / Math.min(totalDays, 90)) * 100));

      return {
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
          className="flex gap-2 overflow-x-auto no-scrollbar pb-2"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                selectedCategory === cat
                  ? 'bg-[#E3DAC9] text-black border-[#E3DAC9] shadow-[0_4px_12px_rgba(227,218,201,0.15)]'
                  : 'bg-[#1c1e22]/80 backdrop-blur-md text-[#E3DAC9]/40 border-white/10 hover:text-white hover:border-white/20'
              }`}
            >
              {cat}
            </button>
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
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setExpandedHabit(isExpanded ? null : h.id)}
                  className={`w-full relative overflow-visible border-[3px] border-white/30 shadow-[0_8px_25px_rgba(0,0,0,0.8)] text-left h-[120px] ${
                    isExpanded ? 'rounded-t-[14px] rounded-b-none border-b-0' : 'rounded-[14px]'
                  }`}
                >
                  {/* Streak Badge - outside top right like habits */}
                  {h.streak > 0 && (
                    <div className="absolute top-[-10px] right-[-5px] z-20 flex items-center gap-1.5 px-[14px] py-[6px] bg-[#FF4D00] border-[1.5px] border-black shadow-[3.5px_3.5px_0px_rgba(0,0,0,1)] rounded-full">
                      <Icon icon="solar:fire-bold" className="text-white w-4 h-4" />
                      <span className="text-white text-[13px] font-black font-['Outfit'] leading-none mt-[1px]">{h.streak}</span>
                    </div>
                  )}

                  <div className={`absolute inset-0 overflow-hidden ${isExpanded ? 'rounded-t-[11px]' : 'rounded-[11px]'}`}>
                    {/* Background Image */}
                    {option && option.imageUrl ? (
                      <img src={option.imageUrl} alt="" className={`absolute inset-0 w-full h-full object-cover ${option.imagePosition || 'object-center'} opacity-[0.85]`} />
                    ) : (
                      <img src="/all_images/custom_habit_bg.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.7]" />
                    )}
                    <div className="absolute inset-0 bg-black/40 z-[1]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-[2]" />
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-end z-10">
                    <span className="text-[15px] font-black text-white font-['Outfit'] drop-shadow-lg">{h.name}</span>
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
        <div className="bg-os-card-bg border border-os-green/20 rounded-[20px] p-6 text-center shadow-[0_0_15px_rgba(0,255,133,0.05)]">
          <Icon icon="solar:ghost-bold" className="text-os-green/30 mx-auto mb-2" width={28} />
          <p className="text-[11px] text-white/50 font-bold">Belum ada habit untuk dianalisis</p>
        </div>
      )}
    </div>
  );
}

// --- Inline Detail (expands below card) ---
function HabitInlineDetail({ habit, habitLogs }: { habit: any; habitLogs: HabitLog[] }) {
  const [recordMonth, setRecordMonth] = useState<1 | 2 | 3>(1);

  const allHabitLogs = useMemo(() => {
    return habitLogs.filter(l => l.habit_id === habit.id && l.status === 'completed');
  }, [habitLogs, habit.id]);

  // First log date = Day 1
  const firstLogDate = useMemo(() => {
    const sorted = allHabitLogs.map(l => l.date).sort();
    if (sorted.length > 0) {
      const d = new Date(sorted[0] + 'T00:00:00');
      d.setHours(0, 0, 0, 0);
      return d;
    }
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [allHabitLogs]);

  // Current day & week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDayNumber = Math.max(1, Math.floor((today.getTime() - firstLogDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
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

  // Determine if this is a numeric habit using shouldShowIntensityPicker
  const isNumericHabit = useMemo(() => {
    return shouldShowIntensityPicker(habit.name);
  }, [habit.name]);

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
    const defaultIntensity = intensityConfig?.defaultValue || habit.target_intensity || 1;
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
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  
  // Dynamic day labels based on actual dates in current week
  const dayLabels = useMemo(() => {
    const weekStartDay = (currentWeek - 1) * 7;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(firstLogDate);
      d.setDate(firstLogDate.getDate() + weekStartDay + i);
      return dayNames[d.getDay()];
    });
  }, [currentWeek, firstLogDate]);

  return (
    <div className="bg-[#1c1e22]/70 backdrop-blur-sm border-[3px] border-t-0 border-white/20 rounded-b-[14px] p-4 pt-5 space-y-4 shadow-[0_8px_40px_rgba(0,255,133,0.04)]">

      {/* Weekly Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Minggu {currentWeek}</span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setCurrentWeek(w => Math.max(1, w - 1))} disabled={currentWeek <= 1}
              className="w-5 h-5 rounded bg-[#2a2c32] border border-white/10 flex items-center justify-center">
              <Icon icon="ph:caret-left-bold" className={currentWeek <= 1 ? 'text-white/10' : 'text-white/50'} width={10} />
            </button>
            <button onClick={() => setCurrentWeek(w => Math.min(totalWeeks, w + 1))} disabled={currentWeek >= totalWeeks}
              className="w-5 h-5 rounded bg-[#2a2c32] border border-white/10 flex items-center justify-center">
              <Icon icon="ph:caret-right-bold" className={currentWeek >= totalWeeks ? 'text-white/10' : 'text-white/50'} width={10} />
            </button>
          </div>
        </div>

        {habit.hasIntensity ? (
          /* Bar chart with Y-axis - like reference */
          <>
          <div className="relative flex gap-2">
            {/* Radial glow behind chart */}
            <div className="absolute inset-0 bg-[#00FF85]/[0.02] blur-[30px] rounded-full pointer-events-none" />
            {/* Y-axis labels - dynamic based on intensity data */}
            <div className="flex flex-col justify-between h-[120px] pr-1 py-0">
              {barChartData && barChartData.yAxisLabels.length > 0 ? (
                [...barChartData.yAxisLabels].reverse().map((label, i) => (
                  <span key={i} className="text-[8px] font-bold text-white/20">{label}</span>
                ))
              ) : (
                <>
                  <span className="text-[8px] font-bold text-white/20">5</span>
                  <span className="text-[8px] font-bold text-white/20">4</span>
                  <span className="text-[8px] font-bold text-white/20">3</span>
                  <span className="text-[8px] font-bold text-white/20">2</span>
                  <span className="text-[8px] font-bold text-white/20">1</span>
                  <span className="text-[8px] font-bold text-white/20">0</span>
                </>
              )}
            </div>
            {/* Chart area */}
            <div className="flex-1 relative h-[120px]">
              {/* Horizontal guide lines */}
              <div className="absolute top-0 left-0 right-0 border-t border-white/[0.12]" />
              <div className="absolute top-1/2 left-0 right-0 border-t border-white/[0.12]" />
              <div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.12]" />
              {/* Bars */}
              <div className="flex items-end gap-2 h-full">
                {weeklyData.map((day, i) => {
                  const barHeight = barChartData ? barChartData.heights[i] : (day.done ? 0.6 : 0);
                  const heightPercent = !day.isScheduled ? '0%' : day.isFuture ? '0%' : barHeight > 0 ? `${Math.max(6, barHeight * 100)}%` : '6%';
                  const hasValue = barChartData ? barChartData.heights[i] > 0 : day.done;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div className="flex-1 w-full flex items-end justify-center">
                        <div className={`w-[50%] rounded-t-[2px] ${!day.isScheduled ? 'bg-white/[0.03]' : day.isFuture ? 'bg-transparent' : hasValue ? 'bg-[#00FF85]/80 shadow-[0_0_10px_rgba(0,255,133,0.25)]' : 'bg-[#2a2c32]'}`}
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
                <span className={`text-[8px] font-bold ${!day.isScheduled ? 'text-white/20' : 'text-white/30'}`}>{dayLabels[i]}</span>
              </div>
            ))}
          </div>
          </>
        ) : (
          /* Checkbox squares - bold stroke */
          <div className="flex items-center gap-2">
            {weeklyData.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-[6px] flex items-center justify-center ${
                  !day.isScheduled ? 'bg-white/[0.03] border-[2px] border-white/5' : day.isFuture ? 'border-[2px] border-white/10' : day.done ? 'bg-[#00FF85]/80 shadow-[0_0_8px_rgba(0,255,133,0.25)]' : 'border-[2px] border-white/40'
                }`}>
                  {day.done && !day.isFuture && day.isScheduled && <Icon icon="ph:check-bold" className="text-black/80" width={14} style={{ strokeWidth: 2 }} />}
                </div>
                <span className={`text-[8px] font-black ${!day.isScheduled ? 'text-white/20' : 'text-white/60'}`}>{dayLabels[i]}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-[9px] text-[#00FF85] font-bold mt-2">{completedThisWeek} hari selesai minggu ini</p>
      </div>

      {/* Monthly Record - 7 cols × 4 rows = 28 per page */}
      {/* Monthly Record */}
      <div className="bg-[#1c1e22]/40 rounded-2xl p-4 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[9px] font-bold text-white/25 uppercase tracking-widest">Rekam Jejak</span>
          <div className="flex items-center gap-1.5">
            {([1, 2, 3] as const).map((m) => (
              <button key={m} onClick={() => setRecordMonth(m)}
                className={`w-6 h-6 rounded-md text-[9px] font-black flex items-center justify-center transition-all ${
                  recordMonth === m ? 'bg-[#00FF85]/15 text-[#00FF85] border border-[#00FF85]/30 shadow-[0_0_8px_rgba(0,255,133,0.15)]' : 'text-white/30 border border-white/10 hover:text-white hover:border-white/20'
                }`}>{m}</button>
            ))}
          </div>
        </div>
        
        <div className="max-w-[280px] mx-auto grid grid-cols-7 gap-2">
          {monthSlice.map((day, idx) => (
            <div key={idx} className={`aspect-square rounded-[8px] flex items-center justify-center transition-all ${
              !day.isScheduled ? 'bg-white/[0.03] border border-white/5' : day.isFuture ? 'bg-white/[0.03] border border-white/5' : day.done ? 'bg-[#00FF85]/80 shadow-[0_2px_8px_rgba(0,255,133,0.25)]' : 'bg-[#2a2c32]/80 border border-white/10'
            }`}>
              <span className={`text-[9px] font-black ${!day.isScheduled ? 'text-white/10' : day.isFuture ? 'text-white/10' : day.done ? 'text-black/80' : 'text-white/30'}`}>
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
  const [recordMonth, setRecordMonth] = useState<1 | 2 | 3>(1);

  // Get all completed logs for this habit (all time)
  const allHabitLogs = useMemo(() => {
    return habitLogs.filter(l => l.habit_id === habit.id && l.status === 'completed');
  }, [habitLogs, habit.id]);

  // Find the earliest log date (Day 1)
  const firstLogDate = useMemo(() => {
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
  }, [allHabitLogs]);

  // Current day number (from Day 1)
  const currentDayNumber = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - firstLogDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  }, [firstLogDate]);

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
  const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  // Get habit action text for summary
  const getHabitAction = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('hidrasi') || lower.includes('minum')) return 'minum air';
    if (lower.includes('bangun')) return 'bangun pagi';
    if (lower.includes('tidur')) return 'tidur 8 jam';
    if (lower.includes('baca') || lower.includes('membaca')) return 'membaca';
    if (lower.includes('olahraga') || lower.includes('workout') || lower.includes('push') || lower.includes('sit')) return 'berolahraga';
    if (lower.includes('ibadah') || lower.includes('beribadah')) return 'beribadah';
    if (lower.includes('journal')) return 'menulis jurnal';
    if (lower.includes('deep work')) return 'deep work';
    if (lower.includes('napas')) return 'latihan napas';
    if (lower.includes('musik')) return 'berlatih musik';
    return `melakukan ${name.toLowerCase()}`;
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
      className="fixed inset-0 bg-[#16181c] z-[100] flex flex-col overflow-y-auto"
    >
      {/* Close Button */}
      <div className="absolute top-12 right-5 z-20">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#2a2c32] border border-white/10 flex items-center justify-center"
        >
          <Icon icon="ph:x-bold" className="text-[#E3DAC9]" width={16} />
        </motion.button>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 pt-10 pb-10 space-y-6">

        {/* 1. Header Card (bigger image card) */}
        <div className="relative rounded-[20px] overflow-hidden border-[2px] border-white/15 h-[140px]">
          {habitOption && (
            <img
              src={habitOption.imageUrl}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover ${habitOption.imagePosition || 'object-center'} opacity-90`}
            />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative z-10 p-5 h-full flex flex-col justify-end">
            <div className="flex items-center justify-between">
              <span className="text-[20px] font-black text-white font-['Outfit'] drop-shadow-lg">{habit.name}</span>
              <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-lg border border-white/10">
                <Icon icon="solar:fire-bold" className="text-[#FF4D00]" width={14} />
                <span className="text-[12px] font-black text-[#FF4D00]">{habit.streak}d</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Weekly Chart Section */}
        <div className="bg-[#1c1e22] border-[2px] border-white/10 rounded-[16px] p-4 space-y-4">
          {/* Title + Week Navigation */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-black text-[#E3DAC9] font-['Outfit']">{habit.name}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentWeek(w => Math.max(1, w - 1))}
                className="w-6 h-6 rounded-md bg-[#2a2c32] border border-white/10 flex items-center justify-center"
                disabled={currentWeek <= 1}
              >
                <Icon icon="ph:caret-left-bold" className={`${currentWeek <= 1 ? 'text-white/20' : 'text-[#E3DAC9]'}`} width={12} />
              </button>
              <span className="text-[10px] font-bold text-white/50 min-w-[60px] text-center">Minggu {currentWeek}</span>
              <button
                onClick={() => setCurrentWeek(w => Math.min(totalWeeks, w + 1))}
                className="w-6 h-6 rounded-md bg-[#2a2c32] border border-white/10 flex items-center justify-center"
                disabled={currentWeek >= totalWeeks}
              >
                <Icon icon="ph:caret-right-bold" className={`${currentWeek >= totalWeeks ? 'text-white/20' : 'text-[#E3DAC9]'}`} width={12} />
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
                      className="w-full rounded-t-[4px] transition-all"
                      style={{
                        height: day.isFuture ? '0%' : day.done ? '100%' : '8%',
                        backgroundColor: day.isFuture ? 'transparent' : day.done ? '#00FF85' : '#2a2c32',
                        minHeight: day.isFuture ? 0 : 4,
                      }}
                    />
                  </div>
                  <span className="text-[8px] font-bold text-white/30">{dayLabels[i]}</span>
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
                      ? 'border-[2px] border-white/5'
                      : day.done
                        ? 'bg-[#00FF85]'
                        : 'border-[2px] border-white/20'
                  }`}>
                    {day.done && !day.isFuture && (
                      <Icon icon="ph:check-bold" className="text-black" width={14} />
                    )}
                  </div>
                  <span className="text-[8px] font-bold text-white/30">{dayLabels[i]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Summary Text */}
        <div className="px-1">
          <p className="text-[12px] text-[#E3DAC9]/60 font-bold font-['Outfit']">
            Kamu {getHabitAction(habit.name)} <span className="text-[#00FF85] font-black">{completedThisWeek}</span> hari minggu ini
          </p>
        </div>

        {/* 4. Monthly Record (Rekam Jejak) */}
        <div className="bg-[#1c1e22] border-[2px] border-white/10 rounded-[16px] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-[#E3DAC9]/50 uppercase tracking-widest font-['Outfit']">Rekam Jejak</span>
            <div className="flex items-center gap-1">
              {([1, 2, 3] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setRecordMonth(m)}
                  className={`w-6 h-6 rounded-md text-[9px] font-black flex items-center justify-center transition-all ${
                    recordMonth === m
                      ? 'bg-[#00FF85]/15 text-[#00FF85] border border-[#00FF85]/30'
                      : 'text-white/30 border border-white/10'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-10 gap-[4px]">
            {monthSlice.map((day, idx) => (
              <div
                key={idx}
                className={`aspect-square rounded-[4px] ${
                  day.isFuture ? 'bg-white/5' : day.done ? 'bg-[#00FF85]' : 'bg-[#2a2c32]'
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
  const streakCount = profile?.streak_count || 0;

  // Use persistent progression store values
  const { totalXP, level, stats: progressionStats, dailyXPEarned } = useProgressionStore();
  const levelInfo = useMemo(() => getLevelInfo(totalXP), [totalXP]);

  const xpProgress = Math.min(100, Math.round(levelInfo.progress * 100));
  const xpForNext = levelInfo.xpNeededForNext;

  const statsList = [
    { name: 'Kebijaksanaan', value: progressionStats.kebijaksanaan, icon: 'ph:brain-bold', color: '#A855F7' },
    { name: 'Kepercayaan Diri', value: progressionStats.kepercayaanDiri, icon: 'ph:crown-bold', color: '#00FF85' },
    { name: 'Kekuatan', value: progressionStats.kekuatan, icon: 'ph:lightning-bold', color: '#FF4D00' },
    { name: 'Disiplin', value: progressionStats.disiplin, icon: 'ph:sword-bold', color: '#3B82F6' },
    { name: 'Fokus', value: progressionStats.fokus, icon: 'ph:crosshair-bold', color: '#F59E0B' },
  ];

  return (
    <div className="relative space-y-6">
      {/* Background image - RPG themed */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="/all_images/statistik_bg.png" alt="" className="w-full h-full object-cover opacity-[0.25]" />
      </div>

      <div className="relative z-10 space-y-6">

      {/* Level Card - Bold style */}
      <div className="relative bg-[#1a1a1a] border-[2.5px] border-[#00FF85]/40 rounded-[20px] p-5 overflow-hidden shadow-[0_0_30px_rgba(0,255,133,0.08)]">
        {/* Subtle glow behind */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-[#00FF85]/10 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="relative flex items-center gap-4 mb-5">
          {/* Level Badge */}
          <div className="w-[72px] h-[72px] bg-[#00FF85] rounded-2xl flex flex-col items-center justify-center shadow-[0_4px_20px_rgba(0,255,133,0.3)]">
            <span className="text-[28px] font-black text-black leading-none">{level}</span>
            <span className="text-[8px] font-black text-black/60 uppercase tracking-wider">Level</span>
          </div>
          
          {/* XP Info */}
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-black text-white leading-none">{totalXP}</span>
              <span className="text-[11px] font-bold text-[#E3DAC9]/40 uppercase">XP earned</span>
            </div>
          </div>

          {/* Streak */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <Icon icon="solar:fire-bold" className="text-[#FF4D00]" width={16} />
              <span className="text-[18px] font-black text-[#FF4D00]">{streakCount}</span>
            </div>
            <span className="text-[7px] text-[#E3DAC9]/30 font-bold uppercase">hari streak</span>
          </div>
        </div>

        {/* Segmented XP Bar */}
        <div className="flex gap-[3px] mb-2">
          {Array.from({ length: 20 }).map((_, i) => {
            const filled = i < Math.round(xpProgress / 5);
            return (
              <div
                key={i}
                className={`flex-1 h-[10px] rounded-[2px] ${
                  filled ? 'bg-[#00FF85] shadow-[0_0_4px_rgba(0,255,133,0.4)]' : 'bg-[#2a2c32]'
                }`}
              />
            );
          })}
        </div>
        <p className="text-[12px] font-black text-[#E3DAC9]/50 text-center mt-1">
          {xpForNext - levelInfo.xpIntoCurrentLevel} XP ke Lvl {level < 100 ? level + 1 : 'MAX'}
        </p>
      </div>

      {/* Stats List - Big numbers, glass container */}
      <div className="bg-[#1c1e22]/50 backdrop-blur-md border-[2px] border-[#00FF85]/25 rounded-[20px] px-5 py-4 space-y-0">
        {statsList.map((stat, idx) => (
          <div key={stat.name} className={`flex items-center gap-4 py-4 ${idx < statsList.length - 1 ? 'border-b-[1.5px] border-white/15' : ''}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
              <Icon icon={stat.icon} style={{ color: stat.color }} width={22} />
            </div>
            <span className="text-[15px] font-bold text-[#E3DAC9] flex-1">{stat.name}</span>
            <span className="text-[11px] font-bold text-[#00FF85]">▲</span>
            <span className="text-[28px] font-black text-white leading-none">{stat.value}</span>
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
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-2">
        {DAY_LABELS.map((l, i) => (
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
        {DAY_LABELS.map((l, i) => (
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
  const [programMonth, setProgramMonth] = useState<1 | 2 | 3>(1);

  // Slice days for current program month (30 days each)
  const startIdx = (programMonth - 1) * 30;
  const monthDays = days.slice(startIdx, startIdx + 30);

  return (
    <div className="flex flex-col gap-5">
      {/* Header row: title left, month toggle right */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold text-[#E3DAC9]/30 uppercase tracking-wider">
          Program 90 Hari
        </span>

        {/* Compact month toggle - top right */}
        <div className="flex items-center gap-1.5">
          {([1, 2, 3] as const).map((m) => (
            <button
              key={m}
              onClick={() => setProgramMonth(m)}
              className={`w-6 h-6 rounded-md text-[9px] font-black transition-all flex items-center justify-center ${
                programMonth === m
                  ? 'bg-[#00FF85]/15 text-[#00FF85] border border-[#00FF85]/30'
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

  const bg = day.isFuture
    ? 'bg-[#E3DAC9]/5'
    : day.active
      ? 'bg-[#00FF85]/80 shadow-[0_2px_8px_rgba(0,255,133,0.25)]'
      : 'bg-[#3a3a3a]';

  const ring = day.isToday 
    ? (day.active ? 'ring-[2px] ring-black/30' : 'ring-1 ring-[#E3DAC9]/30') 
    : '';

  const textColor = day.isFuture
    ? 'text-[#E3DAC9]/10'
    : day.active
      ? 'text-black/45'
      : 'text-white';

  const displayNumber = showDayNumber && day.dayNumber ? day.dayNumber : day.dayOfMonth;

  return (
    <div className={`${sizeClasses[size]} ${bg} ${ring} flex items-center justify-center relative`}>
      <span className={`${fontSizes[size]} font-bold ${textColor} select-none`}>
        {displayNumber}
      </span>
    </div>
  );
}
