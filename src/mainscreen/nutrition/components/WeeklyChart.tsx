import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFoodLogStore } from '../../../store/useFoodLogStore';
import { useNutritionStore } from '../../../store/useNutritionStore';
import { calculateWeeklyChart } from '../../../engines/dashboardEngine';
import { useTranslation } from '../../../i18n';

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

/** Generate round Y-axis ticks based on the target, e.g. [400, 800, 1200, 1600] */
function generateYTicks(target: number, steps = 4): number[] {
  if (target <= 0) return [400, 800, 1200, 1600];
  const stepSize = Math.ceil(target / steps / 100) * 100; // round to nearest 100
  return Array.from({ length: steps }, (_, i) => stepSize * (i + 1));
}

// --- Component ---

export function WeeklyChart({ selectedDate }: WeeklyChartProps) {
  const { entries } = useFoodLogStore();
  const { targets } = useNutritionStore();
  const { t } = useTranslation();

  const dailyTarget = targets?.dailyCalories ?? 1600;

  const chartData = useMemo(() => {
    const weekStart = getMonday(selectedDate);
    const today = new Date();
    return calculateWeeklyChart(entries, weekStart, today);
  }, [entries, selectedDate]);

  // Y-axis ticks derived from target
  const yTicks = useMemo(() => generateYTicks(dailyTarget, 4), [dailyTarget]);
  const chartMax = yTicks[yTicks.length - 1]; // e.g. 1600

  const CHART_HEIGHT = 100; // px — the bar area height

  return (
    <div className="bg-[#2a2c32] rounded-2xl border border-white/10 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.15em]">{t('nutrition.thisWeek')}</span>
        <span className="text-[10px] text-white/30 font-['Outfit']">
          <span className="text-white font-bold">{chartData.averageCalories}</span> {t('nutrition.kcalPerDay')} ·{' '}
          <span className="text-[#00FF85] font-bold">{chartData.daysLogged}</span> {t('nutrition.days')}
        </span>
      </div>

      {/* Chart area: Y-axis + Bars */}
      <div className="flex gap-2">
        {/* Y-axis labels */}
        <div
          className="flex flex-col-reverse justify-between text-right pr-1 flex-shrink-0"
          style={{ height: CHART_HEIGHT }}
        >
          {yTicks.map((tick) => (
            <span key={tick} className="text-[9px] font-bold text-white/25 leading-none">
              {tick >= 1000 ? `${tick / 1000}k` : tick}
            </span>
          ))}
        </div>

        {/* Bars + Grid */}
        <div className="relative flex-1" style={{ height: CHART_HEIGHT }}>
          {/* Horizontal grid lines at each tick */}
          {yTicks.map((tick) => {
            const yPct = (tick / chartMax) * 100;
            return (
              <div
                key={tick}
                className="absolute left-0 right-0 border-t border-white/[0.06]"
                style={{ bottom: `${yPct}%` }}
              />
            );
          })}

          {/* Target line (top) highlighted */}
          <div className="absolute left-0 right-0 border-t border-dashed border-[#00FF85]/20" style={{ bottom: '100%' }} />

          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-between gap-1">
            {chartData.days.map((day, i) => {
              const barHeightPct = chartMax > 0 ? Math.min((day.calories / chartMax) * 100, 100) : 0;
              const isOverTarget = day.calories > dailyTarget;

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <motion.div
                    className={`w-full max-w-[20px] rounded-t-sm ${
                      isOverTarget
                        ? 'bg-[#FF4D00]'
                        : day.isToday
                        ? 'bg-[#00FF85]'
                        : day.calories > 0
                        ? 'bg-[#00FF85]/55'
                        : 'bg-white/[0.08]'
                    }`}
                    style={{
                      boxShadow: day.calories > 0
                        ? `0 0 6px ${isOverTarget ? '#FF4D0066' : '#00FF8540'}`
                        : undefined,
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(barHeightPct, day.calories > 0 ? 3 : 0)}%` }}
                    transition={{ duration: 0.4, delay: i * 0.05, ease: 'easeOut' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis day labels */}
      <div className="flex gap-2 mt-1.5 pl-[calc(1.5rem+4px)]">
        {chartData.days.map((day) => {
          const dayOfWeek = new Date(day.date + 'T00:00:00').getDay();
          return (
            <div key={day.date} className="flex-1 flex justify-center">
              <span
                className={`text-[10px] font-bold ${
                  day.isToday ? 'text-[#00FF85]' : 'text-white/30'
                }`}
              >
                {t(`schedule.days.short.${dayOfWeek}`)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
