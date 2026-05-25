import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useFoodLogStore } from '../../../store/useFoodLogStore';

// --- Helpers ---

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toLocaleDateString('en-CA');
  if (dateStr === todayStr) return 'Today';

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toLocaleDateString('en-CA')) return 'Yesterday';

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === tomorrow.toLocaleDateString('en-CA')) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-CA');
}

// --- Component ---

export function DateNavigator() {
  const { selectedDate, setSelectedDate } = useFoodLogStore();

  const { canGoBack, canGoForward } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate + 'T00:00:00');

    const diffMs = selected.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return {
      canGoBack: diffDays > -90,
      canGoForward: diffDays < 7,
    };
  }, [selectedDate]);

  return (
    <div className="flex items-center justify-between">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setSelectedDate(addDays(selectedDate, -1))}
        disabled={!canGoBack}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          canGoBack
            ? 'bg-[#2a2c32] border border-white/10 text-[#E3DAC9]/80'
            : 'bg-[#2a2c32]/50 border border-white/5 text-white/20'
        }`}
        aria-label="Previous day"
      >
        <Icon icon="ph:caret-left-bold" width={16} />
      </motion.button>

      <span className="text-[14px] font-bold font-['Outfit'] text-[#E3DAC9]">
        {formatDisplayDate(selectedDate)}
      </span>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
        disabled={!canGoForward}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          canGoForward
            ? 'bg-[#2a2c32] border border-white/10 text-[#E3DAC9]/80'
            : 'bg-[#2a2c32]/50 border border-white/5 text-white/20'
        }`}
        aria-label="Next day"
      >
        <Icon icon="ph:caret-right-bold" width={16} />
      </motion.button>
    </div>
  );
}
