import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useNutritionStore } from '../../store/useNutritionStore';
import Toast from '../../components/Toast';
import type { FitnessGoal, DietaryPreference, ActivityMultiplier } from '../../engines/nutritionEngine';

// --- Types ---

interface NutritionSettingsProps {
  onBack: () => void;
}

interface SettingsErrors {
  sex?: string;
  height?: string;
  weight?: string;
  age?: string;
  goal?: string;
  activityLevel?: string;
  dietaryPreference?: string;
  targetWeight?: string;
  duration?: string;
}

// --- Constants ---

const FITNESS_GOALS: { id: FitnessGoal; label: string; description: string }[] = [
  { id: 'lose_fat_keep_muscle', label: 'Lose Fat Keep Muscle', description: 'moderate deficit with high protein' },
  { id: 'aggressive_fat_loss', label: 'Aggressive Fat Loss', description: 'larger deficit, maximum protein' },
  { id: 'lean_bulk', label: 'Lean Bulk', description: 'small surplus, gain muscle with minimal fat' },
  { id: 'bulk', label: 'Bulk', description: 'larger surplus for maximum muscle growth' },
  { id: 'body_recomposition', label: 'Body Recomposition', description: 'maintenance calories with high protein' },
  { id: 'maintain_weight', label: 'Maintain Weight', description: 'keep current weight and body composition' },
];

