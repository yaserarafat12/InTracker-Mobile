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
        className={`group h-9 px-3 rounded-xl backdrop-blur-md border-[1.8px] flex items-center justify-between shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer overflow-hidden w-[110px] ${
          isOn 
            ? 'bg-[#212121] border-[#00FF85] text-[#E3DAC9]' 
            : 'bg-[#0D0D0D] border-white/20 text-white/40'
        }`}
      >
        {/* High-Fidelity Spectrum Visualizer - Only show when ON to avoid centering issues */}
        {isOn && (
          <div className="flex items-end gap-[1.5px] h-4 flex-1 justify-center px-1 overflow-hidden transition-all duration-500 opacity-100">
            {[...Array(16)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  height: [
                    "20%",
                    `${40 + Math.sin(i * 0.8) * 30}%`,
                    `${90 - Math.cos(i * 0.5) * 40}%`,
                    "20%"
                  ]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.8 + (i % 3) * 0.2, 
                  ease: "easeInOut",
                  delay: i * 0.05
                }}
                className="w-[2px] rounded-full origin-bottom bg-[#00FF85] shadow-[0_0_10px_rgba(0,255,133,0.5)]"
              />
            ))}
          </div>
        )}

        {/* Info Overlay / Centered Status */}
        {isOn ? (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[8px] font-black tracking-[0.3em] text-[#00FF85] opacity-0 group-hover:opacity-100 transition-opacity">
              {CHANNELS[activeChannel].label}
            </span>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center h-full">
            <span className="text-[10px] font-black tracking-tighter text-white/30 whitespace-nowrap">
              Sound: Off
            </span>
          </div>
        )}

        {/* Compact Next Button */}
        <button 
          onClick={handleNext}
          className={`flex-shrink-0 ml-1.5 w-6 h-6 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-[#00FF85] hover:text-black transition-all active:scale-90 ${isOn ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
        >
          <Icon icon="solar:skip-next-bold" width={12} />
        </button>
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
