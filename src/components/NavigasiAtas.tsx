import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { AmbientPlayer } from './AmbientPlayer';
import { useUserStore } from '../store/useUserStore';
import { useHabitStore } from '../store/useHabitStore';
import { useUIStore } from '../store/useUIStore';

interface NavigasiAtasProps {
  activeTab: string;
}

export const NavigasiAtas = ({ activeTab }: NavigasiAtasProps) => {
  const { profile, settings } = useUserStore();
  const { totalStreak } = useHabitStore();
  const { isSettingsOpen, toggleSettings } = useUIStore();
  const navigate = useNavigate();

  const isLight = settings?.theme === 'Light';

  return (
    <div className={`relative w-full z-[100] px-6 flex justify-between items-center h-[80px] transition-colors duration-300 border-b ${
      isLight 
        ? 'bg-white border-neutral-200 text-black shadow-[0_2px_15px_rgba(0,0,0,0.05)]' 
        : 'bg-[#0d0f12] border-white/[0.08] text-white shadow-[0_4px_30px_rgba(0,0,0,0.3)]'
    }`}>
      {activeTab === 'habits' ? (
        <>
          <motion.div 
            id="streak-counter-widget"
            whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
            className="flex items-center justify-center gap-[6px] bg-[#FF4D00] w-[75px] h-11 rounded-xl border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Icon icon="solar:fire-bold" width={22} height={22} className="text-white" />
            <span className="text-[20px] font-black font-['Outfit'] text-white tracking-normal leading-none">{totalStreak || profile?.streak_count || 0}</span>
          </motion.div>
 
          <div id="focus-tools-row" className="flex items-center gap-3">
            <AmbientPlayer />
            <motion.button
              whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
              id="settings-toggle-btn"
              onClick={toggleSettings}
              className={`w-11 h-11 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center transition-all border-[1.5px] ${
                isSettingsOpen 
                  ? 'bg-[#6ED7A0] border-black' 
                  : isLight 
                    ? 'bg-white border-black text-black' 
                    : 'bg-[#1A1A1A] border-white/10 text-white'
              }`}
            >
              <Icon icon="solar:settings-bold" width={22} className={isSettingsOpen ? 'text-black' : isLight ? 'text-black' : 'text-[#8E8E8E]'} />
            </motion.button>
          </div>
        </>
      ) : (
        <div className="flex justify-between items-center w-full h-full">
          {/* KIRI: Judul + Superscript Icon */}
          <div className="flex items-center h-full">
            <div className="flex items-center">
              <h2 className={`text-[31px] font-black font-['Outfit'] tracking-normal leading-none ${isLight ? 'text-black' : 'text-white'}`}>
                {activeTab === 'todo' && 'To-Do List'}
                {activeTab === 'analytics' && 'Analytics'}
                {activeTab === 'journey' && 'Journey'}
                {activeTab === 'global' && 'Global'}
                {activeTab === 'features' && 'Features'}
              </h2>
            </div>
          </div>
 
          <div className="flex items-center gap-3">
            <AmbientPlayer />
            <motion.button
              whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
              onClick={toggleSettings}
              className={`w-11 h-11 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center transition-all border-[1.5px] ${
                isSettingsOpen 
                  ? 'bg-[#6ED7A0] border-black' 
                  : isLight 
                    ? 'bg-white border-black text-black' 
                    : 'bg-[#1A1A1A] border-white/10 text-white'
              }`}
            >
              <Icon icon="solar:settings-bold" width={22} className={isSettingsOpen ? 'text-black' : isLight ? 'text-black' : 'text-[#8E8E8E]'} />
            </motion.button>
          </div>
        </div>
      )}
 
    </div>
  );
};
