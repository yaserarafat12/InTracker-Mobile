import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { getBreathingPhase, type BreathingPhase } from './utils/breathingPhase';
import { useProgressionStore } from '../../store/useProgressionStore';
import { useUserStore } from '../../store/useUserStore';
import { useTranslation } from '../../i18n';
import { useBreathingStore } from './stores/useBreathingStore';
import { BreathingStats } from './BreathingStats';

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
  const [showStats, setShowStats] = useState(false);
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
    useBreathingStore.getState().addSession(sessionLength);
  }, [clearTimer, sessionLength]);

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
    if (!isActive) return 0.88;
    switch (phase) {
      case 'Inhale':
        return 1.25;
      case 'Hold':
        return 1.25;
      case 'Exhale':
        return 0.88;
      default:
        return 0.88;
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
      isLight ? 'bg-[#f2faf5] text-black' : 'bg-[#16181c] text-white'
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
        {/* Header Row */}
        <div className="relative w-full flex items-center justify-between mb-5 h-10">
          {/* Back button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className={`w-10 h-10 rounded-[10px] border-2 flex items-center justify-center transition-all ${
              isLight
                ? 'border-black/50 bg-white text-black shadow-none'
                : 'border-white/40 bg-[#2a2c32] text-white shadow-none'
            }`}
          >
            <Icon icon="ph:caret-left-bold" className={isLight ? 'text-black' : 'text-white'} width={18} />
          </motion.button>

          {/* Title in the center */}
          <h1 className={`text-[19px] font-bold font-['Outfit'] tracking-wide text-center flex-1 mx-2 truncate ${
            isLight ? 'text-black/85' : 'text-white/90'
          }`}>
            {t('features.breathing.title')}
          </h1>

          {/* Stats button — top right */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowStats(true)}
            className={`w-10 h-10 rounded-[10px] border-2 flex items-center justify-center transition-all ${
              isLight
                ? 'border-black/50 bg-white text-black shadow-none'
                : 'border-white/40 bg-[#2a2c32] text-white shadow-none'
            }`}
          >
            <Icon icon="solar:chart-square-bold" className={isLight ? 'text-black/80' : 'text-white/80'} width={20} />
          </motion.button>
        </div>

        {/* Animated Circle with Timer inside — centered, big */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Background glow */}
          {!isLight && <div className="absolute w-[280px] h-[280px] rounded-full bg-teal-400/10 blur-[80px]" />}

          <div className="relative w-[260px] h-[260px] flex items-center justify-center">
            {/* Animating Background Circle */}
            {/* Animating Ripple 2 (Outer Soft Glow Ripple) */}
            {isActive && (
              <motion.div
                animate={{ scale: getCircleScale() * 1.12, opacity: phase === 'Inhale' || phase === 'Hold' ? 0.3 : 0 }}
                transition={{
                  duration: isActive ? 4 : 0.6,
                  ease: isActive ? [0.4, 0, 0.2, 1] : "easeOut"
                }}
                className="absolute inset-0 rounded-full border border-teal-400/25 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)',
                }}
              />
            )}

            {/* Animating Background Circle */}
            <motion.div
              animate={{ scale: getCircleScale() }}
              transition={{
                duration: isActive ? 4 : 0.6,
                ease: isActive ? [0.4, 0, 0.2, 1] : "easeOut"
              }}
              className={`absolute inset-0 rounded-full border-[2.5px] transition-all ${
                isLight ? 'border-teal-500' : 'border-teal-400/40'
              }`}
              style={{
                background: isLight 
                  ? 'radial-gradient(circle, rgba(20,184,166,0.18) 0%, rgba(20,184,166,0.04) 70%, transparent 100%)' 
                  : 'radial-gradient(circle, rgba(45,212,191,0.2) 0%, rgba(45,212,191,0.04) 70%, transparent 100%)',
                boxShadow: isLight
                  ? '0 0 60px rgba(20,184,166,0.15), inset 0 0 30px rgba(20,184,166,0.1)'
                  : '0 0 80px rgba(45,212,191,0.15), inset 0 0 40px rgba(45,212,191,0.1)',
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
                      className={`px-4 py-2 rounded-[4px] text-[13px] font-bold border transition-all ${
                        sessionLength === opt.value
                          ? isLight
                            ? 'border-[1.5px] border-[#81E6D9] bg-gradient-to-br from-[#E6FFFA] to-[#C6F6D5] text-[#22543D] shadow-sm'
                            : 'border-[1.5px] border-[#1C4D38] bg-gradient-to-br from-[#102A1E] to-[#0A1A12] text-[#00FF85] shadow-none'
                          : isLight
                            ? 'bg-white text-black/60 border border-black/10 shadow-sm'
                            : 'bg-white/10 backdrop-blur-sm text-white/60 border border-white/10'
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
              className={`w-full py-3 font-black rounded-lg text-[13px] border-[1.5px] uppercase tracking-wide transition-all ${
                isLight
                  ? 'border-[#81E6D9] bg-gradient-to-br from-[#E6FFFA] to-[#C6F6D5] text-[#22543D] shadow-sm'
                  : 'border-[#1C4D38] bg-gradient-to-br from-[#102A1E] to-[#0A1A12] text-[#00FF85] shadow-none'
              }`}
            >
              {elapsed >= sessionLength ? t('features.breathing.startAgain') : t('features.breathing.startBtn')}
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStop}
              className={`w-full py-3 font-black rounded-lg text-[13px] border-[1.5px] uppercase tracking-wide transition-all ${
                isLight
                  ? 'border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100 text-rose-700 shadow-sm'
                  : 'border-red-950 bg-gradient-to-br from-[#2D1414] to-[#1F0C0C] text-red-400 shadow-none'
              }`}
            >
              {t('features.breathing.stopBtn')}
            </motion.button>
          )}
        </div>
      </div>

      {/* Stats Panel */}
      <BreathingStats isOpen={showStats} onClose={() => setShowStats(false)} />
    </div>
  );
}
