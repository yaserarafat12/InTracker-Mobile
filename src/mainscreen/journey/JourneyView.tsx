import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useHabitStore } from '../../store/useHabitStore';

interface JourneyItemProps {
  day: number;
  date: Date;
  isCurrent?: boolean;
  isLast?: boolean;
  isCompact?: boolean;
  id: string;
}

const getIndonesianDay = (date: Date) => {
  const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  return days[date.getDay()];
};

const getIndonesianMonth = (date: Date) => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
  return months[date.getMonth()];
};

const getDateLabel = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === -1) return 'Kemarin';
  if (diffDays === 1) return 'Besok';
  
  const dayName = getIndonesianDay(date);
  return dayName.charAt(0) + dayName.slice(1).toLowerCase();
};

const JourneyItem: React.FC<JourneyItemProps> = ({ date, isCurrent, isLast, isCompact }) => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [journal, setJournal] = useState('');
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  
  const dayOfMonth = date.getDate().toString().padStart(2, '0');
  const monthRaw = getIndonesianMonth(date);
  const monthName = monthRaw.charAt(0) + monthRaw.slice(1).toLowerCase();
  const dateLabel = getDateLabel(date);
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const isFuture = date > today && !isCurrent;

  const moods = [
    { emoji: '🤩', label: 'Luar Biasa', color: 'hover:bg-yellow-400/20', active: 'bg-yellow-400' },
    { emoji: '😊', label: 'Senang', color: 'hover:bg-[#00FF85]/20', active: 'bg-[#00FF85]' },
    { emoji: '😐', label: 'Biasa Saja', color: 'hover:bg-gray-300/20', active: 'bg-[#E3DAC9]' },
    { emoji: '😔', label: 'Sedih', color: 'hover:bg-blue-400/20', active: 'bg-blue-400' },
    { emoji: '😫', label: 'Buruk', color: 'hover:bg-red-400/20', active: 'bg-red-400' },
  ];

  const handleVibrate = () => {
    if (navigator.vibrate) navigator.vibrate(10);
  };

  if (isCompact) {
    return (
      <div className="relative flex gap-4 pb-8">
        {/* Compact Timeline Column - FIXED WIDTH W-12 */}
        <div className="w-12 flex flex-col items-center flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#212121] border border-[#00FF85]/30 flex items-center justify-center z-10 mt-[10px] shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <Icon icon="solar:check-circle-bold" className="text-[#00FF85]/60" width={16} />
          </div>
          {!isLast && <div className="w-[2px] flex-1 bg-white/10 mb-[-8px]" />}
        </div>

        {/* Compact Table Row */}
        <div className="flex-1">
          <div className="bg-white/[0.02] border border-white/5 rounded-[20px] px-3 py-2.5 flex items-center group transition-all hover:bg-white/[0.04]">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Date Column - One Line */}
              <div className="flex items-center gap-2 leading-none min-w-[75px]">
                <span className="text-lg font-black text-[#E3DAC9] tracking-tighter">{dayOfMonth}</span>
                <span className="text-lg font-black text-[#E3DAC9] tracking-tighter">{monthName}</span>
              </div>

              <div className="h-6 w-[1.5px] bg-white/20" />

              {/* Mood Column */}
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest hidden sm:block">Mood</span>
                <span className="text-lg">{selectedMood !== null ? moods[selectedMood].emoji : '—'}</span>
              </div>

              <div className="h-6 w-[1.5px] bg-white/20" />

              {/* Media Column */}
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest hidden sm:block">Media</span>
                <div className="flex items-center gap-1">
                  <Icon icon="solar:gallery-bold" className="text-[#E3DAC9]/40" width={12} />
                  <span className="text-[9px] font-black text-[#E3DAC9]/60">0</span>
                </div>
              </div>

              <div className="h-6 w-[1.5px] bg-white/20" />

              {/* Note Column - Stretching to fill space */}
              <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest hidden sm:block">Catatan</span>
                <span className={`text-[10px] font-black truncate ${journal ? 'text-[#00FF85]' : 'text-white/20'}`}>
                  {journal || 'Tidak ada catatan'}
                </span>
              </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsJournalOpen(true)}
              className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#00FF85]/10 group-hover:border-[#00FF85]/30 transition-all ml-2 flex-shrink-0"
            >
              <Icon icon="solar:alt-arrow-right-bold" className="text-white/20 group-hover:text-[#00FF85]" width={12} />
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex gap-4 pb-12">
      {/* --- NEOBRUTALIST TIMELINE - FIXED WIDTH W-12 --- */}
      <div className="w-12 flex flex-col items-center flex-shrink-0">
        <motion.div 
          initial={false}
          animate={{ 
            rotate: isCurrent ? [0, 5, -5, 0] : 0,
            scale: isCurrent ? 1.1 : 1,
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className={`
            w-14 h-14 rounded-[20px] flex items-center justify-center z-10 border-[2px] transition-all mt-0.5
            ${isCurrent 
              ? 'bg-[#00FF85] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]' 
              : 'bg-[#212121] border-white/20 shadow-none'}
          `}
        >
          <Icon 
            icon={isCurrent ? "solar:star-bold" : (isFuture ? "solar:lock-bold" : "solar:check-circle-bold")} 
            className={isCurrent ? "text-black" : (isFuture ? "text-[#E3DAC9]/30" : "text-[#00FF85]/40")} 
            width={28} 
          />
        </motion.div>

        {!isLast && (
          <div className="relative w-[2px] flex-1 mt-2 mb-[-12px]">
            {/* Base Glow Background */}
            <div className={`absolute inset-0 h-full w-full ${isFuture ? 'bg-white/5' : 'bg-[#00FF85]/10'} rounded-full`} />
            
            {/* Main Path Line */}
            <div className={`
              absolute inset-0 h-full w-full border-l-[2px] 
              ${isFuture 
                ? 'border-dashed border-white/20' 
                : 'border-solid border-[#00FF85]/50 shadow-[0_0_10px_rgba(0,255,133,0.2)]'
              }
            `} />
          </div>
        )}
      </div>

      {/* --- CONTENT AREA (MODULAR 4-GRID) --- */}
      <div className="flex-1 mt-0">
        <div className={`
          relative bg-transparent rounded-[32px] pb-4
          group transition-all duration-300
        `}>
          <div className="relative z-10 flex flex-col gap-4">
            {/* Header */}
            <div className="flex justify-between items-end px-1 pb-2 border-b border-white/5">
              <div className="flex flex-col">
                <p className="text-[11px] font-black text-[#00FF85] tracking-tight mb-1">
                   {dateLabel}
                </p>
                <div className="flex items-center gap-3">
                  <h2 className="text-[42px] font-black text-[#E3DAC9] tracking-tighter leading-none opacity-90">
                    {dayOfMonth} {monthName}
                  </h2>
                </div>
              </div>
            </div>

            {/* THE 3-GRID SYSTEM */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* BOX 1: MOOD SYNC (DIRECT SELECTION) */}
              <div className="aspect-square bg-[#222] border-[2px] border-black rounded-[28px] flex flex-col p-3.5 items-center justify-between shadow-[4px_4px_0px_rgba(0,0,0,1)] group/mood">
                <span className="text-[10px] font-black text-[#E3DAC9]/40 tracking-tight text-center leading-tight uppercase">Mood</span>
                <div className="grid grid-cols-3 gap-2 py-1">
                  {moods.slice(0, 6).map((m, idx) => (
                    <motion.button
                      key={idx}
                      whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                      onClick={() => { setSelectedMood(idx); handleVibrate(); }}
                      className={`
                        w-8 h-8 rounded-xl flex items-center justify-center text-lg transition-all border-[1.5px] border-black
                        ${selectedMood === idx ? 'bg-[#00FF85] scale-110 shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'bg-black/20'}
                      `}
                    >
                      {m.emoji}
                    </motion.button>
                  ))}
                </div>
                <p className="text-[8px] font-bold text-[#00FF85] uppercase tracking-widest">
                  {selectedMood !== null ? moods[selectedMood].label : 'Pilih satu'}
                </p>
              </div>

              {/* BOX 2: MEDIA (VISUAL JOURNEY) */}
              <motion.button 
                whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                onClick={() => { setIsMediaOpen(true); handleVibrate(); }}
                className="aspect-square bg-[#222] border-[2px] border-black rounded-[28px] flex flex-col items-center justify-center gap-2 shadow-[4px_4px_0px_rgba(0,0,0,1)] group/media"
              >
                <span className="text-[10px] font-black text-[#E3DAC9]/40 tracking-tight mb-1 text-center uppercase">Media</span>
                <div className="w-full px-3">
                   <div className="w-full py-4 bg-black/40 border-[1.5px] border-black rounded-[22px] flex flex-col items-center justify-center gap-2 group-hover/media:bg-black/60 transition-all shadow-inner">
                      <div className="relative">
                        <Icon icon="solar:camera-bold" className="text-[#00FF85]" width={24} />
                      </div>
                      <span className="text-[8px] font-black text-[#E3DAC9]/60 uppercase tracking-[0.2em]">Tambah</span>
                   </div>
                </div>
              </motion.button>

              {/* BOX 3: JOURNAL (FULL WIDTH) */}
              <motion.button 
                whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                onClick={() => { setIsJournalOpen(true); handleVibrate(); }}
                className="col-span-2 bg-[#222] border-[2px] border-black rounded-[28px] p-5 flex items-center gap-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] group/journal"
              >
                <div className="h-12 w-12 bg-[#00FF85] border-[2px] border-black rounded-2xl flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] group-hover/journal:translate-x-0.5 group-hover/journal:translate-y-0.5 group-hover/journal:shadow-none transition-all">
                  <Icon icon="solar:pen-new-square-bold" className="text-black" width={24} />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-[12px] font-black text-[#E3DAC9] uppercase tracking-wider">Journaling</span>
                  <span className="text-[9px] font-bold text-[#E3DAC9]/30 uppercase tracking-widest mt-0.5">Tulis Pikiran & Refleksi</span>
                </div>
                <Icon icon="solar:alt-arrow-right-bold" className="ml-auto text-[#00FF85]" width={20} />
              </motion.button>

            </div>
          </div>
        </div>
      </div>


      {/* --- MODALS (PREMIUM) --- */}
      <AnimatePresence>
        
        {/* MEDIA MODAL (BOTTOM SHEET) */}
        {isMediaOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMediaOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-[#212121] border-[1.5px] border-[#E3DAC9]/20 rounded-[40px] p-8 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-10" />
              <h4 className="text-xl font-black text-[#E3DAC9] uppercase tracking-tighter italic mb-8 text-center">Abadikan Momen</h4>
              <div className="grid grid-cols-2 gap-4">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-4 p-6 bg-white/[0.03] border-[1px] border-white/5 rounded-[32px] hover:bg-[#00FF85]/10 hover:border-[#00FF85]/30 transition-all group"
                >
                  <div className="w-16 h-16 rounded-full bg-[#00FF85]/10 flex items-center justify-center border border-[#00FF85]/20 group-hover:bg-[#00FF85] transition-all">
                    <Icon icon="solar:camera-bold" className="text-[#00FF85] group-hover:text-black transition-colors" width={32} />
                  </div>
                  <span className="text-[11px] font-black text-[#E3DAC9] uppercase tracking-widest">Ambil Foto</span>
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-4 p-6 bg-white/[0.03] border-[1px] border-white/5 rounded-[32px] hover:bg-yellow-400/10 hover:border-yellow-400/30 transition-all group"
                >
                  <div className="w-16 h-16 rounded-full bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20 group-hover:bg-yellow-400 transition-all">
                    <Icon icon="solar:videocamera-record-bold" className="text-yellow-400 group-hover:text-black transition-colors" width={32} />
                  </div>
                  <span className="text-[11px] font-black text-[#E3DAC9] uppercase tracking-widest">Rekam Vlog</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* JOURNAL MODAL (FULL SCREEN IMMERSIVE) */}
        {isJournalOpen && (
          <div className="fixed inset-0 z-[100] bg-[#212121] flex flex-col">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="flex-1 flex flex-col p-8 pt-16 max-w-2xl mx-auto w-full"
            >
              <div className="flex justify-between items-start mb-16">
                <div className="flex flex-col">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="w-2 h-2 rounded-full bg-[#00FF85] shadow-[0_0_10px_#00FF85]" />
                     <p className="text-[11px] font-black text-[#00FF85] uppercase tracking-[0.3em]">Journaling</p>
                   </div>
                   <h3 className="text-4xl font-black text-[#E3DAC9] italic tracking-tighter">{dayOfMonth} {monthName}</h3>
                   <p className="text-[#00FF85] font-black tracking-widest text-[10px] mt-1">{dateLabel}</p>
                </div>
                <motion.button 
                  whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                  onClick={() => setIsJournalOpen(false)}
                  className="w-14 h-14 bg-[#222] border-[2px] border-black rounded-2xl flex items-center justify-center text-[#E3DAC9] shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                >
                  <Icon icon="solar:close-circle-bold" width={28} />
                </motion.button>
              </div>

              <textarea 
                autoFocus
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                placeholder="Tumpahkan semua pikiranmu di sini..."
                className="flex-1 bg-transparent text-2xl text-[#E3DAC9] font-medium placeholder:text-white/5 focus:outline-none resize-none leading-relaxed"
              />

              <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-6 justify-between items-center pb-12">
                 <div className="flex flex-col items-center sm:items-start">
                   <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Panjang Jurnal</span>
                   <span className="text-xl font-black text-[#E3DAC9]/60 uppercase tracking-tighter">{journal.length} Karakter</span>
                 </div>
                 <motion.button 
                   whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                   onClick={() => { setIsJournalOpen(false); handleVibrate(); }}
                   className="bg-[#00FF85] text-black px-12 py-5 rounded-[24px] font-black uppercase tracking-widest border-[2px] border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all"
                 >
                   Simpan Jurnal
                 </motion.button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
};

export const JourneyView: React.FC = () => {
  const todayRef = useRef<HTMLDivElement>(null);

  // Generate 30 days of the current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const journeyDays = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month, i + 1);
    return {
      id: `day-${i + 1}`,
      day: i + 1,
      date: date,
      isCurrent: date.toDateString() === today.toDateString(),
      isCompact: date < new Date(today.setHours(0,0,0,0))
    };
  });

  useEffect(() => {
    // Scroll to today's entry on mount
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, []);

  return (
    <div className="px-6 pt-4 pb-32">
      {/* Timeline List */}
      <div className="relative pt-4">
        {journeyDays.map((d, idx) => (
          <div key={d.id} ref={d.isCurrent ? todayRef : null} className={d.isCurrent ? "scroll-mt-[140px]" : ""}>
            <JourneyItem 
              {...d}
              isLast={idx === journeyDays.length - 1}
            />
          </div>
        ))}

        {/* NEXT MONTH LOCK - CLEAN ICON DESIGN */}
        <div className="relative flex flex-col items-center justify-center mt-20 mb-40">
          <motion.div
            animate={{ 
              y: [0, -15, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-6">
              {/* Subtle Bone White Glow */}
              <div className="absolute inset-0 bg-[#E3DAC9]/5 blur-[40px] rounded-full scale-150" />
              
              <Icon 
                icon="solar:lock-bold" 
                className="text-[#E3DAC9] drop-shadow-[0_0_20px_rgba(227,218,201,0.3)]" 
                width={100} 
                height={100} 
              />
            </div>
            
            <p className="text-[#E3DAC9]/40 font-black text-[11px] uppercase tracking-[0.4em] mt-2">
              BULAN SELANJUTNYA
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
};
