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
import { useUIStore } from '../../store/useUIStore';
import { InteractiveTutorial } from '../../components/InteractiveTutorial';
import WeeklySummaryRecap from '../analytics/WeeklySummaryRecap';

// Modularized Views & Components
import { HomeView } from './views/HomeView';
import { AIView } from './views/AIView';
import { ToolsHub } from '../features/ToolsHub';
import { DateNavigator } from './components/DateNavigator';

import { AdminDashboard } from '../admin/AdminDashboard';

const TodoList = ({ filter }: { filter?: TargetFilter }) => <TodoTargetView initialFilter={filter} />;
const Global = () => <GlobalView />;
const Journey = () => <JourneyView />;

function Beranda({ activeTab: initialTab = 'habits' }: { activeTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [todoFilter, setTodoFilter] = useState<TargetFilter | undefined>(undefined);
  const { isSettingsOpen, toggleSettings } = useUIStore();

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
  const { fetchProfile, settings, updateSettings } = useUserStore();
  const isAdmin = settings.email?.toLowerCase() === 'yaserarafatt03@gmail.com' || settings.email?.toLowerCase().includes('yaserarafatt03');
  const { reconcileWithRemote, runMigration, _checkAndResetDaily } = useProgressionStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statsTab, setStatsTab] = useState<'berjalan' | 'selesai' | 'dilewati'>('berjalan');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const currentPausedDays = settings.pausedDays || [];
    if (settings.programPaused) {
      if (!currentPausedDays.includes(todayStr)) {
        updateSettings({
          pausedDays: [...currentPausedDays, todayStr]
        });
      }
    } else {
      if (currentPausedDays.includes(todayStr)) {
        updateSettings({
          pausedDays: currentPausedDays.filter(d => d !== todayStr)
        });
      }
    }
  }, [settings.programPaused, settings.pausedDays, updateSettings]);

  // Sync modal & settings states with interactive tutorial step
  useEffect(() => {
    const isTutorialActive = localStorage.getItem('interactive_tutorial_active') === 'true';
    if (!isTutorialActive) return;

    // Steps 2, 3, 4, 5 require TambahHabitModal to be open
    if (tutorialStep >= 2 && tutorialStep <= 5) {
      setIsAddModalOpen(true);
    } else {
      setIsAddModalOpen(false);
    }
  }, [tutorialStep]);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Sync theme class with settings
  useEffect(() => {
    const t = settings.theme || 'System';
    if (t === 'Dark') {
      document.documentElement.classList.add('dark');
    } else if (t === 'Light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [activeTab, settings.theme]);


  const triggerCompletionAnimation = () => {
    if (navigator.vibrate) navigator.vibrate([30, 100, 30]);
  };

  const initDashboard = async () => {
    try {
      setError(null);
      
      if (localStorage.getItem('guest_mode') === 'true') {
        _checkAndResetDaily();
        await Promise.allSettled([
          fetchHabits(),
          fetchTargets(),
          fetchProfile(),
        ]);
        setLoading(false);
        return;
      }

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('[InRising] Auth error:', authError.message);
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
      console.error('[InRising] Dashboard init crash:', err);
      setError("Aplikasi agak error dikit, Bos. Rin coba benerin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initDashboard();
  }, []);

  // Trigger daily reset check when app gains focus (e.g. phone unlocks or user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      console.log("[InRising] App focused, running timezone-aware daily reset check...");
      _checkAndResetDaily();
      fetchHabits();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [_checkAndResetDaily, fetchHabits]);

  if (loading) {
    const isLight = settings.theme === 'Light';
    const language = settings.language || 'English';
    const LOADING_TEXTS: Record<string, string> = {
      'English': 'Initializing your universe...',
      'Bahasa Indonesia': 'Menyiapkan universe Anda...',
      'Arabic': 'جارٍ تهيئة كونك...',
      'Japanese': 'ユニバースを初期化中...',
      'Chinese': '正在初始化您的宇宙...',
      'French': 'Initialisation de votre univers...',
      'German': 'Dein Universum wird initialisiert...',
      'Spanish': 'Inicializando tu universo...',
      'Portuguese': 'Inicializando o seu universo...',
      'Korean': '유니버스 초기화 중...',
    };
    const loadingText = LOADING_TEXTS[language] || LOADING_TEXTS['English'];

    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 ${isLight ? 'bg-[#F2F2F7]' : 'bg-black'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center gap-10"
        >
          {/* Premium Dual-Ring Spinner */}
          <div className="relative w-24 h-24">
            {/* Outer spinning ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full"
              style={{
                background: 'transparent',
                border: '3px solid transparent',
                borderTopColor: '#6ED7A0',
                borderRightColor: 'transparent',
                borderBottomColor: '#6ED7A0',
                borderLeftColor: 'transparent',
                filter: 'drop-shadow(0 0 10px rgba(110,215,160,0.5))',
              }}
            />
            {/* Middle counter-spinning ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-[10px] rounded-full"
              style={{
                background: 'transparent',
                border: '2px solid transparent',
                borderTopColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(110,215,160,0.3)',
                borderRightColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(110,215,160,0.1)',
                borderBottomColor: 'transparent',
                borderLeftColor: 'transparent',
              }}
            />
            {/* Inner pulsing crown badge */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [0.88, 1.08, 0.88], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${
                  isLight
                    ? 'bg-[#6ED7A0] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#6ED7A0]/15 border-[#6ED7A0]/60 shadow-[0_0_16px_rgba(110,215,160,0.25)]'
                }`}
              >
                <Icon icon="ph:crown-fill" width={18} height={18} className={isLight ? 'text-black' : 'text-[#6ED7A0]'} />
              </motion.div>
            </div>
          </div>

          {/* Text block */}
          <div className="flex flex-col items-center gap-2">
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className={`text-[11px] font-black tracking-[0.22em] uppercase font-['Outfit'] ${
                isLight ? 'text-black/70' : 'text-[#6ED7A0]'
              }`}
            >
              {loadingText}
            </motion.p>
            <p className={`text-[9px] font-bold tracking-[0.18em] uppercase font-['Outfit'] ${
              isLight ? 'text-black/25' : 'text-white/20'
            }`}>
              InTracker System
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
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
    <div className="min-h-screen w-full bg-black text-white font-['Outfit'] flex flex-col overflow-hidden selection:bg-[#00FF85] selection:text-black">
      

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
          features: '/all_images/antigravitybg/mainscreen_bg.png',
        };
        const bg = bgMap[activeTab];
        if (!bg) return null;
        const isTodo = activeTab === 'todo';
        const isHabits = activeTab === 'habits';
        return (
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div 
              className={`w-full h-full ${isTodo || isHabits ? 'opacity-[0.85]' : 'opacity-[0.65]'}`}
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
        className="relative flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
      >
        <NavigasiAtas activeTab={activeTab} />
        {isAdmin ? (
          <AdminDashboard activeTab={activeTab} />
        ) : (
          <>
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
                    tutorialStep={tutorialStep}
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
                {activeTab === 'analytics' && <AnalyticsView tutorialStep={tutorialStep} />}
                {activeTab === 'journey' && <Journey />}
                {activeTab === 'global' && <Global />}
                {activeTab === 'features' && <ToolsHub />}
                {activeTab === 'summary' && <WeeklySummaryRecap />}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>

      <NavigasiBawah activeTab={activeTab} setActiveTab={setActiveTab} />
      <SettingsOverlay />


      <InteractiveTutorial 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isSettingsOpen={isSettingsOpen}
        toggleSettings={toggleSettings}
        onStepChange={setTutorialStep}
      />

      <AnimatePresence>
        {isAddModalOpen && (
          <TambahHabitModal 
            isOpen={isAddModalOpen} 
            tutorialStep={tutorialStep}
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
