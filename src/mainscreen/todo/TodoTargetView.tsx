import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate, Reorder } from 'framer-motion';
import { Icon } from '@iconify/react';
import {
  createTargetStep,
  getTargetProgress,
  type TargetItem,
  type TargetMode,
  type TargetPriority,
  type TargetWindow,
  useTargetStore,
} from '../../store/useTargetStore';
import { AddTodoSheet } from './AddTodoSheet';
import { getPrismStyle } from '../../utils/design';
import LoadingScreen from '../../components/LoadingScreen';
import { playNotifSfx } from '../../utils/sfx';

// Golden Hour Star System — Animated Styles
const StarSystemStyles = () => (
  <style>{`
    @keyframes starBorderRotate {
      0% { --star-angle: 0deg; }
      100% { --star-angle: 360deg; }
    }
    @keyframes starPulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.15); }
    }
    @keyframes starParticleFloat1 {
      0%, 100% { transform: translate(0, 0) scale(0.8); opacity: 0; }
      10% { opacity: 1; }
      50% { transform: translate(-12px, -18px) scale(1.2); opacity: 0.8; }
      90% { opacity: 0; }
    }
    @keyframes starParticleFloat2 {
      0%, 100% { transform: translate(0, 0) scale(0.6); opacity: 0; }
      15% { opacity: 1; }
      55% { transform: translate(14px, -22px) scale(1); opacity: 0.7; }
      95% { opacity: 0; }
    }
    @keyframes starParticleFloat3 {
      0%, 100% { transform: translate(0, 0) scale(0.5); opacity: 0; }
      20% { opacity: 0.9; }
      60% { transform: translate(-8px, -26px) scale(1.1); opacity: 0.6; }
      100% { opacity: 0; }
    }
    @keyframes starGlowPulse {
      0%, 100% { box-shadow: 0 0 15px rgba(0,255,133,0.15), 0 0 30px rgba(0,255,133,0.05), 7px 7px 0px rgba(0,0,0,1); }
      50% { box-shadow: 0 0 25px rgba(0,255,133,0.25), 0 0 50px rgba(0,255,133,0.1), 7px 7px 0px rgba(0,0,0,1); }
    }
    .starred-card {
      animation: starGlowPulse 3s ease-in-out infinite;
      border-color: rgba(0,255,133,0.35) !important;
    }
    .starred-card::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: 14px;
      padding: 1.5px;
      background: conic-gradient(
        from var(--star-angle, 0deg),
        transparent 0%,
        #00FF85 15%,
        #00FF85 30%,
        transparent 45%,
        transparent 55%,
        #00FF85 70%,
        #00FF85 85%,
        transparent 100%
      );
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      animation: starBorderRotate 4s linear infinite;
      pointer-events: none;
      z-index: 1;
    }
    @property --star-angle {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }
    .star-particle {
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #00FF85;
      pointer-events: none;
      z-index: 2;
      will-change: transform, opacity;
    }
    .star-particle:nth-child(1) { top: 15%; right: 8%; animation: starParticleFloat1 2.8s ease-in-out infinite; }
    .star-particle:nth-child(2) { top: 40%; right: 3%; animation: starParticleFloat2 3.4s ease-in-out infinite 0.5s; }
    .star-particle:nth-child(3) { bottom: 20%; right: 12%; animation: starParticleFloat3 3s ease-in-out infinite 1s; }
  `}</style>
);

export type TargetFilter = 'today' | 'upcoming' | 'someday' | 'delayed' | 'done';

// Labels and Options moved to store or removed if unused


// getTargetMeta and TargetProgressBar removed as they are unused in current UI

