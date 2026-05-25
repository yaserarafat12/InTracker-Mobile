import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useFoodLogStore } from '../../../store/useFoodLogStore';
import { groupEntriesByMealType } from '../../../engines/foodLogEngine';
import type { FoodEntry } from '../../../engines/foodLogEngine';

interface FoodLogProps {
  entries: FoodEntry[];
  selectedDate: string;
}

const MEAL_ICONS: Record<string, string> = {
  breakfast: 'ph:sun-bold',
  lunch: 'ph:bowl-food-bold',
  dinner: 'ph:moon-bold',
  snack: 'ph:cookie-bold',
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export function FoodLog({ entries, selectedDate }: FoodLogProps) {
  const { deleteEntry } = useFoodLogStore();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const groupedEntries = useMemo(() => groupEntriesByMealType(entries), [entries]);

  const handleDelete = (id: string) => {
    deleteEntry(id);
    setConfirmDeleteId(null);
  };

  // Empty state
  if (entries.length === 0) {
    return (
      <div className="py-8 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Icon icon="ph:fork-knife" width={24} className="text-white/20" />
        </div>
        <p className="text-[13px] font-bold text-white/30 font-['Outfit']">
          No food logged yet
        </p>
        <p className="text-[11px] text-white/20">
          Tap Quick Add or Scan Food to start tracking
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-[12px] font-bold text-white/40 uppercase tracking-wider">
        Today's Food
      </h3>

      {groupedEntries.map((group) => (
        <div key={group.mealType} className="space-y-2">
          {/* Meal Type Header */}
          <div className="flex items-center gap-2">
            <Icon
              icon={MEAL_ICONS[group.mealType]}
              width={14}
              className="text-[#00FF85]/60"
            />
            <span className="text-[11px] font-bold text-[#E3DAC9]/50 uppercase tracking-wider">
              {MEAL_LABELS[group.mealType]}
            </span>
            <span className="text-[11px] text-white/20 ml-auto">
              {group.totalCalories} kcal
            </span>
          </div>

          {/* Entries */}
          <AnimatePresence>
            {group.entries.map((entry) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
              >
                {confirmDeleteId === entry.id ? (
                  /* Delete Confirmation */
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <p className="text-[12px] text-red-400 flex-1">Delete this entry?</p>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(entry.id)}
                      className="px-3 py-1.5 bg-red-500 rounded-lg text-[11px] font-bold text-white"
                    >
                      Delete
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1.5 bg-white/10 rounded-lg text-[11px] font-bold text-white/60"
                    >
                      Cancel
                    </motion.button>
                  </div>
                ) : (
                  /* Entry Row */
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setConfirmDeleteId(entry.id)}
                    className="w-full flex items-center justify-between bg-[#2a2c32]/50 border border-white/5 rounded-xl px-4 py-3 text-left"
                  >
                    <span className="text-[13px] font-bold text-[#E3DAC9] font-['Outfit'] truncate max-w-[200px]">
                      {entry.foodName}
                    </span>
                    <span className="text-[12px] font-bold text-white/40 ml-2 shrink-0">
                      {entry.calories} kcal
                    </span>
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
