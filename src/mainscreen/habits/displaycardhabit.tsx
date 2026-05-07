import { useState } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
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

interface CustomIconProps {
  icon: string;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CustomIcon = ({ icon, width = 24, height = 24, color, className = "", style = {} }: CustomIconProps) => {
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



interface KartuTugasProps {
  habit: any; // Ideally this should be imported from types, but using any for now to match store
  index: number;
  activeFilter: string;
  onDoubleTap: (id: string) => void;
  onEdit?: (habit: any) => void;
}

const KartuTugas = ({ habit, index, activeFilter, onDoubleTap, onEdit }: KartuTugasProps) => {
  const { deleteHabit, toggleHabit, updateHabit, setCompletingHabitId } = useHabitStore();
  const [lastTap, setLastTap] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const x = useMotionValue(0);
  
  const leftActionOpacity = useTransform(x, [20, 80], [0, 1]);
  const rightActionOpacity = useTransform(x, [-20, -80], [0, 1]);
  const scaleAction = useTransform(x, [-100, 0, 100], [1, 0.95, 1]);
  const leftActionX = useTransform(x, [0, 130], [-100, 0]);
  const rightActionX = useTransform(x, [0, -130], [100, 0]);

  const handleDragEnd = (_: any, info: { velocity: { x: number } }) => {
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

  const handleDoubleTapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeFilter !== 'berjalan' || habit.completed || habit.skipped || isCompleting) return;
    
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (navigator.vibrate) navigator.vibrate([20, 50, 20]); 
      setIsCompleting(true);
      setCompletingHabitId(habit.id);
      
      // Reward moment di-tweak jadi 1.5s (Lebih snappy sesuai request Boss)
      setTimeout(() => {
        onDoubleTap(habit.id);
        setTimeout(() => {
          setIsCompleting(false);
          setCompletingHabitId(null);
        }, 500); // Sinkron dengan durasi exit 0.5s
      }, 1500);
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
        if (habit.target_intensity) {
          const newIntensity = (habit.current_intensity || 0) + 1;
          const isDone = newIntensity >= habit.target_intensity;
          
          updateHabit(habit.id, { 
            current_intensity: newIntensity,
            completed: isDone 
          });

          if (isDone) {
             // Handle via local complete state if needed or global
             onDoubleTap(habit.id);
          }
        } else {
          toggleHabit(habit.id, 'completed');
        }
        break;
      case 'edit':
        onEdit?.(habit);
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

      <motion.div
        drag="x"
        dragConstraints={{ left: -140, right: 140 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20, x: 0 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ 
          opacity: 0, 
          scale: 0.8,
          filter: "blur(40px)",
          transition: { 
            duration: 0.5, 
            ease: [0.16, 1, 0.3, 1] 
          } 
        }}
        style={{ 
          x, 
          willChange: "transform, opacity",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          transform: "translateZ(0)"
        }}
        transition={{ type: "spring", stiffness: 400, damping: 35, delay: index * 0.05 }}
        onClick={handleDoubleTapClick}
        className={`relative aspect-[16/7.2] ${isCompleting ? 'z-[2000]' : 'z-10'}`}
      >
        {/* Streak Badge - Positioned even tighter to the corner per Boss request */}
        {Number(habit.streak) >= 0 && (
          <motion.div 
            initial={{ scale: 0, x: 20 }}
            animate={{ scale: 1, x: 0 }}
            className="absolute top-[-10px] right-[-5px] z-20 flex items-center gap-1.5 px-[14px] py-[6px] bg-[#FF4D00] border-[1.5px] border-black shadow-[3.5px_3.5px_0px_rgba(0,0,0,1)] rounded-full"
          >
            <Icon icon="solar:fire-bold" className="text-white w-4 h-4" />
            <span className="text-white text-[13px] font-black font-['Outfit'] leading-none mt-[1px]">
              {habit.streak || 0}
            </span>
          </motion.div>
        )}


        <AnimatePresence>
          {isCompleting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ 
                opacity: 0, 
                scale: 0.5, 
                filter: "blur(15px)",
                transition: { duration: 0.4, ease: "easeInOut" } 
              }}
              className="absolute inset-0 z-[100] rounded-[24px] overflow-hidden pointer-events-none"
              style={{ willChange: "opacity, transform", transform: "translateZ(0)" }}
            >
              {/* Background Expand Animation */}
              <motion.div
                initial={{ scale: 0, borderRadius: "100%" }}
                animate={{ scale: 2.8, borderRadius: "0%" }}
                exit={{ scale: 0, borderRadius: "100%", transition: { duration: 0.4, ease: "easeInOut" } }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 bg-[#00FF85] origin-center"
                style={{ willChange: "transform", transform: "translateZ(0)" }}
              />
              
              {/* Content Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0, transition: { duration: 0.4 } }}
                  transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                >
                  <Icon icon="solar:check-circle-bold" width={54} height={54} className="text-[#1A1A1A]" />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0, transition: { duration: 0.6 } }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-[#1A1A1A] font-black font-['Outfit'] mt-2 text-[14px] tracking-[0.2em] uppercase"
                >
                  TUGAS SELESAI !
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`absolute inset-0 rounded-[24px] overflow-hidden border-[1px] border-white/10 shadow-[8px_8px_0px_rgba(0,0,0,1)] bg-[#1A1A1A] group cursor-pointer transition-all duration-500 ${isCompleting ? 'blur-[12px] scale-[0.98]' : ''}`}>
          <img 
            src={habit.imageUrl} 
            className={`absolute inset-0 w-full h-full object-cover ${habit.imagePosition || 'object-center'} opacity-65`} 
            alt={habit.name} 
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
          
          <div className="absolute inset-0 p-5 flex flex-col justify-end">
            <div>
              <h3 className="text-[22px] font-black font-['Outfit'] text-white mb-1.5 leading-tight tracking-[0.5px]">
                {habit.name}
              </h3>
              
              <div className="flex items-center gap-4 text-white/60 h-5">
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
                
                <div className="flex items-center gap-1.5 h-full translate-x-[-2px]">
                  <DifficultyDots level={habit.difficulty} />
                  <span className="text-[9px] font-black tracking-[0.05em] uppercase text-white/40 leading-none mt-[2px]">
                    Level
                  </span>
                </div>

                {habit.target_intensity && (
                  <>
                    <div className="w-[1.5px] h-[12px] bg-white/20 mx-1" />
                    <div className="flex items-center gap-1.5 h-full">
                      <Icon icon="solar:chart-square-bold" width={14} height={14} className="text-[#00FF85]/60" />
                      <span className="text-[9px] font-black tracking-[0.05em] uppercase text-white/40 leading-none mt-[2px]">
                        {habit.current_intensity || 0}/{habit.target_intensity}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default KartuTugas;
