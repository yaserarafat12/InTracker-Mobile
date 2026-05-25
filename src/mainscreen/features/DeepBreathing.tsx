import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getBreathingPhase, type BreathingPhase } from './utils/breathingPhase';
import { useProgressionStore } from '../../store/useProgressionStore';

const DURATION_OPTIONS = [
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
];

const PHASE_LABELS: Record<BreathingPhase, string> = {
  Inhale: 'Tarik Napas',
  Hold: 'Tahan',
  Exhale: 'Buang Napas',
  Hold2: 'Tahan',
};

interface DeepBreathingProps {
  onBack: () => void;
}

export function DeepBreathing({ onBack }: DeepBreathingProps) {
  const [isActive, setIsActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessionLength, setSessionLength] = useState(180); // default 3 min
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { phase, phaseProgress } = getBreathingPhase(elapsed);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleComplete = useCallback(() => {
    clearTimer();
    setIsActive(false);
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 100]);
    useProgressionStore.getState().awardFeedInteraction();
  }, [clearTimer]);

  const handleStart = () => {
    setElapsed(0);
    setIsActive(true);
  };

  const handleStop = () => {
    clearTimer();
    setIsActive(false);
    setElapsed(0);
  };

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= sessionLength) {
            handleComplete();
            return sessionLength;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearTimer();
  }, [isActive, clearTimer, handleComplete, sessionLength]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const getCircleScale = () => {
    if (!isActive) return 1;
    switch (phase) {
      case 'Inhale':
        return 1 + phaseProgress * 0.5; // 1 → 1.5
      case 'Hold':
        return 1.5;
      case 'Exhale':
        return 1.5 - phaseProgress * 0.5; // 1.5 → 1
      case 'Hold2':
        return 1;
      default:
        return 1;
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center px-6 py-8 pb-10 z-[200] overflow-hidden">
      {/* Background image */}
      <img src="/all_images/features_bg/deepbreathing_bg.png" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_70%] z-0" />
      <div className="absolute inset-0 bg-black/40 z-[1]" />

      {/* All content above overlay */}
      <div className="relative z-10 flex flex-col items-center flex-1 w-full">
        {/* Back button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="absolute top-0 left-0 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center"
        >
          <Icon icon="ph:arrow-left-bold" className="text-white" width={20} />
        </motion.button>

      {/* Title — pushed to top */}
      <div className="text-center mb-3">
        <h1 className="text-[24px] font-bold text-white font-['Outfit']">Deep Breathing</h1>
        <p className="text-[13px] text-white/40 mt-1">Box breathing 4-4-4-4</p>
      </div>

      {/* Animated Circle with Timer inside — centered, big */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Background glow */}
        <div className="absolute w-[280px] h-[280px] rounded-full bg-teal-400/10 blur-[80px]" />

        <motion.div
          animate={{ scale: getCircleScale() }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="relative w-[260px] h-[260px] rounded-full border-2 border-teal-400/30 flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, rgba(45,212,191,0.15) 0%, rgba(45,212,191,0.03) 70%, transparent 100%)',
            boxShadow: '0 0 80px rgba(45,212,191,0.1), inset 0 0 40px rgba(45,212,191,0.08)',
          }}
        >
          {/* Timer inside circle */}
          <div className="text-center">
            <span className="text-[48px] font-black text-white font-['Outfit'] tabular-nums tracking-tight leading-none">
              {formatTime(Math.max(0, sessionLength - elapsed))}
            </span>
            {isActive && (
              <motion.p
                key={phase}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[14px] text-teal-300 font-bold mt-2"
              >
                {PHASE_LABELS[phase]}
              </motion.p>
            )}
          </div>
        </motion.div>
      </div>

      {!isActive && elapsed === 0 && (
        <div className="text-center mb-4">
          <span className="text-[16px] text-white/40">Siap untuk bernapas?</span>
        </div>
      )}

      {!isActive && elapsed >= sessionLength && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-4"
        >
          <span className="text-[18px] font-bold text-teal-300">Sesi Selesai! 🧘</span>
        </motion.div>
      )}

      {/* Duration Picker — bottom, above button */}
      {!isActive && elapsed === 0 && (
        <div className="flex gap-2 justify-center mb-4">
          {DURATION_OPTIONS.map((opt) => (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSessionLength(opt.value)}
              className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all ${
                sessionLength === opt.value
                  ? 'bg-teal-400 text-black'
                  : 'bg-white/5 text-white/60 border border-white/10'
              }`}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="w-full">
        {!isActive ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStart}
            className="w-full py-4 bg-teal-500/20 border border-teal-400/30 text-teal-300 font-bold rounded-xl text-[15px]"
          >
            {elapsed >= sessionLength ? 'Mulai Lagi' : 'Mulai'}
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleStop}
            className="w-full py-4 bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl text-[15px]"
          >
            Berhenti
          </motion.button>
        )}
      </div>
      </div>
    </div>
  );
}
