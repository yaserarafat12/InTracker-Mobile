import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

import Login from './pages/Login.tsx';
import Name from './pages/Name.tsx';
import Questions from './pages/Questions.tsx';
import Notif from './pages/Notif.tsx';
import Location from './pages/Location.tsx';
import Nickname from './pages/Nickname.tsx';
import LoseStreak from './pages/LoseStreak.tsx';
import Beranda from './mainscreen/beranda/Beranda';
import Lab from './pages/Lab.tsx';
import { useUserStore } from './store/useUserStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { startReminderService } from './utils/reminderService';
import './index.css';

// --- GLOBAL THEME INITIALIZATION & OS SYNC ---
const initTheme = () => {
  try {
    const apply = (t: string) => {
      if (t === 'Dark') {
        document.documentElement.classList.add('dark');
      } else if (t === 'Light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System Theme Mode (follows OS settings)
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    // 1. Apply theme on initial startup
    const currentTheme = useUserStore.getState().settings?.theme || 'System';
    apply(currentTheme);

    // 2. Reactively listen to Zustand store updates
    useUserStore.subscribe((state) => {
      const updatedTheme = state.settings?.theme || 'System';
      apply(updatedTheme);
    });

    // 3. Listen to OS changes (when in System theme mode)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      const activeTheme = useUserStore.getState().settings?.theme || 'System';
      if (activeTheme === 'System') {
        if (mediaQuery.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    // 4. Keyboard Shortcut: Ctrl + D to toggle Dark/Light Mode
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault(); // Prevent browser bookmark dialog
        const isCurrentlyDark = document.documentElement.classList.contains('dark');
        const nextTheme = isCurrentlyDark ? 'Light' : 'Dark';
        useUserStore.getState().updateSettings({ theme: nextTheme });
        console.log(`[InTracker] Theme toggled via Ctrl+D to: ${nextTheme}`);
      }
    });
  } catch (error) {
    console.error('[InTracker] Theme synchronizer failed:', error);
  }
};

initTheme();
startReminderService();

// Komponen buat ngecek: Lu udah login apa belum?
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Timeout 5 detik biar gak hang selamanya
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 5000));
        const authCall = supabase.auth.getUser();
        const { data: { user } } = await Promise.race([authCall, timeout]) as any;
        
        if (user) {
          const lastUserId = localStorage.getItem('intracker-last-user-id');
          if (lastUserId && lastUserId !== user.id) {
            console.log('[InTracker] User ID mismatch detected in AuthGuard! Clearing local data safely...');
            // Preserve Supabase session keys so user remains logged in
            const keysToKeep = Object.keys(localStorage).filter(k => k.startsWith('sb-') || k.includes('auth-token'));
            const keptValues: Record<string, string> = {};
            keysToKeep.forEach(k => {
              const val = localStorage.getItem(k);
              if (val) keptValues[k] = val;
            });

            localStorage.clear();

            // Restore Supabase keys
            Object.entries(keptValues).forEach(([k, v]) => localStorage.setItem(k, v));
            localStorage.setItem('intracker-last-user-id', user.id);
            window.location.reload();
            return;
          }
          localStorage.setItem('intracker-last-user-id', user.id);
        }

        setUser(user);
      } catch (err) {
        console.error('[InTracker] AuthGuard error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00FF85]/20 border-t-[#00FF85] rounded-full animate-spin" />
    </div>
  );
  
  // GUEST MODE BYPASS - Always allow if guest_mode is true
  if (localStorage.getItem('guest_mode') === 'true') {
    return <>{children}</>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// --- GUARD: ONBOARDING CHECK ---
const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // GUEST MODE - Never consider onboarding "completed" for guests so they can test flow
        if (localStorage.getItem('guest_mode') === 'true') {
          setIsCompleted(false);
          setLoading(false);
          return;
        }

        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Onboarding timeout')), 5000));
        const authCall = supabase.auth.getUser();
        const { data: { user } } = await Promise.race([authCall, timeout]) as any;

        if (user) {
          const profileCall = supabase.from('profiles').select('onboarding_completed').eq('id', user.id).single();
          const { data } = await Promise.race([profileCall, timeout]) as any;
          setIsCompleted(data?.onboarding_completed || false);
        }
      } catch (err) {
        console.error('[InTracker] OnboardingGuard error:', err);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00FF85]/20 border-t-[#00FF85] rounded-full animate-spin" />
    </div>
  );

  // If already completed, redirect to dashboard (Disabled for developer testing access)
  // if (isCompleted) {
  //   return <Navigate to="/habits" replace />;
  // }

  return <>{children}</>;
};

