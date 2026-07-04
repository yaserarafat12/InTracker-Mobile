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
            className="fixed top-16 right-5 left-5 z-[260] bg-[#1c1e22] border-[2px] border-[#FF6B35]/40 rounded-2xl shadow-[6px_6px_0px_rgba(255,107,53,0.35)] p-5 overflow-hidden text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#FF6B35] rounded-lg border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,0.65)] flex items-center justify-center">
                  <Icon icon="solar:chart-square-bold" className="text-black" width={16} />
                </div>
                <h3 className="text-[16px] font-black text-white font-['Outfit']">{t('features.workout.statsTitle')}</h3>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-xl border-[2px] border-white/10 bg-[#2a2c32] flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                <Icon icon="ph:x-bold" className="text-white" width={14} />
              </motion.button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label={t('features.workout.thisWeek')}
                value={`${weekSessions.length}`}
                unit={t('units.Sesi').toLowerCase()}
                accent="#00FF85"
              />
              <StatCard
                label={t('features.workout.weekDuration')}
                value={`${Math.floor(weekDuration / 60)}`}
                unit={t('units.Menit').toLowerCase()}
                accent="#60A5FA"
              />
              <StatCard
                label={t('features.workout.totalSessions')}
                value={`${totalSessions}`}
                unit={t('units.Sesi').toLowerCase()}
                accent="#FBBF24"
              />
              <StatCard
                label={t('features.workout.totalDuration')}
                value={`${Math.floor(totalDuration / 3600)}`}
                unit={t('units.Jam').toLowerCase()}
                accent="#F472B6"
              />
            </div>

            {favoriteExercise && (
              <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-white/40">{t('features.workout.favoriteExercise')}</span>
                  <p className="text-[14px] font-bold text-white">
                    {(() => {
                      const translated = t(`presets.${favoriteExercise[0]}`);
                      return translated === `presets.${favoriteExercise[0]}` ? favoriteExercise[0] : translated;
                    })()}
                  </p>
                </div>
                <span className="text-[12px] text-[#00FF85] font-bold">{favoriteExercise[1]}x</span>
              </div>
            )}
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
