import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onDismiss: () => void;
}

const TOAST_STYLES = {
  success: 'bg-[#00FF85]/20 border-[#00FF85]/30 text-[#00FF85]',
  error: 'bg-[#EF4444]/20 border-[#EF4444]/30 text-[#EF4444]',
  info: 'bg-white/10 border-white/15 text-white/80',
};

const Toast = ({ message, type, isVisible, onDismiss }: ToastProps) => {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [isVisible, onDismiss]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl border backdrop-blur-md font-['Outfit'] text-[13px] font-semibold tracking-wide shadow-lg ${TOAST_STYLES[type]}`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
