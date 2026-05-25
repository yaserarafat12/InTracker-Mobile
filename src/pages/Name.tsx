import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CUBIC_BEZIER = "easeOut" as const;

export default function Name() {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!name) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          full_name: name,
          updated_at: new Date().toISOString()
        }).eq('id', user.id);
      }
      navigate('/nickname');
    } catch (error) {
      console.error("Error saving name:", error);
      navigate('/nickname');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#212121] text-white font-['Inter'] relative flex flex-col items-center overflow-hidden select-none">
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          src="/all_images/antigravitybg/2.jpg" 
          className="w-full h-full object-cover object-top -translate-y-[5vh]" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#212121]/20 to-[#212121] to-80%" />
      </div>

      {/* CONTENT SECTION (PUSHED DOWN) */}
      <div className="relative z-10 flex-1 w-full max-w-[420px] px-6 flex flex-col justify-end pb-32">
        
        {/* HEADING SECTION (BELOW WINDOW) */}
        <div className="mb-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: CUBIC_BEZIER }}
          >
            <h1 className="text-[24px] font-bold font-['Outfit'] text-center tracking-normal leading-tight">
              Siapa namamu?
            </h1>
          </motion.div>
        </div>

        {/* INPUT SECTION (ABOVE BUTTON) */}
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: CUBIC_BEZIER }}
            className="px-4"
          >
            <input
              autoFocus
              type="text"
              placeholder="Ketikkan namamu..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-[18px] outline-none focus:border-[#00FF85]/40 focus:bg-white/10 backdrop-blur-xl transition-all text-center placeholder:text-white/20 font-medium shadow-2xl"
            />
          </motion.div>
        </div>
      </div>

      {/* BOTTOM ACTION SECTION (MENTOK) */}
      <div className="absolute bottom-0 left-0 w-full px-6 pb-8 bg-gradient-to-t from-[#212121] via-[#212121]/95 to-transparent pt-16 z-20 flex justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          <button
            onClick={handleContinue}
            disabled={!name || isSaving}
            className={`w-full py-4 rounded-xl font-extrabold text-[14px] uppercase tracking-[0.2em] transition-all duration-300 ${
              name && !isSaving
              ? "bg-[#00FF85] text-[#050A07] shadow-[0_0_25px_rgba(0,255,133,0.2)] active:scale-95" 
              : "bg-white/5 text-white/10 cursor-not-allowed"
            }`}
          >
            {isSaving ? "Menyimpan..." : "Lanjutkan"}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
