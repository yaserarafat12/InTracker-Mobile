import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useCountdownTimer } from './hooks/useCountdownTimer';
import { useProgressionStore } from '../../store/useProgressionStore';
import { usePomodoroStore } from './stores/usePomodoroStore';
import { PomodoroStats } from './PomodoroStats';

const DURATION_OPTIONS = [15, 25, 30, 45, 60, 75, 90];

type PomodoroState = 'idle' | 'running' | 'paused' | 'break';

interface PomodoroTimerProps {
  onBack: () => void;
}

export function PomodoroTimer({ onBack }: PomodoroTimerProps) {
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>('idle');
  const [showBreakOffer, setShowBreakOffer] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const { addSession } = usePomodoroStore();

  const handleComplete = useCallback(() => {
    setPomodoroState('idle');
    // Vibrate
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    // Record session
    addSession(selectedDuration);
    // Award XP
    useProgressionStore.getState().awardFeedInteraction();
    // Offer break
    setShowBreakOffer(true);
  }, [addSession, selectedDuration]);

  const handleBreakComplete = useCallback(() => {
    setPomodoroState('idle');
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }, []);

  const timer = useCountdownTimer({
    initialSeconds: selectedDuration * 60,
    onComplete: handleComplete,
  });

  const breakTimer = useCountdownTimer({
    initialSeconds: 5 * 60, // 5 min break
    onComplete: handleBreakComplete,
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setPomodoroState('running');
    setShowBreakOffer(false);
    timer.start();
  };

  const handlePause = () => {
    setPomodoroState('paused');
    timer.pause();
  };

  const handleResume = () => {
    setPomodoroState('running');
    timer.resume();
  };

  const handleStop = () => {
    setPomodoroState('idle');
    timer.stop();
    breakTimer.stop();
    setShowBreakOffer(false);
  };

  const handleStartBreak = () => {
    setShowBreakOffer(false);
    setPomodoroState('break');
    breakTimer.start();
  };

  const handleSkipBreak = () => {
    setShowBreakOffer(false);
    setPomodoroState('idle');
  };

  const displayTime = pomodoroState === 'break' ? breakTimer.remaining : timer.remaining;

  return (
    <div className="fixed inset-0 flex flex-col items-center px-6 pt-14 pb-10 z-[200] overflow-hidden">
      {/* Background image */}
      <img src="/all_images/features_bg/pomodoro_bg.png" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_85%] z-0" />
      <div className="absolute inset-0 bg-black/50 z-[1]" />

      {/* Back button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onBack}
        className="absolute top-12 left-5 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center z-20"
      >
        <Icon icon="ph:arrow-left-bold" className="text-white" width={20} />
      </motion.button>

      {/* Stats button — top right, neobrutalist */}
      <motion.button
        whileTap={{ scale: 0.9, x: 2, y: 2, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
        onClick={() => setShowStats(true)}
        className="absolute top-12 right-5 w-10 h-10 rounded-lg bg-[#00FF85] border-[2px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] flex items-center justify-center z-20"
      >
        <Icon icon="ph:chart-bar-bold" className="text-black" width={18} />
      </motion.button>

      {/* Stats Panel */}
      <PomodoroStats isOpen={showStats} onClose={() => setShowStats(false)} />

      {/* Timer Display — upper area */}
      <div className="flex-1 flex flex-col items-center justify-start pt-36 z-10">
        <motion.div
          key={pomodoroState}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          {/* Glow ring */}
          <div className={`absolute inset-0 rounded-full blur-[60px] opacity-20 ${
            pomodoroState === 'break' ? 'bg-blue-400' : 'bg-[#00FF85]'
          }`} />

          <div className="relative text-center">
            <p className="text-[13px] text-white/40 mb-2 font-medium">
              {pomodoroState === 'idle' ? 'Pomodoro Timer' : pomodoroState === 'break' ? 'Istirahat' : pomodoroState === 'paused' ? 'Dijeda' : 'Fokus'}
            </p>
            <span className="text-[72px] font-black text-white font-['Outfit'] tabular-nums tracking-tight leading-none">
              {formatTime(displayTime)}
            </span>
            {pomodoroState === 'break' && (
              <p className="text-[14px] text-blue-400 font-medium mt-3">5 menit istirahat</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Duration Picker (only in idle) — below timer */}
      <AnimatePresence>
        {pomodoroState === 'idle' && !showBreakOffer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap gap-2 justify-center mb-6 z-10"
          >
            {DURATION_OPTIONS.map((d) => (
              <motion.button
                key={d}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDuration(d)}
                className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all ${
                  selectedDuration === d
                    ? 'bg-[#00FF85] text-black'
                    : 'bg-white/10 backdrop-blur-sm text-white/60 border border-white/10'
                }`}
              >
                {d} min
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Break Offer */}
      <AnimatePresence>
        {showBreakOffer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 mb-4 text-center z-10"
          >
            <p className="text-[15px] font-bold text-white mb-1">Sesi Selesai! 🎉</p>
            <p className="text-[13px] text-white/50 mb-4">Mau istirahat 5 menit?</p>
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStartBreak}
                className="flex-1 py-3 bg-[#00FF85] text-black font-bold rounded-xl text-[13px]"
              >
                Istirahat
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSkipBreak}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-white/70 font-bold rounded-xl text-[13px]"
              >
                Lewati
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls — bottom */}
      <div className="w-full flex gap-3 z-10">
        {pomodoroState === 'idle' && !showBreakOffer && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="flex-1 py-4 bg-[#00FF85] text-black font-bold rounded-xl text-[15px]"
          >
            Mulai Fokus
          </motion.button>
        )}

        {pomodoroState === 'running' && (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePause}
              className="flex-1 py-4 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-bold rounded-xl text-[15px]"
            >
              Jeda
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStop}
              className="flex-1 py-4 bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl text-[15px]"
            >
              Berhenti
            </motion.button>
          </>
        )}

        {pomodoroState === 'paused' && (
          <>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleResume}
              className="flex-1 py-4 bg-[#00FF85] text-black font-bold rounded-xl text-[15px]"
            >
              Lanjut
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStop}
              className="flex-1 py-4 bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl text-[15px]"
            >
              Berhenti
            </motion.button>
          </>
        )}

        {pomodoroState === 'break' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStop}
            className="flex-1 py-4 bg-white/5 border border-white/10 text-white/70 font-bold rounded-xl text-[15px]"
          >
            Selesai
          </motion.button>
        )}
      </div>
    </div>
  );
}
