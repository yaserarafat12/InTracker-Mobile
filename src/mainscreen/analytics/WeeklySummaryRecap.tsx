import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { supabase } from '../../lib/supabase';
import { useHabitStore } from '../../store/useHabitStore';
import { useUserStore } from '../../store/useUserStore';
import { useTargetStore } from '../../store/useTargetStore';
import { useJourneyStore } from '../../store/useJourneyStore';
import { getDefaultHabitStatsMap } from '../../engines/statsEngine';
import { calculateXPAward } from '../../engines/xpEngine';
import { calculateStatAward } from '../../engines/statsEngine';
import { type StatCategory } from '../../engines/types';
import LoadingScreen from '../../components/LoadingScreen';
import { useTranslation } from '../../i18n';

interface WeeklyGains {
  xp: number;
  stats: Record<StatCategory, number>;
  habitsCompleted: number;
  totalScheduled: number;
  todosCompleted: number;
  journalsLogged: number;
  avgMood: number;
}

export default function WeeklySummaryRecap() {
  const { t, language } = useTranslation();
  const { habits, fetchHabits } = useHabitStore();
  const { profile } = useUserStore();
  const { targets, fetchTargets } = useTargetStore();
  const { entries: journeyEntries, fetchEntries } = useJourneyStore();

  const [loading, setLoading] = useState(true);
  const [weeklyGains, setWeeklyGains] = useState<WeeklyGains>({
    xp: 0,
    stats: { kebijaksanaan: 0, kepercayaanDiri: 0, kekuatan: 0, disiplin: 0, fokus: 0 },
    habitsCompleted: 0,
    totalScheduled: 0,
    todosCompleted: 0,
    journalsLogged: 0,
    avgMood: 0,
  });

  const getWeekDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Start of current week (Monday)
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return { monday, sunday, today };
  };

  const { monday, sunday } = useMemo(() => getWeekDateRange(), []);

  const formatDateStr = (d: Date) => {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  };

  const getLocalizedDateRangeLabel = () => {
    const localeMap: Record<string, string> = {
      'Bahasa Indonesia': 'id-ID',
      'English': 'en-US',
      'Español': 'es-ES',
      'Chinese': 'zh-CN',
      'Hindi': 'hi-IN',
      'Arabic': 'ar-EG',
      'Portuguese': 'pt-PT',
      'Français': 'fr-FR',
      'Japanese': 'ja-JP',
      'Deutsch': 'de-DE'
    };
    const locale = localeMap[language] || 'en-US';
    
    const dayFormatter = new Intl.DateTimeFormat(locale, { day: 'numeric' });
    const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'short' });
    const yearFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric' });

    const monDay = dayFormatter.format(monday);
    const monMonth = monthFormatter.format(monday);
    const sunDay = dayFormatter.format(sunday);
    const sunMonth = monthFormatter.format(sunday);
    const sunYear = yearFormatter.format(sunday);

    return `${monDay} ${monMonth} - ${sunDay} ${sunMonth} ${sunYear}`;
  };

  useEffect(() => {
    const loadWeeklyRecap = async () => {
      setLoading(true);
      try {
        const isGuest = localStorage.getItem('guest_mode') === 'true';
        let user: any = null;
        if (!isGuest) {
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          user = supabaseUser;
        }

        if (!isGuest && !user) {
          setLoading(false);
          return;
        }

        // Fetch stores
        await Promise.all([
          fetchHabits(),
          fetchTargets(),
          fetchEntries(),
        ]);

        const mondayStr = formatDateStr(monday);
        const todayStr = formatDateStr(new Date());

        // Fetch habit logs for this week
        let logs: any[] = [];
        let error = null;

        if (isGuest) {
          const guestLogsStr = localStorage.getItem('guest_habit_logs') || '[]';
          try {
            const guestLogs = JSON.parse(guestLogsStr);
            logs = guestLogs.filter((l: any) => l.date >= mondayStr && l.date <= todayStr);
          } catch (e) {
            logs = [];
          }
        } else {
          const { data: dbLogs, error: dbError } = await supabase
            .from('habit_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', mondayStr)
            .lte('date', todayStr);
          logs = dbLogs || [];
          error = dbError;
        }

        let totalXP = 0;
        const statsGains = { kebijaksanaan: 0, kepercayaanDiri: 0, kekuatan: 0, disiplin: 0, fokus: 0 };
        let habitsCompletedCount = 0;

        if (!error && logs) {
          habitsCompletedCount = logs.filter(l => l.status === 'completed').length;

          // Calculate weekly XP and stats gains from logs
          logs.forEach(log => {
            if (log.status === 'completed') {
              const habit = habits.find(h => h.id === log.habit_id);
              if (habit) {
                // XP calculations
                const xpResult = calculateXPAward({
                  source: 'habit',
                  difficulty: habit.difficulty || 1,
                  charCount: 0,
                  dailyXPEarned: 0, // Assume no caps for weekly recap display
                  dailyFeedXPEarned: 0,
                  dailyJournalCount: 0,
                });
                totalXP += xpResult.awarded;

                // Stats calculations
                const habitStatsMap = getDefaultHabitStatsMap(habit.category, habit.difficulty || 1);
                const statResult = calculateStatAward({
                  source: 'habit',
                  habitStatsMap,
                  dailyStatEarned: { kebijaksanaan: 0, kepercayaanDiri: 0, kekuatan: 0, disiplin: 0, fokus: 0 },
                });

                Object.keys(statResult.awards).forEach(cat => {
                  const key = cat as StatCategory;
                  statsGains[key] = (statsGains[key] || 0) + statResult.awards[key];
                });
              }
            }
          });
        }

        // Calculate scheduled habits total this week
        let totalScheduledCount = 0;
        const dayDiff = Math.min(7, Math.floor((new Date().getTime() - monday.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        
        for (let i = 0; i < dayDiff; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const dayIndex = d.getDay();
          
          habits.forEach(habit => {
            const scheduleDays = habit.schedule_days || [0, 1, 2, 3, 4, 5, 6];
            if (scheduleDays.includes(dayIndex)) {
              if (habit.created_at) {
                const created = new Date(habit.created_at);
                created.setHours(0, 0, 0, 0);
                const currentEvalDate = new Date(d);
                currentEvalDate.setHours(0, 0, 0, 0);
                if (currentEvalDate >= created) {
                  totalScheduledCount++;
                }
              } else {
                totalScheduledCount++;
              }
            }
          });
        }

        // Calculate completed todos this week
        const todosCompletedCount = targets.filter(t => {
          if (!t.completed || !t.completedAt) return false;
          const completedDate = new Date(t.completedAt);
          return completedDate >= monday && completedDate <= new Date();
        }).length;

        // Calculate journal entries logged this week
        let journalsLoggedCount = 0;
        let moodSum = 0;
        let moodCount = 0;

        Object.values(journeyEntries).forEach((entry: any) => {
          if (entry.entry_date >= mondayStr && entry.entry_date <= todayStr) {
            const hasJournal = entry.journal_text && entry.journal_text.trim().length > 0;
            if (hasJournal) {
              journalsLoggedCount++;
            }
            if (entry.mood_id !== null && entry.mood_id !== undefined) {
              // mood_id values are 0-4 (😫, 😔, 😐, 😊, 🤩)
              moodSum += entry.mood_id;
              moodCount++;
            }
          }
        });

        const avgMood = moodCount > 0 ? Math.round((moodSum / moodCount) + 1) : 0; // scale 1-5

        setWeeklyGains({
          xp: totalXP,
          stats: statsGains,
          habitsCompleted: habitsCompletedCount,
          totalScheduled: totalScheduledCount || 1,
          todosCompleted: todosCompletedCount,
          journalsLogged: journalsLoggedCount,
          avgMood,
        });

      } catch (err) {
        console.error("Failed to load weekly summary data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadWeeklyRecap();
  }, [monday, habits, targets, journeyEntries]);

  if (loading) {
    return <LoadingScreen message={t('weeklyRecap.loading')} />;
  }

  const successRate = Math.round((weeklyGains.habitsCompleted / weeklyGains.totalScheduled) * 100);

  // Generate assessment text
  const getAssessment = () => {
    if (successRate >= 80) return { text: t('weeklyRecap.assessment.excellent'), color: "text-[#7BE495]" };
    if (successRate >= 50) return { text: t('weeklyRecap.assessment.stable'), color: "text-[#7BE495]/80" };
    return { text: t('weeklyRecap.assessment.challenging'), color: "text-red-400" };
  };

  const assessment = getAssessment();

  const moodEmojis = ["😫", "😔", "😐", "😊", "🤩"];
  const moodLabels = [
    t('weeklyRecap.moodLabels.0'),
    t('weeklyRecap.moodLabels.1'),
    t('weeklyRecap.moodLabels.2'),
    t('weeklyRecap.moodLabels.3'),
    t('weeklyRecap.moodLabels.4'),
  ];

  return (
    <div className="flex flex-col h-full text-[#E3DAC9] font-['Outfit'] px-5 pt-4 pb-32">
      {/* Header Card */}
      <div className="relative bg-[#0d0f12] border-[2.5px] border-[#7BE495]/40 rounded-[20px] p-6 mb-6 overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#7BE495]/5 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-3.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#7BE495]/10 border border-[#7BE495]/20 flex items-center justify-center">
            <Icon icon="solar:document-text-bold" className="text-[#7BE495]" width={20} />
          </div>
          <div>
            <h1 className="text-base font-black text-white leading-tight">{t('weeklyRecap.title')}</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">{getLocalizedDateRangeLabel()}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Success Rate & XP Gained */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Success Rate Card */}
        <div className="bg-[#1c1e22]/50 border-[2px] border-white/10 rounded-[20px] p-5 flex flex-col justify-between h-[130px]">
          <span className="text-[9px] font-black uppercase text-white/30 tracking-wider">{t('weeklyRecap.habitRate')}</span>
          <div>
            <span className="text-[32px] font-black text-white leading-none">{successRate}%</span>
            <p className="text-[9px] text-[#7BE495] font-black mt-1">
              {t('weeklyRecap.habitRatioDesc')
                .replace('{completed}', String(weeklyGains.habitsCompleted))
                .replace('{total}', String(weeklyGains.totalScheduled))}
            </p>
          </div>
        </div>

        {/* XP Card */}
        <div className="bg-[#1c1e22]/50 border-[2px] border-white/10 rounded-[20px] p-5 flex flex-col justify-between h-[130px]">
          <span className="text-[9px] font-black uppercase text-white/30 tracking-wider">{t('weeklyRecap.xpGained')}</span>
          <div>
            <span className="text-[32px] font-black text-[#7BE495] leading-none">+{weeklyGains.xp}</span>
            <p className="text-[9px] text-white/40 font-black mt-1">{t('weeklyRecap.xpDesc')}</p>
          </div>
        </div>
      </div>

      {/* RPG Stats Gains */}
      <div className="bg-[#1c1e22]/50 border-[2px] border-white/10 rounded-[20px] p-5 mb-6 space-y-4">
        <h3 className="text-[11px] font-black text-white/40 uppercase tracking-widest">{t('weeklyRecap.statsTitle')}</h3>
        <div className="grid grid-cols-5 gap-2">
          {[
            { key: 'kebijaksanaan', name: 'Keb.', color: '#A855F7', icon: 'ph:brain-bold' },
            { key: 'kepercayaanDiri', name: 'P.Diri', color: '#7BE495', icon: 'ph:crown-bold' },
            { key: 'kekuatan', name: 'Kek.', color: '#FF4D00', icon: 'ph:lightning-bold' },
            { key: 'disiplin', name: 'Dis.', color: '#3B82F6', icon: 'ph:sword-bold' },
            { key: 'fokus', name: 'Fok.', color: '#F59E0B', icon: 'ph:crosshair-bold' },
          ].map(stat => {
            const val = weeklyGains.stats[stat.key as StatCategory] || 0;
            return (
              <div key={stat.key} className="flex flex-col items-center bg-black/40 border border-white/5 py-3.5 rounded-xl">
                <Icon icon={stat.icon} style={{ color: stat.color }} width={18} />
                <span className="text-[8px] font-bold text-white/40 mt-1">{t('weeklyRecap.statShortLabels.' + stat.key)}</span>
                <span className="text-sm font-black text-white mt-1.5">{val > 0 ? `+${val}` : '0'}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Recap: Todos, Journals, Mood */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-[#1c1e22]/50 border-[2px] border-white/10 rounded-[16px] p-4 text-center">
          <Icon icon="solar:target-bold" className="text-[#3B82F6] mx-auto mb-1" width={18} />
          <span className="text-[16px] font-black text-white">{weeklyGains.todosCompleted}</span>
          <p className="text-[8px] font-black text-white/30 uppercase mt-0.5">{t('weeklyRecap.todosCompleted')}</p>
        </div>
        <div className="bg-[#1c1e22]/50 border-[2px] border-white/10 rounded-[16px] p-4 text-center">
          <Icon icon="solar:notebook-bold" className="text-[#A855F7] mx-auto mb-1" width={18} />
          <span className="text-[16px] font-black text-white">{weeklyGains.journalsLogged}</span>
          <p className="text-[8px] font-black text-white/30 uppercase mt-0.5">{t('weeklyRecap.journalsLogged')}</p>
        </div>
        <div className="bg-[#1c1e22]/50 border-[2px] border-white/10 rounded-[16px] p-4 text-center">
          <span className="text-base leading-none block mb-1">
            {weeklyGains.avgMood > 0 ? moodEmojis[weeklyGains.avgMood - 1] : '😐'}
          </span>
          <span className="text-[10px] font-black text-white leading-none block mt-1">
            {weeklyGains.avgMood > 0 ? moodLabels[weeklyGains.avgMood - 1] : 'N/A'}
          </span>
          <p className="text-[8px] font-black text-white/30 uppercase mt-1">{t('weeklyRecap.avgMood')}</p>
        </div>
      </div>

      {/* Evaluasi Mingguan */}
      <div className="bg-[#1c1e22]/50 border-[2px] border-white/10 rounded-[20px] p-5">
        <h3 className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-3">
          {t('weeklyRecap.assessmentTitle') === 'weeklyRecap.assessmentTitle' ? 'Weekly Evaluation' : t('weeklyRecap.assessmentTitle')}
        </h3>
        <p className={`text-xs font-semibold leading-relaxed ${assessment.color}`}>
          {assessment.text}
        </p>
      </div>
    </div>
  );
}
