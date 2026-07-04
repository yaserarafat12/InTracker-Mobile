import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const CUBIC_BEZIER = "easeOut" as const;

const GREEN_OPTIONS = [
  { name: 'Neon Green', hex: '#00FF85', desc: 'Warna lama (sangat mencolok)' },
  { name: 'Soft Mint', hex: '#7BE495', desc: 'Rekomendasi ChatGPT (Premium & Calming)' },
  { name: 'Calm Mint', hex: '#73F29B', desc: 'Lebih adem, ala Notion Calendar' },
  { name: 'Linear Mint', hex: '#6EE7B7', desc: 'Rada kebiruan, ala Linear' },
  { name: 'Deep Emerald', hex: '#57C96D', desc: 'Hijau solid, kontras tinggi' },
  { name: 'Vibrant Mint', hex: '#00FF9D', desc: 'Mint tapi tetep pop & terang' }
];

export default function Name() {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedGreen] = useState('#7BE495'); // Keep Soft Mint as default
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!name) return;
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Save nickname and full_name in one go
        await supabase.from('profiles').update({
          full_name: name,
          nickname: name,
          updated_at: new Date().toISOString()
        }).eq('id', user.id);
      }
      navigate('/questions/0');
    } catch (error) {
      console.error("Error saving name:", error);
      navigate('/questions/0');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#000000] text-white font-['Inter'] relative flex flex-col items-center justify-center overflow-hidden select-none">
      
      {/* GLOW DECORATION */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] h-[300px] blur-[100px] rounded-full pointer-events-none transition-colors duration-500" 
        style={{ backgroundColor: `${selectedGreen}1A` }} // 10% opacity glow
      />

      {/* CONTENT SECTION (CENTERED) */}
      <div className="relative z-10 w-full max-w-[420px] px-8 flex flex-col items-center text-center">
        
        {/* HEADING SECTION */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: CUBIC_BEZIER }}
          className="mb-8"
        >
          <h1 className="text-[22px] font-normal font-['Outfit'] tracking-wide leading-tight text-white/90">
            Apa nama panggilanmu?
          </h1>
        </motion.div>

        {/* INPUT SECTION */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: CUBIC_BEZIER }}
          className="w-full flex flex-col"
        >
          <input
            autoFocus
            type="text"
            placeholder="Ketikkan nama panggilanmu..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{ borderColor: isFocused ? selectedGreen : 'rgba(227, 218, 201, 0.2)' }}
            className="w-full bg-[#1A1A1A] border-[2px] rounded-xl py-4 px-6 text-[18px] outline-none transition-all text-center placeholder:text-white/20 font-bold font-['Outfit'] tracking-wide shadow-xl"
          />

          <div className="h-6" />

          {/* CONTINUE BUTTON (BELOW INPUT) */}
          <button
            onClick={handleContinue}
            disabled={!name || isSaving}
            style={{ 
              backgroundColor: name && !isSaving ? selectedGreen : 'rgba(255, 255, 255, 0.05)',
              color: name && !isSaving ? '#000000' : 'rgba(255, 255, 255, 0.2)',
              borderColor: name && !isSaving ? '#000000' : 'rgba(255, 255, 255, 0.1)'
            }}
            className={`w-full py-4 rounded-xl font-black text-[15px] tracking-wide transition-all duration-300 border ${
              name && !isSaving
              ? "shadow-[4px_4px_0px_rgba(0,0,0,1)] active:scale-[0.97] active:shadow-none cursor-pointer" 
              : "cursor-not-allowed"
            }`}
          >
            {isSaving ? "Menyimpan..." : "Lanjutkan"}
          </button>
        </motion.div>
      </div>

    </div>
  );
}
