import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useNutritionStore } from '../../store/useNutritionStore';
import { calculateWeeklyRate } from '../../engines/nutritionEngine';
import type { FitnessGoal, DietaryPreference, ActivityMultiplier } from '../../engines/nutritionEngine';

// --- Types ---

interface BodyMetrics {
  sex: 'male' | 'female' | null;
  height: string;
  weight: string;
  age: string;
}

interface StepErrors {
  sex?: string;
  height?: string;
  weight?: string;
  age?: string;
  goal?: string;
  targetWeight?: string;
  duration?: string;
  activityLevel?: string;
}

interface OnboardingWizardProps {
  onExit?: () => void;
}

// --- Constants ---

const FITNESS_GOALS: { id: FitnessGoal; label: string; description: string }[] = [
  { id: 'lose_fat_keep_muscle', label: 'Bakar Lemak, Jaga Otot', description: 'Defisit moderat dengan protein tinggi' },
  { id: 'aggressive_fat_loss', label: 'Bakar Lemak Agresif', description: 'Defisit besar, protein maksimal' },
  { id: 'lean_bulk', label: 'Lean Bulk', description: 'Surplus kecil, tambah otot minim lemak' },
  { id: 'bulk', label: 'Bulk', description: 'Surplus besar untuk pertumbuhan otot maksimal' },
  { id: 'body_recomposition', label: 'Rekomposisi Tubuh', description: 'Kalori maintenance dengan protein tinggi' },
  { id: 'maintain_weight', label: 'Jaga Berat Badan', description: 'Pertahankan berat & komposisi tubuh' },
];

const DURATION_OPTIONS = [4, 8, 12, 16] as const;

const ACTIVITY_LEVELS: { id: ActivityMultiplier; label: string; description: string }[] = [
  { id: 1.2, label: 'Tidak Aktif', description: 'Jarang olahraga, kerja kantoran' },
  { id: 1.375, label: 'Sedikit Aktif', description: 'Olahraga ringan 1-3 hari/minggu' },
  { id: 1.55, label: 'Cukup Aktif', description: 'Olahraga sedang 3-5 hari/minggu' },
  { id: 1.725, label: 'Sangat Aktif', description: 'Olahraga berat 6-7 hari/minggu' },
  { id: 1.9, label: 'Ekstra Aktif', description: 'Olahraga sangat berat, kerja fisik' },
];

const DIETARY_PREFERENCES: { id: DietaryPreference; label: string }[] = [
  { id: 'no_preference', label: 'Bebas' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'keto', label: 'Keto' },
  { id: 'paleo', label: 'Paleo' },
];

// --- Main Component ---

