import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useFoodLogStore } from '../../store/useFoodLogStore';
import { getMealTypeByTime } from '../../engines/foodLogEngine';
import { searchUsda } from '../../lib/usdaApi';
import { searchLocalDatabase, LOCAL_FOOD_DATABASE } from '../../lib/localFoodDatabase';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../i18n';
import { useUserStore } from '../../store/useUserStore';
import type { MealType } from '../../engines/foodLogEngine';
import type { UsdaSearchResult } from '../../lib/usdaApi';

interface QuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  name: string;
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'local' | 'usda';
  fdcId?: number;
}

interface FormErrors {
  foodName?: string;
  calories?: string;
}

function localizeFoodName(foodName: string, lang: string): string {
  const isIndonesian = lang === 'Bahasa Indonesia';
  const match = LOCAL_FOOD_DATABASE.find(
    (item) =>
      item.name.toLowerCase() === foodName.toLowerCase() ||
      item.nameEn.toLowerCase() === foodName.toLowerCase()
  );
  if (match) {
    return isIndonesian ? match.name : match.nameEn;
  }
  return foodName;
}

// ─── Built-in Indonesian → English food translation dictionary ──────────────
// Used as instant local fallback so searches work even without a Supabase
// food_translations table or internet connection.
const ID_TO_EN_FOOD_DICT: Record<string, string> = {
  // Proteins
  'ayam': 'chicken', 'daging': 'beef', 'ikan': 'fish', 'telur': 'egg',
  'udang': 'shrimp', 'cumi': 'squid', 'kepiting': 'crab', 'tuna': 'tuna',
  'salmon': 'salmon', 'sarden': 'sardine', 'daging sapi': 'beef',
  'daging babi': 'pork', 'kambing': 'lamb', 'bebek': 'duck',
  'tempe': 'tempeh', 'tahu': 'tofu', 'kacang': 'bean', 'kacang tanah': 'peanut',
  'kacang merah': 'kidney bean', 'kacang kedelai': 'soybean',
  // Grains & Carbs
  'nasi': 'rice', 'nasi putih': 'white rice', 'nasi merah': 'brown rice',
  'nasi goreng': 'fried rice', 'roti': 'bread', 'mie': 'noodle',
  'pasta': 'pasta', 'kentang': 'potato', 'singkong': 'cassava',
  'jagung': 'corn', 'ubi': 'sweet potato', 'oatmeal': 'oatmeal',
  'gandum': 'wheat', 'quinoa': 'quinoa', 'sagu': 'sago',
  // Vegetables
  'bayam': 'spinach', 'kangkung': 'water spinach', 'brokoli': 'broccoli',
  'wortel': 'carrot', 'tomat': 'tomato', 'timun': 'cucumber',
  'terong': 'eggplant', 'buncis': 'green bean', 'kubis': 'cabbage',
  'selada': 'lettuce', 'paprika': 'bell pepper', 'bawang': 'onion',
  'bawang putih': 'garlic', 'bawang merah': 'shallot', 'jahe': 'ginger',
  'kunyit': 'turmeric', 'labu': 'pumpkin', 'pare': 'bitter melon',
  'kacang panjang': 'long bean', 'daun singkong': 'cassava leaf',
  // Fruits
  'pisang': 'banana', 'apel': 'apple', 'jeruk': 'orange', 'mangga': 'mango',
  'nanas': 'pineapple', 'semangka': 'watermelon', 'pepaya': 'papaya',
  'melon': 'melon', 'anggur': 'grape', 'stroberi': 'strawberry',
  'alpukat': 'avocado', 'durian': 'durian', 'rambutan': 'rambutan',
  'lemon': 'lemon', 'kelapa': 'coconut', 'kelapa muda': 'coconut water',
  // Dairy & Eggs
  'susu': 'milk', 'keju': 'cheese', 'yoghurt': 'yogurt', 'yogurt': 'yogurt',
  'mentega': 'butter', 'krim': 'cream', 'es krim': 'ice cream',
  // Oils & Fats
  'minyak': 'oil', 'minyak goreng': 'cooking oil', 'minyak zaitun': 'olive oil',
  'minyak kelapa': 'coconut oil', 'margarin': 'margarine',
  // Snacks & Sweets
  'coklat': 'chocolate', 'kue': 'cake', 'biskuit': 'biscuit', 'keripik': 'chips',
  'permen': 'candy', 'madu': 'honey', 'gula': 'sugar', 'gula merah': 'brown sugar',
  'selai': 'jam', 'selai kacang': 'peanut butter',
  // Drinks
  'kopi': 'coffee', 'teh': 'tea', 'jus': 'juice', 'air': 'water',
  // Indonesian dishes
  'rendang': 'rendang beef', 'soto': 'soto soup', 'gado-gado': 'gado gado',
  'sate': 'satay', 'bakso': 'meatball soup', 'mie goreng': 'fried noodle',
  'nasi uduk': 'coconut rice', 'opor': 'chicken opor', 'gulai': 'curry',
  'pecel': 'pecel vegetable salad', 'rawon': 'rawon beef soup',
  'tongseng': 'tongseng', 'semur': 'semur', 'capcay': 'cap cay',
  'lumpia': 'spring roll', 'martabak': 'martabak', 'siomay': 'siomay',
  'bubur': 'porridge', 'bubur ayam': 'chicken porridge',
  'pempek': 'pempek fish cake', 'ketoprak': 'ketoprak tofu',
  'lontong': 'rice cake', 'ketupat': 'rice cake',
};

