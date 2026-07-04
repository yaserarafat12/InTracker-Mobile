import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  full_name: string | null;
  is_pro: boolean;
  pro_until: string | null;
  streak_freeze_count: number;
  nickname: string | null;
  onboarding_completed: boolean;
  streak_count: number;
  last_login_date: string | null;
  created_at: string;
}

export interface UserSettings {
  firstName: string;
  lastName: string;
  nickname: string;
  username: string;
  email: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  dob: string;
  weight: string;
  height: string;
  country: string;
  appleHealth: boolean;
  garminConnect: boolean;
  fitbit: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string;
  weeklySummary: boolean;
  newFeatures: boolean;
  twoFactor: boolean;
  biometricLogin: boolean;
  language: string;
  theme: 'System' | 'Light' | 'Dark';
  weightUnit: 'Metric' | 'Imperial';
  heightUnit: 'Metric' | 'Imperial';
  timezone: string;
  programPaused: boolean;
  pausedDays?: string[];
  programDuration?: 30 | 60 | 90;
  avatarUrl?: string;
}

interface UserStore {
  profile: UserProfile | null;
  loading: boolean;
  settings: UserSettings;
  subscriptionPlan: 'free' | 'weekly' | 'monthly' | 'annual';
  isProActive: () => boolean;
  fetchProfile: () => Promise<void>;
  claimTrial: () => Promise<void>;
  addDailyPass: () => Promise<void>;
  useStreakFreeze: () => Promise<boolean>;
  addStreakFreeze: (count: number) => Promise<void>;
  updateDailyStreak: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => void;
  setSubscriptionPlan: (plan: 'free' | 'weekly' | 'monthly' | 'annual') => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      profile: null,
      loading: false,
      settings: {
        firstName: '',
        lastName: '',
        nickname: '',
        username: '',
        email: '',
        gender: '',
        dob: '',
        weight: '',
        height: '',
        country: '',
        appleHealth: false,
        garminConnect: false,
        fitbit: false,
        dailyReminder: false,
        dailyReminderTime: '08:00 AM',
        weeklySummary: false,
        newFeatures: false,
        twoFactor: false,
        biometricLogin: false,
        language: '',
        theme: 'System',
        weightUnit: 'Metric',
        heightUnit: 'Metric',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta',
        programPaused: false,
        pausedDays: [],
        programDuration: 90,
        avatarUrl: '',
      },
      subscriptionPlan: 'free',
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...newSettings,
          },
        }));
      },
      setSubscriptionPlan: (plan) => {
        set({ subscriptionPlan: plan });
        const isPro = plan !== 'free';
        const profile = get().profile;
        if (profile) {
          set({ profile: { ...profile, is_pro: isPro } });
          void supabase.from('profiles').update({ is_pro: isPro }).eq('id', profile.id);
        }
      },

      isProActive: () => {
        const { profile } = get();
        if (!profile) return false;
        if (profile.is_pro) return true;
        if (profile.pro_until) {
          return new Date(profile.pro_until) > new Date();
        }
        return false;
      },

       fetchProfile: async () => {
        if (localStorage.getItem('guest_mode') === 'true') {
          const currentProfile = get().profile;
          if (!currentProfile) {
            const guestJoinedDate = new Date();
            set({
              profile: {
                id: 'guest-id',
                full_name: 'Guest User',
                is_pro: false,
                pro_until: null,
                streak_freeze_count: 0,
                nickname: 'guest',
                onboarding_completed: true,
                streak_count: 0,
                last_login_date: new Date().toISOString().split('T')[0],
                created_at: guestJoinedDate.toISOString()
              }
            });
          }
          set({ loading: false });
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const lastUserId = localStorage.getItem('intracker-last-user-id');
        const currentProfile = get().profile;
        const hasUserChanged = (lastUserId && lastUserId !== user.id) || (currentProfile && currentProfile.id !== user.id);

        if (hasUserChanged) {
          console.log("[InTracker] User changed! Clearing local storage safely...");
          const keysToKeep = Object.keys(localStorage).filter(k => k.startsWith('sb-') || k.includes('auth-token'));
          const keptValues: Record<string, string> = {};
          keysToKeep.forEach(k => {
            const val = localStorage.getItem(k);
            if (val) keptValues[k] = val;
          });

          localStorage.clear();

          Object.entries(keptValues).forEach(([k, v]) => localStorage.setItem(k, v));
          localStorage.setItem('intracker-last-user-id', user.id);
          window.location.reload();
          return;
        }
        localStorage.setItem('intracker-last-user-id', user.id);

        set({ loading: true });
        
        // Pre-populate email and default name from auth if local settings are empty
        const currentSettings = get().settings;
        const updatedEmail = currentSettings.email || user.email || '';
        let fullName = user.user_metadata?.full_name || '';
        if (fullName.toLowerCase().includes('yaser') || fullName.toLowerCase().includes('arafat')) {
          fullName = 'Yaman Dien';
        }
        const updatedFirstName = currentSettings.firstName || fullName.split(' ')[0] || '';
        const updatedLastName = currentSettings.lastName || fullName.split(' ').slice(1).join(' ') || '';
        const updatedNickname = currentSettings.nickname || fullName.split(' ')[0] || '';
        const updatedUsername = currentSettings.username || user.user_metadata?.name || fullName.split(' ')[0]?.toLowerCase() || '';
        
        set((state) => ({
          settings: {
            ...state.settings,
            email: updatedEmail,
            firstName: updatedFirstName,
            lastName: updatedLastName,
            nickname: updatedNickname,
            username: updatedUsername,
          }
        }));

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          const profileData = data as UserProfile;
          if (profileData.full_name && (profileData.full_name.toLowerCase().includes('yaser') || profileData.full_name.toLowerCase().includes('arafat'))) {
            profileData.full_name = 'Yaman Dien';
          }
          if (!profileData.created_at && user.created_at) {
            profileData.created_at = user.created_at;
            // Sync fallback to DB
            void supabase.from('profiles').update({ created_at: user.created_at }).eq('id', user.id);
          }
          set({ profile: profileData });
          
          const isPro = data.is_pro || (data.pro_until && new Date(data.pro_until) > new Date());
          if (!isPro) {
            set({ subscriptionPlan: 'free' });
          } else if (get().subscriptionPlan === 'free') {
            set({ subscriptionPlan: 'monthly' });
          }

          // Sync database values to settings (database nickname -> username, database full_name -> nickname)
          let dbFullName = data.full_name || '';
          if (dbFullName.toLowerCase().includes('yaser') || dbFullName.toLowerCase().includes('arafat')) {
            dbFullName = 'Yaman Dien';
          }
          set((state) => ({
            settings: {
              ...state.settings,
              username: data.nickname || state.settings.username || '',
              nickname: dbFullName || state.settings.nickname || '',
              avatarUrl: data.avatar_url || state.settings.avatarUrl || '',
            }
          }));

          // Update login streak
          await get().updateDailyStreak();

          // --- AUTO TRIAL LOGIC (The "Trap Manis") ---
          // If never had pro_until and not pro, give 7 days trial
          if (!data.pro_until && !data.is_pro) {
            console.log("[InTracker] New user detected. Deploying 7-day trial trap...");
            await get().claimTrial();
          }
        }
        set({ loading: false });
      },

      claimTrial: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            pro_until: sevenDaysLater.toISOString(),
            streak_freeze_count: 3 // Bonus 3 freeze for trial
          })
          .eq('id', user.id)
          .select()
          .single();

        if (!error && data) {
          set({ profile: data as UserProfile });
        }
      },

      addDailyPass: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const currentProUntil = get().profile?.pro_until;
        const baseDate = currentProUntil && new Date(currentProUntil) > new Date() 
          ? new Date(currentProUntil) 
          : new Date();
        
        const oneDayLater = new Date(baseDate);
        oneDayLater.setHours(oneDayLater.getHours() + 24);

        const { data, error } = await supabase
          .from('profiles')
          .update({ pro_until: oneDayLater.toISOString() })
          .eq('id', user.id)
          .select()
          .single();

        if (!error && data) {
          set({ profile: data as UserProfile });
        }
      },

      useStreakFreeze: async () => {
        const { profile } = get();
        if (!profile || profile.streak_freeze_count <= 0) return false;

        const { data, error } = await supabase
          .from('profiles')
          .update({ streak_freeze_count: profile.streak_freeze_count - 1 })
          .eq('id', profile.id)
          .select()
          .single();

        if (!error && data) {
          set({ profile: data as UserProfile });
          return true;
        }
        return false;
      },

      addStreakFreeze: async (count: number) => {
        const { profile } = get();
        if (!profile) return;

        const { data, error } = await supabase
          .from('profiles')
          .update({ streak_freeze_count: (profile.streak_freeze_count || 0) + count })
          .eq('id', profile.id)
          .select()
          .single();

        if (!error && data) {
          set({ profile: data as UserProfile });
        }
      },

      updateDailyStreak: async () => {
        const { profile } = get();
        if (!profile) return;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        // Jika sudah login hari ini, jangan update apa-apa
        if (profile.last_login_date === todayStr) return;

        let newStreak = (profile.streak_count || 0);
        const lastLogin = profile.last_login_date ? new Date(profile.last_login_date) : null;
        
        if (!lastLogin) {
          // Pertama kali login
          newStreak = 1;
        } else {
          // Reset jam ke 0 untuk perbandingan hari
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (profile.last_login_date === yesterdayStr) {
            // Login berurutan (kemarin login)
            newStreak += 1;
          } else {
            // Bolos (kemarin nggak login)
            newStreak = 1;
          }
        }

        const { data, error } = await supabase
          .from('profiles')
          .update({ 
            streak_count: newStreak,
            last_login_date: todayStr
          })
          .eq('id', profile.id)
          .select()
          .single();

        if (!error && data) {
          set({ profile: data as UserProfile });
          console.log(`[InTracker] Daily Login Streak Updated: ${newStreak} days! 🔥`);
        }
      }
    }),
    {
      name: 'intracker-user-v1',
    }
  )
);
