import { useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

const TRACK_URL = '/sound/lofi_main.mp3';

export const AmbientPlayer = () => {
  const [isOn, setIsOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Lazy init audio element on first click (browser autoplay policy)
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(TRACK_URL);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
    }
    return audioRef.current;
  }, []);

  // Cleanup on unmount — stop audio
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const handleToggle = () => {
    const audio = getAudio();
    if (isOn) {
      audio.pause();
      audio.currentTime = 0;
      setIsOn(false);
    } else {
      audio.play().catch(err => console.error('[InTracker] Audio play failed:', err));
      setIsOn(true);
    }
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <div className="relative flex items-center">
      <motion.button
        whileTap={{ x: 2, y: 2, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
        onClick={handleToggle}
        className="w-11 h-11 bg-[#00FF85] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center transition-all"
      >
        {isOn ? (
          <div className="flex items-end gap-[2px] h-5 px-1">
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
                className="w-[3px] rounded-full origin-bottom bg-black"
              />
            ))}
          </div>
        ) : (
          <Icon icon="solar:music-note-bold" width={20} className="text-black" />
        )}
      </motion.button>
    </div>
  );
};