/** Translates an Indonesian food query to English using local dict then Supabase. */
async function translateQuery(query: string): Promise<string> {
  const q = query.toLowerCase().trim();
  // 1. Try exact match in local dict
  if (ID_TO_EN_FOOD_DICT[q]) return ID_TO_EN_FOOD_DICT[q];
  // 2. Try partial/prefix match in local dict (e.g. "ayam goreng" → key "ayam")
  const partialKey = Object.keys(ID_TO_EN_FOOD_DICT).find(
    (key) => q.startsWith(key) || key.startsWith(q)
  );
  if (partialKey) return ID_TO_EN_FOOD_DICT[partialKey];
  // 3. Try Supabase food_translations table as extended lookup
  try {
    const { data } = await supabase.from('food_translations').select('english_term').ilike('indonesian_term', q).limit(1);
    if (data && data.length > 0) return data[0].english_term;
  } catch { /* ignore */ }
  return query; // fallback: original query unchanged
}

async function searchLocalFoods(query: string): Promise<SearchResult[]> {
  try {
    const { data, error } = await supabase.from('food_items').select('food_name, serving_description, serving_weight_grams, calories, protein, carbs, fat').ilike('food_name', `%${query}%`).limit(20);
    if (error || !data) return [];
    return data.map((item) => ({ name: item.food_name, serving: item.serving_description || `${item.serving_weight_grams}g`, calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat, source: 'local' as const }));
  } catch { return []; }
}

async function searchUsdaFoods(query: string): Promise<SearchResult[]> {
  try {
    const results = await searchUsda(query);
    return results.map((item: UsdaSearchResult) => ({ name: item.description, serving: `${item.servingSize}${item.servingSizeUnit}`, calories: Math.round(item.calories), protein: Math.round(item.protein * 10) / 10, carbs: Math.round(item.carbs * 10) / 10, fat: Math.round(item.fat * 10) / 10, source: 'usda' as const, fdcId: item.fdcId }));
  } catch { return []; }
}

async function cacheUsdaResult(result: SearchResult): Promise<void> {
  if (result.source !== 'usda' || !result.fdcId) return;
  try { await supabase.from('food_items').upsert({ food_name: result.name, category: 'Uncategorized', serving_description: result.serving, serving_weight_grams: parseFloat(result.serving) || 100, calories: result.calories, protein: result.protein, carbs: result.carbs, fat: result.fat, data_source: 'usda', usda_fdc_id: result.fdcId, search_terms: [result.name.toLowerCase()] }, { onConflict: 'usda_fdc_id' }); } catch {}
}

