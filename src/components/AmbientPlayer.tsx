import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

const CHANNELS = [
  { id: 'neon-rain', label: 'Neon Rain', icon: '🌧️', url: '/sound/track1.mp3' },
  { id: 'cyber-cafe', label: 'Cyber Café', icon: '☕', url: '/sound/track2.mp3' },
  { id: 'deep-space', label: 'Deep Space', icon: '🛸', url: '/sound/track3.mp3' },
];

export const AmbientPlayer = () => {
  const [isOn, setIsOn] = useState(false);
  const [activeChannel, setActiveChannel] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isOn) {
        audioRef.current.play().catch(err => console.error("Audio play failed:", err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isOn, activeChannel]);

  const handleToggle = () => {
    setIsOn(!isOn);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling OFF
    setActiveChannel((prev) => (prev + 1) % CHANNELS.length);
  };

  return (
    <div className="relative flex items-center">
      <motion.div 
        layout
        initial={false}
        onClick={handleToggle}
        className={`h-9 px-3 rounded-xl backdrop-blur-md border-[1.8px] flex items-center justify-between shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer overflow-hidden min-w-[110px] ${
          isOn 
            ? 'bg-[#1A1A1A] border-[#00FF85] text-[#E3DAC9]' 
            : 'bg-[#0D0D0D] border-[#E3DAC9]/30 text-[#E3DAC9]/70'
        }`}
      >
        {/* Status Icon */}
        <motion.div layout className="flex-shrink-0">
          <Icon 
            icon={isOn ? "solar:volume-loud-bold" : "solar:volume-mute-bold"} 
            width={16} 
            className={isOn ? "text-[#00FF85] animate-pulse" : ""}
          />
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {!isOn ? (
            <motion.span 
              key="off"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-[10px] font-black font-['Outfit'] uppercase tracking-[0.1em] whitespace-nowrap ml-auto"
            >
              Sound: OFF
            </motion.span>
          ) : (
            <motion.div 
              key="on"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2.5 flex-1 justify-end"
            >
              {/* High-Density Visualizer */}
              <div className="flex items-end gap-[1.2px] h-3.5 pr-2 border-r border-white/10 flex-1 justify-center ml-2">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      height: isOn ? ['20%', '100%', '40%', '90%', '20%'] : '20%' 
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.5 + (Math.random() * 0.5), 
                      ease: "easeInOut",
                      delay: i * 0.05
                    }}
                    className={`w-[1.4px] rounded-full origin-bottom ${isOn ? 'bg-[#00FF85]' : 'bg-white/20'}`}
                  />
                ))}
              </div>

              {/* Mini Next Button - SHRUNK */}
              <button 
                onClick={handleNext}
                className="w-4 h-4 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#00FF85] hover:text-black transition-all active:scale-90 flex-shrink-0"
              >
                <Icon icon="solar:skip-next-bold" width={10} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <audio
        ref={audioRef}
        src={CHANNELS[activeChannel].url}
        loop
        preload="auto"
      />
    </div>
  );
};
