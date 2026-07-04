import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';

const CUBIC_BEZIER = "easeOut" as const;

// --- COMPONENT: CINEMATIC BUTTON ---
const CinematicButton = ({ onClick, children, className = "" }: { onClick: () => void, children: React.ReactNode, className?: string }) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98, x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
      className={`group relative overflow-hidden rounded-xl bg-[#00FF85] py-3 px-8 border-[2px] border-black shadow-[5px_5px_0px_rgba(0,0,0,1)] transition-all ${className}`}
    >
      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
      <span className="relative z-10 font-['Outfit'] text-[15px] font-black tracking-wide text-[#050A07]">
        {children}
      </span>
    </motion.button>
  );
};

// --- COMPONENT: CLEAN MINIMAL CITY MAP PREVIEW ---
const LocationMap = () => {
  const { settings } = useUserStore();
  const isLight = settings.theme === 'Light';

  return (
    <div className={`relative w-full h-[200px] border-[3px] rounded-2xl overflow-hidden transition-all duration-300 ${
      isLight 
        ? 'bg-white border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] text-black' 
        : 'bg-[#121212] border-white/[0.08] shadow-[5px_5px_0px_rgba(0,0,0,1)]'
    }`}>
      {/* City blocks / water body background shape */}
      <svg className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isLight ? 'opacity-[0.25]' : 'opacity-[0.15]'}`} viewBox="0 0 340 200" fill="none">
        {/* River/Water body */}
        <path d="M-10,40 Q60,60 120,40 T260,80 T360,50 L360,210 L-10,210 Z" fill="#00FF85" opacity="0.15" />
        {/* Park area */}
        <rect x="40" y="80" width="80" height="50" rx="6" fill="#00FF85" opacity="0.1" />
        <rect x="220" y="20" width="90" height="40" rx="6" fill="#00FF85" opacity="0.1" />
      </svg>

      {/* City Street Roads (intersecting lines) */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 340 200" fill="none">
        {/* Major highway */}
        <path d="M-20,110 L360,110" stroke={isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"} strokeWidth="6" strokeLinecap="round" />
        {/* Secondary roads */}
        <path d="M60,-10 L60,210" stroke={isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"} strokeWidth="4" />
        <path d="M280,-10 L280,210" stroke={isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"} strokeWidth="4" />
        <path d="M-10,50 L350,50" stroke={isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"} strokeWidth="3" />
        <path d="M-10,160 L350,160" stroke={isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"} strokeWidth="3" />
        
        {/* Minor streets */}
        <path d="M130,50 L130,160" stroke={isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)"} strokeWidth="2" />
        <path d="M200,50 L200,110" stroke={isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)"} strokeWidth="2" />
        <path d="M130,80 L280,80" stroke={isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)"} strokeWidth="2" />
        <path d="M60,135 L130,135" stroke={isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)"} strokeWidth="2" />
      </svg>

      {/* Main Pulse / Pin Indicator at center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        {/* Ripple rings — slow and subtle */}
        <motion.div 
          animate={{ scale: [1, 2.0, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut" }}
          className="absolute w-12 h-12 border border-[#00FF85] rounded-full"
        />
        <motion.div 
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 3.0, repeat: Infinity, ease: "easeOut" }}
          className="absolute w-8 h-8 border border-[#00FF85] rounded-full"
        />
        
        {/* Map Marker Pin */}
        <div className="relative flex flex-col items-center">
          <div className="w-8 h-8 bg-[#00FF85] rounded-full flex items-center justify-center border-2 border-black z-10" style={isLight ? {} : { boxShadow: '0 0 15px rgba(0,255,133,0.6)' }}>
            <Icon icon="solar:map-point-bold" className="text-black" width={16} />
          </div>
          {/* Pin shadow anchor dot — slow pulse */}
          <motion.div 
            animate={{ scale: [1, 1.6, 1], opacity: [0.8, 0.2, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className={`w-1.5 h-1.5 bg-[#00FF85] rounded-full mt-[-2px] blur-[1px] z-0 ${isLight ? '' : 'shadow-[0_0_4px_rgba(0,255,133,1)]'}`} 
          />
        </div>
      </div>
    </div>
  );
};

