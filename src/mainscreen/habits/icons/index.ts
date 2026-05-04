// Re-export constants for easy access
export const HABIT_ICONS: Record<string, string> = {
  'WaterGlass': 'custom:WaterGlass',
  'Sunrise': 'solar:sunrise-bold',
  'Bed': 'solar:bed-bold',
  'Medicine': 'custom:Vitamin',
  'SmokingOff': 'custom:NoSmoking',
  'FoodOff': 'custom:NoJunkFood',
  'Broom': 'custom:Cleaning',
  'Breathe': 'solar:wind-bold',
  'Praying': 'custom:Praying',
  'MusicNote': 'solar:music-note-bold',
  'Deep Work': 'custom:Working',
  'Reading': 'solar:book-2-bold',
  'News': 'solar:tv-bold',
  'Deep Learning': 'solar:lightbulb-bold',
  'Journaling': 'solar:notebook-bold',
  'Language Learning': 'solar:translation-bold',
  'Skin Care': 'custom:Skincare',
  'Weight': 'custom:Weight',
  'PushUp': 'custom:PushUp',
  'SitUp': 'custom:SitUp',
  'Treadmill': 'custom:Treadmill',
  'Basketball': 'solar:basketball-bold',
  'Skipping': 'custom:Skipping',
  'Bike': 'custom:Cycling',
  'Monitor': 'solar:monitor-bold',
  'solar:book-2-bold': 'solar:book-2-bold',
  'solar:tv-bold': 'solar:tv-bold',
  'solar:lightbulb-bold': 'solar:lightbulb-bold',
  'custom:Skipping': 'custom:Skipping',
  'ph:skipping-rope-bold': 'custom:Skipping',
  'ph:jump-rope-bold': 'custom:Skipping',
};

export const CATEGORY_ICONS: Record<string, string> = {
  'Semua': 'solar:widget-5-bold',
  'Rutinitas': 'solar:shield-star-bold',
  'Ketenangan Diri': 'solar:wind-bold',
  'Evolusi Diri': 'solar:star-fall-2-bold',
  'Latihan Fisik': 'solar:dumbbells-bold'
};

export const CATEGORY_COLORS: Record<string, string> = {
  'Semua': '#FFFFFF',
  'Rutinitas': '#00FF85',
  'Ketenangan Diri': '#60A5FA',
  'Evolusi Diri': '#FACC15',
  'Latihan Fisik': '#EF4444'
};

export const HABIT_COLORS: Record<string, string> = {
  'WaterGlass': '#3B82F6',
  'Sunrise': '#F59E0B',
  'Bed': '#6366F1',
  'Medicine': '#10B981',
  'SmokingOff': '#9333EA',
  'FoodOff': '#F43F5E',
  'Broom': '#38BDF8',
  'Breathe': '#00FF85',
  'Spiritual': '#FCD34D',
  'MusicNote': '#C026D3',
  'Deep Work': '#06B6D4',
  'solar:book-2-bold': '#D97706',
  'solar:tv-bold': '#F59E0B',
  'solar:lightbulb-bold': '#06B6D4',
  'Journaling': '#6366F1',
  'Language Learning': '#10B981',
  'Skin Care': '#EC4899',
  'Weight': '#4F46E5',
  'PushUp': '#00FF85',
  'SitUp': '#3B82F6',
  'Treadmill': '#F43F5E',
  'Basketball': '#F97316',
  'Skipping': '#EF4444',
  'Praying': '#FCD34D',
};

export const isCustomIcon = (iconStr: string) => iconStr?.startsWith('custom:');
export const getCustomIconKey = (iconStr: string) => iconStr?.replace('custom:', '');

export interface HabitIntensity {
  type: 'numeric' | 'none';
  unit?: string;
  options?: number[];
  defaultValue?: number;
}

export interface HabitOption {
  name: string;
  iconName: string;
  category: string;
  imageUrl: string;
  imagePosition?: string;
  frequency: string;
  difficulty: number;
  intensity?: HabitIntensity;
}

