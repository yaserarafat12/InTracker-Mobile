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

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const ScheduleEditor = ({
  isOpen,
  onClose,
  currentScheduleType,
  currentScheduleDays,
  onSave,
}: ScheduleEditorProps) => {
  const { t } = useTranslation();
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
      // Keep first selected day or clear
      setSelectedDays(selectedDays.length > 0 ? [selectedDays[0]] : []);
    }
    // For custom, keep current selection
  };

  const handleDayToggle = (day: number) => {
    setShowValidation(false);

    if (scheduleType === 'weekly') {
      // Single-select: selecting one deselects others
      setSelectedDays([day]);
    } else if (scheduleType === 'custom') {
      // Multi-select: toggle each independently
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
          className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            key="schedule-editor-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="w-full max-w-[420px] rounded-t-[28px] border-t-[2px] border-x-[2px] border-border-theme shadow-[0_-8px_40px_rgba(0,0,0,0.6)] bg-os-card-bg"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Title */}
            <div className="text-center px-6 pb-4">
              <h3 className="text-[16px] font-bold font-['Outfit'] text-white/70 tracking-wide uppercase">
                {t('habits.scheduleEditor.title')}
              </h3>
            </div>

            {/* Schedule Type Selector */}
            <div className="flex gap-2 px-6 pb-5">
              {SCHEDULE_TYPE_OPTIONS.map((option) => {
                const isActive = scheduleType === option.value;
                const label = t(`habits.scheduleEditor.${option.value}`);
                return (
                  <motion.button
                    key={option.value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTypeChange(option.value)}
                    className={`flex-1 py-2.5 rounded-2xl font-['Outfit'] text-[13px] tracking-wide transition-all ${
                      isActive
                        ? 'bg-[#00FF85] text-black font-black shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                        : 'bg-[#1c1e22] text-white/40 border border-white/10 font-bold'
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
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="flex justify-center gap-2 px-6 pb-4">
                    {Array.from({ length: 7 }).map((_, index) => {
                      const label = t(`schedule.days.short.${index}`);
                      const isSelected = selectedDays.includes(index);
                      return (
                        <motion.button
                          key={index}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDayToggle(index)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-['Outfit'] text-[11px] font-bold tracking-wide transition-all ${
                            isSelected
                              ? 'bg-[#00FF85] text-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                              : 'bg-[#2a2c32] text-white/40 border border-white/10'
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
            <div className="px-6 pt-2 pb-8 space-y-3">
              {/* Save button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={showDayPicker && selectedDays.length === 0}
                className="w-full py-3.5 rounded-2xl border-[1.5px] border-[#00FF85]/40 bg-[#00FF85] text-[#141518] font-black font-['Outfit'] text-[14px] tracking-wide uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-40 disabled:shadow-none disabled:active:translate-x-0 disabled:active:translate-y-0"
              >
                {t('habits.scheduleEditor.save')}
              </motion.button>

              {/* Cancel button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full py-2.5 text-white/50 font-bold font-['Outfit'] text-[13px] tracking-wide uppercase transition-colors active:text-white/70"
              >
                {t('habits.scheduleEditor.cancel')}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScheduleEditor;
