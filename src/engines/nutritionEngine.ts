// ============================================================
// Calorie Tracker — Nutrition Engine
// Pure functions for BMR, TDEE, calorie target, macro, and
// weekly rate calculations.
// ============================================================

// --- Types ---

export interface BmrInput {
  sex: 'male' | 'female';
  weight: number;   // kg, 20.0-300.0
  height: number;   // cm, 100-250
  age: number;      // years, 13-120
}

export interface BmrResult {
  success: true;
  bmr: number; // kcal/day, whole number
}

export interface BmrError {
  success: false;
  error: string;
  field?: string;
}

export type BmrOutput = BmrResult | BmrError;

export type ActivityMultiplier = 1.2 | 1.375 | 1.55 | 1.725 | 1.9;

export interface TdeeInput {
  bmr: number;
  activityMultiplier: ActivityMultiplier;
}

export type FitnessGoal =
  | 'lose_fat_keep_muscle'
  | 'aggressive_fat_loss'
  | 'lean_bulk'
  | 'bulk'
  | 'body_recomposition'
  | 'maintain_weight';

export type DietaryPreference = 'no_preference' | 'vegetarian' | 'vegan' | 'keto' | 'paleo';

export interface CalorieTargetInput {
  tdee: number;
  goal: FitnessGoal;
  sex: 'male' | 'female';
  age: number;
}

export interface MacroInput {
  dailyCalories: number;
  dietaryPreference: DietaryPreference;
  goal: FitnessGoal;
  age: number;
}

export interface MacroTargets {
  protein: number; // grams, whole number
  carbs: number;   // grams, whole number
  fat: number;     // grams, whole number
}

export interface WeeklyRateInput {
  currentWeight: number;
  targetWeight: number;
  durationWeeks: number;
}

export interface WeeklyRateResult {
  ratePerWeek: number;       // kg/week, 1 decimal
  isAggressive: boolean;     // true if > 1.0 loss or > 0.5 gain per week
}

// --- Constants ---

const VALID_ACTIVITY_MULTIPLIERS: readonly number[] = [1.2, 1.375, 1.55, 1.725, 1.9];

const VALID_FITNESS_GOALS: readonly FitnessGoal[] = [
  'lose_fat_keep_muscle',
  'aggressive_fat_loss',
  'lean_bulk',
  'bulk',
  'body_recomposition',
  'maintain_weight',
];

const GOAL_ADJUSTMENTS: Record<FitnessGoal, number> = {
  lose_fat_keep_muscle: -0.20,
  aggressive_fat_loss: -0.30,
  lean_bulk: 0.10,
  bulk: 0.20,
  body_recomposition: 0,
  maintain_weight: 0,
};

// Goals that get +5% protein adjustment
const PROTEIN_BOOST_GOALS: readonly FitnessGoal[] = [
  'lose_fat_keep_muscle',
  'aggressive_fat_loss',
  'body_recomposition',
];

// Base macro splits by dietary preference: [protein%, carbs%, fat%]
const BASE_MACRO_SPLITS: Record<DietaryPreference, [number, number, number]> = {
  no_preference: [30, 40, 30],
  vegetarian: [30, 40, 30],
  vegan: [30, 40, 30],
  keto: [25, 5, 70],
  paleo: [35, 25, 40],
};

// --- Helper ---

/**
 * Round-half-up: standard mathematical rounding.
 */
function roundHalfUp(value: number): number {
  return Math.round(value);
}

/**
 * Round to one decimal place.
 */
function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

// --- BMR Calculation ---

/**
 * Calculate Basal Metabolic Rate using the Mifflin-St Jeor equation.
 *
 * Male:   (10 × weight) + (6.25 × height) − (5 × age) + 5
 * Female: (10 × weight) + (6.25 × height) − (5 × age) − 161
 *
 * Returns a discriminated union: success with BMR or error with field info.
 */
export function calculateBmr(input: BmrInput): BmrOutput {
  // Validate sex
  if (input.sex !== 'male' && input.sex !== 'female') {
    return { success: false, error: 'A valid sex selection is required (male or female).', field: 'sex' };
  }

  // Validate weight: 20.0-300.0
  if (input.weight == null || input.weight < 20 || input.weight > 300) {
    return { success: false, error: 'Weight must be between 20.0 and 300.0 kg.', field: 'weight' };
  }

  // Validate height: 100-250
  if (input.height == null || input.height < 100 || input.height > 250) {
    return { success: false, error: 'Height must be between 100 and 250 cm.', field: 'height' };
  }

  // Validate age: 13-120
  if (input.age == null || input.age < 13 || input.age > 120) {
    return { success: false, error: 'Age must be between 13 and 120 years.', field: 'age' };
  }

  const offset = input.sex === 'male' ? 5 : -161;
  const bmr = (10 * input.weight) + (6.25 * input.height) - (5 * input.age) + offset;

  return { success: true, bmr: roundHalfUp(bmr) };
}

// --- TDEE Calculation ---

/**
 * Calculate Total Daily Energy Expenditure.
 * TDEE = round(BMR × activityMultiplier)
 */
export function calculateTdee(input: TdeeInput): number {
  if (!VALID_ACTIVITY_MULTIPLIERS.includes(input.activityMultiplier)) {
    throw new Error(
      `Invalid activity multiplier: ${input.activityMultiplier}. Must be one of ${VALID_ACTIVITY_MULTIPLIERS.join(', ')}.`
    );
  }

  return roundHalfUp(input.bmr * input.activityMultiplier);
}

