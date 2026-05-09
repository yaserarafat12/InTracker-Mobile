import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import KartuTugas, { CustomIcon } from './displaycardhabit';
import { useHabitStore } from '../../store/useHabitStore';

const DaftarHabit = ({ activeFilter = 'berjalan', habits, onEdit, onComplete }: { activeFilter?: string, selectedDate: Date, habits: any[], onEdit?: (habit: any) => void, onComplete?: () => void }) => {
  const [lastTap, setLastTap] = useState(0);
  const { toggleHabit } = useHabitStore();

  const handleDoubleTap = (id: string) => {
    toggleHabit(id, 'completed');
    if (onComplete) onComplete();
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
  };

  const todoHabits = habits.filter(h => !h.completed && !h.skipped);
  const completedHabits = habits.filter(h => h.completed);
  const skippedHabits = habits.filter(h => h.skipped);

  const CAT_PRIORITY: Record<string, number> = {
    'Rutinitas': 1,
    'Ketenangan Diri': 2,
    'Evolusi Diri': 3,
    'Latihan Fisik': 4
  };

  const CATEGORY_ICONS: Record<string, string> = {
    'Rutinitas': 'solar:target-bold',
    'Ketenangan Diri': 'solar:ghost-bold',
    'Evolusi Diri': 'solar:library-bold',
    'Latihan Fisik': 'solar:dumbell-bold'
  };

  const renderDisplay = (items: any[], type: string) => {
    const categories = Array.from(new Set(items.map(h => h.category)))
      .sort((a, b) => (CAT_PRIORITY[a] || 99) - (CAT_PRIORITY[b] || 99));

    return (
      <motion.div
        key={type}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full space-y-8"
      >
        {items.length > 0 && type === 'berjalan' && (
          <div className="mt-0 mb-4 flex items-center justify-center gap-3 px-6 h-[48px] rounded-[18px] bg-[#00FF85] border-[1.5px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] w-full">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="text-lg inline-block" style={{ filter: 'brightness(0)' }}>👆🏻</span>
              <svg className="absolute -top-1.5 -left-1 w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M12 6V9M8 8L10 10M16 8L14 10" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-black text-[12px] font-['Outfit'] font-black tracking-tight whitespace-nowrap">Ketuk 2x untuk menyelesaikan tugas</p>
          </div>
        )}

        {items.length > 0 ? (
          categories.map((cat) => {
            const catItems = items.filter(h => h.category === cat);
            if (catItems.length === 0) return null;

            return (
              <div key={cat as string} className="space-y-4">
                {/* Minimalist Subheader */}
                <div className="flex items-center gap-2 px-1 opacity-40 mb-2">
                  <Icon icon={CATEGORY_ICONS[cat as string] || 'solar:tag-bold'} width={14} height={14} className="text-[#E3DAC9]" />
                  <span className="text-[10px] font-black tracking-tight font-['Outfit'] text-[#E3DAC9]">{cat as string}</span>
                  <div className="flex-1 h-[1px] bg-white/5 ml-2" />
                </div>
                
                <div className="space-y-6">
                  {catItems.map((habit, i) => (
                    <KartuTugas key={habit.id} habit={habit} index={i} activeFilter={type} onDoubleTap={handleDoubleTap} onEdit={onEdit} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-24 opacity-20">
             <Icon icon="solar:box-minimalistic-bold" width={48} height={48} />
             <p className="mt-4 font-black text-[11px] tracking-tight whitespace-nowrap">
               {type === 'selesai' ? 'Belum ada tugas yang tuntas' : 
                type === 'dilewati' ? 'Belum ada tugas yang dilewati' : 
                'Belum ada tugas hari ini'}
             </p>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="pt-0 px-5 pb-36 min-h-screen overflow-x-hidden relative">
      <AnimatePresence mode="wait">
        {activeFilter === 'berjalan' ? renderDisplay(todoHabits, 'berjalan') : 
         activeFilter === 'selesai' ? renderDisplay(completedHabits, 'selesai') :
         renderDisplay(skippedHabits, 'dilewati')}
      </AnimatePresence>
    </div>
  );
};

export default DaftarHabit;
