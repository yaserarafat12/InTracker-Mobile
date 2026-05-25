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
    { id: 'habits', icon: 'solar:checklist-minimalistic-bold', label: 'Habits', path: '/habits' },
    { id: 'todo', icon: 'solar:target-bold', label: 'To-Do', path: '/todolist' },
    { id: 'analytics', icon: 'mingcute:chart-bar-fill', label: 'Analytics', path: '/analytics' },
    { id: 'journey', icon: 'solar:compass-bold', label: 'Journey', path: '/journey' },
    { id: 'global', icon: 'solar:globus-bold', label: 'Global', path: '/global' },
    { id: 'features', icon: 'solar:widget-bold', label: 'Features', path: '/features' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0f12]/70 backdrop-blur-[20px] backdrop-saturate-150 border-t border-white/[0.08] h-[calc(80px+env(safe-area-inset-bottom,0px))] rounded-t-[24px] px-2 shadow-[0_-4px_30px_rgba(0,0,0,0.3)]">
      {/* Center ambient glow - wider spread */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[280px] h-[80px] bg-[#00FF85]/[0.05] blur-[50px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[350px] h-[40px] bg-[#00FF85]/[0.03] blur-[30px] rounded-full pointer-events-none" />
      <div className="flex items-center justify-around h-[80px] w-full max-w-[500px] mx-auto">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            whileTap={{ y: 4, transition: { duration: 0.1 } }}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(8);
              navigate(item.path || '/beranda');
            }}
            className="relative flex flex-col items-center justify-center w-11 h-11 transition-all duration-300"
          >
            <div className={`relative z-10 transition-all duration-500 ${
              activeTab === item.id 
              ? 'text-[#00FF85] scale-125 drop-shadow-[0_0_10px_rgba(0,255,133,0.3)]' 
              : 'text-[#E3DAC9]/60 hover:text-[#E3DAC9]/80'
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
                className="absolute -bottom-1.5 w-6 h-1 bg-[#00FF85] rounded-full shadow-[0_0_15px_rgba(0,255,133,0.4)]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}

            {activeTab === item.id && (
              <motion.div 
                layoutId="nav-glow-bg"
                className="absolute inset-0 bg-[#00FF85]/20 blur-xl rounded-full scale-[1.3] -translate-y-2"
              />
            )}
          </motion.button>
        ))}
      </div>
    </nav>
  );
};
