import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useUserStore } from '../store/useUserStore';
import { useTranslation } from '../i18n';

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
      <span className="relative z-10 font-['Outfit'] text-[15px] font-black tracking-wide text-[#050A07]">
        {children}
      </span>
    </motion.button>
  );
};

// --- COMPONENT: INDUSTRIAL TOGGLE ---
const IndustrialToggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => {
  const { settings } = useUserStore();
  const isLight = settings.theme === 'Light';

  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }} 
      className={`relative w-[52px] h-[28px] rounded-full border-2 transition-colors duration-300 overflow-hidden ${
        isLight
          ? active
            ? 'bg-[#00FF85] border-black'
            : 'bg-[#E5E5EA] border-black'
          : active
            ? 'bg-[#00FF85] border-black'
            : 'bg-[#2A2A2A] border-white/20'
      }`}
    >
      <motion.div
        animate={{ x: active ? 24 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`absolute top-[2px] w-[20px] h-[20px] rounded-full border transition-all ${
          isLight
            ? 'bg-white border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]'
            : active
              ? 'bg-white border-black shadow-[1px_1px_0px_rgba(0,0,0,1)]'
              : 'bg-[#A0A0A0] border-transparent'
        }`}
      />
    </button>
  );
};

// --- COMPONENT: NOTIFICATION CARD (2 LINES - SLIM) ---
const NotificationCard = ({ item, active, onToggle, variants }: any) => {
  const { settings } = useUserStore();
  const isLight = settings.theme === 'Light';

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
          relative flex items-center justify-between gap-4 py-5 px-6 rounded-xl border-2
          transition-all duration-300 ease-out shadow-[5px_5px_0px_rgba(0,0,0,1)]
          ${isLight 
            ? active 
              ? 'bg-[#00FF85]/10 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] text-black' 
              : 'bg-white border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] text-black'
            : active
              ? 'bg-[#00FF85]/05 border-[#00FF85] shadow-[5px_5px_0px_rgba(0,0,0,1)] text-white'
              : 'bg-[#1A1A1A] border-white/[0.08] shadow-[5px_5px_0px_rgba(0,0,0,1)] text-white'
          }
          group-hover:border-[#00FF85]/40
          cursor-pointer
        `}
      >
        <div className="flex flex-col text-left">
          <h4 className={`text-[13px] font-bold uppercase tracking-wider ${isLight ? 'text-black font-extrabold' : 'text-white'}`}>
            {item.title}
          </h4>
          <p className={`text-[11px] leading-tight mt-1 ${isLight ? 'text-black/60 font-semibold' : 'text-[#A0A0A0]'}`}>
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
  const { settings, updateSettings } = useUserStore();
  const { t, language } = useTranslation();
  const isIndo = language === 'Bahasa Indonesia';

  // Enable notifications by default on onboarding first visit
  useEffect(() => {
    const isFirstTime = localStorage.getItem('notif_initialized') !== 'true';
    if (isFirstTime) {
      localStorage.setItem('notif_initialized', 'true');
      updateSettings({
        dailyReminder: true,
        newFeatures: true,
        weeklySummary: true
      });
    }
  }, [updateSettings]);

  const handleToggle = async (key: 'dailyReminder' | 'newFeatures' | 'weeklySummary') => {
    const newVal = !settings[key];
    updateSettings({ [key]: newVal });
    if (navigator.vibrate) navigator.vibrate(10);

    if (newVal) {
      // 1. Mobile Capacitor Local Notifications Permission request
      const win = window as any;
      if (win.Capacitor?.isPluginAvailable('LocalNotifications')) {
        try {
          const LocalNotifications = win.Capacitor.Plugins.LocalNotifications;
          await LocalNotifications.requestPermissions();
        } catch (e) {
          console.error("[InTracker] Capacitor requestPermissions failed:", e);
        }
      }

      // 2. Web Browser Notification request & immediate confirmation
      if ('Notification' in window) {
        try {
          let permission = Notification.permission;
          if (permission === 'default') {
            permission = await Notification.requestPermission();
          }
          if (permission === 'granted') {
            let title = "InTracker Alert Enabled";
            let body = "You have enabled alerts.";
            if (key === 'dailyReminder') {
              title = "Daily Habit Reminder";
              body = `Daily reminders are active. We will nudge you at ${settings.dailyReminderTime || '08:00 PM'}.`;
            } else if (key === 'weeklySummary') {
              title = "Weekly Summary Reports";
              body = "Success reports will be generated every Monday.";
            } else if (key === 'newFeatures') {
              title = "Incomplete Habit Alerts";
              body = "You will get alerted if any habits are left incomplete before midnight.";
            }
            new Notification(title, { body, icon: "/logo.png" });
          }
        } catch (err) {
          console.error("Notification API failed:", err);
        }
      }
    }
  };

  const handleContinue = async () => {
    // 1. Mobile Capacitor Local Notifications Permission request
    const win = window as any;
    if (win.Capacitor?.isPluginAvailable('LocalNotifications')) {
      try {
        const LocalNotifications = win.Capacitor.Plugins.LocalNotifications;
        await LocalNotifications.requestPermissions();
      } catch (e) {
        console.error("[InRising] Capacitor requestPermissions failed:", e);
      }
    }

    // 2. Web Browser Notification request
    if ('Notification' in window) {
      try {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      } catch (e) {
        console.error("[InRising] Web requestPermission failed:", e);
      }
    }

    if (navigator.vibrate) navigator.vibrate(10);
    navigate('/location');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease: CUBIC_BEZIER } }
  };

  const items = [
    { 
      id: 'dailyReminder' as const, 
      title: t('settings.dailyReminderTitle'), 
      desc: t('settings.dailyReminderDesc') 
    },
    { 
      id: 'newFeatures' as const, 
      title: t('settings.incompleteHabitsTitle'), 
      desc: t('settings.incompleteHabitsDesc') 
    },
    { 
      id: 'weeklySummary' as const, 
      title: t('settings.weeklySummaryTitle'), 
      desc: t('settings.weeklySummaryDesc') 
    }
  ];

  const isLight = settings.theme === 'Light';

  return (
    <div className={`h-[100dvh] font-['Inter'] relative flex flex-col items-center overflow-hidden select-none transition-colors duration-300 ${
      isLight ? 'bg-[#F2F2F7] text-black' : 'bg-black text-white'
    }`}>
      {/* Background glow decorators — brighter */}
      <div className={`absolute top-[-10%] left-[-20%] w-[60%] h-[60%] rounded-full pointer-events-none z-0 ${
        isLight ? 'bg-[#00FF85]/03 blur-[80px]' : 'bg-[#00FF85]/15 blur-[100px]'
      }`} />
      <div className={`absolute bottom-[-10%] right-[-20%] w-[60%] h-[60%] rounded-full pointer-events-none z-0 ${
        isLight ? 'bg-[#00FF85]/03 blur-[80px]' : 'bg-[#00FF85]/15 blur-[100px]'
      }`} />

      <div className="relative z-10 w-full max-w-[420px] px-6 flex flex-col flex-1 pt-24">
        
        {/* HEADING SECTION (FIXED HEIGHT) */}
        <div className="min-h-[160px] flex flex-col items-center justify-center">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: CUBIC_BEZIER }}
            className="flex flex-col items-center text-center gap-4"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center border relative ${
              isLight ? 'bg-[#00FF85]/20 border-black' : 'bg-[#00FF85]/10 border-[#00FF85]/20'
            }`}>
              <Icon icon="solar:bell-bing-bold" className={isLight ? 'text-black' : 'text-[#00FF85]'} width={24} height={24} />
            </div>
            <h1 className={`font-['Outfit'] text-[20px] font-bold leading-tight tracking-normal px-4 text-center ${
              isLight ? 'text-black font-extrabold' : 'text-white'
            }`}>
              {isIndo ? 'Nyalakan pengingat untuk tetap konsisten' : 'Turn on notifications to stay consistent'}
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
            {items.map((item) => (
              <NotificationCard 
                key={item.id}
                item={item}
                active={settings[item.id]}
                onToggle={() => handleToggle(item.id)}
                variants={itemVariants}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* BOTTOM ACTION SECTION (MENTOK) */}
      <div className={`absolute bottom-0 left-0 w-full px-6 pb-6 pt-16 z-20 flex justify-center ${
        isLight ? 'bg-gradient-to-t from-[#F2F2F7] via-[#F2F2F7]/95 to-transparent' : 'bg-gradient-to-t from-black via-black/95 to-transparent'
      }`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          <CinematicButton onClick={handleContinue} className="w-full">
            {isIndo ? 'Lanjutkan' : 'Continue'}
          </CinematicButton>
        </motion.div>
      </div>

    </div>
  );
}
