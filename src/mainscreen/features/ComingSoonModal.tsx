import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useUserStore } from '../../store/useUserStore';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
  const { settings } = useUserStore();
  const isLight = !document.documentElement.classList.contains('dark');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[260]"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed bottom-0 left-0 right-0 z-[270] rounded-t-[24px] p-6 pb-10 border-t-[2px] border-black transition-colors duration-300 ${
              isLight ? 'bg-[#F2F2F7] text-black' : 'bg-[#1c1e22] text-white'
            }`}
          >
            <div className="flex flex-col items-center text-center gap-4">
              {/* Handle */}
              <div className={`w-10 h-1 rounded-full mb-2 ${isLight ? 'bg-black/10' : 'bg-white/20'}`} />

              {/* Icon */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isLight ? 'bg-[#00FF85]/20' : 'bg-[#00FF85]/10'}`}>
                <Icon icon="ph:rocket-bold" className="text-[#00FF85]" width={32} />
              </div>

              {/* Text */}
              <h3 className={`text-[20px] font-bold font-['Outfit'] ${isLight ? 'text-black' : 'text-white'}`}>
                {settings.language === 'Bahasa Indonesia' ? 'Segera Hadir!' : 'Coming Soon!'}
              </h3>
              <p className={`text-[14px] max-w-[280px] leading-relaxed ${isLight ? 'text-black/60' : 'text-white/50'}`}>
                {settings.language === 'Bahasa Indonesia' 
                  ? 'Fitur ini sedang dalam pengembangan. Kami sedang bekerja keras untuk menghadirkannya untukmu!' 
                  : 'This feature is currently under development. We are working hard to bring it to you soon!'}
              </p>

              {/* Close button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="mt-4 w-full py-3.5 bg-[#00FF85] text-black font-black rounded-xl text-[14px] border-[2px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]"
              >
                {settings.language === 'Bahasa Indonesia' ? 'Mengerti' : 'Got It'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
