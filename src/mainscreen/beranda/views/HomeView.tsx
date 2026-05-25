import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useHabitStore } from '../../../store/useHabitStore';
import { useTargetStore } from '../../../store/useTargetStore';
import { useUserStore } from '../../../store/useUserStore';
import type { Quote } from '../../../data/quotes';
import { getPrismStyle } from '../../../utils/design';
import { GreetingHeader } from '../GreetingHeader';
import { DiagonalProgressCard } from '../components/DiagonalProgressCard';
import { DelayedTasksModal } from '../components/DelayedTasksModal';

interface HomeViewProps {
  onTabChange: (tab: string, filter?: string) => void;
  quote: Quote | null;
}

export const HomeView = ({ onTabChange, quote }: HomeViewProps) => {
  const [showInsight, setShowInsight] = useState(false);
  const [showDelayedModal, setShowDelayedModal] = useState(false);
  
  const { targets, fetchTargets } = useTargetStore();
  const { habits, fetchHabits } = useHabitStore();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { profile, fetchProfile } = useUserStore(); 

  const { completedTodayCount, todayTotalCount, uncompletedDelayedCount } = useMemo(() => {
    const safeTargets = targets || [];
    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayItems = safeTargets.filter(t => {
      if (t.window !== 'today') return false;
      if (!t.completed) return true;
      if (!t.completedAt) return false;
      const completedDate = new Date(t.completedAt).toLocaleDateString('en-CA');
      return completedDate === todayStr;
    });
    const completedToday = todayItems.filter(t => t.completed).length;
    const uncompletedDelayed = safeTargets.filter(t => t.window === 'delayed' && !t.completed).length;
    return { completedTodayCount: completedToday, todayTotalCount: todayItems.length, uncompletedDelayedCount: uncompletedDelayed };
  }, [targets]);

  const { completedHabits, totalHabits } = useMemo(() => {
    const safeHabits = habits || [];
    const completed = safeHabits.filter(h => h.completed).length;
    return { completedHabits: completed, totalHabits: safeHabits.length };
  }, [habits]);

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA');
    const lastDismissed = localStorage.getItem('last_dismissed_delayed_tasks');
    
    if (lastDismissed !== today && uncompletedDelayedCount > 0) {
      const timer = setTimeout(() => setShowDelayedModal(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [uncompletedDelayedCount]);

  const handleDismissDelayed = () => {
    const today = new Date().toLocaleDateString('en-CA');
    localStorage.setItem('last_dismissed_delayed_tasks', today);
    setShowDelayedModal(false);
  };

  const handleCheckDelayed = () => {
    const today = new Date().toLocaleDateString('en-CA');
    localStorage.setItem('last_dismissed_delayed_tasks', today);
    setShowDelayedModal(false);
    onTabChange('todo', 'delayed');
  };

  return (
    <div className="px-6 pt-3 pb-24 space-y-12">
      {/* 1. GREETING */}
      <GreetingHeader />

      {/* 2. DAILY QUOTES */}
      <div className="relative w-full group">
        <div className="absolute -top-3 left-0 z-40 px-4 py-1 bg-[#00FF85] border-[1px] border-black rounded-[8px] shadow-[3px_3px_0px_rgba(0,0,0,1)] flex items-center justify-center">
          <span className="text-[12px] font-black text-black tracking-[0.05em] font-['Outfit']">
            SOUL INSIGHT
          </span>
        </div>

        <motion.div 
          whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
          onClick={() => setShowInsight(true)}
          className="relative w-full rounded-[28px] border-[1.5px] border-[#E3DAC9]/30 overflow-hidden shadow-[6px_6px_0px_rgba(0,0,0,1)] cursor-pointer transition-shadow duration-200 mt-4"
        >
          <div className="absolute inset-0 bg-[#1A1A1A] z-0" />
          <div 
            className="absolute inset-0 z-10 opacity-[0.22]"
            style={getPrismStyle(quote?.text || 'daily-quote')}
          />
          <div className="absolute inset-0 z-20 bg-black/25" />
          <div className="absolute inset-0 z-20 bg-white/[0.03]" />
          
          <div className="relative z-30 px-7 py-8 min-h-[115px] flex flex-col justify-center items-start text-left w-full">
            {quote ? (
              <p className="text-[17px] font-semibold font-['Outfit'] text-[#E3DAC9] leading-relaxed text-left w-full opacity-90">
                {quote?.text?.replace(/"/g, '') || ''}
              </p>
            ) : (
              <div className="h-6 w-3/4 bg-white/5 animate-pulse rounded-md" />
            )}
          </div>
        </motion.div>
      </div>

      {/* 3. PROGRESS SECTION */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-8">
          <DiagonalProgressCard 
            title="List Habit Hari Ini" 
            icon="solar:checklist-minimalistic-bold" 
            current={completedHabits} 
            total={totalHabits} 
            label="Habit"
            description="Jaga Streak!"
          />
          <DiagonalProgressCard 
            title="List To-Do Hari Ini" 
            icon="solar:target-bold" 
            current={completedTodayCount} 
            total={todayTotalCount} 
            label="Tugas"
            description={completedTodayCount === todayTotalCount && todayTotalCount > 0 ? "Fokus Tuntas!" : "Lanjut Gas!"}
          />
        </div>
      </div>

      {/* DELAYED TASKS MODAL */}
      <AnimatePresence>
        {showDelayedModal && (
          <DelayedTasksModal
            count={uncompletedDelayedCount}
            onCheck={handleCheckDelayed}
            onDismiss={handleDismissDelayed}
          />
        )}
      </AnimatePresence>

      {/* QUOTE INSIGHT MODAL */}
      <AnimatePresence>
        {showInsight && quote && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInsight(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm border-[1.5px] border-[#E3DAC9]/20 rounded-[24px] p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-[#1A1A1A] z-0" />
              <div 
                className="absolute inset-0 z-10 opacity-35"
                style={getPrismStyle(quote?.text || 'daily-quote')}
              />
              <div className="absolute inset-0 z-20 bg-black/50" />

              <div className="relative z-30 flex flex-col">
                <p className="text-[16px] font-medium font-['Outfit'] text-white/40 leading-relaxed mb-8 text-left w-full">
                  {quote?.text?.replace(/"/g, '') || ''}
                </p>

                <div className="flex items-center gap-4 mb-10">
                  <div className="h-[1px] bg-white/10 flex-1" />
                  <div className="w-2 h-2 rounded-full bg-[#00FF85] shadow-[0_0_12px_#00FF85]" />
                  <div className="h-[1px] bg-white/10 flex-1" />
                </div>

                <p className="text-[16px] font-medium font-['Outfit'] text-[#E3DAC9]/90 leading-relaxed mb-16 text-left w-full">
                  {quote.explanation}
                </p>

                <motion.button
                  whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(20);
                    setShowInsight(false);
                  }}
                  className="w-full py-5 bg-[#00FF85] text-black font-black font-['Outfit'] text-[14px] rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] border-[2.5px] border-black uppercase tracking-[0.2em]"
                >
                  TUTUP
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
