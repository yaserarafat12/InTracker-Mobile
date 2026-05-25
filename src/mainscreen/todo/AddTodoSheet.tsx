import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { 
  TargetWindow,
  TargetItem 
} from '../../store/useTargetStore';
import { useTargetStore } from '../../store/useTargetStore';

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
  const [title, setTitle] = useState('');
  const [window, setWindow] = useState<TargetWindow>('today');
  const [isPenting, setIsPenting] = useState(false);

  // Sync state when isOpen or targetToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (targetToEdit) {
        setTitle(targetToEdit.title);
        setWindow(targetToEdit.window);
        setIsPenting(targetToEdit.priority === 'tinggi');
      } else {
        setTitle('');
        setWindow('today');
        setIsPenting(false);
      }
    }
  }, [isOpen, targetToEdit]);

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
                {targetToEdit ? 'Edit Rencana' : 'Tambah To-Do Baru'}
              </h3>
              <motion.button 
                whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-[#2a2c32] border-[2px] border-black flex items-center justify-center text-[#E3DAC9] shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              >
                <Icon icon="ph:x-bold" width={20} height={20} />
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
                      placeholder="Apa rencana hari ini?"
                      className="w-full bg-transparent border-none outline-none text-[17px] font-bold font-['Outfit'] text-[#E3DAC9] placeholder:text-[#E3DAC9]/30"
                    />
                  </div>
                </div>
              </div>

              {/* Kategori Grid */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Pilih Kategori</p>
                <div className="grid grid-cols-2 gap-4">
                  {CATEGORIES.map((cat, idx) => (
                    <motion.button
                      key={cat.id}
                      whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                      onClick={() => {
                        setWindow(cat.id);
                        if (navigator.vibrate) navigator.vibrate(5);
                      }}
                      className={`flex items-center justify-center p-4 rounded-2xl border-[2px] border-black transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] ${
                        idx === 0 ? 'col-span-2' : 'col-span-1'
                      } ${
                        window === cat.id 
                        ? 'bg-[#00FF85] text-black' 
                        : 'bg-[#2a2c32] text-[#E3DAC9]/40'
                      }`}
                    >
                      <span className="text-[12px] font-black font-['Outfit'] uppercase tracking-wider">{cat.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Prioritas Row */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Status Rencana</p>
                <div className="flex bg-[#2a2c32] p-1.5 rounded-2xl border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                  <motion.button
                    whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                    onClick={() => {
                      setIsPenting(false);
                      if (navigator.vibrate) navigator.vibrate(5);
                    }}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-[2px] ${
                      !isPenting 
                      ? 'bg-[#00FF85] border-black text-black' 
                      : 'bg-transparent border-transparent text-[#E3DAC9]/20'
                    }`}
                  >
                    <div 
                      className={`w-1.5 h-1.5 rounded-full ${!isPenting ? 'bg-black' : 'bg-[#E3DAC9]/20'}`}
                    />
                    Biasa
                  </motion.button>
                  <motion.button
                    whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                    onClick={() => {
                      setIsPenting(true);
                      if (navigator.vibrate) navigator.vibrate(5);
                    }}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-[2px] ${
                      isPenting 
                      ? 'bg-[#FF4D00] border-black text-white' 
                      : 'bg-transparent border-transparent text-[#E3DAC9]/20'
                    }`}
                  >
                    <div 
                      className={`w-1.5 h-1.5 rounded-full ${isPenting ? 'bg-white' : 'bg-[#FF4D00]/20'}`}
                    />
                    Penting
                  </motion.button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <motion.button 
                  whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                  onClick={onClose}
                  className="flex-1 h-16 rounded-2xl bg-[#FF4D00] border-[2px] border-black text-white font-black font-['Outfit'] uppercase tracking-[0.15em] text-[13px] shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                >
                  Batal
                </motion.button>
                <motion.button 
                  whileTap={title.trim() ? { x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" } : {}}
                  onClick={handleSubmit}
                  disabled={!title.trim()}
                  className={`flex-[2] h-16 rounded-2xl font-black font-['Outfit'] uppercase tracking-[0.15em] text-[13px] shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 ${
                    title.trim() 
                    ? 'bg-[#00FF85] text-black border-[2px] border-black' 
                    : 'bg-[#2a2c32] text-[#E3DAC9]/10 border-[2px] border-black/20 shadow-none'
                  }`}
                >
                  {targetToEdit ? 'Simpan Perubahan' : 'Buat Rencana'}
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
