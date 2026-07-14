import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../i18n';

export interface ScheduleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  currentScheduleType: 'daily' | 'weekly' | 'custom';
  currentScheduleDays: number[];
  onSave: (scheduleType: 'daily' | 'weekly' | 'custom', scheduleDays: number[]) => void;
}

type ScheduleType = 'daily' | 'weekly' | 'custom';

const SCHEDULE_TYPE_OPTIONS: { value: ScheduleType; label: string }[] = [
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'custom', label: 'Custom' },
];

const ScheduleEditor = ({
  isOpen,
  onClose,
  currentScheduleType,
  currentScheduleDays,
  onSave,
}: ScheduleEditorProps) => {
  const { t } = useTranslation();
  const isLight = !document.documentElement.classList.contains('dark');
  const [scheduleType, setScheduleType] = useState<ScheduleType>(currentScheduleType);
  const [selectedDays, setSelectedDays] = useState<number[]>(currentScheduleDays);
  const [showValidation, setShowValidation] = useState(false);

  // Reset state when opened with new props
  useEffect(() => {
    if (isOpen) {
      setScheduleType(currentScheduleType);
      setSelectedDays(currentScheduleDays);
      setShowValidation(false);
    }
  }, [isOpen, currentScheduleType, currentScheduleDays]);

  const handleTypeChange = (type: ScheduleType) => {
    setScheduleType(type);
    setShowValidation(false);

    if (type === 'daily') {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    } else if (type === 'weekly') {
      setSelectedDays(selectedDays.length > 0 ? [selectedDays[0]] : []);
    }
  };

  const handleDayToggle = (day: number) => {
    setShowValidation(false);

    if (scheduleType === 'weekly') {
      setSelectedDays([day]);
    } else if (scheduleType === 'custom') {
      setSelectedDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
      );
    }
  };

  const isValid = (): boolean => {
    if (scheduleType === 'daily') return true;
    return selectedDays.length > 0;
  };

  const handleSave = () => {
    if (!isValid()) {
      setShowValidation(true);
      return;
    }

    const days = scheduleType === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : [...selectedDays].sort((a, b) => a - b);
    onSave(scheduleType, days);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const showDayPicker = scheduleType === 'weekly' || scheduleType === 'custom';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="schedule-editor-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            key="schedule-editor-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className={`w-full max-w-[420px] rounded-t-[32px] p-6 pb-10 flex flex-col border-t-[3px] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] ${
              isLight 
                ? 'bg-white border-black shadow-[0_-10px_30px_rgba(0,0,0,0.12)]' 
                : 'bg-[#16181c] border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]'
            }`}
          >
            {/* Handle bar */}
            <div className={`w-10 h-1 rounded-full mx-auto mb-5 ${isLight ? 'bg-black/15' : 'bg-white/10'}`} />

            {/* Title */}
            <h3 className={`text-[16px] font-black font-['Outfit'] text-center mb-6 ${isLight ? 'text-black' : 'text-[#E3DAC9]'}`}>
              {t('habits.scheduleEditor.title')}
            </h3>

            {/* Schedule Type Selector */}
            <div className="flex gap-2 pb-5">
              {SCHEDULE_TYPE_OPTIONS.map((option) => {
                const isActive = scheduleType === option.value;
                const label = t(`habits.scheduleEditor.${option.value}`);
                return (
                  <motion.button
                    key={option.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTypeChange(option.value)}
                    className={`flex-1 py-2.5 rounded-xl font-['Outfit'] text-[12px] font-bold tracking-tight transition-all border-[1.5px] ${
                      isActive
                        ? isLight
                          ? 'bg-[#E6FFFA] text-[#22543D] border-[#81E6D9] shadow-sm'
                          : 'bg-[#102A1E] text-[#00FF85] border-[#1C4D38] shadow-none'
                        : isLight
                          ? 'bg-white text-neutral-500 border-neutral-200 shadow-sm hover:bg-neutral-50'
                          : 'bg-[#1C1E22] text-[#E3DAC9]/45 border-white/10 shadow-none hover:bg-[#1C1E22]/80'
                    }`}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>

            {/* Day Picker */}
            <AnimatePresence>
              {showDayPicker && (
                <motion.div
                  key="day-picker"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="flex justify-center gap-2 pb-4">
                    {Array.from({ length: 7 }).map((_, index) => {
                      const label = t(`schedule.days.short.${index}`);
                      const isSelected = selectedDays.includes(index);
                      return (
                        <motion.button
                          key={index}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDayToggle(index)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-['Outfit'] text-[11px] font-bold tracking-wide transition-all border-[1.5px] ${
                            isSelected
                              ? isLight
                                ? 'bg-[#E6FFFA] text-[#22543D] border-[#81E6D9] shadow-sm'
                                : 'bg-[#102A1E] text-[#00FF85] border-[#1C4D38] shadow-none'
                              : isLight
                                ? 'bg-white text-neutral-500 border-neutral-200 shadow-sm hover:bg-neutral-50'
                                : 'bg-[#1C1E22] text-[#E3DAC9]/45 border-white/10 shadow-none hover:bg-[#1C1E22]/80'
                          }`}
                        >
                          {label}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Validation message */}
            <AnimatePresence>
              {showValidation && !isValid() && (
                <motion.p
                  key="validation-msg"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="text-center text-red-400 text-[12px] font-['Outfit'] font-medium pb-3"
                >
                  {t('habits.scheduleEditor.validation')}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="pt-4 flex gap-4">
              {/* Cancel button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className={`flex-1 h-[48px] rounded-xl font-black font-['Outfit'] uppercase tracking-[0.15em] text-[12px] border transition-all ${
                  isLight
                    ? 'bg-white border-black text-black shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#222] border border-white/10 text-[#E3DAC9]/60 shadow-none'
                }`}
              >
                {t('habits.scheduleEditor.cancel')}
              </motion.button>

              {/* Save button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={showDayPicker && selectedDays.length === 0}
                className={`flex-[1.5] h-[48px] rounded-xl font-black font-['Outfit'] uppercase tracking-[0.15em] text-[12px] border transition-all flex items-center justify-center ${
                  isLight
                    ? 'bg-black border-black text-white shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] hover:bg-black/90'
                    : 'bg-white border-transparent text-black shadow-none hover:bg-white/90'
                }`}
              >
                {t('habits.scheduleEditor.save')}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScheduleEditor;
