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
      }
    }),
    {
      name: 'intracker-user-v1',
    }
  )
);
