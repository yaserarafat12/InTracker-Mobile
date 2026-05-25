import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { usePomodoroStore } from './stores/usePomodoroStore';

interface PomodoroStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PomodoroStats({ isOpen, onClose }: PomodoroStatsProps) {
  const { getTodaySessions, getTodayFocusMinutes, getWeekFocusMinutes, getStreak, getTotalFocusMinutes } = usePomodoroStore();

  const todaySessions = getTodaySessions().length;
  const todayMinutes = getTodayFocusMinutes();
  const weekMinutes = getWeekFocusMinutes();
  const streak = getStreak();
  const totalHours = Math.floor(getTotalFocusMinutes() / 60);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[250]"
          />
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-16 right-5 left-5 z-[260] bg-[#1a1c20] border-[2px] border-white/20 rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,1)] p-5 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#00FF85] rounded-lg border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                  <Icon icon="ph:chart-bar-bold" className="text-black" width={16} />
                </div>
                <h3 className="text-[16px] font-black text-white font-['Outfit']">Statistik Fokus</h3>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center"
              >
                <Icon icon="ph:x-bold" className="text-white/60" width={14} />
              </motion.button>
            </div>

            {/* Stats Grid — neobrutalist cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Hari Ini"
                value={`${todayMinutes}`}
                unit="menit"
                accent="#00FF85"
              />
              <StatCard
                label="Sesi Hari Ini"
                value={`${todaySessions}`}
                unit="sesi"
                accent="#00FF85"
              />
              <StatCard
                label="Minggu Ini"
                value={`${weekMinutes}`}
                unit="menit"
                accent="#60A5FA"
              />
              <StatCard
                label="Streak"
                value={`${streak}`}
                unit="hari"
                accent="#FBBF24"
              />
            </div>

            {/* Total */}
            <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl text-center">
              <span className="text-[11px] text-white/40">Total fokus: </span>
              <span className="text-[13px] font-bold text-white">{totalHours} jam {getTotalFocusMinutes() % 60} menit</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatCard({ label, value, unit, accent }: { label: string; value: string; unit: string; accent: string }) {
  return (
    <div
      className="p-3 rounded-xl border-[2px] border-white/10 shadow-[3px_3px_0px_rgba(0,0,0,0.8)]"
      style={{ background: `${accent}08` }}
    >
      <p className="text-[10px] text-white/40 font-medium uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-[28px] font-black font-['Outfit'] leading-none" style={{ color: accent }}>
          {value}
        </span>
        <span className="text-[11px] text-white/40">{unit}</span>
      </div>
    </div>
  );
}
