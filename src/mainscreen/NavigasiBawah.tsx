import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useTranslation } from '../i18n';
import { useUserStore } from '../store/useUserStore';

interface NavigasiBawahProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const NavigasiBawah: React.FC<NavigasiBawahProps> = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings } = useUserStore();
  const isAdmin = settings.email?.toLowerCase() === 'yaserarafatt03@gmail.com' || settings.email?.toLowerCase().includes('yaserarafatt03');

  const navItems = isAdmin 
    ? [
        { id: 'habits', icon: 'solar:widget-bold', label: 'Dashboard', path: '/habits' },
        { id: 'todo', icon: 'solar:users-group-two-rounded-bold', label: 'Users', path: '/todolist' },
        { id: 'analytics', icon: 'solar:document-text-bold', label: 'Questions', path: '/analytics' },
        { id: 'journey', icon: 'solar:letter-bold', label: 'Inbox', path: '/journey' },
      ]
    : [
        { id: 'habits', icon: 'solar:target-bold', label: t('nav.habits'), path: '/habits' },
        { id: 'todo', icon: 'solar:checklist-minimalistic-bold', label: t('nav.todo'), path: '/todolist' },
        { id: 'analytics', icon: 'mingcute:chart-bar-fill', label: t('nav.analytics'), path: '/analytics' },
        { id: 'journey', icon: 'solar:compass-bold', label: t('nav.journey'), path: '/journey' },
        { id: 'global', icon: 'solar:globus-bold', label: t('nav.global'), path: '/global' },
        { id: 'features', icon: 'solar:widget-bold', label: t('nav.features'), path: '/features' },
      ];

  const isLight = settings?.theme === 'Light';

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 h-[calc(80px+env(safe-area-inset-bottom,0px))] rounded-t-[24px] px-2 transition-colors duration-300 border-t ${
      isLight 
        ? 'bg-white border-neutral-300 shadow-[0_-2px_15px_rgba(0,0,0,0.05)]' 
        : 'bg-[#0d0f12] border-white/[0.08] shadow-[0_-4px_30px_rgba(0,0,0,0.3)]'
    }`}>
      {/* Center ambient glow - wider spread */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[280px] h-[80px] bg-os-green/5 blur-[50px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[350px] h-[40px] bg-os-green/3 blur-[30px] rounded-full pointer-events-none" />
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
              ? 'text-os-green scale-125' 
              : 'text-neutral-500 dark:text-[#E3DAC9]/60 hover:text-neutral-700 dark:hover:text-[#E3DAC9]/80'
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
                className="absolute -bottom-1.5 w-6 h-1 bg-os-green rounded-full shadow-[0_0_15px_rgba(0,242,149,0.4)]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}

            {activeTab === item.id && (
              <motion.div 
                layoutId="nav-glow-bg"
                className="absolute inset-0 bg-os-green/20 blur-xl rounded-full scale-[1.3] -translate-y-2"
              />
            )}
          </motion.button>
        ))}
      </div>
    </nav>
  );
};
