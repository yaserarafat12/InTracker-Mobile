import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
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
      0%, 100% { box-shadow: 0 0 15px rgba(255,184,0,0.15), 0 0 30px rgba(255,184,0,0.05), 7px 7px 0px rgba(0,0,0,1); }
      50% { box-shadow: 0 0 25px rgba(255,184,0,0.25), 0 0 50px rgba(255,184,0,0.1), 7px 7px 0px rgba(0,0,0,1); }
    }
    .starred-card {
      animation: starGlowPulse 3s ease-in-out infinite;
      border-color: rgba(255,184,0,0.35) !important;
    }
    .starred-card::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: 28px;
      padding: 1.5px;
      background: conic-gradient(
        from var(--star-angle, 0deg),
        transparent 0%,
        #FFB800 15%,
        #FF8C00 30%,
        transparent 45%,
        transparent 55%,
        #FFD700 70%,
        #FFB800 85%,
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
      background: #FFD700;
      pointer-events: none;
      z-index: 2;
    }
    .star-particle:nth-child(1) { top: 15%; right: 8%; animation: starParticleFloat1 2.8s ease-in-out infinite; }
    .star-particle:nth-child(2) { top: 40%; right: 3%; animation: starParticleFloat2 3.4s ease-in-out infinite 0.5s; }
    .star-particle:nth-child(3) { bottom: 20%; right: 12%; animation: starParticleFloat3 3s ease-in-out infinite 1s; }
    .star-particle:nth-child(4) { top: 10%; left: 5%; animation: starParticleFloat2 3.2s ease-in-out infinite 0.8s; width: 3px; height: 3px; }
    .star-particle:nth-child(5) { bottom: 10%; left: 8%; animation: starParticleFloat1 2.6s ease-in-out infinite 1.3s; width: 3px; height: 3px; background: #FFAA00; }
  `}</style>
);

type TargetFilter = 'today' | 'upcoming' | 'overdue' | 'someday' | 'done';

const ACCENT_OPTIONS = ['#00FF85', '#E3DAC9', '#60A5FA', '#FACC15', '#EF4444'];

const FILTERS: Array<{ id: TargetFilter; label: string }> = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'upcoming', label: 'Mendatang' },
  { id: 'someday', label: 'Someday' },
  { id: 'overdue', label: 'Tertunda' },
  { id: 'done', label: 'Selesai' },
];

const WINDOW_LABELS: Record<TargetWindow, string> = {
  today: 'Hari Ini',
  upcoming: 'Mendatang',
  someday: 'Someday',
};

const PRIORITY_LABELS: Record<TargetPriority, string> = {
  tinggi: 'Prioritas Tinggi',
  sedang: 'Prioritas Sedang',
  rendah: 'Prioritas Rendah',
};

const getTargetMeta = (target: TargetItem) => {
  if (target.mode === 'number') {
    return `${target.currentValue}/${target.targetValue} ${target.unit}`;
  }

  const done = target.steps.filter((step) => step.completed).length;
  return `${done}/${target.steps.length} langkah selesai`;
};

const TargetProgressBar = ({ target }: { target: TargetItem }) => {
  const progress = getTargetProgress(target);

  return (
    <div className="h-3 rounded-full bg-black/50 border border-white/5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 180, damping: 24 }}
        className="h-full rounded-full"
        style={{
          backgroundColor: target.completed ? '#E3DAC9' : target.accent,
          boxShadow: `0 0 18px ${target.accent}55`,
        }}
      />
    </div>
  );
};

const TargetCard = ({ target, index, onOpen }: { target: TargetItem; index: number; onOpen: (target: TargetItem) => void }) => {
  const { toggleStar, toggleComplete, deleteTarget } = useTargetStore();
  const x = useMotionValue(0);

  // Swipe transformations
  const editOpacity = useTransform(x, [20, 80], [0, 1]);
  const deleteOpacity = useTransform(x, [-20, -80], [0, 1]);
  const scaleAction = useTransform(x, [-100, 0, 100], [1, 0.95, 1]);

  const handleDragEnd = (_: any, info: any) => {
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
        {/* Edit Action (Left) */}
        <motion.button
          style={{ opacity: editOpacity, scale: scaleAction }}
          onClick={() => handleAction('edit')}
          className="w-16 h-[80%] rounded-2xl bg-[#E3DAC9] border-[1.5px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center gap-1 text-black active:scale-90 transition-all"
        >
          <Icon icon="ph:pencil-simple-bold" width={20} height={20} />
          <span className="text-[8px] font-black uppercase">Edit</span>
        </motion.button>

        {/* Delete Action (Right) */}
        <motion.button
          style={{ opacity: deleteOpacity, scale: scaleAction }}
          onClick={() => handleAction('delete')}
          className="w-16 h-[80%] rounded-2xl bg-[#EF4444] border-[1.5px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center gap-1 text-white active:scale-90 transition-all"
        >
          <Icon icon="ph:trash-bold" width={20} height={20} />
          <span className="text-[8px] font-black uppercase">Hapus</span>
        </motion.button>
      </div>

      {/* Main Card Content */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className={`w-full rounded-[32px] bg-[#1A1A1A] border-[1.5px] border-white/10 p-6 relative z-10 ${
          target.starred ? 'starred-card' : 'shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden'
        }`}
      >
        {/* Golden particles for starred cards */}
        {target.starred && (
          <>
            <span className="star-particle" />
            <span className="star-particle" />
            <span className="star-particle" />
            <span className="star-particle" />
            <span className="star-particle" />
          </>
        )}

        <div className="flex items-center gap-4 py-1 relative z-[3]">
          {/* Square Checklist */}
          <motion.div
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleComplete(target.id);
              if (navigator.vibrate) navigator.vibrate(8);
            }}
            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
              target.completed ? 'bg-[#00FF85] border-black' : 'border-white/10 bg-white/5'
            }`}
          >
            {target.completed && <Icon icon="ph:check-bold" width={16} height={16} className="text-black" />}
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(6);
              onOpen(target);
            }}
            className="flex-1 text-left min-w-0"
          >
            <h3
              className={`text-[20px] font-black font-['Outfit'] uppercase leading-tight transition-all ${
                target.completed ? 'text-white/20 line-through' : 'text-[#E3DAC9]'
              }`}
            >
              {target.title}
            </h3>
          </motion.button>
        </div>

        {/* Magical Star Cluster Toggle */}
        <motion.button
          whileTap={{ scale: 0.75 }}
          onClick={(e) => {
            e.stopPropagation();
            toggleStar(target.id);
            if (navigator.vibrate) navigator.vibrate(target.starred ? 4 : [6, 20, 6]);
          }}
          className={`absolute z-[20] flex items-center justify-center transition-all ${
            target.starred ? 'top-[-22px] right-[-18px] w-14 h-14' : 'top-4 right-4 w-12 h-12'
          }`}
        >
          {target.starred ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Main Big Star */}
              <motion.div
                initial={{ scale: 0.5, rotate: -30 }}
                animate={{ scale: 1.1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="z-[2]"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFB800" className="drop-shadow-[0_0_12px_rgba(255,184,0,0.8)]">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </motion.div>

              {/* Smaller Support Star 1 (Top Left) */}
              <motion.div
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{ scale: 1, x: -16, y: 10, rotate: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
                className="absolute z-[1]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </motion.div>

              {/* Smaller Support Star 2 (Bottom Left) */}
              <motion.div
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{ scale: 1, x: -8, y: 24, rotate: 15 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22, delay: 0.1 }}
                className="absolute z-[1]"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#FFAA00">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </motion.div>

              {/* NEW: Star 3 (Far Left) */}
              <motion.div
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{ scale: 0.8, x: -22, y: 2, rotate: -40 }}
                transition={{ type: 'spring', stiffness: 250, damping: 18, delay: 0.15 }}
                className="absolute z-[1]"
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="#FFB800">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </motion.div>

              {/* NEW: Star 4 (Bottom Right-ish) */}
              <motion.div
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{ scale: 0.7, x: 2, y: 28, rotate: 30 }}
                transition={{ type: 'spring', stiffness: 200, damping: 25, delay: 0.2 }}
                className="absolute z-[1]"
              >
                <svg width="6" height="6" viewBox="0 0 24 24" fill="#FFEAA7">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </motion.div>
            </div>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2">
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
    whileTap={{ scale: 0.98 }}
    onClick={onAdd}
    className="w-full min-h-[160px] rounded-[28px] border-[1.5px] border-dashed border-[#00FF85]/35 bg-[#00FF85]/[0.03] flex flex-col items-center justify-center px-8 text-center shadow-[7px_7px_0px_rgba(0,0,0,1)]"
  >
    <div className="w-12 h-12 rounded-[20px] bg-[#00FF85] border-[1.5px] border-black flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
      <Icon icon="solar:add-circle-bold" width={24} height={24} className="text-black" />
    </div>
    <h3 className="mt-4 text-[20px] font-black uppercase text-white">Tambah Target Baru</h3>
    <p className="mt-1 text-[11px] font-bold uppercase text-[#E3DAC9]/40 leading-relaxed">
      Pecah objektif besar jadi langkah kecil yang bisa dieksekusi.
    </p>
  </motion.button>
);

