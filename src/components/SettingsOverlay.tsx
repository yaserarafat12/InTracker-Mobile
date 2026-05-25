import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { useUIStore } from '../store/useUIStore';

export const SettingsOverlay = () => {
  const { isSettingsOpen, setSettingsOpen } = useUIStore();
  const { profile, isProActive, addDailyPass, addStreakFreeze } = useUserStore();
  const navigate = useNavigate();
  const isPro = isProActive();

  if (!isSettingsOpen) return null;

  const shortcuts = [
    { id: 'ai', label: 'AI Assistant', icon: 'solar:magic-stick-3-bold', path: '/ai', color: '#00FF85', desc: 'Saran pintar & analisis habit.' },
    { id: 'lab', label: 'The Lab', icon: 'solar:widget-6-bold', path: '/features', color: '#FFD700', desc: 'Fitur eksperimental & gadget.' },
    { id: 'journey', label: 'Journey', icon: 'solar:compass-bold', path: '/journey', color: '#FF4D00', desc: 'Peta perjalanan hidupmu.' },
    { id: 'global', label: 'Global', icon: 'solar:globus-bold', path: '/global', color: '#00D1FF', desc: 'Feed komunitas InTracker.' },
  ];

  const handleNavigate = (path: string) => {
    if (navigator.vibrate) navigator.vibrate(10);
    setSettingsOpen(false);
    navigate(path);
  };

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-[100] bg-[#2A2A2A] flex flex-col overflow-hidden"
        >
          {/* BACKGROUND DECOR */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#00FF85]/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-[#FF4D00]/10 blur-[100px] rounded-full" />
          </div>

          {/* HEADER */}
          <div className="px-6 py-8 flex justify-between items-center relative z-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-black border-[1.5px] border-[#00FF85]/30 flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <Icon icon="solar:settings-bold" className="text-[#00FF85]" width={24} />
              </div>
              <h2 className="text-[22px] font-black font-['Outfit'] text-white uppercase tracking-[0.1em]">Settings</h2>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.9, x: 2, y: 2, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
              onClick={() => setSettingsOpen(false)}
              className="w-11 h-11 bg-[#00FF85] border-[2px] border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 6L18 18M18 6L6 18" stroke="black" strokeWidth="7" strokeLinecap="square" />
              </svg>
            </motion.button>
          </div>

          {/* CONTENT SCROLLABLE */}
          <div className="flex-1 overflow-y-auto px-6 py-4 pb-32 space-y-10 relative z-10 scrollbar-hide">
            
            {/* USER PROFILE CARD */}
            <section className="relative">
              <div className="bg-[#222] rounded-[32px] p-6 border-[2px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <Icon icon="solar:user-bold" width={180} />
                </div>
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-[24px] bg-[#00FF85] border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center rotate-[-3deg]">
                      <Icon icon="solar:user-bold" className="text-black" width={40} />
                    </div>
                    {isPro && (
                      <div className="absolute -top-2 -right-2 bg-black rounded-lg p-1.5 border-[1.5px] border-[#FFD700] shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        <Icon icon="solar:crown-bold" className="text-[#FFD700]" width={14} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[26px] font-black font-['Outfit'] text-white tracking-tight leading-none">
                      {profile?.nickname || profile?.full_name || 'Boss InTracker'}
                    </h3>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border-[1.5px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] w-fit ${isPro ? 'bg-[#00FF85] text-black' : 'bg-white/5 text-white/40'}`}>
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {isPro ? 'Emerald Pro Member' : 'System Guest'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* MAIN SHORTCUTS - GRID */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <div className="w-1.5 h-4 bg-[#00FF85] rounded-full" />
                <h4 className="text-[12px] font-black font-['Outfit'] text-white/40 tracking-[0.2em] uppercase">Core Modules</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {shortcuts.map((item) => (
                  <motion.button
                    key={item.id}
                    whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px black" }}
                    onClick={() => handleNavigate(item.path)}
                    className="flex flex-col items-start p-5 bg-[#222] border-[2px] border-black rounded-[28px] shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all group hover:bg-[#2a2a2a]"
                  >
                    <div 
                      className="w-12 h-12 rounded-2xl bg-black border-[1.5px] border-white/5 flex items-center justify-center mb-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] group-hover:scale-110 transition-transform"
                      style={{ borderColor: `${item.color}30` }}
                    >
                      <Icon icon={item.icon} style={{ color: item.color }} width={24} />
                    </div>
                    <span className="text-[14px] font-black text-white uppercase tracking-tight mb-1">{item.label}</span>
                    <span className="text-[9px] font-medium text-white/40 text-left leading-tight">{item.desc}</span>
                  </motion.button>
                ))}
              </div>
            </section>

            {/* STORE & UTILITIES */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 px-2">
                <div className="w-1.5 h-4 bg-[#FF4D00] rounded-full" />
                <h4 className="text-[12px] font-black font-['Outfit'] text-white/40 tracking-[0.2em] uppercase">Supply & Rewards</h4>
              </div>

              {/* DAILY PASS CARD */}
              <div className="bg-black border-[2px] border-black rounded-[32px] p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[150px] h-[150px] bg-[#00FF85]/10 blur-[60px] rounded-full pointer-events-none" />
                
                <div className="flex justify-between items-center mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:ticket-bold" className="text-[#00FF85]" width={16} />
                      <span className="text-[10px] font-black text-[#00FF85] uppercase tracking-widest">Limited Offer</span>
                    </div>
                    <h3 className="text-[20px] font-black text-white uppercase tracking-tight">Daily Pro Pass</h3>
                  </div>
                  <div className="px-4 py-1.5 bg-[#00FF85] rounded-xl border-[1.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                    <span className="text-[11px] font-black text-black">FREE</span>
                  </div>
                </div>
                
                <p className="text-[12px] font-medium text-[#E3DAC9]/50 leading-relaxed mb-6">
                  Akses instan ke semua fitur Pro selama 24 jam. Cukup tonton 1 iklan untuk aktivasi protokol.
                </p>

                <motion.button 
                  whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px black" }}
                  onClick={async () => {
                    if (navigator.vibrate) navigator.vibrate(50);
                    await addDailyPass();
                  }}
                  className="w-full py-4 bg-[#00FF85] text-black font-black text-[13px] rounded-2xl border-[2px] border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3"
                >
                  <Icon icon="solar:play-circle-bold" width={22} />
                  AKTIFKAN PRO PASS (ADS)
                </motion.button>
              </div>

              {/* SECONDARY UTILS */}
              <div className="grid grid-cols-2 gap-4">
                <motion.button 
                  whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px black" }}
                  onClick={async () => {
                    if (navigator.vibrate) navigator.vibrate(20);
                    await addStreakFreeze(1);
                  }}
                  className="p-5 rounded-[28px] border-[2px] border-black bg-[#222] shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center gap-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-black border-[1.5px] border-[#00D1FF]/20 flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    <Icon icon="solar:snow-bold" className="text-[#00D1FF]" width={28} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[12px] font-black text-white uppercase tracking-tight">Streak Freeze</p>
                    <p className="text-[8px] font-black text-[#00D1FF] uppercase tracking-widest">GET 1 (ADS)</p>
                  </div>
                </motion.button>

                <motion.button 
                  disabled
                  className="p-5 rounded-[28px] border-[2px] border-black bg-black/10 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center gap-4 opacity-40 grayscale"
                >
                  <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center">
                    <Icon icon="solar:box-bold" className="text-white/30" width={28} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[12px] font-black text-white/30 uppercase tracking-tight">Supply Box</p>
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">LOCKED</p>
                  </div>
                </motion.button>
              </div>
            </section>

            {/* SYSTEM ACTIONS */}
            <section className="pt-6 border-t-[1.5px] border-white/5 flex flex-col gap-4">
              <div className="bg-black/40 rounded-2xl p-4 border-[1.5px] border-white/5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="solar:terminal-bold" className="text-[#00FF85]" width={14} />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Command Console</span>
                </div>
                <input 
                  type="text"
                  placeholder="Ketik command... (ex: /loststreak)"
                  className="w-full bg-black border-[1.5px] border-white/10 rounded-xl px-4 py-3 text-[12px] font-bold text-[#00FF85] placeholder:text-white/20 focus:outline-none focus:border-[#00FF85]/50 transition-colors uppercase tracking-wider"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const cmd = e.currentTarget.value.trim().toLowerCase();
                      e.currentTarget.value = '';
                      
                      if (cmd === '/loststreak') {
                        const habitStore = (await import('../store/useHabitStore')).useHabitStore;
                        const habits = habitStore.getState().habits;
                        if (habits.length > 0) {
                          const targetHabit = habits[0];
                          habitStore.setState(state => ({
                            brokenStreaks: [{
                              habitId: targetHabit.id,
                              lastDate: new Date().toLocaleDateString('en-CA'),
                              daysMissing: 1
                            }]
                          }));
                          setSettingsOpen(false);
                          if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
                        }
                      }
                      
                      if (cmd === '/habits') handleNavigate('/habits');
                      if (cmd === '/todo') handleNavigate('/todo');
                      if (cmd === '/ai') handleNavigate('/ai');
                      
                      if (cmd === '/debug') {
                        const habitStore = (await import('../store/useHabitStore')).useHabitStore;
                        const userStore = (await import('../store/useUserStore')).useUserStore;
                        console.log('--- INTRACKER DEBUG ---');
                        console.log('Habits:', habitStore.getState());
                        console.log('User:', userStore.getState());
                        alert('Data logged to console, Boss!');
                      }

                      if (cmd === '/reset') {
                        window.location.reload();
                      }
                    }
                  }}
                />
              </div>

              <motion.button
                whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px black" }}
                onClick={() => handleNavigate('/login')}
                className="w-full py-4 bg-[#FF4D00]/10 text-[#FF4D00] font-black text-[13px] rounded-2xl border-[2px] border-[#FF4D00]/20 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 uppercase tracking-wider"
              >
                <Icon icon="solar:logout-bold" width={20} />
                Terminate Session
              </motion.button>
              
              <p className="text-[9px] font-medium text-white/20 text-center uppercase tracking-[0.3em]">
                InTracker OS • v4.0.0 Build 2024
              </p>
            </section>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


