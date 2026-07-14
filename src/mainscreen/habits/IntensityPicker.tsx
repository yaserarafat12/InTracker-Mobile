import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useTranslation } from '../../i18n';

export interface IntensityPickerProps {
  options: number[];
  unit: string;
  defaultValue: number;
  onConfirm: (value: number) => void;
  onCancel: () => void;
}

const PickerItem = ({ value, unit, itemPos, containerScrollY, isActive, isLight }: any) => {
  const relativeY = useTransform(containerScrollY, [itemPos - 130, itemPos, itemPos + 130], [-1, 0, 1]);
  const rotateX = useTransform(relativeY, [-1, 0, 1], [60, 0, -60]);
  const opacity = useTransform(relativeY, [-1, -0.6, 0, 0.6, 1], [0.05, 0.3, 1, 0.3, 0.05]);
  const scale = useTransform(relativeY, [-1, 0, 1], [0.75, 1.1, 0.75]);
  const z = useTransform(relativeY, [-1, 0, 1], [-100, 50, -100]);

  return (
    <motion.div
      data-value={value}
      style={{ rotateX, opacity, scale, z, transformStyle: 'preserve-3d' }}
      className="picker-item snap-center h-[52px] flex items-center justify-center flex-shrink-0 w-full"
    >
      <div className="flex items-baseline gap-1.5">
        <span className={`text-[32px] font-bold tracking-normal transition-all duration-300 font-['Rajdhani'] ${isActive ? (isLight ? 'text-black' : 'text-white') : (isLight ? 'text-black/25' : 'text-[#E3DAC9]/30')}`}>
          {value}
        </span>
        <span className={`text-[12px] font-bold capitalize transition-all duration-300 font-['Outfit'] ${isActive ? (isLight ? 'text-black/60' : 'text-white/60') : (isLight ? 'text-black/15' : 'text-white/10')}`}>
          {unit}
        </span>
      </div>
    </motion.div>
  );
};

const IntensityPicker = ({ options, unit, defaultValue, onConfirm, onCancel }: IntensityPickerProps) => {
  const { t } = useTranslation();
  const isLight = !document.documentElement.classList.contains('dark');
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerScrollY = useMotionValue(0);
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const idx = options.indexOf(defaultValue);
    return idx >= 0 ? idx : 0;
  });
  const [isConfirming, setIsConfirming] = useState(false);
  const lastVibrateRef = useRef<number | null>(null);

  const handlePickerScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    containerScrollY.set(container.scrollTop);
    const items = container.querySelectorAll('.picker-item');
    const containerCenter = container.getBoundingClientRect().top + container.offsetHeight / 2;
    let closestValue = null;
    let minDistance = Infinity;
    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const distance = Math.abs(containerCenter - itemCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestValue = Number(item.getAttribute('data-value'));
      }
    });

    if (closestValue !== null) {
      const idx = options.indexOf(closestValue);
      if (idx !== -1 && idx !== selectedIndex) {
        setSelectedIndex(idx);
        if (navigator.vibrate && lastVibrateRef.current !== closestValue) {
          navigator.vibrate(5);
          lastVibrateRef.current = closestValue;
        }
      }
    }
  }, [options, selectedIndex, containerScrollY]);

  // Scroll to default value on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        const idx = options.indexOf(defaultValue);
        const startIdx = idx >= 0 ? idx : 0;
        scrollRef.current.scrollTop = startIdx * 52;
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [defaultValue, options]);

  const handleConfirm = () => {
    if (isConfirming) return;
    setIsConfirming(true);
    if (navigator.vibrate) navigator.vibrate(5);
    onConfirm(options[selectedIndex]);
    setTimeout(() => setIsConfirming(false), 400);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="intensity-picker-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleBackdropClick}
        className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          key="intensity-picker-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className={`w-full max-w-[420px] rounded-t-[32px] p-6 pb-10 flex flex-col h-[55vh] border-t-[3px] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] ${
            isLight 
              ? 'bg-white border-black shadow-[0_-10px_30px_rgba(0,0,0,0.12)]' 
              : 'bg-[#16181c] border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]'
          }`}
        >
          {/* Handle bar */}
          <div className={`w-10 h-1 rounded-full mx-auto mb-5 ${isLight ? 'bg-black/15' : 'bg-white/10'}`} />

          {/* Title */}
          <h3 className={`text-[16px] font-black font-['Outfit'] text-center mb-6 ${isLight ? 'text-black' : 'text-[#E3DAC9]'}`}>
            {t('habits.picker.title')}
          </h3>

          {/* Scroll Picker Container */}
          <div className="relative w-full h-[300px] overflow-hidden flex items-center justify-center">
            {/* Selection highlight band */}
            <div className={`absolute inset-x-4 h-[52px] pointer-events-none z-0 rounded-xl border-[2px] ${
              isLight 
                ? 'bg-[#6ED7A0]/12 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' 
                : 'bg-[#6ED7A0]/8 border-[#6ED7A0]/25'
            }`} />
            
            {/* Scrollable list */}
            <div
              ref={scrollRef}
              onScroll={handlePickerScroll}
              style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
              className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory px-4 py-[124px] flex flex-col items-center scroll-smooth relative z-10"
            >
              {options.map((opt: number, idx: number) => (
                <PickerItem 
                  key={opt} 
                  value={opt} 
                  unit={unit} 
                  itemPos={idx * 52} 
                  containerScrollY={containerScrollY} 
                  isActive={selectedIndex === idx} 
                  isLight={isLight} 
                />
              ))}
            </div>
            
            {/* Gradient fades top/bottom */}
            <div className={`absolute top-0 inset-x-0 h-20 bg-gradient-to-b to-transparent pointer-events-none z-20 ${isLight ? 'from-white' : 'from-[#16181c]'}`} />
            <div className={`absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t to-transparent pointer-events-none z-20 ${isLight ? 'from-white' : 'from-[#16181c]'}`} />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className={`flex-1 h-[48px] rounded-xl font-black font-['Outfit'] uppercase tracking-[0.15em] text-[12px] border transition-all ${
                isLight
                  ? 'border-[1.5px] border-[#ff3b30] text-[#ff3b30] bg-white hover:bg-[#FFF5F5] shadow-sm'
                  : 'border-[1.5px] border-[#FF3B30] text-[#FF3B30] bg-[#FF3B30]/5 hover:bg-[#FF3B30]/15 shadow-none'
              }`}
            >
              {t('habits.picker.cancel')}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleConfirm}
              disabled={isConfirming}
              className={`flex-[1.5] h-[48px] rounded-xl font-black font-['Outfit'] uppercase tracking-[0.15em] text-[12px] border transition-all flex items-center justify-center ${
                isLight
                  ? 'bg-[#00b577] text-white border-[1.5px] border-[#00b577] hover:bg-[#009e66] shadow-sm'
                  : 'bg-[#00FF85] text-black border-[1.5px] border-[#00FF85] hover:bg-[#00e676] shadow-none'
              }`}
            >
              {t('habits.picker.confirm')}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IntensityPicker;
