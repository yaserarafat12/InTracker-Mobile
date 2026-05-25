import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useHabitStore } from '../../store/useHabitStore';
import { useJourneyStore } from '../../store/useJourneyStore';


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
  const { entries, saveEntry, uploadMedia } = useJourneyStore();
  
  // Format date to local YYYY-MM-DD to avoid timezone shifts
  const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  
  const entry = entries[dateKey];


  const [localJournal, setLocalJournal] = useState(entry?.journal_text || '');
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with store if needed (when modal opens)
  useEffect(() => {
    if (entry) {
      setLocalJournal(entry.journal_text || '');
    }
  }, [entry?.journal_text, isJournalOpen]);

  const currentMood = entry?.mood_id ?? null;
  const currentMedia = entry?.media_urls || [];

  
  const dayOfMonth = date.getDate().toString().padStart(2, '0');
  const monthRaw = getIndonesianMonth(date);
  const monthName = monthRaw.charAt(0) + monthRaw.slice(1).toLowerCase();
  const dateLabel = getDateLabel(date);
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const isFuture = date > today && !isCurrent;
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

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

  const handleMoodSelect = async (idx: number) => {
    handleVibrate();
    await saveEntry({
      entry_date: dateKey,
      mood_id: idx
    });
  };

  const handleJournalSave = async () => {
    handleVibrate();
    await saveEntry({
      entry_date: dateKey,
      journal_text: localJournal
    });
    setIsJournalOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const url = await uploadMedia(file);
    if (url) {
      const updatedMedia = [...currentMedia, url];
      await saveEntry({
        entry_date: dateKey,
        media_urls: updatedMedia
      });
    }
    setIsUploading(false);
    setIsMediaOpen(false);
  };


  if (isCompact) {
    return (
      <div className="relative flex gap-4 pb-5">
        {/* Compact Timeline Column - MATCHED WITH CURRENT/FUTURE */}
        <div className="w-12 flex flex-col items-center flex-shrink-0">
          <div className="w-12 h-12 rounded-[16px] bg-[#212121] border-[2px] border-white/20 flex items-center justify-center z-10 mt-0.5">
            <Icon icon="solar:check-circle-bold" className="text-[#00FF85]/40" width={24} />
          </div>
          {!isLast && (
            <div className="relative w-[3px] flex-1 mt-0 -mb-5">
              <div className="absolute inset-0 h-full w-full bg-[#00FF85]/10 rounded-full" />
              <div className="absolute inset-0 h-full w-full border-l-[3px] border-solid border-[#00FF85]/60 shadow-[0_0_10px_rgba(0,255,133,0.2)]" />
            </div>
          )}
        </div>

        {/* Compact Table Row */}
        <div className="flex-1">
          <div className="bg-white/[0.02] border border-white/5 rounded-[20px] px-3 py-2.5 flex items-center group transition-all hover:bg-white/[0.04]">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Date Column - One Line */}
              <div className="flex items-center gap-2 leading-none min-w-[75px]">
                <span className="text-lg font-black text-[#E3DAC9] tracking-normal">{dayOfMonth}</span>
                <span className="text-lg font-black text-[#E3DAC9] tracking-normal">{monthName}</span>
              </div>

              <div className="h-6 w-[1.5px] bg-white/20" />

              {/* Mood Column */}
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest hidden sm:block">Mood</span>
                <span className="text-lg">{currentMood !== null ? moods[currentMood].emoji : '—'}</span>
              </div>

              <div className="h-6 w-[1.5px] bg-white/20" />

              {/* Media Column */}
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest hidden sm:block">Media</span>
                <div className="flex items-center gap-1">
                  <Icon icon="solar:gallery-bold" className="text-[#00FF85]/40" width={12} />
                  <span className="text-[9px] font-black text-[#00FF85]/60">{currentMedia.length}</span>
                </div>
              </div>

              <div className="h-6 w-[1.5px] bg-white/20" />

              {/* Note Column - Stretching to fill space */}
              <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest hidden sm:block">Catatan</span>
                <span className={`text-[10px] font-black truncate ${entry?.journal_text ? 'text-[#00FF85]' : 'text-white/20'}`}>
                  {entry?.journal_text || 'Tidak ada catatan'}
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
    <div className="relative flex gap-4 pb-6">
      {/* --- NEOBRUTALIST TIMELINE - FIXED WIDTH W-12 --- */}
      <div className="w-12 flex flex-col items-center flex-shrink-0">
        <motion.div 
          initial={false}
          animate={{ 
            rotate: isCurrent ? [0, 2, -2, 0] : 0,
            scale: isCurrent ? 1.05 : 1,
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className={`
            w-12 h-12 rounded-[16px] flex items-center justify-center z-10 border-[2px] transition-all mt-0.5 relative
            ${isCurrent 
              ? 'bg-[#00FF85] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' 
              : isTomorrow
              ? 'bg-[#212121] border-[#00FF85]/50'
              : 'bg-[#212121] border-white/20 shadow-none'}
          `}
        >
          {isTomorrow && (
            <div className="tomorrow-glow-border absolute inset-[-2px] rounded-[18px] pointer-events-none z-0" />
          )}
          <Icon 
            icon={isCurrent ? "solar:star-bold" : (isFuture ? "solar:lock-bold" : "solar:check-circle-bold")} 
            className={isCurrent ? "text-black" : (isTomorrow ? "text-[#00FF85]/60" : (isFuture ? "text-[#E3DAC9]/30" : "text-[#00FF85]/40"))} 
            width={24} 
          />
        </motion.div>

        {!isLast && (
          <div className="relative w-[3px] flex-1 mt-0 -mb-6">
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
          <div className="relative z-10 flex flex-col gap-3">
            {/* Header */}
            <div className="flex justify-between items-end px-1 pb-2 border-b border-white/5">
              <div className="flex flex-col">
                <p className="text-[10px] font-black font-['Outfit'] text-[#00FF85] tracking-widest uppercase mb-0.5">
                   {dateLabel}
                </p>
                <div className="flex items-center gap-2">
                  <h2 className="text-[28px] font-black font-['Outfit'] text-white/95 tracking-tight leading-none">
                    {dayOfMonth} {monthName}
                  </h2>
                </div>
              </div>
            </div>

            {/* THE 3-GRID SYSTEM */}
            <div className="grid grid-cols-2 gap-2">
              
              {/* BOX 1: MOOD (FULL WIDTH - TOP) */}
              <div className="col-span-2 bg-[#1c1e22] border-[2px] border-white/20 rounded-[28px] p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] group/mood">
                <span className="text-[11px] font-black font-['Outfit'] text-white tracking-normal text-center block mb-3">
                  {isCurrent ? 'Apa yang kamu rasakan hari ini?' : 'Mood hari ini'}
                </span>
                <div className="flex items-center justify-center gap-3">
                  {moods.slice(0, 5).map((m, idx) => (
                    <motion.button
                      key={idx}
                      whileTap={isCurrent ? { x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" } : {}}
                      onClick={() => isCurrent && handleMoodSelect(idx)}
                      className={`
                        w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all border-[1.5px]
                        ${currentMood === idx ? 'bg-[#00FF85] scale-125 shadow-[3px_3px_0px_rgba(0,0,0,1)] border-[#00FF85]' : 'bg-[#2a2c32] border-[#E3DAC9]/30'}
                        ${!isCurrent && currentMood !== idx ? 'opacity-30' : ''}
                      `}
                      disabled={!isCurrent}
                    >
                      {m.emoji}
                    </motion.button>
                  ))}
                </div>
                {currentMood !== null && (
                  <p className="text-[9px] font-black font-['Outfit'] text-[#00FF85] uppercase tracking-widest text-center mt-3">
                    {moods[currentMood].label}
                  </p>
                )}
              </div>


              {/* BOX 2: JOURNAL (LEFT SQUARE) */}
              <motion.button 
                whileTap={isCurrent ? { x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" } : {}}
                onClick={() => { if (isCurrent || entry?.journal_text) { setIsJournalOpen(true); handleVibrate(); } }}
                className="aspect-square bg-[#1c1e22] border-[2px] border-white/20 rounded-[28px] flex flex-col items-center justify-between p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] group/journal"
              >
                <span className="text-[11px] font-black font-['Outfit'] text-white tracking-normal text-center leading-tight">
                  Ceritakan harimu
                </span>
                <div className="h-14 w-14 bg-[#2a2c32] border-[2px] border-white/25 rounded-2xl flex items-center justify-center transition-all">
                  <Icon icon="solar:pen-new-square-bold" className="text-[#00FF85]" width={28} />
                </div>
                <p className="text-[9px] font-black font-['Outfit'] uppercase tracking-widest">
                  <span className={entry?.journal_text ? 'text-[#00FF85]' : 'text-white'}>
                    {entry?.journal_text ? 'Sudah ditulis' : (isCurrent ? 'Tulis Sekarang' : 'Tulis Sekarang')}
                  </span>
                </p>
              </motion.button>


              {/* BOX 3: MEDIA (RIGHT SQUARE) */}
              <motion.button 
                whileTap={isCurrent || currentMedia.length > 0 ? { x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" } : {}}
                onClick={() => { if (isCurrent || currentMedia.length > 0) { setIsMediaOpen(true); handleVibrate(); } }}
                className="aspect-square bg-[#1c1e22] border-[2px] border-white/20 rounded-[28px] flex flex-col items-center justify-between p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] group/media"
              >
                <span className="text-[11px] font-black font-['Outfit'] text-white tracking-normal text-center leading-tight">
                  {currentMedia.length > 0 ? 'Abadikan momen' : 'Abadikan momen'}
                </span>

                {currentMedia.length > 0 ? (
                  <div className="w-14 h-14 grid grid-cols-2 grid-rows-2 gap-[1px] rounded-xl overflow-hidden border-[1px] border-[#E3DAC9]/40">
                    {[0, 1, 2, 3].map((idx) => (
                      <div key={idx} className="w-full h-full bg-[#2a2c32] overflow-hidden">
                        {currentMedia[idx] && (
                          <img src={currentMedia[idx]} className="w-full h-full object-cover" alt={`Foto ${idx + 1}`} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-[#2a2c32] border-[2px] border-white/25 rounded-2xl flex items-center justify-center">
                    {isUploading ? (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Icon icon="solar:refresh-bold" className="text-[#00FF85]" width={30} />
                      </motion.div>
                    ) : (
                      <Icon icon="solar:camera-bold" className="text-[#00FF85]" width={30} />
                    )}
                  </div>
                )}

                <span className={`text-[9px] font-black font-['Outfit'] uppercase tracking-widest ${currentMedia.length > 0 ? 'text-[#00FF85]' : 'text-white'}`}>
                  {currentMedia.length > 0 ? `${currentMedia.length} Foto` : 'Tambah Foto'}
                </span>
              </motion.button>


            </div>
          </div>
        </div>
      </div>


      {/* --- MODALS (PREMIUM) --- */}
      <AnimatePresence>
        
        {/* MEDIA MODAL (BOTTOM SHEET WITH GALLERY) */}
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
              className="relative w-full max-w-md bg-[#212121] border-[2px] border-white/15 rounded-[32px] p-6 pb-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
            >
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5" />
              <h4 className="text-[16px] font-black font-['Outfit'] text-[#E3DAC9] uppercase tracking-wider mb-6 text-center">
                {currentMedia.length > 0 ? 'Foto Hari Ini' : 'Abadikan Momen'}
              </h4>
              
              {/* HIDDEN FILE INPUT */}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />

              {/* Existing Photos Grid */}
              {currentMedia.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {currentMedia.map((url, idx) => (
                    <motion.div
                      key={idx}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(url, '_blank')}
                      className="aspect-square rounded-xl overflow-hidden border border-[#E3DAC9]/10 cursor-pointer"
                    >
                      <img src={url} className="w-full h-full object-cover" alt={`Foto ${idx + 1}`} />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add Buttons - only for current day */}
              {isCurrent && (
                <div className="grid grid-cols-2 gap-3">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-4 bg-[#1a1a1a] border border-[#E3DAC9]/10 rounded-[16px]"
                  >
                    <Icon icon="solar:camera-bold" className="text-[#00FF85]" width={20} />
                    <span className="text-[10px] font-black text-[#E3DAC9] uppercase tracking-wider">Ambil Foto</span>
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-4 bg-[#1a1a1a] border border-[#E3DAC9]/10 rounded-[16px]"
                  >
                    <Icon icon="solar:gallery-bold" className="text-[#00FF85]" width={20} />
                    <span className="text-[10px] font-black text-[#E3DAC9] uppercase tracking-wider">Dari Galeri</span>
                  </motion.button>
                </div>
              )}

              {/* Close */}
              <button
                onClick={() => setIsMediaOpen(false)}
                className="w-full py-3 mt-4 text-[#E3DAC9]/40 text-[11px] font-bold font-['Outfit'] uppercase tracking-wider"
              >
                Tutup
              </button>
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
              className="flex-1 flex flex-col p-6 pt-14 max-w-2xl mx-auto w-full"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-10">
                <div className="flex flex-col">
                   <p className="text-[10px] font-black font-['Outfit'] text-[#00FF85] uppercase tracking-widest mb-1">{dateLabel}</p>
                   <h3 className="text-[28px] font-black font-['Outfit'] text-white tracking-tight leading-none">{dayOfMonth} {monthName}</h3>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsJournalOpen(false)}
                  className="w-10 h-10 bg-[#1c1e22] border-[2px] border-white/15 rounded-xl flex items-center justify-center"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="#E3DAC9" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.button>
              </div>

              {/* Textarea */}
              <div className="h-[1px] bg-[#E3DAC9]/10 mb-4" />
              <textarea 
                autoFocus={isCurrent}
                value={localJournal}
                onChange={(e) => setLocalJournal(e.target.value)}
                readOnly={!isCurrent}
                placeholder={isCurrent ? "Tumpahkan semua pikiranmu di sini..." : "Tidak ada catatan untuk hari ini."}
                className={`flex-1 bg-transparent text-xl font-medium font-['Outfit'] focus:outline-none resize-none leading-relaxed ${
                  isCurrent ? 'text-[#E3DAC9] placeholder:text-white/5' : 'text-[#E3DAC9]/50 placeholder:text-white/10 cursor-default'
                }`}
              />
              <div className="h-[1px] bg-[#E3DAC9]/10 mt-4" />

              {/* Bottom */}
              <div className="pt-4 pb-10 flex flex-col items-center gap-3">
                <span className="text-[11px] font-black font-['Outfit'] text-[#E3DAC9]/30">{localJournal.length} karakter</span>
                {isCurrent && (
                  <motion.button 
                    whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                    onClick={handleJournalSave}
                    className="w-full bg-[#00FF85] text-black py-4 rounded-[16px] font-black font-['Outfit'] uppercase tracking-wider text-[13px] border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    Simpan Jurnal
                  </motion.button>
                )}
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
  const { fetchEntries } = useJourneyStore();

  useEffect(() => {
    fetchEntries();
  }, []);


  // Generate 30 days of the current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayStr = today.toDateString();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const journeyDays = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month, i + 1);
    return {
      id: `day-${i + 1}`,
      day: i + 1,
      date: date,
      isCurrent: date.toDateString() === todayStr,
      isCompact: false
    };
  });

  useEffect(() => {
    // Scroll to today's entry on mount with delay to override parent scroll
    const timer = setTimeout(() => {
      if (todayRef.current) {
        todayRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="px-6 pt-8 pb-32">
      {/* Timeline List */}
      <div className="relative pt-6">
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
            
            <p className="text-[#E3DAC9]/40 font-black font-['Outfit'] text-[11px] uppercase tracking-[0.4em] mt-2">
              BULAN SELANJUTNYA
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
};
