import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useUserStore } from '../store/useUserStore';

interface TutorialOverlayProps {
  onClose?: () => void;
}

export const TutorialOverlay = ({ onClose }: TutorialOverlayProps) => {
  const { settings } = useUserStore();
  const isIndo = settings?.language === 'Bahasa Indonesia';
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      icon: 'solar:sparkles-bold',
      iconColor: '#FF4D00',
      title: isIndo ? 'Selamat Datang di InTracker!' : 'Welcome to InTracker!',
      description: isIndo 
        ? 'Sebuah program konsistensi 66 hari yang dirancang untuk membangun kebiasaan positif dan melacak perkembangan harianmu.' 
        : 'A 66-day consistency program designed to build positive habits and track your daily development.',
    },
    {
      icon: 'solar:fire-bold',
      iconColor: '#FF9500',
      title: isIndo ? 'Lacak Kebiasaan & Streak' : 'Track Habits & Streaks',
      description: isIndo 
        ? 'Selesaikan habit harian untuk memperpanjang Streak. Konsistensi harian adalah kunci utama keberhasilanmu!' 
        : 'Complete daily habits to grow your Streak. Daily consistency is the main key to your success!',
    },
    {
      icon: 'solar:gamepad-bold',
      iconColor: '#10B981',
      title: isIndo ? 'Pemulihan Streak Interaktif' : 'Interactive Streak Rescue',
      description: isIndo 
        ? 'Jika kamu tidak sempat menyelesaikan habit kemarin, pulihkan streak-mu dengan memenangkan tantangan mini-game seru.' 
        : 'If you missed yesterday\'s habits, rescue your streak by winning exciting mini-game challenges.',
    },
    {
      icon: 'solar:music-note-bold',
      iconColor: '#00D1FF',
      title: isIndo ? 'Fitur & Musik Fokus' : 'Focus Tools & Ambient',
      description: isIndo 
        ? 'Manfaatkan Pomodoro, Workout Counter, Math Racing, dan pemutar musik Ambient di header atas untuk membantumu tetap fokus.' 
        : 'Use Pomodoro, Workout Counter, Math Racing, and the Ambient music player in the top header to stay focused.',
    },
    {
      icon: 'solar:globe-bold',
      iconColor: '#A855F7',
      title: isIndo ? 'Komunitas Global' : 'Global Community',
      description: isIndo 
        ? 'Bagikan pencapaianmu, buat postingan harian, dan hubungkan progresmu dengan komunitas global dari berbagai belahan dunia.' 
        : 'Share your achievements, create daily posts, and connect your progress with a global community worldwide.',
    },
    {
      icon: 'solar:rocket-bold',
      iconColor: '#10B981',
      title: isIndo ? 'Siap Memulai?' : 'Ready to Begin?',
      description: isIndo 
        ? 'Mulailah perjalanan transformasimu hari ini dan jadilah versi terbaik dari dirimu!' 
        : 'Start your journey of transformation today and become the best version of yourself!',
      isLast: true
    }
  ];

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
      if (navigator.vibrate) navigator.vibrate(10);
    } else {
      localStorage.setItem('tutorial_completed', 'true');
      if (onClose) onClose();
      if (navigator.vibrate) navigator.vibrate([30, 50]);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('tutorial_completed', 'true');
    if (onClose) onClose();
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const page = pages[currentPage];
  const isLight = !document.documentElement.classList.contains('dark');

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className={`relative w-full max-w-[350px] rounded-[32px] border-[2.5px] border-black p-6 flex flex-col items-center text-center shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all ${
          isLight ? 'bg-white text-black' : 'bg-[#1E2028] text-white'
        }`}
      >
        {/* Skip button top-right */}
        {!page.isLast && (
          <button
            onClick={handleSkip}
            className={`absolute top-5 right-5 text-[11px] font-black uppercase tracking-wider transition-all ${
              isLight ? 'text-black/40 hover:text-black/80' : 'text-white/40 hover:text-white/80'
            }`}
          >
            {isIndo ? 'Lewati' : 'Skip'}
          </button>
        )}

        {/* Page indicator dot array */}
        <div className="flex gap-1.5 mb-6">
          {pages.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentPage === idx
                  ? 'w-5 bg-[#10B981]'
                  : `w-1.5 ${isLight ? 'bg-black/15' : 'bg-white/10'}`
              }`}
            />
          ))}
        </div>

        {/* Illustration Icon */}
        <div className="mb-6 relative">
          <div 
            className={`w-20 h-20 rounded-full flex items-center justify-center border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]`}
            style={{ backgroundColor: `${page.iconColor}20` }}
          >
            <Icon icon={page.icon} className="text-black dark:text-white" width={38} style={{ color: page.iconColor }} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[20px] font-black font-['Outfit'] leading-tight mb-3">
          {page.title}
        </h3>

        {/* Description */}
        <p className={`text-[13px] font-bold font-['Outfit'] leading-relaxed mb-8 px-2 ${
          isLight ? 'text-black/60' : 'text-[#E3DAC9]/60'
        }`}>
          {page.description}
        </p>

        {/* Action Button */}
        <motion.button
          whileTap={{ x: 3, y: 3, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
          onClick={handleNext}
          className="w-full py-3.5 bg-[#10B981] text-black font-black font-['Outfit'] text-[13px] rounded-xl border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase tracking-wider transition-all"
        >
          {page.isLast 
            ? (isIndo ? 'Mulai Sekarang 🔥' : 'Get Started 🔥')
            : (isIndo ? 'Lanjut' : 'Next')}
        </motion.button>
      </motion.div>
    </div>
  );
};
