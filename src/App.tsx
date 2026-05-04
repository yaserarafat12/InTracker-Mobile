import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

// Basic Mock Views (To be replaced with real files)
const HomeView = () => (
  <div className="p-6 pt-12">
    <p className="text-os-green text-[10px] font-black uppercase tracking-[4px] mb-2">Systems Online</p>
    <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-8">DASHBOARD</h1>
    <div className="grid grid-cols-1 gap-4">
      <div className="glass p-8 rounded-[40px] border-os-green/20">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Energy Score</p>
        <p className="text-5xl font-black italic text-os-green">2,450 <span className="text-xs not-italic text-white/20 uppercase tracking-widest">SP</span></p>
      </div>
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  const navItems = [
    { id: 'home', icon: 'solar:home-2-bold', label: 'Core' },
    { id: 'battle', icon: 'solar:cup-bold', label: 'Battle' },
    { id: 'add', icon: 'solar:plus-circle-bold', label: 'Add', primary: true },
    { id: 'focus', icon: 'solar:clock-circle-bold', label: 'Focus' },
    { id: 'journal', icon: 'solar:notebook-bold', label: 'Logs' },
  ];

  return (
    <div className="min-h-screen bg-os-bg text-white font-sans selection:bg-os-green selection:text-black overflow-hidden relative">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[50vh] bg-os-green/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Content Area */}
      <main className="pb-32 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <HomeView />
            </motion.div>
          )}
          {activeTab !== 'home' && (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-[70vh] opacity-20 italic font-black uppercase tracking-[8px]"
            >
              {activeTab} VIEW
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 z-50">
        <div className="glass h-20 rounded-[32px] flex items-center justify-around px-2 shadow-2xl">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center transition-all ${
                item.primary 
                ? 'w-14 h-14 bg-os-green text-black rounded-2xl -mt-10 shadow-[0_0_30px_rgba(0,232,122,0.4)] active:scale-90' 
                : 'w-12 h-12 rounded-xl'
              }`}
            >
              <Icon 
                icon={item.icon} 
                width={item.primary ? 28 : 20} 
                height={item.primary ? 28 : 20} 
                className={activeTab === item.id && !item.primary ? 'text-os-green' : 'text-white/40'} 
              />
              {!item.primary && activeTab === item.id && (
                <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1 h-1 bg-os-green rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