export const OnboardingWizard = ({ onExit }: OnboardingWizardProps) => {
  const { setProfile } = useNutritionStore();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<StepErrors>({});
  const [loading, setLoading] = useState(false);
  const [planError, setPlanError] = useState(false);

  // Step 1: Body Metrics
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetrics>({
    sex: null,
    height: '',
    weight: '',
    age: '',
  });

  // Step 2: Fitness Goal
  const [selectedGoal, setSelectedGoal] = useState<FitnessGoal | null>(null);

  // Step 3: Timeframe
  const [targetWeight, setTargetWeight] = useState('');
  const [durationWeeks, setDurationWeeks] = useState<number | null>(null);

  // Step 4: Activity & Dietary
  const [activityLevel, setActivityLevel] = useState<ActivityMultiplier | null>(null);
  const [dietaryPreference, setDietaryPreference] = useState<DietaryPreference>('no_preference');

  // --- Validation ---

  const validateStep1 = useCallback((): boolean => {
    const newErrors: StepErrors = {};
    if (!bodyMetrics.sex) newErrors.sex = 'Pilih jenis kelamin';
    const height = parseFloat(bodyMetrics.height);
    if (!bodyMetrics.height) newErrors.height = 'Tinggi badan wajib diisi';
    else if (height < 100 || height > 250) newErrors.height = 'Tinggi harus 100-250 cm';
    const weight = parseFloat(bodyMetrics.weight);
    if (!bodyMetrics.weight) newErrors.weight = 'Berat badan wajib diisi';
    else if (weight < 30 || weight > 300) newErrors.weight = 'Berat harus 30-300 kg';
    const age = parseInt(bodyMetrics.age);
    if (!bodyMetrics.age) newErrors.age = 'Usia wajib diisi';
    else if (age < 13 || age > 100) newErrors.age = 'Usia harus 13-100 tahun';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [bodyMetrics]);

  const validateStep2 = useCallback((): boolean => {
    const newErrors: StepErrors = {};
    if (!selectedGoal) newErrors.goal = 'Pilih tujuan fitness kamu';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedGoal]);

  const validateStep3 = useCallback((): boolean => {
    const newErrors: StepErrors = {};
    if (targetWeight) {
      const tw = parseFloat(targetWeight);
      if (tw < 30 || tw > 300) newErrors.targetWeight = 'Berat target harus 30-300 kg';
      else if (!durationWeeks) newErrors.duration = 'Pilih durasi';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [targetWeight, durationWeeks]);

  const validateStep4 = useCallback((): boolean => {
    const newErrors: StepErrors = {};
    if (!activityLevel) newErrors.activityLevel = 'Pilih level aktivitas kamu';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [activityLevel]);

  // --- Navigation ---

  const handleNext = () => {
    let valid = false;
    switch (currentStep) {
      case 1: valid = validateStep1(); break;
      case 2: valid = validateStep2(); break;
      case 3: valid = validateStep3(); break;
      default: valid = true;
    }
    if (valid) { setErrors({}); setCurrentStep(prev => prev + 1); }
  };

  const handleBack = () => { setErrors({}); setCurrentStep(prev => prev - 1); };

  // --- Generate Plan ---

  const handleGeneratePlan = async () => {
    if (!validateStep4()) return;
    setLoading(true);
    setPlanError(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      setProfile({
        sex: bodyMetrics.sex!,
        height: parseInt(bodyMetrics.height),
        weight: parseFloat(bodyMetrics.weight),
        age: parseInt(bodyMetrics.age),
        goal: selectedGoal!,
        activityLevel: activityLevel!,
        dietaryPreference,
        targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
        durationWeeks: durationWeeks ?? undefined,
      });
      const { targets } = useNutritionStore.getState();
      if (!targets) throw new Error('Plan generation failed');
    } catch {
      setPlanError(true);
    } finally {
      setLoading(false);
    }
  };

  // --- Input Helpers ---

  const handleNumericInput = (value: string, setter: (v: string) => void, allowDecimal = false) => {
    const pattern = allowDecimal ? /^[0-9]*\.?[0-9]*$/ : /^[0-9]*$/;
    if (pattern.test(value)) setter(value);
  };

  const weeklyRate = targetWeight && durationWeeks && bodyMetrics.weight
    ? calculateWeeklyRate({ currentWeight: parseFloat(bodyMetrics.weight), targetWeight: parseFloat(targetWeight), durationWeeks })
    : null;

  // --- Step Renderers ---

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 ml-1">Jenis Kelamin</p>
        <div className="flex gap-3">
          {([{ id: 'male', label: 'Pria' }, { id: 'female', label: 'Wanita' }] as const).map(({ id, label }) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setBodyMetrics(prev => ({ ...prev, sex: id })); if (errors.sex) setErrors(prev => ({ ...prev, sex: undefined })); }}
              className={`flex-1 h-14 rounded-2xl font-bold font-['Outfit'] text-[14px] transition-all ${
                bodyMetrics.sex === id ? 'bg-[#00FF85] text-black border-2 border-black' : 'bg-[#2a2c32] text-white/60 border border-white/10'
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>
        {errors.sex && <p className="text-[11px] text-red-400 mt-2 ml-1">{errors.sex}</p>}
      </div>

      <div>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 ml-1">Tinggi Badan</p>
        <div className={`h-14 bg-[#2a2c32] rounded-2xl border px-5 flex items-center transition-all ${errors.height ? 'border-red-400/60' : 'border-white/10 focus-within:border-[#00FF85]/50'}`}>
          <input type="text" inputMode="numeric" value={bodyMetrics.height} onChange={(e) => handleNumericInput(e.target.value, (v) => { setBodyMetrics(prev => ({ ...prev, height: v })); if (errors.height) setErrors(prev => ({ ...prev, height: undefined })); })} placeholder="170" className="w-full bg-transparent border-none outline-none text-[16px] font-bold font-['Outfit'] text-white placeholder:text-white/20" />
          <span className="text-[12px] font-bold text-white/40 ml-2">cm</span>
        </div>
        {errors.height && <p className="text-[11px] text-red-400 mt-2 ml-1">{errors.height}</p>}
      </div>

      <div>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 ml-1">Berat Badan</p>
        <div className={`h-14 bg-[#2a2c32] rounded-2xl border px-5 flex items-center transition-all ${errors.weight ? 'border-red-400/60' : 'border-white/10 focus-within:border-[#00FF85]/50'}`}>
          <input type="text" inputMode="decimal" value={bodyMetrics.weight} onChange={(e) => handleNumericInput(e.target.value, (v) => { setBodyMetrics(prev => ({ ...prev, weight: v })); if (errors.weight) setErrors(prev => ({ ...prev, weight: undefined })); }, true)} placeholder="70.0" className="w-full bg-transparent border-none outline-none text-[16px] font-bold font-['Outfit'] text-white placeholder:text-white/20" />
          <span className="text-[12px] font-bold text-white/40 ml-2">kg</span>
        </div>
        {errors.weight && <p className="text-[11px] text-red-400 mt-2 ml-1">{errors.weight}</p>}
      </div>

      <div>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 ml-1">Usia</p>
        <div className={`h-14 bg-[#2a2c32] rounded-2xl border px-5 flex items-center transition-all ${errors.age ? 'border-red-400/60' : 'border-white/10 focus-within:border-[#00FF85]/50'}`}>
          <input type="text" inputMode="numeric" value={bodyMetrics.age} onChange={(e) => handleNumericInput(e.target.value, (v) => { setBodyMetrics(prev => ({ ...prev, age: v })); if (errors.age) setErrors(prev => ({ ...prev, age: undefined })); })} placeholder="25" className="w-full bg-transparent border-none outline-none text-[16px] font-bold font-['Outfit'] text-white placeholder:text-white/20" />
          <span className="text-[12px] font-bold text-white/40 ml-2">tahun</span>
        </div>
        {errors.age && <p className="text-[11px] text-red-400 mt-2 ml-1">{errors.age}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-3">
      {errors.goal && <p className="text-[11px] text-red-400 ml-1">{errors.goal}</p>}
      {FITNESS_GOALS.map((goal) => (
        <motion.button key={goal.id} whileTap={{ scale: 0.97 }} onClick={() => { setSelectedGoal(goal.id); if (errors.goal) setErrors(prev => ({ ...prev, goal: undefined })); }}
          className={`w-full p-4 rounded-2xl text-left transition-all ${selectedGoal === goal.id ? 'bg-[#00FF85]/10 border-2 border-[#00FF85]' : 'bg-[#2a2c32] border border-white/10'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[14px] font-bold font-['Outfit'] ${selectedGoal === goal.id ? 'text-[#00FF85]' : 'text-white'}`}>{goal.label}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{goal.description}</p>
            </div>
            {selectedGoal === goal.id && <Icon icon="ph:check-circle-fill" width={22} className="text-[#00FF85]" />}
          </div>
        </motion.button>
      ))}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 ml-1">Berat Target (opsional)</p>
        <div className={`h-14 bg-[#2a2c32] rounded-2xl border px-5 flex items-center transition-all ${errors.targetWeight ? 'border-red-400/60' : 'border-white/10 focus-within:border-[#00FF85]/50'}`}>
          <input type="text" inputMode="decimal" value={targetWeight} onChange={(e) => handleNumericInput(e.target.value, (v) => { setTargetWeight(v); if (errors.targetWeight) setErrors(prev => ({ ...prev, targetWeight: undefined })); }, true)} placeholder="65.0" className="w-full bg-transparent border-none outline-none text-[16px] font-bold font-['Outfit'] text-white placeholder:text-white/20" />
          <span className="text-[12px] font-bold text-white/40 ml-2">kg</span>
        </div>
        {errors.targetWeight && <p className="text-[11px] text-red-400 mt-2 ml-1">{errors.targetWeight}</p>}
      </div>

      <div>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 ml-1">Durasi</p>
        <div className="grid grid-cols-4 gap-2">
          {DURATION_OPTIONS.map((weeks) => (
            <motion.button key={weeks} whileTap={{ scale: 0.95 }} onClick={() => { setDurationWeeks(weeks); if (errors.duration) setErrors(prev => ({ ...prev, duration: undefined })); }}
              className={`h-12 rounded-xl font-bold font-['Outfit'] text-[13px] transition-all ${durationWeeks === weeks ? 'bg-[#00FF85] text-black border-2 border-black' : 'bg-[#2a2c32] text-white/60 border border-white/10'}`}>
              {weeks} mgg
            </motion.button>
          ))}
        </div>
        {errors.duration && <p className="text-[11px] text-red-400 mt-2 ml-1">{errors.duration}</p>}
      </div>

      <div className="bg-[#2a2c32] rounded-2xl border border-white/10 p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-[12px] text-white/40">Berat Saat Ini</span>
          <span className="text-[13px] font-bold text-white">{bodyMetrics.weight ? `${bodyMetrics.weight} kg` : '—'}</span>
        </div>
        {targetWeight && (
          <div className="flex justify-between">
            <span className="text-[12px] text-white/40">Berat Target</span>
            <span className="text-[13px] font-bold text-white">{targetWeight} kg</span>
          </div>
        )}
        {weeklyRate && (
          <div className="flex justify-between">
            <span className="text-[12px] text-white/40">Perubahan/Minggu</span>
            <span className={`text-[13px] font-bold ${weeklyRate.isAggressive ? 'text-[#FF4D00]' : 'text-[#00FF85]'}`}>
              {weeklyRate.ratePerWeek > 0 ? '+' : ''}{weeklyRate.ratePerWeek} kg/minggu
            </span>
          </div>
        )}
      </div>

      {weeklyRate?.isAggressive && (
        <div className="flex items-start gap-3 bg-[#FF4D00]/10 border border-[#FF4D00]/30 rounded-2xl p-4">
          <Icon icon="ph:warning-fill" width={20} className="text-[#FF4D00] shrink-0 mt-0.5" />
          <p className="text-[12px] text-[#FF4D00]/80 leading-relaxed">
            Laju ini terlalu agresif. Pertimbangkan durasi lebih lama untuk hasil yang lebih aman.
          </p>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 ml-1">Level Aktivitas</p>
        {errors.activityLevel && <p className="text-[11px] text-red-400 mb-2 ml-1">{errors.activityLevel}</p>}
        <div className="space-y-2">
          {ACTIVITY_LEVELS.map((level) => (
            <motion.button key={level.id} whileTap={{ scale: 0.97 }} onClick={() => { setActivityLevel(level.id); if (errors.activityLevel) setErrors(prev => ({ ...prev, activityLevel: undefined })); }}
              className={`w-full p-3.5 rounded-2xl text-left transition-all ${activityLevel === level.id ? 'bg-[#00FF85]/10 border-2 border-[#00FF85]' : 'bg-[#2a2c32] border border-white/10'}`}>
              <p className={`text-[13px] font-bold font-['Outfit'] ${activityLevel === level.id ? 'text-[#00FF85]' : 'text-white'}`}>{level.label}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{level.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 ml-1">Preferensi Diet</p>
        <div className="flex flex-wrap gap-2">
          {DIETARY_PREFERENCES.map((pref) => (
            <motion.button key={pref.id} whileTap={{ scale: 0.95 }} onClick={() => setDietaryPreference(pref.id)}
              className={`px-4 py-2.5 rounded-xl font-bold font-['Outfit'] text-[12px] transition-all ${dietaryPreference === pref.id ? 'bg-[#00FF85] text-black border-2 border-black' : 'bg-[#2a2c32] text-white/60 border border-white/10'}`}>
              {pref.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );

  const stepTitles: Record<number, string> = {
    1: 'Tentang Kamu',
    2: 'Tujuan Kamu',
    3: 'Jangka Waktu',
    4: 'Detail Akhir',
  };

  // --- Render ---

  return (
    <div className="fixed inset-0 bg-[#16181c] z-[100] flex flex-col">
      {/* Header */}
      <div className="pt-14 pb-4 px-6">
        <div className="flex items-center justify-center relative mb-6">
          {/* Exit button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onExit}
            className="absolute left-0 w-9 h-9 rounded-xl bg-[#2a2c32] border border-white/10 flex items-center justify-center"
            aria-label="Keluar"
          >
            <Icon icon="ph:x-bold" width={16} className="text-white/60" />
          </motion.button>

          {/* Centered title */}
          <h2 className="text-[20px] font-black font-['Outfit'] text-white">
            {stepTitles[currentStep]}
          </h2>

          {/* Step indicator */}
          <span className="absolute right-0 text-[12px] font-bold text-white/30 font-['Outfit']">
            {currentStep}/4
          </span>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className={`h-1 flex-1 rounded-full transition-all duration-300 ${step <= currentStep ? 'bg-[#00FF85]' : 'bg-white/10'}`} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 mt-8">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#16181c] border-t border-white/5 px-6 py-5 pb-8">
        {planError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
            <Icon icon="ph:warning-circle-fill" width={18} className="text-red-400 shrink-0" />
            <p className="text-[12px] text-red-400 flex-1">Gagal membuat rencana. Coba lagi.</p>
          </div>
        )}

        <div className="flex gap-3">
          {currentStep > 1 && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleBack}
              className="h-14 px-6 rounded-2xl bg-[#2a2c32] border border-white/10 text-white/80 font-bold font-['Outfit'] text-[13px] uppercase tracking-wider">
              Kembali
            </motion.button>
          )}

          {currentStep < 4 ? (
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleNext}
              className="flex-1 h-14 rounded-2xl bg-[#00FF85] text-black font-black font-['Outfit'] text-[14px] uppercase tracking-wider">
              Lanjut
            </motion.button>
          ) : (
            <motion.button whileTap={!loading ? { scale: 0.95 } : {}} onClick={handleGeneratePlan} disabled={loading}
              className={`flex-1 h-14 rounded-2xl font-black font-['Outfit'] text-[14px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${loading ? 'bg-[#00FF85]/50 text-black/50' : 'bg-[#00FF85] text-black'}`}>
              {loading ? (<><Icon icon="ph:spinner" width={20} className="animate-spin" />Memproses...</>) : 'Buat Rencana'}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
