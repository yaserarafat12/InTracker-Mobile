import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { supabase } from '../lib/supabase';

const CUBIC_BEZIER = "easeOut" as const;

// --- COMPONENT: CINEMATIC BUTTON ---
const CinematicButton = ({ onClick, children, className = "" }: { onClick: () => void, children: React.ReactNode, className?: string }) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`group relative overflow-hidden rounded-lg bg-[#10B981] py-2.5 px-8 shadow-[0_0_20px_rgba(16,185,129,0.2)] ${className}`}
    >
      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
      <span className="relative z-10 font-['Outfit'] text-[14px] font-extrabold tracking-[0.2em] uppercase text-[#050A07]">
        {children}
      </span>
    </motion.button>
  );
};

export default function Location() {
  const navigate = useNavigate();

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
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      navigate('/dashboard');
    }
  };

  return (
    <div className="h-[100dvh] bg-[#1A1A1A] text-white font-['Inter'] relative flex flex-col items-center overflow-hidden select-none">
      
      {/* Background Pulse */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-[#10B981]/20 rounded-full animate-ping" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-[#10B981]/10 rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-6 flex flex-col flex-1 pt-24">
        
        {/* HEADING SECTION (FIXED HEIGHT) */}
        <div className="min-h-[180px] flex flex-col items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: CUBIC_BEZIER }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-16 h-16 bg-[#10B981]/10 rounded-full flex items-center justify-center border border-[#10B981]/20 relative">
              <Icon icon="solar:map-point-bold" className="text-[#10B981]" width={28} height={28} />
              <motion.div 
                animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }} 
                transition={{ duration: 3, repeat: Infinity }} 
                className="absolute inset-0 bg-[#10B981]/20 rounded-full blur-xl" 
              />
            </div>
            <h1 className="font-['Outfit'] text-[20px] font-bold leading-tight tracking-tight px-4 text-center">
              Aktifkan Akses Lokasi untuk Verifikasi
            </h1>
          </motion.div>
        </div>

        {/* MIDDLE SECTION (CONTENT AREA) */}
        <div className="flex-1 pt-4 pb-32">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: CUBIC_BEZIER }}
            className="text-center"
          >
            <p className="text-[#A0A0A0] text-[14px] leading-relaxed px-6">
              Berikan izin lokasi untuk optimasi pelacakan target secara real-time dan keamanan akunmu.
            </p>
          </motion.div>
        </div>
      </div>

      {/* BOTTOM ACTION SECTION (MENTOK) */}
      <div className="absolute bottom-0 left-0 w-full px-6 pb-6 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/95 to-transparent pt-16 flex flex-col items-center z-20">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full max-w-[420px] flex flex-col items-center gap-6"
        >
          <CinematicButton onClick={handleAllowLocation} className="w-full">
            Izinkan Akses
          </CinematicButton>
          
          <button 
            onClick={handleAllowLocation}
            className="text-white/40 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#10B981] transition-colors"
          >
            Lewati Sementara
          </button>
        </motion.div>
      </div>

    </div>
  );
}