export default function Location() {
  const navigate = useNavigate();
  const { settings } = useUserStore();
  const language = settings.language || 'English';
  const isIndo = language === 'Bahasa Indonesia';

  const handleAllowLocation = async () => {
    try {
      let locationData = { lat: null, lng: null, status: 'skipped' };
      
      // Coba ambil lokasi GPS beneran
      if ("geolocation" in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          locationData = { 
            lat: position.coords.latitude as any, 
            lng: position.coords.longitude as any,
            status: 'allowed'
          };
        } catch (geoErr) {
          console.warn("Location access denied or timeout");
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({
          location: locationData,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        }).eq('id', user.id);
      }
      navigate('/beranda');
    } catch (err) {
      console.error(err);
      navigate('/beranda');
    }
  };

  const isLight = settings.theme === 'Light';

  return (
    <div className={`h-[100dvh] font-['Inter'] relative flex flex-col items-center overflow-hidden select-none transition-colors duration-300 ${
      isLight ? 'bg-[#F2F2F7] text-black' : 'bg-black text-white'
    }`}>
      
      {/* Background glow decorators — subtle and premium */}
      <div className={`absolute top-[-10%] left-[-20%] w-[60%] h-[60%] rounded-full pointer-events-none z-0 ${
        isLight ? 'bg-[#00FF85]/03 blur-[80px]' : 'bg-[#00FF85]/08 blur-[120px]'
      }`} />
      <div className={`absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full pointer-events-none z-0 ${
        isLight ? 'bg-[#00FF85]/03 blur-[80px]' : 'bg-[#00FF85]/08 blur-[120px]'
      }`} />

      <div className="relative z-10 w-full max-w-[420px] px-6 flex flex-col flex-1 pt-24">
        
        {/* HEADING SECTION (FIXED HEIGHT) */}
        <div className="min-h-[160px] flex flex-col items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: CUBIC_BEZIER }}
            className="flex flex-col items-center text-center gap-6"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center relative ${
              isLight ? 'bg-[#00FF85]/20 border border-black' : 'bg-[#00FF85]/10 border border-[#00FF85]/20'
            }`}>
              <Icon icon="solar:map-point-bold" className={isLight ? 'text-black' : 'text-[#00FF85]'} width={28} height={28} />
              <motion.div 
                animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }} 
                transition={{ duration: 3, repeat: Infinity }} 
                className="absolute inset-0 bg-[#00FF85]/20 rounded-full blur-xl" 
              />
            </div>
            <h1 className={`font-['Outfit'] text-[20px] font-bold leading-tight tracking-normal px-4 text-center ${
              isLight ? 'text-black font-extrabold' : 'text-white'
            }`}>
              {isIndo ? 'Aktifkan Akses Lokasi untuk Verifikasi' : 'Enable Location Access for Verification'}
            </h1>
          </motion.div>
        </div>

        {/* MIDDLE SECTION (CONTENT AREA) */}
        <div className="flex-1 flex flex-col gap-6 justify-center pb-24">
          <LocationMap />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: CUBIC_BEZIER }}
            className="text-center"
          >
            <p className={`text-[13px] leading-relaxed px-4 ${isLight ? 'text-black/60 font-semibold' : 'text-[#A0A0A0]'}`}>
              {isIndo 
                ? 'Berikan izin lokasi untuk optimasi pelacakan target secara real-time dan keamanan akunmu.' 
                : 'Grant location permissions to optimize target tracking in real-time and secure your account.'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* BOTTOM ACTION SECTION (MENTOK) */}
      <div className={`absolute bottom-0 left-0 w-full px-6 pb-8 pt-16 flex flex-col items-center z-20 ${
        isLight ? 'bg-gradient-to-t from-[#F2F2F7] via-[#F2F2F7]/95 to-transparent' : 'bg-gradient-to-t from-black via-black/95 to-transparent'
      }`}>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          <CinematicButton onClick={handleAllowLocation} className="w-full">
            {isIndo ? 'Izinkan Akses' : 'Allow Access'}
          </CinematicButton>
        </motion.div>
      </div>

    </div>
  );
}


