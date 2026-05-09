import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { NavigasiBawah } from '../NavigasiBawah';
import { NavigasiAtas } from '../../components/NavigasiAtas';
import DaftarHabit from '../habits/habitlist';
import { Icon } from '@iconify/react';
import { TambahHabitModal } from '../habits/addhabitscreen';
import { AmbientPlayer } from '../../components/AmbientPlayer';
import { useHabitStore } from '../../store/useHabitStore';
import { useTargetStore } from '../../store/useTargetStore';
import { useUserStore } from '../../store/useUserStore';
import TodoTargetView from '../todo/TodoTargetView';
import { getRandomQuote } from '../../data/quotes';
import type { Quote } from '../../data/quotes';
import { JourneyView } from '../journey/JourneyView';
import { getPrismStyle } from '../../utils/design';
import GlobalView from '../GlobalView';
import { GreetingHeader, dynamicHighlight } from './GreetingHeader';

// --- HELPERS ---
const getIndonesianDay = (date: Date) => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
};

const getIndonesianMonth = (date: Date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return months[date.getMonth()];
};

const getDateLabel = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari Ini';
  if (diffDays === -1) return 'Kemarin';
  if (diffDays === 1) return 'Besok';
  return getIndonesianDay(date);
};

// --- SUB-VIEWS ---