const ACTIVITY_LEVELS: { id: ActivityMultiplier; label: string; description: string }[] = [
  { id: 1.2, label: 'Sedentary', description: 'Little or no exercise' },
  { id: 1.375, label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
  { id: 1.55, label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
  { id: 1.725, label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
  { id: 1.9, label: 'Extremely Active', description: 'Very hard exercise, physical job' },
];

const DIETARY_PREFERENCES: { id: DietaryPreference; label: string }[] = [
  { id: 'no_preference', label: 'No Preference' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'keto', label: 'Keto' },
  { id: 'paleo', label: 'Paleo' },
];

// --- Main Component ---

export function NutritionSettings({ onBack }: NutritionSettingsProps) {
  const { profile, targets, updateProfile } = useNutritionStore();
  const isLight = !document.documentElement.classList.contains('dark');

  // Form state initialized from current profile
  const [sex, setSex] = useState<'male' | 'female'>(profile?.sex ?? 'male');
  const [height, setHeight] = useState(profile?.height?.toString() ?? '');
  const [weight, setWeight] = useState(profile?.weight?.toString() ?? '');
  const [age, setAge] = useState(profile?.age?.toString() ?? '');
  const [goal, setGoal] = useState<FitnessGoal>(profile?.goal ?? 'maintain_weight');
  const [activityLevel, setActivityLevel] = useState<ActivityMultiplier>(profile?.activityLevel ?? 1.55);
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>(profile?.dietaryPreference ?? 'no_preference');
  const [targetWeight, setTargetWeight] = useState(profile?.targetWeight?.toString() ?? '');
  const [duration, setDuration] = useState(profile?.durationWeeks?.toString() ?? '');

  // UI state
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastVisible, setToastVisible] = useState(false);

  // --- Validation ---

  const validate = useCallback((): boolean => {
    const newErrors: SettingsErrors = {};

    const h = parseFloat(height);
    if (!height) {
      newErrors.height = 'Height is required';
    } else if (h < 50 || h > 300) {
      newErrors.height = 'Height must be 50-300 cm';
    }

    const w = parseFloat(weight);
    if (!weight) {
      newErrors.weight = 'Weight is required';
    } else if (w < 20 || w > 500) {
      newErrors.weight = 'Weight must be 20-500 kg';
    }

    const a = parseInt(age);
    if (!age) {
      newErrors.age = 'Age is required';
    } else if (a < 13 || a > 120) {
      newErrors.age = 'Age must be 13-120 years';
    }

    if (targetWeight) {
      const tw = parseFloat(targetWeight);
      if (tw < 20 || tw > 500) {
        newErrors.targetWeight = 'Target weight must be 20-500 kg';
      }
    }

    if (duration) {
      const d = parseInt(duration);
      if (d < 1 || d > 52) {
        newErrors.duration = 'Duration must be 1-52 weeks';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [height, weight, age, targetWeight, duration]);

  // --- Save ---

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);

    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));

      updateProfile({
        sex,
        height: parseFloat(height),
        weight: parseFloat(weight),
        age: parseInt(age),
        goal,
        activityLevel,
        dietaryPreference,
        targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
        durationWeeks: duration ? parseInt(duration) : undefined,
      });

      // Verify recalculation succeeded
      const { targets: newTargets } = useNutritionStore.getState();
      if (!newTargets) {
        throw new Error('Recalculation failed');
      }

      setToastMessage('Settings saved successfully');
      setToastType('success');
      setToastVisible(true);
    } catch {
      // Retain old targets on failure (requirement 17.6)
      setToastMessage('Recalculation failed. Previous targets retained.');
      setToastType('error');
      setToastVisible(true);
    } finally {
      setSaving(false);
    }
  };

  // --- Input Helpers ---

  const handleNumericInput = (
    value: string,
    setter: (v: string) => void,
    allowDecimal = false
  ) => {
    const pattern = allowDecimal ? /^[0-9]*\.?[0-9]*$/ : /^[0-9]*$/;
    if (pattern.test(value)) {
      setter(value);
    }
  };

  // --- Render ---

  return (
    <div className={`nutrition-overlay fixed inset-0 z-[100] flex flex-col transition-colors duration-300 ${
      isLight ? 'bg-[#f2faf5] text-black' : 'bg-[#16181c] text-white'
    }`}>
      {/* Background image in Light mode */}
      {isLight && (
        <img
          src="/all_images/antigravitybg/calo_bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        />
      )}
      {/* Header */}
      <div className="pt-14 pb-4 px-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className={`w-10 h-10 rounded-[10px] border-2 flex items-center justify-center transition-all ${
              isLight
                ? 'border-black/10 bg-white text-black shadow-none'
                : 'border-white/10 bg-[#2a2c32] text-white shadow-none'
            }`}
            aria-label="Go back"
          >
            <Icon icon="ph:caret-left-bold" width={18} className={isLight ? 'text-black/80' : 'text-white'} />
          </motion.button>
          <h2 className={`text-[20px] font-black font-['Outfit'] ${
            isLight ? 'text-black' : 'text-[#E3DAC9]'
          }`}>
            Settings
          </h2>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8 relative z-10">
        <div className="space-y-6">

          {/* Current Targets (read-only) */}
          {targets && (
            <div className={`rounded-2xl border p-4 space-y-2 transition-all ${
              isLight
                ? 'bg-white border-black/12'
                : 'bg-[#2a2c32] border-white/10'
            }`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isLight ? 'text-black/40' : 'text-white/30'}`}>
                Current Targets
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className={`text-[11px] ${isLight ? 'text-black/50' : 'text-white/40'}`}>Daily Calories</span>
                  <p className="text-[15px] font-bold text-[#A3E635] font-['Outfit']">
                    {targets.dailyCalories} kcal
                  </p>
                </div>
                <div>
                  <span className={`text-[11px] ${isLight ? 'text-black/50' : 'text-white/40'}`}>Protein</span>
                  <p className={`text-[15px] font-bold font-['Outfit'] ${isLight ? 'text-black' : 'text-[#E3DAC9]'}`}>
                    {targets.protein}g
                  </p>
                </div>
                <div>
                  <span className={`text-[11px] ${isLight ? 'text-black/50' : 'text-white/40'}`}>Carbs</span>
                  <p className={`text-[15px] font-bold font-['Outfit'] ${isLight ? 'text-black' : 'text-[#E3DAC9]'}`}>
                    {targets.carbs}g
                  </p>
                </div>
                <div>
                  <span className={`text-[11px] ${isLight ? 'text-black/50' : 'text-white/40'}`}>Fat</span>
                  <p className={`text-[15px] font-bold font-['Outfit'] ${isLight ? 'text-black' : 'text-[#E3DAC9]'}`}>
                    {targets.fat}g
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sex Toggle */}
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 ml-1 ${isLight ? 'text-black/40' : 'text-white/30'}`}>Sex</p>
            <div className="flex gap-3 justify-center">
              {(['male', 'female'] as const).map((s) => (
                <motion.button
                  key={s}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSex(s)}
                  className={`flex-1 max-w-[140px] h-11 rounded-xl font-bold font-['Outfit'] text-[13px] uppercase tracking-wider transition-all border ${
                    sex === s
                      ? isLight
                        ? 'border-[#81E6D9] bg-gradient-to-br from-[#E6FFFA] to-[#C6F6D5] text-[#22543D] shadow-sm'
                        : 'border-[#1C4D38] bg-gradient-to-br from-[#102A1E] to-[#0A1A12] text-[#00FF85] shadow-sm'
                      : isLight
                        ? 'bg-white border-neutral-200 text-neutral-400 shadow-sm'
                        : 'bg-[#2a2c32] border-white/10 text-[#E3DAC9]/60'
                  }`}
                >
                  {s === 'male' ? 'Pria' : 'Wanita'}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Height */}
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 ml-1 ${isLight ? 'text-black/40' : 'text-white/30'}`}>Height (cm)</p>
            <div className={`h-12 rounded-lg border px-4 flex items-center transition-all ${
              isLight
                ? `${errors.height ? 'border-red-400' : 'border-black/12'} bg-white focus-within:border-[#7BE495]`
                : `${errors.height ? 'border-red-400/60' : 'border-white/10'} bg-[#2a2c32] focus-within:border-[#7BE495]/50`
            }`}>
              <input
                type="text"
                inputMode="numeric"
                value={height}
                onChange={(e) => handleNumericInput(e.target.value, setHeight)}
                placeholder="170"
                className={`w-full bg-transparent border-none outline-none text-[15px] font-bold font-['Outfit'] placeholder:text-neutral-400/30 ${
                  isLight ? 'text-black' : 'text-[#E3DAC9]'
                }`}
              />
              <span className={`text-[11px] font-bold ml-2 ${isLight ? 'text-black/40' : 'text-white/30'}`}>cm</span>
            </div>
            {errors.height && <p className="text-[11px] text-red-400 mt-2 ml-1">{errors.height}</p>}
          </div>

          {/* Weight */}
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 ml-1 ${isLight ? 'text-black/40' : 'text-white/30'}`}>Weight (kg)</p>
            <div className={`h-12 rounded-lg border px-4 flex items-center transition-all ${
              isLight
                ? `${errors.weight ? 'border-red-400' : 'border-black/12'} bg-white focus-within:border-[#7BE495]`
                : `${errors.weight ? 'border-red-400/60' : 'border-white/10'} bg-[#2a2c32] focus-within:border-[#7BE495]/50`
            }`}>
              <input
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => handleNumericInput(e.target.value, setWeight, true)}
                placeholder="70.0"
                className={`w-full bg-transparent border-none outline-none text-[15px] font-bold font-['Outfit'] placeholder:text-neutral-400/30 ${
                  isLight ? 'text-black' : 'text-[#E3DAC9]'
                }`}
              />
              <span className={`text-[11px] font-bold ml-2 ${isLight ? 'text-black/40' : 'text-white/30'}`}>kg</span>
            </div>
            {errors.weight && <p className="text-[11px] text-red-400 mt-2 ml-1">{errors.weight}</p>}
          </div>

          {/* Age */}
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 ml-1 ${isLight ? 'text-black/40' : 'text-white/30'}`}>Age</p>
            <div className={`h-12 rounded-lg border px-4 flex items-center transition-all ${
              isLight
                ? `${errors.age ? 'border-red-400' : 'border-black/12'} bg-white focus-within:border-[#7BE495]`
                : `${errors.age ? 'border-red-400/60' : 'border-white/10'} bg-[#2a2c32] focus-within:border-[#7BE495]/50`
            }`}>
              <input
                type="text"
                inputMode="numeric"
                value={age}
                onChange={(e) => handleNumericInput(e.target.value, setAge)}
                placeholder="25"
                className={`w-full bg-transparent border-none outline-none text-[15px] font-bold font-['Outfit'] placeholder:text-neutral-400/30 ${
                  isLight ? 'text-black' : 'text-[#E3DAC9]'
                }`}
              />
              <span className={`text-[11px] font-bold ml-2 ${isLight ? 'text-black/40' : 'text-white/30'}`}>years</span>
            </div>
            {errors.age && <p className="text-[11px] text-red-400 mt-2 ml-1">{errors.age}</p>}
          </div>

          {/* Fitness Goal */}
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 ml-1 ${isLight ? 'text-black/40' : 'text-white/30'}`}>Fitness Goal</p>
            <div className="space-y-2">
              {FITNESS_GOALS.map((g) => (
                <motion.button
                  key={g.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setGoal(g.id)}
                  className={`w-full p-3.5 rounded-xl text-left border transition-all ${
                    goal === g.id
                      ? 'bg-[#7BE495]/10 border-2 border-[#7BE495]'
                      : isLight
                        ? 'bg-white border-black/12'
                        : 'bg-[#2a2c32] border border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-[13px] font-bold font-['Outfit'] ${
                        goal === g.id
                          ? isLight ? 'text-[#22543D]' : 'text-[#00FF85]'
                          : isLight ? 'text-black' : 'text-[#E3DAC9]'
                      }`}>
                        {g.label}
                      </p>
                      <p className={`text-[11px] mt-0.5 ${isLight ? 'text-black/50' : 'text-white/40'}`}>{g.description}</p>
                    </div>
                    {goal === g.id && (
                      <Icon icon="ph:check-circle-fill" width={20} className={isLight ? 'text-[#22543D]' : 'text-[#00FF85]'} />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 ml-1 ${isLight ? 'text-black/40' : 'text-white/30'}`}>Activity Level</p>
            <div className="space-y-2">
              {ACTIVITY_LEVELS.map((level) => (
                <motion.button
                  key={level.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActivityLevel(level.id)}
                  className={`w-full p-3.5 rounded-xl text-left border transition-all ${
                    activityLevel === level.id
                      ? 'bg-[#7BE495]/10 border-2 border-[#7BE495]'
                      : isLight
                        ? 'bg-white border-black/12'
                        : 'bg-[#2a2c32] border border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-[13px] font-bold font-['Outfit'] ${
                        activityLevel === level.id
                          ? isLight ? 'text-[#22543D]' : 'text-[#00FF85]'
                          : isLight ? 'text-black' : 'text-[#E3DAC9]'
                      }`}>
                        {level.label}
                      </p>
                      <p className={`text-[11px] mt-0.5 ${isLight ? 'text-black/50' : 'text-white/40'}`}>{level.description}</p>
                    </div>
                    {activityLevel === level.id && (
                      <Icon icon="ph:check-circle-fill" width={20} className={isLight ? 'text-[#22543D]' : 'text-[#00FF85]'} />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Target Weight (optional) */}
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 ml-1 ${isLight ? 'text-black/40' : 'text-white/30'}`}>
              Target Weight (optional)
            </p>
            <div className={`h-12 rounded-lg border px-4 flex items-center transition-all ${
              isLight
                ? `${errors.targetWeight ? 'border-red-400' : 'border-black/12'} bg-white focus-within:border-[#7BE495]`
                : `${errors.targetWeight ? 'border-red-400/60' : 'border-white/10'} bg-[#2a2c32] focus-within:border-[#7BE495]/50`
            }`}>
              <input
                type="text"
                inputMode="decimal"
                value={targetWeight}
                onChange={(e) => handleNumericInput(e.target.value, setTargetWeight, true)}
                placeholder="65.0"
                className={`w-full bg-transparent border-none outline-none text-[15px] font-bold font-['Outfit'] placeholder:text-neutral-400/30 ${
                  isLight ? 'text-black' : 'text-[#E3DAC9]'
                }`}
              />
              <span className={`text-[11px] font-bold ml-2 ${isLight ? 'text-black/40' : 'text-white/30'}`}>kg</span>
            </div>
            {errors.targetWeight && <p className="text-[11px] text-red-400 mt-2 ml-1">{errors.targetWeight}</p>}
          </div>

          {/* Duration */}
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2.5 ml-1 ${isLight ? 'text-black/40' : 'text-white/30'}`}>
              Duration (optional)
            </p>
            <div className={`h-12 rounded-lg border px-4 flex items-center transition-all ${
              isLight
                ? `${errors.duration ? 'border-red-400' : 'border-black/12'} bg-white focus-within:border-[#7BE495]`
                : `${errors.duration ? 'border-red-400/60' : 'border-white/10'} bg-[#2a2c32] focus-within:border-[#7BE495]/50`
            }`}>
              <input
                type="text"
                inputMode="numeric"
                value={duration}
                onChange={(e) => handleNumericInput(e.target.value, setDuration)}
                placeholder="12"
                className={`w-full bg-transparent border-none outline-none text-[15px] font-bold font-['Outfit'] placeholder:text-neutral-400/30 ${
                  isLight ? 'text-black' : 'text-[#E3DAC9]'
                }`}
              />
              <span className={`text-[11px] font-bold ml-2 ${isLight ? 'text-black/40' : 'text-white/30'}`}>weeks</span>
            </div>
            {errors.duration && <p className="text-[11px] text-red-400 mt-2 ml-1">{errors.duration}</p>}
          </div>

        </div>
      </div>

      {/* Footer — Save Button */}
      <div className={`border-t px-6 py-5 pb-8 relative z-20 ${
        isLight ? 'bg-[#f2faf5] border-black/10' : 'bg-[#16181c] border-white/5'
      }`}>
        <motion.button
          whileTap={!saving ? { scale: 0.95 } : {}}
          onClick={handleSave}
          disabled={saving}
          className={`w-full h-12 rounded-xl font-black font-['Outfit'] text-[14px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all border ${
            saving
              ? 'bg-[#7BE495]/30 text-[#22543D]/50 border-[#81E6D9]/50'
              : isLight
                ? 'border-[#81E6D9] bg-gradient-to-br from-[#E6FFFA] to-[#C6F6D5] text-[#22543D] shadow-sm'
                : 'border-[#1C4D38] bg-gradient-to-br from-[#102A1E] to-[#0A1A12] text-[#00FF85] shadow-sm'
          }`}
        >
          {saving ? (
            <>
              <Icon icon="ph:spinner" width={20} className="animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </motion.button>
      </div>

      {/* Toast */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
    </div>
  );
}
