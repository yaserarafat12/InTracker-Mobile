import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useHabitStore } from '../../../store/useHabitStore';
import { useUserStore } from '../../../store/useUserStore';
import { MathMatchGame, TypeRaceGame } from '../../../components/StreakMiniGames';
import { HABIT_ICONS, HABIT_COLORS, CATEGORY_COLORS } from '../../habits/icons';
import { CustomIcon } from '../../habits/displaycardhabit';

// Amber Alert Animation System — Custom Styles (Stable Breathing Effect)
const AmberAlertStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes amberPulse {
      0%, 100% { 
        box-shadow: 0 0 40px rgba(255,140,0,0.2), inset 0 0 20px rgba(255,140,0,0.05);
        transform: scale(1);
      }
      50% { 
        box-shadow: 0 0 60px rgba(255,140,0,0.4), inset 0 0 30px rgba(255,140,0,0.1);
        transform: scale(1.002);
      }
    }
    @keyframes amberRotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .amber-alert-card {
      position: relative;
      animation: amberPulse 4s ease-in-out infinite;
    }
    .amber-alert-card::before {
      content: "";
      position: absolute;
      inset: -1.5px;
      padding: 1.5px;
      border-radius: 36px;
      background: linear-gradient(
        135deg,
        #FF8C00 0%,
        #FF4D00 50%,
        #FF8C00 100%
      );
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      opacity: 0.8;
      pointer-events: none;
      z-index: 10;
    }
    .amber-particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: #FF8C00;
      border-radius: 50%;
      filter: blur(1px);
      pointer-events: none;
      z-index: 5;
      opacity: 0.5;
    }
    .rotating-star-amber {
      animation: amberRotate 8s linear infinite;
      filter: drop-shadow(0 0 8px rgba(255,140,0,0.6));
    }
  `}} />
);

const PARTICLE_CONFIG = [
  { left: '15%', top: '20%', delay: 0, duration: 3.2 },
  { left: '80%', top: '15%', delay: 0.5, duration: 4.1 },
  { left: '70%', top: '60%', delay: 1.0, duration: 3.7 },
  { left: '10%', top: '70%', delay: 1.5, duration: 2.9 },
  { left: '50%', top: '80%', delay: 0.8, duration: 3.5 },
  { left: '90%', top: '40%', delay: 1.2, duration: 4.3 },
];

type Screen = 'main' | 'options' | 'game-select' | 'math' | 'typing' | 'celebration';

export const StreakRecoveryModal = () => {
  const { brokenStreaks, habits, rescueStreak } = useHabitStore();
  const { profile, useStreakFreeze } = useUserStore();
  const [screen, setScreen] = useState<Screen>('main');
  const [savedHabitName, setSavedHabitName] = useState('');
  const [savedStreakCount, setSavedStreakCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // Check if already shown today
  useEffect(() => {
    const lastShown = localStorage.getItem('streak_warning_last_shown');
    const today = new Date().toLocaleDateString('en-CA');
    if (lastShown === today) {
      setDismissed(true);
    }
  }, []);

  // Mark as shown today when modal appears
  useEffect(() => {
    if (brokenStreaks.length > 0 && !dismissed) {
      const today = new Date().toLocaleDateString('en-CA');
      localStorage.setItem('streak_warning_last_shown', today);
    }
  }, [brokenStreaks, dismissed]);

  if (dismissed) return null;
  if (brokenStreaks.length === 0 && screen !== 'celebration') return null;

  const currentBroken = brokenStreaks[0];
  const habit = currentBroken ? habits.find(h => h.id === currentBroken.habitId) : null;

  if (!habit && screen !== 'celebration') return null;

  const hasFreeze = profile && profile.streak_freeze_count > 0;
  const streakCount = habit?.streak || 0;

  const handleRescueWithFreeze = async () => {
    if (hasFreeze) {
      const success = await useStreakFreeze();
      if (success) {
        setSavedHabitName(habit?.name || '');
        setSavedStreakCount(streakCount);
        await rescueStreak(currentBroken.habitId);
        if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
        setScreen('celebration');
      }
    } else {
      setSavedHabitName(habit?.name || '');
      setSavedStreakCount(streakCount);
      await rescueStreak(currentBroken.habitId);
      if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
      setScreen('celebration');
    }
  };

  const handleGameWin = async () => {
    setSavedHabitName(habit?.name || '');
    setSavedStreakCount(streakCount);
    await rescueStreak(currentBroken!.habitId);
    if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
    setScreen('celebration');
  };

  const handleIgnore = () => {
    useHabitStore.setState(state => ({
      brokenStreaks: state.brokenStreaks.filter(b => b.habitId !== currentBroken?.habitId)
    }));
    setDismissed(true);
    setScreen('main');
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-5">
      <AmberAlertStyles />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90"
        onClick={handleIgnore}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative w-full max-w-[360px] rounded-[36px] border-[1.5px] border-[#E3DAC9]/10 bg-[#212121] amber-alert-card"
      >
        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[36px]">
          {PARTICLE_CONFIG.map((p, i) => (
            <motion.span
              key={i}
              className="amber-particle"
              style={{ left: p.left, top: p.top }}
              animate={{
                y: [0, -18, 0],
                x: [0, i % 2 === 0 ? 10 : -10, 0],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="pt-10 px-8 pb-10">
          
          <AnimatePresence mode="wait">

            {/* SCREEN: MAIN WARNING */}
            {screen === 'main' && habit && (
              <motion.div
                key="main"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="mb-6 -mt-[52px] relative">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-16 h-16 rounded-full bg-[#1a1a1a] border-[3px] border-[#FF4D00] flex items-center justify-center shadow-[0_0_30px_rgba(255,77,0,0.4)]"
                    >
                      <Icon icon="solar:fire-bold" className="text-[#FF4D00]" width={30} />
                    </motion.div>
                  </div>
                  <span className="text-[#FF4D00] text-[9px] font-black font-['Outfit'] uppercase tracking-[0.2em] mb-2">Peringatan</span>
                  <h3 className="text-[20px] font-black font-['Outfit'] text-white leading-tight tracking-[0.2px]">
                    Streak kamu akan hilang
                  </h3>
                  <p className="text-[14px] font-bold font-['Outfit'] text-white mt-1.5">
                    Progress {streakCount} hari akan kembali ke 0
                  </p>
                </div>

                <div className="h-[1px] bg-[#E3DAC9]/8 mb-5" />

                <div className="flex items-center gap-3 p-4 bg-white/[0.03] border border-[#E3DAC9]/15 rounded-[16px] mb-10 relative">
                  <div 
                    className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0 border-[1.5px]"
                    style={{ 
                      backgroundColor: `${HABIT_COLORS[habit.iconName] || CATEGORY_COLORS[habit.category] || '#FF4D00'}15`,
                      borderColor: `${HABIT_COLORS[habit.iconName] || CATEGORY_COLORS[habit.category] || '#FF4D00'}40`
                    }}
                  >
                    <CustomIcon 
                      icon={HABIT_ICONS[habit.iconName] || habit.iconName || 'solar:bolt-bold'} 
                      color={HABIT_COLORS[habit.iconName] || CATEGORY_COLORS[habit.category] || '#FF4D00'}
                      width={22}
                      height={22}
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-black font-['Outfit'] text-white truncate">{habit.name}</span>
                    <span className="text-[10px] font-bold font-['Outfit'] text-[#E3DAC9]/40">Tidak diselesaikan kemarin</span>
                  </div>
                </div>

                <motion.button
                  whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                  onClick={() => { setScreen('options'); if (navigator.vibrate) navigator.vibrate(10); }}
                  className="w-full py-4 bg-[#00FF85] text-black text-[13px] font-black font-['Outfit'] rounded-[14px] uppercase tracking-wider flex items-center justify-center border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1),0_4px_20px_rgba(0,255,133,0.2)] transition-all"
                >
                  Selamatkan Streak
                </motion.button>

                <motion.button
                  whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                  onClick={handleIgnore}
                  className="w-full py-3.5 mt-3 bg-[#FF4D00] rounded-[14px] text-white text-[11px] font-black font-['Outfit'] uppercase tracking-wider border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all"
                >
                  Biarkan Streak Pecah
                </motion.button>

              </motion.div>
            )}

            {/* SCREEN: OPTIONS (Quiz or Freeze) */}
            {screen === 'options' && (
              <motion.div
                key="options"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex flex-col items-center text-center mb-6">
                  <h3 className="text-[18px] font-black font-['Outfit'] text-white leading-tight tracking-tight">
                    Pilih cara rescue
                  </h3>
                  <p className="text-[11px] font-medium font-['Outfit'] text-[#E3DAC9]/40 mt-1.5">
                    Selesaikan tantangan atau gunakan item
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setScreen('game-select')}
                  className="w-full p-4 bg-[#00CC6A] border border-[#00CC6A] rounded-[16px] mb-3 flex items-center gap-4 text-left group"
                >
                  <div className="w-12 h-12 rounded-[12px] bg-black/20 border border-black/20 flex items-center justify-center flex-shrink-0">
                    <Icon icon="solar:gamepad-bold" className="text-black" width={24} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-black font-['Outfit'] text-black">Main Quiz</span>
                    <span className="text-[10px] font-bold font-['Outfit'] text-black/50">Selesaikan tantangan singkat untuk rescue</span>
                  </div>
                  <Icon icon="solar:alt-arrow-right-bold" className="text-black/40 ml-auto flex-shrink-0" width={16} />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRescueWithFreeze}
                  disabled={!hasFreeze}
                  className={`w-full p-4 rounded-[16px] mb-6 flex items-center gap-4 text-left group ${
                    hasFreeze 
                      ? 'bg-[#00D1FF] border border-[#00D1FF]' 
                      : 'bg-[#00D1FF]/20 border border-[#00D1FF]/30 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-[12px] border flex items-center justify-center flex-shrink-0 ${
                    hasFreeze ? 'bg-black/20 border-black/20' : 'bg-white/5 border-white/10'
                  }`}>
                    <Icon icon="solar:snowflake-bold" className={hasFreeze ? 'text-black' : 'text-white/30'} width={24} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[13px] font-black font-['Outfit'] ${hasFreeze ? 'text-black' : 'text-white/60'}`}>
                      Pakai Freeze {hasFreeze && <span className="text-black/60">({profile.streak_freeze_count})</span>}
                    </span>
                    <span className={`text-[10px] font-bold font-['Outfit'] ${hasFreeze ? 'text-black/50' : 'text-white/30'}`}>
                      {hasFreeze ? 'Langsung rescue tanpa tantangan' : 'Kamu tidak punya Streak Freeze'}
                    </span>
                  </div>
                  {hasFreeze && <Icon icon="solar:alt-arrow-right-bold" className="text-black/40 ml-auto flex-shrink-0" width={16} />}
                </motion.button>

                <button
                  onClick={() => setScreen('main')}
                  className="w-full py-3 text-[#E3DAC9]/50 text-[11px] font-bold font-['Outfit'] uppercase tracking-wider hover:text-[#E3DAC9]/70 transition-colors flex items-center justify-center gap-2"
                >
                  <Icon icon="solar:alt-arrow-left-bold" width={14} />
                  Kembali
                </button>
              </motion.div>
            )}

            {/* SCREEN: GAME SELECT */}
            {screen === 'game-select' && (
              <motion.div
                key="game-select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex flex-col items-center text-center mb-6">
                  <h3 className="text-[18px] font-black font-['Outfit'] text-white leading-tight tracking-tight">
                    Pilih tantangan
                  </h3>
                  <p className="text-[11px] font-medium font-['Outfit'] text-[#E3DAC9]/40 mt-1.5">
                    Menangkan game untuk rescue streak
                  </p>
                </div>

                {/* Math Game */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setScreen('math')}
                  className="w-full p-4 bg-white/[0.03] border border-[#E3DAC9]/15 rounded-[16px] mb-3 flex items-center gap-4 text-left hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-12 h-12 rounded-[12px] bg-[#FF9500]/10 border border-[#FF9500]/25 flex items-center justify-center flex-shrink-0">
                    <Icon icon="solar:calculator-bold" className="text-[#FF9500]" width={24} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-black font-['Outfit'] text-white">Math Match</span>
                    <span className="text-[10px] font-bold font-['Outfit'] text-[#E3DAC9]/40">Jawab 3 soal matematika</span>
                  </div>
                  <Icon icon="solar:alt-arrow-right-bold" className="text-[#E3DAC9]/30 ml-auto flex-shrink-0" width={16} />
                </motion.button>

                {/* Type Race */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setScreen('typing')}
                  className="w-full p-4 bg-white/[0.03] border border-[#E3DAC9]/15 rounded-[16px] mb-6 flex items-center gap-4 text-left hover:bg-white/[0.06] transition-colors"
                >
                  <div className="w-12 h-12 rounded-[12px] bg-[#A855F7]/10 border border-[#A855F7]/25 flex items-center justify-center flex-shrink-0">
                    <Icon icon="solar:keyboard-bold" className="text-[#A855F7]" width={24} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-black font-['Outfit'] text-white">Type Race</span>
                    <span className="text-[10px] font-bold font-['Outfit'] text-[#E3DAC9]/40">Ketik kalimat dengan cepat & tepat</span>
                  </div>
                  <Icon icon="solar:alt-arrow-right-bold" className="text-[#E3DAC9]/30 ml-auto flex-shrink-0" width={16} />
                </motion.button>

                <button
                  onClick={() => setScreen('options')}
                  className="w-full py-3 text-[#E3DAC9]/50 text-[11px] font-bold font-['Outfit'] uppercase tracking-wider hover:text-[#E3DAC9]/70 transition-colors flex items-center justify-center gap-2"
                >
                  <Icon icon="solar:alt-arrow-left-bold" width={14} />
                  Kembali
                </button>
              </motion.div>
            )}

            {/* SCREEN: MATH GAME */}
            {screen === 'math' && (
              <motion.div
                key="math"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <MathMatchGame onWin={handleGameWin} onBack={() => setScreen('game-select')} />
              </motion.div>
            )}

            {/* SCREEN: TYPING GAME */}
            {screen === 'typing' && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <TypeRaceGame onWin={handleGameWin} onBack={() => setScreen('game-select')} />
              </motion.div>
            )}

            {/* SCREEN: CELEBRATION */}
            {screen === 'celebration' && (
              <motion.div
                key="celebration"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                className="flex flex-col items-center text-center py-4"
              >
                {/* Confetti emojis */}
                <div className="relative mb-6">
                  <motion.span
                    animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-4 -left-8 text-2xl"
                  >🎉</motion.span>
                  <motion.span
                    animate={{ y: [0, -8, 0], rotate: [0, -15, 15, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
                    className="absolute -top-2 -right-8 text-2xl"
                  >🎊</motion.span>
                  <motion.span
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}
                    className="absolute bottom-0 -left-6 text-xl"
                  >✨</motion.span>
                  <motion.span
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: 0.9 }}
                    className="absolute bottom-0 -right-6 text-xl"
                  >✨</motion.span>

                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-20 h-20 rounded-full bg-[#00CC6A]/15 border-[3px] border-[#00CC6A] flex items-center justify-center shadow-[0_0_40px_rgba(0,204,106,0.4)]"
                  >
                    <Icon icon="solar:shield-check-bold" className="text-[#00CC6A]" width={36} />
                  </motion.div>
                </div>

                <h3 className="text-[20px] font-black font-['Outfit'] text-white leading-tight tracking-tight mb-2">
                  Streak Diselamatkan!
                </h3>
                <p className="text-[13px] font-medium font-['Outfit'] text-[#E3DAC9]/50 mb-2">
                  Selamat, kamu berhasil menyelamatkan
                </p>
                <p className="text-[16px] font-black font-['Outfit'] text-[#00CC6A] mb-8">
                  {savedStreakCount} hari streak "{savedHabitName}"
                </p>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleIgnore}
                  className="w-full py-4 bg-[#00CC6A] text-black text-[13px] font-black font-['Outfit'] rounded-[14px] uppercase tracking-wider flex items-center justify-center shadow-[0_4px_24px_rgba(0,204,106,0.3)]"
                >
                  Lanjutkan
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
