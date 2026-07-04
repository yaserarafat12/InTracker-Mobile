import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useCountdownTimer } from './hooks/useCountdownTimer';
import { useProgressionStore } from '../../store/useProgressionStore';
import { usePomodoroStore } from './stores/usePomodoroStore';
import { PomodoroStats } from './PomodoroStats';
import { useTranslation } from '../../i18n';
import { useUserStore } from '../../store/useUserStore';

const DURATION_OPTIONS = [15, 25, 30, 45, 60, 75, 90];

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
        isLight ? 'bg-[#f0fdf4] text-black' : 'bg-[#16181c] text-white'
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
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className={`absolute top-12 left-5 w-10 h-10 rounded-xl border-[2px] flex items-center justify-center z-20 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
            isLight
              ? 'border-black bg-white shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
              : 'border-white/10 bg-[#2a2c32] shadow-none'
          }`}
        >
          <Icon icon="ph:arrow-left-bold" className={isLight ? 'text-black' : 'text-white'} width={18} />
        </motion.button>
        {/* Sound toggle button — top right, next to stats */}
        <motion.button
          whileTap={{ scale: 0.9, x: 2, y: 2, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
          onClick={handleToggleSound}
          className={`absolute top-12 right-[72px] w-10 h-10 rounded-lg flex items-center justify-center z-20 border-[2px] transition-all ${
            isLight ? 'border-black' : isSoundOn ? 'border-transparent' : 'border-white/10'
          } ${
            isSoundOn
              ? 'bg-[#00FF85]'
              : isLight
                ? 'bg-white'
                : 'bg-[#2a2c32]'
          } ${
            isLight
              ? 'shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
              : 'shadow-none'
          }`}
        >
          {isSoundOn && pomodoroState === 'running' ? (
            <div className="flex items-end gap-[2px] h-4 px-1">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ height: ['30%', `${60 + i * 10}%`, '30%'] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.4 + i * 0.12,
                    ease: 'easeInOut',
                    delay: i * 0.08,
                  }}
                  className="w-[2.5px] rounded-full origin-bottom bg-black"
                />
              ))}
            </div>
          ) : (
            <Icon 
              icon={isSoundOn ? "solar:music-note-bold" : "solar:music-note-broken"} 
              className={isLight ? 'text-black' : isSoundOn ? 'text-black' : 'text-white'} 
              width={18} 
            />
          )}
        </motion.button>

        {/* Stats button — top right */}
        <motion.button
          whileTap={{ scale: 0.9, x: 2, y: 2, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
          onClick={() => setShowStats(true)}
          className={`absolute top-12 right-5 w-10 h-10 rounded-lg flex items-center justify-center z-20 border-[2px] transition-all bg-[#00FF85] ${
            isLight
              ? 'border-black shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
              : 'border-transparent shadow-none'
          }`}
        >
          <Icon icon="solar:chart-square-bold" className="text-black" width={20} />
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
            {!isLight && (
              <div className={`absolute inset-0 rounded-full blur-[60px] opacity-20 ${
                pomodoroState === 'break' ? 'bg-blue-400' : 'bg-[#00FF85]'
              }`} />
            )}
  
            <div className="relative text-center">
              <p className={`text-[13px] mb-2 font-black uppercase tracking-wider ${isLight ? 'text-black/50' : 'text-white/40'}`}>
                {pomodoroState === 'idle' ? t('features.pomodoro.timerTitle') : pomodoroState === 'break' ? t('features.pomodoro.stateBreak') : pomodoroState === 'paused' ? t('features.pomodoro.statePaused') : t('features.pomodoro.stateFocus')}
              </p>
              <span className={`text-[72px] font-black font-['Outfit'] tabular-nums tracking-tight leading-none ${isLight ? 'text-black' : 'text-white'}`}>
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
                  className={`px-4 py-2 rounded-xl text-[13px] font-black border transition-all ${
                    selectedDuration === d
                      ? 'bg-[#00FF85] text-black border-black shadow-[2.5px_2.5px_0px_rgba(0,0,0,0.65)]'
                      : isLight
                        ? 'bg-white text-black/60 border-black/20 hover:border-black/50 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]'
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
                  ? 'bg-[#fbfbfb] border-black shadow-[4px_4px_0px_rgba(0,0,0,0.65)] text-black'
                  : 'bg-white/5 backdrop-blur-sm border border-white/10 text-white'
              }`}
            >
              <p className={`text-[15px] font-black mb-1 ${isLight ? 'text-black' : 'text-white'}`}>{t('features.pomodoro.sessionCompleted')}</p>
              <p className={`text-[13px] mb-4 ${isLight ? 'text-black/60' : 'text-white/50'}`}>{t('features.pomodoro.wantABreak')}</p>
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartBreak}
                  className={`flex-1 py-3 font-bold rounded-xl text-[13px] border ${
                    isLight
                      ? 'bg-[#00FF85] text-black border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                      : 'bg-[#00FF85] text-black border-transparent'
                  }`}
                >
                  {t('features.pomodoro.breakBtn')}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSkipBreak}
                  className={`flex-1 py-3 font-bold rounded-xl text-[13px] border ${
                    isLight
                      ? 'bg-white text-black border-black shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
                      : 'bg-white/10 text-white/70 border border-white/10'
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
              className={`flex-1 py-4 font-black rounded-xl text-[15px] border uppercase tracking-wide ${
                isLight
                  ? 'bg-[#00FF85] text-black border-black shadow-[3.5px_3.5px_0px_rgba(0,0,0,1)]'
                  : 'bg-[#00FF85] text-black border-transparent'
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
                className={`flex-1 py-4 font-bold rounded-xl text-[15px] border ${
                  isLight
                    ? 'bg-amber-400 text-black border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                    : 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                }`}
              >
                {t('features.pomodoro.pauseBtn')}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStop}
                className={`flex-1 py-4 font-bold rounded-xl text-[15px] border ${
                  isLight
                    ? 'bg-rose-400 text-black border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                    : 'bg-red-500/20 border border-red-500/30 text-red-400'
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
                className={`flex-1 py-4 font-black rounded-xl text-[15px] border uppercase tracking-wide ${
                  isLight
                    ? 'bg-[#00FF85] text-black border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#00FF85] text-black border-transparent'
                }`}
              >
                {t('features.pomodoro.resumeBtn')}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStop}
                className={`flex-1 py-4 font-bold rounded-xl text-[15px] border ${
                  isLight
                    ? 'bg-rose-400 text-black border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                    : 'bg-red-500/20 border border-red-500/30 text-red-400'
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
              className={`flex-1 py-4 font-bold rounded-xl text-[15px] border ${
                isLight
                  ? 'bg-[#00FF85] text-black border-black shadow-[3.5px_3.5px_0px_rgba(0,0,0,1)]'
                  : 'bg-white/5 border border-white/10 text-white/70'
              }`}
            >
              {t('features.pomodoro.doneBtn')}
            </motion.button>
          )}
        </div>
      </div>
  );
}
