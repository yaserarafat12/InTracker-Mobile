import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { SettingsOverlay } from '../../components/SettingsOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { NavigasiBawah } from '../NavigasiBawah';
import { NavigasiAtas } from '../../components/NavigasiAtas';
import DaftarHabit from '../habits/habitlist';
import { TambahHabitModal } from '../habits/addhabitscreen';
import { useHabitStore } from '../../store/useHabitStore';
import { useTargetStore } from '../../store/useTargetStore';
import { useUserStore } from '../../store/useUserStore';
import { useProgressionStore } from '../../store/useProgressionStore';
import TodoTargetView, { type TargetFilter } from '../todo/TodoTargetView';
import { getRandomQuote } from '../../data/quotes';
import type { Quote } from '../../data/quotes';
import { JourneyView } from '../journey/JourneyView';
import GlobalView from '../GlobalView';
import { AnalyticsView } from '../analytics/AnalyticsView';

// Modularized Views & Components
import { HomeView } from './views/HomeView';
import { AIView } from './views/AIView';
import { ToolsHub } from '../features/ToolsHub';
import { DateNavigator } from './components/DateNavigator';
import { StreakRecoveryModal } from './components/StreakRecoveryModal';

const TodoList = ({ filter }: { filter?: TargetFilter }) => <TodoTargetView initialFilter={filter} />;
const Global = () => <GlobalView />;
const Journey = () => <JourneyView />;

