import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../../i18n';
import { useUserStore } from '../../store/useUserStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useNutritionStore } from '../../store/useNutritionStore';
import { useFoodLogStore } from '../../store/useFoodLogStore';
import { calculateProgressRing, calculateMacroBars } from '../../engines/dashboardEngine';
import { calculateDailyTotals } from '../../engines/foodLogEngine';
import { OnboardingWizard } from './OnboardingWizard';
import { NutritionSettings } from './NutritionSettings';
import { ProgressRing } from './components/ProgressRing';
import { MacroBars } from './components/MacroBars';
import { DateNavigator } from './components/DateNavigator';
import { WeeklyChart } from './components/WeeklyChart';
import { FoodLog } from './components/FoodLog';
import { QuickAddSheet } from './QuickAddSheet';
import { FoodScanner } from './FoodScanner';

// --- Types ---

type DashboardView = 'dashboard' | 'settings' | 'quick-add' | 'scanner';

interface CalorieDashboardProps {
  onBack: () => void;
}

// --- Main Component ---

export function CalorieDashboard({ onBack }: CalorieDashboardProps) {
  const { onboardingComplete, targets } = useNutritionStore();
  const { selectedDate, getEntriesForDate, setSelectedDate, entries: allEntries } = useFoodLogStore();
  const [activeView, setActiveView] = useState<DashboardView>('dashboard');
  const { t } = useTranslation();
  const { settings } = useUserStore();

  // Reset to today when dashboard opens
  useEffect(() => {
    setSelectedDate(new Date().toLocaleDateString('en-CA'));
  }, [setSelectedDate]);

  // Lock body scroll to hide background page scrollbar & eliminate light mode gaps
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Get entries for the selected date
  const entries = useMemo(
    () => getEntriesForDate(selectedDate),
    [getEntriesForDate, selectedDate, allEntries]
  );

  // Calculate daily totals from entries
  const dailyTotals = useMemo(() => calculateDailyTotals(entries), [entries]);

  // Calculate progress ring data
  const progressData = useMemo(
    () => calculateProgressRing(dailyTotals.calories, targets?.dailyCalories ?? 0),
    [dailyTotals.calories, targets?.dailyCalories]
  );

  // Calculate macro bar data
  const macroData = useMemo(
    () =>
      calculateMacroBars(
        { protein: dailyTotals.protein, carbs: dailyTotals.carbs, fat: dailyTotals.fat },
        { protein: targets?.protein ?? 0, carbs: targets?.carbs ?? 0, fat: targets?.fat ?? 0 }
      ),
    [dailyTotals, targets]
  );

  // --- Onboarding Gate ---
  if (!onboardingComplete) {
    return createPortal(<OnboardingWizard onExit={onBack} />, document.body);
  }

  // --- Sub-view Navigation ---
  if (activeView === 'settings') {
    return createPortal(<NutritionSettings onBack={() => setActiveView('dashboard')} />, document.body);
  }

  if (activeView === 'scanner') {
    return createPortal(
      <FoodScanner
        isOpen={true}
        onClose={() => setActiveView('dashboard')}
      />,
      document.body
    );
  }

  const isLight = !document.documentElement.classList.contains('dark');

  // --- Dashboard View ---
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`fixed inset-0 nutrition-overlay z-[100] flex flex-col overflow-hidden transition-colors duration-300 ${
        isLight ? 'bg-[#f0fdf4] text-black' : 'bg-[#16181c] text-white'
      }`}
    >
      {/* Background image */}
      {isLight ? (
        <img
          src="/all_images/antigravitybg/calo_bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        <div
          className="absolute top-0 left-0 right-0 h-[50vh] pointer-events-none opacity-[0.6] z-0"
          style={{
            backgroundImage: "url('/all_images/features_bg/calorie_bg.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)'
          }}
        />
      )}
      {/* Header */}
      <div className="pt-14 pb-3 px-6 flex items-center justify-between relative">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className={`w-9 h-9 rounded-xl border-[2px] flex items-center justify-center transition-all ${
            isLight
              ? 'border-black bg-white text-black shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
              : 'border-white/10 bg-[#2a2c32] text-white shadow-none'
          }`}
          aria-label="Go back"
        >
          <Icon icon="ph:arrow-left-bold" width={18} className={isLight ? 'text-black' : 'text-white'} />
        </motion.button>

        <h1 className={`absolute left-1/2 -translate-x-1/2 text-[20px] font-black font-['Outfit'] ${
            isLight ? 'text-black' : 'text-force-white'
          }`}>
          {t('nutrition.title')}
        </h1>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setActiveView('settings')}
          className={`w-9 h-9 rounded-xl border-[2px] flex items-center justify-center transition-all ${
            isLight
              ? 'border-black bg-white text-black shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
              : 'border-white/10 bg-[#2a2c32] text-white shadow-none'
          }`}
          aria-label="Nutrition settings"
        >
          <Icon icon="ph:gear-six-bold" width={18} className={isLight ? 'text-black' : 'text-white'} />
        </motion.button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Progress Ring */}
            <div className="flex flex-col items-center pt-2">
              <ProgressRing
                consumed={dailyTotals.calories}
                target={targets?.dailyCalories ?? 0}
              />
            </div>

            {/* Macro Bars */}
            <MacroBars data={macroData} />

            {/* Calories Remaining */}
            <div className="text-center">
              <p className={`text-[13px] font-medium font-['Outfit'] ${
                isLight ? 'text-black/50' : 'text-white/30'
              }`}>
                {progressData.remaining >= 0
                  ? t('nutrition.caloriesRemaining').replace('{calories}', Math.round(progressData.remaining).toString())
                  : t('nutrition.caloriesExcess').replace('{calories}', Math.abs(Math.round(progressData.remaining)).toString())
                }
              </p>
            </div>

            {/* Date Navigator */}
            <DateNavigator />

            {/* Weekly Chart */}
            <WeeklyChart selectedDate={selectedDate} />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveView('scanner')}
                className={`flex-1 h-14 rounded-2xl border-[2px] flex items-center justify-center gap-2 transition-all ${
                  isLight
                    ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
                    : 'bg-[#2a2c32] border-white/10 text-white shadow-none'
                }`}
              >
                <Icon icon="ph:camera-bold" width={20} className={isLight ? 'text-black' : 'text-[#00FF85]'} />
                <span className={`text-[13px] font-bold font-['Outfit'] ${isLight ? 'text-black' : 'text-white'}`}>
                  {t('nutrition.scanFood')}
                </span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveView('quick-add')}
                className={`flex-1 h-14 rounded-2xl bg-[#00FF85] border-[2px] flex items-center justify-center gap-2 transition-all ${
                  isLight
                    ? 'border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
                    : 'border-transparent text-black shadow-none'
                }`}
              >
                <Icon icon="ph:plus-bold" width={18} className="text-black" />
                <span className="text-[13px] font-black font-['Outfit'] text-black">
                  {t('nutrition.quickAdd')}
                </span>
              </motion.button>
            </div>

            {/* Food Log */}
            <FoodLog entries={entries} selectedDate={selectedDate} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Quick Add Bottom Sheet */}
      <QuickAddSheet
        isOpen={activeView === 'quick-add'}
        onClose={() => setActiveView('dashboard')}
      />
    </motion.div>,
    document.body
  );
}