export const HABIT_OPTIONS: HabitOption[] = [
  // Rutinitas
  { name: 'Hidrasi Harian', iconName: 'WaterGlass', category: 'Rutinitas', imageUrl: '/all_images/display_images/minumair.png', frequency: 'harian', difficulty: 1, intensity: { type: 'numeric', unit: 'Gelas', options: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], defaultValue: 8 } },
  { name: 'Bangun Pagi', iconName: 'Sunrise', category: 'Rutinitas', imageUrl: '/all_images/display_images/bangunpagi.png', imagePosition: 'object-top', frequency: 'harian', difficulty: 2, intensity: { type: 'none' } },
  { name: 'Tidur 8 Jam', iconName: 'Bed', category: 'Rutinitas', imageUrl: '/all_images/display_images/tidur8jam.png', imagePosition: 'object-right', frequency: 'harian', difficulty: 1, intensity: { type: 'none' } },
  { name: 'Minum Pil', iconName: 'Medicine', category: 'Rutinitas', imageUrl: '/all_images/display_images/minumpil.png', imagePosition: 'object-top', frequency: 'harian', difficulty: 1, intensity: { type: 'numeric', unit: 'Pil', options: [1, 2, 3] } },
  { name: 'Berhenti Merokok', iconName: 'SmokingOff', category: 'Rutinitas', imageUrl: '/all_images/display_images/nosmoking.png', imagePosition: 'object-right', frequency: 'harian', difficulty: 3, intensity: { type: 'none' } },
  { name: 'Hindari Junk Food', iconName: 'FoodOff', category: 'Rutinitas', imageUrl: '/all_images/display_images/nojunkfood.png', frequency: 'harian', difficulty: 2, intensity: { type: 'none' } },
  { name: 'Bersih-bersih', iconName: 'Broom', category: 'Rutinitas', imageUrl: '/all_images/display_images/cleaning.png', imagePosition: 'object-left', frequency: 'harian', difficulty: 1, intensity: { type: 'none' } },
  { name: 'Mandi Pagi', iconName: 'Breathe', category: 'Rutinitas', imageUrl: '/all_images/display_images/mandi.png', frequency: 'harian', difficulty: 1, intensity: { type: 'none' } },
  { name: 'Morning Ritual', iconName: 'Sunrise', category: 'Rutinitas', imageUrl: '/all_images/display_images/morning.png', frequency: 'harian', difficulty: 2, intensity: { type: 'none' } },

  // Ketenangan Diri
  { name: 'Beribadah', iconName: 'Praying', category: 'Ketenangan Diri', imageUrl: '/all_images/display_images/beribadah.png', frequency: 'harian', difficulty: 1, intensity: { type: 'numeric', unit: 'Waktu', options: [1, 2, 3, 4, 5], defaultValue: 5 } },
  { name: 'Mendengar Musik', iconName: 'MusicNote', category: 'Ketenangan Diri', imageUrl: '/all_images/display_images/dengarmusik.png', frequency: 'harian', difficulty: 1, intensity: { type: 'none' } },
  { name: 'Latihan Napas', iconName: 'Breathe', category: 'Ketenangan Diri', imageUrl: '/all_images/display_images/nafasdalam.png', imagePosition: 'object-right', frequency: 'harian', difficulty: 1, intensity: { type: 'numeric', unit: 'Menit', options: [5, 10, 15, 20], defaultValue: 10 } },
  { name: 'Latihan Musik', iconName: 'MusicNote', category: 'Ketenangan Diri', imageUrl: '/all_images/display_images/belajarmusik.png', imagePosition: 'object-right', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Menit', options: [15, 30, 45, 60], defaultValue: 30 } },

  // Evolusi Diri
  { name: 'Deep Work', iconName: 'Deep Work', category: 'Evolusi Diri', imageUrl: '/all_images/display_images/deepworking.png', imagePosition: 'object-right', frequency: 'harian', difficulty: 3, intensity: { type: 'numeric', unit: 'Jam', options: [1, 2, 3, 4, 5, 6], defaultValue: 2 } },
  { 
    name: 'Membaca Buku', 
    iconName: 'solar:book-2-bold', 
    category: 'Evolusi Diri', 
    imageUrl: '/all_images/display_images/membacabuku.png',
    frequency: 'harian',
    difficulty: 1,
    intensity: { type: 'numeric', unit: 'Halaman', options: [5, 10, 20, 30, 50], defaultValue: 10 }
  },
  { 
    name: 'Membaca Berita', 
    iconName: 'solar:tv-bold', 
    category: 'Evolusi Diri', 
    imageUrl: '/all_images/display_images/baca berita.png',
    frequency: 'harian',
    difficulty: 1,
    intensity: { type: 'none' }
  },
  { 
    name: 'Deep Learning', 
    iconName: 'solar:lightbulb-bold', 
    category: 'Evolusi Diri', 
    imageUrl: '/all_images/display_images/deeplearning.png',
    frequency: 'harian',
    difficulty: 2,
    intensity: { type: 'numeric', unit: 'Sesi', options: [1, 2, 3], defaultValue: 1 }
  },
  { name: 'Journaling', iconName: 'Journaling', category: 'Evolusi Diri', imageUrl: '/all_images/display_images/jurnal.png', imagePosition: 'object-right', frequency: 'harian', difficulty: 1, intensity: { type: 'none' } },
  { name: 'Belajar Bahasa', iconName: 'Language Learning', category: 'Evolusi Diri', imageUrl: '/all_images/display_images/belajarbahasa.png', imagePosition: 'object-top', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Menit', options: [10, 20, 30, 45, 60], defaultValue: 20 } },
  { name: 'Perawatan Kulit', iconName: 'Skin Care', category: 'Evolusi Diri', imageUrl: '/all_images/display_images/skincare.png', imagePosition: 'object-right', frequency: 'harian', difficulty: 1, intensity: { type: 'none' } },

  // Latihan Fisik
  { name: 'Latihan Beban', iconName: 'Weight', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/workout.png', imagePosition: 'object-right', frequency: 'harian', difficulty: 3, intensity: { type: 'numeric', unit: 'Menit', options: [15, 30, 45, 60, 90, 120], defaultValue: 30 } },
  { name: 'Push-Up', iconName: 'PushUp', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/pushup.png', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Rep', options: [10, 20, 30, 50, 100], defaultValue: 20 } },
  { name: 'Sit-Up', iconName: 'SitUp', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/sit up.png', imagePosition: 'object-left', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Rep', options: [10, 20, 30, 50, 100], defaultValue: 20 } },
  { name: 'Sesi Kardio', iconName: 'Treadmill', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/cardio.png', imagePosition: 'object-right', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Menit', options: [15, 30, 45, 60], defaultValue: 30 } },
  { name: 'Basket', iconName: 'Basketball', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/basket.png', frequency: 'Mingguan', difficulty: 2, intensity: { type: 'numeric', unit: 'Menit', options: [30, 60, 90, 120], defaultValue: 60 } },
  { name: 'Lompat Tali', iconName: 'Skipping', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/skipping.png', imagePosition: 'object-top', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Sesi', options: [1, 2, 3, 4, 5], defaultValue: 1 } },
  { name: 'Bersepeda', iconName: 'Bike', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/sepeda.png', imagePosition: 'object-right', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Km', options: [1, 2, 5, 10, 20], defaultValue: 5 } },
];
