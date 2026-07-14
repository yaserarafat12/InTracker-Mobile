import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { 
  TargetWindow,
  TargetItem 
} from '../../store/useTargetStore';
import { useTargetStore } from '../../store/useTargetStore';
import { useTranslation } from '../../i18n';

interface AddTodoSheetProps {
  isOpen: boolean;
  onClose: () => void;
  targetToEdit?: TargetItem | null;
}

const CATEGORIES: { id: TargetWindow; label: string }[] = [
  { id: 'today', label: 'Hari Ini' },
  { id: 'upcoming', label: 'Mendatang' },
  { id: 'someday', label: 'Suatu Hari' },
];

export const AddTodoSheet = ({ isOpen, onClose, targetToEdit }: AddTodoSheetProps) => {
  const { addTarget, updateTarget } = useTargetStore();
  const { t } = useTranslation();
  const isLight = !document.documentElement.classList.contains('dark');
  const [title, setTitle] = useState('');
  const [window, setWindow] = useState<TargetWindow>('today');
  const [isPenting, setIsPenting] = useState(false);

  // Sync state when isOpen or targetToEdit changes
  useEffect(() => {
    let active = true;
    if (isOpen) {
      requestAnimationFrame(() => {
        if (active) {
          if (targetToEdit) {
            if (title !== targetToEdit.title) setTitle(targetToEdit.title);
            if (window !== targetToEdit.window) setWindow(targetToEdit.window);
            const wantedPenting = targetToEdit.priority === 'tinggi';
            if (isPenting !== wantedPenting) setIsPenting(wantedPenting);
          } else {
            if (title !== '') setTitle('');
            if (window !== 'today') setWindow('today');
            if (isPenting !== false) setIsPenting(false);
          }
        }
      });
    }
    return () => { active = false; };
  }, [isOpen, targetToEdit, title, window, isPenting]);

  const handleSubmit = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    if (targetToEdit) {
      await updateTarget(targetToEdit.id, {
        title: cleanTitle,
        window,
        priority: isPenting ? 'tinggi' : 'rendah',
        starred: isPenting,
      });
    } else {
      await addTarget({
        title: cleanTitle,
        icon: 'ph:circle-bold',
        accent: '#E3DAC9',
        window,
        priority: isPenting ? 'tinggi' : 'rendah',
        mode: 'checklist',
        steps: [],
        currentValue: 0,
        targetValue: 0,
        unit: '',
        starred: isPenting,
      });
    }

    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[99999]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-[#16181c] rounded-t-[40px] border-t-[1.5px] border-white/10 p-6 pb-12 flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            {/* NOISE TEXTURE LAYER */}
            <div 
              className="absolute inset-0 z-0 opacity-[0.2] mix-blend-overlay pointer-events-none" 
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
              }}
            />
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8 shrink-0 relative z-10" />

            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[20px] font-black font-['Outfit'] text-[#E3DAC9] uppercase tracking-[0.1em]">
                {targetToEdit ? t('todo.editTitle') : t('todo.addTitle')}
              </h3>
              <motion.button 
                whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                onClick={onClose}
                className={`w-10 h-10 rounded-xl border-[2px] flex items-center justify-center transition-all ${
                  isLight
                    ? 'bg-white border-black text-black shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                    : 'border-white/10 bg-[#2a2c32] text-white shadow-none'
                }`}
              >
                <Icon icon="ph:x-bold" width={18} height={18} />
              </motion.button>
            </div>

            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex gap-4 h-[72px]">
                  <div className="flex-1 h-full bg-[#16181c] rounded-2xl border-[2px] border-[#E3DAC9]/30 flex items-center px-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] focus-within:border-[#E3DAC9] focus-within:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all">
                    <input 
                      autoFocus
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('todo.inputAddPlaceholder')}
                      className="w-full bg-transparent border-none outline-none text-[17px] font-bold font-['Outfit'] text-[#E3DAC9] placeholder:text-[#E3DAC9]/45"
                      autoCapitalize="none"
                      autoComplete="off"
                      autoCorrect="off"
                    />
                  </div>
                </div>
              </div>

              {/* Kategori Grid */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">{t('todo.chooseCategory')}</p>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((cat, idx) => (
                    <motion.button
                      key={cat.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setWindow(cat.id);
                        if (navigator.vibrate) navigator.vibrate(5);
                      }}
                      className={`flex items-center justify-center py-2.5 rounded-xl border-[2px] transition-all ${
                        idx === 0 ? 'col-span-2' : 'col-span-1'
                      } ${
                        window === cat.id 
                        ? 'bg-[#6ED7A0] border-black text-black shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]' 
                        : isLight
                          ? 'bg-white border-black text-black/50 shadow-[2px_2px_0px_rgba(0,0,0,0.15)]'
                          : 'bg-[#2a2c32] border-white/10 text-[#E3DAC9]/40 shadow-none'
                      }`}
                    >
                      <span className="text-[11px] font-semibold font-['Outfit']">{t('todo.filters.' + cat.id)}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Prioritas Row */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">{t('todo.planStatus')}</p>
                <div className={`flex p-1 rounded-xl border-[2px] transition-all ${
                  isLight
                    ? 'bg-slate-100 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#2a2c32] border-white/10 shadow-none'
                }`}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsPenting(false);
                      if (navigator.vibrate) navigator.vibrate(5);
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-2 border-[2px] ${
                      !isPenting 
                      ? 'bg-[#6ED7A0] border-black text-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]' 
                      : 'bg-transparent border-transparent text-[#E3DAC9]/40'
                    }`}
                  >
                    <div 
                      className={`w-1.5 h-1.5 rounded-full ${!isPenting ? 'bg-black' : isLight ? 'bg-black/20' : 'bg-[#E3DAC9]/20'}`}
                    />
                    {t('todo.normal')}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsPenting(true);
                      if (navigator.vibrate) navigator.vibrate(5);
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-2 border-[2px] ${
                      isPenting 
                      ? 'bg-[#FF4D00] border-black text-white shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]' 
                      : 'bg-transparent border-transparent text-[#E3DAC9]/40'
                    }`}
                  >
                    <div 
                      className={`w-1.5 h-1.5 rounded-full ${isPenting ? 'bg-white' : 'bg-[#FF4D00]/20'}`}
                    />
                    {t('todo.important')}
                  </motion.button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className={`flex-1 h-[48px] rounded-xl font-black font-['Outfit'] uppercase tracking-[0.15em] text-[12px] border transition-all ${
                    isLight
                      ? 'bg-white border-black text-black shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]'
                      : 'bg-[#2a2c32] border-white/10 text-[#E3DAC9]/60 shadow-none'
                  }`}
                >
                  {t('settings.cancel')}
                </motion.button>
                <motion.button 
                  whileTap={title.trim() ? { scale: 0.95 } : {}}
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className={`flex-[1.5] h-[48px] rounded-xl font-black font-['Outfit'] uppercase tracking-[0.15em] text-[12px] border transition-all flex items-center justify-center gap-2 ${
                    title.trim() 
                      ? isLight
                        ? 'bg-[#6ED7A0] border-black text-black shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]'
                        : 'bg-[#6ED7A0] border-transparent text-black shadow-none'
                      : isLight
                        ? 'bg-[#6ED7A0]/15 border-black/10 text-black/25 cursor-not-allowed shadow-none'
                        : 'bg-[#6ED7A0]/10 border-white/5 text-white/20 cursor-not-allowed shadow-none'
                  }`}
                >
                  {targetToEdit ? t('todo.saveChanges') : t('todo.createPlan')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