async function searchFoods(query: string, lang: string): Promise<{ results: SearchResult[]; isOffline: boolean }> {
  const isOnline = navigator.onLine;
  const q = query.trim();

  // --- 1. Search curated local database FIRST (highest priority, no network needed) ---
  const curatedItems = searchLocalDatabase(q, lang);
  const curatedResults: SearchResult[] = curatedItems.map((item) => ({
    name: item.displayName,   // language-appropriate name
    serving: item.serving,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
    source: 'local' as const,
  }));

  // Translate query (using local dict + optional Supabase)
  const translatedQuery = isOnline ? await translateQuery(q) : q;
  const isSameQuery = translatedQuery.toLowerCase() === q.toLowerCase();

  // Local DB search — try both original and translated term
  const localSearches = isSameQuery
    ? [searchLocalFoods(q)]
    : [searchLocalFoods(q), searchLocalFoods(translatedQuery)];

  if (!isOnline) {
    const allLocal = await Promise.all(localSearches);
    const curatedNames = new Set(curatedResults.map((r) => r.name.toLowerCase()));
    const extraLocal = dedupeByName(allLocal.flat()).filter((r) => !curatedNames.has(r.name.toLowerCase()));
    return { results: dedupeByName([...curatedResults, ...extraLocal]).slice(0, 20), isOffline: true };
  }

  // Online: search Supabase local DB + USDA in parallel
  const usdaSearches = isSameQuery
    ? [searchUsdaFoods(translatedQuery)]
    : [searchUsdaFoods(translatedQuery), searchUsdaFoods(q)];

  const [allLocal, allUsda] = await Promise.all([
    Promise.all(localSearches),
    Promise.all(usdaSearches),
  ]);

  // Merge: curated first, then Supabase local, then USDA (deduplicated)
  const curatedNames = new Set(curatedResults.map((r) => r.name.toLowerCase()));
  const supabaseResults = dedupeByName(allLocal.flat()).filter((r) => !curatedNames.has(r.name.toLowerCase()));
  const allKnownNames = new Set([...curatedResults, ...supabaseResults].map((r) => r.name.toLowerCase()));
  const usdaResults = dedupeByName(allUsda.flat()).filter((r) => !allKnownNames.has(r.name.toLowerCase()));

  return {
    results: [...curatedResults, ...supabaseResults, ...usdaResults].slice(0, 20),
    isOffline: false,
  };
}

