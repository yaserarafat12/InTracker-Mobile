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
            className={`fixed bottom-0 left-0 right-0 z-[270] rounded-t-[24px] p-6 pb-10 border-t-[1.5px] transition-colors duration-300 ${
              isLight ? 'bg-[#f2faf5] border-black/10 text-black' : 'bg-[#1c1e22] border-white/10 text-white'
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
              <div className={`text-[14px] max-w-[280px] leading-relaxed font-medium ${isLight ? 'text-black/60' : 'text-white/50'}`}>
                {settings.language === 'Bahasa Indonesia' ? (
                  <>
                    Fitur ini sedang dalam pengembangan.
                    <div className="h-2" />
                    Kami sedang bekerja keras untuk menghadirkannya untukmu!
                  </>
                ) : (
                  <>
                    This feature is currently under development.
                    <div className="h-2" />
                    We are working hard to bring it to you soon!
                  </>
                )}
              </div>

              {/* Close button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className={`mt-4 w-full py-3 rounded-lg text-[13px] font-black font-['Outfit'] border-2 transition-all uppercase tracking-wider sheen-active-tab ${
                  isLight
                    ? 'border-[#48BB78]/30 bg-gradient-to-br from-[#E6FFFA] to-[#C6F6D5] border-[#81E6D9] shadow-[0_6px_16px_rgba(34,84,61,0.15)] text-[#22543D]'
                    : 'border-[#00FF85]/30 bg-gradient-to-br from-[#102A1E] to-[#0A1A12] border-[#1C4D38] shadow-[0_6px_16px_rgba(0,255,133,0.18)] text-[#00FF85]'
                }`}
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
