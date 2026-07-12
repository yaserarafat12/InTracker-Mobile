import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getBreathingPhase, type BreathingPhase } from './utils/breathingPhase';
import { useProgressionStore } from '../../store/useProgressionStore';
import { useUserStore } from '../../store/useUserStore';
import { useTranslation } from '../../i18n';

const DURATION_OPTIONS = [
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
];

const getPhaseLabel = (phase: BreathingPhase, t: any) => {
  switch (phase) {
    case 'Inhale': return t('features.breathing.inhale');
    case 'Hold': return t('features.breathing.hold');
    case 'Exhale': return t('features.breathing.exhale');
    case 'Hold2': return t('features.breathing.hold');
    default: return '';
  }
};

interface DeepBreathingProps {
  onBack: () => void;
}

export function DeepBreathing({ onBack }: DeepBreathingProps) {
  const { t } = useTranslation();
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

  const { settings } = useUserStore();
  const isLight = !document.documentElement.classList.contains('dark');

  return (
    <div className={`fixed inset-0 flex flex-col items-center px-6 py-8 pb-10 z-[200] overflow-hidden transition-all ${
      isLight ? 'bg-[#f0fdf4] text-black' : 'bg-[#16181c] text-white'
    }`}>
      {/* Background image */}
      {isLight ? (
        <img src="/all_images/antigravitybg/deepb_bg.png" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_70%] z-0" />
      ) : (
        <>
          <img src="/all_images/features_bg/deepbreathing_bg.png" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_70%] z-0" />
          <div className="absolute inset-0 bg-black/40 z-[1]" />
        </>
      )}

      {/* All content above overlay */}
      <div className="relative z-10 flex flex-col items-center flex-1 w-full">
        {/* Back button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className={`absolute top-0 left-0 w-10 h-10 rounded-xl border-[2px] flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
            isLight
              ? 'border-black bg-white shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
              : 'border-white/10 bg-[#2a2c32] shadow-none'
          }`}
        >
          <Icon icon="ph:arrow-left-bold" className={isLight ? 'text-black' : 'text-white'} width={18} />
        </motion.button>

        {/* Title — pushed to top */}
        <div className="text-center mb-3">
          <h1 className={`text-[24px] font-black font-['Outfit'] ${isLight ? 'text-black' : 'text-white'}`}>{t('features.breathing.title')}</h1>
          <p className={`text-[13px] mt-1 font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>{t('features.breathing.subtitle')}</p>
        </div>

        {/* Animated Circle with Timer inside — centered, big */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Background glow */}
          {!isLight && <div className="absolute w-[280px] h-[280px] rounded-full bg-teal-400/10 blur-[80px]" />}

          <div className="relative w-[260px] h-[260px] flex items-center justify-center">
            {/* Animating Background Circle */}
            <motion.div
              animate={{ scale: getCircleScale() }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className={`absolute inset-0 rounded-full border-[3px] transition-all ${
                isLight ? 'border-teal-500 shadow-[4px_4px_0px_rgba(20,184,166,0.3)]' : 'border-teal-400/30'
              }`}
              style={{
                background: isLight 
                  ? 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, rgba(20,184,166,0.03) 70%, transparent 100%)' 
                  : 'radial-gradient(circle, rgba(45,212,191,0.15) 0%, rgba(45,212,191,0.03) 70%, transparent 100%)',
                boxShadow: isLight
                  ? '0 0 80px rgba(20,184,166,0.1), inset 0 0 40px rgba(20,184,166,0.08)'
                  : '0 0 80px rgba(45,212,191,0.1), inset 0 0 40px rgba(45,212,191,0.08)',
              }}
            />

            {/* Static Timer & Text Content */}
            <div className="relative z-10 text-center">
              <span className={`text-[48px] font-black font-['Outfit'] tabular-nums tracking-tight leading-none ${
                isLight ? 'text-black' : 'text-white'
              }`}>
                {formatTime(Math.max(0, sessionLength - elapsed))}
              </span>
              {isActive && (
                <motion.p
                  key={phase}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`text-[14px] font-bold mt-2 ${isLight ? 'text-teal-600' : 'text-teal-300'}`}
                >
                  {getPhaseLabel(phase, t)}
                </motion.p>
              )}
            </div>
          </div>
        </div>

        {/* Status & Duration Area (Fixed height to prevent circle layout shift) */}
        <div className="h-28 flex flex-col justify-center items-center w-full mb-4">
          <AnimatePresence mode="wait">
            {!isActive && elapsed === 0 && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-3"
              >
                <span className={`text-[16px] font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>{t('features.breathing.readyPrompt')}</span>
                <div className="flex gap-2 justify-center">
                  {DURATION_OPTIONS.map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSessionLength(opt.value)}
                      className={`px-5 py-2.5 rounded-full text-[13px] font-bold border transition-all ${
                        sessionLength === opt.value
                          ? 'bg-teal-400 text-black border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                          : isLight
                            ? 'bg-white text-black/60 border-black/25 shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.05)]'
                            : 'bg-white/5 text-white/60 border border-white/10'
                      }`}
                    >
                      {opt.value / 60} {t('units.Menit').toLowerCase()}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {!isActive && elapsed >= sessionLength && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <span className={`text-[18px] font-black ${isLight ? 'text-teal-600' : 'text-teal-300'}`}>{t('features.breathing.sessionCompleted')}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="w-full">
          {!isActive ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className={`w-full py-4 font-black rounded-xl text-[15px] border transition-all uppercase tracking-wide ${
                isLight
                  ? 'bg-teal-400 text-black border-black shadow-[3.5px_3.5px_0px_rgba(0,0,0,1)]'
                  : 'bg-teal-500/20 border border-teal-400/30 text-teal-300'
              }`}
            >
              {elapsed >= sessionLength ? t('features.breathing.startAgain') : t('features.breathing.startBtn')}
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStop}
              className={`w-full py-4 font-black rounded-xl text-[15px] border transition-all uppercase tracking-wide ${
                isLight
                  ? 'bg-rose-400 text-black border-black shadow-[3.5px_3.5px_0px_rgba(0,0,0,1)]'
                  : 'bg-red-500/20 border border-red-500/30 text-red-400'
              }`}
            >
              {t('features.breathing.stopBtn')}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
