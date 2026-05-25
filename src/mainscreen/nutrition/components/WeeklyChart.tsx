import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFoodLogStore } from '../../../store/useFoodLogStore';
import { calculateWeeklyChart } from '../../../engines/dashboardEngine';

interface WeeklyChartProps {
  selectedDate: string;
}

// --- Helpers ---

function getMonday(dateStr: string): Date {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  return monday;
}

// --- Component ---

export function WeeklyChart({ selectedDate }: WeeklyChartProps) {
  const { entries } = useFoodLogStore();

  const chartData = useMemo(() => {
    const weekStart = getMonday(selectedDate);
    const today = new Date();
    return calculateWeeklyChart(entries, weekStart, today);
  }, [entries, selectedDate]);

  const maxCalories = useMemo(
    () => Math.max(...chartData.days.map(d => d.calories), 1),
    [chartData.days]
  );

  return (
    <div className="bg-[#2a2c32] rounded-2xl border border-white/10 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.15em]">Minggu Ini</span>
        <span className="text-[10px] text-white/30 font-['Outfit']">
          <span className="text-white font-bold">{chartData.averageCalories}</span> kcal/hari · <span className="text-[#00FF85] font-bold">{chartData.daysLogged}</span> hari
        </span>
      </div>

      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-[100px]">
        {chartData.days.map((day, i) => {
          const barHeight = maxCalories > 0 ? (day.calories / maxCalories) * 100 : 0;

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full h-[80px] flex items-end justify-center">
                <motion.div
                  className={`w-full max-w-[24px] rounded-t-md ${
                    day.isToday ? 'bg-[#00FF85]' : day.calories > 0 ? 'bg-[#00FF85]/60' : 'bg-white/10'
                  }`}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(barHeight, day.calories > 0 ? 4 : 0)}%` }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: 'easeOut' }}
                />
              </div>
              <span className={`text-[10px] font-bold ${
                day.isToday ? 'text-[#00FF85]' : 'text-white/30'
              }`}>
                {day.dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
