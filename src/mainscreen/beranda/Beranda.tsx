import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { NavigasiBawah } from '../NavigasiBawah';
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

// --- HELPERS ---
const getIndonesianDay = (date: Date) => {
  const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  return days[date.getDay()];
};

const getIndonesianMonth = (date: Date) => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
  return months[date.getMonth()];
};

const getDateLabel = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'HARI INI';
  if (diffDays === -1) return 'KEMARIN';
  if (diffDays === 1) return 'BESOK';
  return getIndonesianDay(date);
};

// --- SUB-VIEWS ---
// --- HELPERS ---
const dynamicHighlight = (text: string) => {
  const words = text.split(' ');
  if (words.length <= 1) return text;
  
  // Logic: Cari kata terpanjang sebagai "key word" untuk di-highlight
  let longestIndex = 0;
  for (let i = 1; i < words.length; i++) {
    const currentLen = words[i].replace(/[.,!]/g, '').length;
    const longestLen = words[longestIndex].replace(/[.,!]/g, '').length;
    if (currentLen > longestLen) longestIndex = i;
  }

  return words.map((word, i) => {
    if (i === longestIndex) {
      return (
        <span key={i} className="text-white font-[900]">
          {word}{' '}
        </span>
      );
    }
    return <span key={i} className="text-[#E3DAC9]/70 font-medium">{word} </span>;
  });
};

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
      whileTap={{ scale: 0.98 }}
      className="relative flex-1 min-h-[175px] rounded-[20px] border-[1.2px] border-white/10 bg-black/45 backdrop-blur-[20px] p-4 shadow-[6px_6px_0px_rgba(0,0,0,1)] overflow-hidden group"
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
            <span className="text-[10px] font-black font-['Outfit'] text-[#E3DAC9]/40 uppercase tracking-[0.15em]">
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
            <span className="text-[9px] font-bold font-['Outfit'] text-[#E3DAC9]/40 uppercase mt-1">
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

