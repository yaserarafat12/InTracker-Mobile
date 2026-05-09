import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';

interface NavigasiBawahProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const NavigasiBawah: React.FC<NavigasiBawahProps> = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const navItems = [
    { id: 'home', icon: 'solar:home-2-bold', label: 'Sistem', path: '/dashboard' },
    { id: 'habits', icon: 'solar:checklist-minimalistic-bold', label: 'Kebiasaan', path: '/habit' },
    { id: 'todo', icon: 'solar:target-bold', label: 'Target', path: '/todo' },
    { id: 'journey', icon: 'solar:compass-bold', label: 'Journey', path: '/journey' },
    { id: 'global', icon: 'solar:globus-bold', label: 'Global', path: '/global' },
    { id: 'ai', icon: 'solar:chat-round-dots-bold', label: 'AI', path: '/ai' },
    { id: 'hub', icon: 'solar:menu-dots-bold', label: 'Hub', isMenu: true, path: '/hub' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 px-4 pb-[calc(env(safe-area-inset-bottom,20px)+15px)]">
      <div className="max-w-[500px] mx-auto bg-[#212121] border-[2.5px] border-black rounded-[30px] h-20 flex items-center justify-around px-2 shadow-[0px_6px_0px_rgba(0,0,0,1)]">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            whileTap={{ y: 4, transition: { duration: 0.1 } }}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(8);
              navigate(item.path || '/dashboard');
            }}
            className="relative flex flex-col items-center justify-center w-11 h-11 transition-all duration-300"
          >
            <div className={`relative z-10 transition-all duration-500 ${
              activeTab === item.id 
              ? 'text-[#00FF85] scale-125 drop-shadow-[0_0_10px_rgba(0,255,133,0.3)]' 
              : 'text-[#E3DAC9]/40 hover:text-[#E3DAC9]/70'
            }`}>
              <Icon 
                icon={item.icon}
                width={item.id === 'ai' ? 26 : 24}
                height={item.id === 'ai' ? 26 : 24}
              />
            </div>
            
            {activeTab === item.id && (
              <motion.div 
                layoutId="nav-indicator"
                className="absolute -bottom-3 w-6 h-1 bg-[#00FF85] rounded-full shadow-[0_0_15px_rgba(0,255,133,0.4)]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}

            {activeTab === item.id && (
              <motion.div 
                layoutId="nav-glow-bg"
                className="absolute inset-0 bg-white/10 blur-2xl rounded-full"
              />
            )}
          </motion.button>
        ))}
      </div>
    </nav>
  );
};
