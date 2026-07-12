import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useCountdownTimer } from './hooks/useCountdownTimer';
import { useWorkoutStore, type WorkoutSession } from './stores/useWorkoutStore';
import { useProgressionStore } from '../../store/useProgressionStore';
import { WorkoutStats } from './WorkoutStats';
import { useTranslation } from '../../i18n';

interface ExerciseDefinition {
  name: string;
  type: 'reps' | 'duration' | 'distance';
  fields: string[];
}

const EXERCISES: ExerciseDefinition[] = [
  { name: 'Push-Up', type: 'reps', fields: ['reps', 'sets'] },
  { name: 'Sit-Up', type: 'reps', fields: ['reps', 'sets'] },
  { name: 'Plank', type: 'duration', fields: ['timeSeconds', 'sets'] },
  { name: 'Lari', type: 'distance', fields: ['timeSeconds'] },
  { name: 'Yoga', type: 'duration', fields: ['timeSeconds'] },
  { name: 'Stretching', type: 'duration', fields: ['timeSeconds'] },
  { name: 'Lompat Tali', type: 'reps', fields: ['reps', 'timeSeconds', 'sets'] },
  { name: 'Squat', type: 'reps', fields: ['reps', 'sets'] },
  { name: 'Burpee', type: 'reps', fields: ['reps', 'sets'] },
];

type WorkoutView = 'menu' | 'configure' | 'active' | 'history';

interface ExerciseConfig {
  name: string;
  type: 'reps' | 'duration' | 'distance';
  reps: number;
  timeSeconds: number;
  sets: number;
}

interface WorkoutCounterProps {
  onBack: () => void;
}

