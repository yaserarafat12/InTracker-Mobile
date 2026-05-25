import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

const CUBIC_BEZIER = "easeOut" as const;

// --- COMPONENT: SLIM CINEMATIC BUTTON ---
const CinematicButton = ({ onClick, children, className = "" }: { onClick: () => void, children: React.ReactNode, className?: string }) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98, x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
      className={`group relative overflow-hidden rounded-xl bg-[#00FF85] py-3 px-8 border-[2px] border-black shadow-[5px_5px_0px_rgba(0,0,0,1)] transition-all ${className}`}
    >
      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
      <span className="relative z-10 font-['Outfit'] text-[15px] font-black tracking-[0.15em] uppercase text-[#050A07]">
        {children}
      </span>
    </motion.button>
  );
};

// --- COMPONENT: INDUSTRIAL TOGGLE ---
const IndustrialToggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => {
  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }} 
      className="relative w-14 h-7 rounded-full transition-colors duration-300 overflow-hidden" 
      style={{ 
        backgroundColor: active ? 'rgba(0, 255, 133, 0.1)' : 'rgba(255, 255, 255, 0.05)', 
        border: active ? '1.5px solid #00FF85' : '1.5px solid rgba(255, 255, 255, 0.1)' 
      }}
    >
      <motion.div
        animate={{ x: active ? 32 : 6 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full ${active ? 'bg-[#00FF85]' : 'bg-white/40'}`}
      />
    </button>
  );
};

// --- COMPONENT: NOTIFICATION CARD (2 LINES - SLIM) ---
const NotificationCard = ({ item, active, onToggle, variants }: any) => {
  return (
    <motion.div 
      variants={variants}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="relative rounded-xl group"
      onClick={onToggle}
    >
      <div 
        className={`
          relative flex items-center justify-between gap-4 py-5 px-6 rounded-xl 
          bg-[#1A1A1A] border transition-all duration-300 ease-out shadow-[5px_5px_0px_rgba(0,0,0,1)]
          ${active 
            ? 'border-[#00FF85]/60' 
            : 'border-[#E3DAC9]/20 shadow-[5px_5px_0px_rgba(0,0,0,1)]'
          }
          group-hover:border-[#00FF85]/40
          cursor-pointer
        `}
      >
        <div className="flex flex-col text-left">
          <h4 className="text-[13px] font-bold uppercase tracking-wider text-white">
            {item.title}
          </h4>
          <p className="text-[11px] text-[#A0A0A0] leading-tight mt-1">
            {item.desc}
          </p>
        </div>
        <IndustrialToggle 
          active={active} 
          onToggle={onToggle} 
        />
      </div>
    </motion.div>
  );
};

export default function Notif() {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState({ track: true, routine: true, weekly: true });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease: CUBIC_BEZIER } }
  };

  return (
    <div className="h-[100dvh] bg-[#212121] text-white font-['Inter'] relative flex flex-col items-center overflow-hidden select-none">
      
      <div className="relative z-10 w-full max-w-[420px] px-6 flex flex-col flex-1 pt-24">
        
        {/* HEADING SECTION (FIXED HEIGHT) */}
        <div className="min-h-[160px] flex flex-col items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: CUBIC_BEZIER }}
            className="flex flex-col items-center text-center gap-4"
          >
            <div className="w-14 h-14 bg-[#00FF85]/10 rounded-full flex items-center justify-center border border-[#00FF85]/20 relative">
              <Icon icon="solar:bell-bing-bold" className="text-[#00FF85]" width={24} height={24} />
            </div>
            <h1 className="font-['Outfit'] text-[20px] font-bold leading-tight tracking-normal px-4 text-center">
              Nyalakan pengingat untuk tetap konsisten
            </h1>
          </motion.div>
        </div>

        {/* MIDDLE SECTION (CONTENT AREA) */}
        <div className="flex-1 pb-32">
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className="w-full flex flex-col gap-3"
          >
            {[
              { id: 'track', title: 'Target Harian', desc: 'Ingatkan target harian agar streak tetap terjaga.' },
              { id: 'routine', title: 'Rutinitas Harian', desc: 'Dapatkan pengingat untuk semua rutinitasmu.' },
              { id: 'weekly', title: 'Laporan Mingguan', desc: 'Pantau progres pencahaianmu setiap pekan.' }
            ].map((item) => (
              <NotificationCard 
                key={item.id}
                item={item}
                active={notifs[item.id as keyof typeof notifs]}
                onToggle={() => setNotifs(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof notifs] }))}
                variants={itemVariants}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* BOTTOM ACTION SECTION (MENTOK) */}
      <div className="absolute bottom-0 left-0 w-full px-6 pb-6 bg-gradient-to-t from-[#212121] via-[#212121]/95 to-transparent pt-16 z-20 flex justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          <CinematicButton onClick={() => navigate('/location')} className="w-full">
            Lanjutkan
          </CinematicButton>
        </motion.div>
      </div>

    </div>
  );
}