const EmptyHistoryState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    className="w-full min-h-[190px] rounded-[30px] border border-white/10 bg-[#1A1A1A] flex flex-col items-center justify-center px-8 text-center shadow-[7px_7px_0px_rgba(0,0,0,1)]"
  >
    <h3 className="text-[23px] font-black uppercase text-white">Belum Ada Riwayat</h3>
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
        className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 27, stiffness: 210 }}
        className="fixed inset-x-0 bottom-0 z-[70] max-h-[88vh] rounded-t-[34px] bg-[#1A1A1A] border-t border-white/10 shadow-[0_-25px_60px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        <div className="px-6 pt-5 pb-5 border-b border-white/5">
          <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-6" />
          <div className="flex items-start gap-4">
            {/* Icon Container Removed */}
            <div className="min-w-0 flex-1">
              {/* Priority Labels Removed */}
              <h2 className="mt-1 text-[27px] font-black uppercase leading-[1.02] text-white">{target.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-[#222] border border-white/10 flex items-center justify-center active:scale-90 transition-all"
            >
              <Icon icon="ph:x-bold" width={17} height={17} className="text-[#E3DAC9]/60" />
            </button>
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
                    step.completed ? 'bg-[#00FF85]/10 border-[#00FF85]/30' : 'bg-[#222] border-white/10'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl border-[1.5px] flex items-center justify-center shrink-0 ${
                      step.completed ? 'bg-[#00FF85] border-black' : 'border-white/15'
                    }`}
                  >
                    {step.completed && <Icon icon="solar:check-bold" width={18} height={18} className="text-black" />}
                  </div>
                  <span className={`text-[14px] font-bold ${step.completed ? 'text-[#E3DAC9]/40 line-through' : 'text-[#E3DAC9]'}`}>
                    {step.title}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] bg-[#222] border border-white/10 p-5">
              <p className="text-[10px] font-black uppercase text-[#00FF85]">Update Angka</p>
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
                  className="w-12 h-12 rounded-2xl bg-[#00FF85] border-[1.5px] border-black text-black flex items-center justify-center active:scale-90"
                >
                  <Icon icon="solar:add-bold" width={20} height={20} />
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={() => {
                completeTarget(target.id);
                if (navigator.vibrate) navigator.vibrate([10, 25, 10]);
                onClose();
              }}
              className="w-full h-16 rounded-[22px] bg-[#00FF85] border-[1.5px] border-black text-black font-black uppercase shadow-[5px_5px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <Icon icon="solar:check-circle-bold" width={22} height={22} />
              Selesaikan
            </button>

            <div className="grid grid-cols-[1fr_1fr_72px] gap-3">
              {target.window !== 'today' && (
                <button
                  onClick={() => {
                    updateTargetWindow(target.id, 'today');
                    if (navigator.vibrate) navigator.vibrate(8);
                    onClose();
                  }}
                  className="h-14 rounded-2xl bg-[#E3DAC9] border-[1.5px] border-black text-black font-black text-[11px] uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex flex-col items-center justify-center"
                >
                  <Icon icon="solar:calendar-bold" width={18} height={18} />
                  <span>Hari Ini</span>
                </button>
              )}

              {target.window !== 'someday' && (
                <button
                  onClick={() => {
                    updateTargetWindow(target.id, 'someday');
                    if (navigator.vibrate) navigator.vibrate(8);
                    onClose();
                  }}
                  className="h-14 rounded-2xl bg-[#1A1A1A] border border-white/10 text-white/60 font-black text-[11px] uppercase active:scale-95 transition-all flex flex-col items-center justify-center"
                >
                  <Icon icon="solar:star-fall-bold" width={18} height={18} />
                  <span>Someday</span>
                </button>
              )}
              <button
                onClick={() => {
                  deleteTarget(target.id);
                  if (navigator.vibrate) navigator.vibrate(10);
                  onClose();
                }}
                className="h-14 rounded-2xl bg-[#222] border border-white/10 text-white/30 flex items-center justify-center active:scale-95 transition-all"
              >
                <Icon icon="solar:trash-bin-trash-bold" width={22} height={22} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default function TodoTargetView() {
  const { targets } = useTargetStore();
  const [activeFilter, setActiveFilter] = useState<TargetFilter>('today');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<TargetItem | null>(null);

  const activeTargets = targets.filter((target) => !target.completed);
  const completedTargets = targets.filter((target) => target.completed);
  
  const todayStr = new Date().toISOString().split('T')[0];

  const visibleTargets = targets.filter((target) => {
    if (activeFilter === 'done') return target.completed;
    if (target.completed) return false;

    const targetDateStr = target.createdAt ? target.createdAt.split('T')[0] : todayStr;
    const isOverdue = target.window === 'today' && targetDateStr < todayStr;

    if (activeFilter === 'overdue') return isOverdue;
    if (activeFilter === 'today') return target.window === 'today' && !isOverdue;
    
    return target.window === activeFilter;
  });
  const historyTotal = targets.length;
  const historyCompleted = completedTargets.length;

  return (
    <div className="px-5 pt-8 pb-36 min-h-screen">
      <StarSystemStyles />
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[45px] font-black uppercase leading-none text-white tracking-[0.02em] drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            TO-DO
          </h1>
        </div>
        <button
          onClick={() => {
            setIsAddOpen(true);
            if (navigator.vibrate) navigator.vibrate(10);
          }}
          className="w-[52px] h-[52px] min-w-[52px] rounded-2xl bg-[#1A1A1A] border-[1.5px] border-[#E3DAC9]/20 flex items-center justify-center shadow-[5px_5px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all group"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            className="group-hover:scale-110 transition-transform"
          >
            <path 
              d="M12 5V19M5 12H19" 
              stroke="#E3DAC9" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Filter Tabs - Premium Habit Style */}
      <div className="mt-12 flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { id: 'today', label: 'Hari Ini', count: targets.filter(t => !t.completed && t.window === 'today' && (t.createdAt?.split('T')[0] || todayStr) >= todayStr).length },
          { id: 'upcoming', label: 'Mendatang', count: targets.filter(t => !t.completed && t.window === 'upcoming').length },
          { id: 'someday', label: 'Someday', count: targets.filter(t => !t.completed && t.window === 'someday').length },
          { id: 'overdue', label: 'Ditunda', count: targets.filter(t => !t.completed && t.window === 'today' && (t.createdAt?.split('T')[0] || todayStr) < todayStr).length },
          { id: 'done', label: 'Selesai', count: targets.filter(t => t.completed).length }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => {
              setActiveFilter(item.id as TargetFilter);
              if (navigator.vibrate) navigator.vibrate(8);
            }}
            className={`
              px-5 py-2.5 rounded-xl transition-all duration-300 flex items-start whitespace-nowrap
              border-[1.5px] ${activeFilter === item.id 
                ? 'bg-[#F5F2E8] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' 
                : 'bg-[#1A1A1A] border-white/10 shadow-[3px_3px_0px_rgba(0,0,0,1)]'}
            `}
          >
            <span className={`text-[13px] font-bold font-['Outfit'] tracking-tight ${activeFilter === item.id ? 'text-black' : 'text-white/40'}`}>
              {item.label}
            </span>
            <span className={`text-[9px] font-black ml-0.5 mt-[-2px] ${activeFilter === item.id ? 'text-black/40' : 'text-white/20'}`}>
              {item.count}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-10 space-y-5">
        {visibleTargets.length > 0 ? (
          visibleTargets.map((target, index) => (
            <TargetCard key={target.id} target={target} index={index} onOpen={setSelectedTarget} />
          ))
        ) : activeFilter === 'done' ? (
          <EmptyHistoryState />
        ) : (
          <EmptyTargetState onAdd={() => setIsAddOpen(true)} />
        )}
      </div>

      <AddTodoSheet 
        isOpen={isAddOpen || !!selectedTarget} 
        targetToEdit={selectedTarget}
        onClose={() => {
          setIsAddOpen(false);
          setSelectedTarget(null);
        }} 
      />
    </div>
  );
}
