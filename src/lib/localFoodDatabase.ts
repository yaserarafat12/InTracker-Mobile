/**
 * Curated Local Food Database — Bilingual (Indonesian + English)
 * Nutritional values per serving as indicated.
 * Sources: DKBM (Indonesia) + USDA Foundation Foods.
 */

export interface LocalFoodItem {
  /** Primary name in Indonesian */
  name: string;
  /** Primary name in English */
  nameEn: string;
  /** Tags for search matching (both languages) */
  tags: string[];
  /** Serving description */
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const LOCAL_FOOD_DATABASE: LocalFoodItem[] = [

  // ─── AYAM / CHICKEN ────────────────────────────────────────────────────────
  { name: 'Dada Ayam Tanpa Kulit, Rebus', nameEn: 'Chicken Breast, Skinless, Cooked', tags: ['ayam', 'dada', 'chicken breast', 'skinless'], serving: '100g', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Dada Ayam dengan Kulit, Rebus', nameEn: 'Chicken Breast with Skin, Cooked', tags: ['ayam', 'dada', 'chicken breast', 'kulit', 'skin'], serving: '100g', calories: 197, protein: 29.8, carbs: 0, fat: 7.8 },
  { name: 'Dada Ayam Goreng', nameEn: 'Chicken Breast, Fried', tags: ['ayam goreng', 'dada', 'fried chicken breast', 'ayam'], serving: '100g', calories: 187, protein: 32, carbs: 0.4, fat: 5.5 },
  { name: 'Dada Ayam Panggang / Bakar', nameEn: 'Chicken Breast, Grilled', tags: ['ayam panggang', 'ayam bakar', 'grilled chicken', 'dada', 'ayam'], serving: '100g', calories: 165, protein: 25, carbs: 0, fat: 6 },
  { name: 'Paha Atas Ayam Tanpa Kulit, Rebus', nameEn: 'Chicken Thigh, Skinless, Cooked', tags: ['ayam', 'paha atas', 'chicken thigh', 'poultry'], serving: '100g', calories: 209, protein: 26, carbs: 0, fat: 10.9 },
  { name: 'Paha Atas Ayam Goreng', nameEn: 'Chicken Thigh, Fried', tags: ['ayam goreng', 'paha atas', 'fried chicken thigh', 'ayam'], serving: '100g', calories: 230, protein: 24, carbs: 4, fat: 12.5 },
  { name: 'Paha Bawah Ayam (Drumstick), Rebus', nameEn: 'Chicken Drumstick, Cooked', tags: ['ayam', 'paha bawah', 'drumstick', 'chicken leg'], serving: '100g', calories: 172, protein: 28.3, carbs: 0, fat: 5.7 },
  { name: 'Paha Bawah Ayam (Drumstick), Goreng', nameEn: 'Chicken Drumstick, Fried', tags: ['ayam goreng', 'paha bawah', 'drumstick goreng', 'fried drumstick', 'ayam'], serving: '100g', calories: 216, protein: 26, carbs: 3.5, fat: 10.5 },
  { name: 'Sayap Ayam, Rebus', nameEn: 'Chicken Wing, Cooked', tags: ['ayam', 'sayap', 'chicken wing', 'wings'], serving: '100g', calories: 203, protein: 27, carbs: 0, fat: 10.2 },
  { name: 'Sayap Ayam Goreng', nameEn: 'Chicken Wing, Fried', tags: ['ayam goreng', 'sayap', 'chicken wings', 'buffalo wings', 'ayam'], serving: '100g', calories: 290, protein: 27, carbs: 8, fat: 19.5 },
  { name: 'Ayam Goreng (Umum)', nameEn: 'Fried Chicken (General)', tags: ['ayam goreng', 'fried chicken', 'ayam'], serving: '100g', calories: 246, protein: 24, carbs: 8, fat: 12 },
  { name: 'Hati Ayam, Rebus', nameEn: 'Chicken Liver, Cooked', tags: ['hati ayam', 'chicken liver', 'ayam'], serving: '100g', calories: 119, protein: 16.9, carbs: 0.9, fat: 4.8 },
  { name: 'Ampela Ayam', nameEn: 'Chicken Gizzard', tags: ['ampela', 'chicken gizzard', 'rempela', 'ayam'], serving: '100g', calories: 94, protein: 17.7, carbs: 0, fat: 2.1 },
  { name: 'Nugget Ayam Goreng', nameEn: 'Chicken Nuggets, Fried', tags: ['nugget', 'chicken nugget', 'nugget ayam', 'ayam'], serving: '100g', calories: 296, protein: 14, carbs: 22, fat: 16.5 },

  // ─── TELUR / EGGS ──────────────────────────────────────────────────────────
  { name: 'Telur Ayam Rebus (1 butir)', nameEn: 'Boiled Egg (1 whole)', tags: ['telur rebus', 'boiled egg', 'telur', 'egg', 'hard boiled'], serving: '1 butir (50g)', calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3 },
  { name: 'Telur Goreng / Ceplok (1 butir)', nameEn: 'Fried Egg (1 whole)', tags: ['telur goreng', 'telur ceplok', 'fried egg', 'telur', 'egg'], serving: '1 butir (50g)', calories: 90, protein: 6.3, carbs: 0.4, fat: 7 },
  { name: 'Telur Dadar / Omelette', nameEn: 'Omelette / Egg Omelette', tags: ['telur dadar', 'omelette', 'telur', 'egg'], serving: '100g', calories: 154, protein: 10.6, carbs: 2.2, fat: 11 },
  { name: 'Telur Mata Sapi (1 butir)', nameEn: 'Sunny Side Up Egg (1)', tags: ['telur mata sapi', 'sunny side up', 'telur goreng', 'telur', 'egg'], serving: '1 butir (46g)', calories: 90, protein: 6.3, carbs: 0.3, fat: 7 },
  { name: 'Telur Orak-Arik (Scrambled)', nameEn: 'Scrambled Eggs', tags: ['telur orak arik', 'scrambled egg', 'telur', 'egg'], serving: '100g', calories: 149, protein: 10, carbs: 1.6, fat: 11 },
  { name: 'Putih Telur (1 butir)', nameEn: 'Egg White (1 egg)', tags: ['putih telur', 'egg white', 'protein telur'], serving: '1 butir (33g)', calories: 17, protein: 3.6, carbs: 0.2, fat: 0.1 },
  { name: 'Kuning Telur (1 butir)', nameEn: 'Egg Yolk (1 egg)', tags: ['kuning telur', 'egg yolk', 'yolk'], serving: '1 butir (17g)', calories: 55, protein: 2.7, carbs: 0.6, fat: 4.5 },
  { name: 'Telur Puyuh Rebus (1 butir)', nameEn: 'Quail Egg, Boiled (1)', tags: ['telur puyuh', 'quail egg', 'puyuh'], serving: '1 butir (10g)', calories: 14, protein: 1.2, carbs: 0.04, fat: 1 },
  { name: 'Telur Asin (1 butir)', nameEn: 'Salted Egg (1 whole)', tags: ['telur asin', 'salted egg', 'telur'], serving: '1 butir (50g)', calories: 80, protein: 6, carbs: 0.5, fat: 6 },

  // ─── NASI & KARBOHIDRAT / RICE & CARBS ─────────────────────────────────────
  { name: 'Nasi Putih (Matang)', nameEn: 'White Rice, Cooked', tags: ['nasi', 'nasi putih', 'white rice', 'rice', 'cooked rice'], serving: '100g', calories: 130, protein: 2.7, carbs: 28.2, fat: 0.3 },
  { name: 'Nasi Merah (Matang)', nameEn: 'Brown Rice, Cooked', tags: ['nasi merah', 'brown rice', 'rice'], serving: '100g', calories: 123, protein: 2.7, carbs: 25.6, fat: 1 },
  { name: 'Nasi Goreng', nameEn: 'Fried Rice', tags: ['nasi goreng', 'fried rice', 'nasi'], serving: '100g', calories: 163, protein: 3.1, carbs: 30, fat: 2.7 },
  { name: 'Roti Tawar Putih (1 lembar)', nameEn: 'White Bread (1 slice)', tags: ['roti', 'roti tawar', 'white bread', 'bread'], serving: '1 lembar (30g)', calories: 79, protein: 2.6, carbs: 15, fat: 1 },
  { name: 'Roti Gandum Utuh (1 lembar)', nameEn: 'Whole Wheat Bread (1 slice)', tags: ['roti gandum', 'whole wheat bread', 'wheat bread', 'roti'], serving: '1 lembar (28g)', calories: 69, protein: 3.6, carbs: 12, fat: 1 },
  { name: 'Kentang Rebus', nameEn: 'Boiled Potato', tags: ['kentang', 'kentang rebus', 'boiled potato', 'potato'], serving: '100g', calories: 87, protein: 1.9, carbs: 20, fat: 0.1 },
  { name: 'Kentang Goreng', nameEn: 'French Fries', tags: ['kentang goreng', 'french fries', 'fries', 'kentang'], serving: '100g', calories: 312, protein: 3.4, carbs: 41, fat: 15 },
  { name: 'Mie Rebus', nameEn: 'Boiled Noodles', tags: ['mie', 'noodle', 'mie rebus', 'boiled noodle'], serving: '100g', calories: 138, protein: 4.5, carbs: 27.5, fat: 0.5 },
  { name: 'Mie Goreng', nameEn: 'Fried Noodles', tags: ['mie goreng', 'fried noodle', 'noodle', 'mie'], serving: '100g', calories: 237, protein: 6, carbs: 34, fat: 8.5 },
  { name: 'Oatmeal Matang', nameEn: 'Oatmeal, Cooked', tags: ['oatmeal', 'oats', 'oat', 'porridge oat'], serving: '100g', calories: 71, protein: 2.5, carbs: 12, fat: 1.5 },
  { name: 'Oats Mentah / Rolled Oats', nameEn: 'Rolled Oats, Raw', tags: ['oat', 'oats', 'oatmeal kering', 'rolled oats', 'raw oats'], serving: '100g', calories: 389, protein: 17, carbs: 66, fat: 7 },
  { name: 'Ubi Jalar Rebus', nameEn: 'Sweet Potato, Boiled', tags: ['ubi', 'ubi jalar', 'sweet potato', 'ubi rebus'], serving: '100g', calories: 90, protein: 2, carbs: 20.7, fat: 0.1 },
  { name: 'Singkong Rebus', nameEn: 'Cassava, Boiled', tags: ['singkong', 'cassava', 'ketela', 'tapioca root'], serving: '100g', calories: 160, protein: 1.4, carbs: 38.1, fat: 0.3 },
  { name: 'Jagung Manis Rebus', nameEn: 'Sweet Corn, Boiled', tags: ['jagung', 'corn', 'sweet corn', 'jagung rebus', 'jagung manis'], serving: '100g', calories: 96, protein: 3.4, carbs: 21, fat: 1.5 },
  { name: 'Beras Putih Mentah', nameEn: 'White Rice, Raw', tags: ['beras', 'white rice raw', 'beras putih', 'uncooked rice'], serving: '100g', calories: 365, protein: 7, carbs: 80, fat: 0.7 },

  // ─── DAGING SAPI / BEEF ─────────────────────────────────────────────────────
  { name: 'Daging Sapi, Rebus (Tanpa Lemak)', nameEn: 'Beef, Lean, Cooked', tags: ['daging', 'daging sapi', 'beef', 'sapi', 'lean beef'], serving: '100g', calories: 217, protein: 26.3, carbs: 0, fat: 11.8 },
  { name: 'Daging Sapi Cincang (Lean)', nameEn: 'Ground Beef, Lean', tags: ['daging cincang', 'ground beef', 'beef mince', 'sapi', 'cincang'], serving: '100g', calories: 215, protein: 26.6, carbs: 0, fat: 11.2 },
  { name: 'Daging Sapi Goreng / Tumis', nameEn: 'Beef, Stir-Fried', tags: ['daging goreng', 'beef stir fry', 'beef', 'sapi goreng'], serving: '100g', calories: 250, protein: 24, carbs: 2, fat: 15 },
  { name: 'Dendeng Sapi', nameEn: 'Beef Jerky (Indonesian)', tags: ['dendeng', 'dendeng sapi', 'beef jerky', 'sapi'], serving: '100g', calories: 330, protein: 36, carbs: 14, fat: 14 },
  { name: 'Bakso Sapi (1 butir)', nameEn: 'Beef Meatball (1 pc)', tags: ['bakso', 'beef meatball', 'meatball', 'bakso sapi'], serving: '1 butir (20g)', calories: 40, protein: 3.5, carbs: 2.5, fat: 1.8 },

  // ─── DAGING KAMBING & LAINNYA / OTHER MEATS ────────────────────────────────
  { name: 'Daging Kambing, Rebus', nameEn: 'Lamb / Goat, Cooked', tags: ['kambing', 'lamb', 'mutton', 'goat', 'daging kambing'], serving: '100g', calories: 258, protein: 25.6, carbs: 0, fat: 16.6 },
  { name: 'Sosis Ayam (1 buah)', nameEn: 'Chicken Sausage (1 link)', tags: ['sosis', 'sosis ayam', 'chicken sausage', 'sausage'], serving: '1 buah (40g)', calories: 100, protein: 6, carbs: 4, fat: 7 },
  { name: 'Kornet Sapi', nameEn: 'Corned Beef', tags: ['kornet', 'corned beef', 'beef'], serving: '100g', calories: 216, protein: 15, carbs: 2.5, fat: 16.5 },

  // ─── IKAN / FISH ────────────────────────────────────────────────────────────
  { name: 'Ikan Tuna Kaleng (Dalam Air)', nameEn: 'Canned Tuna in Water', tags: ['tuna', 'ikan tuna', 'canned tuna', 'ikan', 'tuna kaleng'], serving: '100g', calories: 116, protein: 25.5, carbs: 0, fat: 0.8 },
  { name: 'Ikan Tuna Segar, Matang', nameEn: 'Fresh Tuna, Cooked', tags: ['tuna', 'ikan tuna', 'fresh tuna', 'ikan', 'tuna segar'], serving: '100g', calories: 184, protein: 29.9, carbs: 0, fat: 6.3 },
  { name: 'Ikan Salmon, Matang', nameEn: 'Salmon, Cooked', tags: ['salmon', 'ikan salmon', 'ikan'], serving: '100g', calories: 206, protein: 20.4, carbs: 0, fat: 13.4 },
  { name: 'Ikan Lele Goreng', nameEn: 'Catfish, Fried', tags: ['lele', 'ikan lele', 'catfish', 'ikan goreng', 'ikan'], serving: '100g', calories: 190, protein: 18, carbs: 8, fat: 9 },
  { name: 'Ikan Nila Goreng', nameEn: 'Tilapia, Fried', tags: ['nila', 'ikan nila', 'tilapia', 'ikan goreng', 'ikan'], serving: '100g', calories: 180, protein: 20, carbs: 6, fat: 8 },
  { name: 'Ikan Bandeng, Matang', nameEn: 'Milkfish, Cooked', tags: ['bandeng', 'ikan bandeng', 'milkfish', 'ikan'], serving: '100g', calories: 123, protein: 20, carbs: 0, fat: 4 },
  { name: 'Ikan Sarden Kaleng', nameEn: 'Sardines, Canned', tags: ['sarden', 'ikan sarden', 'sardine', 'ikan', 'sarden kaleng'], serving: '100g', calories: 208, protein: 24.6, carbs: 0, fat: 11.5 },
  { name: 'Ikan Goreng (Umum)', nameEn: 'Fried Fish (General)', tags: ['ikan goreng', 'fried fish', 'ikan'], serving: '100g', calories: 196, protein: 22, carbs: 5, fat: 9 },

  // ─── SEAFOOD ────────────────────────────────────────────────────────────────
  { name: 'Udang Goreng', nameEn: 'Shrimp, Fried', tags: ['udang', 'shrimp', 'udang goreng', 'fried shrimp', 'prawn'], serving: '100g', calories: 163, protein: 24, carbs: 5, fat: 5 },
  { name: 'Udang Rebus', nameEn: 'Shrimp, Boiled', tags: ['udang', 'shrimp', 'udang rebus', 'boiled shrimp', 'prawn'], serving: '100g', calories: 99, protein: 24, carbs: 0, fat: 0.3 },
  { name: 'Cumi-Cumi Goreng', nameEn: 'Squid, Fried', tags: ['cumi', 'cumi-cumi', 'squid', 'sotong', 'fried squid'], serving: '100g', calories: 175, protein: 18, carbs: 8, fat: 7 },

  // ─── TAHU & TEMPE ───────────────────────────────────────────────────────────
  { name: 'Tempe Goreng', nameEn: 'Tempeh, Fried', tags: ['tempe', 'tempeh', 'tempe goreng', 'fried tempeh'], serving: '100g', calories: 227, protein: 14.7, carbs: 9, fat: 15 },
  { name: 'Tempe Rebus / Kukus', nameEn: 'Tempeh, Steamed', tags: ['tempe', 'tempeh', 'tempe rebus', 'steamed tempeh'], serving: '100g', calories: 193, protein: 20.7, carbs: 9, fat: 8 },
  { name: 'Tahu Goreng', nameEn: 'Tofu, Fried', tags: ['tahu', 'tofu', 'tahu goreng', 'fried tofu'], serving: '100g', calories: 136, protein: 10, carbs: 3, fat: 9 },
  { name: 'Tahu Putih Rebus', nameEn: 'Tofu, Boiled (Firm)', tags: ['tahu', 'tofu', 'tahu rebus', 'boiled tofu', 'firm tofu'], serving: '100g', calories: 76, protein: 8, carbs: 2, fat: 4.2 },
  { name: 'Tahu Sutra', nameEn: 'Silken Tofu', tags: ['tahu sutra', 'silken tofu', 'tofu', 'tahu'], serving: '100g', calories: 55, protein: 5.3, carbs: 1.4, fat: 3.1 },

  // ─── SAYURAN / VEGETABLES ───────────────────────────────────────────────────
  { name: 'Bayam Rebus', nameEn: 'Spinach, Boiled', tags: ['bayam', 'spinach', 'bayam rebus', 'sayuran'], serving: '100g', calories: 23, protein: 2.9, carbs: 3.8, fat: 0.4 },
  { name: 'Kangkung Tumis', nameEn: 'Water Spinach, Stir-Fried', tags: ['kangkung', 'water spinach', 'kangkung tumis', 'sayuran'], serving: '100g', calories: 32, protein: 3, carbs: 4, fat: 0.5 },
  { name: 'Brokoli Rebus', nameEn: 'Broccoli, Boiled', tags: ['brokoli', 'broccoli', 'brokoli rebus', 'sayuran'], serving: '100g', calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4 },
  { name: 'Wortel Mentah', nameEn: 'Carrot, Raw', tags: ['wortel', 'carrot', 'wortel mentah', 'sayuran'], serving: '100g', calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2 },
  { name: 'Tomat', nameEn: 'Tomato, Raw', tags: ['tomat', 'tomato', 'tomatoes', 'sayuran'], serving: '100g', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { name: 'Timun / Mentimun', nameEn: 'Cucumber, Raw', tags: ['timun', 'cucumber', 'mentimun', 'sayuran'], serving: '100g', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { name: 'Kol / Kubis Rebus', nameEn: 'Cabbage, Boiled', tags: ['kubis', 'kol', 'cabbage', 'sayuran'], serving: '100g', calories: 18, protein: 0.9, carbs: 4, fat: 0.1 },
  { name: 'Buncis Rebus', nameEn: 'Green Beans, Boiled', tags: ['buncis', 'green bean', 'string bean', 'buncis rebus', 'sayuran'], serving: '100g', calories: 31, protein: 1.8, carbs: 7, fat: 0.2 },
  { name: 'Terong Goreng', nameEn: 'Eggplant, Fried', tags: ['terong', 'eggplant', 'aubergine', 'terong goreng', 'sayuran'], serving: '100g', calories: 58, protein: 0.8, carbs: 7, fat: 3 },
  { name: 'Labu Siam Rebus', nameEn: 'Chayote, Boiled', tags: ['labu siam', 'chayote', 'labu', 'sayuran'], serving: '100g', calories: 25, protein: 0.6, carbs: 6, fat: 0.1 },
  { name: 'Daun Singkong Rebus', nameEn: 'Cassava Leaf, Boiled', tags: ['daun singkong', 'cassava leaf', 'daun', 'sayuran'], serving: '100g', calories: 37, protein: 6.8, carbs: 0, fat: 0.4 },
  { name: 'Selada Hijau', nameEn: 'Lettuce, Raw', tags: ['selada', 'lettuce', 'salad green', 'sayuran'], serving: '100g', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  { name: 'Paprika Merah', nameEn: 'Red Bell Pepper', tags: ['paprika', 'bell pepper', 'red pepper', 'sayuran'], serving: '100g', calories: 31, protein: 1, carbs: 6, fat: 0.3 },

  // ─── BUAH / FRUITS ──────────────────────────────────────────────────────────
  { name: 'Pisang (1 buah sedang)', nameEn: 'Banana (1 medium)', tags: ['pisang', 'banana', 'buah'], serving: '1 buah (118g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { name: 'Apel (1 buah sedang)', nameEn: 'Apple (1 medium)', tags: ['apel', 'apple', 'buah'], serving: '1 buah (182g)', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { name: 'Jeruk (1 buah)', nameEn: 'Orange (1 medium)', tags: ['jeruk', 'orange', 'buah'], serving: '1 buah (131g)', calories: 62, protein: 1.2, carbs: 15.4, fat: 0.2 },
  { name: 'Mangga', nameEn: 'Mango', tags: ['mangga', 'mango', 'buah'], serving: '100g', calories: 60, protein: 0.8, carbs: 15, fat: 0.4 },
  { name: 'Pepaya', nameEn: 'Papaya', tags: ['pepaya', 'papaya', 'buah'], serving: '100g', calories: 43, protein: 0.5, carbs: 10.8, fat: 0.3 },
  { name: 'Semangka', nameEn: 'Watermelon', tags: ['semangka', 'watermelon', 'buah'], serving: '100g', calories: 30, protein: 0.6, carbs: 7.6, fat: 0.2 },
  { name: 'Alpukat (100g)', nameEn: 'Avocado (100g)', tags: ['alpukat', 'avocado', 'buah'], serving: '100g', calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  { name: 'Nanas', nameEn: 'Pineapple', tags: ['nanas', 'pineapple', 'buah'], serving: '100g', calories: 50, protein: 0.5, carbs: 13, fat: 0.1 },
  { name: 'Melon', nameEn: 'Melon / Cantaloupe', tags: ['melon', 'cantaloupe', 'buah'], serving: '100g', calories: 34, protein: 0.8, carbs: 8.2, fat: 0.2 },
  { name: 'Stroberi', nameEn: 'Strawberry', tags: ['stroberi', 'strawberry', 'buah'], serving: '100g', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { name: 'Anggur', nameEn: 'Grapes', tags: ['anggur', 'grape', 'buah'], serving: '100g', calories: 69, protein: 0.7, carbs: 18, fat: 0.2 },
  { name: 'Durian', nameEn: 'Durian', tags: ['durian', 'buah'], serving: '100g', calories: 147, protein: 1.5, carbs: 27, fat: 5.3 },

  // ─── SUSU & DAIRY ───────────────────────────────────────────────────────────
  { name: 'Susu Sapi Full Cream (1 gelas)', nameEn: 'Whole Milk (1 cup)', tags: ['susu', 'milk', 'susu sapi', 'full cream', 'whole milk'], serving: '1 gelas (240ml)', calories: 149, protein: 8, carbs: 11.7, fat: 8 },
  { name: 'Susu Skim (1 gelas)', nameEn: 'Skim Milk (1 cup)', tags: ['susu skim', 'skim milk', 'susu', 'low fat milk'], serving: '1 gelas (240ml)', calories: 83, protein: 8.3, carbs: 12.2, fat: 0.2 },
  { name: 'Yogurt Plain Rendah Lemak', nameEn: 'Plain Yogurt, Low-Fat', tags: ['yogurt', 'yoghurt', 'plain yogurt', 'low fat yogurt'], serving: '100g', calories: 56, protein: 5.7, carbs: 7.7, fat: 0.6 },
  { name: 'Greek Yogurt', nameEn: 'Greek Yogurt', tags: ['greek yogurt', 'yogurt greek', 'yoghurt', 'yogurt'], serving: '100g', calories: 73, protein: 9, carbs: 5, fat: 2 },
  { name: 'Keju Cheddar', nameEn: 'Cheddar Cheese', tags: ['keju', 'cheese', 'cheddar'], serving: '100g', calories: 402, protein: 25, carbs: 1.3, fat: 33.1 },
  { name: 'Keju Mozzarella', nameEn: 'Mozzarella Cheese', tags: ['keju', 'mozzarella', 'cheese', 'pizza cheese'], serving: '100g', calories: 280, protein: 22, carbs: 2.2, fat: 17 },
  { name: 'Mentega (1 sdt)', nameEn: 'Butter (1 tsp)', tags: ['mentega', 'butter', '1 sdt'], serving: '1 sdt (5g)', calories: 36, protein: 0, carbs: 0, fat: 4.1 },

  // ─── KACANG-KACANGAN / NUTS & LEGUMES ──────────────────────────────────────
  { name: 'Kacang Tanah Panggang', nameEn: 'Peanuts, Roasted', tags: ['kacang tanah', 'peanut', 'kacang', 'roasted peanut'], serving: '100g', calories: 567, protein: 25.8, carbs: 16.1, fat: 49.2 },
  { name: 'Kacang Almond', nameEn: 'Almonds', tags: ['almond', 'kacang almond', 'kacang'], serving: '100g', calories: 579, protein: 21, carbs: 22, fat: 49.9 },
  { name: 'Kacang Mete', nameEn: 'Cashews', tags: ['mete', 'cashew', 'kacang mete', 'kacang'], serving: '100g', calories: 553, protein: 18.2, carbs: 30.2, fat: 43.8 },
  { name: 'Selai Kacang (1 sdm)', nameEn: 'Peanut Butter (1 tbsp)', tags: ['selai kacang', 'peanut butter'], serving: '1 sdm (16g)', calories: 94, protein: 4, carbs: 3.1, fat: 8 },
  { name: 'Kacang Merah Rebus', nameEn: 'Kidney Beans, Cooked', tags: ['kacang merah', 'kidney bean', 'red bean', 'kacang'], serving: '100g', calories: 127, protein: 8.7, carbs: 22.8, fat: 0.5 },
  { name: 'Edamame Rebus', nameEn: 'Edamame, Boiled', tags: ['edamame', 'kedelai muda', 'soybean', 'edamame'], serving: '100g', calories: 122, protein: 11, carbs: 8.9, fat: 5.2 },

  // ─── MINYAK & LEMAK / OILS & FATS ──────────────────────────────────────────
  { name: 'Minyak Goreng (1 sdm)', nameEn: 'Cooking Oil (1 tbsp)', tags: ['minyak goreng', 'cooking oil', 'minyak', 'oil', 'vegetable oil'], serving: '1 sdm (14g)', calories: 124, protein: 0, carbs: 0, fat: 14 },
  { name: 'Minyak Zaitun (1 sdm)', nameEn: 'Olive Oil (1 tbsp)', tags: ['minyak zaitun', 'olive oil', 'minyak'], serving: '1 sdm (14g)', calories: 119, protein: 0, carbs: 0, fat: 13.5 },
  { name: 'Minyak Kelapa (1 sdm)', nameEn: 'Coconut Oil (1 tbsp)', tags: ['minyak kelapa', 'coconut oil', 'minyak'], serving: '1 sdm (14g)', calories: 121, protein: 0, carbs: 0, fat: 13.6 },

  // ─── MINUMAN / DRINKS ───────────────────────────────────────────────────────
  { name: 'Kopi Hitam Tanpa Gula', nameEn: 'Black Coffee, Unsweetened', tags: ['kopi', 'coffee', 'black coffee', 'americano', 'espresso'], serving: '1 cangkir (240ml)', calories: 2, protein: 0.3, carbs: 0, fat: 0 },
  { name: 'Kopi dengan Susu (Latte)', nameEn: 'Latte / Coffee with Milk', tags: ['kopi susu', 'latte', 'coffee milk', 'kopi'], serving: '240ml', calories: 120, protein: 6, carbs: 12, fat: 5 },
  { name: 'Teh Manis (1 gelas)', nameEn: 'Sweet Tea (1 glass)', tags: ['teh manis', 'sweet tea', 'teh'], serving: '1 gelas (240ml)', calories: 60, protein: 0, carbs: 15, fat: 0 },
  { name: 'Teh Tawar (1 gelas)', nameEn: 'Plain Tea (1 cup)', tags: ['teh', 'tea', 'teh tawar', 'plain tea'], serving: '1 gelas (240ml)', calories: 2, protein: 0, carbs: 0.5, fat: 0 },
  { name: 'Jus Jeruk (1 gelas)', nameEn: 'Orange Juice (1 cup)', tags: ['jus jeruk', 'orange juice', 'jus', 'juice'], serving: '1 gelas (240ml)', calories: 112, protein: 1.7, carbs: 26, fat: 0.5 },
  { name: 'Air Kelapa Muda', nameEn: 'Coconut Water', tags: ['air kelapa', 'coconut water', 'kelapa muda'], serving: '1 gelas (240ml)', calories: 46, protein: 1.7, carbs: 8.9, fat: 0.5 },
  { name: 'Susu Kedelai (1 gelas)', nameEn: 'Soy Milk (1 cup)', tags: ['susu kedelai', 'soy milk', 'soymilk', 'susu'], serving: '1 gelas (240ml)', calories: 105, protein: 6.3, carbs: 12, fat: 3.6 },

  // ─── MASAKAN INDONESIA / INDONESIAN DISHES ──────────────────────────────────
  { name: 'Bubur Ayam (1 porsi)', nameEn: 'Chicken Congee (1 serving)', tags: ['bubur', 'bubur ayam', 'chicken porridge', 'congee'], serving: '1 porsi (300g)', calories: 250, protein: 12, carbs: 35, fat: 6 },
  { name: 'Soto Ayam (1 mangkuk)', nameEn: 'Chicken Soto Soup (1 bowl)', tags: ['soto', 'soto ayam', 'chicken soup', 'soto'], serving: '1 mangkuk (350g)', calories: 185, protein: 15, carbs: 12, fat: 8 },
  { name: 'Gado-Gado (tanpa nasi)', nameEn: 'Gado-Gado Salad (no rice)', tags: ['gado gado', 'gado-gado', 'vegetable salad peanut'], serving: '1 porsi (250g)', calories: 290, protein: 13, carbs: 28, fat: 14 },
  { name: 'Sate Ayam (5 tusuk)', nameEn: 'Chicken Satay (5 skewers)', tags: ['sate', 'sate ayam', 'chicken satay', 'satay'], serving: '5 tusuk (100g)', calories: 180, protein: 20, carbs: 6, fat: 8.5 },
  { name: 'Rendang Daging Sapi', nameEn: 'Beef Rendang', tags: ['rendang', 'rendang sapi', 'beef rendang'], serving: '100g', calories: 254, protein: 22, carbs: 6, fat: 15.5 },
  { name: 'Tempe Orek', nameEn: 'Dry-Fried Tempeh', tags: ['tempe orek', 'tempe goreng kering', 'tempe', 'dry tempeh'], serving: '100g', calories: 270, protein: 14, carbs: 16, fat: 15 },
  { name: 'Sayur Sop (1 mangkuk)', nameEn: 'Vegetable Soup (1 bowl)', tags: ['sayur sop', 'vegetable soup', 'sop', 'sup'], serving: '1 mangkuk (250g)', calories: 85, protein: 4, carbs: 14, fat: 2 },
  { name: 'Capcay Goreng', nameEn: 'Cap Cay Stir-Fried Vegetables', tags: ['capcay', 'cap cay', 'stir fry vegetable', 'capcay goreng'], serving: '100g', calories: 65, protein: 4, carbs: 8, fat: 2 },
  { name: 'Mie Ayam (1 porsi)', nameEn: 'Chicken Noodle Soup (1 serving)', tags: ['mie ayam', 'chicken noodle', 'mie'], serving: '1 porsi (300g)', calories: 365, protein: 18, carbs: 52, fat: 9 },
  { name: 'Nasi Uduk (1 porsi)', nameEn: 'Coconut Rice (1 serving)', tags: ['nasi uduk', 'coconut rice', 'nasi'], serving: '1 porsi (150g)', calories: 270, protein: 4.5, carbs: 45, fat: 8 },
  { name: 'Lontong / Ketupat', nameEn: 'Rice Cake (Lontong)', tags: ['lontong', 'ketupat', 'rice cake', 'nasi'], serving: '100g', calories: 84, protein: 1.6, carbs: 18, fat: 0.3 },

  // ─── CEMILAN & SNACKS ───────────────────────────────────────────────────────
  { name: 'Pisang Goreng (1 buah)', nameEn: 'Fried Banana (1 pc)', tags: ['pisang goreng', 'fried banana', 'pisang', 'goreng'], serving: '1 buah (80g)', calories: 145, protein: 1.2, carbs: 29, fat: 3.5 },
  { name: 'Keripik Kentang (1 sajian)', nameEn: 'Potato Chips (1 serving)', tags: ['keripik', 'chips', 'potato chips', 'crisps', 'keripik kentang'], serving: '1 sajian (28g)', calories: 149, protein: 2, carbs: 15, fat: 9.5 },
  { name: 'Coklat Hitam (Dark Chocolate)', nameEn: 'Dark Chocolate', tags: ['coklat hitam', 'dark chocolate', 'coklat', 'chocolate'], serving: '100g', calories: 546, protein: 5, carbs: 60, fat: 31 },
  { name: 'Madu (1 sdm)', nameEn: 'Honey (1 tbsp)', tags: ['madu', 'honey'], serving: '1 sdm (21g)', calories: 64, protein: 0.1, carbs: 17.3, fat: 0 },

  // ─── SUPLEMEN / SUPPLEMENTS ─────────────────────────────────────────────────
  { name: 'Whey Protein (1 scoop)', nameEn: 'Whey Protein (1 scoop)', tags: ['whey', 'protein powder', 'whey protein', 'suplemen', 'supplement'], serving: '1 scoop (30g)', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
];

/**
 * Searches the local food database with fuzzy matching.
 * @param query - search term (Indonesian or English)
 * @param lang - current app language code ('Bahasa Indonesia' | 'English' | etc.)
 * Returns results sorted by relevance with language-appropriate names.
 */
export function searchLocalDatabase(query: string, lang = 'Bahasa Indonesia'): Array<LocalFoodItem & { displayName: string }> {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const queryTokens = q.split(/\s+/);
  const isIndonesian = lang === 'Bahasa Indonesia';

  const scored = LOCAL_FOOD_DATABASE.map((item) => {
    const nameLower = item.name.toLowerCase();
    const nameEnLower = item.nameEn.toLowerCase();
    const allText = [nameLower, nameEnLower, ...item.tags.map((t) => t.toLowerCase())].join(' ');

    let score = 0;

    // Exact name match (both languages)
    if (nameLower === q || nameEnLower === q) score += 100;
    // Starts with query
    else if (nameLower.startsWith(q) || nameEnLower.startsWith(q)) score += 60;
    // Contains full query
    else if (nameLower.includes(q) || nameEnLower.includes(q)) score += 40;

    // Tag exact match
    if (item.tags.some((t) => t.toLowerCase() === q)) score += 80;
    else if (item.tags.some((t) => t.toLowerCase().startsWith(q))) score += 50;
    else if (item.tags.some((t) => t.toLowerCase().includes(q))) score += 30;

    // Multi-word: all tokens present anywhere
    const allTokensMatch = queryTokens.every((token) => allText.includes(token));
    if (allTokensMatch && queryTokens.length > 1) score += 25;

    // Partial token matches
    const matchingTokens = queryTokens.filter((token) => allText.includes(token));
    score += matchingTokens.length * 10;

    return { item, score };
  });

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map((x) => ({
      ...x.item,
      displayName: isIndonesian ? x.item.name : x.item.nameEn,
    }));
}
