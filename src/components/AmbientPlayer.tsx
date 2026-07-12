import { useState, useCallback, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useUserStore } from '../store/useUserStore';

const TRACK_URL = '/sound/lofi_main.mp3';

// Module-level global Audio singleton
let globalAudio: HTMLAudioElement | null = null;

const getGlobalAudio = () => {
  if (typeof window === 'undefined') return null;
  if (!globalAudio) {
    globalAudio = new Audio(TRACK_URL);
    globalAudio.loop = true;
    globalAudio.volume = 0.5;
  }
  return globalAudio;
};

export const AmbientPlayer = () => {
  const [isOn, setIsOn] = useState(false);
  const { settings } = useUserStore();
  const isLight = settings?.theme === 'Light';

  // Sync state with global audio on mount
  useEffect(() => {
    const audio = getGlobalAudio();
    if (audio) {
      setIsOn(!audio.paused && audio.src !== '');
    }
  }, []);

  const handleToggle = () => {
    const audio = getGlobalAudio();
    if (!audio) return;

    if (isOn) {
      audio.pause();
      audio.currentTime = 0;
      setIsOn(false);
    } else {
      audio.play().catch(err => console.error('[InRising] Audio play failed:', err));
      setIsOn(true);
    }
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <div className="relative flex items-center">
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleToggle}
        className={`w-10 h-10 border-2 border-[#6ED7A0] rounded-[10px] shadow-[2px_2px_0px_rgba(110,215,160,0.35)] flex items-center justify-center transition-all ${
          isLight ? 'bg-[#EAFDF5] text-[#00C265]' : 'bg-[#6ED7A0]/15 text-[#6ED7A0]'
        }`}
      >
        {isOn ? (
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
          <Icon icon="solar:music-note-bold" width={20} className={isLight ? 'text-[#00C265]' : 'text-[#6ED7A0]'} />
        )}
      </motion.button>
    </div>
  );
};
