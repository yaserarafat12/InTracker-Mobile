import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { NavigasiBawah } from '../NavigasiBawah';
import DaftarHabit from '../habits/habitlist';
import { Icon } from '@iconify/react';
import { TambahHabitModal } from '../habits/addhabitscreen';
import { useHabitStore } from '../../store/useHabitStore';
import { useTargetStore } from '../../store/useTargetStore';
import TodoTargetView from '../todo/TodoTargetView';

// --- SUB-VIEWS ---
const HomeView = () => (
  <div className="px-6 py-8">
    <div className="bg-[#1A1A1A] border border-white/10 rounded-[32px] p-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
      <h2 className="text-2xl font-black font-['Outfit'] text-white uppercase tracking-tight">Selamat Datang, Boss.</h2>
      <p className="text-[#D1D1C1] font-bold font-['Outfit'] text-xs mt-1 uppercase tracking-widest opacity-80">SISTEM SIAP DIGUNAKAN</p>
      
      <div className="mt-10 grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Kepatuhan</p>
          <p className="text-2xl font-black font-['Outfit'] mt-1 text-white">85%</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Streak</p>
          <p className="text-2xl font-black font-['Outfit'] mt-1 text-white">12 Hari</p>
        </div>
      </div>
    </div>
  </div>
);
const TodoList = () => <TodoTargetView />;
const Global = () => <div />;
const Journey = () => <div />;
const AIView = () => <div />;
const HubView = () => <div />;

export default function Dashboard({ activeTab: initialTab = 'home' }: { activeTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [loading, setLoading] = useState(true);
  const { habits, fetchHabits, addHabit, totalStreak } = useHabitStore();
  const { fetchTargets } = useTargetStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statsTab, setStatsTab] = useState<'berjalan' | 'selesai' | 'dilewati'>('berjalan');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    async function initDashboard() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('[InTracker] Auth error:', authError.message);
          return; // finally tetap jalan, loading dimatikan
        }

        if (authUser) {
          const { data: prof, error: profError } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
          if (profError) console.warn('[InTracker] Profile fetch warning:', profError.message);
          void prof;
          
          // Pakai allSettled biar kalau satu gagal, yang lain tetep jalan
          const results = await Promise.allSettled([
            fetchHabits(),
            fetchTargets()
          ]);
          
          results.forEach((r, i) => {
            if (r.status === 'rejected') {
              console.error(`[InTracker] Fetch ${i === 0 ? 'habits' : 'targets'} gagal:`, r.reason);
            }
          });
        } else {
          console.warn('[InTracker] No authenticated user found');
        }
      } catch (err) {
        console.error('[InTracker] Dashboard init crash:', err);
      } finally {
        // SELALU matikan loading, apapun yang terjadi
        setLoading(false);
      }
    }
    initDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-[#00FF85]/20 border-t-[#00FF85] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white font-['Outfit'] flex flex-col overflow-hidden selection:bg-[#00FF85] selection:text-black">
      
      {/* TOP STATUS BAR */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-[#1A1A1A] border-b border-white/5 px-6 pt-6 pb-6 flex justify-between items-center">
        <div className="flex items-center gap-2 bg-[#FF4D00] pl-4 pr-8 py-2.5 rounded-xl border border-white/20 shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-transform active:scale-95">
          <Icon icon="solar:fire-bold" width={24} height={24} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
          <span className="text-[15px] font-black font-['Outfit'] text-white">{totalStreak}</span>
        </div>

        <button className="w-[56px] h-12 rounded-xl bg-[#1A1A1A] border border-white/10 flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
          <Icon icon="solar:settings-bold" width={28} height={28} className="text-[#B0B0B0]" />
        </button>
      </div>

      {/* BG DECORATION */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[70vh] bg-[#00FF85]/2 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* CONTENT AREA */}
      <main className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth pt-24">
        {activeTab === 'habits' && (
          <div className="px-6 mb-12">
            <div className="flex items-end justify-between">
          <div className="flex flex-col mt-4">
                <span className="text-[13px] font-black text-[#D1D1C1] font-['Outfit'] uppercase tracking-[0.2em] mb-2 opacity-80">
                  {(() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const target = new Date(selectedDate);
                    target.setHours(0, 0, 0, 0);
                    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 0) return 'HARI INI';
                    if (diffDays === -1) return 'KEMARIN';
                    if (diffDays === 1) return 'BESOK';
                    
                    return target.toLocaleDateString('id-ID', { weekday: 'long' }).toUpperCase();
                  })()}
                </span>
                <h1 className="text-[48px] font-black text-white font-['Outfit'] leading-none uppercase tracking-[0.02em] mt-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
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
                  className="w-10 h-10 rounded-2xl bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-white active:bg-white/10 transition-all shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <Icon icon="solar:play-bold" width={14} height={14} className="text-white/60 rotate-180" />
                </button>
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(d);
                    if (navigator.vibrate) navigator.vibrate(5);
                  }}
                  className="w-10 h-10 rounded-2xl bg-[#1A1A1A] border border-white/10 flex items-center justify-center text-white active:bg-white/10 transition-all shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <Icon icon="solar:play-bold" width={14} height={14} className="text-white/60" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-12">
              {/* PREMIUM STATS BADGES */}
              <div className="flex gap-2">
                {[
                  { id: 'berjalan', label: 'Berjalan', count: habits.filter((h: any) => !h.completed && !h.skipped).length },
                  { id: 'selesai', label: 'Selesai', count: habits.filter((h: any) => h.completed).length },
                  { id: 'dilewati', label: 'Dilewati', count: habits.filter((h: any) => h.skipped).length }
                ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => {
                      setStatsTab(item.id as 'berjalan' | 'selesai' | 'dilewati');
                      if (navigator.vibrate) navigator.vibrate(8);
                    }}
                    className={`
                      px-4 py-2.5 rounded-xl transition-all duration-300 flex items-start
                      border-[1.5px] ${statsTab === item.id 
                        ? 'bg-[#F5F2E8] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' 
                        : 'bg-[#1A1A1A] border-white/10 shadow-[3px_3px_0px_rgba(0,0,0,1)]'}
                    `}
                  >
                    <span className={`text-[13px] font-bold font-['Outfit'] tracking-tight ${statsTab === item.id ? 'text-black' : 'text-white/40'}`}>
                      {item.label}
                    </span>
                    <span className={`text-[9px] font-black ml-0.5 mt-[-2px] ${statsTab === item.id ? 'text-black/40' : 'text-white/20'}`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* BONE WHITE ADD BUTTON - MENTOK KANAN */}
              <button 
                onClick={() => {
                  setIsAddModalOpen(true);
                  if (navigator.vibrate) navigator.vibrate(10);
                }}
                className="h-12 w-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all border-[1.5px] border-[#E3DAC9]/30 hover:border-[#E3DAC9] group relative z-50"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="group-hover:scale-110 transition-transform"
                >
                  <path 
                    d="M12 5V19M5 12H19" 
                    stroke="#E3DAC9" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
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
              />
            )}
            {activeTab === 'home' && <HomeView />}
            {activeTab === 'todo' && <TodoList />}
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
            onClose={() => setIsAddModalOpen(false)} 
            onAddHabit={(h) => {
              addHabit(h);
              setIsAddModalOpen(false);
            }}
            currentHabits={habits}
          />)}
      </AnimatePresence>

    </div>
  );
}
