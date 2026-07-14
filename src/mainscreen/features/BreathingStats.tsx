import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useBreathingStore } from './stores/useBreathingStore';
import { useTranslation } from '../../i18n';

interface BreathingStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BreathingStats({ isOpen, onClose }: BreathingStatsProps) {
  const { sessions, getWeeklyProgress, getTodayDurationMinutes, getWeekDurationMinutes, getMonthDurationMinutes } = useBreathingStore();
  const { language } = useTranslation();
  const isLight = !document.documentElement.classList.contains('dark');

  const totalSessions = sessions.length;
  const todayMinutes = getTodayDurationMinutes();
  const weekMinutes = getWeekDurationMinutes();
  const monthMinutes = getMonthDurationMinutes();
  const weeklyProgress = getWeeklyProgress();

  const isIndonesian = language === 'Bahasa Indonesia';
  const dayLabels = isIndonesian 
    ? ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const statsTitle = isIndonesian ? 'Statistik Pernapasan' : 'Breathing Stats';
  const todayLabel = isIndonesian ? 'Hari Ini' : 'Today';
  const weekLabel = isIndonesian ? 'Minggu Ini' : 'This Week';
  const monthLabel = isIndonesian ? 'Bulan Ini' : 'This Month';
  const totalSessionsLabel = isIndonesian ? 'Total Sesi' : 'Total Sessions';
  const sessionUnit = isIndonesian ? 'sesi' : 'sessions';
  const minutesUnit = isIndonesian ? 'menit' : 'mins';
  const dailyCheckLabel = isIndonesian ? 'Latihan Harian' : 'Daily Check';

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
            className={`fixed top-20 right-5 left-5 z-[260] border rounded-2xl p-5 overflow-hidden transition-all ${
              isLight
                ? 'bg-[#f2faf5] border-black/12 text-black shadow-lg'
                : 'bg-[#1c1e22] border-white/10 text-white'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-[16px] font-black font-['Outfit'] ${isLight ? 'text-black' : 'text-white'}`}>
                {statsTitle}
              </h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                  isLight
                    ? 'border-black/12 bg-white text-black shadow-sm'
                    : 'border-white/10 bg-[#2a2c32] text-white shadow-none'
                }`}
              >
                <Icon icon="ph:x-bold" width={14} />
              </motion.button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label={todayLabel}
                value={`${todayMinutes}`}
                unit={minutesUnit}
              />
              <StatCard
                label={weekLabel}
                value={`${weekMinutes}`}
                unit={minutesUnit}
              />
              <StatCard
                label={monthLabel}
                value={`${monthMinutes}`}
                unit={minutesUnit}
              />
              <StatCard
                label={totalSessionsLabel}
                value={`${totalSessions}`}
                unit={sessionUnit}
              />
            </div>

            {/* Weekly Progress (Daily Check) */}
            <div className={`mt-5 p-4 rounded-xl border transition-all ${
              isLight
                ? 'bg-white border-black/12 shadow-sm'
                : 'bg-white/[0.02] border-white/10'
            }`}>
              <h4 className={`text-[10px] font-bold font-space uppercase tracking-wider mb-3 ${
                isLight ? 'text-black/50' : 'text-white/50'
              }`}>{dailyCheckLabel}</h4>
              <div className="flex justify-between gap-1">
                {dayLabels.map((label, i) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 flex-1">
                    <span className={`text-[9px] font-bold font-space ${
                      isLight ? 'text-black/40' : 'text-white/40'
                    }`}>{label}</span>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
                        weeklyProgress[i]
                          ? isLight
                            ? 'bg-[#E6FFFA] border-[#81E6D9] text-[#00C265]'
                            : 'bg-teal-500/20 border-teal-500/40 text-teal-400 shadow-none'
                          : isLight
                            ? 'bg-neutral-50 border-black/10 text-neutral-300'
                            : 'bg-white/5 border-transparent text-white/10 shadow-none'
                      }`}
                    >
                      {weeklyProgress[i] && (
                        <Icon icon="ph:check-bold" width={12} className={isLight ? 'text-[#00C265]' : 'text-teal-400'} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  const isLight = !document.documentElement.classList.contains('dark');
  return (
    <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
      isLight
        ? 'bg-white border-black/12 shadow-sm'
        : 'bg-white/[0.02] border-white/10'
    }`}>
      <p className={`text-[9.5px] font-bold font-space uppercase tracking-wider mb-2 ${
        isLight ? 'text-black/50' : 'text-white/40'
      }`}>{label}</p>
      <div className="flex items-baseline gap-1">
        <span 
          style={{ fontFamily: '"Chivo", sans-serif' }}
          className={`text-[28px] font-black leading-none ${
            isLight ? 'text-[#22543D]' : 'text-[#00FF85]'
          }`}
        >
          {value}
        </span>
        <span className={`text-[11px] font-medium font-space ${
          isLight ? 'text-black/50' : 'text-white/40'
        }`}>{unit}</span>
      </div>
    </div>
  );
}
