import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

// Red Alert Animation System — Custom Styles (mirip Amber di /losestreak)
const RedAlertStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @keyframes redPulse {
      0%, 100% { 
        box-shadow: 0 0 40px rgba(239,68,68,0.2), inset 0 0 20px rgba(239,68,68,0.05);
        transform: scale(1);
      }
      50% { 
        box-shadow: 0 0 60px rgba(239,68,68,0.4), inset 0 0 30px rgba(239,68,68,0.1);
        transform: scale(1.002);
      }
    }
    .red-alert-card {
      position: relative;
      animation: redPulse 4s ease-in-out infinite;
    }
    .red-alert-card::before {
      content: "";
      position: absolute;
      inset: -1.5px;
      padding: 1.5px;
      border-radius: 36px;
      background: linear-gradient(
        135deg,
        #EF4444 0%,
        #FF8C00 50%,
        #EF4444 100%
      );
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      opacity: 0.8;
      pointer-events: none;
      z-index: 10;
    }
    .red-particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: #EF4444;
      border-radius: 50%;
      filter: blur(1px);
      pointer-events: none;
      z-index: 5;
      opacity: 0.5;
    }
    @keyframes redRotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .rotating-star-red {
      animation: redRotate 8s linear infinite;
      filter: drop-shadow(0 0 8px rgba(239,68,68,0.6));
    }
  `}} />
);

interface DelayedTasksModalProps {
  count: number;
  onCheck: () => void;
  onDismiss: () => void;
}

const PARTICLE_CONFIG = [
  { left: '15%', top: '20%', delay: 0, duration: 3.2 },
  { left: '80%', top: '15%', delay: 0.5, duration: 4.1 },
  { left: '70%', top: '60%', delay: 1.0, duration: 3.7 },
  { left: '10%', top: '70%', delay: 1.5, duration: 2.9 },
  { left: '50%', top: '80%', delay: 0.8, duration: 3.5 },
  { left: '90%', top: '40%', delay: 1.2, duration: 4.3 },
];

export const DelayedTasksModal = ({ count, onCheck, onDismiss }: DelayedTasksModalProps) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-5">
      <RedAlertStyles />

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
        onClick={onDismiss}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-[360px] rounded-[36px] border-[1.5px] border-[#E3DAC9]/10 bg-[#212121] red-alert-card"
      >
        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[36px]">
          {PARTICLE_CONFIG.map((p, i) => (
            <motion.span
              key={i}
              className="red-particle"
              style={{ left: p.left, top: p.top }}
              animate={{
                y: [0, -18, 0],
                x: [0, i % 2 === 0 ? 10 : -10, 0],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="pt-10 px-8 pb-10">

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-4 relative">
              <div className="rotating-star-red">
                <Icon icon="solar:star-bold" className="text-[#EF4444]" width={32} />
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[#EF4444] text-[9px] font-black font-['Outfit'] uppercase tracking-[0.2em] whitespace-nowrap bg-[#212121] px-2">Peringatan</span>
            </div>
            <h3 className="text-[20px] font-black font-['Outfit'] text-white leading-tight tracking-[0.2px]">
              Tugas kamu belum beres!
            </h3>
            <p className="text-[14px] font-bold font-['Outfit'] text-white mt-4">
              <span className="text-[#EF4444]">{count} tugas</span> kemarin masih nunggu kamu
            </p>
          </div>

          {/* Divider */}
          <div className="h-[1px] bg-[#E3DAC9]/8 mb-5" />

          {/* Info Card */}
          <div className="flex items-center gap-3 p-4 bg-white/[0.03] border border-[#E3DAC9]/15 rounded-[16px] mb-10">
            <div className="w-11 h-11 rounded-[12px] flex items-center justify-center flex-shrink-0 border-[1.5px]"
              style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                borderColor: 'rgba(239,68,68,0.25)',
              }}
            >
              <Icon icon="solar:list-bold" className="text-[#EF4444]" width={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] font-black font-['Outfit'] text-white truncate">
                {count} Tugas Tertunda
              </span>
              <span className="text-[10px] font-bold font-['Outfit'] text-[#E3DAC9]/40">
                Belum diselesaikan kemarin
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <motion.button
            whileTap={{ x: 4, y: 4, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
            onClick={onCheck}
            className="w-full py-4 bg-[#00FF85] text-black text-[13px] font-black font-['Outfit'] rounded-[14px] uppercase tracking-wider flex items-center justify-center border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1),0_4px_20px_rgba(0,255,133,0.2)] transition-all mb-3"
          >
            Beresin Sekarang
          </motion.button>

          <motion.button
            whileTap={{ x: 4, y: 4, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
            onClick={onDismiss}
            className="w-full py-3.5 bg-[#EF4444] rounded-[14px] text-white text-[11px] font-black font-['Outfit'] uppercase tracking-wider border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all"
          >
            Lewatin Dulu
          </motion.button>

        </div>
      </motion.div>
    </div>
  );
};
