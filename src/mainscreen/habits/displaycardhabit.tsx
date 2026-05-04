import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence, animate } from 'framer-motion';
import { Icon } from '@iconify/react';
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
            className={`w-[5px] h-[5px] rounded-full transition-all duration-500 ease-out`}
            style={{ 
              backgroundColor: isActive ? '#00FF85' : 'rgba(255,255,255,0.1)',
              boxShadow: isActive ? `0 0 10px rgba(0,255,133,0.4)` : 'none',
              border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)'
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

const KartuTugas = ({ habit, index, activeFilter, onDoubleTap }: { habit: any, index: number, activeFilter: string, onDoubleTap: (id: string) => void }) => {
  const { deleteHabit, toggleHabit } = useHabitStore();
  const x = useMotionValue(0);
  
  // Transform values for background actions
  const leftActionOpacity = useTransform(x, [20, 80], [0, 1]);
  const rightActionOpacity = useTransform(x, [-20, -80], [0, 1]);
  const scaleAction = useTransform(x, [-100, 0, 100], [1, 0.95, 1]);

  // Floating logic: buttons move with x but with offsets to create gaps
  // When x > 0 (Revealing Left actions: LOG & EDIT)
  const leftActionX = useTransform(x, [0, 150], [-100, 20]);
  // When x < 0 (Revealing Right actions: LEWATI & HAPUS)
  const rightActionX = useTransform(x, [0, -150], [100, -20]);

  const handleDragEnd = (_: any, info: any) => {
    const currentX = x.get();
    const threshold = 60;
    const velocity = info.velocity.x;

    // Logic for 1-by-1 snapping (Right -> Default -> Left)
    if (currentX > threshold || velocity > 400) {
      // Snap to Left Actions
      animate(x, 150, { type: "spring", stiffness: 600, damping: 35 });
    } else if (currentX < -threshold || velocity < -400) {
      // Snap to Right Actions
      animate(x, -150, { type: "spring", stiffness: 600, damping: 35 });
    } else {
      // Snap back to Default
      animate(x, 0, { type: "spring", stiffness: 800, damping: 45 });
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
    animate(x, 0, { type: "spring", stiffness: 800, damping: 45 }); // Snap back fast after action
  };

  return (
    <div className="relative w-full">
      {/* BACKGROUND ACTIONS */}
      <div className="absolute inset-0 px-4 overflow-hidden">
        {/* Left Side Actions (Revealed on Swipe Right) - LOG & EDIT */}
        <motion.div 
          style={{ 
            opacity: leftActionOpacity, 
            scale: scaleAction,
            x: leftActionX
          }}
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

        {/* Right Side Actions (Revealed on Swipe Left) - LEWATI & HAPUS */}
        <motion.div 
          style={{ 
            opacity: rightActionOpacity, 
            scale: scaleAction,
            x: rightActionX
          }}
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
        dragConstraints={{ left: -170, right: 170 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: "grabbing" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 400,
          damping: 30,
          delay: index * 0.05 
        }}
        onClick={() => activeFilter === 'berjalan' && onDoubleTap(habit.id)}
        className="relative aspect-[16/7.2] rounded-[24px] overflow-hidden border-[1px] border-white/10 shadow-[5px_5px_0px_rgba(0,0,0,1)] active:scale-[0.98] transition-all group cursor-pointer bg-[#1A1A1A] z-10"
      >
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
              {/* Left Info Group: Icon + Frequency */}
              <div className="flex items-center gap-1.5 h-full">
                <div className="w-[16px] h-[16px] flex items-center justify-center">
                  <CustomIcon 
                    icon={HABIT_ICONS[habit.iconName] || habit.iconName || 'solar:bolt-bold'} 
                    width={14} 
                    height={14}
                    color={HABIT_COLORS[habit.iconName] || CATEGORY_COLORS[habit.category] || '#00FF85'}
                  />
                </div>
                <span className="text-[9px] font-black tracking-[0.05em] uppercase text-white/40 leading-none mt-[2px]">
                  {habit.frequency}
                </span>
              </div>
              
              <div className="w-[1.5px] h-[12px] bg-white/20 mx-1" />
              
              {/* Right Info Group: Difficulty */}
              <div className="flex items-center gap-1.5 h-full translate-x-[-2px]">
                <div className="flex items-center justify-center">
                  <DifficultyDots level={habit.difficulty} />
                </div>
                <span className="text-[9px] font-black tracking-[0.05em] uppercase text-white/40 leading-none mt-[2px]">
                  Level
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Completion Overlay */}
        {habit.completed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-20"
          >
            <div className="bg-[#00FF85] p-4 rounded-[24px] shadow-[0_0_30px_rgba(0,255,133,0.3)] border-4 border-black">
              <Icon icon="solar:check-circle-bold" width={40} height={40} className="text-black" />
            </div>
          </motion.div>
        )}

        {/* Skipped Overlay */}
        {habit.skipped && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center z-20"
          >
            <div className="bg-[#FFB800] p-4 rounded-[24px] shadow-[0_0_30px_rgba(255,184,0,0.3)] border-4 border-black">
              <Icon icon="solar:skip-next-bold" width={40} height={40} className="text-black" />
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default KartuTugas;
