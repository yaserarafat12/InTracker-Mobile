import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { NavigasiBawah } from '../NavigasiBawah';
import DaftarHabit from '../habits/habitlist';
import { Icon } from '@iconify/react';
import { TambahHabitModal } from '../habits/addhabitscreen';
import { useHabitStore } from '../../store/useHabitStore';
import TodoTargetView from '../todo/TodoTargetView';

// --- SUB-VIEWS ---
const HomeView = () => <div />;
const Global = () => <div />;
const Journey = () => <div />;
const AIView = () => <div />;
const HubView = () => <div />;

// --- PREMIUM COMPONENTS ---
const AIAuditSection = ({ completed, total }: { completed: number, total: number }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-6 mb-8 p-4 rounded-[24px] bg-[#00FF85]/5 border-[1.5px] border-[#00FF85]/20 flex items-center gap-4 group hover:bg-[#00FF85]/10 transition-all duration-300"
    >
      <div className="w-10 h-10 rounded-full bg-[#00FF85] flex items-center justify-center shadow-[0_0_15px_rgba(0,255,133,0.3)] shrink-0">
        <Icon icon="solar:magic-stick-3-bold" width={20} height={20} className="text-black" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-[#00FF85] font-['Outfit'] uppercase tracking-widest opacity-60">Bisikan Rin (AI Audit)</span>
        <p className="text-[13px] font-medium text-white/90 font-['Outfit'] leading-tight">
          {percentage === 100 
            ? "GILA! Bos bener-bener on fire hari ini. Protokol tuntas 100%! 🔥" 
            : percentage > 50 
              ? `Sedikit lagi Bos! ${percentage}% kelar. Hajar sisa ${total - completed} habit lagi!`
              : completed > 0 
                ? "Awal yang bagus, Bos. Gas terus jangan kasih kendor!"
                : "Bos, protokol hari ini belum disentuh nih. Yuk mulai satu!"}
        </p>
      </div>
    </motion.div>
  );
};

const FloatingProgressRing = ({ completed, total, onDismiss }: { completed: number, total: number, onDismiss: () => void }) => {
  const size = 40; // Smaller size as requested
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div 
      initial={{ scale: 0, x: 20 }}
      animate={{ scale: 1, x: 0 }}
      className="fixed top-[100px] right-4 z-[60] group"
    >
      <div className="relative w-[40px] h-[40px] bg-[#161616] rounded-full border-[1.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] flex items-center justify-center">
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#00FF85"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[8px] font-black font-['Outfit'] text-white">
          {completed}/{total}
        </span>

        {/* X button shows when hovered or when 100% */}
        <motion.button 
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          animate={{ opacity: percentage === 100 ? 1 : 0 }}
          onClick={onDismiss}
          className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF3B30] rounded-full border border-black flex items-center justify-center text-white"
        >
          <Icon icon="ph:x-bold" width={8} height={8} />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default function Beranda({ activeTab: initialTab = 'home' }: { activeTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [loading, setLoading] = useState(true);
  const { habits, setHabits, fetchHabits, totalStreak } = useHabitStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statsTab, setStatsTab] = useState<'berjalan' | 'selesai'>('berjalan');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<any>(null);
  const [showProgressRing, setShowProgressRing] = useState(true);

  const completedCount = habits.filter(h => h.completed).length;
  const totalCount = habits.length;

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function initDashboard() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser(authUser);
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
        if (prof) setProfile(prof);
        
        // FETCH HABITS HERE!
        await fetchHabits();
      }
      setLoading(false);
    }
    initDashboard();
  }, [fetchHabits]);

  const handleEdit = (habit: any) => {
    setHabitToEdit(habit);
    setIsAddModalOpen(true);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#212121] flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-[#00FF85]/20 border-t-[#00FF85] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-screen bg-[#161616] text-white font-sans relative flex flex-col overflow-hidden selection:bg-[#00FF85] selection:text-black">
      
      {/* TOP STATUS BAR */}
      <div className="fixed top-0 left-0 w-full px-6 pt-12 pb-6 flex justify-between items-center z-50 bg-[#161616]/95 backdrop-blur-xl border-b border-white/[0.03]">
        <div className="flex items-center gap-2 bg-[#FF4D00] px-4 py-2 rounded-2xl border border-white/20 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-transform active:scale-95">
          <Icon icon="solar:fire-bold" width={22} height={22} className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" />
          <span className="text-[16px] font-black font-['Outfit'] text-white">{totalStreak}</span>
        </div>

        <button className="w-10 h-10 rounded-xl bg-[#2D2D2D] border border-white/10 flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
          <Icon icon="solar:settings-bold" width={20} height={20} className="text-[#B0B0B0]" />
        </button>
      </div>

      {/* BG DECORATION */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[70vh] bg-[#00FF85]/2 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* CONTENT AREA */}
      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth pt-32">
        {activeTab === 'habits' && (
          <div className="px-6 mb-12">
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-[12px] font-black text-[#00FF85] font-['Outfit'] uppercase tracking-[0.2em] mb-1 opacity-80 ml-[22px]">
                  {(selectedDate.toDateString() === new Date().toDateString() ? 'HARI INI' : 
                    selectedDate.toLocaleDateString('id-ID', { weekday: 'long' }).toUpperCase())}
                </span>
                <h1 className="text-5xl font-black text-white font-['Outfit'] leading-none uppercase tracking-[0.02em]">
                  {selectedDate.getDate()} {selectedDate.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()}
                </h1>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(d);
                    if (navigator.vibrate) navigator.vibrate(5);
                  }}
                  className="w-14 h-14 rounded-2xl bg-[#222] border border-white/10 flex items-center justify-center text-white active:bg-white/10 transition-all shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <Icon icon="solar:play-bold" width={24} height={24} className="text-white rotate-180" />
                </button>
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(d);
                    if (navigator.vibrate) navigator.vibrate(5);
                  }}
                  className="w-14 h-14 rounded-2xl bg-[#222] border border-white/10 flex items-center justify-center text-white active:bg-white/10 transition-all shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <Icon icon="solar:play-bold" width={24} height={24} className="text-white" />
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-12">
              <div className="flex gap-2">
                {[
                  { id: 'berjalan', label: 'BERJALAN', count: habits.filter((h: any) => !h.completed).length },
                  { id: 'selesai', label: 'SELESAI', count: habits.filter((h: any) => h.completed).length }
                ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => {
                      setStatsTab(item.id as 'berjalan' | 'selesai');
                      if (navigator.vibrate) navigator.vibrate(5);
                    }}
                    className={`relative h-12 px-6 rounded-2xl border-[1.5px] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center ${
                      statsTab === item.id 
                      ? 'bg-white border-black text-black shadow-[4px_4px_0px_rgba(0,0,0,1)]' 
                      : 'bg-[#212121] border-white/5 text-white/40 shadow-[4px_4px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    <div className="flex items-start">
                      <span className="text-[17px] font-bold font-['Outfit']">{item.label}</span>
                      <span className="text-[11px] ml-1 -mt-1 font-black opacity-60 font-['Outfit']">{item.count}</span>
                    </div>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => {
                  setHabitToEdit(null);
                  setIsAddModalOpen(true);
                  if (navigator.vibrate) navigator.vibrate(10);
                }}
                className="h-12 w-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all border-[1.5px] border-black group"
              >
                <Icon icon="ph:plus-bold" width={24} height={24} color="black" className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'habits' && (
          <AIAuditSection completed={completedCount} total={totalCount} />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {activeTab === 'habits' && (
              <DaftarHabit 
                activeFilter={statsTab} 
                selectedDate={selectedDate} 
                habits={habits}
                onEdit={handleEdit}
              />
            )}
            {activeTab === 'home' && <HomeView />}
            {activeTab === 'todo' && <TodoTargetView />}
            {activeTab === 'journey' && <Journey />}
            {activeTab === 'global' && <Global />}
            {activeTab === 'ai' && <AIView />}
            {activeTab === 'hub' && <HubView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* BOTTOM NAVIGATION */}
      <NavigasiBawah activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* ADD HABIT MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <TambahHabitModal 
            isOpen={isAddModalOpen} 
            onClose={() => {
              setIsAddModalOpen(false);
              setHabitToEdit(null);
            }} 
            onAddHabit={useHabitStore.getState().addHabit}
            onUpdateHabit={useHabitStore.getState().updateHabit}
            habitToEdit={habitToEdit}
          />
        )}
      </AnimatePresence>

      {/* FLOATING PROGRESS RING */}
      <AnimatePresence>
        {activeTab === 'habits' && showProgressRing && totalCount > 0 && (
          <FloatingProgressRing 
            completed={completedCount} 
            total={totalCount} 
            onDismiss={() => setShowProgressRing(false)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
}
