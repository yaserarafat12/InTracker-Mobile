import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useHabitStore } from '../../store/useHabitStore';
import { useJourneyStore } from '../../store/useJourneyStore';
import { useUserStore } from '../../store/useUserStore';
import { useTranslation } from '../../i18n';


interface JourneyItemProps {
  day: number;
  date: Date;
  isCurrent?: boolean;
  isLast?: boolean;
  isCompact?: boolean;
  id: string;
}

const getLocalizedDay = (date: Date, t: any) => {
  return t(`schedule.days.full.${date.getDay()}`);
};

const getLocalizedMonth = (date: Date) => {
  const language = useUserStore.getState().settings.language;
  const localeMap: Record<string, string> = {
    'Bahasa Indonesia': 'id-ID',
    'English': 'en-US',
    'Español': 'es-ES',
    'Chinese': 'zh-CN',
    'Hindi': 'hi-IN',
    'Arabic': 'ar-EG',
    'Portuguese': 'pt-PT',
    'Français': 'fr-FR',
    'Japanese': 'ja-JP',
    'Deutsch': 'de-DE',
    'Korean': 'ko-KR'
  };
  const locale = localeMap[language] || 'en-US';
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'short' });
  return monthFormatter.format(date).toUpperCase();
};

const getDateLabel = (date: Date, t: any) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t('journey.date.today');
  if (diffDays === -1) return t('journey.date.yesterday');
  if (diffDays === 1) return t('journey.date.tomorrow');
  
  const dayName = getLocalizedDay(date, t);
  return dayName.charAt(0) + dayName.slice(1).toLowerCase();
};

const getProgramDayLabel = (dayNum: number, currentLanguage: string) => {
  if (currentLanguage === 'Bahasa Indonesia') return `Hari\u00A0\u00A0${dayNum}`;
  if (currentLanguage === 'Deutsch') return `Tag\u00A0\u00A0${dayNum}`;
  if (currentLanguage === 'Español') return `Día\u00A0\u00A0${dayNum}`;
  if (currentLanguage === 'Français') return `Jour\u00A0\u00A0${dayNum}`;
  if (currentLanguage === 'Portuguese') return `Dia\u00A0\u00A0${dayNum}`;
  if (currentLanguage === 'Japanese') return `${dayNum}日目`;
  if (currentLanguage === 'Chinese') return `第\u00A0${dayNum}\u00A0天`;
  if (currentLanguage === 'Arabic') return `اليوم\u00A0\u00A0${dayNum}`;
  if (currentLanguage === 'Hindi') return `दिन\u00A0\u00A0${dayNum}`;
  if (currentLanguage === 'Korean') return `${dayNum}일차`;
  return `Day\u00A0\u00A0${dayNum}`;
};

