import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { 
  TargetWindow, 
  TargetPriority, 
  TargetMode, 
} from '../../store/useTargetStore';
import { useTargetStore } from '../../store/useTargetStore';

interface AddTodoSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { id: TargetWindow; label: string; icon: string; color: string }[] = [
  { id: 'today', label: 'Hari Ini', icon: 'solar:calendar-date-bold', color: '#00FF85' },
  { id: 'upcoming', label: 'Mendatang', icon: 'solar:calendar-minimalistic-bold', color: '#3B82F6' },
  { id: 'someday', label: 'Someday', icon: 'solar:magic-stick-3-bold', color: '#A855F7' },
  { id: 'pending', label: 'Tertunda', icon: 'solar:clock-circle-bold', color: '#F59E0B' },
];

const PRIORITIES: { id: TargetPriority; label: string; color: string; icon: string }[] = [
  { id: 'tinggi', label: 'Tinggi', color: '#EF4444', icon: 'solar:fire-bold' },
  { id: 'sedang', label: 'Sedang', color: '#F59E0B', icon: 'solar:bolt-bold' },
  { id: 'rendah', label: 'Rendah', color: '#00FF85', icon: 'solar:leaf-bold' },
];

const ICON_OPTIONS = [
  'solar:checklist-minimalistic-bold',
  'solar:target-bold',
  'solar:star-bold',
  'solar:flag-bold',
  'solar:calendar-bold',
  'solar:clock-circle-bold',
  'solar:cup-hot-bold',
  'solar:laptop-minimalistic-bold',
  'solar:book-2-bold',
  'solar:dumbbells-bold',
  'solar:cart-large-2-bold',
  'solar:clapperboard-edit-bold',
  'solar:gamepad-bold',
  'solar:music-note-bold',
  'solar:chat-round-dots-bold',
  'solar:heart-bold',
  'solar:bag-bold',
  'solar:money-bag-bold',
  'solar:camera-bold',
  'solar:crown-bold',
  'solar:rocket-bold',
  'solar:code-bold',
  'solar:palette-bold',
  'solar:globus-bold',
];

const ACCENT_COLORS = ['#00FF85', '#E3DAC9', '#3B82F6', '#A855F7', '#F59E0B', '#EF4444'];