const TargetCard = ({ target, index, onOpen }: { target: TargetItem; index: number; onOpen: (target: TargetItem) => void }) => {
  const { toggleStar, toggleComplete, deleteTarget, updateTargetWindow } = useTargetStore();
  const x = useMotionValue(0);
  const [justCompleted, setJustCompleted] = useState(false);

  // Swipe transformations
  const editOpacity = useTransform(x, [20, 80], [0, 1]);
  const deleteOpacity = useTransform(x, [-20, -80], [0, 1]);
  const scaleAction = useTransform(x, [-100, 0, 100], [1, 0.95, 1]);

  const handleDragEnd = (_: any, info: { velocity: { x: number } }) => {
    const currentX = x.get();
    const threshold = 60;
    if (currentX > threshold) {
      animate(x, 80, { type: 'spring', stiffness: 500, damping: 30 });
    } else if (currentX < -threshold) {
      animate(x, -80, { type: 'spring', stiffness: 500, damping: 30 });
    } else {
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
    }
  };

  const handleAction = (type: 'edit' | 'delete') => {
    if (navigator.vibrate) navigator.vibrate(10);
    if (type === 'delete') {
      if (confirm(`Hapus target "${target.title}"?`)) {
        deleteTarget(target.id);
      }
    } else {
      onOpen(target); // Open detail/edit sheet
    }
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
  };

  return (
    <div className="relative w-full">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-2">
        {/* Edit Action (Left) - Dynamic for Delayed */}
        <motion.button
          style={{ opacity: editOpacity, scale: scaleAction }}
          onClick={() => target.window === 'delayed' ? updateTargetWindow(target.id, 'today') : handleAction('edit')}
          className={`w-16 h-[80%] rounded-xl border-[1.5px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center gap-1 text-black active:scale-90 transition-all bg-[#E3DAC9]`}
        >
          <Icon icon={target.window === 'delayed' ? "ph:arrows-counter-clockwise-bold" : "ph:pencil-simple-bold"} width={20} height={20} />
          <span className="text-[8px] font-black font-['Outfit'] uppercase tracking-wider">{target.window === 'delayed' ? 'Pulihkan' : 'Edit'}</span>
        </motion.button>

        {/* Delete Action (Right) */}
        <motion.button
          style={{ opacity: deleteOpacity, scale: scaleAction }}
          onClick={() => handleAction('delete')}
          className="w-16 h-[80%] rounded-xl bg-[#EF4444] border-[1.5px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center gap-1 text-white active:scale-90 transition-all"
        >
          <Icon icon="ph:trash-bold" width={20} height={20} />
          <span className="text-[8px] font-black font-['Outfit'] uppercase tracking-wider">Hapus</span>
        </motion.button>
      </div>

      {/* Main Card Content */}
      <motion.div
        whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
        onClick={() => onOpen(target)}
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className={`w-full rounded-[8px] border-[1.5px] border-[#E3DAC9]/20 relative cursor-pointer ${
          target.starred ? 'starred-card z-30' : 'shadow-[4px_4px_0px_rgba(0,0,0,1)] z-10'
        }`}
      >
        {!target.completed && (
          <>
            {/* Base Surface with Subtle Gradient */}
            <div 
              className="absolute inset-0 z-[-4] rounded-[6.5px]" 
              style={{
                background: 'linear-gradient(145deg, #22252a 0%, #1a1c20 100%)'
              }}
            />
            {/* NOISE TEXTURE LAYER - Adds organic depth to solid colors */}
            <div 
              className="absolute inset-0 z-[-3] rounded-[6.5px] opacity-[0.2] mix-blend-overlay pointer-events-none" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
              }}
            />
            {/* Inner Highlight (Top Edge) for Physical Depth */}
            <div className="absolute inset-[0.5px] z-[-2] rounded-[6px] border-t-[1.2px] border-white/[0.08] pointer-events-none" />
            {/* Subtle Inner Glow (Left Side) */}
            <div className="absolute inset-[0.5px] z-[-2] rounded-[6px] border-l-[1px] border-white/[0.03] pointer-events-none" />
            {/* Soft Ambient Inner Glow */}
            <div className="absolute inset-0 z-[-1] rounded-[6.5px] shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),inset_0_-1px_1px_rgba(0,0,0,0.5)] pointer-events-none" />
          </>
        )}

        {/* TEMPERED GLASS LAYER (BLUR & TINT) - Only for completed */}
        <div className={`absolute inset-0 z-[-1] rounded-[6.5px] ${target.completed ? 'bg-black/70 backdrop-blur-[15px]' : ''}`} />

        {/* GLASS REFLECTION SHINE */}
        {/* Clean surface - removed reflection for solid charcoal look */}
        {!target.completed && (
          <div className="absolute inset-0 z-[-1] rounded-[6.5px] bg-transparent pointer-events-none" />
        )}

        <div className="p-2 relative">
          {/* Delayed Overlay Visuals */}
          {target.window === 'delayed' && !target.completed && (
            <div className="absolute inset-0 z-[10] flex items-center justify-center rounded-[6.5px] overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-red-500/[0.02]" />
              <div className="absolute top-2 right-10">
                <span className="text-[7px] font-black text-[#EF4444] uppercase tracking-[0.2em] bg-black/60 px-1.5 py-0.5 rounded-full border border-[#EF4444]/20">Terlambat</span>
              </div>
            </div>
          )}

          {/* Golden particles for starred cards */}
          {target.starred && (
            <>
              <span className="star-particle" />
              <span className="star-particle" />
              <span className="star-particle" />
            </>
          )}

          <div className="flex items-center gap-3 py-0.5 relative z-[3]">
            {/* Square Checklist with bounce animation */}
            <motion.div
              whileTap={{ scale: 0.85 }}
              animate={justCompleted ? { scale: [1, 1.35, 0.9, 1.1, 1] } : {}}
              transition={justCompleted ? { duration: 0.5, ease: 'easeOut' } : {}}
              onClick={(e) => {
                e.stopPropagation();
                const wasCompleted = target.completed;
                toggleComplete(target.id);
                if (navigator.vibrate) navigator.vibrate(8);
                if (!wasCompleted) {
                  playNotifSfx();
                  setJustCompleted(true);
                  setTimeout(() => setJustCompleted(false), 800);
                }
              }}
              className={`w-[35px] h-[35px] rounded-[7px] border-[1.5px] flex items-center justify-center transition-all shrink-0 ${
                target.completed ? 'bg-[#00FF85] border-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)]' : 'border-white/10 bg-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
              }`}
            >
              {target.completed && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  <Icon icon="ph:check-bold" width={22} height={22} className="text-black" />
                </motion.div>
              )}
            </motion.div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(6);
                onOpen(target);
              }}
              className="flex-1 text-left min-w-0"
            >
              <h3
                className={`text-[14px] font-black font-['Outfit'] leading-tight tracking-normal transition-all duration-300 ${
                  target.completed ? 'text-white/20 line-through' : 'text-[#E3DAC9] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]'
                }`}
                style={target.completed ? { textDecorationColor: 'rgba(0,255,133,0.5)' } : {}}
              >
                {target.title}
              </h3>
            </motion.button>

            {/* Green flash overlay on completion */}
            <AnimatePresence>
              {justCompleted && (
                <motion.div
                  initial={{ opacity: 0.7, scale: 0.95 }}
                  animate={{ opacity: 0, scale: 1.02 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-[6px] bg-[#00FF85]/20 pointer-events-none z-[5]"
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Magical Star Cluster Toggle - MOVED OUTSIDE PADDING FOR PRECISION */}
        <motion.button
          whileTap={{ scale: 0.75 }}
          onClick={(e) => {
            e.stopPropagation();
            toggleStar(target.id);
            if (navigator.vibrate) navigator.vibrate(target.starred ? 4 : [6, 20, 6]);
          }}
          className={`absolute z-[40] flex items-center justify-center transition-all ${
            target.starred 
              ? 'top-[-20px] right-[-20px] w-14 h-14 translate-y-0' 
              : 'top-1/2 right-2 w-10 h-10 -translate-y-1/2'
          }`}
        >
          {target.starred ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Main Big Star */}
              <motion.div
                initial={{ scale: 0.5, rotate: 0 }}
                animate={{ scale: 1.1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="z-[2]"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#00FF85" className="drop-shadow-[0_0_12px_rgba(0,255,133,0.8)]">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </motion.div>

              {/* Smaller Support Star 1 (Top Left) */}
              <motion.div
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{ scale: 1, x: -16, y: 10, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
                className="absolute z-[1]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#00FF85">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </motion.div>

              {/* Smaller Support Star 2 (Bottom Left) */}
              <motion.div
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{ scale: 1, x: -8, y: 24, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22, delay: 0.1 }}
                className="absolute z-[1]"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#00FF85">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </motion.div>

              {/* NEW: Star 3 (Far Left) */}
              <motion.div
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{ scale: 0.8, x: -22, y: 2, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 250, damping: 18, delay: 0.15 }}
                className="absolute z-[1]"
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="#00FF85">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </motion.div>

              {/* NEW: Star 4 (Bottom Right-ish) */}
              <motion.div
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{ scale: 0.7, x: 2, y: 28, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.2 }}
                className="absolute z-[1]"
              >
                <svg width="6" height="6" viewBox="0 0 24 24" fill="#80FFBB">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </motion.div>
            </div>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};

const EmptyTargetState = ({ onAdd }: { onAdd: () => void }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    whileTap={{ x: 3, y: 3, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
    onClick={onAdd}
    className="w-full min-h-[160px] rounded-[14px] border-[2px] border-black bg-[#E3DAC9]/[0.03] flex flex-col items-center justify-center px-8 text-center shadow-[6px_6px_0px_rgba(0,0,0,1)]"
  >
    <div className="w-12 h-12 rounded-xl bg-[#E3DAC9] border-[1.5px] border-black flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
      <Icon icon="solar:add-circle-bold" width={24} height={24} className="text-black" />
    </div>
    <h3 className="mt-4 text-[20px] font-black text-white">Tambah Target Baru</h3>
    <p className="mt-1 text-[11px] font-bold uppercase text-[#E3DAC9]/40 leading-relaxed">
      Pecah objektif besar jadi langkah kecil yang bisa dieksekusi.
    </p>
  </motion.button>
);

const EmptyHistoryState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    className="w-full min-h-[190px] rounded-[20px] border border-white/10 bg-[#22252a] flex flex-col items-center justify-center px-8 text-center shadow-[7px_7px_0px_rgba(0,0,0,1)]"
  >
    <h3 className="text-[23px] font-black text-white">Belum Ada Riwayat</h3>
    <p className="mt-2 text-[12px] font-bold uppercase text-[#E3DAC9]/35 leading-relaxed">
      Target selesai akan jadi arsip progres di sini.
    </p>
  </motion.div>
);



const TargetDetailSheet = ({ target, onClose }: { target: TargetItem; onClose: () => void }) => {
  const { completeTarget, deleteTarget, toggleStep, updateNumberProgress, updateTargetWindow } = useTargetStore();
  const progress = getTargetProgress(target);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/90"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 27, stiffness: 210 }}
        className="fixed inset-x-0 bottom-0 z-[70] max-h-[88vh] rounded-t-[34px] bg-[#22252a] border-t border-white/10 shadow-[0_-25px_60px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        <div className="px-6 pt-5 pb-5 border-b border-white/5">
          <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-6" />
          <div className="flex items-start gap-4">
            {/* Icon Container Removed */}
            <div className="min-w-0 flex-1">
              {/* Priority Labels Removed */}
              <h2 className="mt-1 text-[24px] font-black font-['Outfit'] leading-[1.1] tracking-normal text-white">{target.title}</h2>
            </div>
            <motion.button
              whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-[#222] border-[1.5px] border-black flex items-center justify-center transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)]"
            >
              <Icon icon="ph:x-bold" width={17} height={17} className="text-[#E3DAC9]" />
            </motion.button>
          </div>

          {/* Progress Section Removed as per request */}
        </div>

        <div className="px-6 py-6 overflow-y-auto max-h-[calc(88vh-235px)] pb-10">
          {target.mode === 'checklist' ? (
            <div className="space-y-3">
              {target.steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => {
                    toggleStep(target.id, step.id);
                    if (navigator.vibrate) navigator.vibrate(6);
                  }}
                  className={`w-full rounded-[22px] border p-4 flex items-center gap-4 text-left transition-all ${
                    step.completed ? 'bg-[#E3DAC9]/10 border-[#E3DAC9]/30' : 'bg-[#222] border-white/10'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl border-[1.5px] flex items-center justify-center shrink-0 ${
                      step.completed ? 'bg-[#E3DAC9] border-black' : 'border-white/15'
                    }`}
                  >
                    {step.completed && <Icon icon="solar:check-bold" width={18} height={18} className="text-black" />}
                  </div>
                  <span className={`text-[14px] font-semibold font-['Outfit'] tracking-normal ${step.completed ? 'text-[#E3DAC9]/40 line-through' : 'text-[#E3DAC9]'}`}>
                    {step.title}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] bg-[#222] border border-white/10 p-5">
              <p className="text-[10px] font-black font-['Outfit'] uppercase tracking-widest text-[#E3DAC9]">Update Angka</p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => updateNumberProgress(target.id, target.currentValue - 1)}
                  className="w-12 h-12 rounded-2xl bg-black/35 border border-white/10 flex items-center justify-center active:scale-90"
                >
                  <Icon icon="solar:minus-bold" width={20} height={20} />
                </button>
                <input
                  value={target.currentValue}
                  onChange={(event) => updateNumberProgress(target.id, Number(event.target.value) || 0)}
                  type="number"
                  className="min-w-0 flex-1 h-12 rounded-2xl bg-black/35 border border-white/10 px-4 text-center text-[18px] font-black text-[#E3DAC9] outline-none"
                />
                <button
                  onClick={() => updateNumberProgress(target.id, target.currentValue + 1)}
                  className="w-12 h-12 rounded-2xl bg-[#E3DAC9] border-[1.5px] border-black text-black flex items-center justify-center active:scale-90"
                >
                  <Icon icon="solar:add-bold" width={20} height={20} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <motion.button
              whileTap={{ x: 3, y: 3, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
              onClick={() => {
                completeTarget(target.id);
                if (navigator.vibrate) navigator.vibrate([10, 25, 10]);
                onClose();
              }}
              className="w-full h-16 rounded-[22px] bg-[#00FF85] border-[2px] border-black text-black font-black uppercase shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
            >
              <Icon icon="solar:check-circle-bold" width={22} height={22} />
              Selesaikan
            </motion.button>

            {/* Pindahkan - 2 opsi */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Pindahkan</span>
              <div className="grid grid-cols-2 gap-3">
                {target.window !== 'today' && (
                  <button
                    onClick={() => {
                      updateTargetWindow(target.id, 'today');
                      if (navigator.vibrate) navigator.vibrate(8);
                      onClose();
                    }}
                    className="h-14 rounded-2xl bg-[#00FF85]/15 border-[1.5px] border-[#00FF85]/30 text-[#00FF85] font-black text-[11px] uppercase active:scale-95 transition-all flex flex-col items-center justify-center"
                  >
                    <Icon icon="solar:calendar-bold" width={18} height={18} />
                    <span>Hari Ini</span>
                  </button>
                )}
                {target.window !== 'upcoming' && (
                  <button
                    onClick={() => {
                      updateTargetWindow(target.id, 'upcoming');
                      if (navigator.vibrate) navigator.vibrate(8);
                      onClose();
                    }}
                    className="h-14 rounded-2xl bg-[#22252a] border-[1.5px] border-white/15 text-white/60 font-black text-[11px] uppercase active:scale-95 transition-all flex flex-col items-center justify-center"
                  >
                    <Icon icon="solar:calendar-mark-bold" width={18} height={18} />
                    <span>Mendatang</span>
                  </button>
                )}
                {target.window !== 'someday' && (
                  <button
                    onClick={() => {
                      updateTargetWindow(target.id, 'someday');
                      if (navigator.vibrate) navigator.vibrate(8);
                      onClose();
                    }}
                    className="h-14 rounded-2xl bg-[#22252a] border-[1.5px] border-white/15 text-white/60 font-black text-[11px] uppercase active:scale-95 transition-all flex flex-col items-center justify-center"
                  >
                    <Icon icon="solar:star-fall-bold" width={18} height={18} />
                    <span>Suatu Hari</span>
                  </button>
                )}
              </div>
            </div>

            {/* Hapus */}
            <button
              onClick={() => {
                if (confirm('Hapus tugas ini?')) {
                  deleteTarget(target.id);
                  if (navigator.vibrate) navigator.vibrate(10);
                  onClose();
                }
              }}
              className="w-full h-14 rounded-2xl bg-[#EF4444]/10 border-[1.5px] border-[#EF4444]/30 text-[#EF4444] font-black text-[12px] uppercase active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Icon icon="solar:trash-bin-trash-bold" width={18} height={18} />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

const DelayedClarificationSheet = ({ target, onClose }: { target: TargetItem; onClose: () => void }) => {
  const { updateTargetWindow, deleteTarget } = useTargetStore();

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 27, stiffness: 210 }}
        className="fixed inset-x-0 bottom-0 z-[90] rounded-t-[34px] bg-[#22252a] border-t border-[#EF4444]/20 shadow-[0_-25px_60px_rgba(239,68,68,0.15)] overflow-hidden"
      >
        <div className="px-8 pt-8 pb-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-[24px] bg-[#EF4444]/10 border-[1.5px] border-[#EF4444]/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <Icon icon="solar:danger-bold" width={32} height={32} className="text-[#EF4444]" />
            </div>
            
            <h2 className="text-[24px] font-black font-['Outfit'] text-white leading-tight tracking-normal">Tugas Tertunda</h2>
            <p className="mt-3 text-[14px] font-medium font-['Outfit'] text-[#E3DAC9]/40 max-w-[260px] leading-relaxed">
              "<span className="text-[#E3DAC9] font-semibold">{target.title}</span>" belum diselesaikan. Pilih tindakan:
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <button
              onClick={() => {
                updateTargetWindow(target.id, 'today');
                if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
                onClose();
              }}
              className="w-full h-16 rounded-[22px] bg-[#00FF85] border-[2px] border-black text-black font-black uppercase shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-3"
            >
              <Icon icon="ph:arrows-counter-clockwise-bold" width={24} height={24} />
              <span>Pulihkan ke Hari Ini</span>
            </button>

            <button
              onClick={() => {
                updateTargetWindow(target.id, 'upcoming');
                if (navigator.vibrate) navigator.vibrate(8);
                onClose();
              }}
              className="w-full h-16 rounded-[22px] bg-[#22252a] border-[2px] border-white/15 text-white font-black uppercase active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <Icon icon="solar:calendar-bold" width={22} height={22} />
              <span>Pindah ke Mendatang</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Yakin hapus tugas ini?')) {
                  deleteTarget(target.id);
                  if (navigator.vibrate) navigator.vibrate(10);
                  onClose();
                }
              }}
              className="w-full h-16 rounded-[22px] bg-[#EF4444]/10 border-[2px] border-[#EF4444]/30 text-[#EF4444] font-black uppercase active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <Icon icon="ph:trash-bold" width={22} height={22} />
              <span>Hapus</span>
            </button>

            <button
              onClick={onClose}
              className="w-full h-14 text-[13px] font-black uppercase text-white/20 tracking-widest mt-2"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default function TodoTargetView({ initialFilter }: { initialFilter?: TargetFilter }) {
  const { targets, loading } = useTargetStore();
  const [activeFilter, setActiveFilter] = useState<TargetFilter>(initialFilter || 'today');

  // Sync with initialFilter if it changes externally
  useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<TargetItem | null>(null);
  const [clarifyTarget, setClarifyTarget] = useState<TargetItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const quickAddRef = useRef<HTMLInputElement>(null);
  
  // Scroll indicator state for filter tabs
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(40);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  if (loading) {
    return <LoadingScreen message="Memuat target..." />;
  }

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setShowScrollIndicator(false);
      return;
    }
    setShowScrollIndicator(true);
    const thumbWidth = Math.max(30, (el.clientWidth / el.scrollWidth) * 100);
    const leftPos = (el.scrollLeft / maxScroll) * (100 - thumbWidth);
    setScrollProgress(thumbWidth);
    setScrollLeft(leftPos);
  };

  useEffect(() => {
    // Check on mount if scrollable
    const el = scrollRef.current;
    if (el && el.scrollWidth > el.clientWidth) {
      setShowScrollIndicator(true);
      const thumbWidth = Math.max(30, (el.clientWidth / el.scrollWidth) * 100);
      setScrollProgress(thumbWidth);
    }
  }, []);

  // AUTO-CLEANUP: Hapus tugas yang sudah selesai > 24 jam (dan bukan hari ini)
  React.useEffect(() => {
    const now = new Date().getTime();
    const todayStr = new Date().toLocaleDateString('en-CA');
    const staleTargets = targets.filter(t => 
      t.completed && 
      t.completedAt && 
      (now - new Date(t.completedAt).getTime() > 24 * 60 * 60 * 1000) &&
      new Date(t.completedAt).toLocaleDateString('en-CA') !== todayStr
    );

    if (staleTargets.length > 0) {
      staleTargets.forEach(t => useTargetStore.getState().deleteTarget(t.id));
    }
  }, [targets]);

  const handleOpenTarget = (target: TargetItem) => {
    if (target.window === 'delayed' && !target.completed) {
      setClarifyTarget(target);
    } else {
      setSelectedTarget(target);
    }
  };

  const handleQuickAdd = () => {
    const title = inputValue.trim();
    if (title) {
      let window: TargetWindow = 'today';
      if (activeFilter === 'upcoming') window = 'upcoming';
      if (activeFilter === 'someday') window = 'someday';
      
      useTargetStore.getState().addTarget({
        title,
        icon: 'ph:target-bold',
        accent: '#E3DAC9',
        window,
        priority: 'sedang',
        mode: 'checklist',
        steps: [],
        targetValue: 0,
        unit: '',
        currentValue: 0,
        starred: false,
      });
      setInputValue('');
      setIsAdding(false);
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  const visibleTargets = (targets || []).filter((target) => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    
    if (activeFilter === 'done') {
      // Hanya tampilkan yang selesai HARI INI
      if (!target.completed || !target.completedAt) return false;
      const completedDateStr = new Date(target.completedAt).toLocaleDateString('en-CA');
      return completedDateStr === todayStr;
    }
    
    if (target.completed) return false;

    if (activeFilter === 'today') {
      return target.window === 'today';
    }
    
    return target.window === activeFilter;
  });

  return (
    <div className="px-5 pt-8 pb-36 min-h-screen">
      <StarSystemStyles />
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0" />
      </div>



      {/* Filter Tabs - Premium Habit Style */}
      <div className="mt-8 -mx-5 px-5 relative">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-x-auto no-scrollbar"
        >
          <div className="flex gap-2 min-w-max pb-4">
          {[
            { id: 'today', label: 'Hari Ini', count: (targets || []).filter(t => !t.completed && t.window === 'today').length },
            { id: 'upcoming', label: 'Besok', count: (targets || []).filter(t => !t.completed && t.window === 'upcoming').length },
            { id: 'someday', label: 'Suatu Hari', count: (targets || []).filter(t => !t.completed && t.window === 'someday').length },
            { id: 'delayed', label: 'Tertunda', count: (targets || []).filter(t => !t.completed && t.window === 'delayed').length },
            { id: 'done', label: 'Selesai', count: (targets || []).filter(t => {
              if (!t.completed || !t.completedAt) return false;
              const todayStr = new Date().toLocaleDateString('en-CA');
              return new Date(t.completedAt).toLocaleDateString('en-CA') === todayStr;
            }).length }
          ].map((item) => (
            <motion.button
              key={item.id}
              whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
              onClick={() => {
                setActiveFilter(item.id as TargetFilter);
                if (navigator.vibrate) navigator.vibrate(8);
              }}
              className={`
                px-4 py-2.5 rounded-xl transition-all duration-300 flex items-start relative overflow-hidden
                border-[2px] ${activeFilter === item.id 
                  ? item.id === 'done' 
                    ? 'bg-[#00FF85] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                    : item.id === 'delayed'
                      ? 'bg-[#EF4444] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                      : 'bg-[#E3DAC9] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]' 
                  : 'bg-[#22252a] border-white/15 shadow-[4px_4px_0px_rgba(0,0,0,1)]'}
              `}
            >
              {activeFilter !== item.id && (
                <div 
                  className="absolute inset-0 z-0 opacity-[0.15] mix-blend-overlay pointer-events-none" 
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                  }}
                />
              )}
              <span className={`text-[13px] font-black font-['Outfit'] tracking-normal ${activeFilter === item.id ? (item.id === 'delayed' || item.id === 'done' ? 'text-white' : 'text-black') : 'text-white/40'}`}>
                {item.label}
              </span>
              <span className={`text-[9px] font-black font-['Outfit'] ml-0.5 mt-[-2px] ${activeFilter === item.id ? (item.id === 'delayed' || item.id === 'done' ? 'text-white/60' : 'text-black/40') : 'text-white/20'}`}>
                {item.count}
              </span>
            </motion.button>
          ))}
        </div>
        </div>
        {/* Custom Scroll Indicator - thin & premium */}
        {showScrollIndicator && (
          <div className="mx-auto mt-1 w-24 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div 
              className="h-full rounded-full bg-white/25 shadow-[0_0_6px_rgba(255,255,255,0.15)]"
              style={{ width: `${scrollProgress}%`, marginLeft: `${scrollLeft}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        )}
      </div>

      <div className="mt-14 space-y-5">
        {activeFilter === 'done' ? (
          targets.filter(t => t.completed).length > 0 ? (
            (['today', 'upcoming', 'someday', 'delayed'] as const).map((windowId) => {
              const windowTargets = targets.filter(t => t.completed && t.window === windowId);
              if (windowTargets.length === 0) return null;
              
              const label = windowId === 'today' ? 'Hari Ini' : windowId === 'upcoming' ? 'Besok' : windowId === 'delayed' ? 'Ditunda' : 'Suatu Hari';
              const isCollapsed = collapsedGroups.has(windowId);
              
              return (
                <div key={windowId} className="space-y-4 pt-2 first:pt-0">
                  <button
                    type="button"
                    className="flex items-center justify-between w-full px-1"
                    onClick={() => {
                      setCollapsedGroups(prev => {
                        const next = new Set(prev);
                        if (next.has(windowId)) {
                          next.delete(windowId);
                        } else {
                          next.add(windowId);
                        }
                        return next;
                      });
                      if (navigator.vibrate) navigator.vibrate(5);
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-[1.5px] flex-1 bg-[#E3DAC9]/10" />
                      <span className="text-[10px] font-black text-[#E3DAC9] tracking-[0.2em]">{label}</span>
                      <span className="text-[9px] font-bold text-[#E3DAC9]/40">{windowTargets.length}</span>
                    </div>
                    <Icon
                      icon="ph:caret-down-bold"
                      width={14}
                      height={14}
                      className={`text-[#E3DAC9]/50 transition-transform duration-200 ml-2 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-4">
                          {windowTargets.map((target, index) => (
                            <TargetCard key={target.id} target={target} index={index} onOpen={handleOpenTarget} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <EmptyHistoryState />
          )
        ) : (
          visibleTargets.length > 0 ? (
              <div className="space-y-5">
                <AnimatePresence mode="popLayout">
                {visibleTargets.map((target, index) => (
                  <motion.div
                    key={target.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, x: 120, scale: 0.9, transition: { duration: 0.3, ease: 'easeIn' } }}
                    transition={{ duration: 0.25, delay: index * 0.05, ease: 'easeOut' }}
                  >
                    <TargetCard target={target} index={index} onOpen={handleOpenTarget} />
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
          ) : null
        )}

        {/* QUICK ADD BAR - PREMIUM & CONSISTENT */}
        {activeFilter !== 'done' && (
          <div className="pt-4">
            <motion.div
              initial={{ backgroundColor: '#22252a' }}
              animate={{
                borderColor: isAdding || inputValue ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
              }}
              className={`
                w-full rounded-[8px] flex items-center gap-3 px-4 py-4 transition-all relative overflow-hidden
                border-[2px] shadow-[4px_4px_0px_rgba(0,0,0,1)]
              `}
              onClick={() => {
                if (!isAdding) {
                  setIsAdding(true);
                  quickAddRef.current?.focus();
                }
              }}
            >
              {/* NOISE TEXTURE LAYER */}
              <div 
                className="absolute inset-0 z-[1] opacity-[0.2] mix-blend-overlay pointer-events-none" 
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
              />
              {/* Clean Deep Charcoal Background */}
              <div className="absolute inset-0 bg-[#1a1c20] z-0 pointer-events-none" />
              <div className="absolute inset-0 bg-white/[0.01] z-0 pointer-events-none" />
              {/* PLUS ICON - no glow */}
              <div className="relative flex items-center justify-center shrink-0">
                <Icon 
                  icon="ph:plus-bold" 
                  width={22} 
                  height={22} 
                  className={`relative z-10 transition-colors ${isAdding || inputValue ? 'text-white' : 'text-white/30'}`} 
                />
              </div>
              
              <input
                ref={quickAddRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Tulis tugas anda..."
                onFocus={() => setIsAdding(true)}
                onBlur={() => {
                  if (!inputValue) setIsAdding(false);
                }}
                className={`
                  flex-1 bg-transparent border-none outline-none text-[16px] font-semibold font-['Outfit'] 
                  text-[#E3DAC9] placeholder:text-[#E3DAC9]/20 tracking-normal relative z-10
                `}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickAdd();
                  if (e.key === 'Escape') {
                    setIsAdding(false);
                    quickAddRef.current?.blur();
                  }
                }}
              />

              {/* DYNAMIC CHECKMARK SUBMIT */}
              <AnimatePresence>
                {inputValue.trim().length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.5, x: 20 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAdd();
                    }}
                    className="w-10 h-10 rounded-xl bg-[#00FF85] border border-black flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] relative z-10"
                  >
                    <Icon icon="ph:check-bold" width={18} height={18} className="text-black" />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}

        {/* Floating Add Button - Consistent with Habits */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.9, x: 4, y: 4, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(20);
            setIsAddOpen(true);
          }}
          className="fixed bottom-24 right-6 w-[60px] h-[60px] bg-[#00FF85] border-[2px] border-black rounded-2xl shadow-[5px_5px_0px_rgba(0,0,0,1)] flex items-center justify-center z-[60]"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="black" strokeWidth="5" strokeLinecap="square" />
          </svg>
        </motion.button>
      </div>

      <AnimatePresence>
        {isAddOpen && <AddTodoSheet isOpen={true} onClose={() => setIsAddOpen(false)} />}
        {selectedTarget && (
          <TargetDetailSheet 
            target={selectedTarget} 
            onClose={() => setSelectedTarget(null)} 
          />
        )}
        {clarifyTarget && (
          <DelayedClarificationSheet 
            target={clarifyTarget} 
            onClose={() => setClarifyTarget(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
