import { motion } from 'framer-motion';
import type { MacroBarData } from '../../../engines/dashboardEngine';

interface MacroBarsProps {
  data: MacroBarData;
}

interface SingleBarProps {
  label: string;
  consumed: number;
  target: number;
  fillPercentage: number;
  isOver: boolean;
  color: string;
}

function SingleBar({ label, consumed, target, fillPercentage, isOver, color }: SingleBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">{label}</span>
        <span className={`text-[11px] font-bold ${isOver ? 'text-[#FF4D00]' : 'text-[#E3DAC9]/60'}`}>
          {Math.round(consumed)}g / {Math.round(target)}g
        </span>
      </div>
      <div className="h-2.5 bg-white/6 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: isOver ? '#FF4D00' : color, boxShadow: `0 0 8px ${isOver ? '#FF4D00' : color}80` }}
          initial={{ width: 0 }}
          animate={{ width: `${fillPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function MacroBars({ data }: MacroBarsProps) {
  return (
    <div className="bg-[#2a2c32] rounded-2xl border border-white/10 p-4 space-y-3">
      <SingleBar
        label="Protein"
        consumed={data.protein.consumed}
        target={data.protein.target}
        fillPercentage={data.protein.fillPercentage}
        isOver={data.protein.isOver}
        color="#00FF85"
      />
      <SingleBar
        label="Carbs"
        consumed={data.carbs.consumed}
        target={data.carbs.target}
        fillPercentage={data.carbs.fillPercentage}
        isOver={data.carbs.isOver}
        color="#FFD700"
      />
      <SingleBar
        label="Fat"
        consumed={data.fat.consumed}
        target={data.fat.target}
        fillPercentage={data.fat.fillPercentage}
        isOver={data.fat.isOver}
        color="#FF6B6B"
      />
    </div>
  );
}
