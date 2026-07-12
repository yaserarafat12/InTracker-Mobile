/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Icon } from '@iconify/react';
import { HABIT_OPTIONS, HABIT_ICONS, HABIT_COLORS, getCustomIconKey, CATEGORY_ICONS } from './icons';
import { CustomIcon } from './displaycardhabit';
import { CustomHabitForm } from './CustomHabitForm';
import { useTranslation } from '../../i18n';

const categories = ['Rutinitas', 'Ketenangan Diri', 'Perkembangan Diri', 'Latihan Fisik'];
const categoryKeys: Record<string, string> = {
  'Rutinitas': 'habits.categories.routine',
  'Ketenangan Diri': 'habits.categories.mindfulness',
  'Perkembangan Diri': 'habits.categories.evolution',
  'Latihan Fisik': 'habits.categories.exercise'
};

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
      <div className="flex items-baseline gap-2 font-['Outfit']">
        <span className={`text-[32px] font-black tracking-normal transition-all duration-300 ${isActive ? (isLight ? 'text-black' : 'text-white') : (isLight ? 'text-black/25' : 'text-[#E3DAC9]/30')}`}>
          {value}
        </span>
        <span className={`text-[12px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${isActive ? (isLight ? 'text-black/60' : 'text-white/60') : (isLight ? 'text-black/15' : 'text-white/10')}`}>
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
  onUpdateHabit,
  habitToEdit = null,
  currentHabits = [],
  tutorialStep
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onAddHabit?: (habit: any) => void,
  onUpdateHabit?: (id: string, updates: any) => void,
  habitToEdit?: any | null,
  currentHabits?: any[],
  tutorialStep?: number
}) => {
  const [selectedHabitForConfig, setSelectedHabitForConfig] = useState<any>(null);
  const { t, language } = useTranslation();
  const isLight = !document.documentElement.classList.contains('dark');
  const [intensityValue, setIntensityValue] = useState<number | null>(8);
  const [showIntensityPicker, setShowIntensityPicker] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customFormCategory, setCustomFormCategory] = useState<string | null>(null);
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const containerScrollY = useMotionValue(0);



  // Group habits by category
  const groupedHabits = useMemo(() => {
    const isTutorialActive = localStorage.getItem('interactive_tutorial_active') === 'true';
    return categories.map(cat => ({
      category: cat,
      habits: HABIT_OPTIONS.filter(h => {
        if (h.name === 'Drink Water') {
          return isTutorialActive;
        }
        return true;
      }).filter(h => h.category === cat)
    })).filter(g => g.habits.length > 0);
  }, []);

  // Set default intensity when habit is selected
  useEffect(() => {
    let active = true;
    if (habitToEdit) {
      requestAnimationFrame(() => {
        if (active) {
          setSelectedHabitForConfig(habitToEdit);
          setIntensityValue(habitToEdit.target_intensity || null);
        }
      });
    }
    return () => { active = false; };
  }, [habitToEdit]);

  useEffect(() => {
    let active = true;
    if (!habitToEdit && selectedHabitForConfig) {
      requestAnimationFrame(() => {
        if (active) {
          if (selectedHabitForConfig.name.includes('Hidrasi')) {
            setIntensityValue(8);
          } else if (selectedHabitForConfig.intensity?.options) {
            const opts = selectedHabitForConfig.intensity.options;
            setIntensityValue(opts[Math.floor(opts.length / 2)]);
          }
        }
      });
    }
    return () => { active = false; };
  }, [selectedHabitForConfig, habitToEdit]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Synchronize modal sub-states with tutorial step
  useEffect(() => {
    const isTutorialActive = localStorage.getItem('interactive_tutorial_active') === 'true';
    if (!isTutorialActive || tutorialStep === undefined) return;

    if (tutorialStep === 2) {
      // Step 2: Choose Preset. The preset list must be open (selectedHabitForConfig = null)
      setSelectedHabitForConfig(null);
      setShowIntensityPicker(false);
    } else if (tutorialStep === 3) {
      // Step 3: Open Intensity Picker. Preset must be selected, intensity picker modal closed.
      const preset = HABIT_OPTIONS.find(h => h.name === 'Drink Water');
      if (preset && (!selectedHabitForConfig || selectedHabitForConfig.name !== 'Drink Water')) {
        setSelectedHabitForConfig(preset);
      }
      setShowIntensityPicker(false);
    } else if (tutorialStep === 4) {
      // Step 4: Done in Intensity Picker. Intensity picker modal must be open.
      const preset = HABIT_OPTIONS.find(h => h.name === 'Drink Water');
      if (preset && (!selectedHabitForConfig || selectedHabitForConfig.name !== 'Drink Water')) {
        setSelectedHabitForConfig(preset);
      }
      setShowIntensityPicker(true);
    } else if (tutorialStep === 5) {
      // Step 5: Save Habit (ADD). Config sheet open, intensity picker closed.
      const preset = HABIT_OPTIONS.find(h => h.name === 'Drink Water');
      if (preset && (!selectedHabitForConfig || selectedHabitForConfig.name !== 'Drink Water')) {
        setSelectedHabitForConfig(preset);
      }
      setShowIntensityPicker(false);
    }
  }, [tutorialStep]);

  const handleChipClick = (habit: any) => {
    const isDuplicate = currentHabits.some(h => h.name.toLowerCase() === habit.name.toLowerCase());
    
    if (isDuplicate) {
      if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
      const translatedName = t(`presets.${habit.name}`) === `presets.${habit.name}` ? habit.name : t(`presets.${habit.name}`);
      setToastMessage(`"${translatedName}" ${t('addHabit.alreadyExists')}`);
      return;
    }

    if (navigator.vibrate) navigator.vibrate(5);
    setSelectedHabitForConfig(habit);
    if (habit.intensity?.type === 'numeric') {
      setIntensityValue(habit.intensity.defaultValue || habit.intensity.options?.[0] || 1);
    } else {
      setIntensityValue(null);
    }
  };

  const handleActionClick = (habitBase: any, intensity: number | null) => {
    if (habitToEdit) {
      onUpdateHabit?.(habitToEdit.id, { target_intensity: intensity, schedule_type: scheduleType, schedule_days: scheduleDays });
    } else {
      const newHabit = {
        ...habitBase,
        completed: false,
        skipped: false,
        target_intensity: intensity,
        current_intensity: 0,
        schedule_type: scheduleType,
        schedule_days: scheduleDays,
      };
      onAddHabit?.(newHabit);
    }
    onClose();
    setSelectedHabitForConfig(null);
    setScheduleType('daily');
    setScheduleDays([0,1,2,3,4,5,6]);
  };

  // Intensity Picker
  const pickerRef = useRef<HTMLDivElement>(null);
  const lastVibrateRef = useRef<number | null>(null);

  const handlePickerScroll = useCallback(() => {
    if (!pickerRef.current || !selectedHabitForConfig) return;
    const container = pickerRef.current;
    containerScrollY.set(container.scrollTop);
    const items = container.querySelectorAll('.picker-item');
    const containerCenter = container.getBoundingClientRect().top + container.offsetHeight / 2;
    let closestValue = null;
    let minDistance = Infinity;
    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const distance = Math.abs(containerCenter - itemCenter);
      if (distance < minDistance) { minDistance = distance; closestValue = Number(item.getAttribute('data-value')); }
    });
    if (closestValue !== null && closestValue !== intensityValue) {
      setIntensityValue(closestValue);
      if (navigator.vibrate && lastVibrateRef.current !== closestValue) { navigator.vibrate(5); lastVibrateRef.current = closestValue; }
    }
  }, [selectedHabitForConfig, intensityValue, containerScrollY]);

  useEffect(() => {
    if (showIntensityPicker && pickerRef.current && selectedHabitForConfig?.intensity?.options) {
      const options = selectedHabitForConfig.intensity.options;
      const index = options.indexOf(intensityValue);
      if (index !== -1) { setTimeout(() => { if (pickerRef.current) pickerRef.current.scrollTop = index * 52; }, 100); }
    }
  }, [showIntensityPicker, selectedHabitForConfig, intensityValue]);

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-[#16181c] z-[200] flex flex-col"
        >
          {/* Header */}
          <div className="pt-14 pb-4 px-6 flex justify-between items-center border-b border-white/5">
            <div className="w-9" /> {/* Spacer for centering */}
            <h2 className="text-[15px] font-bold font-['Outfit'] text-[#E3DAC9]/80">{t('addHabit.title')}</h2>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none -mr-1.5 ${
                isLight 
                  ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' 
                  : 'border-white/10 bg-[#2a2c32] text-white shadow-none'
              }`}
            >
              <Icon icon="ph:x-bold" width={16} height={16} />
            </motion.button>
          </div>

          {/* Habits List - Chips by Category */}
          <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32">
            {groupedHabits.map((group) => {
              const iconStr = CATEGORY_ICONS[group.category] || 'solar:bolt-bold';
              return (
                <div key={group.category} className="mb-10">
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon icon={iconStr} width={14} className="text-white/40" />
                      <span className="text-[12px] font-bold text-white/50 font-['Outfit']">{t(categoryKeys[group.category] || group.category)}</span>
                    </div>
                    <button 
                      onClick={() => setCustomFormCategory(group.category)}
                      className="w-7 h-7 rounded-lg bg-[#2a2c32] border border-white/10 flex items-center justify-center"
                    >
                      <Icon icon="ph:plus-bold" width={12} className="text-white/40" />
                    </button>
                  </div>

                  {/* Chips */}
                  <div className="flex flex-wrap gap-2.5">
                    {group.habits.map((habit) => {
                      const isDuplicate = currentHabits.some(h => h.name.toLowerCase() === habit.name.toLowerCase());
                      const habitIcon = HABIT_ICONS[habit.iconName] || 'solar:bolt-bold';
                      
                      return (
                        <motion.button
                          key={habit.name}
                          id={habit.name === 'Drink Water' ? 'habit-pick-drink-water' : undefined}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleChipClick(habit)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all ${
                            isDuplicate 
                              ? 'bg-[#2a2c32]/50 border-white/5 opacity-40' 
                              : 'bg-[#2a2c32] border-white/15 active:border-[#00FF85]/30'
                          }`}
                        >
                          <CustomIcon 
                            icon={habitIcon} 
                            width={14} 
                            height={14} 
                            className={isDuplicate ? 'text-white/30' : 'text-neutral-500 dark:text-white/60'} 
                          />
                          <span className={`text-[11px] font-bold font-['Outfit'] ${isDuplicate ? 'text-white/30' : 'text-[#E3DAC9]/80'}`}>
                            {t(`presets.${habit.name}`) === `presets.${habit.name}` ? habit.name : t(`presets.${habit.name}`)}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Toast */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[210] bg-[#EF4444]/20 border border-[#EF4444]/30 backdrop-blur-md px-4 py-2.5 rounded-xl"
              >
                <span className="text-[11px] font-bold text-[#EF4444] font-['Outfit']">{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Config Bottom Sheet */}
    <AnimatePresence>
      {selectedHabitForConfig && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setSelectedHabitForConfig(null); setShowIntensityPicker(false); }}
            className="fixed inset-0 bg-black/95 z-[210]"
          />
          <motion.div 
            id="habit-config-modal"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-[#16181c] z-[220] rounded-t-[32px] border-t border-white/5 p-6 pb-10 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex flex-col h-[55vh]"
          >
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6" />
            
            <div className="relative flex items-center justify-center mb-8">
              <button 
                onClick={() => { setSelectedHabitForConfig(null); setShowIntensityPicker(false); }}
                className="absolute left-0 p-2 text-white/40 active:text-white"
              >
                <Icon icon="solar:alt-arrow-left-bold" width={24} />
              </button>
              <h3 className="text-[17px] font-bold font-['Outfit'] text-[#E3DAC9]">{habitToEdit ? t('addHabit.editTitle') : t('addHabit.addNew')}</h3>
            </div>

            {/* Task Icon & Name */}
            <div className="mb-6">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">{t('addHabit.iconAndName')}</p>
              <div className="flex gap-4 h-[60px]">
                <div className="w-[60px] h-full bg-[#222] rounded-2xl border border-white/10 flex items-center justify-center">
                  <CustomIcon 
                    icon={HABIT_ICONS[selectedHabitForConfig.iconName] || 'solar:bolt-bold'} 
                    width={28} height={28}
                    color={HABIT_COLORS[selectedHabitForConfig.iconName] || HABIT_COLORS[getCustomIconKey(HABIT_ICONS[selectedHabitForConfig.iconName])] || '#E3DAC9'}
                  />
                </div>
                <div className="flex-1 h-full bg-[#222] rounded-2xl border border-white/10 flex items-center px-5">
                  <span className="text-[16px] font-bold font-['Outfit'] text-[#E3DAC9]">
                    {t(`presets.${selectedHabitForConfig.name}`) === `presets.${selectedHabitForConfig.name}` ? selectedHabitForConfig.name : t(`presets.${selectedHabitForConfig.name}`)}
                  </span>
                </div>
              </div>
            </div>

            {/* Select Intensity */}
            <div className="mb-6">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">{t('addHabit.selectIntensity')}</p>
              {selectedHabitForConfig.intensity?.type === 'numeric' ? (
                <button
                  id="habit-config-intensity-btn"
                  onClick={() => { if (navigator.vibrate) navigator.vibrate(3); setShowIntensityPicker(true); }}
                  className={`w-full h-[46px] rounded-xl border flex items-center justify-between px-4 active:scale-[0.98] transition-all ${
                    isLight
                      ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
                      : 'bg-[#1a1a1a] border-white/10 text-white shadow-none'
                  }`}
                >
                  <span className="text-[13px] font-bold font-['Outfit']">
                    {(() => {
                      const nameTrans = t(`presets.${selectedHabitForConfig.name}`) === `presets.${selectedHabitForConfig.name}` ? selectedHabitForConfig.name : t(`presets.${selectedHabitForConfig.name}`);
                      const actionWord = nameTrans.split(' ')[0];
                      const unitTrans = t(`units.${selectedHabitForConfig.intensity.unit}`) || selectedHabitForConfig.intensity.unit;
                      return language === 'Bahasa Indonesia'
                        ? `${actionWord} untuk ${intensityValue} ${unitTrans}`
                        : `${actionWord} for ${intensityValue} ${unitTrans}`;
                    })()}
                  </span>
                  <Icon icon="solar:alt-arrow-up-down-bold" width={16} className={isLight ? 'text-black/30' : 'text-white/30'} />
                </button>
              ) : (
                <div className={`w-full h-[46px] rounded-xl border border-dashed px-4 flex items-center justify-center gap-2 ${
                  isLight ? 'bg-white border-black/10' : 'bg-[#1c1e22] border-white/[0.06]'
                }`}>
                  <Icon icon="solar:slash-circle-bold" width={16} className={isLight ? 'text-black/20' : 'text-white/20'} />
                  <span className={`text-[11px] font-black uppercase tracking-wider ${
                    isLight ? 'text-black/30' : 'text-white/30'
                  }`}>
                    {(() => {
                      switch (language) {
                        case 'Bahasa Indonesia': return 'Tidak Tersedia';
                        case '日本語': return '利用不可';
                        case 'Español': return 'No disponible';
                        case 'Français': return 'Indisponible';
                        case 'Deutsch': return 'Nicht verfügbar';
                        case 'Português': return 'Indisponível';
                        case '简体中文': return '不可用';
                        case 'العربية': return 'غير متوفر';
                        case 'हिन्दी': return 'अनुपलब्ध';
                        default: return 'Unavailable';
                      }
                    })()}
                  </span>
                </div>
              )}
            </div>

            {/* Schedule Type Selector */}
            <div className="mb-6">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-3 ml-1">{t('addHabit.schedule')}</p>
              <div className="flex gap-2 mb-3">
                {([['daily', 'addHabit.daily'], ['weekly', 'addHabit.weekly'], ['custom', 'addHabit.custom']] as const).map(([type, labelKey]) => (
                  <button
                    key={type}
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(3);
                      setScheduleType(type);
                      if (type === 'daily') setScheduleDays([0,1,2,3,4,5,6]);
                      else if (type === 'weekly') setScheduleDays(scheduleDays.length === 1 ? scheduleDays : [1]);
                    }}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-black font-['Outfit'] uppercase tracking-wider transition-all ${
                      scheduleType === type
                        ? 'bg-[#6ED7A0] text-black border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                        : isLight
                          ? 'bg-white text-black/50 border border-black/10'
                          : 'bg-[#1a1a1a] text-white/40 border border-white/5'
                    }`}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
              {(scheduleType === 'weekly' || scheduleType === 'custom') && (
                <div className="flex justify-center gap-2">
                  {[
                    'addHabit.days.sun',
                    'addHabit.days.mon',
                    'addHabit.days.tue',
                    'addHabit.days.wed',
                    'addHabit.days.thu',
                    'addHabit.days.fri',
                    'addHabit.days.sat'
                  ].map((dayKey, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(3);
                        if (scheduleType === 'weekly') {
                          setScheduleDays([i]);
                        } else {
                          setScheduleDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]);
                        }
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold font-['Outfit'] transition-all ${
                        scheduleDays.includes(i)
                          ? 'bg-[#6ED7A0] text-black border-2 border-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]'
                          : isLight
                            ? 'bg-white text-black/50 border border-black/10'
                            : 'bg-[#1a1a1a] text-[#E3DAC9]/40 border border-white/5'
                      }`}
                    >
                      {t(dayKey)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1" />

            {/* Action Buttons */}
            <div className="flex gap-4">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelectedHabitForConfig(null); setShowIntensityPicker(false); }}
                className={`flex-1 h-[48px] rounded-xl font-black font-['Outfit'] uppercase tracking-[0.15em] text-[12px] border transition-all ${
                  isLight
                    ? 'bg-white border-black text-black shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#2a2c32] border-white/10 text-[#E3DAC9]/60 shadow-none'
                }`}
              >
                {t('addHabit.cancel')}
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.95 }}
                id="habit-config-save-btn"
                onClick={() => handleActionClick(selectedHabitForConfig, intensityValue)}
                className={`flex-[1.5] h-[48px] rounded-xl font-black font-['Outfit'] uppercase tracking-[0.15em] text-[12px] border transition-all flex items-center justify-center gap-2 ${
                  isLight
                    ? 'bg-[#6ED7A0] border-black text-black shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#6ED7A0] border-transparent text-black shadow-none'
                }`}
              >
                {habitToEdit ? t('addHabit.save') : t('addHabit.add')}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Intensity Picker */}
    <AnimatePresence>
      {showIntensityPicker && selectedHabitForConfig?.intensity?.type === 'numeric' && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowIntensityPicker(false)}
            className="fixed inset-0 bg-black/80 z-[230]"
          />
          <motion.div 
            id="habit-config-intensity-modal"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className={`fixed bottom-0 left-0 right-0 z-[240] rounded-t-[32px] p-6 pb-10 flex flex-col h-[55vh] border-t-[3px] ${isLight ? 'bg-white border-black shadow-[0_-10px_30px_rgba(0,0,0,0.12)]' : 'bg-[#16181c] border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]'}`}
          >
            <div className={`w-10 h-1 rounded-full mx-auto mb-5 ${isLight ? 'bg-black/15' : 'bg-white/10'}`} />
            <h3 className={`text-[16px] font-black font-['Outfit'] text-center mb-6 ${isLight ? 'text-black' : 'text-[#E3DAC9]'}`}>{t('addHabit.selectIntensityTitle')}</h3>

            <div className="relative w-full h-[300px] overflow-hidden flex items-center justify-center">
              <div className={`absolute inset-x-4 h-[52px] pointer-events-none z-0 rounded-xl border-[2px] ${isLight ? 'bg-[#6ED7A0]/12 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'bg-[#6ED7A0]/8 border-[#6ED7A0]/25'}`} />
              <div 
                ref={pickerRef}
                onScroll={handlePickerScroll}
                style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
                className="w-full h-full overflow-y-auto no-scrollbar snap-y snap-mandatory px-4 py-[124px] flex flex-col items-center scroll-smooth relative z-10"
              >
                {selectedHabitForConfig.intensity.options.map((opt: number, idx: number) => (
                  <PickerItem key={opt} value={opt} unit={selectedHabitForConfig.intensity.unit} idx={idx} itemPos={idx * 52} containerScrollY={containerScrollY} isActive={intensityValue === opt} isLight={isLight} />
                ))}
              </div>
              <div className={`absolute top-0 inset-x-0 h-20 bg-gradient-to-b to-transparent pointer-events-none z-20 ${isLight ? 'from-white' : 'from-[#16181c]'}`} />
              <div className={`absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t to-transparent pointer-events-none z-20 ${isLight ? 'from-white' : 'from-[#16181c]'}`} />
            </div>

            <div className="flex gap-4 mt-6">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowIntensityPicker(false)}
                className={`flex-1 h-[48px] rounded-xl font-black font-['Outfit'] uppercase tracking-[0.15em] text-[12px] border transition-all ${
                  isLight
                    ? 'bg-white border-black text-black shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#222] border border-white/10 text-[#E3DAC9]/60 shadow-none'
                }`}
              >
                {t('addHabit.cancel')}
              </motion.button>
              <motion.button 
                id="habit-config-intensity-done-btn"
                whileTap={{ scale: 0.95 }}
                onClick={() => { if (navigator.vibrate) navigator.vibrate(5); setShowIntensityPicker(false); }}
                className={`flex-[1.5] h-[48px] rounded-xl font-black font-['Outfit'] uppercase tracking-[0.15em] text-[12px] border transition-all flex items-center justify-center ${
                  isLight
                    ? 'bg-[#6ED7A0] border-black text-black shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#6ED7A0] border-transparent text-black shadow-none'
                }`}
              >
                {t('addHabit.done')}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Custom Habit Form */}
    <CustomHabitForm
      isOpen={!!customFormCategory}
      category={customFormCategory || 'Rutinitas'}
      onClose={() => setCustomFormCategory(null)}
      onSubmit={(habit) => {
        onAddHabit?.(habit);
        onClose();
      }}
      currentHabits={currentHabits}
    />
    </>
  );
};
