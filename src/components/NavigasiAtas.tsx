import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { AmbientPlayer } from './AmbientPlayer';
import { useUserStore } from '../store/useUserStore';

interface NavigasiAtasProps {
  activeTab: string;
}

export const NavigasiAtas = ({ activeTab }: NavigasiAtasProps) => {
  const { profile } = useUserStore();

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-[#1A1A1A]/90 backdrop-blur-2xl border-b-[2px] border-black px-6 pt-4 pb-4 flex justify-between items-end h-[85px] shadow-[0_5px_0px_rgba(0,0,0,1)]">
      {activeTab === 'home' ? (
        <>
          <motion.div 
            whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
            className="flex items-center justify-center gap-[6px] bg-[#FF4D00] w-[85px] h-9 rounded-xl border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Icon icon="solar:fire-bold" width={22} height={22} className="text-white" />
            <span className="text-[20px] font-normal font-['Bebas_Neue'] text-white tracking-wider mt-[2px]">{profile?.streak_count || 0}</span>
          </motion.div>

          <AmbientPlayer />
        </>
      ) : (
        <div className="flex justify-between items-end w-full h-full pb-0">
          {/* KIRI: Judul + Superscript Icon */}
          <div className="flex items-center">
            <div className="relative inline-flex flex-col items-start">
              <h2 className="text-[24px] font-black font-['Outfit'] text-white tracking-tighter leading-none mt-1">
                {(activeTab === 'beranda' || activeTab === 'habits') && 'Habit Tracker'}
                {activeTab === 'todo' && 'To-Do List'}
                {activeTab === 'journey' && 'Journey'}
                {activeTab === 'analytics' && 'Analytics'}
                {activeTab === 'hub' && 'The Hub'}
                {activeTab === 'global' && 'Global Feed'}
                {activeTab === 'ai' && 'AI Assistant'}
              </h2>
              
              {/* INTEGRATED SUPERSCRIPT ICON */}
              <div className="absolute -right-[15px] -top-[2px] w-5 h-5 rounded-[6px] bg-[#404040] border-[1.5px] border-[#666666] flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)] rotate-[12deg] z-10">
                <Icon 
                  icon={
                    (activeTab === 'beranda' || activeTab === 'habits') ? 'solar:checklist-minimalistic-bold' :
                    activeTab === 'todo' ? 'solar:target-bold' :
                    activeTab === 'journey' ? 'solar:compass-bold' :
                    activeTab === 'global' ? 'solar:globus-bold' :
                    activeTab === 'ai' ? 'solar:chat-round-dots-bold' :
                    activeTab === 'hub' ? 'solar:menu-dots-bold' : 'solar:box-bold'
                  } 
                  width={11} height={11} className="text-[#E3DAC9]" 
                />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <AmbientPlayer />
          </div>
        </div>
      )}
    </div>
  );
};
