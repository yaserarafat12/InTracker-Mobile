import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup, useMotionValue, useTransform } from 'framer-motion';
import { Icon } from '@iconify/react';
import { HABIT_OPTIONS, HABIT_ICONS, HABIT_COLORS, getCustomIconKey, CATEGORY_ICONS, CATEGORY_COLORS } from './icons';
import { CustomIcon, DifficultyBars } from './displaycardhabit';

const PickerItem = ({ value, unit, itemPos, containerScrollY, isActive }: any) => {
  // Center is at 0 distance from containerScrollY (since padding handles centering)
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
      <div className="flex items-baseline gap-2 font-['Inter']">
        <span className={`text-[32px] font-semibold transition-all duration-300 ${isActive ? 'text-white' : 'text-[#E3DAC9]/40'}`}>
          {value}
        </span>
        <span className={`text-[12px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? 'text-white/60' : 'text-white/10'}`}>
          {unit}
        </span>
      </div>
    </motion.div>
  );
};

export const TambahHabitModal = ({ 
  isOpen, 
  onClose, 
  onAddHabit,
  currentHabits = [] 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onAddHabit: (habit: any) => void,
  currentHabits?: any[]
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>('Rutinitas');
  const scrollRef = useRef<HTMLDivElement>(null);
  const catBarRef = useRef<HTMLDivElement>(null);
  
  const categories = [
    'Semua',
    'Rutinitas',
    'Ketenangan Diri',
    'Evolusi Diri',
    'Latihan Fisik'
  ];

  // Scroll to top logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0 }); // Instant scroll
    }
  }, [selectedCategory]);

  // Manual Scroll Tracking for "Semua" mode
  const lastActiveSubRef = useRef<string | null>(activeSubCategory);

  const handleScroll = useCallback(() => {
    if (selectedCategory !== 'Semua' || !scrollRef.current) return;

    const container = scrollRef.current;
    const markers = container.querySelectorAll('.category-marker');
    let currentCat = 'Rutinitas';

    // Threshold: trigger slightly before the marker hits the top area
    const threshold = 150; 

    markers.forEach((marker) => {
      const rect = marker.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      // Check if this marker has crossed the trigger line
      if (rect.top - containerRect.top <= threshold) {
        currentCat = marker.getAttribute('data-category') || currentCat;
      }
    });

    if (currentCat !== lastActiveSubRef.current) {
      lastActiveSubRef.current = currentCat;
      setActiveSubCategory(currentCat);
    }
  }, [selectedCategory]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (selectedCategory === 'Semua' && scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); // Initial check
    }
    return () => scrollContainer?.removeEventListener('scroll', handleScroll);
  }, [selectedCategory, handleScroll]);

  // Auto-scroll category bar to active sub-category
  useEffect(() => {
    if (selectedCategory === 'Semua' && activeSubCategory && catBarRef.current) {
      const activeBtn = catBarRef.current.querySelector(`[data-cat="${activeSubCategory}"]`) as HTMLElement;
      if (activeBtn) {
        const container = catBarRef.current;
        // Adjust scroll to keep it next to the sticky "Semua" button (approx 160px from left)
        const stickyWidth = 150; 
        const targetScroll = activeBtn.offsetLeft - stickyWidth - 24; 
        container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
      }
    }
  }, [activeSubCategory, selectedCategory]);

  // Group habits by category for "Semua" view
  const groupedHabits = useMemo(() => {
    return categories.filter(c => c !== 'Semua').map(cat => ({
      category: cat,
      habits: HABIT_OPTIONS.filter(h => h.category === cat)
    })).filter(g => g.habits.length > 0);
  }, [categories]);

  const availableHabits = HABIT_OPTIONS.filter(h => 
    selectedCategory === 'Semua' || h.category === selectedCategory
  );

  const [selectedHabitForConfig, setSelectedHabitForConfig] = useState<any>(null);
  const [intensityValue, setIntensityValue] = useState<number | null>(8); // Default to 8 (suitable for most things like water)
  const [showIntensityPicker, setShowIntensityPicker] = useState(false);
  const containerScrollY = useMotionValue(0);

  // Set default intensity when habit is selected
  useEffect(() => {
    if (selectedHabitForConfig) {
      if (selectedHabitForConfig.name.includes('Hidrasi')) {
        setIntensityValue(8);
      } else if (selectedHabitForConfig.intensity?.options) {
        // Set middle option as default if not hydration
        const opts = selectedHabitForConfig.intensity.options;
        setIntensityValue(opts[Math.floor(opts.length / 2)]);
      }
    }
  }, [selectedHabitForConfig]);

  const handleAdd = (habitBase: any, intensity: number | null) => {
    const newHabit = {
      ...habitBase,
      completed: false,
      skipped: false,
      targetIntensity: intensity,
      currentIntensity: 0
    };
    onAddHabit(newHabit);
    onClose();
  };

  // Intensity Picker Scroll Detection
  const pickerRef = useRef<HTMLDivElement>(null);
  const lastVibrateRef = useRef<number | null>(null);

  const handlePickerScroll = useCallback(() => {
    if (!pickerRef.current || !selectedHabitForConfig) return;
    
    const container = pickerRef.current;
    const scrollTop = container.scrollTop;
    containerScrollY.set(scrollTop);

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

    if (closestValue !== null && closestValue !== intensityValue) {
      setIntensityValue(closestValue);
      // Trigger haptic "trek-trek" only when value actually changes
      if (navigator.vibrate && lastVibrateRef.current !== closestValue) {
        // iPhone-style short haptic
        navigator.vibrate(5); 
        lastVibrateRef.current = closestValue;
      }
    }
  }, [selectedHabitForConfig, intensityValue, containerScrollY]);

  // Sync picker scroll position when shown
  useEffect(() => {
    if (showIntensityPicker && pickerRef.current && selectedHabitForConfig?.intensity?.options) {
      const options = selectedHabitForConfig.intensity.options;
      const index = options.indexOf(intensityValue);
      if (index !== -1) {
        // Small delay to ensure modal animation doesn't interfere
        setTimeout(() => {
          if (pickerRef.current) {
            pickerRef.current.scrollTop = index * 52; // 52px is picker item height
          }
        }, 100);
      }
    }
  }, [showIntensityPicker, selectedHabitForConfig]);

  // Internal component for Habit Card
  const HabitCard = ({ habit, index }: { habit: any, index: number }) => {
    const iconStr = HABIT_ICONS[habit.iconName] || 'solar:bolt-bold';
    return (
      <motion.div
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate(5);
          setSelectedHabitForConfig(habit);
          if (habit.intensity?.type === 'numeric') {
            setIntensityValue(habit.intensity.defaultValue || habit.intensity.options?.[0] || 1);
          } else {
            setIntensityValue(null);
          }
        }}
        className="relative aspect-[16/7.2] rounded-[24px] overflow-hidden border-[1px] border-white/10 shadow-[5px_5px_0px_rgba(0,0,0,1)] active:scale-[0.98] group cursor-pointer bg-[#1A1A1A]"
      >
        <img 
          src={habit.imageUrl} 
          className={`absolute inset-0 w-full h-full object-cover ${habit.imagePosition || 'object-center'} opacity-65 group-hover:opacity-85 transition-opacity duration-300`} 
          alt={habit.name} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
        
        <div className="absolute inset-0 p-5 flex flex-col justify-end">
          <div>
            <h3 className="text-[22px] font-black font-['Outfit'] text-white mb-1.5 leading-tight tracking-[0.5px]">{habit.name}</h3>
            <div className="flex items-center gap-2 text-white/60">
              <div className="flex items-center gap-1.5">
                <CustomIcon 
                  icon={iconStr} 
                  width={18} 
                  height={18}
                  color={HABIT_COLORS[habit.iconName] || '#00FF85'}
                />
                <span className="text-[10px] font-black tracking-[0.15em] uppercase leading-none">{habit.frequency}</span>
              </div>
              
              <span className="text-white/10 font-light">|</span>
              
              <div className="flex items-center gap-1.5">
                <DifficultyBars level={habit.difficulty} />
                <span className="text-[10px] font-black tracking-[0.15em] uppercase text-white/40 leading-none">Level</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-[#1A1A1A] z-50 flex flex-col"
        >
          {/* Header */}
          <div className="pt-14 pb-6 px-6 flex justify-between items-center bg-[#1A1A1A]/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20">
            <div>
              <h2 className="text-2xl font-extrabold font-['Outfit'] text-[#E3DAC9] tracking-tight">Tambah Tugas</h2>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-[#222] border border-white/10 flex items-center justify-center text-[#E3DAC9]/60 active:scale-90 active:bg-[#2a2a2a] transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)]"
            >
              <Icon icon="ph:x-bold" width={18} height={18} />
            </button>
          </div>

          {/* Categories Bar - Unified & Consistent */}
          <div className="px-6 py-6 bg-[#1A1A1A] sticky top-[108px] z-30 border-b border-white/5 h-[100px] flex items-center">
            <div 
              ref={catBarRef}
              className="flex items-center gap-3 w-full overflow-x-auto py-2 no-scrollbar relative"
              style={{ msOverflowStyle: 'none', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              <style dangerouslySetInnerHTML={{__html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
              `}} />
              {categories.map((cat, idx) => {
                const isSelected = selectedCategory === cat;
                const isSubActive = selectedCategory === 'Semua' && activeSubCategory === cat;
                const accentColor = cat === 'Semua' ? '#E3DAC9' : (CATEGORY_COLORS[cat] || '#FFFFFF');
                const isSemua = cat === 'Semua';
                
                return (
                  <motion.button
                    key={cat}
                    data-cat={cat}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(5);
                      setSelectedCategory(cat);
                    }}
                    className={`flex-shrink-0 flex items-center justify-center gap-3 px-4 rounded-2xl border-[1.5px] shadow-[4px_4px_0_rgba(0,0,0,1)] h-[48px] w-[140px] transition-all duration-300 ${
                      isSemua ? 'sticky left-0 z-20 bg-[#1A1A1A] mr-4' : 'bg-[#1A1A1A]'
                    }`}
                    style={{
                      borderColor: isSelected ? accentColor : isSubActive ? `${accentColor}60` : `${accentColor}15`,
                      color: isSelected ? accentColor : isSubActive ? `${accentColor}80` : `${accentColor}30`,
                      boxShadow: isSelected 
                        ? `4px 4px 0 rgba(0,0,0,1), 0 0 20px ${accentColor}40` 
                        : isSubActive
                        ? `4px 4px 0 rgba(0,0,0,1), 0 0 10px ${accentColor}20`
                        : `4px 4px 0 rgba(0,0,0,1)`
                    }}
                  >
                    <Icon 
                      icon={CATEGORY_ICONS[cat]} 
                      width={18} 
                      height={18} 
                      style={{ 
                        color: (isSelected || isSubActive) ? accentColor : 'inherit',
                        opacity: isSelected ? 1 : isSubActive ? 0.7 : 0.2
                      }}
                    />
                    <span className="text-[13px] font-bold font-['Inter'] tracking-tight truncate">
                      {cat}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Habits List */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-5 pt-10 pb-32 space-y-[48px] no-scrollbar scroll-smooth"
          >
            {selectedCategory === 'Semua' ? (
              groupedHabits.map((group) => (
                <div key={group.category} className="space-y-[30px] relative">
                  {/* Invisible Marker for Scrollspy - Positioned exactly at the start of the group content */}
                  <div 
                    className="category-marker absolute top-[0px] left-0 w-full h-[1px] pointer-events-none" 
                    data-category={group.category} 
                  />
                  
                  {group.habits.map((habit, i) => (
                    <HabitCard key={habit.name} habit={habit} index={i} />
                  ))}
                </div>
              ))
            ) : availableHabits.length > 0 ? (
              <div className="space-y-[30px]">
                {availableHabits.map((habit, i) => (
                  <HabitCard key={habit.name} habit={habit} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 py-20 px-10 text-center opacity-20">
                <Icon icon="solar:box-minimalistic-bold" width={24} height={24} />
                <p className="text-[11px] font-black font-['Outfit'] uppercase tracking-[0.2em] whitespace-nowrap">Semua protokol kategori ini aktif</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Intensity/Config Bottom Sheet */}
    {/* Layer 1: Config Bottom Sheet */}
    <AnimatePresence>
      {selectedHabitForConfig && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setSelectedHabitForConfig(null); setShowIntensityPicker(false); }}
            className="fixed inset-0 bg-black/90 z-[60] backdrop-blur-md"
          />
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] z-[70] rounded-t-[32px] border-t border-white/5 p-6 pb-10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex flex-col h-[55vh]"
          >
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6" />
            
            {/* Header */}
            <div className="relative flex items-center justify-center mb-8">
              <button 
                onClick={() => { setSelectedHabitForConfig(null); setShowIntensityPicker(false); }}
                className="absolute left-0 p-2 text-white/40 active:text-white"
              >
                <Icon icon="solar:alt-arrow-left-bold" width={24} height={24} />
              </button>
              <h3 className="text-[17px] font-bold font-['Outfit'] text-[#E3DAC9]">Tambah Tugas Baru</h3>
            </div>

            {/* Task Icon & Name */}
            <div className="mb-6">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">Ikon & Nama Tugas</p>
              <div className="flex gap-4 h-[60px]">
                <div className="w-[60px] h-full bg-[#222] rounded-2xl border border-white/10 flex items-center justify-center">
                  <CustomIcon 
                    icon={HABIT_ICONS[selectedHabitForConfig.iconName] || 'solar:bolt-bold'} 
                    width={28} 
                    height={28}
                    color={HABIT_COLORS[selectedHabitForConfig.iconName] || HABIT_COLORS[getCustomIconKey(HABIT_ICONS[selectedHabitForConfig.iconName])] || '#E3DAC9'}
                  />
                </div>
                <div className="flex-1 h-full bg-[#222] rounded-2xl border border-white/10 flex items-center px-5">
                  <span className="text-[16px] font-bold font-['Outfit'] text-[#E3DAC9]">{selectedHabitForConfig.name}</span>
                </div>
              </div>
            </div>

            {/* Select Intensity - Clickable Field */}
            <div className="mb-8">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">Pilih Intensitas</p>
              {selectedHabitForConfig.intensity?.type === 'numeric' ? (
                <button
                  onClick={() => { if (navigator.vibrate) navigator.vibrate(3); setShowIntensityPicker(true); }}
                  className="w-full h-[60px] bg-[#222] rounded-2xl border border-white/10 px-5 flex items-center justify-between active:scale-[0.98] transition-all"
                >
                  <span className="text-[15px] font-bold font-['Outfit'] text-[#E3DAC9]/80">
                    {selectedHabitForConfig.name.split(' ')[0]} untuk {intensityValue} {selectedHabitForConfig.intensity.unit}
                  </span>
                  <Icon icon="solar:alt-arrow-up-down-bold" width={18} height={18} className="text-white/30" />
                </button>
              ) : (
                <div className="w-full h-[60px] bg-[#222] rounded-2xl border border-white/10 border-dashed px-5 flex items-center justify-center gap-3">
                  <Icon icon="solar:check-read-bold" width={20} height={20} className="text-[#00FF85]/40" />
                  <span className="text-[13px] font-bold text-[#E3DAC9]/40 uppercase tracking-widest">Single Action Task</span>
                </div>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button 
                onClick={() => { setSelectedHabitForConfig(null); setShowIntensityPicker(false); }}
                className="flex-1 h-[56px] rounded-2xl bg-[#222] border border-white/10 text-[#E3DAC9]/60 font-bold font-['Outfit'] uppercase tracking-[0.15em] text-[13px] active:scale-95 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={() => handleAdd(selectedHabitForConfig, intensityValue)}
                className="flex-[1.5] h-[56px] rounded-2xl bg-[#00FF85] border-[1.5px] border-black text-black font-bold font-['Outfit'] uppercase tracking-[0.15em] text-[13px] shadow-[4px_4px_0px_rgba(0,0,0,1),0_0_20px_rgba(0,255,133,0.2)] active:scale-95 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                Tambah Tugas
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Layer 2: Intensity Picker (Nested Bottom Sheet) */}
    <AnimatePresence>
      {showIntensityPicker && selectedHabitForConfig?.intensity?.type === 'numeric' && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowIntensityPicker(false)}
            className="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] z-[90] rounded-t-[32px] border-t border-white/5 p-6 pb-10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex flex-col h-[55vh]"
          >
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5" />
            
            {/* Title */}
            <h3 className="text-[16px] font-black font-['Outfit'] text-[#E3DAC9] text-center mb-6">Pilih Intensitas</h3>

            {/* Vertical Rolling Picker */}
            <div className="relative w-full h-[300px] overflow-hidden flex items-center justify-center">
              {/* Highlight Box */}
              <div className="absolute inset-x-4 h-[52px] bg-[#00FF85]/8 border border-[#00FF85]/20 pointer-events-none z-0 rounded-2xl" />
              
              <div 
                ref={pickerRef}
                onScroll={handlePickerScroll}
                style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
                className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory px-4 py-[124px] flex flex-col items-center scroll-smooth relative z-10"
              >
                {selectedHabitForConfig.intensity.options.map((opt: number, idx: number) => {
                  const itemPos = idx * 52;
                  // Use individual transforms for each item based on its distance from current scroll
                  return (
                    <PickerItem 
                      key={opt} 
                      value={opt} 
                      unit={selectedHabitForConfig.intensity.unit}
                      idx={idx}
                      itemPos={itemPos}
                      containerScrollY={containerScrollY}
                      isActive={intensityValue === opt}
                    />
                  );
                })}
              </div>
              
              {/* Fade Overlays */}
              <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#1A1A1A] to-transparent pointer-events-none z-20" />
              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#1A1A1A] to-transparent pointer-events-none z-20" />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <button 
                onClick={() => setShowIntensityPicker(false)}
                className="flex-1 h-[56px] rounded-2xl bg-[#222] border border-white/10 text-[#E3DAC9]/60 font-black font-['Outfit'] uppercase tracking-[0.15em] text-[13px] active:scale-95 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={() => { if (navigator.vibrate) navigator.vibrate(5); setShowIntensityPicker(false); }}
                className="flex-[1.5] h-[56px] rounded-2xl bg-[#00FF85] border-[1.5px] border-black text-black font-black font-['Outfit'] uppercase tracking-[0.15em] text-[13px] shadow-[4px_4px_0px_rgba(0,0,0,1),0_0_20px_rgba(0,255,133,0.2)] active:scale-95 active:shadow-none transition-all"
              >
                Selesai
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
};