export function WorkoutCounter({ onBack }: WorkoutCounterProps) {
  const { t, language } = useTranslation();
  const isLight = !document.documentElement.classList.contains('dark');
  const [view, setView] = useState<WorkoutView>('menu');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [configs, setConfigs] = useState<Record<string, ExerciseConfig>>({});
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [sessionStartTime, setSessionStartTime] = useState(0);
  const [showStats, setShowStats] = useState(false);

  const { sessions, addSession, getWeeklyProgress } = useWorkoutStore();
  const weeklyProgress = getWeeklyProgress();

  const activeExercises = selectedExercises.map((name) => configs[name]).filter(Boolean);
  const currentExercise = activeExercises[currentExerciseIndex];

  const timerRef = useRef<ReturnType<typeof useCountdownTimer> | null>(null);

  const handleExerciseComplete = useCallback(() => {
    if (!currentExercise) return;

    const hasSets = currentExercise.type === 'reps' || (currentExercise.type === 'duration' && currentExercise.sets > 1);

    if (hasSets && currentSet < currentExercise.sets) {
      // Next set
      setCurrentSet((prev) => prev + 1);
      timerRef.current?.reset();
      setTimeout(() => timerRef.current?.start(), 500);
    } else if (currentExerciseIndex < activeExercises.length - 1) {
      // Next exercise
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentSet(1);
      timerRef.current?.reset();
      setTimeout(() => timerRef.current?.start(), 500);
    } else {
      // All done!
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      useProgressionStore.getState().awardFeedInteraction();

      const session: WorkoutSession = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('en-CA'),
        exercises: activeExercises.map((e) => ({
          name: e.name,
          reps: e.reps,
          timeSeconds: e.timeSeconds,
          sets: e.sets,
        })),
        totalDurationSeconds: Math.floor((Date.now() - sessionStartTime) / 1000),
        completedAt: new Date().toISOString(),
      };
      addSession(session);
      setView('menu');
    }
  }, [currentExercise, currentSet, currentExerciseIndex, activeExercises, sessionStartTime, addSession]);

  const timer = useCountdownTimer({
    initialSeconds: currentExercise?.timeSeconds || 30,
    onComplete: handleExerciseComplete,
  });

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  const getExerciseDef = (name: string): ExerciseDefinition | undefined => {
    return EXERCISES.find((e) => e.name === name);
  };

  const toggleExercise = (name: string) => {
    const def = getExerciseDef(name);
    if (!def) return;

    if (selectedExercises.includes(name)) {
      setSelectedExercises((prev) => prev.filter((e) => e !== name));
      setConfigs((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    } else {
      setSelectedExercises((prev) => [...prev, name]);
      const defaultConfig: ExerciseConfig = {
        name,
        type: def.type,
        reps: def.type === 'reps' ? 10 : 0,
        timeSeconds: def.type === 'reps' && !def.fields.includes('timeSeconds') ? 30 : 60,
        sets: def.fields.includes('sets') ? 3 : 1,
      };
      setConfigs((prev) => ({ ...prev, [name]: defaultConfig }));
    }
  };

  const updateConfig = (name: string, field: keyof ExerciseConfig, value: number) => {
    setConfigs((prev) => ({
      ...prev,
      [name]: { ...prev[name], [field]: value },
    }));
  };

  const canStart = selectedExercises.length > 0 &&
    selectedExercises.every((name) => {
      const c = configs[name];
      if (!c) return false;
      if (c.type === 'reps') return c.reps >= 1 && c.sets >= 1;
      if (c.type === 'duration' || c.type === 'distance') return c.timeSeconds >= 5;
      return true;
    });

  const startWorkout = () => {
    setCurrentExerciseIndex(0);
    setCurrentSet(1);
    setSessionStartTime(Date.now());
    setView('active');
    setTimeout(() => timer.start(), 300);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const dayLabels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const renderConfigFields = (name: string, config: ExerciseConfig) => {
    const def = getExerciseDef(name);
    if (!def) return null;

    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="flex gap-2 px-2"
      >
        {def.fields.includes('reps') && (
          <div className="flex-1">
            <label className={`text-[10px] block mb-1 font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>Reps</label>
            <input
              type="number"
              min={1}
              value={config.reps}
              onChange={(e) => updateConfig(name, 'reps', Math.max(1, parseInt(e.target.value) || 1))}
              className={`w-full py-2 px-3 border rounded-lg text-[13px] text-center transition-all ${
                isLight
                  ? 'bg-white border-black text-black'
                  : 'bg-black/40 backdrop-blur-sm border-white/10 text-white'
              }`}
            />
          </div>
        )}
        {def.fields.includes('timeSeconds') && (
          <div className="flex-1">
            <label className={`text-[10px] block mb-1 font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>
              {def.type === 'reps' ? 'Detik/set' : 'Menit'}
            </label>
            <input
              type="number"
              min={def.type === 'reps' ? 5 : 1}
              value={def.type === 'reps' ? config.timeSeconds : Math.round(config.timeSeconds / 60)}
              onChange={(e) => {
                const val = parseInt(e.target.value) || (def.type === 'reps' ? 5 : 1);
                const seconds = def.type === 'reps' ? Math.max(5, val) : Math.max(1, val) * 60;
                updateConfig(name, 'timeSeconds', seconds);
              }}
              className={`w-full py-2 px-3 border rounded-lg text-[13px] text-center transition-all ${
                isLight
                  ? 'bg-white border-black text-black'
                  : 'bg-black/40 backdrop-blur-sm border-white/10 text-white'
              }`}
            />
          </div>
        )}
        {def.fields.includes('sets') && (
          <div className="flex-1">
            <label className={`text-[10px] block mb-1 font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>Sets</label>
            <input
              type="number"
              min={1}
              value={config.sets}
              onChange={(e) => updateConfig(name, 'sets', Math.max(1, parseInt(e.target.value) || 1))}
              className={`w-full py-2 px-3 border rounded-lg text-[13px] text-center transition-all ${
                isLight
                  ? 'bg-white border-black text-black'
                  : 'bg-black/40 backdrop-blur-sm border-white/10 text-white'
              }`}
            />
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={`fixed inset-0 flex flex-col px-6 py-8 pb-10 z-[200] overflow-hidden transition-all ${
      isLight ? 'bg-[#f0fdf4] text-black' : 'bg-[#16181c] text-white'
    }`}>
      {/* Background image */}
      {isLight ? (
        <img src="/all_images/antigravitybg/wo_bg.png" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_75%] z-0" />
      ) : (
        <>
          <img src="/all_images/features_bg/workout_bg.png" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_75%] z-0" />
          <div className="absolute inset-0 bg-black/45 z-[1]" />
        </>
      )}

      {/* All content above overlay */}
      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto scrollbar-hide">
        {/* Back button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (view === 'configure' || view === 'history') setView('menu');
            else if (view === 'active') {
              timer.stop();
              setView('menu');
            } else onBack();
          }}
          className={`absolute top-0 left-0 w-10 h-10 rounded-xl border-[2px] flex items-center justify-center z-20 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
            isLight
              ? 'border-black bg-white shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
              : 'border-white/10 bg-[#2a2c32] shadow-none'
          }`}
        >
          <Icon icon="ph:arrow-left-bold" className={isLight ? 'text-black' : 'text-white'} width={18} />
        </motion.button>

        {/* Stats button — top right */}
        <motion.button
          whileTap={{ scale: 0.9, x: 2, y: 2, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
          onClick={() => setShowStats(true)}
          className={`absolute top-0 right-0 w-10 h-10 rounded-lg flex items-center justify-center z-20 border-[2px] transition-all bg-[#FF6B35] ${
            isLight
              ? 'border-black shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
              : 'border-transparent shadow-none'
          }`}
        >
          <Icon icon="solar:chart-square-bold" className="text-black" width={20} />
        </motion.button>

        {/* Stats Panel */}
        <WorkoutStats isOpen={showStats} onClose={() => setShowStats(false)} />

        {/* Title */}
        <div className="mt-12 text-center mb-6">
          <h1 className={`text-[24px] font-black font-['Outfit'] ${isLight ? 'text-black' : 'text-white'}`}>{t('features.workout.counterTitle')}</h1>
          <p className={`text-[13px] mt-1 font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>{t('features.workout.counterSubtitle')}</p>
        </div>

        {/* Weekly Progress Grid — moved to bottom area */}
        {view === 'menu' && (
          <div className="flex-1 flex flex-col justify-end">
            <div className="flex justify-center gap-2 mb-6">
              {dayLabels.map((label, i) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>{label}</span>
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                      weeklyProgress[i]
                        ? isLight
                          ? 'bg-[#00FF85] border-[2px] border-black text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                          : 'bg-[#00FF85]/20 border-[#00FF85]/30 text-[#00FF85]'
                        : isLight
                          ? 'bg-white border-[2px] border-black/25 text-black/10 shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.05)]'
                          : 'bg-white/5 border-transparent'
                    }`}
                  >
                    {weeklyProgress[i] && (
                      <Icon icon="ph:check-bold" width={14} className={isLight ? 'text-black font-black' : 'text-[#00FF85]'} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
        {/* MENU VIEW */}
        {view === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('configure')}
              className={`w-full py-4 font-black rounded-xl text-[15px] border uppercase tracking-wide transition-all ${
                isLight
                  ? 'bg-[#00FF85] text-black border-black shadow-[3.5px_3.5px_0px_rgba(0,0,0,1)]'
                  : 'bg-[#00FF85] text-black border-transparent'
              }`}
            >
              {t('features.workout.startNewSession')}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setView('history')}
              className={`w-full py-4 font-bold rounded-xl text-[15px] border transition-all ${
                isLight
                  ? 'bg-white text-black border-black shadow-[3.5px_3.5px_0px_rgba(0,0,0,0.65)]'
                  : 'bg-white/10 backdrop-blur-sm text-white/70 border border-white/10'
              }`}
            >
              {t('features.workout.allWorkouts')}
            </motion.button>
          </motion.div>
        )}

        {/* CONFIGURE VIEW */}
        {view === 'configure' && (
          <motion.div
            key="configure"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3 flex-1 overflow-y-auto"
          >
            <p className={`text-[13px] mb-2 font-bold ${isLight ? 'text-black/60' : 'text-white/50'}`}>{t('features.workout.selectExercises')}</p>
            {EXERCISES.map((exercise) => {
              const isSelected = selectedExercises.includes(exercise.name);
              const config = configs[exercise.name];
              return (
                <div key={exercise.name} className="space-y-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleExercise(exercise.name)}
                    className={`w-full py-3 px-4 rounded-xl text-left text-[14px] font-bold flex items-center justify-between transition-all ${
                      isSelected
                        ? isLight
                          ? 'bg-[#00FF85]/20 border-[2px] border-black text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                          : 'bg-[#00FF85]/15 border border-[#00FF85]/30 text-[#00FF85]'
                        : isLight
                          ? 'bg-white border-[2px] border-black/25 text-black shadow-[2px_2px_0px_rgba(0,0,0,0.05)] hover:border-black/50'
                          : 'bg-black/50 border border-white/10 text-white/80'
                    }`}
                  >
                    <span>{t(exercise.name)}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold ${isSelected ? (isLight ? 'text-black/60' : 'text-[#00FF85]/80') : (isLight ? 'text-black/35' : 'text-white/30')}`}>
                        {exercise.type === 'reps' ? t('features.workout.typeReps') : exercise.type === 'duration' ? t('features.workout.typeDuration') : t('features.workout.typeDistance')}
                      </span>
                      {isSelected && <Icon icon="ph:check-bold" width={16} />}
                    </div>
                  </motion.button>

                  {/* Config inputs based on type */}
                  {isSelected && config && renderConfigFields(exercise.name, config)}
                </div>
              );
            })}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={startWorkout}
              disabled={!canStart}
              className={`mt-4 w-full py-4 rounded-xl text-[15px] font-black border transition-all uppercase tracking-wide ${
                canStart
                  ? isLight
                    ? 'bg-[#00FF85] text-black border-black shadow-[3.5px_3.5px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#00FF85] text-black border-transparent'
                  : isLight
                    ? 'bg-black/5 border-black/10 text-black/25 border-[2px] cursor-not-allowed'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              {t('features.workout.startWorkout')}
            </motion.button>
          </motion.div>
        )}

        {/* ACTIVE VIEW */}
        {view === 'active' && currentExercise && (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center flex-1 gap-6"
          >
            {/* Exercise name */}
            <div className="text-center">
              <p className={`text-[13px] mb-1 font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>
                {t('features.workout.exerciseLabel')} {currentExerciseIndex + 1}/{activeExercises.length}
              </p>
              <h2 className={`text-[28px] font-black ${isLight ? 'text-black' : 'text-white'}`}>{t(currentExercise.name)}</h2>
              {currentExercise.sets > 1 && (
                <p className={`text-[15px] font-black mt-2 ${isLight ? 'text-black' : 'text-[#00FF85]'}`}>
                  {t('features.workout.setLabel')} {currentSet}/{currentExercise.sets}
                </p>
              )}
            </div>

            {/* Timer */}
            <div className="relative">
              {!isLight && <div className="absolute inset-0 rounded-full blur-[40px] opacity-20 bg-[#00FF85]" />}
              <span className={`relative text-[56px] font-black font-['Outfit'] tabular-nums ${isLight ? 'text-black' : 'text-white'}`}>
                {formatTime(timer.remaining)}
              </span>
            </div>

            {/* Info based on type */}
            {currentExercise.type === 'reps' && (
              <p className={`text-[14px] font-bold ${isLight ? 'text-black/60' : 'text-white/50'}`}>
                {t('features.workout.repsTarget').replace('{reps}', String(currentExercise.reps))}
              </p>
            )}
            {(currentExercise.type === 'duration' || currentExercise.type === 'distance') && (
              <p className={`text-[14px] font-bold ${isLight ? 'text-black/60' : 'text-white/50'}`}>
                {currentExercise.type === 'distance' ? t('features.workout.distanceRunDuration') : t('features.workout.holdFor')} {Math.round(currentExercise.timeSeconds / 60)} {t('features.workout.minutesUnit')}
              </p>
            )}

            {/* Progress bar */}
            <div className={`w-full h-3.5 rounded-full overflow-hidden border ${isLight ? 'bg-black/5 border-black' : 'bg-white/10 border-transparent'}`}>
              <motion.div
                className="h-full bg-[#00FF85] rounded-full"
                animate={{
                  width: `${((currentExerciseIndex * (currentExercise?.sets || 1) + currentSet) / (activeExercises.length * (currentExercise?.sets || 1))) * 100}%`,
                }}
              />
            </div>

            {/* Stop button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                timer.stop();
                setView('menu');
              }}
              className={`mt-4 py-3 px-8 font-bold rounded-xl text-[14px] border ${
                isLight
                  ? 'bg-rose-400 text-black border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                  : 'bg-red-500/20 border border-red-500/30 text-red-400 font-bold'
              }`}
            >
              {t('features.workout.stopBtn')}
            </motion.button>
          </motion.div>
        )}

        {/* HISTORY VIEW */}
        {view === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3 flex-1 overflow-y-auto"
          >
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <Icon icon="ph:barbell-bold" className={`mx-auto mb-3 ${isLight ? 'text-black/10' : 'text-white/20'}`} width={48} />
                <p className={`text-[14px] font-medium ${isLight ? 'text-black/40' : 'text-white/40'}`}>{t('features.workout.noHistory')}</p>
              </div>
            ) : (
              [...sessions].reverse().map((session) => (
                <div
                  key={session.id}
                  className={`p-4 border rounded-xl transition-all ${
                    isLight
                      ? 'bg-[#fbfbfb] border-black shadow-[3px_3px_0px_rgba(0,0,0,0.65)] text-black'
                      : 'bg-white/5 border border-white/10 text-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[13px] font-black ${isLight ? 'text-black' : 'text-white'}`}>
                      {new Date(session.completedAt).toLocaleDateString(language === 'Bahasa Indonesia' ? 'id-ID' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className={`text-[11px] font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>
                      {Math.floor(session.totalDurationSeconds / 60)} {t('features.workout.minutesUnit')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {session.exercises.map((ex, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                          isLight
                            ? 'bg-[#00FF85]/20 text-black border-black/30'
                            : 'bg-[#00FF85]/10 text-[#00FF85] border-transparent'
                        }`}
                      >
                        {t(ex.name)}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
