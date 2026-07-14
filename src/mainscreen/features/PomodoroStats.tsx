import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { usePomodoroStore } from './stores/usePomodoroStore';
import { useTranslation } from '../../i18n';

interface PomodoroStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PomodoroStats({ isOpen, onClose }: PomodoroStatsProps) {
  const { getTodaySessions, getTodayFocusMinutes, getWeekFocusMinutes, getStreak, getTotalFocusMinutes } = usePomodoroStore();
  const { t } = useTranslation();
  const isLight = !document.documentElement.classList.contains('dark');

  const todaySessions = getTodaySessions().length;
  const todayMinutes = getTodayFocusMinutes();
  const weekMinutes = getWeekFocusMinutes();
  const streak = getStreak();
  const totalHours = Math.floor(getTotalFocusMinutes() / 60);

  const digitalFont = '"Chivo", sans-serif';

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
                {t('features.pomodoro.statsTitle')}
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
                label={t('features.pomodoro.today')}
                value={`${todayMinutes}`}
                unit={t('units.Menit').toLowerCase()}
                fontFamily={digitalFont}
              />
              <StatCard
                label={t('features.pomodoro.todaySessions')}
                value={`${todaySessions}`}
                unit={t('units.Sesi').toLowerCase()}
                fontFamily={digitalFont}
              />
              <StatCard
                label={t('features.pomodoro.thisWeek')}
                value={`${weekMinutes}`}
                unit={t('units.Menit').toLowerCase()}
                fontFamily={digitalFont}
              />
              <StatCard
                label={t('features.pomodoro.streak')}
                value={`${streak}`}
                unit={t('features.pomodoro.days')}
                fontFamily={digitalFont}
              />
            </div>

            {/* Total Focus */}
            <div className={`mt-4 p-4 border rounded-xl text-center transition-all ${
              isLight
                ? 'bg-white border-black/12 shadow-sm text-black'
                : 'bg-white/5 border border-white/10 text-white'
            }`}>
              <p className={`text-[9.5px] font-bold font-space uppercase tracking-wider mb-1.5 ${
                isLight ? 'text-black/50' : 'text-white/50'
              }`}>
                {t('features.pomodoro.totalFocus')}
              </p>
              
              <div className="text-[15px] font-bold leading-none">
                <span 
                  style={{ fontFamily: digitalFont }}
                  className={`text-[17px] ${isLight ? 'text-[#22543D]' : 'text-[#00FF85]'}`}
                >
                  {totalHours}
                </span>
                <span className={`text-[12px] font-medium font-space px-1 ${isLight ? 'text-black/60' : 'text-white/50'}`}>{t('features.pomodoro.hours')}</span>
                <span 
                  style={{ fontFamily: digitalFont }}
                  className={`text-[17px] ${isLight ? 'text-[#22543D]' : 'text-[#00FF85]'}`}
                >
                  {getTotalFocusMinutes() % 60}
                </span>
                <span className={`text-[12px] font-medium font-space px-1 ${isLight ? 'text-black/60' : 'text-white/50'}`}>{t('features.pomodoro.minutes')}</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatCard({ label, value, unit, fontFamily }: { label: string; value: string; unit: string; fontFamily: string }) {
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
          style={{ 
            fontFamily: fontFamily,
            color: isLight ? '#22543D' : '#00FF85'
          }}
          className="text-[28px] font-black leading-none"
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
