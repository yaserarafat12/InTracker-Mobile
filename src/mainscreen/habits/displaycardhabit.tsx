import { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, animate } from 'framer-motion';
import { Icon } from '@iconify/react';
import confetti from 'canvas-confetti';
import { HABIT_ICONS, HABIT_COLORS, CATEGORY_COLORS, isCustomIcon, getCustomIconKey } from './icons';
import { CUSTOM_SVGS } from '../../utils/icons';
import { useHabitStore } from '../../store/useHabitStore';

export const DifficultyDots = ({ level }: { level: number }) => {
  return (
    <div className="flex items-center gap-[4px] h-full">
      {[1, 2, 3].map((i) => {
        const isActive = i <= level;
        return (
          <div 
            key={i} 
            className={`w-[5px] h-[5px] rounded-full transition-all duration-200 ease-out`}
            style={{ 
              backgroundColor: isActive ? '#00FF85' : 'rgba(255,255,255,0.05)',
              boxShadow: isActive ? `0 0 10px rgba(0,255,133,0.3)` : 'none',
              border: isActive ? 'none' : '1px solid rgba(255,255,255,0.05)'
            }}
          />
        );
      })}
    </div>
  );
};

export const DifficultyBars = DifficultyDots;

export const CustomIcon = ({ icon, width = 24, height = 24, color, className = "", style = {} }: any) => {
  const iconColor = color || style.color || 'currentColor';
  
  if (isCustomIcon(icon)) {
    const svgKey = getCustomIconKey(icon);
    const svgContent = CUSTOM_SVGS[svgKey] || '';
    const cleanSvg = svgContent.replace(/<svg([^>]*)>/i, (match, group1) => {
      const cleaned = group1.replace(/width="[^"]*"/gi, '').replace(/height="[^"]*"/gi, '');
      return `<svg${cleaned} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;
    });
    return (
      <div 
        className={`${className} flex items-center justify-center`}
        style={{ width, height, color: iconColor, ...style }}
        dangerouslySetInnerHTML={{ __html: cleanSvg }} 
      />
    );
  }
  return (
    <div className={`${className} flex items-center justify-center`} style={{ width, height, ...style }}>
      <Icon icon={icon} width="100%" height="100%" style={{ color: iconColor }} />
    </div>
  );
};

const StreakBadge = ({ streak = 0 }: { streak?: number }) => {
  const displayStreak = streak > 0 ? streak : 1; 
  
  // Design matching the header fire badge but more compact
  const badgeColor = '#FF4D00'; 
  const icon = 'solar:fire-bold';

  return (
    <motion.div 
      initial={{ scale: 0, rotate: 15 }}
      animate={{ scale: 1, rotate: 0 }}
      className="absolute -top-3 -right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-[#FF4D00] border-[1.5px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:scale-95 transition-transform"
    >
      <Icon icon={icon} width={14} height={14} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
      <span className="text-[12px] font-black font-['Outfit'] text-white leading-none">
        {displayStreak}
      </span>
    </motion.div>
  );
};

const KartuTugas = ({ habit, index, activeFilter, onDoubleTap }: { habit: any, index: number, activeFilter: string, onDoubleTap: (id: string) => void }) => {
  const { deleteHabit, toggleHabit } = useHabitStore();
  const [lastTap, setLastTap] = useState(0);
  const x = useMotionValue(0);
  
  // Transform values for background actions
  const leftActionOpacity = useTransform(x, [20, 80], [0, 1]);
  const rightActionOpacity = useTransform(x, [-20, -80], [0, 1]);
  const scaleAction = useTransform(x, [-100, 0, 100], [1, 0.95, 1]);

  const leftActionX = useTransform(x, [0, 130], [-100, 0]);
  const rightActionX = useTransform(x, [0, -130], [100, 0]);

  const handleDragEnd = (_: any, info: any) => {
    const currentX = x.get();
    const threshold = 60;
    const velocity = info.velocity.x;

    if (currentX > threshold || velocity > 400) {
      animate(x, 130, { type: "spring", stiffness: 600, damping: 35 });
    } else if (currentX < -threshold || velocity < -400) {
      animate(x, -130, { type: "spring", stiffness: 600, damping: 35 });
    } else {
      animate(x, 0, { type: "spring", stiffness: 800, damping: 45 });
    }
  };

  const handleDoubleTapClick = () => {
    if (activeFilter !== 'berjalan' || habit.completed || habit.skipped) return;
    
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (navigator.vibrate) navigator.vibrate([15, 30, 15]); // More premium haptic pattern
      
      // TRIGGER CONFETTI!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00FF85', '#FF4D00', '#FFFFFF'],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
      });

      onDoubleTap(habit.id);
      setLastTap(0);
    } else {
      setLastTap(now);
    }
  };

  const handleAction = (type: 'skip' | 'delete' | 'log' | 'edit') => {
    if (navigator.vibrate) navigator.vibrate(15);
    
    switch (type) {
      case 'skip':
        toggleHabit(habit.id, 'skipped');
        break;
      case 'delete':
        if (confirm(`Hapus habit "${habit.name}"?`)) {
          deleteHabit(habit.id);
        }
        break;
      case 'log':
        alert('Logging progress...');
        break;
      case 'edit':
        alert('Edit functionality coming soon!');
        break;
    }
    animate(x, 0, { type: "spring", stiffness: 800, damping: 45 });
  };

  return (
    <div className="relative w-full">
      {/* BACKGROUND ACTIONS */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          style={{ opacity: leftActionOpacity, scale: scaleAction, x: leftActionX }}
          className="absolute left-0 top-[5%] bottom-[5%] w-[115px] flex flex-col gap-2 justify-center"
        >
          <button 
            onClick={() => handleAction('log')}
            className="flex flex-col items-center justify-center gap-1 h-full bg-[#00FF85] border-[1.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] rounded-[24px] text-black active:scale-95 transition-transform w-full py-1"
          >
            <Icon icon="solar:history-bold" width={22} height={22} />
            <span className="text-[10px] font-black font-['Outfit'] uppercase tracking-widest">Log</span>
          </button>
          <button 
            onClick={() => handleAction('edit')}
            className="flex flex-col items-center justify-center gap-1 h-full bg-[#E3DAC9] border-[1.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] rounded-[24px] text-black active:scale-95 transition-transform w-full py-1"
          >
            <Icon icon="solar:pen-new-square-bold" width={22} height={22} />
            <span className="text-[10px] font-black font-['Outfit'] uppercase tracking-widest">Edit</span>
          </button>
        </motion.div>

        <motion.div 
          style={{ opacity: rightActionOpacity, scale: scaleAction, x: rightActionX }}
          className="absolute right-0 top-[5%] bottom-[5%] w-[115px] flex flex-col gap-2 justify-center"
        >
          <button 
            onClick={() => handleAction('skip')}
            className="flex flex-col items-center justify-center gap-1 h-full bg-[#FFB800] border-[1.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] rounded-[24px] text-black active:scale-95 transition-transform w-full py-1"
          >
            <Icon icon="solar:skip-next-bold" width={22} height={22} />
            <span className="text-[10px] font-black font-['Outfit'] uppercase tracking-widest">Skip</span>
          </button>
          <button 
            onClick={() => handleAction('delete')}
            className="flex flex-col items-center justify-center gap-1 h-full bg-[#FF3B30] border-[1.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] rounded-[24px] text-white active:scale-95 transition-transform w-full py-1"
          >
            <Icon icon="solar:trash-bin-trash-bold" width={22} height={22} />
            <span className="text-[10px] font-black font-['Outfit'] uppercase tracking-widest">Hapus</span>
          </button>
        </motion.div>
      </div>

      {/* MAIN CARD */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -140, right: 140 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: "grabbing", scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30, delay: index * 0.05 }}
        onClick={handleDoubleTapClick}
        className="relative aspect-[16/7.2] z-10"
      >
        {/* NEW: StreakBadge positioned absolutely to the swipable container */}
        <StreakBadge streak={habit.streak} />

        {/* INNER CONTAINER with Overflow Hidden */}
        <div className="absolute inset-0 rounded-[24px] overflow-hidden border-[1px] border-white/10 shadow-[5px_5px_0px_rgba(0,0,0,1)] bg-[#1A1A1A] group cursor-pointer transition-all">
          {/* Background Image */}
          <img 
            src={habit.imageUrl} 
            className={`absolute inset-0 w-full h-full object-cover ${habit.imagePosition || 'object-center'} opacity-65 group-hover:opacity-85 transition-opacity duration-500`} 
            alt={habit.name} 
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
          
          <div className="absolute inset-0 p-5 flex flex-col justify-end">
            <div>
              <h3 className="text-[22px] font-black font-['Outfit'] text-white mb-1.5 leading-tight tracking-[0.5px]">
                {habit.name}
              </h3>
              
              <div className="flex items-center gap-4 text-white/60 h-5">
                {/* Frequency */}
                <div className="flex items-center gap-1.5 h-full">
                  <CustomIcon 
                    icon={HABIT_ICONS[habit.iconName] || habit.iconName || 'solar:bolt-bold'} 
                    width={14} 
                    height={14}
                    color={HABIT_COLORS[habit.iconName] || CATEGORY_COLORS[habit.category] || '#00FF85'}
                  />
                  <span className="text-[9px] font-black tracking-[0.05em] uppercase text-white/40 leading-none mt-[2px]">
                    {habit.frequency}
                  </span>
                </div>
                
                <div className="w-[1.5px] h-[12px] bg-white/20 mx-1" />
                
                {/* Difficulty */}
                <div className="flex items-center gap-1.5 h-full translate-x-[-2px]">
                  <DifficultyDots level={habit.difficulty} />
                  <span className="text-[9px] font-black tracking-[0.05em] uppercase text-white/40 leading-none mt-[2px]">
                    Level
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Completion Overlay */}
          <AnimatePresence>
            {habit.completed && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-20"
              >
                <motion.div 
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [0.5, 1.2, 1] }}
                  transition={{ duration: 0.4, ease: "backOut" }}
                  className="bg-[#00FF85] p-4 rounded-[24px] shadow-[0_0_40px_rgba(0,255,133,0.5)] border-4 border-black"
                >
                  <Icon icon="solar:check-circle-bold" width={44} height={44} className="text-black" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skipped Overlay */}
          <AnimatePresence>
            {habit.skipped && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-20"
              >
                <div className="bg-[#FFB800] p-4 rounded-[24px] shadow-[0_0_30px_rgba(255,184,0,0.3)] border-4 border-black">
                  <Icon icon="solar:skip-next-bold" width={40} height={40} className="text-black" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default KartuTugas;
