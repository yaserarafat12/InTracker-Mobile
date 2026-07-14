import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useWorkoutStore } from './stores/useWorkoutStore';
import { useTranslation } from '../../i18n';

interface WorkoutStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkoutStats({ isOpen, onClose }: WorkoutStatsProps) {
  const { sessions } = useWorkoutStore();
  const { t } = useTranslation();
  const isLight = !document.documentElement.classList.contains('dark');

  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + mondayOffset);

  const weekSessions = sessions.filter((s) => new Date(s.completedAt) >= monday);
  const totalSessions = sessions.length;
  const weekDuration = weekSessions.reduce((sum, s) => sum + s.totalDurationSeconds, 0);
  const totalDuration = sessions.reduce((sum, s) => sum + s.totalDurationSeconds, 0);

  // Find favorite exercise
  const exerciseCounts: Record<string, number> = {};
  sessions.forEach((s) => {
    s.exercises.forEach((e) => {
      exerciseCounts[e.name] = (exerciseCounts[e.name] || 0) + 1;
    });
  });
  const favoriteExercise = Object.entries(exerciseCounts).sort((a, b) => b[1] - a[1])[0];

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
                {t('features.workout.statsTitle')}
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
                label={t('features.workout.thisWeek')}
                value={`${weekSessions.length}`}
                unit={t('units.Sesi').toLowerCase()}
              />
              <StatCard
                label={t('features.workout.weekDuration')}
                value={`${Math.floor(weekDuration / 60)}`}
                unit={t('units.Menit').toLowerCase()}
              />
              <StatCard
                label={t('features.workout.totalSessions')}
                value={`${totalSessions}`}
                unit={t('units.Sesi').toLowerCase()}
              />
              <StatCard
                label={t('features.workout.totalDuration')}
                value={`${Math.floor(totalDuration / 3600)}`}
                unit={t('units.Jam').toLowerCase()}
              />
            </div>

            {/* Favorite Exercise */}
            {favoriteExercise && (
              <div className={`mt-4 p-4 border rounded-xl flex items-center justify-between transition-all ${
                isLight
                  ? 'bg-white border-black/12 shadow-sm text-black'
                  : 'bg-white/5 border border-white/10 text-white'
              }`}>
                <div>
                  <span className={`text-[9.5px] font-bold font-space uppercase tracking-wider ${
                    isLight ? 'text-black/50' : 'text-white/50'
                  }`}>
                    {t('features.workout.favoriteExercise')}
                  </span>
                  <p className="text-[14px] font-bold mt-1">
                    {t(favoriteExercise[0])}
                  </p>
                </div>
                <span className={`text-[12px] font-bold font-space ${
                  isLight ? 'text-[#22543D]' : 'text-[#00FF85]'
                }`}>
                  {favoriteExercise[1]}x
                </span>
              </div>
            )}
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
