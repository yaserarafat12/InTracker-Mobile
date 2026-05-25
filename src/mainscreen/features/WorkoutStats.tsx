import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useWorkoutStore } from './stores/useWorkoutStore';

interface WorkoutStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WorkoutStats({ isOpen, onClose }: WorkoutStatsProps) {
  const { sessions } = useWorkoutStore();

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
            className="fixed top-16 right-5 left-5 z-[260] bg-[#1a1c20] border-[2px] border-white/20 rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,1)] p-5 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#FF6B35] rounded-lg border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                  <Icon icon="ph:chart-bar-bold" className="text-black" width={16} />
                </div>
                <h3 className="text-[16px] font-black text-white font-['Outfit']">Statistik Workout</h3>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center"
              >
                <Icon icon="ph:x-bold" className="text-white/60" width={14} />
              </motion.button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Minggu Ini"
                value={`${weekSessions.length}`}
                unit="sesi"
                accent="#00FF85"
              />
              <StatCard
                label="Durasi Minggu"
                value={`${Math.floor(weekDuration / 60)}`}
                unit="menit"
                accent="#60A5FA"
              />
              <StatCard
                label="Total Sesi"
                value={`${totalSessions}`}
                unit="sesi"
                accent="#FBBF24"
              />
              <StatCard
                label="Total Durasi"
                value={`${Math.floor(totalDuration / 3600)}`}
                unit="jam"
                accent="#F472B6"
              />
            </div>

            {/* Favorite Exercise */}
            {favoriteExercise && (
              <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-white/40">Latihan Favorit</span>
                  <p className="text-[14px] font-bold text-white">{favoriteExercise[0]}</p>
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
