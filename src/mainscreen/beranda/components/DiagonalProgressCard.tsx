import { useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Icon } from '@iconify/react';

interface DiagonalProgressCardProps {
  title: string;
  icon: string;
  current: number;
  total: number;
  label: string;
  description: string;
  showWarning?: boolean;
}

export const DiagonalProgressCard = ({ 
  title, 
  icon, 
  current, 
  total, 
  label,
  description,
  showWarning
}: DiagonalProgressCardProps) => {
  const percentage = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;
  
  // ALIVE UI ANIMATION LOGIC
  const springValue = useSpring(0, { stiffness: 60, damping: 18 });
  const displayValue = useTransform(springValue, (v) => Math.round(v));
  
  const ambientColor = useTransform(
    springValue, 
    [0, 50, 100], 
    ["rgba(255, 51, 51, 0.08)", "rgba(255, 145, 0, 0.10)", "rgba(0, 255, 133, 0.14)"]
  );
  
  const barGlow = useTransform(
    springValue,
    [0, 100],
    ["0 0 15px rgba(255, 51, 51, 0.25)", "0 0 25px rgba(0, 255, 133, 0.35)"]
  );

  useEffect(() => {
    springValue.set(percentage);
  }, [percentage, springValue]);

  const [displayNum, setDisplayNum] = useState(0);
  useEffect(() => {
    return displayValue.on("change", (v) => setDisplayNum(v));
  }, [displayValue]);

  const getProgressColor = (percent: number, total: number) => {
    if (total === 0) return 'rgba(255, 60, 60, 0.45)'; // Even more vibrant red for 0/0 state
    if (percent < 35) return '#FF3333'; 
    if (percent < 75) return '#FF9100'; 
    return '#00FF85'; 
  };

  const color = getProgressColor(percentage, total);

  return (
    <motion.div 
      whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
      className="relative w-full min-h-[82px] rounded-[22px] border-[1.5px] border-[#E3DAC9]/25 py-3.5 px-5 shadow-[4px_4px_0px_rgba(0,0,0,1)] overflow-hidden"
      style={{ 
        "--ambient-color": ambientColor,
        background: `radial-gradient(circle at -20% center, var(--ambient-color), transparent 60%), #151515`
      } as any}
    >
      <div className="flex flex-col gap-2.5 relative z-10">
        <div className="flex items-center gap-2.5 min-h-[20px]">
          <Icon icon={icon} className="text-[#E3DAC9] translate-y-[1px]" width={18} />
          <span className="text-[11.5px] font-black font-['Outfit'] text-[#E3DAC9] uppercase tracking-[0.18em]">
            {title}
          </span>
        </div>

        <div className="relative h-2 bg-black border-[0.5px] border-white/5 overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
          <div 
            className="absolute inset-0 opacity-[0.45]" 
            style={{ backgroundColor: color }} 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(percentage, 5)}%` }}
            transition={{ duration: 1.5, ease: "circOut" }}
            className="absolute top-0 left-0 h-full origin-left skew-x-[-20deg]"
            style={{ 
              backgroundColor: color, 
              width: `${Math.max(percentage, 5)}%`, 
              marginLeft: '-4px',
              boxShadow: barGlow as any
            }}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 -ml-0.5">
            <div className="flex items-center">
              <span className="text-[13px] font-black font-['Outfit'] text-[#E3DAC9] tracking-[0.25em] tabular-nums">
                {current}/{total}
              </span>
              <span className="text-[11px] font-black font-['Outfit'] text-[#E3DAC9] uppercase tracking-[0.15em] ml-0 opacity-80">
                {label}
              </span>
            </div>
            {showWarning && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full">
                <span className="text-[8px] font-black text-red-500 uppercase">Delay</span>
              </div>
            )}
          </div>
          <div className="flex items-baseline gap-0.5">
            <motion.span 
              className="text-[20px] font-black font-['Outfit'] text-[#E3DAC9] leading-none"
              style={{ textShadow: `0 0 12px ${color}40` }}
            >
              {displayNum}
            </motion.span>
            <span className="text-[11px] font-black text-[#E3DAC9] opacity-70">%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
