import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useCountdownTimer } from './hooks/useCountdownTimer';
import { useProgressionStore } from '../../store/useProgressionStore';
import { usePomodoroStore } from './stores/usePomodoroStore';
import { PomodoroStats } from './PomodoroStats';
import { useTranslation } from '../../i18n';
import { useUserStore } from '../../store/useUserStore';

const DURATION_OPTIONS = [15, 25, 30, 45, 60, 90];

type PomodoroState = 'idle' | 'running' | 'paused' | 'break';

interface PomodoroTimerProps {
  onBack: () => void;
}

export function PomodoroTimer({ onBack }: PomodoroTimerProps) {
  const { t } = useTranslation();
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>('idle');
  const [showBreakOffer, setShowBreakOffer] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const { addSession } = usePomodoroStore();
  const [isSoundOn, setIsSoundOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getAudio = () => {
    if (!audioRef.current && typeof window !== 'undefined') {
      audioRef.current = new Audio('/sound/pomodoro_ambient.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
    }
    return audioRef.current;
  };

  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;

    if (isSoundOn && pomodoroState === 'running') {
      audio.play().catch(err => console.error('[Pomodoro] Audio play failed:', err));
    } else {
      audio.pause();
    }
  }, [isSoundOn, pomodoroState]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleToggleSound = () => {
    setIsSoundOn(prev => !prev);
    if (navigator.vibrate) navigator.vibrate(10);
  };

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

  const { settings } = useUserStore();
  const isLight = !document.documentElement.classList.contains('dark');
  const displayTime = pomodoroState === 'break' ? breakTimer.remaining : timer.remaining;

  return (
      <div className={`fixed inset-0 flex flex-col items-center px-6 pt-14 pb-10 z-[200] overflow-hidden transition-all ${
        isLight ? 'bg-[#f2faf5] text-black' : 'bg-[#16181c] text-white'
      }`}>
        {/* Background image */}
        {isLight ? (
          <img src="/all_images/antigravitybg/pomodoro_bgg.png" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_85%] z-0" />
        ) : (
          <>
            <img src="/all_images/features_bg/pomodoro_bg.png" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_85%] z-0" />
            <div className="absolute inset-0 bg-black/50 z-[1]" />
          </>
        )}
  
        {/* Back button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className={`absolute top-12 left-5 w-10 h-10 rounded-[10px] border-2 flex items-center justify-center z-20 transition-all ${
            isLight
              ? 'border-black/50 bg-white text-black shadow-none'
              : 'border-white/40 bg-[#2a2c32] text-white shadow-none'
          }`}
        >
          <Icon icon="ph:caret-left-bold" className={isLight ? 'text-black/80' : 'text-white'} width={18} />
        </motion.button>
        
        {/* Sound toggle button — top right, next to stats */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleSound}
          className={`absolute top-12 right-[72px] w-10 h-10 border-2 border-[#6ED7A0] rounded-[10px] flex items-center justify-center z-20 transition-all ${
            isLight 
              ? 'bg-[#EAFDF5] text-[#00C265] shadow-[2px_2px_0px_rgba(110,215,160,0.35)]' 
              : 'bg-[#6ED7A0]/15 text-[#6ED7A0] shadow-[2px_2px_0px_rgba(110,215,160,0.15)]'
          }`}
        >
          {isSoundOn ? (
            <div className="flex items-end gap-[2px] h-4 px-1">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ height: ['30%', `${55 + i * 12}%`, '30%'] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.45 + i * 0.15,
                    ease: 'easeInOut',
                    delay: i * 0.1,
                  }}
                  className={`w-[2.5px] rounded-full origin-bottom ${isLight ? 'bg-[#00C265]' : 'bg-[#6ED7A0]'}`}
                />
              ))}
            </div>
          ) : (
            <Icon 
              icon="solar:music-note-bold" 
              className={isLight ? 'text-[#00C265]' : 'text-[#6ED7A0]'} 
              width={20} 
            />
          )}
        </motion.button>

        {/* Stats button — top right */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowStats(true)}
          className={`absolute top-12 right-5 w-10 h-10 rounded-[10px] border-2 flex items-center justify-center z-20 transition-all ${
            isLight
              ? 'border-black/50 bg-white text-black/80 shadow-none'
              : 'border-white/40 bg-[#2a2c32] text-white shadow-none'
          }`}
        >
          <Icon icon="solar:chart-square-bold" className={isLight ? 'text-black/80' : 'text-white'} width={20} />
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
            {!isLight && pomodoroState !== 'idle' && (
              <div className={`absolute inset-0 rounded-full blur-[60px] opacity-15 ${
                pomodoroState === 'break' ? 'bg-blue-400' : 'bg-white'
              }`} />
            )}
  
            <div className="relative text-center">
              <p className={`text-[13px] mb-2 font-black uppercase tracking-wider ${isLight ? 'text-black/50' : 'text-white/40'}`}>
                {pomodoroState === 'idle' ? t('features.pomodoro.timerTitle') : pomodoroState === 'break' ? t('features.pomodoro.stateBreak') : pomodoroState === 'paused' ? t('features.pomodoro.statePaused') : t('features.pomodoro.stateFocus')}
              </p>
              <span 
                style={{ fontFamily: '"Chivo", sans-serif' }}
                className={`text-[74px] font-black tabular-nums tracking-tight leading-none ${isLight ? 'text-black' : 'text-white'}`}
              >
                {formatTime(displayTime)}
              </span>
              {pomodoroState === 'break' && (
                <p className="text-[14px] text-blue-500 font-bold mt-3">{t('features.pomodoro.breakDuration')}</p>
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
                  style={{ fontFamily: '"Chivo", sans-serif' }}
                  className={`px-4 py-2 rounded-[4px] text-[13px] font-bold border transition-all ${
                    selectedDuration === d
                      ? isLight
                        ? 'border border-[#81E6D9] bg-gradient-to-br from-[#E6FFFA] to-[#C6F6D5] shadow-sm text-[#22543D]'
                        : 'border border-[#1C4D38] bg-gradient-to-br from-[#102A1E] to-[#0A1A12] shadow-sm text-[#00FF85]'
                      : isLight
                        ? 'bg-white text-black/60 border border-black/10 shadow-sm'
                        : 'bg-white/10 backdrop-blur-sm text-white/60 border border-white/10'
                  }`}
                >
                  {d} {t('units.Menit').toLowerCase()}
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
              className={`w-full border rounded-2xl p-5 mb-4 text-center z-10 transition-all ${
                isLight
                  ? 'bg-[#fbfbfb] border-black/10 shadow-none text-black'
                  : 'bg-white/5 backdrop-blur-sm border border-white/10 text-white'
              }`}
            >
              <p className={`text-[15px] font-black mb-1 ${isLight ? 'text-black' : 'text-white'}`}>{t('features.pomodoro.sessionCompleted')}</p>
              <p className={`text-[13px] mb-4 ${isLight ? 'text-black/60' : 'text-white/50'}`}>{t('features.pomodoro.wantABreak')}</p>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartBreak}
                  className={`flex-1 py-3 font-black rounded-lg text-[13px] border-[1.5px] transition-all uppercase tracking-wider ${
                    isLight
                      ? 'border-[#48BB78]/20 bg-gradient-to-br from-[#E6FFFA] to-[#C6F6D5] border-[#81E6D9] shadow-sm text-[#22543D]'
                      : 'border-[#00FF85]/20 bg-gradient-to-br from-[#102A1E] to-[#0A1A12] border-[#1C4D38] shadow-sm text-[#00FF85]'
                  }`}
                >
                  {t('features.pomodoro.breakBtn')}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSkipBreak}
                  className={`flex-1 py-3 font-bold rounded-lg text-[13px] border transition-all ${
                    isLight
                      ? 'bg-white text-black border border-black/10 shadow-sm'
                      : 'bg-white/10 text-white/70 border border-white/10 shadow-sm'
                  }`}
                >
                  {t('features.pomodoro.skipBtn')}
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
              className={`flex-1 py-3 font-black rounded-lg text-[13px] border-[1.5px] uppercase tracking-wide transition-all ${
                isLight
                  ? 'border-[#48BB78]/20 bg-gradient-to-br from-[#E6FFFA] to-[#C6F6D5] border-[#81E6D9] shadow-sm text-[#22543D]'
                  : 'border-[#00FF85]/20 bg-gradient-to-br from-[#102A1E] to-[#0A1A12] border-[#1C4D38] shadow-sm text-[#00FF85]'
              }`}
            >
              {t('features.pomodoro.startFocus')}
            </motion.button>
          )}
  
          {pomodoroState === 'running' && (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handlePause}
                className={`flex-1 py-3 font-bold rounded-lg text-[13px] border transition-all ${
                  isLight
                    ? 'bg-amber-400/15 border border-amber-400/20 text-amber-600 shadow-sm'
                    : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 shadow-sm'
                }`}
              >
                {t('features.pomodoro.pauseBtn')}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStop}
                className={`flex-1 py-3 font-bold rounded-lg text-[13px] border transition-all ${
                  isLight
                    ? 'bg-rose-400/15 border border-rose-400/20 text-rose-600 shadow-sm'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400 shadow-sm'
                }`}
              >
                {t('features.pomodoro.stopBtn')}
              </motion.button>
            </>
          )}
  
          {pomodoroState === 'paused' && (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleResume}
                className={`flex-1 py-3 font-black rounded-lg text-[13px] border-[1.5px] uppercase tracking-wide transition-all ${
                  isLight
                    ? 'border-[#48BB78]/20 bg-gradient-to-br from-[#E6FFFA] to-[#C6F6D5] border-[#81E6D9] shadow-sm text-[#22543D]'
                    : 'border-[#00FF85]/20 bg-gradient-to-br from-[#102A1E] to-[#0A1A12] border-[#1C4D38] shadow-sm text-[#00FF85]'
                }`}
              >
                {t('features.pomodoro.resumeBtn')}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStop}
                className={`flex-1 py-3 font-bold rounded-lg text-[13px] border transition-all ${
                  isLight
                    ? 'bg-rose-400/15 border border-rose-400/20 text-rose-600 shadow-sm'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400 shadow-sm'
                }`}
              >
                {t('features.pomodoro.stopBtn')}
              </motion.button>
            </>
          )}
  
          {pomodoroState === 'break' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStop}
              className={`flex-1 py-3 font-black rounded-lg text-[13px] border-[1.5px] uppercase tracking-wide transition-all ${
                isLight
                  ? 'border-[#48BB78]/20 bg-gradient-to-br from-[#E6FFFA] to-[#C6F6D5] border-[#81E6D9] shadow-sm text-[#22543D]'
                  : 'border-[#00FF85]/20 bg-gradient-to-br from-[#102A1E] to-[#0A1A12] border-[#1C4D38] shadow-sm text-[#00FF85]'
              }`}
            >
              {t('features.pomodoro.doneBtn')}
            </motion.button>
          )}
        </div>
      </div>
  );
}
