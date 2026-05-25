import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#1c1e22] border-t border-white/10 rounded-t-[24px] p-6 pb-10"
          >
            <div className="flex flex-col items-center text-center gap-4">
              {/* Handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mb-2" />

              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-[#00FF85]/10 flex items-center justify-center">
                <Icon icon="ph:rocket-bold" className="text-[#00FF85]" width={32} />
              </div>

              {/* Text */}
              <h3 className="text-[20px] font-bold text-white font-['Outfit']">
                Segera Hadir!
              </h3>
              <p className="text-[14px] text-white/50 max-w-[280px] leading-relaxed">
                Fitur ini sedang dalam pengembangan. Kami sedang bekerja keras untuk menghadirkannya untukmu!
              </p>

              {/* Close button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="mt-4 w-full py-3.5 bg-[#00FF85] text-black font-bold rounded-xl text-[14px]"
              >
                Mengerti
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
