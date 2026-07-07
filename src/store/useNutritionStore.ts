import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import {
  calculateBmr,
  calculateTdee,
  calculateCalorieTarget,
  calculateMacros,
  type BmrInput,
  type ActivityMultiplier,
  type FitnessGoal,
  type DietaryPreference,
} from '../engines/nutritionEngine';

// --- Interfaces ---

export interface UserProfile {
  sex: 'male' | 'female';
  height: number;
  weight: number;
  age: number;
  goal: FitnessGoal;
  activityLevel: ActivityMultiplier;
  dietaryPreference: DietaryPreference;
  targetWeight?: number;
  durationWeeks?: number;
}

export interface NutritionTargets {
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionStore {
  profile: UserProfile | null;
  targets: NutritionTargets | null;
  onboardingComplete: boolean;
  loading: boolean;
  syncPending: boolean;
  setProfile: (profile: UserProfile) => void;
  generatePlan: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  syncToSupabase: () => Promise<void>;
  restoreFromSupabase: () => Promise<void>;
}

// --- Store ---

export const useNutritionStore = create<NutritionStore>()(
  persist(
    (set, get) => ({
      profile: null,
      targets: null,
      onboardingComplete: false,
      loading: false,
      syncPending: false,

      setProfile: (profile: UserProfile) => {
        set({ profile, onboardingComplete: true });
        get().generatePlan();
        // Sync to Supabase in background (non-blocking per requirement 9.1, 9.6)
        get().syncToSupabase();
      },

      generatePlan: () => {
        const { profile } = get();
        if (!profile) return;

        const bmrInput: BmrInput = {
          sex: profile.sex,
          weight: profile.weight,
          height: profile.height,
          age: profile.age,
        };

        const bmrResult = calculateBmr(bmrInput);
        if (!bmrResult.success) {
          // BMR calculation failed — cannot generate plan
          return;
        }

        const tdee = calculateTdee({
          bmr: bmrResult.bmr,
          activityMultiplier: profile.activityLevel,
        });

        const dailyCalories = calculateCalorieTarget({
          tdee,
          goal: profile.goal,
          sex: profile.sex,
          age: profile.age,
        });

        const macros = calculateMacros({
          dailyCalories,
          dietaryPreference: profile.dietaryPreference,
          goal: profile.goal,
          age: profile.age,
        });

        set({
          targets: {
            dailyCalories,
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
          },
        });
      },

      updateProfile: (updates: Partial<UserProfile>) => {
        const { profile } = get();
        if (!profile) return;

        const updatedProfile = { ...profile, ...updates };
        set({ profile: updatedProfile });
        get().generatePlan();
        // Sync updated profile to Supabase in background (requirement 9.4)
        get().syncToSupabase();
      },

      syncToSupabase: async () => {
        const { profile, targets } = get();
        if (!profile || !targets) return;

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            // No authenticated user — mark pending for retry
            set({ syncPending: true });
            return;
          }

          const { error } = await supabase
            .from('nutrition_profiles')
            .upsert({
              user_id: user.id,
              sex: profile.sex,
              height: profile.height,
              weight: profile.weight,
              age: profile.age,
              goal: profile.goal,
              activity_multiplier: profile.activityLevel,
              dietary_preference: profile.dietaryPreference,
              target_weight: profile.targetWeight ?? null,
              duration_weeks: profile.durationWeeks ?? null,
              daily_calories: targets.dailyCalories,
              protein_grams: targets.protein,
              carbs_grams: targets.carbs,
              fat_grams: targets.fat,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

          if (error) {
            // Sync failed — mark pending for retry on next opportunity (requirement 9.6)
            console.warn('[NutritionStore] syncToSupabase failed:', error.message);
            set({ syncPending: true });
          } else {
            set({ syncPending: false });
          }
        } catch {
          // Network or unexpected error — mark pending for retry (requirement 9.6)
          console.warn('[NutritionStore] syncToSupabase error — will retry on next opportunity');
          set({ syncPending: true });
        }
      },

      restoreFromSupabase: async () => {
        const state = get();
        // Only restore if local state is empty (requirement 9.5)
        if (state.profile && state.onboardingComplete) {
          // Local state exists — but if sync is pending, retry it now
          if (state.syncPending) {
            get().syncToSupabase();
          }
          return;
        }

        set({ loading: true });

        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            set({ loading: false });
            return;
          }

          const { data, error } = await supabase
            .from('nutrition_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error || !data) {
            set({ loading: false });
            return;
          }

          const profile: UserProfile = {
            sex: data.sex as 'male' | 'female',
            height: data.height,
            weight: data.weight,
            age: data.age,
            goal: data.goal as FitnessGoal,
            activityLevel: data.activity_multiplier as ActivityMultiplier,
            dietaryPreference: data.dietary_preference as DietaryPreference,
            targetWeight: data.target_weight ?? undefined,
            durationWeeks: data.duration_weeks ?? undefined,
          };

          const targets: NutritionTargets = {
            dailyCalories: data.daily_calories,
            protein: data.protein_grams,
            carbs: data.carbs_grams,
            fat: data.fat_grams,
          };

          set({
            profile,
            targets,
            onboardingComplete: true,
            loading: false,
          });
        } catch {
          // Network error during restore — user can still proceed (non-blocking)
          console.warn('[NutritionStore] restoreFromSupabase error — continuing with local state');
          set({ loading: false });
        }
      },
    }),
    {
      name: 'inrising-nutrition-v1',
      version: 1,
    }
  )
);
