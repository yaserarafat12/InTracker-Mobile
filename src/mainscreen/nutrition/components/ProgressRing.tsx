import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { calculateProgressRing } from '../../../engines/dashboardEngine';

// --- Types ---

interface ProgressRingProps {
  consumed: number;
  target: number;
}

// --- Constants ---

const RING_SIZE = 200;
const STROKE_WIDTH = 12;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const COLOR_NORMAL = '#00FF85';
const COLOR_OVER_TARGET = '#FF4D00';
const COLOR_TRACK = 'rgba(255, 255, 255, 0.06)';

// --- Component ---

export const ProgressRing = ({ consumed, target }: ProgressRingProps) => {
  const progressData = useMemo(
    () => calculateProgressRing(consumed, target),
    [consumed, target]
  );

  const isOverTarget = progressData.remaining < 0;
  const ringColor = isOverTarget ? COLOR_OVER_TARGET : COLOR_NORMAL;

  // Calculate stroke-dashoffset for the fill arc
  const strokeDashoffset =
    CIRCUMFERENCE - (progressData.fillPercentage / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center">
      {/* SVG Progress Ring */}
      <div className="relative overflow-hidden" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={COLOR_TRACK}
            strokeWidth={STROKE_WIDTH}
          />
          {/* Progress arc with animation */}
          <motion.circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${ringColor}80)` }}
          />
        </svg>

        {/* Center content: consumed calories */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`text-[32px] font-black font-['Outfit'] leading-none ${
              isOverTarget ? 'text-[#FF4D00]' : 'text-white'
            }`}
          >
            {Math.round(progressData.consumed)}
          </span>
          <span className="text-[12px] font-bold text-white/50 font-['Outfit'] mt-1.5 uppercase tracking-wider">
            / {Math.round(progressData.target)} cal
          </span>
        </div>
      </div>
    </div>
  );
};