// --- Calorie Target Calculation ---

/**
 * Calculate daily calorie target based on TDEE and fitness goal.
 *
 * Applies goal percentage adjustment, then enforces floor and cap:
 * - Floor: 1200 (female 18+), 1500 (male 18+), 1400 (female 13-17), 1600 (male 13-17)
 * - Cap: 5000
 *
 * Per Requirement 7.7: floor check first, then round as final step.
 */
export function calculateCalorieTarget(input: CalorieTargetInput): number {
  if (!VALID_FITNESS_GOALS.includes(input.goal)) {
    throw new Error(`Invalid fitness goal: ${input.goal}.`);
  }

  const adjustment = GOAL_ADJUSTMENTS[input.goal];
  let target = input.tdee * (1 + adjustment);

  // Determine floor based on sex and age
  const isTeen = input.age >= 13 && input.age <= 17;
  let floor: number;
  if (isTeen) {
    floor = input.sex === 'female' ? 1400 : 1600;
  } else {
    floor = input.sex === 'female' ? 1200 : 1500;
  }

  // Enforce floor
  if (target < floor) {
    target = floor;
  }

  // Enforce cap
  if (target > 5000) {
    target = 5000;
  }

  // Round as final step
  return roundHalfUp(target);
}

// --- Macro Calculation ---

/**
 * Calculate macronutrient targets in grams.
 *
 * Process:
 * 1. Get base split from dietary preference
 * 2. Apply goal adjustment (+5% protein, -5% carbs for fat loss/recomp goals)
 * 3. Apply age adjustment (+5% protein, -5% carbs for ages 13-17 and 50+)
 * 4. Cap combined protein increase at 15pp above base
 * 5. Enforce 10% carbs floor
 * 6. Convert percentages to grams
 * 7. Verify ≤10 kcal tolerance, adjust carbs if needed
 */
export function calculateMacros(input: MacroInput): MacroTargets {
  // Get base split (default to balanced if unknown preference)
  const baseSplit = BASE_MACRO_SPLITS[input.dietaryPreference] ?? BASE_MACRO_SPLITS['no_preference'];
  const [baseProtein, baseCarbs, baseFat] = baseSplit;

  let proteinPct = baseProtein;
  let carbsPct = baseCarbs;
  const fatPct = baseFat;

  // Track total protein increase for cap enforcement
  let proteinIncrease = 0;

  // Step 2: Goal adjustment (+5% protein, -5% carbs for specific goals)
  if (PROTEIN_BOOST_GOALS.includes(input.goal)) {
    proteinIncrease += 5;
  }

  // Step 3: Age adjustment (+5% protein, -5% carbs for teens and 50+)
  if ((input.age >= 13 && input.age <= 17) || input.age >= 50) {
    proteinIncrease += 5;
  }

  // Step 4: Cap combined protein increase at 15pp
  if (proteinIncrease > 15) {
    proteinIncrease = 15;
  }

  // Apply protein increase and reduce carbs accordingly
  proteinPct = baseProtein + proteinIncrease;
  carbsPct = baseCarbs - proteinIncrease;

  // Step 5: Enforce 10% carbs floor regardless of combined adjustments
  if (carbsPct < 10) {
    const deficit = 10 - carbsPct;
    carbsPct = 10;
    // Reduce protein to maintain 100% total
    proteinPct = proteinPct - deficit;
  }

  // Ensure percentages sum to 100
  // fatPct stays fixed, adjust if needed (shouldn't be needed with current logic)
  // proteinPct + carbsPct + fatPct should = 100

  // Step 6: Convert percentages to grams
  const proteinGrams = roundHalfUp((input.dailyCalories * (proteinPct / 100)) / 4);
  let carbsGrams = roundHalfUp((input.dailyCalories * (carbsPct / 100)) / 4);
  const fatGrams = roundHalfUp((input.dailyCalories * (fatPct / 100)) / 9);

  // Step 7: Verify ≤10 kcal tolerance, adjust carbs if needed
  let macroCalories = proteinGrams * 4 + carbsGrams * 4 + fatGrams * 9;
  let iterations = 0;
  const maxIterations = 20; // safety limit

  while (Math.abs(macroCalories - input.dailyCalories) > 10 && iterations < maxIterations) {
    if (macroCalories > input.dailyCalories) {
      carbsGrams -= 1;
    } else {
      carbsGrams += 1;
    }
    macroCalories = proteinGrams * 4 + carbsGrams * 4 + fatGrams * 9;
    iterations++;
  }

  return {
    protein: proteinGrams,
    carbs: carbsGrams,
    fat: fatGrams,
  };
}

// --- Weekly Rate Calculation ---

/**
 * Calculate weekly weight change rate and determine if it's aggressive.
 *
 * Rate = (targetWeight - currentWeight) / durationWeeks, rounded to 1 decimal.
 * Aggressive if rate < -1.0 (losing > 1kg/week) or > +0.5 (gaining > 0.5kg/week).
 */
export function calculateWeeklyRate(input: WeeklyRateInput): WeeklyRateResult {
  const rate = (input.targetWeight - input.currentWeight) / input.durationWeeks;
  const ratePerWeek = roundToOneDecimal(rate);

  return {
    ratePerWeek,
    isAggressive: ratePerWeek < -1.0 || ratePerWeek > 0.5,
  };
}
