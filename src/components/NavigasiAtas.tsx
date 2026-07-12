import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { AmbientPlayer } from './AmbientPlayer';
import { useUserStore } from '../store/useUserStore';
import { useHabitStore } from '../store/useHabitStore';
import { useUIStore } from '../store/useUIStore';

import { Plus } from 'lucide-react';

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
    <div className={`relative w-full z-[100] px-4 flex justify-between items-center h-[64px] transition-colors duration-300 border-b ${
      isLight 
        ? 'bg-white border-neutral-200 text-black shadow-[0_2px_15px_rgba(0,0,0,0.05)]' 
        : 'bg-[#0d0f12] border-white/[0.08] text-white shadow-[0_4px_30px_rgba(0,0,0,0.3)]'
    }`}>
      {activeTab === 'habits' ? (
        <>
          <motion.div 
            id="streak-counter-widget"
            whileTap={{ scale: 0.95 }}
            className={`flex items-center justify-center gap-[6px] w-[75px] h-10 rounded-[10px] border-2 transition-all ${
              isLight 
                ? 'border-[#FF4D00]/50 bg-[#FFF0EB] text-[#FF4D00] shadow-[0_4px_12px_rgba(255,77,0,0.1)]' 
                : 'border-[#FF4D00]/30 bg-[#FF4D00]/12 text-[#FF7A45] shadow-[0_6px_16px_rgba(255,77,0,0.15)]'
            }`}
          >
            <Icon icon="solar:fire-bold" width={20} height={20} className={isLight ? 'text-[#FF4D00]' : 'text-[#FF7A45]'} />
            <span className={`text-[18px] font-black font-['Outfit'] tracking-normal leading-none ${isLight ? 'text-[#FF4D00]' : 'text-[#FF7A45]'}`}>{totalStreak || profile?.streak_count || 0}</span>
          </motion.div>
 
          <div id="focus-tools-row" className="flex items-center gap-3">
            <AmbientPlayer />
            <motion.button
              whileTap={{ scale: 0.95 }}
              id="settings-toggle-btn"
              onClick={toggleSettings}
              className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition-all border-2 ${
                isSettingsOpen 
                  ? 'bg-[#6ED7A0]/15 border-[#6ED7A0] shadow-[2px_2px_0px_rgba(110,215,160,0.3)] text-[#6ED7A0]' 
                  : isLight 
                    ? 'bg-neutral-50 border-black/15 text-black/60 shadow-[2px_2px_0px_rgba(0,0,0,0.06)]' 
                    : 'bg-[#1A1A1A]/40 border-white/10 text-white/60 shadow-[2px_2px_0px_rgba(255,255,255,0.05)]'
              }`}
            >
              <Icon icon="solar:settings-bold" width={20} className={isSettingsOpen ? 'text-[#6ED7A0]' : isLight ? 'text-black/60' : 'text-white/60'} />
            </motion.button>
          </div>
        </>
      ) : (
        <div className="flex justify-between items-center w-full h-full">
          {/* KIRI: Judul + Superscript Icon */}
          <div className="flex items-center h-full">
            <div className="flex items-center">
              <h2 className={`text-[26px] font-black font-['Outfit'] tracking-normal leading-none ${isLight ? 'text-black' : 'text-white'}`}>
                {activeTab === 'todo' && 'To-Do List'}
                {activeTab === 'analytics' && 'Analytics'}
                {activeTab === 'journey' && 'Journey'}
                {activeTab === 'global' && 'Global'}
                {activeTab === 'features' && 'Features'}
              </h2>
            </div>
          </div>
 
          <div className="flex items-center gap-3">
            {activeTab === 'global' && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(10);
                  window.dispatchEvent(new CustomEvent('open-friends-sheet'));
                }}
                className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition-all border-2 ${
                  isLight 
                    ? 'bg-neutral-50 border-black/15 text-black shadow-[2px_2px_0px_rgba(0,0,0,0.06)]' 
                    : 'bg-[#1A1A1A]/40 border-white/10 text-white/60 shadow-[2px_2px_0px_rgba(255,255,255,0.05)]'
                }`}
              >
                <Icon icon="ph:users-bold" width={20} className={isLight ? 'text-black' : 'text-white/60'} />
              </motion.button>
            )}
            <AmbientPlayer />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleSettings}
              className={`w-10 h-10 rounded-[10px] flex items-center justify-center transition-all border-2 ${
                isSettingsOpen 
                  ? 'bg-[#6ED7A0]/15 border-[#6ED7A0] shadow-[2px_2px_0px_rgba(110,215,160,0.3)] text-[#6ED7A0]' 
                  : isLight 
                    ? 'bg-neutral-50 border-black/15 text-black/60 shadow-[2px_2px_0px_rgba(0,0,0,0.06)]' 
                    : 'bg-[#1A1A1A]/40 border-white/10 text-white/60 shadow-[2px_2px_0px_rgba(255,255,255,0.05)]'
              }`}
            >
              <Icon icon="solar:settings-bold" width={20} className={isSettingsOpen ? 'text-[#6ED7A0]' : isLight ? 'text-black/60' : 'text-white/60'} />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};