const RingProgressCard = ({ 
  title, 
  icon, 
  current, 
  total, 
  label,
  description,
  showWarning
}: { 
  title: string; 
  icon: string; 
  current: number; 
  total: number; 
  label: string;
  description: string;
  showWarning?: boolean;
}) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  // Dynamic Color Logic - "Pekat" & Premium
  const getProgressColor = (percent: number) => {
    if (percent < 35) return '#FF3333'; // Vibrant Red
    if (percent < 75) return '#FF9100'; // Vibrant Orange
    return '#00FF85'; // Premium Emerald
  };

  const color = getProgressColor(percentage);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div 
      whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
      className="relative flex-1 min-h-[175px] rounded-[20px] border-[1.5px] border-black bg-black/45 backdrop-blur-[20px] p-4 shadow-[6px_6px_0px_rgba(0,0,0,1)] overflow-hidden group"
    >
      {/* TECH BACKGROUND LAYERS */}
      {/* 1. Base Gradient Glow */}
      <div 
        className="absolute inset-0 opacity-10 transition-colors duration-1000"
        style={{ 
          background: `radial-gradient(circle at 70% 30%, ${color}, transparent 70%)` 
        }}
      />
      
      {/* 2. Micro Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{ 
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '15px 15px'
        }}
      />

      {/* 3. Noise Texture */}
      <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} 
      />

      {/* 4. Enhanced Corner Glow */}
      <div 
        className="absolute -top-12 -right-12 w-32 h-32 blur-[50px] opacity-25 rounded-full transition-colors duration-700"
        style={{ backgroundColor: color }}
      />

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black font-['Outfit'] text-[#E3DAC9]/40 tracking-tight">
              {title}
            </span>
            {showWarning && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center justify-center w-4 h-4 rounded-full bg-[#EF4444] border border-black shadow-[0_0_10px_rgba(239,68,68,0.4)]"
              >
                <Icon icon="solar:danger-bold" className="text-white" width={10} />
              </motion.div>
            )}
          </div>
          <Icon icon={icon} className="text-white/20" width={16} />
        </div>

        {/* Ring & Percentage */}
        <div className="relative flex items-center justify-center mb-4">
          <svg className="w-[110px] h-[110px] transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="55"
              cy="55"
              r={radius}
              stroke="currentColor"
              strokeWidth="7"
              fill="transparent"
              className="text-white/5"
            />
            {/* Progress Circle */}
            <motion.circle
              cx="55"
              cy="55"
              r={radius}
              stroke={color}
              strokeWidth="7"
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${color}55)` }}
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[22px] font-black font-['Outfit'] text-white leading-none">
              {percentage}%
            </span>
            <span className="text-[10px] font-black font-['Outfit'] text-[#E3DAC9]/40 mt-1">
              {current}/{total} {label}
            </span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-auto">
          <p className="text-[11px] font-bold font-['Outfit'] leading-snug" style={{ color: color }}>
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const HomeView = ({ onTabChange }: { onTabChange: (tab: string) => void }) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [showInsight, setShowInsight] = useState(false);
  
  // Data Logic
  const { targets, fetchTargets } = useTargetStore();
  const { habits, fetchHabits } = useHabitStore();
  const { profile, fetchProfile } = useUserStore(); 

  // 1. To-Do Hari Ini Stats
  const { completedTodayCount, todayTotalCount, uncompletedDelayedCount } = useMemo(() => {
    const safeTargets = targets || [];
    const todayStr = new Date().toLocaleDateString('en-CA');
    
    // Filter targets for today: window is today
    // AND it's either not completed yet, OR it was completed today
    const todayItems = safeTargets.filter(t => {
      if (t.window !== 'today') return false;
      if (!t.completed) return true;
      if (!t.completedAt) return false;
      const completedDate = new Date(t.completedAt).toLocaleDateString('en-CA');
      return completedDate === todayStr;
    });
    
    // Count completed today: completed is true AND finished today
    const completedToday = todayItems.filter(t => t.completed).length;

    // Count uncompleted delayed items
    const uncompletedDelayed = safeTargets.filter(t => t.window === 'delayed' && !t.completed).length;

    return { 
      completedTodayCount: completedToday, 
      todayTotalCount: todayItems.length,
      uncompletedDelayedCount: uncompletedDelayed
    };
  }, [targets]);

  // 2. Tugas Hari Ini (Habits) Stats
  const { completedHabits, totalHabits } = useMemo(() => {
    const safeHabits = habits || [];
    const completed = safeHabits.filter(h => h.completed).length;
    return { completedHabits: completed, totalHabits: safeHabits.length };
  }, [habits]);


  useEffect(() => {
    // Refresh data when entering dashboard
    fetchTargets();
    fetchHabits();

    // Auto-Update Profile if needed
    const ensureProfile = async () => {
      if (profile && (profile.nickname !== 'Ser' || profile.full_name !== 'Yaser Arafat')) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ 
              nickname: 'Ser', 
              full_name: 'Yaser Arafat' 
            })
            .eq('id', user.id);
        }
      }
    };
    ensureProfile();

    // Initial quote
    setQuote(getRandomQuote());

    // Auto-rotate every 1 minute (60,000ms)
    const interval = setInterval(() => {
      setQuote(prev => getRandomQuote(prev ?? undefined));
    }, 60000);

    return () => clearInterval(interval);
  }, [profile]); // Added profile dependency to trigger update when data loaded

  return (
    <div className="px-6 pt-3 pb-24 space-y-12">
      {/* GREETING SECTION */}
      <GreetingHeader />

      <div className="relative w-full group z-10">
        
        {/* PREMIUM EMERALD BADGE */}
        <div className="absolute -top-0 left-0 z-20 flex items-center gap-1.5 px-3 py-1 bg-[#00FF85] border-[1.2px] border-black rounded-full shadow-[3px_3px_0px_rgba(0,0,0,1)] translate-y-[-50%]">
          <span className="text-[10px] font-black font-['Outfit'] text-black tracking-tight leading-none">
            Quotes Harian
          </span>
        </div>

        <div className="relative w-full rounded-[24px] border-[1.2px] border-white/10 overflow-hidden shadow-[6px_6px_0px_rgba(0,0,0,1)]">
          <div 
            className="absolute inset-0 z-[-2] transition-transform duration-1000 group-hover:scale-105"
            style={getPrismStyle("minimal-welcome-center")}
          />
          <div className="absolute inset-0 z-[-1] backdrop-blur-[20px] bg-black/45" />

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowInsight(true)}
            className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 border border-white/20 backdrop-blur-md"
          >
            <Icon icon="lucide:info" className="text-white/80" width={14} />
          </motion.button>

          <div className="p-7 px-8 relative min-h-[100px] flex flex-col justify-center items-center text-center">
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-[90%]"
            >
              <p 
                className="text-[17px] leading-[1.8] tracking-normal font-['Outfit'] whitespace-pre-line"
                style={{ wordSpacing: '4px' }}
              >
                {quote ? dynamicHighlight(quote.text.replace(/"/g, '')) : "..." }
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* RING PROGRESS SECTION */}
      <div className="flex gap-4 mt-8">
        <RingProgressCard 
          title="To-Do Hari Ini"
          icon="solar:checklist-bold"
          current={completedTodayCount}
          total={todayTotalCount}
          label="Tugas"
          description={
            todayTotalCount === 0 && uncompletedDelayedCount === 0 ? "Belum ada rencana?" :
            completedTodayCount === todayTotalCount && todayTotalCount > 0 ? "Sempurna! Bos juara!" :
            `${completedTodayCount} Selesai${uncompletedDelayedCount > 0 ? ` • ${uncompletedDelayedCount} Ditunda` : ' • Semangat!'}`
          }
          showWarning={uncompletedDelayedCount > 0}
        />
        <RingProgressCard 
          title="Tugas Hari Ini"
          icon="solar:bolt-circle-bold"
          current={completedHabits}
          total={totalHabits}
          label="Habit"
          description={
            totalHabits === 0 ? "Set habit baru?" :
            completedHabits === totalHabits ? "Konsistensi Elit!" :
            `${completedHabits} Selesai${(habits || []).filter(h => h.skipped).length > 0 ? ` • ${(habits || []).filter(h => h.skipped).length} Skip` : ' • Semangat!'}`
          }
        />
      </div>

      {/* DELAYED TASKS WARNING POPUP */}
      <AnimatePresence>
        {uncompletedDelayedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-[#EF4444]/10 border-[1.5px] border-[#EF4444]/30 rounded-[24px] p-5 flex items-center gap-4 shadow-[0_10px_30px_rgba(239,68,68,0.15)] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#EF4444]/5 rounded-full blur-2xl -mr-12 -mt-12" />
            
            <div className="w-12 h-12 rounded-2xl bg-[#EF4444] border-[1.5px] border-black flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] shrink-0">
              <Icon icon="solar:danger-bold" className="text-white" width={24} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-[14px] font-black text-white leading-none mb-1">Tugas Tertunda!</h4>
              <p className="text-[11px] font-medium text-[#E3DAC9]/60 leading-tight">
                Ada <span className="text-[#EF4444] font-black">{uncompletedDelayedCount} tugas</span> kemarin yang belum Bos selesaikan. Mau diberesin?
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => onTabChange('todo')}
              className="px-4 py-2 bg-white text-black text-[10px] font-black rounded-xl border-[1.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] uppercase tracking-tighter shrink-0"
            >
              CEK
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUOTE INSIGHT MODAL */}
      <AnimatePresence>
        {showInsight && quote && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInsight(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#212121] border-[2px] border-black rounded-[32px] p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)] overflow-hidden"
            >
              {/* Decorative Accent */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00FF85]/10 blur-[50px] rounded-full" />
              
              <div className="relative z-10">
                <div className="space-y-6">
                  {/* ORIGINAL QUOTE - NOW WHITE & REGULAR */}
                  <div>
                    <p className="text-white/90 font-medium font-['Outfit'] text-[16px] leading-[1.5] italic">
                      {quote.text.replace(/"/g, '')}
                    </p>
                  </div>

                  {/* DIVIDER WITH ICON */}
                  <div className="flex items-center gap-4">
                    <div className="h-[1.5px] flex-1 bg-white/10" />
                    <Icon icon="lucide:sparkles" className="text-[#00FF85]/40" width={16} />
                    <div className="h-[1.5px] flex-1 bg-white/10" />
                  </div>

                  {/* MAKNA / EXPLANATION - NOW CLEAN EMERALD LABEL + WHITE TEXT */}
                  <div className="space-y-3">
                    <span className="text-[14px] font-medium text-[#00FF85] font-['Outfit'] tracking-wide block">
                      Makna :
                    </span>
                    <p className="text-[#E3DAC9] font-medium font-['Outfit'] text-[20px] leading-relaxed tracking-tight">
                      {quote.explanation}
                    </p>
                  </div>
                </div>

                <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(20);
                  setShowInsight(false);
                }}
                className="w-full py-4 bg-[#00FF85] text-black font-black font-['Outfit'] rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,1)] border-[2.5px] border-black mt-4 uppercase tracking-tighter"
              >
                TUTUP
              </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
const TodoList = () => <TodoTargetView />;
const Global = () => <GlobalView />;
const Journey = () => <JourneyView />;
const AIView = () => <div />;
const HubView = () => {
  const { profile, isProActive, addDailyPass, addStreakFreeze } = useUserStore();
  const isPro = isProActive();

  return (
    <div className="px-6 py-8 pb-32 space-y-8">
      {/* PROFILE HEADER */}
      <div className="bg-[#222] rounded-[24px] p-6 border-[2px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF85]/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Icon icon="solar:user-bold" width={150} />
        </div>
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-full bg-[#00FF85] border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center rotate-3 overflow-hidden">
            <Icon icon="solar:user-bold" className="text-black" width={32} />
          </div>
          <div>
            <h3 className="text-[24px] font-black text-white tracking-tight leading-none mb-2">
              {profile?.nickname || profile?.full_name || 'Bos InTracker'}
            </h3>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-[1.5px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] ${isPro ? 'bg-[#00FF85] text-black' : 'bg-white/10 text-white/40'}`}>
              <Icon icon={isPro ? 'solar:crown-bold' : 'solar:medal-star-bold'} width={12} />
              <span className="text-[10px] font-black tracking-tight">
                {isPro ? 'Emerald Pro Member' : 'Classic Free Plan'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DAILY PRO PASS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Icon icon="solar:shop-bold" className="text-[#00FF85]" width={18} />
          <h4 className="text-[14px] font-black text-white tracking-tight">Store & Rewards</h4>
        </div>

        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="bg-black border-[2px] border-black rounded-[28px] p-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#00FF85] tracking-tight uppercase">Limited Offer</span>
              <h3 className="text-[18px] font-black text-white tracking-tight">DAILY PRO PASS</h3>
            </div>
            <div className="px-3 py-1.5 bg-[#00FF85] rounded-xl border-[1.5px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <span className="text-[11px] font-black text-black">FREE</span>
            </div>
          </div>
          
          <p className="text-[13px] text-[#E3DAC9]/60 leading-relaxed mb-6 relative z-10">
            Buka semua fitur Pro (Custom AI, Journey Maps, Unlimited Habits) selama 24 jam penuh hanya dengan menonton 1 iklan.
          </p>

          <motion.button 
            whileTap={{ x: 5, y: 5, boxShadow: "0px 0px 0px black" }}
            onClick={async () => {
              if (navigator.vibrate) navigator.vibrate(50);
              await addDailyPass();
            }}
            className="w-full py-4 bg-[#00FF85] text-black font-black tracking-tight text-[13px] rounded-2xl border-[2px] border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-3 relative z-10"
          >
            <Icon icon="solar:play-circle-bold" width={20} />
            AMBIL PRO PASS (ADS)
          </motion.button>
        </motion.div>

        {/* STREAK FREEZE SHOP */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            whileTap={{ x: 4, y: 4, boxShadow: "0px 0px 0px black" }}
            onClick={async () => {
              if (navigator.vibrate) navigator.vibrate(20);
              await addStreakFreeze(1);
            }}
            className="p-5 rounded-[28px] border-[2px] border-black bg-[#222] shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center gap-3 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-black border-[1.5px] border-black flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              <Icon icon="solar:snow-bold" className="text-[#00FF85]" width={24} />
            </div>
            <div>
              <p className="text-[11px] font-black text-white mb-1 uppercase tracking-tighter">Streak Freeze</p>
              <p className="text-[9px] font-black text-[#00FF85] uppercase tracking-widest">1 TICKET (ADS)</p>
            </div>
          </motion.div>
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="p-5 rounded-[28px] border-[2px] border-black bg-black/20 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center gap-3 opacity-50 cursor-not-allowed"
          >
            <div className="w-12 h-12 rounded-xl bg-black/20 border border-white/5 flex items-center justify-center">
              <Icon icon="solar:box-bold" className="text-white/20" width={24} />
            </div>
            <div>
              <p className="text-[11px] font-black text-white/40 mb-1 uppercase tracking-tighter">Coming Soon</p>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">LOCKED</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[14px] font-black text-white/40 tracking-tight px-1">Pro Benefits</h4>
        <div className="space-y-3">
          {[
            { icon: 'solar:magic-stick-bold', title: 'AI Personalized Advice', desc: 'Saran habit dari Rin berdasarkan performamu.' },
            { icon: 'solar:map-bold', title: 'Journey Maps', desc: 'Visualisasi perjalanan hidupmu yang lebih detail.' },
            { icon: 'solar:shield-check-bold', title: 'Unlimited Streak Save', desc: 'Jangan pernah takut kehilangan progress lagi.' }
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-black border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]">
              <div className="w-10 h-10 rounded-xl bg-[#00FF85]/10 border-[1.5px] border-black flex items-center justify-center shrink-0">
                <Icon icon={item.icon} className="text-[#00FF85]" width={20} />
              </div>
              <div>
                <p className="text-[12px] font-black text-white leading-none mb-1 uppercase tracking-tight">{item.title}</p>
                <p className="text-[10px] text-white/50 leading-tight font-medium">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function Beranda({ activeTab: initialTab = 'home' }: { activeTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { habits, fetchHabits, addHabit, totalStreak, completingHabitId, brokenStreaks, rescueStreak } = useHabitStore();
  const { targets, fetchTargets } = useTargetStore();
  const { profile, fetchProfile, useStreakFreeze, isProActive } = useUserStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statsTab, setStatsTab] = useState<'berjalan' | 'selesai' | 'dilewati'>('berjalan');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }
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
        const results = await Promise.allSettled([
          fetchHabits(),
          fetchTargets(),
          fetchProfile()
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
    <div className="min-h-screen bg-[#212121] flex flex-col items-center justify-center p-6">
      <div className="relative">
        {/* Outer Pulsing Ring */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-8 border-[3px] border-[#00FF85] rounded-full"
        />
        {/* Inner Spinning Ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-[4px] border-black border-t-[#00FF85] rounded-full shadow-[0_0_20px_rgba(0,255,133,0.2)]"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon icon="solar:fire-bold" className="text-[#00FF85]" width={24} />
        </div>
      </div>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <h2 className="text-[14px] font-black text-[#00FF85] tracking-tight uppercase tracking-widest">InTracker OS</h2>
        <div className="flex gap-1 mt-2 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-1.5 h-1.5 bg-[#00FF85] rounded-full shadow-[0_0_8px_rgba(0,255,133,0.8)]"
            />
          ))}
        </div>
        <p className="mt-4 text-[10px] font-black text-[#E3DAC9]/30 tracking-tight">Initializing...</p>
      </motion.div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#212121] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-[#FF4B4B] rounded-2xl border-[1.5px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-6">
        <span className="text-4xl">⚠️</span>
      </div>
      <h2 className="text-2xl font-black text-[#E3DAC9] mb-2 tracking-tighter">Waduh, Error Bos!</h2>
      <p className="text-[#E3DAC9]/60 font-medium mb-8 max-w-[250px]">{error}</p>
      <button 
        onClick={() => { setLoading(true); initDashboard(); }}
        className="px-8 py-3 bg-[#00FF85] text-black font-black rounded-xl border-[1.5px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all tracking-tight"
      >
        Coba Lagi
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#212121] text-white font-['Outfit'] flex flex-col overflow-hidden selection:bg-[#00FF85] selection:text-black">
      
      <NavigasiAtas activeTab={activeTab} />

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[70vh] bg-[#00FF85]/2 blur-[150px] rounded-full pointer-events-none z-0" />

      <main 
        ref={mainContentRef}
        className="relative flex-1 overflow-y-auto overflow-x-hidden scroll-smooth pt-[90px]"
      >
        {activeTab === 'habits' && (
          <div className="px-6 mb-8 mt-6">
            <div className="flex items-end justify-between">
              <div className="flex flex-col mt-2">
                <span className="text-[15px] font-black text-[#E3DAC9]/80 font-['Outfit'] tracking-tight mb-2 pl-1">
                  {getDateLabel(selectedDate)}
                </span>
                <h1 className="text-[48px] font-black text-white font-['Outfit'] leading-none tracking-tighter">
                  {selectedDate.getDate()} {getIndonesianMonth(selectedDate)}
                </h1>
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button 
                  whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(d);
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  className="w-12 h-11 rounded-xl flex items-center justify-center text-white bg-[#222] border-[2px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <Icon icon="solar:play-bold" width={14} height={14} className="text-[#00FF85] rotate-180" />
                </motion.button>
                <motion.button 
                  whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(d);
                    if (navigator.vibrate) navigator.vibrate(10);
                  }}
                  className="w-12 h-11 rounded-xl flex items-center justify-center text-white bg-[#222] border-[2px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <Icon icon="solar:play-bold" width={14} height={14} className="text-[#00FF85]" />
                </motion.button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8">
              <div className="flex gap-2">
                {[
                  { id: 'berjalan', label: 'Berjalan', count: habits.filter((h: any) => !h.completed && !h.skipped).length },
                  { id: 'dilewati', label: 'Dilewati', count: habits.filter((h: any) => h.skipped).length },
                  { id: 'selesai', label: 'Selesai', count: habits.filter((h: any) => h.completed).length }
                ].map((item) => (
                  <motion.button 
                    key={item.id}
                    whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(10);
                      setStatsTab(item.id as any);
                    }}
                    className={`
                      px-4 py-2.5 rounded-xl transition-all flex items-start
                      border-[1.5px] border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]
                      ${statsTab === item.id 
                        ? 'bg-[#E3DAC9]' 
                        : 'bg-[#212121]'}
                    `}
                  >
                    <span className={`text-[13px] font-bold font-['Outfit'] tracking-tight ${statsTab === item.id ? 'text-black' : 'text-white/40'}`}>
                      {item.label}
                    </span>
                    <span className={`text-[9px] font-black ml-0.5 mt-[-2px] ${statsTab === item.id ? 'text-black/40' : 'text-white/20'}`}>
                      {item.count}
                    </span>
                  </motion.button>
                ))}
              </div>
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
                onComplete={triggerCompletionAnimation}
              />
            )}
            {activeTab === 'home' && <HomeView onTabChange={setActiveTab} />}
            {activeTab === 'todo' && <TodoList />}
            {activeTab === 'journey' && <Journey />}
            {activeTab === 'global' && <Global />}
            {activeTab === 'ai' && <AIView />}
            {activeTab === 'hub' && <HubView />}
          </motion.div>
        </AnimatePresence>
      </main>

      <NavigasiBawah activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* FLOATING ACTION BUTTON (FAB) */}
      <AnimatePresence>
        {(activeTab === 'home' || activeTab === 'habits' || activeTab === 'todo' || activeTab === 'global') && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9, x: 4, y: 4, boxShadow: "0px 0px 0px black" }}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(20);
              // Langsung buka modal tambah habit jika di home/habits
              if (activeTab === 'home' || activeTab === 'habits') {
                setIsAddModalOpen(true);
              }
              // Tambahkan logika lain jika perlu (misal: modal Todo di tab Todo)
              if (activeTab === 'todo') {
                // Di sini bisa ditambahkan trigger modal todo jika ada
              }
            }}
            className="fixed bottom-28 right-6 w-16 h-16 bg-[#00FF85] border-[2.5px] border-black rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,1)] flex items-center justify-center z-[60]"
          >
            <Icon icon="solar:plus-bold" className="text-black" width={32} />
          </motion.button>
        )}
      </AnimatePresence>

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
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* {brokenStreaks.length > 0 && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#212121] border-[3px] border-[#00FF85] rounded-[32px] p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Icon icon="solar:danger-bold" width={120} className="text-[#00FF85]" />
              </div>

              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-[#FF4B4B] border-[2px] border-black rounded-2xl shadow-[6px_6px_0px_rgba(0,0,0,1)] flex items-center justify-center mx-auto mb-6 rotate-3">
                  <Icon icon="solar:fire-bold" className="text-white" width={40} />
                </div>

                <h2 className="text-[24px] font-black text-white uppercase tracking-tighter leading-tight mb-2">
                  STREAK DALAM BAHAYA!
                </h2>
                <p className="text-[#E3DAC9]/60 font-medium text-[14px] mb-8">
                  Bos bolong satu hari kemarin. Jangan biarkan kerja kerasmu reset ke nol!
                </p>

                <div className="space-y-4">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={async () => {
                      if (navigator.vibrate) navigator.vibrate(50);
                      await rescueStreak(brokenStreaks[0].habitId);
                    }}
                    className="w-full py-4 bg-[#00FF85] text-black font-black uppercase tracking-[0.1em] text-[12px] rounded-2xl border-[1.5px] border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] active:shadow-none transition-all flex items-center justify-center gap-3"
                  >
                    <Icon icon="solar:play-bold" width={18} />
                    Nonton Iklan (15s)
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    disabled={!profile || profile.streak_freeze_count <= 0}
                    onClick={async () => {
                      const success = await useStreakFreeze();
                      if (success) {
                        await rescueStreak(brokenStreaks[0].habitId);
                      }
                    }}
                    className={`w-full py-4 ${profile?.streak_freeze_count ? 'bg-white' : 'bg-white/5'} text-black font-black uppercase tracking-[0.1em] text-[12px] rounded-2xl border-[1.5px] border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] active:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:shadow-none`}
                  >
                    <Icon icon="solar:snow-bold" width={18} />
                    Pakai Tiket Freeze ({profile?.streak_freeze_count || 0})
                  </motion.button>

                  <button 
                    onClick={() => useHabitStore.setState({ brokenStreaks: [] })}
                    className="text-[11px] font-bold text-[#E3DAC9]/30 uppercase tracking-widest mt-4 hover:text-[#FF4B4B] transition-colors"
                  >
                    Biarkan Reset
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )} */}
      </AnimatePresence>
    </div>
  );
};

export default Beranda;
