import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface IntensityPickerProps {
  options: number[];
  unit: string;
  defaultValue: number;
  onConfirm: (value: number) => void;
  onCancel: () => void;
}

const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 5;

const IntensityPicker = ({ options, unit, defaultValue, onConfirm, onCancel }: IntensityPickerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const idx = options.indexOf(defaultValue);
    return idx >= 0 ? idx : 0;
  });
  const [isConfirming, setIsConfirming] = useState(false);
  const debounceRef = useRef(false);

  // Scroll to default value on mount
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const targetIndex = options.indexOf(defaultValue);
    const idx = targetIndex >= 0 ? targetIndex : 0;
    const scrollTop = idx * ITEM_HEIGHT;

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      container.scrollTop = scrollTop;
    });
  }, [defaultValue, options]);

  // Handle scroll to detect selected item
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, options.length - 1));

    if (clampedIndex !== selectedIndex) {
      // Haptic feedback on each snap
      if (navigator.vibrate) navigator.vibrate(3);
    }
    setSelectedIndex(clampedIndex);
  }, [options.length, selectedIndex]);

  // Snap to nearest item after scroll ends
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      handleScroll();
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // Snap to nearest item
        const scrollTop = container.scrollTop;
        const index = Math.round(scrollTop / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(index, options.length - 1));
        const targetScroll = clampedIndex * ITEM_HEIGHT;

        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth',
        });
      }, 80);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      clearTimeout(scrollTimeout);
    };
  }, [handleScroll, options.length]);

  const handleConfirm = () => {
    if (debounceRef.current) return;
    debounceRef.current = true;
    setIsConfirming(true);

    const value = options[selectedIndex];
    onConfirm(value);

    setTimeout(() => {
      debounceRef.current = false;
      setIsConfirming(false);
    }, 400);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  // Padding items so the first/last can be centered
  const paddingCount = Math.floor(VISIBLE_ITEMS / 2);

  return (
    <AnimatePresence>
      <motion.div
        key="intensity-picker-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={handleBackdropClick}
        className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          key="intensity-picker-sheet"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="w-full max-w-[420px] rounded-t-[28px] border-t-[2px] border-x-[2px] border-white/10 shadow-[0_-8px_40px_rgba(0,0,0,0.6)]"
          style={{ background: '#141518' }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Title */}
          <div className="text-center px-6 pb-4">
            <h3 className="text-[16px] font-bold font-['Outfit'] text-white/70 tracking-wide uppercase">
              Pilih Intensitas
            </h3>
          </div>

          {/* Scroll Picker */}
          <div className="relative mx-auto" style={{ width: '100%', maxWidth: 280 }}>
            {/* Selection highlight band */}
            <div
              className="absolute left-4 right-4 rounded-2xl border-[1.5px] border-white/15 bg-white/[0.04] pointer-events-none z-10"
              style={{
                top: paddingCount * ITEM_HEIGHT,
                height: ITEM_HEIGHT,
              }}
            />

            {/* Gradient fades top/bottom */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#141518] to-transparent z-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#141518] to-transparent z-20 pointer-events-none" />

            {/* Scrollable list */}
            <div
              ref={scrollRef}
              className="overflow-y-auto no-scrollbar"
              style={{
                height: VISIBLE_ITEMS * ITEM_HEIGHT,
                scrollSnapType: 'y mandatory',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {/* Top padding */}
              {Array.from({ length: paddingCount }).map((_, i) => (
                <div key={`pad-top-${i}`} style={{ height: ITEM_HEIGHT }} />
              ))}

              {/* Options */}
              {options.map((value, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={value}
                    className="flex items-center justify-center gap-3"
                    style={{
                      height: ITEM_HEIGHT,
                      scrollSnapAlign: 'start',
                    }}
                  >
                    <span
                      className="font-bold font-['Outfit'] transition-all duration-200"
                      style={{
                        fontSize: isSelected ? 34 : 18,
                        color: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.2)',
                        transform: isSelected ? 'scale(1)' : 'scale(0.85)',
                        fontWeight: isSelected ? 900 : 600,
                      }}
                    >
                      {value}
                    </span>
                    {isSelected && (
                      <span
                        className="font-bold font-['Outfit'] text-white/50 uppercase tracking-wide"
                        style={{ fontSize: 14 }}
                      >
                        {unit}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Bottom padding */}
              {Array.from({ length: paddingCount }).map((_, i) => (
                <div key={`pad-bot-${i}`} style={{ height: ITEM_HEIGHT }} />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 px-6 pt-6 pb-8">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              className="flex-1 py-3.5 rounded-2xl border-[1.5px] border-white/15 bg-white/5 text-white/60 font-bold font-['Outfit'] text-[14px] tracking-wide uppercase transition-colors active:bg-white/10"
            >
              Batal
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleConfirm}
              disabled={isConfirming}
              className="flex-1 py-3.5 rounded-2xl border-[1.5px] border-[#00FF85]/40 bg-[#00FF85] text-[#141518] font-black font-['Outfit'] text-[14px] tracking-wide uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50"
            >
              Selesai
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IntensityPicker;
