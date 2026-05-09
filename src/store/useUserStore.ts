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
}

interface UserStore {
  profile: UserProfile | null;
  loading: boolean;
  isProActive: () => boolean;
  fetchProfile: () => Promise<void>;
  claimTrial: () => Promise<void>;
  addDailyPass: () => Promise<void>;
  useStreakFreeze: () => Promise<boolean>;
  addStreakFreeze: (count: number) => Promise<void>;
  updateDailyStreak: () => Promise<void>;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      profile: null,
      loading: false,

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        set({ loading: true });
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          set({ profile: data as UserProfile });
          
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