function Beranda({ activeTab: initialTab = 'habits' }: { activeTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [todoFilter, setTodoFilter] = useState<TargetFilter | undefined>(undefined);

  const handleTabChange = (tab: string, filter?: any) => {
    setActiveTab(tab);
    if (tab === 'todo') {
      setTodoFilter(filter);
    }
  };
  const [quote, setQuote] = useState<Quote | null>(null);

  // Quote Rotation
  useEffect(() => {
    const updateQuote = () => {
      setQuote(prev => getRandomQuote(prev ?? undefined));
    };
    updateQuote();
    const interval = setInterval(updateQuote, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { habits, fetchHabits, addHabit } = useHabitStore();
  const { fetchTargets } = useTargetStore();
  const { fetchProfile } = useUserStore();
  const { reconcileWithRemote, runMigration, _checkAndResetDaily } = useProgressionStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statsTab, setStatsTab] = useState<'berjalan' | 'selesai' | 'dilewati'>('berjalan');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo(0, 0);
  }, [activeTab]);

  const triggerCompletionAnimation = () => {
    if (navigator.vibrate) navigator.vibrate([30, 100, 30]);
  };

  const initDashboard = async () => {
    try {
      setError(null);
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('[InTracker] Auth error:', authError.message);
        setError("Sesi Bos berakhir. Silakan login ulang.");
        return;
      }

      if (authUser) {
        // Initialize progression store: daily reset check, reconcile, and migrate
        _checkAndResetDaily();
        
        const results = await Promise.allSettled([
          fetchHabits(),
          fetchTargets(),
          fetchProfile(),
          reconcileWithRemote(),
          runMigration(),
        ]);
        
        const failed = results.filter(r => r.status === 'rejected');
        if (failed.length === results.length && results.length > 0) {
          setError("Gagal ngambil data dari markas, Bos. Coba cek internet.");
        }
      } else {
        setError("Bos belum login nih.");
      }
    } catch (err) {
      console.error('[InTracker] Dashboard init crash:', err);
      setError("Aplikasi agak error dikit, Bos. Rin coba benerin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initDashboard();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#16181c] flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <div className="flex gap-1.5 justify-center mb-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 bg-[#00FF85] rounded-full shadow-[0_0_10px_rgba(0,255,133,0.6)]"
            />
          ))}
        </div>
        <p className="text-[11px] font-black text-[#E3DAC9]/40 tracking-[0.2em] uppercase">Initializing...</p>
      </motion.div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#212121] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-[#FF4B4B] rounded-2xl border-[1.5px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-6">
        <span className="text-4xl">⚠️</span>
      </div>
      <h2 className="text-2xl font-black text-[#E3DAC9] mb-2 tracking-normal">Waduh, Error Bos!</h2>
      <p className="text-[#E3DAC9]/60 font-medium mb-8 max-w-[250px]">{error}</p>
      <button 
        onClick={() => { setLoading(true); initDashboard(); }}
        className="px-8 py-3 bg-[#00FF85] text-black font-black rounded-xl border-[1.5px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all tracking-normal"
      >
        Coba Lagi
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#16181c] text-white font-['Outfit'] flex flex-col overflow-hidden selection:bg-[#00FF85] selection:text-black">
      
      <NavigasiAtas activeTab={activeTab} />

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[70vh] bg-[#00FF85]/2 blur-[150px] rounded-full pointer-events-none z-0" />

      {/* Background - abstract nebula for non-habits and non-global screens */}
      {/* Per-tab background */}
      {(() => {
        const bgMap: Record<string, string> = {
          habits: '/all_images/antigravitybg/habits_bg.png',
          todo: '/all_images/antigravitybg/todolist_bg.png',
          analytics: '/all_images/antigravitybg/analytics_bg.png',
          journey: '/all_images/antigravitybg/journey_bg.png',
          global: '/all_images/antigravitybg/global_bg.png',
        };
        const bg = bgMap[activeTab];
        if (!bg) return null;
        const isTodo = activeTab === 'todo';
        return (
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div 
              className={`w-full h-full ${isTodo ? 'opacity-[0.85]' : 'opacity-[0.65]'}`}
              style={{ 
                backgroundImage: `url('${bg}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                maskImage: isTodo 
                  ? 'linear-gradient(to bottom, black 0%, black 50%, transparent 90%)'
                  : 'linear-gradient(to bottom, black 0%, black 30%, transparent 80%)',
                WebkitMaskImage: isTodo
                  ? 'linear-gradient(to bottom, black 0%, black 50%, transparent 90%)'
                  : 'linear-gradient(to bottom, black 0%, black 30%, transparent 80%)'
              }}
            />
          </div>
        );
      })()}

      <main 
        ref={mainContentRef}
        className="relative flex-1 overflow-y-auto overflow-x-hidden scroll-smooth pt-[80px]"
      >
        {activeTab === 'habits' && (
          <DateNavigator 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            activeFilter={statsTab}
            setActiveFilter={setStatsTab}
            habits={habits}
          />
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
                onComplete={triggerCompletionAnimation}
                onAddHabit={() => {
                  setEditingHabit(null);
                  setIsAddModalOpen(true);
                }}
                onEdit={(habit) => {
                  setEditingHabit(habit);
                  setIsAddModalOpen(true);
                }}
              />
            )}
            {activeTab === 'todo' && <TodoList filter={todoFilter} />}
            {activeTab === 'analytics' && <AnalyticsView />}
            {activeTab === 'journey' && <Journey />}
            {activeTab === 'global' && <Global />}
            {activeTab === 'features' && <ToolsHub />}
          </motion.div>
        </AnimatePresence>
      </main>

      <NavigasiBawah activeTab={activeTab} setActiveTab={setActiveTab} />
      <SettingsOverlay />
      <StreakRecoveryModal />

      <AnimatePresence>
        {isAddModalOpen && (
          <TambahHabitModal 
            isOpen={isAddModalOpen} 
            onClose={() => {
              setIsAddModalOpen(false);
              setEditingHabit(null);
            }} 
            onAddHabit={(h) => {
              addHabit(h);
              setIsAddModalOpen(false);
            }}
            onUpdateHabit={(id, updates) => {
              const { updateHabit } = useHabitStore.getState();
              updateHabit(id, updates);
              setIsAddModalOpen(false);
              setEditingHabit(null);
            }}
            habitToEdit={editingHabit}
            currentHabits={habits}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Beranda;
