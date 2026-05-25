import { useEffect } from 'react';
import { useHabitStore } from '../store/useHabitStore';
import { StreakRecoveryModal } from '../mainscreen/beranda/components/StreakRecoveryModal';

/**
 * Shortcut page: /losestreak
 * Langsung trigger StreakRecoveryModal untuk testing/editing.
 * Kalau belum ada brokenStreaks, auto-inject dari habit pertama.
 */
const LoseStreak = () => {
  const { habits, brokenStreaks } = useHabitStore();

  useEffect(() => {
    // Auto-inject broken streak jika belum ada
    if (brokenStreaks.length === 0 && habits.length > 0) {
      const targetHabit = habits[0];
      useHabitStore.setState(state => ({
        brokenStreaks: [{
          habitId: targetHabit.id,
          lastDate: new Date().toLocaleDateString('en-CA'),
          daysMissing: 1,
        }, ...state.brokenStreaks]
      }));
    }
  }, [habits, brokenStreaks]);

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
      <StreakRecoveryModal />
      {brokenStreaks.length === 0 && habits.length === 0 && (
        <p className="text-[#E3DAC9]/40 font-black font-['Outfit'] text-sm uppercase tracking-widest">
          Loading habits...
        </p>
      )}
    </div>
  );
};

export default LoseStreak;
