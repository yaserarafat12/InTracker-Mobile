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
            className="fixed top-16 right-5 left-5 z-[260] bg-[#1c1e22] border-[2px] border-[#00FF85]/40 rounded-2xl shadow-[6px_6px_0px_rgba(0,255,133,0.35)] p-5 overflow-hidden text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#00FF85] rounded-lg border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,0.65)] flex items-center justify-center">
                  <Icon icon="solar:chart-square-bold" className="text-black" width={16} />
                </div>
                <h3 className="text-[16px] font-black text-white font-['Outfit']">{t('features.pomodoro.statsTitle')}</h3>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-xl border-[2px] border-white/10 bg-[#2a2c32] flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                <Icon icon="ph:x-bold" className="text-white" width={14} />
              </motion.button>
            </div>

            {/* Stats Grid — neobrutalist cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label={t('features.pomodoro.today')}
                value={`${todayMinutes}`}
                unit={t('units.Menit').toLowerCase()}
                accent="#00FF85"
              />
              <StatCard
                label={t('features.pomodoro.todaySessions')}
                value={`${todaySessions}`}
                unit={t('units.Sesi').toLowerCase()}
                accent="#00FF85"
              />
              <StatCard
                label={t('features.pomodoro.thisWeek')}
                value={`${weekMinutes}`}
                unit={t('units.Menit').toLowerCase()}
                accent="#60A5FA"
              />
              <StatCard
                label={t('features.pomodoro.streak')}
                value={`${streak}`}
                unit={t('features.pomodoro.days')}
                accent="#FBBF24"
              />
            </div>

            {/* Total */}
            <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl text-center">
              <span className="text-[11px] text-white/40">{t('features.pomodoro.totalFocus')}</span>
              <span className="text-[13px] font-bold text-white">
                {totalHours} {t('features.pomodoro.hours')} {getTotalFocusMinutes() % 60} {t('features.pomodoro.minutes')}
              </span>
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
