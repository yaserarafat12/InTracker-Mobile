import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useHabitStore } from '../../store/useHabitStore';
import { useUserStore } from '../../store/useUserStore';
import { useProgressionStore } from '../../store/useProgressionStore';
import { supabase } from '../../lib/supabase';
import { HABIT_ICONS, HABIT_COLORS } from '../habits/icons/index';

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
  const [caption, setCaption] = useState('');
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [showHabitPicker, setShowHabitPicker] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Only habits with streak >= 1 can be shared
  const eligibleHabits = habits.filter(h => (h.streak || 0) >= 1);
  const selectedHabitData = habits.find(h => h.id === selectedHabit);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handlePost = async () => {
    if (!profile) return;
    if (!selectedHabit && !mediaFile && !caption.trim()) return; // At least one content needed
    setIsPosting(true);

    try {
      const habit = selectedHabit ? habits.find(h => h.id === selectedHabit) : null;
      const content = habit 
        ? `Melakukan ${habit.name} selama ${habit.streak} hari berturut-turut`
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
  };

  const resetState = () => {
    setCaption('');
    setSelectedHabit(null);
    setMediaFile(null);
    setMediaPreview(null);
    setShowHabitPicker(false);
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
            onClick={() => { onClose(); resetState(); }}
            className="absolute inset-0 bg-black/90"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-[#212121] rounded-t-[40px] border-t-[1.5px] border-[#E3DAC9]/20 p-6 pb-12 flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar"
          >
            <div className="w-12 h-1.5 bg-[#00FF85]/30 rounded-full mx-auto mb-6 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[20px] font-black font-['Outfit'] text-[#E3DAC9] uppercase tracking-[0.1em]">
                Bagikan Progress
              </h3>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { onClose(); resetState(); }}
                className="w-10 h-10 rounded-xl bg-[#2a2a2a] border-[1.5px] border-[#E3DAC9]/20 flex items-center justify-center"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="#E3DAC9" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            </div>

            {/* Media Area */}
            <div className="w-full aspect-[9/7] bg-[#1a1a1a] border-[1.5px] border-[#E3DAC9]/20 rounded-[24px] mb-6 flex items-center justify-center overflow-hidden relative">
              {mediaPreview ? (
                <img src={mediaPreview} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="flex items-center justify-center gap-0 w-full h-full">
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 h-full flex flex-col items-center justify-center gap-3 border-r border-[#E3DAC9]/10"
                  >
                    <Icon icon="solar:gallery-add-bold" className="text-[#00FF85]" width={28} />
                    <span className="text-[10px] font-bold font-['Outfit'] text-[#E3DAC9]/60 uppercase tracking-wider">Dari Galeri</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 h-full flex flex-col items-center justify-center gap-3"
                  >
                    <Icon icon="solar:camera-bold" className="text-[#00FF85]" width={28} />
                    <span className="text-[10px] font-bold font-['Outfit'] text-[#E3DAC9]/60 uppercase tracking-wider">Ambil Foto</span>
                  </motion.button>
                </div>
              )}
            </div>

            {/* Habit Picker Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowHabitPicker(!showHabitPicker)}
              className="w-full p-4 bg-[#2a2a2a] border-[2px] border-black rounded-[16px] mb-4 flex items-center justify-between shadow-[4px_4px_0px_rgba(0,0,0,1)]"
            >
              <span className="text-[12px] font-bold font-['Outfit'] text-[#E3DAC9]">
                {selectedHabitData 
                  ? <span>{selectedHabitData.name} • {selectedHabitData.streak} hari</span>
                  : 'Pilih tugas yang sedang kamu kerjakan untuk dibagikan'
                }
              </span>
              <Icon icon="solar:alt-arrow-down-bold" className="text-[#E3DAC9]/50" width={16} />
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
                    <div className="space-y-2 p-3 bg-[#212121] border-[1.5px] border-[#E3DAC9]/10 rounded-[16px]">
                      {eligibleHabits.map(h => (
                        <motion.button
                          key={h.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => { setSelectedHabit(h.id); setShowHabitPicker(false); if (navigator.vibrate) navigator.vibrate(5); }}
                          className={`w-full p-3 rounded-[12px] flex items-center justify-between transition-colors ${
                            selectedHabit === h.id ? 'bg-[#00FF85]/10 border border-[#00FF85]/30' : 'bg-[#1a1a1a] border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon icon={HABIT_ICONS[h.iconName || ''] || 'ph:circle-bold'} style={{ color: HABIT_COLORS[h.iconName || ''] || '#00FF85' }} width={16} />
                            <span className="text-[12px] font-black font-['Outfit'] text-[#E3DAC9]">{h.name}</span>
                          </div>
                          <span className="text-[10px] font-black font-['Outfit'] text-[#00FF85]">{h.streak} hari</span>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-[#212121] border-[1.5px] border-[#E3DAC9]/10 rounded-[16px] text-center">
                      <p className="text-[11px] font-bold font-['Outfit'] text-[#E3DAC9]/40">
                        Belum ada habit dengan streak aktif.
                      </p>
                      <p className="text-[10px] font-medium font-['Outfit'] text-[#E3DAC9]/25 mt-1">
                        Selesaikan habit hari ini untuk bisa membagikan progress!
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Caption Input */}
            <div className="w-full p-4 bg-[#1a1a1a] border-[1.5px] border-[#E3DAC9]/20 rounded-[16px] mb-8">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Tambahkan caption (opsional)"
                className="w-full bg-transparent border-none outline-none text-[14px] font-medium font-['Outfit'] text-[#E3DAC9] placeholder:text-[#E3DAC9]/30"
              />
            </div>

            {/* Share Button */}
            <motion.button
              whileTap={selectedHabit ? { x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" } : {}}
              onClick={handlePost}
              disabled={!selectedHabit || isPosting}
              className={`w-full py-4 rounded-[16px] font-black font-['Outfit'] uppercase tracking-wider text-[13px] border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 bg-[#00FF85] text-black`}
            >
              {isPosting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Icon icon="solar:refresh-bold" width={18} />
                </motion.div>
              ) : (
                'Bagikan'
              )}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