const JourneyItem: React.FC<JourneyItemProps> = ({ date, isCurrent, isLast, isCompact, day }) => {
  const { entries, saveEntry, uploadMedia } = useJourneyStore();
  const { t, language } = useTranslation();
  const isLight = !document.documentElement.classList.contains('dark');
  
  // Format date to local YYYY-MM-DD to avoid timezone shifts
  const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  
  const entry = entries[dateKey];


  const [localJournal, setLocalJournal] = useState(entry?.journal_text || '');
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // Optimistic mood state — gives immediate visual feedback on emoji tap
  const [optimisticMood, setOptimisticMood] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with store if needed (when modal opens)
  useEffect(() => {
    if (entry) {
      setLocalJournal(entry.journal_text || '');
    }
  }, [entry?.journal_text, isJournalOpen]);

  const currentMood = entry?.mood_id ?? null;
  // displayMood: use server value if saved, otherwise the optimistic tap
  const displayMood = currentMood !== null ? currentMood : optimisticMood;
  const currentMedia = entry?.media_urls || [];

  
  const dayOfMonth = date.getDate().toString().padStart(2, '0');
  const monthRaw = getLocalizedMonth(date);
  const monthName = monthRaw.charAt(0) + monthRaw.slice(1).toLowerCase();
  const dateLabel = getDateLabel(date, t);
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const isFuture = date > today && !isCurrent;
  const isEditable = !isFuture;
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const moods = [
    { emoji: '😫', label: t('journey.moods.bad'), color: 'hover:bg-red-400/20', active: 'bg-red-400' },
    { emoji: '😔', label: t('journey.moods.sad'), color: 'hover:bg-blue-400/20', active: 'bg-blue-400' },
    { emoji: '😐', label: t('journey.moods.neutral'), color: 'hover:bg-gray-300/20', active: 'bg-[#E3DAC9]' },
    { emoji: '😊', label: t('journey.moods.happy'), color: 'hover:bg-[#00FF85]/20', active: 'bg-[#00FF85]' },
    { emoji: '🤩', label: t('journey.moods.awesome'), color: 'hover:bg-yellow-400/20', active: 'bg-yellow-400' },
  ];

  const handleVibrate = () => {
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const handleMoodSelect = async (idx: number) => {
    handleVibrate();
    // Optimistic update — show selected state immediately without waiting for Supabase
    setOptimisticMood(idx);
    await saveEntry({
      entry_date: dateKey,
      mood_id: idx
    });
    // If Supabase returned a saved entry, optimisticMood is now redundant (currentMood takes over)
    // If it failed, at least the UI shows the user's intent
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
          <div className="w-12 h-12 rounded-[16px] bg-[#212121] dark:bg-[#2e3240] journey-compact-node border-[2px] border-white/20 dark:border-white/40 flex items-center justify-center z-10 mt-0.5">
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
          <div className="journey-compact-row bg-white/[0.02] border border-white/5 rounded-[20px] px-3 py-2.5 flex items-center group transition-all hover:bg-white/[0.04]">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Date Column - One Line */}
              <div className="flex items-center gap-2 leading-none min-w-[75px]">
                <span className="text-lg font-black text-[#E3DAC9] tracking-normal font-['Outfit']">{dayOfMonth}</span>
                <span className="text-lg font-black text-[#E3DAC9] tracking-normal font-['Outfit']">{monthName}</span>
              </div>

              <div className="h-6 w-[1.5px] bg-white/20" />

              {/* Mood Column */}
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest hidden sm:block font-['Outfit']">{t('journey.mood')}</span>
                <span className="text-lg">{currentMood !== null ? moods[currentMood].emoji : '—'}</span>
              </div>

              <div className="h-6 w-[1.5px] bg-white/20" />

              {/* Media Column */}
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest hidden sm:block font-['Outfit']">{t('journey.media')}</span>
                <div className="flex items-center gap-1">
                  <Icon icon="solar:gallery-bold" className="text-[#00FF85]/40" width={12} />
                  <span className="text-[9px] font-black text-[#00FF85]/60 font-['Outfit']">{currentMedia.length}</span>
                </div>
              </div>

              <div className="h-6 w-[1.5px] bg-white/20" />

              {/* Note Column - Stretching to fill space */}
              <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest hidden sm:block font-['Outfit']">{t('journey.notes')}</span>
                <span className={`text-[10px] font-black truncate font-['Outfit'] ${entry?.journal_text ? 'text-[#00FF85]' : 'text-white/20'}`}>
                  {entry?.journal_text || t('journey.noNotes')}
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

  const isJournalDisabled = !isEditable && !entry?.journal_text;
  const isMediaDisabled = !isEditable && currentMedia.length === 0;
  const isMoodDisabled = !isEditable && currentMood === null;

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
            w-12 h-12 rounded-[10px] flex items-center justify-center z-10 border-[1.5px] transition-all mt-0.5 relative journey-day-node
            ${isCurrent 
              ? (isLight ? 'bg-[#00FF85]/20 border-transparent' : 'bg-os-green border-black dark:border-black shadow-none') 
              : (isLight ? 'bg-white border-black/10' : 'bg-neutral-100 dark:bg-[#2e3240] border-black dark:border-white/60 shadow-none')}
          `}
        >
          {isTomorrow && (
            <div className="tomorrow-glow-border absolute inset-[-2px] rounded-[12px] pointer-events-none z-[-1]" />
          )}
          <Icon 
            icon={isCurrent ? "solar:star-bold" : (isFuture ? "solar:lock-bold" : "solar:check-circle-bold")} 
            className={isCurrent ? (isLight ? 'text-[#00B570]' : 'text-black') : (isTomorrow ? (isLight ? 'text-[#00B570]' : 'text-os-green') : (isFuture ? (isLight ? 'text-black/15' : 'text-[#E3DAC9]/30') : (isLight ? 'text-[#00B570]' : 'text-os-green')))} 
            width={24} 
            height={24} 
          />
        </motion.div>

        {!isLast && (
          <div className="relative w-[3px] flex-1 mt-0 -mb-6">
            {/* Base Glow Background */}
            <div className={`absolute inset-0 h-full w-full ${isFuture ? 'bg-white/5' : 'bg-os-green/10'} rounded-full`} />
            
            {/* Main Path Line */}
            <div className={`
              absolute inset-0 h-full w-full border-l-[2px] 
              ${isFuture 
                ? (isLight ? 'border-dashed border-black/10' : 'border-dashed border-white/20')
                : (isLight ? 'border-solid border-[#00B570]/30 shadow-none' : 'border-solid border-os-green/50 shadow-[0_0_10px_rgba(0,255,133,0.2)]')
              }
            `} />
          </div>
        )}
      </div>

      {/* --- CONTENT AREA (MODULAR 4-GRID) --- */}
      <div id={isCurrent ? "journey-today-card" : undefined} className={`flex-1 mt-0 ${isFuture ? 'opacity-40 grayscale-[35%] pointer-events-none' : ''}`}>
        <div className={`
          relative bg-transparent rounded-[32px] pb-4
          group transition-all duration-300
        `}>
          <div className="relative z-10 flex flex-col gap-3">
            {/* Header */}
            <div className="flex justify-between items-end px-1 pb-2">
              <div className="flex flex-col">
                <p className={`text-[10px] font-black font-['Outfit'] tracking-widest uppercase mb-0.5 ${isLight ? 'text-[#00B570]' : 'text-os-green'}`}>
                   {dayOfMonth} {monthName}
                </p>
                <div className="flex items-center gap-2">
                  <h2 className={`text-[28px] font-black font-['Outfit'] tracking-tight leading-none ${isLight ? 'text-black/90' : 'text-white/95'}`} style={{ whiteSpace: 'pre-wrap' }}>
                    {getProgramDayLabel(day, language)}
                  </h2>
                </div>
              </div>
            </div>

            {/* THE 3-GRID SYSTEM */}
            <div className="grid grid-cols-2 gap-2">
              
              {/* BOX 1: MOOD (FULL WIDTH - TOP) */}
              <div id={isCurrent ? "journey-mood-box" : undefined} className={`col-span-2 backdrop-blur-md journey-card rounded-[20px] p-4 transition-all duration-300 ${isMoodDisabled ? 'opacity-30 grayscale blur-[0.8px] cursor-default pointer-events-none' : ''} ${isLight ? 'bg-white border-[1px] border-black/10' : 'bg-[#1c1e22]/60 border-[1.5px] border-white/10'}`}>
                <span className={`text-[12px] font-black font-['Outfit'] tracking-[0.03em] text-center block mb-3 ${isLight ? 'text-black/85' : 'text-white/90'}`}>
                  {isEditable ? t('journey.whatFelt') : t('journey.moodToday')}
                </span>
                <div className="flex items-center justify-center gap-3">
                  {moods.slice(0, 5).map((m, idx) => (
                    <motion.button
                      key={idx}
                      whileTap={isEditable ? { scale: 0.95 } : {}}
                      onClick={() => {
                        if (isEditable) handleMoodSelect(idx);
                      }}
                      className={`
                        w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all journey-mood-btn
                        ${isLight 
                          ? (displayMood === idx ? 'bg-[#00FF85]/20 border-[1.5px] border-[#00B570] scale-125' : 'bg-neutral-50 border-[1px] border-black/10')
                          : (displayMood === idx ? 'bg-os-green scale-125 border-[1.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' : 'bg-[#212121] border-[1.5px] border-white/20')}
                        ${!isEditable && displayMood !== idx ? 'opacity-35' : ''}
                      `}
                    >
                      {m.emoji}
                    </motion.button>
                  ))}
                </div>
                 {displayMood !== null && (
                  <p className={`text-[9px] font-black font-['Outfit'] uppercase tracking-widest text-center mt-3 ${isLight ? 'text-[#00B570]' : 'text-os-green'}`}>
                    {moods[displayMood].label}
                  </p>
                )}
              </div>


              {/* BOX 2: JOURNAL (LEFT SQUARE) */}
              <motion.button 
                whileTap={isEditable ? { scale: 0.98 } : {}}
                id={isCurrent ? "journey-write-btn" : undefined}
                onClick={() => { if (isEditable || entry?.journal_text) { setIsJournalOpen(true); handleVibrate(); } }}
                className={`aspect-square backdrop-blur-md journey-card rounded-[20px] flex flex-col items-center justify-between p-4 group/journal transition-all duration-300 ${isJournalDisabled ? 'opacity-30 grayscale blur-[0.8px] cursor-default pointer-events-none' : ''} ${isLight ? 'bg-white border-[1px] border-black/10' : 'bg-[#1c1e22]/60 border-[1.5px] border-white/10'}`}
              >
                <span className={`text-[12px] font-black font-['Outfit'] tracking-[0.03em] text-center leading-tight ${isLight ? 'text-black/85' : 'text-white/90'}`}>
                  {t('journey.tellDay')}
                </span>
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all journey-icon-box ${isLight ? 'bg-neutral-50 border-[1px] border-black/10' : 'bg-transparent border-[1.5px] border-white/20'}`}>
                  <Icon icon="solar:pen-new-square-bold" className={isLight ? 'text-[#00B570]' : 'text-[#00FF85]'} width={28} />
                </div>
                <span className={`text-[11px] font-black font-['Outfit'] tracking-[0.03em] ${entry?.journal_text ? (isLight ? 'text-[#00B570]' : 'text-os-green') : (isLight ? 'text-black/85' : 'text-white/60')}`}>
                  {entry?.journal_text ? t('journey.alreadyWritten') : t('journey.writeNow')}
                </span>
              </motion.button>


              {/* BOX 3: MEDIA (RIGHT SQUARE) */}
              <motion.button 
                id={isCurrent ? "journey-media-btn" : undefined}
                whileTap={isEditable || currentMedia.length > 0 ? { scale: 0.98 } : {}}
                onClick={() => { if (isEditable || currentMedia.length > 0) { setIsMediaOpen(true); handleVibrate(); } }}
                className={`aspect-square backdrop-blur-md journey-card rounded-[20px] flex flex-col items-center justify-between p-4 group/media transition-all duration-300 ${isMediaDisabled ? 'opacity-30 grayscale blur-[0.8px] cursor-default pointer-events-none' : ''} ${isLight ? 'bg-white border-[1px] border-black/10' : 'bg-[#1c1e22]/60 border-[1.5px] border-white/10'}`}
              >
                <span className={`text-[12px] font-black font-['Outfit'] tracking-[0.03em] text-center leading-tight ${isLight ? 'text-black/85' : 'text-white/90'}`}>
                  {t('journey.captureMoment')}
                </span>

                {currentMedia.length > 0 ? (
                  <div className={`w-14 h-14 grid grid-cols-2 grid-rows-2 gap-[1px] rounded-xl overflow-hidden border-[1.5px] ${isLight ? 'border-black/10' : 'border-white/20'}`}>
                    {[0, 1, 2, 3].map((idx) => (
                      <div key={idx} className="w-full h-full bg-[#383c4a] overflow-hidden">
                        {currentMedia[idx] && (
                          <img src={currentMedia[idx]} className="w-full h-full object-cover" alt={`Foto ${idx + 1}`} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center journey-icon-box ${isLight ? 'bg-neutral-50 border-[1px] border-black/10' : 'bg-transparent border-[1.5px] border-white/20'}`}>
                    {isUploading ? (
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Icon icon="solar:refresh-bold" className={isLight ? 'text-[#00B570]' : 'text-[#00FF85]'} width={26} />
                      </motion.div>
                    ) : (
                      <Icon icon="solar:camera-bold" className={isLight ? 'text-[#00B570]' : 'text-[#00FF85]'} width={26} />
                    )}
                  </div>
                )}

                <span className={`text-[11px] font-black font-['Outfit'] tracking-[0.03em] ${currentMedia.length > 0 ? (isLight ? 'text-[#00B570]' : 'text-os-green font-bold') : (isLight ? 'text-black/85' : 'text-white/60')}`}>
                  {currentMedia.length > 0 ? `${currentMedia.length} ${language === 'Bahasa Indonesia' ? 'Foto' : 'Photos'}` : t('journey.addPhoto')}
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
                {currentMedia.length > 0 ? t('journey.photosToday') : t('journey.captureMoment')}
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

              {/* Add Buttons - for editable day */}
              {isEditable && (
                <div className="grid grid-cols-2 gap-3">
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-4 bg-[#1a1a1a] border border-[#E3DAC9]/10 rounded-[16px]"
                  >
                    <Icon icon="solar:camera-bold" className="text-[#00FF85]" width={20} />
                    <span className="text-[10px] font-black text-[#E3DAC9] uppercase tracking-wider">{t('journey.takePhoto')}</span>
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-4 bg-[#1a1a1a] border border-[#E3DAC9]/10 rounded-[16px]"
                  >
                    <Icon icon="solar:gallery-bold" className="text-[#00FF85]" width={20} />
                    <span className="text-[10px] font-black text-[#E3DAC9] uppercase tracking-wider">{t('journey.fromGallery')}</span>
                  </motion.button>
                </div>
              )}

              {/* Close */}
              <button
                onClick={() => setIsMediaOpen(false)}
                className="w-full py-3 mt-4 text-[#E3DAC9]/40 text-[11px] font-bold font-['Outfit'] uppercase tracking-wider"
              >
                {t('journey.close')}
              </button>
            </motion.div>
          </div>
        )}

        {/* JOURNAL MODAL (FULL SCREEN IMMERSIVE & PREMIUM PAPERS) */}
        {isJournalOpen && (
          <div className={`fixed inset-0 z-[100] flex flex-col transition-colors duration-300 ${!document.documentElement.classList.contains('dark') ? 'bg-[#fbf9f6]' : 'bg-[#12131a]'}`}>
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="flex-1 flex flex-col p-6 pt-14 max-w-2xl mx-auto w-full h-full justify-between"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                   <p className={`text-[10px] font-black font-['Outfit'] uppercase tracking-widest mb-1 ${!document.documentElement.classList.contains('dark') ? 'text-[#00B570]' : 'text-[#00FF85]'}`}>{dayOfMonth} {monthName}</p>
                   <h3 className={`text-[28px] font-black font-['Outfit'] tracking-tight leading-none ${!document.documentElement.classList.contains('dark') ? 'text-black' : 'text-white'}`} style={{ whiteSpace: 'pre-wrap' }}>{getProgramDayLabel(day, language)}</h3>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    if (localJournal !== (entry?.journal_text || '')) {
                       await handleJournalSave();
                    } else {
                       setIsJournalOpen(false);
                    }
                  }}
                  className={`w-10 h-10 rounded-[10px] border-2 flex items-center justify-center transition-all ${
                    !document.documentElement.classList.contains('dark') 
                      ? 'border-black/50 bg-white text-black shadow-none' 
                      : 'border-white/40 bg-[#2a2c32] text-white shadow-none'
                  }`}
                >
                  <Icon icon="ph:x-bold" width={18} className={!document.documentElement.classList.contains('dark') ? 'text-black/80' : 'text-white'} />
                </motion.button>
              </div>

              {/* Notebook Paper Canvas */}
              <div 
                style={
                  !document.documentElement.classList.contains('dark')
                    ? {
                        backgroundColor: '#faf8f4',
                        backgroundImage: `
                          linear-gradient(rgba(0, 0, 0, 0.15) 1px, transparent 1px),
                          url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.025'/%3E%3C/svg%3E")
                        `,
                        backgroundSize: '100% 32px, 120px 120px',
                      }
                    : {
                        backgroundColor: '#161720',
                        backgroundImage: `
                          linear-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px),
                          url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.015'/%3E%3C/svg%3E")
                        `,
                        backgroundSize: '100% 32px, 120px 120px',
                      }
                }
                className={`flex-1 border-t-2 border-b-2 border-x-0 rounded-none p-6 shadow-none flex flex-col relative overflow-hidden ${
                  !document.documentElement.classList.contains('dark') ? 'border-black' : 'border-white/60'
                }`}
              >
                {/* Red margin line to simulate notebook paper */}
                <div className={`absolute top-0 bottom-0 left-[24px] w-[1px] ${!document.documentElement.classList.contains('dark') ? 'bg-[#e86c6c]/60' : 'bg-red-500/50'}`} />

                <textarea 
                  autoFocus={isEditable}
                  value={localJournal}
                  onChange={(e) => setLocalJournal(e.target.value)}
                  readOnly={!isEditable}
                  placeholder={isEditable ? t('journey.textareaPlaceholder') : t('journey.noNotesForToday')}
                  className={`flex-1 bg-transparent bg-journal-transparent text-[15px] font-semibold font-['Outfit'] focus:outline-none resize-none leading-[32px] pt-[8px] pl-8 z-10 selection:bg-[#86efac] selection:text-black dark:selection:bg-[#00FF85] dark:selection:text-black ${
                    !document.documentElement.classList.contains('dark') 
                      ? 'text-black/85 placeholder:text-black/25' 
                      : 'text-[#E3DAC9]/95 placeholder:text-[#E3DAC9]/20'
                  }`}
                  style={{ backgroundColor: 'transparent' }}
                />
              </div>

              {/* Bottom Info & Action Bar */}
              <div className="pt-2 pb-6 flex flex-col items-center gap-2.5">
                <span className={`text-[11px] font-black font-['Outfit'] tracking-wider uppercase ${!document.documentElement.classList.contains('dark') ? 'text-black/35' : 'text-[#E3DAC9]/30'}`}>
                  {localJournal.length} {t('journey.characters')}
                </span>
                {isEditable && (
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    id="journey-save-btn"
                    onClick={handleJournalSave}
                    className={`w-full py-4 rounded-[12px] font-black font-['Outfit'] uppercase tracking-wider text-[13px] border-[1.5px] transition-all text-center ${
                      !document.documentElement.classList.contains('dark')
                        ? 'border-black bg-black text-white shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:opacity-90'
                        : 'border-transparent bg-white text-black shadow-none hover:opacity-90'
                    }`}
                  >
                    {t('journey.saveJournal')}
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
  const { t } = useTranslation();
  const todayRef = useRef<HTMLDivElement>(null);
  const { fetchEntries } = useJourneyStore();

  useEffect(() => {
    fetchEntries();
  }, []);


  const { settings, profile } = useUserStore();
  const programDuration = settings.programDuration || 90;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toDateString();

  const signupDate = profile?.created_at ? new Date(profile.created_at) : new Date();
  signupDate.setHours(0, 0, 0, 0);

  let startDate = signupDate;
  const diffTime = today.getTime() - signupDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= programDuration) {
    const cycle = Math.floor(diffDays / programDuration);
    startDate = new Date(signupDate.getTime() + cycle * programDuration * 24 * 60 * 60 * 1000);
  }

  const journeyDays = Array.from({ length: programDuration }, (_, i) => {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
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
    <div className="px-6 pt-8 pb-32 font-['Outfit']">
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

      </div>
    </div>
  );
};