// --- COMPONENT: ROOT REDIRECT ---
const RootRedirect = () => {
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Root redirect timeout')), 5000));
        const authCall = supabase.auth.getUser();
        const { data: { user } } = await Promise.race([authCall, timeout]) as any;

        if (user) {
          const profileCall = supabase.from('profiles').select('onboarding_completed').eq('id', user.id).single();
          const { data } = await Promise.race([profileCall, timeout]) as any;
          setIsCompleted(data?.onboarding_completed || false);
        }
      } catch (err) {
        console.error('[InTracker] RootRedirect error:', err);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00FF85]/20 border-t-[#00FF85] rounded-full animate-spin" />
    </div>
  );
  
  // IF GUEST MODE -> GO TO ONBOARDING (QUESTIONS/0)
  if (localStorage.getItem('guest_mode') === 'true') {
    return <Navigate to="/questions/0" />;
  }

  if (isCompleted) {
    return <Navigate to="/habits" />;
  }
  
  return <Navigate to="/questions/0" />;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthGuard><RootRedirect /></AuthGuard>,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/lab',
    element: <Lab />,
  },
  {
    path: '/name',
    element: <AuthGuard><OnboardingGuard><Navigate to="/questions/1" replace /></OnboardingGuard></AuthGuard>,
  },
  {
    path: '/nickname',
    element: <AuthGuard><OnboardingGuard><Navigate to="/questions/2" replace /></OnboardingGuard></AuthGuard>,
  },
  {
    path: '/questions',
    element: <AuthGuard><OnboardingGuard><Questions /></OnboardingGuard></AuthGuard>,
  },
  {
    path: '/questions/:step',
    element: <AuthGuard><OnboardingGuard><Questions /></OnboardingGuard></AuthGuard>,
  },
  {
    path: '/notif',
    element: <AuthGuard><OnboardingGuard><Notif /></OnboardingGuard></AuthGuard>,
  },
  {
    path: '/location',
    element: <AuthGuard><OnboardingGuard><Location /></OnboardingGuard></AuthGuard>,
  },
  {
    path: '/dashboard',
    element: <Navigate to="/habits" replace />,
  },
  {
    path: '/habit',
    element: <Navigate to="/habits" replace />,
  },
  {
    path: '/todo',
    element: <Navigate to="/todolist" replace />,
  },
  {
    path: '/beranda',
    element: <Navigate to="/habits" replace />,
  },
  {
    path: '/habits',
    element: <AuthGuard><Beranda activeTab="habits" /></AuthGuard>,
  },
  {
    path: '/todolist',
    element: <AuthGuard><Beranda activeTab="todo" /></AuthGuard>,
  },
  {
    path: '/stats',
    element: <Navigate to="/analytics" replace />,
  },
  {
    path: '/analytics',
    element: <AuthGuard><Beranda activeTab="analytics" /></AuthGuard>,
  },
  {
    path: '/journey',
    element: <AuthGuard><Beranda activeTab="journey" /></AuthGuard>,
  },
  {
    path: '/global',
    element: <AuthGuard><Beranda activeTab="global" /></AuthGuard>,
  },
  {
    path: '/summary',
    element: <AuthGuard><Beranda activeTab="summary" /></AuthGuard>,
  },
  {
    path: '/ai',
    element: <AuthGuard><Beranda activeTab="ai" /></AuthGuard>,
  },
  {
    path: '/features',
    element: <AuthGuard><Beranda activeTab="features" /></AuthGuard>,
  },
  {
    path: '/losestreak',
    element: <AuthGuard><LoseStreak /></AuthGuard>,
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
]);

console.log('[InTracker] main.tsx reached bottom - about to mount React');

try {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<p style="color:#00FF85;padding:20px">React mounting...</p>';
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </React.StrictMode>,
    );
    console.log('[InTracker] ReactDOM.createRoot().render() called successfully');
  } else {
    console.error('[InTracker] root element not found!');
  }
} catch (e) {
  console.error('[InTracker] FATAL mount error:', e);
  const root = document.getElementById('root');
  if (root) root.innerHTML = '<pre style="color:red;padding:20px;background:#111">' + (e as any)?.stack + '</pre>';
}
