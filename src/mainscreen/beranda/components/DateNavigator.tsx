import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useUserStore } from '../../../store/useUserStore';
import { useHistoryLogs } from '../../habits/useHistoryLogs';
import { filterHabitsByDay } from '../../../utils/scheduleHelpers';

interface DateNavigatorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  activeFilter: 'berjalan' | 'selesai' | 'dilewati';
  setActiveFilter: (filter: 'berjalan' | 'selesai' | 'dilewati') => void;
  habits: any[];
}

export const DateNavigator = ({ 
  selectedDate, 
  setSelectedDate, 
  activeFilter, 
  setActiveFilter,
  habits 
}: DateNavigatorProps) => {
  const { profile } = useUserStore();
  
  // Check if viewing a past date
  const isHistorical = (() => {
    const today = new Date();
    return (
      selectedDate.getFullYear() !== today.getFullYear() ||
      selectedDate.getMonth() !== today.getMonth() ||
      selectedDate.getDate() !== today.getDate()
    );
  })();

  // Calculate actual day number from journey start (created_at) based on selectedDate
  const getDayCount = () => {
    if (!profile?.created_at) return 1;
    const start = new Date(profile.created_at);
    start.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    const diff = Math.floor((selected.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, Math.min(diff, 90)); // clamp 1-90
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
    const scheduledHabits = filterHabitsByDay(habits, selectedDate.getDay());
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
            <span className="font-['Outfit'] text-[32px]">Day</span>
            <span className="font-['Outfit'] text-[28px] ml-2.5">{dayCount}</span>
            <span className="text-white font-['Outfit'] text-[28px]"> / 90</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button 
            whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
            onClick={handlePrevDate}
            className="w-12 h-11 rounded-xl flex items-center justify-center bg-[#1A1A1A] border-[1.5px] border-[#E3DAC9]/20 shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Icon icon="solar:play-bold" width={14} height={14} className="text-[#E3DAC9]/40 rotate-180" />
          </motion.button>
          <motion.button 
            whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
            onClick={handleNextDate}
            className="w-12 h-11 rounded-xl flex items-center justify-center bg-[#1A1A1A] border-[1.5px] border-[#E3DAC9]/20 shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Icon icon="solar:play-bold" width={14} height={14} className="text-[#E3DAC9]/40" />
          </motion.button>
        </div>
      </div>

      <div className="mt-12">
        <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { id: 'berjalan', label: isHistorical ? 'Terlewati' : 'Berjalan', count: counts.berjalan },
            { id: 'dilewati', label: 'Dilewati', count: counts.dilewati },
            { id: 'selesai', label: 'Selesai', count: counts.selesai }
          ].map((item) => (
            <motion.button 
              key={item.id}
              whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(10);
                setActiveFilter(item.id as any);
              }}
              className={`
                w-full px-2 py-2.5 rounded-xl transition-all flex flex-col items-center justify-center
                border-[2px] shadow-[3px_3px_0px_rgba(0,0,0,1)]
                ${activeFilter === item.id 
                  ? (item.id === 'selesai' ? 'bg-[#00FF85] border-black' : item.id === 'dilewati' ? 'bg-[#EF4444] border-black' : 'bg-[#E3DAC9] border-black')
                  : 'bg-[#1c1e22] border-white/15'}
              `}
            >
              <div className="flex items-start justify-center gap-0.5">
                <span className={`text-[14px] font-bold font-['Outfit'] tracking-tight ${activeFilter === item.id ? (item.id === 'dilewati' ? 'text-white' : 'text-black') : 'text-[#F5F5F5]/80'}`}>
                  {item.label}
                </span>
                <span className={`text-[10px] font-black mt-[-2px] ${activeFilter === item.id ? (item.id === 'dilewati' ? 'text-white/60' : 'text-black/40') : 'text-[#F5F5F5]/40'}`}>
                  {item.count}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};
