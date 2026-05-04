import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [view, setView] = useState<'initial' | 'email'>('initial');

  useEffect(() => {
    // Kalau masuk ke Login, kita reset guest mode dulu biar gak terjebak
    localStorage.removeItem('guest_mode');
    console.log("Login: Automatic redirect disabled for testing.");
  }, [navigate]);

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleApple = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Link login telah dikirim ke emailmu!');
      setTimeout(() => setView('initial'), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-['Inter'] relative flex flex-col overflow-hidden select-none">
      
      {/* 1. BACKGROUND VISUAL */}
      <div className="absolute top-0 left-0 w-full h-[75vh] z-0 overflow-hidden">
        <motion.img
          key="bg-png-fixed"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" as const }}
          src="/antigravitybg/1.png" 
          className="w-full h-full object-cover object-[center_12vh]" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
      </div>

      {/* 1.5 INVISIBLE GUEST MODE BUTTON */}
      <button 
        onClick={() => {
          localStorage.setItem('guest_mode', 'true');
          navigate('/name');
        }}
        className="absolute top-0 right-0 w-24 h-24 z-[100] opacity-0 cursor-default"
        title="Guest Mode"
      />

      {/* 2. INTERACTIVE CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end w-full max-w-[450px] mx-auto px-10 pb-[env(safe-area-inset-bottom,40px)]">
        
        <AnimatePresence mode="wait">
          {view === 'initial' ? (
            <motion.div
              key="initial-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <div className="text-center mb-[5vh]">
                <h1 className="text-[24px] font-medium leading-[1.3] tracking-tight text-white/95 font-['Outfit']">
                  Mulailah perjalananmu<br />
                  dengan <span className="text-[#00FF85] font-semibold">semua usahamu.</span>
                </h1>
              </div>

              <div className="w-full flex flex-col gap-[1.2vh] mb-[2vh]">
                {/* APPLE LOGIN */}
                <button
                  onClick={handleApple}
                  className="w-full flex items-center justify-center gap-3 py-[14px] rounded-xl bg-white active:scale-[0.97] transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="black">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.27.07 2.15.62 2.88.65.95-.17 1.85-.77 2.9-.7 1.23.1 2.15.58 2.75 1.45-2.5 1.5-1.85 4.76.5 5.7-.42 1.2-.98 2.36-1.03 5.76zm-5.35-13.1c-.08-2.26 1.68-4.2 3.98-4.48.27 2.56-2.25 4.7-3.98 4.48z" />
                  </svg>
                  <span className="text-[14px] font-extrabold text-black tracking-tight font-['Outfit']">Lanjutkan dengan Apple</span>
                </button>

                {/* GOOGLE LOGIN */}
                <button
                  onClick={handleGoogle}
                  className="w-full flex items-center justify-center gap-3 py-[14px] rounded-xl bg-[#1a1a1a] border border-white/10 active:scale-[0.97] transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.21-3.21C17.39 1.54 14.92 1 12 1 7.31 1 3.28 3.69 1.42 7.61l3.77 2.92C6.09 7.42 8.81 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.83-.07-1.63-.2-2.39H12v4.51h6.44c-.28 1.48-1.11 2.73-2.37 3.58l3.69 2.87c2.16-1.99 3.41-4.91 3.41-8.57z" />
                    <path fill="#FBBC05" d="M5.19 14.54a7.28 7.28 0 0 1 0-5.08L1.42 6.54c-.81 1.62-1.42 3.42-1.42 5.46s.61 3.84 1.42 5.46l3.77-2.92z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.47-.98 7.28-2.66l-3.69-2.87c-1 .67-2.28 1.07-3.59 1.07-3.19 0-5.91-2.38-6.81-5.49l-3.77 2.92C3.28 20.31 7.31 23 12 23z" />
                  </svg>
                  <span className="text-[14px] font-bold text-white tracking-tight">Lanjutkan dengan Google</span>
                </button>

                {/* EMAIL LOGIN */}
                <button
                  onClick={() => setView('email')}
                  className="w-full flex items-center justify-center gap-3 py-[14px] rounded-xl bg-[#1a1a1a] border border-white/10 active:scale-[0.97] transition-all"
                >
                  <Icon icon="solar:letter-bold" width={18} height={18} className="text-[#00FF85]" />
                  <span className="text-[14px] font-bold text-white tracking-tight">Lanjutkan dengan Email</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="email-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <button 
                onClick={() => setView('initial')}
                className="flex items-center gap-2 text-white/40 mb-6 hover:text-[#00FF85] transition-colors"
              >
                <Icon icon="solar:alt-arrow-left-bold" width={20} height={20} />
                <span className="text-[14px] font-medium">Kembali</span>
              </button>

              <div className="mb-8">
                <h2 className="text-[26px] font-bold font-['Outfit'] mb-2 text-white">Login Email</h2>
                <p className="text-[13px] text-white/50">Masukan email anda untuk menerima link login.</p>
              </div>

              <form onSubmit={handleEmailLogin} className="w-full flex flex-col gap-4">
                <input
                  autoFocus
                  type="email"
                  placeholder="Contoh: yaser@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/20 rounded-xl py-4 px-6 text-[15px] outline-none focus:border-[#00FF85] focus:shadow-[0_0_20px_rgba(0,255,133,0.15)] transition-all placeholder:text-white/40"
                />
                <button
                  type="submit"
                  disabled={loading || !email}
                  className={`w-full flex items-center justify-center gap-3 py-[16px] rounded-xl font-bold text-[14px] transition-all ${
                    loading || !email 
                    ? 'bg-white/5 text-white/20 cursor-not-allowed' 
                    : 'bg-[#00FF85] text-black shadow-[0_0_20px_rgba(0,255,133,0.2)]'
                  }`}
                >
                  {loading ? 'Mengirim...' : 'Kirim Link Login'}
                  {!loading && <Icon icon="solar:arrow-right-bold" width={18} height={18} />}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* NOTIFICATIONS */}
      <AnimatePresence>
        {(error || message) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-[10vh] left-1/2 -translate-x-1/2 bg-[#1a1a1a]/90 border border-white/10 px-8 py-3 rounded-2xl backdrop-blur-xl z-[60] shadow-2xl flex items-center gap-3"
          >
            <div className={`w-2 h-2 rounded-full animate-pulse ${error ? 'bg-red-500' : 'bg-[#00FF85]'}`} />
            <p className="text-[12px] text-white/90 font-medium tracking-tight">{error || message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

