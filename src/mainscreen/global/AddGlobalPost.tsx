import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useHabitStore } from '../../store/useHabitStore';
import { useUserStore } from '../../store/useUserStore';
import { useProgressionStore } from '../../store/useProgressionStore';
import { supabase } from '../../lib/supabase';
import { HABIT_ICONS, HABIT_COLORS } from '../habits/icons/index';
import { useTranslation } from '../../i18n';

// Compress image using canvas
async function compressImage(file: File, maxWidth: number, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality);
    };
    img.src = URL.createObjectURL(file);
  });
}

interface AddGlobalPostProps {
  isOpen: boolean;
  onClose: () => void;
  onPosted: () => void;
}

export const AddGlobalPost = ({ isOpen, onClose, onPosted }: AddGlobalPostProps) => {
  const { habits } = useHabitStore();
  const { profile } = useUserStore();
  const { t } = useTranslation();
  const isLight = !document.documentElement.classList.contains('dark');
  const [caption, setCaption] = useState('');
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [showHabitPicker, setShowHabitPicker] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // All habits can be shared to ensure visibility and prevent disabled share states
  const eligibleHabits = habits;
  const selectedHabitData = habits.find(h => h.id === selectedHabit);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const resetState = useCallback(() => {
    setCaption('');
    setSelectedHabit(null);
    setMediaFile(null);
    setMediaPreview(null);
    setShowHabitPicker(false);
  }, []);

  const handlePost = useCallback(async () => {
    if (!profile) return;
    if (!selectedHabit && !mediaFile && !caption.trim()) return; // At least one content needed
    setIsPosting(true);

    try {
      const habit = selectedHabit ? habits.find(h => h.id === selectedHabit) : null;
      const localizedHabitName = habit ? (t(`presets.${habit.name}`) === `presets.${habit.name}` ? habit.name : t(`presets.${habit.name}`)) : '';
      const content = habit 
        ? t('feed.addPost.autoTextPattern').replace('{name}', localizedHabitName).replace('{streak}', String(habit.streak))
        : '';

      // Upload media if selected
      let imageUrl: string | undefined;
      if (mediaFile) {
        const compressed = await compressImage(mediaFile, 900, 0.7);
        const fileName = `${profile.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(fileName, compressed, { contentType: 'image/jpeg' });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('post-media')
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
        } else {
          console.error('Upload error:', uploadError);
        }
      }

      const { error } = await supabase.from('posts').insert([{
        user_id: profile.id,
        type: habit ? 'habit_completion' : 'text',
        content: caption.trim() || content,
        metadata: {
          habit_name: habit?.name,
          streak: habit?.streak,
          icon: habit?.iconName,
          auto_text: content || undefined,
          image_url: imageUrl,
        },
        reactions: { '❤️': 0, '🔥': 0, '👏': 0, '😱': 0, '💪': 0, '🫡': 0, '🥶': 0 }
      }]);

      if (!error) {
        if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
        useProgressionStore.getState().awardFeedInteraction();
        onPosted();
        onClose();
        resetState();
      }
    } catch (err) {
      console.error('Error posting:', err);
    } finally {
      setIsPosting(false);
    }
  }, [profile, selectedHabit, mediaFile, caption, habits, t, onPosted, onClose, resetState]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[99999]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { onClose(); resetState(); }}
            className="absolute inset-0 bg-black/90"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`absolute bottom-0 left-0 right-0 rounded-t-[40px] border-t-[1.5px] p-6 pb-12 flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar transition-colors duration-300 ${
              isLight ? 'bg-[#f8fafc] border-black/10' : 'bg-[#212121] border-[#E3DAC9]/20'
            }`}
          >
            <div className="w-12 h-1.5 bg-[#00FF85]/30 rounded-full mx-auto mb-6 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h3 className={`text-[20px] font-black font-['Outfit'] uppercase tracking-[0.1em] ${
                isLight ? 'text-black' : 'text-[#E3DAC9]'
              }`}>
                {t('feed.addPost.title')}
              </h3>
              <motion.button
                id="post-close-btn"
                whileTap={{ scale: 0.9 }}
                onClick={() => { onClose(); resetState(); }}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                  isLight
                    ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
                    : 'bg-[#2a2a2a] border-[#E3DAC9]/20 text-[#E3DAC9] shadow-none'
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke={isLight ? '#000000' : '#E3DAC9'} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            </div>
 
            {/* Media Area */}
            <div id="post-media-area" className={`w-full aspect-[9/7] rounded-[24px] mb-6 flex items-center justify-center overflow-hidden relative border transition-all ${
              isLight
                ? 'bg-white border-black/10 shadow-[3px_3px_0px_rgba(0,0,0,0.1)]'
                : 'bg-[#1a1a1a] border-[#E3DAC9]/20'
            }`}>
              {mediaPreview ? (
                <img src={mediaPreview} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="flex items-center justify-center gap-0 w-full h-full">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 h-full flex flex-col items-center justify-center gap-3 border-r ${
                      isLight ? 'border-black/5' : 'border-[#E3DAC9]/10'
                    }`}
                  >
                    <Icon icon="solar:gallery-add-bold" className="text-[#00FF85]" width={28} />
                    <span className={`text-[10px] font-bold font-['Outfit'] uppercase tracking-wider ${isLight ? 'text-black/60' : 'text-[#E3DAC9]/60'}`}>{t('feed.addPost.gallery')}</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 h-full flex flex-col items-center justify-center gap-3"
                  >
                    <Icon icon="solar:camera-bold" className="text-[#00FF85]" width={28} />
                    <span className={`text-[10px] font-bold font-['Outfit'] uppercase tracking-wider ${isLight ? 'text-black/60' : 'text-[#E3DAC9]/60'}`}>{t('feed.addPost.camera')}</span>
                  </motion.button>
                </div>
              )}
            </div>
            {/* Habit Picker Section */}
            <div id="post-habit-picker-container" className="w-full">
              {/* Habit Picker Button */}
              <motion.button
                id="post-habit-picker-btn"
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowHabitPicker(!showHabitPicker)}
                className={`w-full p-4 border-[2px] rounded-[16px] mb-4 flex items-center justify-between transition-all ${
                  isLight
                    ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
                    : 'bg-[#2a2c32] border-white/10 text-[#E3DAC9] shadow-none'
                }`}
              >
                <span className={`text-[12px] font-bold font-['Outfit'] ${isLight ? 'text-black' : 'text-[#E3DAC9]'}`}>
                  {selectedHabitData 
                    ? <span>{(t(`presets.${selectedHabitData.name}`) === `presets.${selectedHabitData.name}` ? selectedHabitData.name : t(`presets.${selectedHabitData.name}`))} • {selectedHabitData.streak} {t('feed.addPost.daysUnit')}</span>
                    : t('feed.addPost.placeholderHabit')
                  }
                </span>
                <Icon icon="solar:alt-arrow-down-bold" className={isLight ? 'text-black/40' : 'text-[#E3DAC9]/50'} width={16} />
              </motion.button>
   
              {/* Habit Picker Dropdown */}
              <AnimatePresence>
                {showHabitPicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    {eligibleHabits.length > 0 ? (
                      <div className={`space-y-2 p-3 border rounded-[16px] ${
                        isLight ? 'bg-white border-black/10' : 'bg-[#212121] border-[#E3DAC9]/10'
                      }`}>
                        {eligibleHabits.map(h => (
                          <motion.button
                            key={h.id}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { setSelectedHabit(h.id); setShowHabitPicker(false); if (navigator.vibrate) navigator.vibrate(5); }}
                            className={`post-habit-option-btn w-full p-3 rounded-[12px] flex items-center justify-between border transition-all ${
                              selectedHabit === h.id 
                                ? 'bg-[#00FF85]/10 border-[#00FF85]/30' 
                                : isLight 
                                  ? 'bg-white border-black/5 hover:bg-slate-50 text-black' 
                                  : 'bg-[#1a1a1a] border-transparent text-[#E3DAC9]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon icon={HABIT_ICONS[h.iconName || ''] || 'ph:circle-bold'} style={{ color: HABIT_COLORS[h.iconName || ''] || '#00FF85' }} width={16} />
                              <span className={`text-[12px] font-black font-['Outfit'] ${isLight ? 'text-black' : 'text-[#E3DAC9]'}`}>{(t(`presets.${h.name}`) === `presets.${h.name}` ? h.name : t(`presets.${h.name}`))}</span>
                            </div>
                            <span className="text-[10px] font-black font-['Outfit'] text-[#00FF85]">{h.streak} {t('feed.addPost.daysUnit')}</span>
                          </motion.button>
                        ))}
                      </div>
                    ) : (
                      <div className={`p-4 border rounded-[16px] text-center ${
                        isLight ? 'bg-white border-black/10' : 'bg-[#212121] border-[#E3DAC9]/10'
                      }`}>
                        <p className={`text-[11px] font-bold font-['Outfit'] ${isLight ? 'text-black/40' : 'text-[#E3DAC9]/40'}`}>
                          {t('feed.addPost.noStreakActive')}
                        </p>
                        <p className={`text-[10px] font-medium font-['Outfit'] mt-1 ${isLight ? 'text-black/25' : 'text-[#E3DAC9]/25'}`}>
                          {t('feed.addPost.solveHabitHint')}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
 
            {/* Caption Input */}
            <div id="post-caption-input" className={`w-full p-4 rounded-[16px] mb-8 border transition-all ${
              isLight 
                ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' 
                : 'bg-[#1a1a1a] border-white/10 text-white shadow-none'
            }`}>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={t('feed.addPost.captionPlaceholder')}
                className={`w-full bg-transparent border-none outline-none text-[14px] font-medium font-['Outfit'] ${
                  isLight ? 'text-black placeholder:text-black/30' : 'text-[#E3DAC9] placeholder:text-[#E3DAC9]/30'
                }`}
              />
            </div>
 
            {/* Share Button */}
            <motion.button
              id="post-share-btn"
              whileTap={selectedHabit ? { scale: 0.96 } : {}}
              onClick={handlePost}
              disabled={!selectedHabit || isPosting}
              className={`w-full h-[48px] rounded-xl font-black font-['Outfit'] uppercase tracking-wider text-[12px] border transition-all flex items-center justify-center gap-2 ${
                !selectedHabit 
                  ? isLight
                    ? 'bg-neutral-100 border-black/10 text-neutral-400 cursor-not-allowed shadow-none'
                    : 'bg-[#2a2c32] border-white/5 text-[#E3DAC9]/20 cursor-not-allowed shadow-none'
                  : isLight
                    ? 'bg-black border-black text-white shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:bg-black/90'
                    : 'bg-white border-transparent text-black shadow-none hover:bg-white/90'
              }`}
            >
              {isPosting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Icon icon="solar:refresh-bold" width={18} />
                </motion.div>
              ) : (
                t('feed.addPost.shareBtn')
              )}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
