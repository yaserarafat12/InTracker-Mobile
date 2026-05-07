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
      <div className="max-w-[500px] mx-auto bg-black/90 backdrop-blur-3xl border border-white/40 rounded-[35px] h-20 flex items-center justify-around px-2 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(8);
              navigate(item.path || '/dashboard');
            }}
            className="relative flex flex-col items-center justify-center w-11 h-11 transition-all duration-300"
          >
            <div className={`relative z-10 transition-all duration-500 ${
              activeTab === item.id 
              ? 'text-white scale-125 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' 
              : 'text-white/40 hover:text-white/70'
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
                className="absolute -bottom-3 w-6 h-1 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}

            {activeTab === item.id && (
              <motion.div 
                layoutId="nav-glow-bg"
                className="absolute inset-0 bg-white/10 blur-2xl rounded-full"
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};
