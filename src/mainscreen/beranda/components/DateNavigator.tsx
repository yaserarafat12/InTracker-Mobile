import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useUserStore } from '../../../store/useUserStore';
import { useHistoryLogs } from '../../habits/useHistoryLogs';
import { filterHabitsByDay } from '../../../utils/scheduleHelpers';
import { useTranslation } from '../../../i18n';

interface DateNavigatorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  activeFilter: 'berjalan' | 'selesai' | 'dilewati';
  setActiveFilter: (filter: 'berjalan' | 'selesai' | 'dilewati') => void;
  habits: any[];
  onAddHabit?: () => void;
}

export const DateNavigator = ({ 
  selectedDate, 
  setSelectedDate, 
  activeFilter, 
  setActiveFilter,
  habits,
  onAddHabit
}: DateNavigatorProps) => {
  const { profile, settings } = useUserStore();
  const { t } = useTranslation();
  
  const isLight = settings?.theme === 'Light';

  const hasPrev = (() => {
    if (!profile?.created_at) return true;
    const start = new Date(profile.created_at);
    start.setHours(0, 0, 0, 0);
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    return prev >= start;
  })();

  const hasNext = (() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    return next <= today;
  })();
  
  // Check if viewing a past date
  const isHistorical = (() => {
    const today = new Date();
    return (
      selectedDate.getFullYear() !== today.getFullYear() ||
      selectedDate.getMonth() !== today.getMonth() ||
      selectedDate.getDate() !== today.getDate()
    );
  })();

  // Calculate actual day number from journey start (created_at) based on selectedDate, subtracting paused days
  const getDayCount = () => {
    if (!profile?.created_at) return 1;
    const start = new Date(profile.created_at);
    start.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    const diff = Math.floor((selected.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const pausedDays = settings.pausedDays || [];
    const pausedBeforeSelected = pausedDays.filter(dStr => {
      const d = new Date(dStr + 'T00:00:00');
      d.setHours(0, 0, 0, 0);
      return d <= selected;
    }).length;
    
    return Math.max(1, Math.min(diff - pausedBeforeSelected, 90)); // clamp 1-90
  };
  const dayCount = getDayCount();

  const { logs: historyLogs } = useHistoryLogs(selectedDate);

  const counts = (() => {
    if (!isHistorical) {
      return {
        berjalan: habits.filter((h: any) => !h.completed && !h.skipped).length,
        dilewati: habits.filter((h: any) => h.skipped).length,
        selesai: habits.filter((h: any) => h.completed).length
      };
    }
    // Historical: compute from logs
    const scheduledHabits = filterHabitsByDay(habits, selectedDate.getDay())
      .filter((h: any) => {
        if (!h.created_at) return true;
        const created = new Date(h.created_at);
        created.setHours(0, 0, 0, 0);
        const target = new Date(selectedDate);
        target.setHours(0, 0, 0, 0);
        return target.getTime() >= created.getTime();
      });
    const completedIds = (historyLogs || []).filter(l => l.status === 'completed').map(l => l.habit_id);
    const skippedIds = (historyLogs || []).filter(l => l.status === 'skipped').map(l => l.habit_id);
    const missed = scheduledHabits.filter(h => !completedIds.includes(h.id) && !skippedIds.includes(h.id));
    return {
      berjalan: missed.length, // "Terlewati" count
      dilewati: skippedIds.length,
      selesai: completedIds.length
    };
  })();

  const handlePrevDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    // Don't go before journey start
    if (profile?.created_at) {
      const start = new Date(profile.created_at);
      start.setHours(0, 0, 0, 0);
      if (d < start) return;
    }
    setSelectedDate(d);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleNextDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    // Don't go past today
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (d > today) return;
    setSelectedDate(d);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <div className="px-6 mb-8 mt-14">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="font-black text-white leading-none tracking-normal" style={{ fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum"' }}>
            <span className="font-['Rajdhani'] text-[32px] font-bold" style={{ WebkitTextStroke: '1px currentColor' }}>{t('analytics.day')}</span>
            <span className="font-['Rajdhani'] text-[32px] ml-5 font-bold" style={{ WebkitTextStroke: '1px currentColor' }}>{dayCount}</span>
            <span className="font-['Rajdhani'] text-[32px] font-bold px-3" style={{ WebkitTextStroke: '1px currentColor' }}>/</span>
            <span className="font-['Rajdhani'] text-[32px] font-bold" style={{ WebkitTextStroke: '1px currentColor' }}>{settings.programDuration || 90}</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handlePrevDate}
            className={`w-10 h-10 rounded-[10px] flex items-center justify-center border-[1.5px] transition-all ${
              isLight 
                ? 'bg-neutral-50 border-black/15 text-black shadow-sm' 
                : 'bg-[#1A1A1A]/40 border-white/10 text-white shadow-none'
            }`}
          >
            <Icon icon="ph:caret-left-bold" width={20} height={20} className={isLight ? 'text-black' : 'text-white'} />
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleNextDate}
            className={`w-10 h-10 rounded-[10px] flex items-center justify-center border-[1.5px] transition-all ${
              isLight 
                ? 'bg-neutral-50 border-black/15 text-black shadow-sm' 
                : 'bg-[#1A1A1A]/40 border-white/10 text-white shadow-none'
            }`}
          >
            <Icon icon="ph:caret-right-bold" width={20} height={20} className={isLight ? 'text-black' : 'text-white'} />
          </motion.button>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex gap-2.5 items-center w-full">
          <div className="grid grid-cols-3 gap-2.5 flex-1">
            {[
              { id: 'berjalan', label: isHistorical ? t('habits.filters.missed') : t('habits.filters.active'), count: counts.berjalan },
              { id: 'dilewati', label: t('habits.filters.skipped'), count: counts.dilewati },
              { id: 'selesai', label: t('habits.filters.completed'), count: counts.selesai }
            ].map((item) => (
              <motion.button 
                key={item.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(10);
                  setActiveFilter(item.id as any);
                }}
                className={`
                  w-full px-2 py-2.5 rounded-[8px] transition-all flex flex-col items-center justify-center
                  ${activeFilter === item.id ? 'sheen-active-tab transform scale-[1.05]' : 'transform scale-100'}
                  ${activeFilter === item.id 
                    ? (item.id === 'selesai' || item.id === 'berjalan'
                        ? isLight
                          ? 'border-[1.5px] border-[#81E6D9] bg-gradient-to-br from-[#E6FFFA] to-[#C6F6D5] text-[#22543D] shadow-sm'
                          : 'border-[1.5px] border-[#1C4D38] bg-gradient-to-br from-[#102A1E] to-[#0A1A12] text-[#00FF85] shadow-none'
                        : item.id === 'dilewati' 
                          ? isLight
                            ? 'border-[1.5px] border-[#FEB2B2] bg-gradient-to-br from-[#FFE5E5] to-[#FED7D7] text-[#742A2A] shadow-sm'
                            : 'border-[1.5px] border-[#611E1E] bg-gradient-to-br from-[#3D1414] to-[#260C0C] text-[#EF4444] shadow-none'
                          : isLight
                            ? 'border-[1.5px] border-[#A8C7FA] bg-gradient-to-br from-[#EBF3FF] to-[#D0E2FF] text-[#0B57D0] shadow-sm'
                            : 'border-[1.5px] border-[#2E4378] bg-gradient-to-br from-[#1E2B4C] to-[#141C33] text-[#8AB4F8] shadow-none')
                    : (isLight 
                        ? 'bg-white border-[1.5px] border-neutral-200 text-neutral-400 shadow-sm hover:text-neutral-600' 
                        : 'bg-[#1C1E22]/50 border-[1.5px] border-white/[0.07] text-[#E3DAC9]/40 shadow-none hover:text-[#E3DAC9]/60')}
                `}
              >
                <div className="flex items-start justify-center gap-0.5">
                  <span className={`text-[14px] font-bold font-['Outfit'] tracking-tight transition-colors duration-300 ${
                    activeFilter === item.id 
                      ? item.id === 'selesai' || item.id === 'berjalan'
                        ? (isLight ? 'text-[#22543D]' : 'text-[#00FF85]')
                        : item.id === 'dilewati'
                          ? (isLight ? 'text-[#742A2A]' : 'text-[#EF4444]')
                          : isLight ? 'text-[#0B57D0]' : 'text-[#8AB4F8]'
                      : (isLight ? 'text-neutral-400' : 'text-[#E3DAC9]/40')
                  }`}>
                    {item.label}
                  </span>
                  <span className={`text-[10px] font-black mt-[-2px] transition-colors duration-300 ${
                    activeFilter === item.id 
                      ? item.id === 'selesai' || item.id === 'berjalan'
                        ? (isLight ? 'text-[#22543D]/60' : 'text-[#00FF85]/60')
                        : item.id === 'dilewati'
                          ? (isLight ? 'text-[#742A2A]/60' : 'text-[#EF4444]/60')
                          : isLight ? 'text-[#0B57D0]/60' : 'text-[#8AB4F8]/60'
                      : (isLight ? 'text-neutral-400/50' : 'text-[#E3DAC9]/20')
                  }`}>
                    {item.count}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
          {onAddHabit && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(20);
                onAddHabit();
              }}
              className={`
                w-[44px] h-[44px] shrink-0 rounded-[8px] transition-all flex items-center justify-center border-0
                ${isLight 
                  ? 'bg-white text-black shadow-sm hover:bg-neutral-50' 
                  : 'bg-[#1C1E22]/50 text-white shadow-none hover:bg-[#1C1E22]/80'}
              `}
            >
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3.8" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