const HomeView = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [showInsight, setShowInsight] = useState(false);
  
  // Data Logic
  const { targets, fetchTargets } = useTargetStore();
  const { habits, fetchHabits } = useHabitStore();

  // 1. To-Do Hari Ini Stats
  const { completedTargets, totalTargets, delayedCount } = useMemo(() => {
    const safeTargets = targets || [];
    const today = safeTargets.filter(t => t.window === 'today');
    const delayed = safeTargets.filter(t => t.window === 'delayed').length;
    const completed = today.filter(t => t.completed).length;
    return { 
      completedTargets: completed, 
      totalTargets: today.length,
      delayedCount: delayed
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

    // Initial quote
    setQuote(getRandomQuote());

    // Auto-rotate every 1 minute (60,000ms)
    const interval = setInterval(() => {
      setQuote(prev => getRandomQuote(prev ?? undefined));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-6 py-6 pb-24 space-y-6">
      {/* GREETING SECTION */}
      <div className="flex flex-col gap-1 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-[#00FF85] uppercase tracking-[0.2em] bg-black border border-[#00FF85]/30 px-2 py-0.5 rounded">
            LEVEL 1
          </span>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>
        <h2 className="text-2xl font-black text-[#E3DAC9] uppercase tracking-tighter">
          HALO, <span className="text-[#00FF85]">{profile?.nickname || 'BOSS'}</span>!
        </h2>
      </div>

      <div className="relative w-full group z-10">
        
        {/* PREMIUM EMERALD BADGE */}
        <div className="absolute -top-0 left-0 z-20 flex items-center gap-1.5 px-3 py-1 bg-[#00FF85] border-[1.2px] border-black rounded-full shadow-[3px_3px_0px_rgba(0,0,0,1)] translate-y-[-50%]">
          <span className="text-[9px] font-black font-['Outfit'] text-black tracking-[0.1em] uppercase leading-none">
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
          current={completedTargets}
          total={totalTargets}
          label="Tugas"
          description={
            totalTargets === 0 && delayedCount === 0 ? "Belum ada rencana?" :
            completedTargets === totalTargets && totalTargets > 0 ? "Sempurna! Boss juara!" :
            `${completedTargets} Selesai${delayedCount > 0 ? ` • ${delayedCount} Ditunda` : ' • Semangat!'}`
          }
          showWarning={delayedCount > 0}
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
              className="relative w-full max-w-sm bg-[#1A1A1A] border-[2px] border-black rounded-[32px] p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)] overflow-hidden"
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
                    <p className="text-[#E3DAC9] font-medium font-['Outfit'] text-[18px] leading-[1.5]">
                      {quote.explanation}
                    </p>
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowInsight(false)}
                  className="w-full mt-10 py-4 bg-[#00FF85] text-black font-black font-['Outfit'] uppercase tracking-[0.2em] text-[11px] rounded-2xl border-[1.5px] border-black shadow-[5px_5px_0px_rgba(0,0,0,1)] active:shadow-none transition-all"
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
      <div className="relative p-6 rounded-[32px] border-[1.5px] border-white/10 bg-black/45 backdrop-blur-xl overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Icon icon="solar:user-bold" width={150} />
        </div>
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-[#00FF85] border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center rotate-3">
            <Icon icon="solar:user-bold" className="text-black" width={32} />
          </div>
          <div>
            <h3 className="text-[20px] font-black text-white uppercase tracking-tight leading-none mb-1">
              {profile?.nickname || profile?.full_name || 'Boss InTracker'}
            </h3>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] ${isPro ? 'bg-[#00FF85] text-black' : 'bg-white/10 text-white/40'}`}>
              <Icon icon={isPro ? 'solar:crown-bold' : 'solar:medal-star-bold'} width={12} />
              <span className="text-[10px] font-black uppercase tracking-wider">
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
          <h4 className="text-[14px] font-black text-white uppercase tracking-widest">Store & Rewards</h4>
        </div>

        <motion.div 
          whileTap={{ scale: 0.98 }}
          className="relative p-6 rounded-[32px] border-[1.5px] border-[#00FF85] bg-gradient-to-br from-[#00FF85]/10 to-transparent overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,1)]"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-[#00FF85] uppercase tracking-[0.2em]">Limited Offer</span>
                <h3 className="text-[18px] font-black text-white uppercase tracking-tight">Daily Pro Pass</h3>
              </div>
              <div className="px-3 py-1.5 bg-black rounded-xl border border-[#00FF85]/30">
                <span className="text-[11px] font-bold text-[#00FF85]">FREE</span>
              </div>
            </div>
            
            <p className="text-[13px] text-[#E3DAC9]/60 leading-relaxed mb-6">
              Buka semua fitur Pro (Custom AI, Journey Maps, Unlimited Habits) selama 24 jam penuh hanya dengan menonton 1 iklan.
            </p>

            <button 
              onClick={async () => {
                if (navigator.vibrate) navigator.vibrate(50);
                await addDailyPass();
              }}
              className="w-full py-4 bg-[#00FF85] text-black font-black uppercase tracking-[0.15em] text-[12px] rounded-2xl border-[1.5px] border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] active:shadow-none transition-all flex items-center justify-center gap-3"
            >
              <Icon icon="solar:play-circle-bold" width={20} />
              AMBIL PRO PASS (ADS)
            </button>
          </div>
        </motion.div>

        {/* STREAK FREEZE SHOP */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              await addStreakFreeze(1);
            }}
            className="p-5 rounded-[28px] border-[1.5px] border-white/10 bg-black/45 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Icon icon="solar:snow-bold" className="text-white" width={24} />
            </div>
            <div>
              <p className="text-[11px] font-black text-white uppercase mb-1">Streak Freeze</p>
              <p className="text-[9px] font-medium text-white/40 uppercase">Get 1 Ticket (Ads)</p>
            </div>
          </motion.div>

          <div className="p-5 rounded-[28px] border-[1.5px] border-white/10 bg-black/45 shadow-[6px_6px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center gap-3 opacity-40">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Icon icon="solar:star-bold" className="text-white" width={24} />
            </div>
            <div>
              <p className="text-[11px] font-black text-white uppercase mb-1">Referral</p>
              <p className="text-[9px] font-medium text-white/40 uppercase">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>

      {/* PRO FEATURES PREVIEW */}
      <div className="space-y-4">
        <h4 className="text-[14px] font-black text-white/40 uppercase tracking-widest px-1">Pro Benefits</h4>
        <div className="space-y-3">
          {[
            { icon: 'solar:magic-stick-bold', title: 'AI Personalized Advice', desc: 'Saran habit dari Rin berdasarkan performamu.' },
            { icon: 'solar:map-bold', title: 'Journey Maps', desc: 'Visualisasi perjalanan hidupmu yang lebih detail.' },
            { icon: 'solar:shield-check-bold', title: 'Unlimited Streak Save', desc: 'Jangan pernah takut kehilangan progress lagi.' }
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
              <Icon icon={item.icon} className="text-[#00FF85]/60" width={20} />
              <div>
                <p className="text-[12px] font-bold text-white leading-none mb-1">{item.title}</p>
                <p className="text-[10px] text-white/40 leading-tight">{item.desc}</p>
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
  const triggerCompletionAnimation = () => {
    if (navigator.vibrate) navigator.vibrate([30, 100, 30]);
  };

  const initDashboard = async () => {
    try {
      setError(null);
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('[InTracker] Auth error:', authError.message);
        setError("Sesi Boss berakhir. Silakan login ulang.");
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
          setError("Gagal ngambil data dari markas, Boss. Coba cek internet.");
        }
      } else {
        setError("Boss belum login nih.");
      }
    } catch (err) {
      console.error('[InTracker] Dashboard init crash:', err);
      setError("Aplikasi agak error dikit, Boss. Rin coba benerin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initDashboard();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-6">
      <div className="relative">
        {/* Outer Pulsing Ring */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-8 border-[1.5px] border-[#00FF85] rounded-full blur-sm"
        />
        {/* Inner Spinning Ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-[3px] border-[#00FF85]/10 border-t-[#00FF85] rounded-full shadow-[0_0_15px_rgba(0,255,133,0.3)]"
        />
      </div>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-10 text-center"
      >
        <h2 className="text-[14px] font-black text-[#00FF85] tracking-[0.3em] uppercase">InTracker OS</h2>
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
        <p className="mt-4 text-[10px] font-bold text-[#E3DAC9]/30 tracking-widest uppercase">Initializing...</p>
      </motion.div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-[#FF4B4B] rounded-2xl border-[1.5px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-6">
        <span className="text-4xl">⚠️</span>
      </div>
      <h2 className="text-2xl font-black text-[#E3DAC9] mb-2 uppercase tracking-tighter">Waduh, Error Boss!</h2>
      <p className="text-[#E3DAC9]/60 font-medium mb-8 max-w-[250px]">{error}</p>
      <button 
        onClick={() => { setLoading(true); initDashboard(); }}
        className="px-8 py-3 bg-[#00FF85] text-black font-black rounded-xl border-[1.5px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase tracking-tighter"
      >
        Coba Lagi
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white font-['Outfit'] flex flex-col overflow-hidden selection:bg-[#00FF85] selection:text-black">
      
      {/* TOP STATUS BAR (DYNAMIC HEADER) */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-[#121212]/90 backdrop-blur-xl border-b-[1.5px] border-[#E3DAC9]/20 px-6 pt-6 pb-4 flex justify-between items-end h-[100px] shadow-lg shadow-black/40">
        {activeTab === 'home' ? (
          <>
            <div className="flex items-center gap-2 bg-gradient-to-br from-[#FF4D00] to-[#E63900] pl-4 pr-8 py-2.5 rounded-xl border border-white/10 shadow-lg shadow-[#FF4D00]/20 transition-transform active:scale-95">
              <Icon icon="solar:fire-bold" width={24} height={24} className="text-white" />
              <span className="text-[15px] font-bold font-['Outfit'] text-white">{totalStreak}</span>
            </div>

            <AmbientPlayer />
          </>
        ) : (
          <div className="flex justify-between items-center w-full h-full pt-4">
            {/* KIRI: Judul + Superscript Icon */}
            <div className="flex items-center">
              <div className="relative inline-flex flex-col items-start">
                <h2 className="text-[32px] font-black font-['Outfit'] text-white tracking-tighter leading-none mt-1">
                  {(activeTab === 'beranda' || activeTab === 'habits') && 'Habit Tracker'}
                  {activeTab === 'todo' && 'To-Do List'}
                  {activeTab === 'journey' && 'Journey'}
                  {activeTab === 'analytics' && 'Analytics'}
                  {activeTab === 'hub' && 'The Hub'}
                  {activeTab === 'global' && 'Global'}
                  {activeTab === 'ai' && 'AI Assistant'}
                </h2>
                <div className="h-[2.5px] w-full bg-[#00FF85] mt-1.5 rounded-full shadow-[0_0_8px_rgba(0,255,133,0.5)]" />
                
                {/* INTEGRATED SUPERSCRIPT ICON - IMAGE 2 STYLE */}
                <div className="absolute -right-[18px] top-[-8px] w-6 h-6 rounded-[5px] bg-[#1A1A1A] border border-white/20 flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] rotate-[12deg] z-10">
                  <Icon 
                    icon={
                      (activeTab === 'beranda' || activeTab === 'habits') ? 'solar:checklist-minimalistic-bold' :
                      activeTab === 'todo' ? 'solar:target-bold' :
                      activeTab === 'journey' ? 'solar:compass-bold' :
                      activeTab === 'global' ? 'solar:globus-bold' :
                      activeTab === 'ai' ? 'solar:chat-round-dots-bold' :
                      activeTab === 'hub' ? 'solar:menu-dots-bold' : 'solar:box-bold'
                    } 
                    width={14} height={14} className="text-white" 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <AmbientPlayer />
            </div>
          </div>
        )}
      </div>

      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-[70vh] bg-[#00FF85]/2 blur-[150px] rounded-full pointer-events-none z-0" />

      <main className="relative flex-1 overflow-y-auto overflow-x-hidden scroll-smooth pt-[130px]">
        {activeTab === 'habits' && (
          <div className="px-6 mb-8">
            <div className="flex items-end justify-between">
              <div className="flex flex-col mt-2">
                <span className="text-[13px] font-black text-[#E3DAC9]/80 font-['Outfit'] uppercase tracking-[0.2em] mb-1.5 pl-1">
                  {getDateLabel(selectedDate)}
                </span>
                <h1 className="text-[40px] font-black text-white font-['Outfit'] leading-none uppercase tracking-tighter">
                  {selectedDate.getDate()} {getIndonesianMonth(selectedDate)}
                </h1>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(d);
                  }}
                  className="w-12 h-10 rounded-xl flex items-center justify-center text-white bg-[#121212]/80 backdrop-blur-md border border-[#E3DAC9]/20 shadow-lg shadow-black/20 active:scale-95 transition-all hover:bg-white/5"
                >
                  <Icon icon="solar:play-bold" width={14} height={14} className="text-white/80 rotate-180" />
                </button>
                <button 
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(d);
                  }}
                  className="w-12 h-10 rounded-xl flex items-center justify-center text-white bg-[#121212]/80 backdrop-blur-md border border-[#E3DAC9]/20 shadow-lg shadow-black/20 active:scale-95 transition-all hover:bg-white/5"
                >
                  <Icon icon="solar:play-bold" width={14} height={14} className="text-white/80" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8">
              <div className="flex gap-2">
                {[
                  { id: 'berjalan', label: 'Berjalan', count: habits.filter((h: any) => !h.completed && !h.skipped).length },
                  { id: 'dilewati', label: 'Dilewati', count: habits.filter((h: any) => h.skipped).length },
                  { id: 'selesai', label: 'Selesai', count: habits.filter((h: any) => h.completed).length }
                ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => setStatsTab(item.id as any)}
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

              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="h-10 w-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all border-[1.5px] border-white/10 hover:border-white/40 group relative z-50"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M12 4V20M4 12H20" 
                    stroke="white" 
                    strokeWidth="4" 
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
                onComplete={triggerCompletionAnimation}
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

      <NavigasiBawah activeTab={activeTab} setActiveTab={setActiveTab} />

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
        {brokenStreaks.length > 0 && (
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
              className="relative w-full max-w-sm bg-[#1A1A1A] border-[3px] border-[#00FF85] rounded-[32px] p-8 shadow-[12px_12px_0px_rgba(0,0,0,1)] overflow-hidden"
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
                  Boss bolong satu hari kemarin. Jangan biarkan kerja kerasmu reset ke nol!
                </p>

                <div className="space-y-4">
                  {/* OPTION 1: ADS (FREE) */}
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={async () => {
                      // Logic Nonton Iklan (Simulasi)
                      if (navigator.vibrate) navigator.vibrate(50);
                      await rescueStreak(brokenStreaks[0].habitId);
                    }}
                    className="w-full py-4 bg-[#00FF85] text-black font-black uppercase tracking-[0.1em] text-[12px] rounded-2xl border-[1.5px] border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] active:shadow-none transition-all flex items-center justify-center gap-3"
                  >
                    <Icon icon="solar:play-bold" width={18} />
                    Nonton Iklan (15s)
                  </motion.button>

                  {/* OPTION 2: FREEZE TICKET */}
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
        )}
      </AnimatePresence>
    </div>
  );
};

export default Beranda;
