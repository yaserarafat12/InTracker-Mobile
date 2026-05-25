import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

export const AIView = () => {
  const suggestions = [
    "Bagaimana progres habit saya hari ini?",
    "Berikan saran untuk habit 'Bangun Pagi'",
    "Kenapa streak saya penting?",
    "Rin, kasih motivasi snarky dong!"
  ];

  return (
    <div className="px-6 py-10 space-y-12 pb-32">
      {/* Header Rin */}
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="relative">
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-24 h-24 bg-[#00FF85] rounded-[32px] border-[2px] border-black flex items-center justify-center shadow-[10px_10px_0px_rgba(0,0,0,1)] relative z-10"
          >
            <Icon icon="solar:magic-stick-3-bold" className="text-black" width={48} />
          </motion.div>
          <div className="absolute inset-0 bg-[#00FF85]/20 blur-3xl rounded-full scale-150 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-[28px] font-black font-['Outfit'] text-white uppercase tracking-tight">Rin AI Assistant</h2>
          <p className="text-[14px] font-medium text-[#E3DAC9]/50 max-w-[280px]">
            "Saya sedang menganalisis data hidupmu yang berantakan itu. Mau tanya apa?"
          </p>
        </div>
      </div>

      {/* Input Placeholder */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#00FF85] to-[#00FF85] rounded-[24px] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-[#1A1A1A] border-[2px] border-black rounded-[24px] p-5 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-4 text-[#E3DAC9]/30">
            <Icon icon="solar:chat-dots-bold" width={24} />
            <span className="text-[14px] font-medium font-['Outfit']">Ketik pesan untuk Rin...</span>
          </div>
        </div>
      </div>

      {/* Quick Suggestions */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-black text-[#00FF85] uppercase tracking-widest px-2">Quick Commands</h4>
        <div className="flex flex-wrap gap-3">
          {suggestions.map((s, i) => (
            <motion.button
              key={i}
              whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
              className="px-5 py-3 bg-[#222] border-[1.5px] border-black rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)] text-[12px] font-bold text-white/70 hover:text-white transition-colors"
            >
              {s}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Pro Badge */}
      <div className="p-6 bg-gradient-to-br from-[#00FF85]/10 to-transparent border-[1.5px] border-[#00FF85]/20 rounded-[32px] flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-[#00FF85] border-[1.5px] border-black flex items-center justify-center shrink-0">
          <Icon icon="solar:crown-bold" className="text-black" width={24} />
        </div>
        <div className="space-y-0.5">
          <p className="text-[13px] font-black text-white uppercase tracking-tight">Pro Analysis Active</p>
          <p className="text-[11px] font-medium text-[#E3DAC9]/40">Rin menggunakan model 'Sarkas-3.5' untuk hasil maksimal.</p>
        </div>
      </div>
    </div>
  );
};
