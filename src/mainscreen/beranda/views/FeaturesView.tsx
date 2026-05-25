import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

export const FeaturesView = () => {
  const features = [
    { title: 'Focus Timer', icon: 'solar:clock-circle-bold', color: '#00FF85', status: 'ALPHA', desc: 'Deep work mode with ambient soundscapes.' },
    { title: 'Dream Journal', icon: 'solar:moon-bold', color: '#B190FF', status: 'BETA', desc: 'Sync your subconscious patterns.' },
    { title: 'Mood Tracker', icon: 'solar:heart-bold', color: '#FF4D00', status: 'STABLE', desc: 'Daily emotional resonance logging.' },
    { title: 'Skill Tree', icon: 'solar:branching-paths-bold', color: '#00FF85', status: 'BETA', desc: 'Gamified personal growth path.' },
    { title: 'Life Map', icon: 'solar:map-bold', color: '#FFD700', status: 'COMING SOON', desc: 'Interactive visual timeline of your journey.' },
    { title: 'Zen Mode', icon: 'solar:leaf-bold', color: '#40E0D0', status: 'STABLE', desc: 'Clean interface for pure habit focus.' },
  ];

  return (
    <div className="px-6 py-10 space-y-10 pb-32">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00FF85]/10 border border-[#00FF85]/30 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00FF85] animate-pulse" />
          <span className="text-[10px] font-black text-[#00FF85] uppercase tracking-widest">Laboratory Mode</span>
        </div>
        <h2 className="text-[32px] font-black font-['Outfit'] text-white leading-none tracking-tight">EXPERIMENTAL<br/><span className="text-[#E3DAC9]/40 text-[24px]">LABORATORY</span></h2>
        <p className="text-[14px] font-medium text-[#E3DAC9]/50 max-w-[280px]">Tempat Rin bereksperimen dengan fitur-fitur baru. Hati-hati, mungkin ada bug!</p>
      </div>
      
      <div className="grid grid-cols-1 gap-5">
        {features.map((f, i) => (
          <motion.div 
            key={i}
            whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px black" }}
            className="group relative p-6 bg-[#1E1E1E] border-[1.5px] border-[#E3DAC9]/10 rounded-[32px] shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col gap-4 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Icon icon={f.icon} width={80} />
            </div>

            <div className="flex justify-between items-start relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-black border-[1.5px] border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] flex items-center justify-center">
                <Icon icon={f.icon} style={{ color: f.color }} width={24} />
              </div>
              <span className={`text-[9px] font-black px-2 py-1 rounded-lg border-[1px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] ${
                f.status === 'STABLE' ? 'bg-[#00FF85] text-black' : 
                f.status === 'ALPHA' ? 'bg-[#FF4D00] text-white' : 
                'bg-[#222] text-[#E3DAC9]/40'
              }`}>
                {f.status}
              </span>
            </div>

            <div className="space-y-1 relative z-10">
              <h3 className="text-[18px] font-black font-['Outfit'] text-white uppercase tracking-tight">{f.title}</h3>
              <p className="text-[12px] font-medium text-[#E3DAC9]/50 leading-relaxed">{f.desc}</p>
            </div>

            {f.status !== 'COMING SOON' && (
              <motion.button 
                whileTap={{ scale: 0.95 }}
                className="mt-2 py-3 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black text-white/40 uppercase tracking-widest hover:bg-[#00FF85]/10 hover:text-[#00FF85] hover:border-[#00FF85]/30 transition-all"
              >
                Launch Protocol
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
