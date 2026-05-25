import { useState } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { HABIT_ICONS, HABIT_COLORS, CATEGORY_COLORS, isCustomIcon, getCustomIconKey, HABIT_OPTIONS } from './icons';
import { CUSTOM_SVGS } from '../../utils/icons';
import { useHabitStore } from '../../store/useHabitStore';
import { getPrismStyle } from '../../utils/design';
import { formatIntensityLabel, shouldShowIntensityPicker, getIntensityConfig } from '../../utils/intensityHelpers';
import { getScheduleLabel } from '../../utils/scheduleHelpers';
import IntensityPicker from './IntensityPicker';
import ScheduleEditor from './ScheduleEditor';
import HabitInfoModal from './HabitInfoModal';

// DifficultyDots removed as per user request

export const DifficultyBars = ({ level }: { level?: any }) => null;

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
  isDraggable?: boolean;
  dragControls?: any;
}

const KartuTugas = ({ habit, index, activeFilter, onDoubleTap, onEdit, isDraggable, dragControls }: KartuTugasProps) => {
  const { deleteHabit, toggleHabit, updateHabit, setCompletingHabitId, completeWithIntensity } = useHabitStore();
  const [lastTap, setLastTap] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
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

  const startCompletionAnimation = () => {
    if (isCompleting) return;
    
    if (navigator.vibrate) navigator.vibrate([20, 50, 20]); 
    setIsCompleting(true);
    setCompletingHabitId(habit.id);
    
    // Reward moment 1.5s
    setTimeout(() => {
      onDoubleTap(habit.id);
      // We don't setIsCompleting(false) here immediately to let the card exit with the overlay
      setTimeout(() => {
        setIsCompleting(false);
        setCompletingHabitId(null);
      }, 600); 
    }, 1500);
  };

  const handleDoubleTapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeFilter !== 'berjalan' || habit.completed || habit.skipped || isCompleting) return;
    
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // All habits complete immediately on double-tap (intensity picker only via LOG button)
      startCompletionAnimation();
    } else {
      setLastTap(now);
    }
  };

  const handlePickerConfirm = (value: number) => {
    setShowPicker(false);
    // Just update the target intensity, don't complete the habit
    updateHabit(habit.id, { target_intensity: value });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handlePickerCancel = () => {
    setShowPicker(false);
  };

  const handleScheduleSave = (scheduleType: 'daily' | 'weekly' | 'custom', scheduleDays: number[]) => {
    updateHabit(habit.id, { schedule_type: scheduleType, schedule_days: scheduleDays });
    setShowScheduleEditor(false);
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
        if (shouldShowIntensityPicker(habit.name)) {
          // Numeric habit: show intensity picker via LOG button
          setShowPicker(true);
        } else {
          // Single-action habit: LOG not applicable, give feedback
          if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
          // Do nothing — LOG is only for intensity habits
        }
        break;
      case 'edit':
        setShowScheduleEditor(true);
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
          <motion.button 
            whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
            onClick={() => handleAction('log')}
            className="flex flex-col items-center justify-center gap-1 h-full bg-[#00FF85] border-[1.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] rounded-[24px] text-black transition-all w-full py-1"
          >
            <Icon icon="solar:history-bold" width={22} height={22} />
            <span className="text-[10px] font-black font-['Outfit'] uppercase tracking-widest">Log</span>
          </motion.button>
          <motion.button 
            whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
            onClick={() => handleAction('edit')}
            className="flex flex-col items-center justify-center gap-1 h-full bg-[#E3DAC9] border-[1.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] rounded-[24px] text-black transition-all w-full py-1"
          >
            <Icon icon="solar:pen-new-square-bold" width={22} height={22} />
            <span className="text-[10px] font-black font-['Outfit'] uppercase tracking-widest">Edit</span>
          </motion.button>
        </motion.div>

        <motion.div 
          style={{ opacity: rightActionOpacity, scale: scaleAction, x: rightActionX }}
          className="absolute right-0 top-[5%] bottom-[5%] w-[115px] flex flex-col gap-2 justify-center"
        >
          <motion.button 
            whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
            onClick={() => handleAction('skip')}
            className="flex flex-col items-center justify-center gap-1 h-full bg-[#FFB800] border-[1.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] rounded-[24px] text-black transition-all w-full py-1"
          >
            <Icon icon="solar:skip-next-bold" width={22} height={22} />
            <span className="text-[10px] font-black font-['Outfit'] uppercase tracking-widest">Skip</span>
          </motion.button>
          <motion.button 
            whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
            onClick={() => handleAction('delete')}
            className="flex flex-col items-center justify-center gap-1 h-full bg-[#FF3B30] border-[1.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] rounded-[24px] text-white transition-all w-full py-1"
          >
            <Icon icon="solar:trash-bin-trash-bold" width={22} height={22} />
            <span className="text-[10px] font-black font-['Outfit'] uppercase tracking-widest">Hapus</span>
          </motion.button>
        </motion.div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -140, right: 140 }}
        dragElastic={0.05}
        onDragEnd={handleDragEnd}
        whileTap={{ 
          scale: 0.98,
          boxShadow: "0px 0px 0px rgba(0,0,0,1)",
          transition: { duration: 0.1 }
        }}
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
        {/* Streak Badge - Positioned even tighter to the corner per Bos request */}
        {/* Streak Badge - Hide instantly when completing to avoid glitch */}
        <AnimatePresence>
          {Number(habit.streak) > 0 && !isCompleting && (
            <motion.div 
              key="streak-badge"
              initial={{ scale: 0, x: 20 }}
              animate={{ scale: 1, x: 0 }}
              exit={{ scale: 0, opacity: 0, transition: { duration: 0.1 } }}
              className="absolute top-[-6px] right-[-5px] z-20 flex items-center gap-1.5 px-[14px] py-[6px] bg-[#FF4D00] border-[1.5px] border-black shadow-[3.5px_3.5px_0px_rgba(0,0,0,1)] rounded-full"
            >
              <Icon icon="solar:fire-bold" className="text-white w-4 h-4" />
              <span className="text-white text-[13px] font-black font-['Outfit'] leading-none mt-[1px]">
                {habit.streak || 0}
              </span>
            </motion.div>
          )}
        </AnimatePresence>


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
              className="absolute inset-0 z-[100] rounded-[10px] overflow-hidden pointer-events-none"
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
                  <Icon icon="solar:check-circle-bold" width={54} height={54} className="text-[#212121]" />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0, transition: { duration: 0.6 } }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-[#212121] font-black font-['Outfit'] mt-2 text-[14px] tracking-[0.2em] uppercase"
                >
                  TUGAS SELESAI !
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`absolute inset-0 rounded-[10px] overflow-hidden border-[2px] border-white/15 shadow-[8px_8px_0px_rgba(0,0,0,1)] bg-[#1c1e22] group cursor-pointer transition-all duration-300 ${isCompleting ? 'opacity-0 scale-[0.95]' : ''}`}>
          {/* Background Image from HABIT_OPTIONS */}
          {(() => {
            // Prioritize name match over iconName match to avoid collisions
            const option = HABIT_OPTIONS.find(o => o.name.toLowerCase() === habit.name?.toLowerCase()) 
              || HABIT_OPTIONS.find(o => o.iconName === habit.iconName);
            if (option && option.imageUrl) {
              return (
                <img 
                  src={option.imageUrl} 
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover ${option.imagePosition || 'object-center'} opacity-[0.85] z-0 transition-transform duration-500 group-hover:scale-110`}
                />
              );
            }
            // Gradient fallback for custom habits
            const catColor = habit.color || '#00FF85';
            return (
              <img 
                src="/all_images/custom_habit_bg.png" 
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-[0.7] z-0"
              />
            );
          })()}
          
          <div className="absolute inset-0 bg-black/40 z-[1]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent z-[2]" />
          
          {/* Info Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowInfoModal(true);
            }}
            className="absolute top-3 left-3 z-20 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
          >
            <Icon icon="ph:info-bold" width={14} height={14} className="text-white" />
          </button>
          
          <div className="absolute inset-0 p-5 flex flex-col justify-end z-10">
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
                    {getScheduleLabel({ schedule_type: habit.schedule_type || 'daily', schedule_days: habit.schedule_days || [0,1,2,3,4,5,6] })}
                  </span>
                </div>
                
                {(() => {
                  const intensityLabel = formatIntensityLabel(habit.name, habit.target_intensity);
                  if (!intensityLabel) return null;
                  return (
                    <>
                      <div className="w-[1.5px] h-[12px] bg-white/20 mx-1" />
                      <div className="flex items-center gap-1.5 h-full">
                        <Icon icon="solar:chart-square-bold" width={14} height={14} className="text-[#00FF85]/60" />
                        <span className="text-[10px] font-bold tracking-[0.03em] text-white/50 leading-none mt-[1px] font-['Outfit']">
                          {intensityLabel}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Long Press to Drag Trigger - Top Layer */}
        <div 
          onPointerDown={(e) => {
            if (!isDraggable || isCompleting) return;
            
            const startX = e.clientX;
            const startY = e.clientY;
            
            const timer = setTimeout(() => {
              if (navigator.vibrate) navigator.vibrate(30);
              dragControls?.start(e);
            }, 250); // Reduced to 250ms for better responsiveness

            const handleMove = (moveEvent: PointerEvent) => {
              const dist = Math.sqrt(
                Math.pow(moveEvent.clientX - startX, 2) + 
                Math.pow(moveEvent.clientY - startY, 2)
              );
              if (dist > 10) clearTimeout(timer);
            };

            const handleUp = () => {
              clearTimeout(timer);
              window.removeEventListener('pointermove', handleMove);
              window.removeEventListener('pointerup', handleUp);
            };

            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleUp);
          }}
          onContextMenu={(e) => e.preventDefault()}
          style={{ touchAction: 'none' }}
          className="absolute inset-0 z-[10] cursor-grab active:cursor-grabbing"
        />
      </motion.div>

      {/* Intensity Picker for numeric habits */}
      {showPicker && (() => {
        const config = getIntensityConfig(habit.name);
        if (!config) return null;
        return (
          <IntensityPicker
            options={config.options}
            unit={config.unit}
            defaultValue={config.defaultValue}
            onConfirm={handlePickerConfirm}
            onCancel={handlePickerCancel}
          />
        );
      })()}

      {/* Schedule Editor bottom sheet */}
      <ScheduleEditor
        isOpen={showScheduleEditor}
        onClose={() => setShowScheduleEditor(false)}
        currentScheduleType={habit.schedule_type || 'daily'}
        currentScheduleDays={habit.schedule_days || [0,1,2,3,4,5,6]}
        onSave={handleScheduleSave}
      />

      {/* Habit Info Modal */}
      <HabitInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        habit={habit}
      />
    </div>
  );
};

export default KartuTugas;