export const AddTodoSheet = ({ isOpen, onClose }: AddTodoSheetProps) => {
  const { addTarget } = useTargetStore();

  // Form State
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('solar:menu-dots-bold'); // Default "blank-ish" placeholder
  const [accent, setAccent] = useState('#00FF85');
  const [window, setWindow] = useState<TargetWindow>('today');
  const [priority, setPriority] = useState<TargetPriority>('sedang');
  const [mode, setMode] = useState<TargetMode>('checklist');
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  // For Number Mode
  const [targetValue, setTargetValue] = useState(1);
  const [unit, setUnit] = useState('');

  const handleAdd = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    addTarget({
      title: cleanTitle,
      icon,
      accent,
      window,
      priority,
      mode,
      steps: [], 
      currentValue: 0,
      targetValue: mode === 'number' ? Math.max(1, targetValue) : 0,
      unit: mode === 'number' ? (unit.trim() || 'Unit') : '',
    });

    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    
    // Reset & Close
    setTitle('');
    setIcon('solar:menu-dots-bold');
    setAccent('#00FF85');
    setWindow('today');
    setPriority('sedang');
    setMode('checklist');
    onClose();
  };

  const handleVibrate = (pattern: number | number[] = 5) => {
    if (navigator.vibrate) navigator.vibrate(pattern);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md"
          />

          {/* Sheet Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] z-[110] rounded-t-[40px] border-t border-white/5 p-6 pb-12 shadow-[0_-20px_60px_rgba(0,0,0,0.9)] flex flex-col max-h-[95vh] overflow-y-auto no-scrollbar"
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-10 shrink-0" />

            {/* Header */}
            <div className="relative flex items-center justify-between mb-10 shrink-0">
              <button 
                onClick={onClose}
                className="w-11 h-11 rounded-2xl bg-[#222] border border-white/10 flex items-center justify-center text-white/40 active:scale-90 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              >
                <Icon icon="solar:alt-arrow-left-bold" width={22} height={22} />
              </button>
              <h3 className="text-[18px] font-black font-['Outfit'] text-[#E3DAC9] uppercase tracking-[0.2em]">Rencana Baru</h3>
              <div className="w-11" /> {/* Spacer */}
            </div>

            <div className="space-y-10">
              {/* Task Name & Icon Section */}
              <div className="space-y-4">
                <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em] ml-1">APA RENCANA BOSS?</p>
                <div className="flex gap-4 h-[76px]">
                  {/* Icon Selector Button */}
                  <button 
                    onClick={() => {
                      setShowIconPicker(!showIconPicker);
                      handleVibrate();
                    }}
                    className="w-[76px] h-full bg-[#222] rounded-2xl border-[1.5px] flex items-center justify-center shadow-[5px_5px_0px_rgba(0,0,0,1)] active:scale-95 transition-all relative overflow-hidden"
                    style={{ borderColor: showIconPicker ? accent : 'rgba(255,255,255,0.08)' }}
                  >
                    <Icon 
                      icon={icon} 
                      width={32} 
                      height={32} 
                      style={{ color: icon === 'solar:menu-dots-bold' ? 'rgba(227,218,201,0.1)' : accent }} 
                    />
                    <div className="absolute bottom-1 right-1">
                      <Icon icon="solar:pen-new-square-bold" width={10} height={10} className="text-white/20" />
                    </div>
                  </button>
                  
                  {/* Title Input */}
                  <div className="flex-1 h-full bg-[#222] rounded-2xl border-[1.5px] border-white/10 flex items-center px-6 shadow-[5px_5px_0px_rgba(0,0,0,1)] focus-within:border-[#00FF85]/50 transition-all">
                    <input 
                      autoFocus
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Membuat Kue"
                      className="w-full bg-transparent border-none outline-none text-[18px] font-bold font-['Outfit'] text-[#E3DAC9] placeholder:text-white/10"
                    />
                  </div>
                </div>

                {/* Expanded Icon Picker */}
                <AnimatePresence>
                  {showIconPicker && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 bg-black/40 rounded-[28px] border border-white/5 grid grid-cols-6 gap-4 mt-2 shadow-inner">
                        {ICON_OPTIONS.map((iconOpt) => (
                          <button
                            key={iconOpt}
                            onClick={() => {
                              setIcon(iconOpt);
                              setShowIconPicker(false);
                              handleVibrate();
                            }}
                            className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                              icon === iconOpt ? 'bg-white/10 border-[1.5px] border-white/20' : 'bg-white/5 border border-transparent hover:bg-white/10'
                            }`}
                          >
                            <Icon 
                              icon={iconOpt} 
                              width={24} 
                              height={24} 
                              style={{ color: icon === iconOpt ? accent : 'rgba(227, 218, 201, 0.3)' }} 
                            />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Category Grid */}
              <div className="space-y-4">
                <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em] ml-1">PILIH KATEGORI</p>
                <div className="grid grid-cols-2 gap-4">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setWindow(cat.id);
                        handleVibrate();
                      }}
                      className={`flex items-center gap-4 p-4.5 rounded-[22px] border-[1.5px] transition-all active:scale-[0.96] shadow-[5px_5px_0px_rgba(0,0,0,1)] ${
                        window === cat.id 
                        ? 'bg-[#222] border-white text-white' 
                        : 'bg-[#1A1A1A] border-white/5 text-white/20 hover:border-white/10'
                      }`}
                    >
                      <div 
                        className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                          window === cat.id ? 'bg-white/10' : 'bg-white/5'
                        }`}
                      >
                        <Icon 
                          icon={cat.icon} 
                          width={22} 
                          height={22} 
                          style={{ color: window === cat.id ? cat.color : 'inherit' }} 
                        />
                      </div>
                      <span className="text-[13px] font-black font-['Outfit'] uppercase tracking-wider">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode & Urgency Row */}
              <div className="grid grid-cols-2 gap-8">
                {/* Tipe Selector */}
                <div className="space-y-4">
                  <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em] ml-1">TIPE</p>
                  <div className="flex bg-[#222] p-1.5 rounded-[22px] border border-white/5 shadow-[5px_5px_0px_rgba(0,0,0,1)]">
                    {(['checklist', 'number'] as TargetMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setMode(m);
                          handleVibrate();
                        }}
                        className={`flex-1 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                          mode === m ? 'bg-[#E3DAC9] text-black shadow-md' : 'text-white/20 hover:text-white/40'
                        }`}
                      >
                        {m === 'checklist' ? 'List' : 'Angka'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Urgensi Selector */}
                <div className="space-y-4">
                  <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em] ml-1">URGENSI</p>
                  <div className="flex bg-[#222] p-1.5 rounded-[22px] border border-white/5 shadow-[5px_5px_0px_rgba(0,0,0,1)]">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPriority(p.id);
                          handleVibrate();
                        }}
                        className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                          priority === p.id 
                          ? 'bg-[#E3DAC9] text-black shadow-md' 
                          : 'text-white/20 hover:text-white/40'
                        }`}
                      >
                        <div 
                          className="w-1.5 h-1.5 rounded-full" 
                          style={{ backgroundColor: priority === p.id ? 'black' : p.color }} 
                        />
                        {p.label.charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Number Mode Specifics */}
              <AnimatePresence>
                {mode === 'number' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="grid grid-cols-2 gap-5"
                  >
                    <div className="space-y-4">
                      <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em] ml-1">TARGET ANGKA</p>
                      <input 
                        type="number"
                        value={targetValue}
                        onChange={(e) => setTargetValue(Number(e.target.value))}
                        className="w-full h-16 bg-[#222] rounded-[22px] border-[1.5px] border-white/10 px-6 text-[18px] font-black font-['Outfit'] text-[#E3DAC9] outline-none shadow-[5px_5px_0px_rgba(0,0,0,1)] focus:border-[#00FF85]/40 transition-colors"
                      />
                    </div>
                    <div className="space-y-4">
                      <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em] ml-1">SATUAN</p>
                      <input 
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="Gelas, Hal..."
                        className="w-full h-16 bg-[#222] rounded-[22px] border-[1.5px] border-white/10 px-6 text-[16px] font-bold font-['Outfit'] text-[#E3DAC9] outline-none shadow-[5px_5px_0px_rgba(0,0,0,1)] focus:border-[#00FF85]/40 transition-colors placeholder:text-white/5"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Color Palette Section */}
              <div className="space-y-4">
                <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.25em] ml-1">WARNA AKSEN</p>
                <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setAccent(c);
                        handleVibrate();
                      }}
                      className={`w-14 h-14 rounded-2xl border-[2.5px] flex-shrink-0 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] active:scale-90 ${
                        accent === c ? 'border-white scale-110' : 'border-black'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button 
                  onClick={onClose}
                  className="flex-1 h-16 rounded-[22px] bg-[#222] border border-white/10 text-[#E3DAC9]/40 font-black font-['Outfit'] uppercase tracking-[0.2em] text-[13px] active:scale-95 transition-all shadow-[5px_5px_0px_rgba(0,0,0,1)]"
                >
                  Batal
                </button>
                <button 
                  onClick={handleAdd}
                  disabled={!title.trim()}
                  className={`flex-[2] h-16 rounded-[22px] font-black font-['Outfit'] uppercase tracking-[0.2em] text-[13px] shadow-[5px_5px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 ${
                    title.trim() 
                    ? 'bg-[#00FF85] text-black border-[2px] border-black active:scale-95 active:shadow-none' 
                    : 'bg-white/5 text-white/5 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  Tambah Rencana
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
