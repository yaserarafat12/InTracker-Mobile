import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

const CUBIC_BEZIER = "easeOut" as const;

const GREEN_OPTIONS = [
  { name: 'Neon Green', hex: '#00FF85', desc: 'Original bright neon green. Very high energy.' },
  { name: 'Soft Mint', hex: '#7BE495', desc: 'Recommended by ChatGPT. Calming, clean, and premium.' },
  { name: 'Calm Mint', hex: '#73F29B', desc: 'Notion Calendar style. Even softer and highly readable.' },
  { name: 'Linear Mint', hex: '#6EE7B7', desc: 'Linear app style. Cool tone with a slight cyan hue.' },
  { name: 'Deep Emerald', hex: '#57C96D', desc: 'Classic dark emerald green. Great for solid contrast.' },
  { name: 'Vibrant Mint', hex: '#00FF9D', desc: 'Rin\'s favorite. Minty tone but keeps the energetic game-like pop.' }
];

export default function Lab() {
  const navigate = useNavigate();
  const [selectedGreen, setSelectedGreen] = useState('#7BE495');
  const [glowIntensity, setGlowIntensity] = useState('10%'); // '0%', '10%', '30%', '50%'
  const [isFocused, setIsFocused] = useState(false);
  const [name, setName] = useState('Boss');

  const getGlowOpacityHex = () => {
    switch (glowIntensity) {
      case '0%': return '00';
      case '10%': return '1A';
      case '30%': return '4D';
      case '50%': return '80';
      default: return '1A';
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#E3DAC9] font-['Inter'] px-6 py-12 relative flex flex-col items-center overflow-y-auto selection:bg-[#00FF85] selection:text-black">
      
      {/* AMBIENT GLOW */}
      <div 
        className="absolute top-10 left-1/2 -translate-x-1/2 w-[350px] h-[350px] blur-[120px] rounded-full pointer-events-none transition-all duration-500"
        style={{ backgroundColor: `${selectedGreen}${getGlowOpacityHex()}` }}
      />

      {/* HEADER SECTION */}
      <div className="relative z-10 w-full max-w-[500px] text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: selectedGreen }} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 font-['Outfit']">Research & Testing Hub</span>
        </div>
        <h1 className="text-[32px] font-black font-['Outfit'] tracking-wide text-white leading-tight uppercase">
          🧪 RIN'S LAB
        </h1>
        <p className="text-white/40 text-[12px] mt-2 max-w-[400px] mx-auto leading-relaxed">
          Tempat kita eksperimen visual, ngetes skema warna, dan nyimpan alur riset biar gak hilang.
        </p>
      </div>

      <div className="relative z-10 w-full max-w-[500px] flex flex-col gap-6">
        
        {/* PANEL 1: COLOR SWAPPER */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-[14px] font-black font-['Outfit'] uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Icon icon="solar:palette-bold" className="text-white/60" />
            1. Pilihan Warna Hijau (Primary Accent)
          </h2>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            {GREEN_OPTIONS.map((opt) => {
              const isSelected = selectedGreen === opt.hex;
              return (
                <button
                  key={opt.hex}
                  onClick={() => setSelectedGreen(opt.hex)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    isSelected 
                    ? 'border-white bg-white/5 shadow-[4px_4px_0px_rgba(255,255,255,0.05)]' 
                    : 'border-white/5 hover:border-white/20 hover:bg-white/[0.02]'
                  }`}
                >
                  <div 
                    className="w-5 h-5 rounded-full border border-black/40 mt-0.5 shrink-0"
                    style={{ backgroundColor: opt.hex }}
                  />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-white font-['Outfit'] leading-none">
                      {opt.name}
                    </span>
                    <span className="text-[9px] text-white/30 font-mono mt-1">
                      {opt.hex}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-white/5 pt-4">
            <h3 className="text-[11px] font-black font-['Outfit'] uppercase tracking-wider text-white/40 mb-2">
              Deskripsi Warna Terpilih:
            </h3>
            <p className="text-[12px] text-white/60 leading-relaxed font-medium">
              {GREEN_OPTIONS.find(o => o.hex === selectedGreen)?.desc}
            </p>
          </div>
        </div>

        {/* PANEL 2: GLOW INTENSITY */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-[14px] font-black font-['Outfit'] uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Icon icon="solar:sun-fog-bold" className="text-white/60" />
            2. Intensitas Ambient Glow
          </h2>
          
          <div className="flex items-center justify-between gap-2 bg-[#1A1A1A] p-2.5 rounded-xl border border-white/5">
            {['0%', '10%', '30%', '50%'].map((lvl) => {
              const isSelected = glowIntensity === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setGlowIntensity(lvl)}
                  style={{ color: isSelected ? '#000000' : undefined, backgroundColor: isSelected ? selectedGreen : undefined }}
                  className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-black font-['Outfit'] uppercase tracking-widest text-center transition-all ${
                    isSelected ? '' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* PANEL 3: REAL-TIME PREVIEW CARD */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-[14px] font-black font-['Outfit'] uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Icon icon="solar:monitor-play-bold" className="text-white/60" />
            3. Simulasi Tampilan UI
          </h2>

          <div className="border border-white/10 rounded-xl p-5 bg-[#000000] relative flex flex-col gap-5 overflow-hidden">
            
            {/* Ambient inner preview glow */}
            <div 
              className="absolute -top-10 -right-10 w-[150px] h-[150px] blur-[40px] rounded-full pointer-events-none transition-all duration-500"
              style={{ backgroundColor: `${selectedGreen}${getGlowOpacityHex()}` }}
            />

            {/* Input Preview */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black font-['Outfit'] tracking-[0.15em] uppercase text-white/40">
                Nama Panggilan
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                style={{ borderColor: isFocused ? selectedGreen : 'rgba(227, 218, 201, 0.2)' }}
                className="w-full bg-[#1A1A1A] border-[1.5px] rounded-lg py-3 px-4 text-[14px] outline-none transition-all placeholder:text-white/20 font-bold font-['Outfit']"
              />
            </div>

            {/* Button Preview */}
            <button
              style={{ 
                backgroundColor: selectedGreen,
                borderColor: '#000000'
              }}
              className="w-full py-3.5 rounded-xl font-extrabold text-[12px] uppercase tracking-[0.2em] text-black border shadow-[4px_4px_0px_rgba(0,0,0,1)] active:scale-[0.97] active:shadow-none transition-all"
            >
              Lanjutkan (Active State)
            </button>

            {/* In-app Card Preview */}
            <div className="border border-white/10 rounded-xl p-4 bg-[#161616] flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[13px] font-black text-white font-['Outfit'] uppercase tracking-wider">Hidrasi Harian</span>
                <span className="text-[10px] text-white/40 mt-1 font-medium">8 Gelas Air</span>
              </div>
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer"
                style={{ backgroundColor: selectedGreen }}
              >
                <Icon icon="solar:check-read-bold" width={16} className="text-black" />
              </div>
            </div>

          </div>
        </div>

        {/* PANEL 4: NAVIGATION QUICK LINKS */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-2xl mb-12">
          <h2 className="text-[14px] font-black font-['Outfit'] uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Icon icon="solar:map-arrow-square-bold" className="text-white/60" />
            4. Navigasi Halaman Utama
          </h2>
          
          <div className="grid grid-cols-2 gap-2">
            {[
              { path: '/login', name: 'Login Screen' },
              { path: '/name', name: 'Name Onboarding' },
              { path: '/notif', name: 'Notif Screen' },
              { path: '/location', name: 'Location Screen' },
              { path: '/habits', name: 'Habits Board' },
            ].map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className="py-2.5 px-4 rounded-xl bg-[#1A1A1A] border border-white/5 text-[11px] font-bold text-white/60 hover:text-[#00FF85] hover:border-[#00FF85]/20 active:scale-95 transition-all text-center uppercase tracking-wider"
              >
                {link.name}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
