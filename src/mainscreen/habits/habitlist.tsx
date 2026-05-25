import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { Icon } from '@iconify/react';
import KartuTugas from './displaycardhabit';
import { useHabitStore } from '../../store/useHabitStore';
import { useUserStore } from '../../store/useUserStore';
import { filterHabitsByDay } from '../../utils/scheduleHelpers';
import { useHistoryLogs } from './useHistoryLogs';
import { playNotifSfx } from '../../utils/sfx';

const HabitReorderItem = ({ habit, index, type, handleDoubleTap, onEdit, reorderHabits }: any) => {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      key={habit.id}
      value={habit}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      whileDrag={{
        scale: 1.05,
        boxShadow: "0px 15px 30px rgba(0,0,0,0.3)",
        zIndex: 50,
      }}
      onDragStart={() => {
        if (navigator.vibrate) navigator.vibrate(15);
      }}
    >
      <KartuTugas
        habit={habit}
        index={index}
        activeFilter={type}
        onDoubleTap={handleDoubleTap}
        onEdit={onEdit}
        isDraggable={true}
        dragControls={dragControls}
      />
    </Reorder.Item>
  );
};

const DaftarHabit = ({
  activeFilter = 'berjalan',
  selectedDate,
  habits,
  onEdit,
  onComplete,
  onAddHabit,
}: {
  activeFilter?: string;
  selectedDate: Date;
  habits: any[];
  onEdit?: (habit: any) => void;
  onComplete?: () => void;
  onAddHabit?: () => void;
}) => {
  const [lastTap, setLastTap] = useState(0);
  const { toggleHabit, reorderHabits } = useHabitStore();
  const { profile } = useUserStore();
  const [showHint, setShowHint] = useState(true);

  React.useEffect(() => {
    // Hide if dismissed manually before
    const isDismissed = localStorage.getItem('hideDoubleTapHint');
    if (isDismissed) {
      setShowHint(false);
      return;
    }
    
    // Hide if account is older than 2 days
    if (profile?.created_at) {
      const joinDate = new Date(profile.created_at);
      const now = new Date();
      const daysSinceJoin = (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceJoin > 2) {
        setShowHint(false);
      }
    }
  }, [profile?.created_at]);

  const dismissHint = () => {
    setShowHint(false);
    localStorage.setItem('hideDoubleTapHint', 'true');
  };

  const handleDoubleTap = (id: string) => {
    toggleHabit(id, 'completed');
    if (onComplete) onComplete();
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    playNotifSfx();
  };

  const todayDay = new Date().getDay();
  const selectedDay = selectedDate.getDay();
  const { logs: historyLogs, loading: historyLoading, isHistorical } = useHistoryLogs(selectedDate);

  // If viewing a past date, show historical data using same card layout as today (read-only)
  if (isHistorical) {
    const scheduledHabits = filterHabitsByDay(habits, selectedDay);

    if (historyLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <span className="text-[13px] text-white/30">Memuat riwayat...</span>
        </div>
      );
    }

    const completedIds = (historyLogs || []).filter(l => l.status === 'completed').map(l => l.habit_id);
    const skippedIds = (historyLogs || []).filter(l => l.status === 'skipped').map(l => l.habit_id);

    const historicalHabits = scheduledHabits.map(h => ({
      ...h,
      completed: completedIds.includes(h.id),
      skipped: skippedIds.includes(h.id),
      // Habits that weren't completed or skipped are "missed"
      missed: !completedIds.includes(h.id) && !skippedIds.includes(h.id),
    }));

    // Filter by activeFilter tab — "berjalan" shows missed habits for past days
    const filteredHistorical = activeFilter === 'selesai'
      ? historicalHabits.filter(h => h.completed)
      : activeFilter === 'dilewati'
      ? historicalHabits.filter(h => h.skipped)
      : historicalHabits.filter(h => h.missed); // "berjalan" = missed for past days

    if (filteredHistorical.length === 0) {
      const emptyMsg = activeFilter === 'selesai'
        ? 'Tidak ada habit yang diselesaikan'
        : activeFilter === 'dilewati'
        ? 'Tidak ada habit yang dilewati'
        : 'Tidak ada habit yang terlewat';

      return (
        <div className="pt-4 px-5 pb-36">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-[22px] bg-[#2a2c32] border-[1.5px] border-white/5 flex items-center justify-center mb-6">
              <Icon icon="solar:clipboard-list-bold" width={28} className="text-[#E3DAC9]/20" />
            </div>
            <h3 className="font-black text-[15px] tracking-[0.1em] text-[#E3DAC9]/60 uppercase font-['Outfit'] text-center">
              {emptyMsg}
            </h3>
          </div>
        </div>
      );
    }

    // Render using same card style as today but without interaction
    return (
      <div className="pt-4 px-5 pb-36 min-h-screen overflow-x-hidden relative">
        <motion.div
          key={`history-${activeFilter}`}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full space-y-6 pt-4"
        >
          {filteredHistorical.map((habit, i) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
            >
              <KartuTugas
                habit={habit}
                index={i}
                activeFilter={activeFilter}
                onDoubleTap={() => {}} // No-op for historical
                isDraggable={false}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  // Today's view (existing logic)
  const todoHabits = filterHabitsByDay(
    habits.filter((h) => !h.completed && !h.skipped),
    todayDay
  );
  const completedHabits = habits.filter((h) => h.completed);
  const skippedHabits = habits.filter((h) => h.skipped);

  // Determine empty state for "berjalan" tab
  const scheduledToday = filterHabitsByDay(
    habits.filter((h) => !h.skipped),
    todayDay
  );
  const allCompletedToday = habits.length > 0 && scheduledToday.length > 0 && scheduledToday.every((h) => h.completed);
  const hasHabitsButNoneToday = habits.length > 0 && scheduledToday.length === 0;
  const hasZeroHabits = habits.length === 0;

  const CAT_PRIORITY: Record<string, number> = {
    Rutinitas: 1,
    'Ketenangan Diri': 2,
    'Evolusi Diri': 3,
    'Latihan Fisik': 4,
  };

  const CATEGORY_ICONS: Record<string, string> = {
    Rutinitas: 'solar:target-bold',
    'Ketenangan Diri': 'solar:ghost-bold',
    'Evolusi Diri': 'solar:library-bold',
    'Latihan Fisik': 'solar:dumbell-bold',
  };

  const renderDisplay = (items: any[], type: string) => {
    if (items.length > 0) {
      return (
        <motion.div
          key={type}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full space-y-8 pt-6"
        >
          {/* Tip hanya untuk tab berjalan */}
          {type === 'berjalan' && showHint && (
            <div className="mt-0 mb-4 relative">
              <div className="flex items-center gap-3 px-5 h-[52px] rounded-[16px] bg-[#00FF85]/15 border-[1.5px] border-[#00FF85]/30 w-full">
                <Icon icon="lucide:pointer" className="text-[#00FF85] w-5 h-5 shrink-0" />
                <p className="text-[#00FF85] text-[13px] font-['Outfit'] font-black tracking-wide">
                  Ketuk 2x untuk menyelesaikan tugas
                </p>
              </div>
              {/* X button - top right corner, half inside half outside */}
              <button 
                onClick={dismissHint} 
                className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center rounded-full bg-[#1a1a1a] border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] text-white/60 hover:text-white"
              >
                <Icon icon="ph:x-bold" width={12} />
              </button>
            </div>
          )}

          <Reorder.Group
            axis="y"
            values={items}
            onReorder={(newOrder) => reorderHabits(newOrder)}
            className="w-full space-y-6 pt-4"
          >
            {items.map((habit, i) => (
              <HabitReorderItem
                key={habit.id}
                habit={habit}
                index={i}
                type={type}
                handleDoubleTap={handleDoubleTap}
                onEdit={onEdit}
              />
            ))}
          </Reorder.Group>
        </motion.div>
      );
    }

    // Determine empty state message and style for "berjalan" tab
    let emptyIcon = 'solar:clipboard-list-bold';
    let emptyTitle = '';
    let emptySubtitle = 'Ketuk tombol <span class="text-[#00FF85]/40">(+)</span> untuk memulai';
    let titleColor = 'text-[#E3DAC9]/60';
    let iconColor = 'text-[#E3DAC9]/20';
    let iconBg = 'bg-[#2a2c32] border-white/5';

    if (type === 'berjalan') {
      if (allCompletedToday) {
        emptyIcon = 'solar:check-circle-bold';
        emptyTitle = 'Semua habit hari ini selesai!';
        emptySubtitle = '';
        titleColor = 'text-[#00FF85]/80';
        iconColor = 'text-[#00FF85]/60';
        iconBg = 'bg-[#00FF85]/10 border-[#00FF85]/20';
      } else if (hasHabitsButNoneToday) {
        emptyTitle = 'Tidak ada habit yang dijadwalkan hari ini';
        emptySubtitle = '';
      } else if (hasZeroHabits) {
        emptyTitle = 'Belum ada habit. Tap + untuk menambahkan';
      } else {
        emptyTitle = 'Belum ada tugas hari ini';
      }
    } else if (type === 'selesai') {
      emptyTitle = 'Belum ada tugas yang tuntas';
    } else {
      emptyTitle = 'Belum ada tugas yang dilewati';
    }

    return (
      <motion.div
        key={type}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full space-y-8"
      >
        <div className="flex flex-col items-center justify-center py-20">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
             <div className={`w-16 h-16 rounded-[22px] ${iconBg} border-[1.5px] flex items-center justify-center mb-6 shadow-2xl`}>
                <Icon icon={emptyIcon} width={28} height={28} className={iconColor} />
             </div>
             
             <h3 className={`font-black text-[15px] tracking-[0.1em] ${titleColor} uppercase font-['Outfit'] text-center px-8 leading-tight`}>
               {emptyTitle}
             </h3>
             
             {emptySubtitle && (
               <p className="mt-3 text-[11px] text-[#E3DAC9]/20 font-medium tracking-wide uppercase"
                  dangerouslySetInnerHTML={{ __html: emptySubtitle }}
               />
             )}
          </motion.div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="pt-4 px-5 pb-36 min-h-screen overflow-x-hidden relative">
      <AnimatePresence mode="wait">
        {activeFilter === 'berjalan'
          ? renderDisplay(todoHabits, 'berjalan')
          : activeFilter === 'selesai'
          ? renderDisplay(completedHabits, 'selesai')
          : renderDisplay(skippedHabits, 'dilewati')}
      </AnimatePresence>

      {/* FAB - Tambah Habit (pojok kanan bawah) */}
      {onAddHabit && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.9, x: 4, y: 4, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(20);
            onAddHabit();
          }}
          className="fixed bottom-24 right-6 w-[60px] h-[60px] bg-[#00FF85] border-[2px] border-black rounded-2xl shadow-[5px_5px_0px_rgba(0,0,0,1)] flex items-center justify-center z-[60]"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="black" strokeWidth="5" strokeLinecap="square" />
          </svg>
        </motion.button>
      )}
    </div>
  );
};

export default DaftarHabit;