/** Remove duplicate search results by name (case-insensitive, keep first occurrence). */
function dedupeByName(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((r) => {
    const key = r.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}


export function QuickAddSheet({ isOpen, onClose }: QuickAddSheetProps) {
  const { addEntry, selectedDate } = useFoodLogStore();
  const { t, language } = useTranslation();
  const { settings } = useUserStore();
  const isLight = !document.documentElement.classList.contains('dark');

  const MEAL_TYPES: { id: MealType; label: string }[] = [
    { id: 'breakfast', label: t('nutrition.breakfast') },
    { id: 'lunch',     label: t('nutrition.lunch') },
    { id: 'dinner',    label: t('nutrition.dinner') },
    { id: 'snack',     label: t('nutrition.snack') },
  ];
  const [mealType, setMealType] = useState<MealType>(() => getMealTypeByTime(new Date().getHours()));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [appliedSource, setAppliedSource] = useState<'manual' | 'search' | 'usda'>('manual');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => { if (isOpen) { setMealType(getMealTypeByTime(new Date().getHours())); setSearchQuery(''); setSearchResults([]); setIsSearching(false); setSearchError(false); setIsOffline(false); setFoodName(''); setCalories(''); setProtein(''); setCarbs(''); setFat(''); setAppliedSource('manual'); setErrors({}); } }, [isOpen]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchQuery.length < 2) { setSearchResults([]); setIsSearching(false); setSearchError(false); setIsOffline(false); return; }
    setIsSearching(true); setSearchError(false);
    searchTimeoutRef.current = setTimeout(async () => {
      try { const { results, isOffline: offline } = await searchFoods(searchQuery, language); setSearchResults(results.slice(0, 20)); setIsOffline(offline); setIsSearching(false); }
      catch { setSearchError(true); setIsSearching(false); setSearchResults([]); }
    }, 400);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery, language]);

  const handleApplyResult = useCallback((result: SearchResult) => {
    setFoodName(result.name); setCalories(String(result.calories)); setProtein(String(result.protein)); setCarbs(String(result.carbs)); setFat(String(result.fat));
    setAppliedSource(result.source === 'usda' ? 'usda' : 'search'); setSearchQuery(''); setSearchResults([]); setErrors({});
    if (result.source === 'usda') void cacheUsdaResult(result);
  }, []);

  const handleNumericInput = (value: string, setter: (v: string) => void, max: number, allowDecimal = false) => {
    const pattern = allowDecimal ? /^[0-9]*\.?[0-9]*$/ : /^[0-9]*$/;
    if (!pattern.test(value)) return;
    const numVal = parseFloat(value);
    if (value !== '' && !isNaN(numVal) && numVal > max) return;
    setter(value);
  };

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    if (!foodName.trim()) newErrors.foodName = 'Nama makanan wajib diisi';
    const calVal = parseInt(calories);
    if (!calories || isNaN(calVal) || calVal < 1) newErrors.calories = 'Kalori wajib diisi (min 1)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [foodName, calories]);

  const handleAddEntry = useCallback(() => {
    if (!validate()) return;
    addEntry({ date: selectedDate, mealType, foodName: foodName.trim(), calories: parseInt(calories) || 0, protein: parseFloat(protein) || 0, carbs: parseFloat(carbs) || 0, fat: parseFloat(fat) || 0, source: appliedSource });
    onClose();
  }, [validate, addEntry, selectedDate, mealType, foodName, calories, protein, carbs, fat, appliedSource, onClose]);

  // Most frequently used foods (top 5 by count)
  const { entries: allEntries } = useFoodLogStore();
  const [showAllFrequent, setShowAllFrequent] = useState(false);
  const frequentFoods = (() => {
    const countMap = new Map<string, { count: number; entry: typeof allEntries[0] }>();
    allEntries.filter(e => !e.isDeleted && e.foodName).forEach(e => {
      const existing = countMap.get(e.foodName);
      if (existing) existing.count++;
      else countMap.set(e.foodName, { count: 1, entry: e });
    });
    return [...countMap.values()].sort((a, b) => b.count - a.count).slice(0, 8).map(x => x.entry);
  })();

  return (
    <AnimatePresence>
      {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="nutrition-overlay fixed inset-0 bg-[#16181c] z-[200] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-14 pb-3">
              <motion.button 
                whileTap={{ scale: 0.9 }} 
                onClick={onClose} 
                className={`w-9 h-9 rounded-xl border-[2px] flex items-center justify-center transition-all ${
                  isLight
                    ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
                    : 'border-white/10 bg-[#2a2c32] text-white shadow-none'
                }`}
              >
                <Icon icon="ph:arrow-left-bold" width={16} />
              </motion.button>
              <h2 className="text-[18px] font-black font-['Outfit'] text-white">Tambah Cepat</h2>
              <div className="w-9" />
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-5">
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 ml-1">Jenis Makan</p>
                <div className="flex gap-2">
                  {MEAL_TYPES.map((meal) => (
                    <motion.button key={meal.id} whileTap={{ scale: 0.95 }} onClick={() => setMealType(meal.id)}
                      className={`flex-1 py-2.5 rounded-xl font-bold font-['Outfit'] text-[11px] transition-all ${mealType === meal.id ? 'bg-[#00FF85] text-black border-2 border-black' : 'bg-[#2a2c32] text-white/60 border border-white/10'}`}>{meal.label}</motion.button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 ml-1">Cari Makanan</p>
                <div className="h-12 bg-[#2a2c32] rounded-2xl border border-white/10 px-4 flex items-center gap-3 focus-within:border-[#00FF85]/50">
                  <Icon icon="ph:magnifying-glass" width={18} className="text-white/30 shrink-0" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari makanan..." className="w-full bg-transparent border-none outline-none text-[14px] font-['Outfit'] text-white placeholder:text-white/20" />
                  {searchQuery && <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setSearchQuery(''); setSearchResults([]); }}><Icon icon="ph:x-circle-fill" width={18} className="text-white/30" /></motion.button>}
                </div>
                {isSearching && <div className="flex items-center gap-2 mt-3 ml-1"><Icon icon="ph:spinner" width={16} className="text-[#00FF85] animate-spin" /><span className="text-[12px] text-white/40">Mencari...</span></div>}
                {searchError && <div className="flex items-center gap-2 mt-3 ml-1 bg-[#FF4D00]/10 border border-[#FF4D00]/20 rounded-xl p-3"><Icon icon="ph:warning-circle-fill" width={16} className="text-[#FF4D00] shrink-0" /><span className="text-[11px] text-[#FF4D00]/80">Pencarian tidak tersedia. Tambah manual di bawah.</span></div>}
                {isOffline && searchResults.length > 0 && <div className="flex items-center gap-2 mt-3 ml-1 bg-[#FFB800]/10 border border-[#FFB800]/20 rounded-xl p-2.5"><Icon icon="ph:wifi-slash" width={14} className="text-[#FFB800] shrink-0" /><span className="text-[10px] text-[#FFB800]/80">Offline — hanya hasil lokal</span></div>}
                {searchResults.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div key={`${result.name}-${index}`} className="bg-[#2a2c32] rounded-xl border border-white/5 p-3 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2"><p className="text-[13px] font-bold font-['Outfit'] text-white truncate">{result.name}</p>{result.source === 'usda' && <span className="shrink-0 px-1.5 py-0.5 rounded bg-[#4A90D9]/20 border border-[#4A90D9]/30 text-[9px] font-bold text-[#4A90D9] uppercase">USDA</span>}</div>
                          <p className="text-[11px] text-white/30">{result.serving}</p>
                          <p className="text-[10px] font-['Outfit'] font-semibold tracking-normal mt-0.5">
                            <span className="text-[#00FF85]">P: {result.protein}g</span>
                            <span className="text-white/20">  </span>
                            <span className="text-[#FFB800]">C: {result.carbs}g</span>
                            <span className="text-white/20">  </span>
                            <span className="text-[#FF6B6B]">F: {result.fat}g</span>
                          </p>
                        </div>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleApplyResult(result)} className="px-3 py-1.5 rounded-lg bg-[#00FF85]/10 border border-[#00FF85]/30 text-[11px] font-bold text-[#00FF85] shrink-0">Pakai</motion.button>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && !isSearching && !searchError && searchResults.length === 0 && <p className="text-[11px] text-white/30 mt-3 ml-1">Tidak ditemukan. Coba kata lain atau tambah manual.</p>}
                {/* Frequent foods - show when not searching */}
                {searchQuery.length < 2 && frequentFoods.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.15em] mb-2">Sering Ditambah</p>
                      <div className="space-y-2">
                        {(showAllFrequent ? frequentFoods : frequentFoods.slice(0, 4)).map((entry, i) => {
                          const displayName = localizeFoodName(entry.foodName, language);
                          return (
                            <motion.button key={`freq-${i}`} whileTap={{ scale: 0.98 }} onClick={() => handleApplyResult({ name: displayName, serving: '', calories: entry.calories, protein: entry.protein, carbs: entry.carbs, fat: entry.fat, source: 'local' })}
                              className="w-full flex items-center justify-between bg-[#2a2c32]/50 border border-white/5 rounded-xl px-4 py-3 text-left">
                              <div>
                                <p className="text-[13px] font-bold text-white font-['Outfit']">{displayName}</p>
                                <p className="text-[10px] font-['Outfit'] font-semibold tracking-normal mt-0.5">
                                  <span className="text-white/50">{entry.calories} kcal</span>
                                  <span className="text-white/20"> · </span>
                                  <span className="text-[#00FF85]">P: {Math.round(entry.protein)}g</span>
                                  <span className="text-white/20">  </span>
                                  <span className="text-[#FFB800]">C: {Math.round(entry.carbs)}g</span>
                                  <span className="text-white/20">  </span>
                                  <span className="text-[#FF6B6B]">F: {Math.round(entry.fat)}g</span>
                                </p>
                              </div>
                              <Icon icon="ph:plus-circle-bold" width={20} className="text-[#00FF85]/60" />
                            </motion.button>
                          );
                        })}
                        {!showAllFrequent && frequentFoods.length > 4 && (
                          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAllFrequent(true)} className="w-full py-2.5 text-center text-[11px] font-bold text-[#00FF85]/70 font-['Outfit']">
                            Lihat Selengkapnya ({frequentFoods.length - 4} lagi)
                          </motion.button>
                        )}
                      </div>
                    </div>
                )}
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Detail Makanan</p>
                <div>
                  <div className={`h-12 bg-[#2a2c32] rounded-2xl border px-4 flex items-center ${errors.foodName ? 'border-red-400/60' : 'border-white/10 focus-within:border-[#00FF85]/50'}`}>
                    <input type="text" value={foodName} onChange={(e) => { if (e.target.value.length <= 100) { setFoodName(e.target.value); if (errors.foodName) setErrors(prev => ({ ...prev, foodName: undefined })); } }} placeholder="Nama makanan" className="w-full bg-transparent border-none outline-none text-[14px] font-['Outfit'] text-white placeholder:text-white/20" />
                  </div>
                  {errors.foodName && <p className="text-[11px] text-red-400 mt-1.5 ml-1">{errors.foodName}</p>}
                </div>
                <div>
                  <div className={`h-12 bg-[#2a2c32] rounded-2xl border px-4 flex items-center ${errors.calories ? 'border-red-400/60' : 'border-white/10 focus-within:border-[#00FF85]/50'}`}>
                    <input type="text" inputMode="numeric" value={calories} onChange={(e) => { handleNumericInput(e.target.value, setCalories, 99999); if (errors.calories) setErrors(prev => ({ ...prev, calories: undefined })); }} placeholder="Kalori" className="w-full bg-transparent border-none outline-none text-[14px] font-['Outfit'] text-white placeholder:text-white/20" />
                    <span className="text-[11px] font-bold text-white/40 ml-2">kcal</span>
                  </div>
                  {errors.calories && <p className="text-[11px] text-red-400 mt-1.5 ml-1">{errors.calories}</p>}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 bg-[#2a2c32] rounded-2xl border border-white/10 px-3 flex items-center focus-within:border-[#00FF85]/50">
                    <input type="text" inputMode="decimal" value={protein} onChange={(e) => handleNumericInput(e.target.value, setProtein, 9999, true)} placeholder="Protein" className="w-full bg-transparent border-none outline-none text-[13px] font-['Outfit'] text-white placeholder:text-white/20" />
                    <span className="text-[10px] font-bold text-white/40 ml-1">g</span>
                  </div>
                  <div className="h-12 bg-[#2a2c32] rounded-2xl border border-white/10 px-3 flex items-center focus-within:border-[#00FF85]/50">
                    <input type="text" inputMode="decimal" value={carbs} onChange={(e) => handleNumericInput(e.target.value, setCarbs, 9999, true)} placeholder="Karbo" className="w-full bg-transparent border-none outline-none text-[13px] font-['Outfit'] text-white placeholder:text-white/20" />
                    <span className="text-[10px] font-bold text-white/40 ml-1">g</span>
                  </div>
                  <div className="h-12 bg-[#2a2c32] rounded-2xl border border-white/10 px-3 flex items-center focus-within:border-[#00FF85]/50">
                    <input type="text" inputMode="decimal" value={fat} onChange={(e) => handleNumericInput(e.target.value, setFat, 9999, true)} placeholder="Lemak" className="w-full bg-transparent border-none outline-none text-[13px] font-['Outfit'] text-white placeholder:text-white/20" />
                    <span className="text-[10px] font-bold text-white/40 ml-1">g</span>
                  </div>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleAddEntry} className="w-full h-14 rounded-2xl bg-[#00FF85] text-black font-black font-['Outfit'] text-[14px] uppercase tracking-wider flex items-center justify-center gap-2 mt-2">
                <Icon icon="ph:plus-bold" width={18} />Tambah
              </motion.button>
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  );
}
