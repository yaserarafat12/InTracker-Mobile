// Re-export constants for easy access
export const HABIT_ICONS: Record<string, string> = {
  'WaterGlass': 'custom:WaterGlass',
  'Sunrise': 'ph:sun-horizon-bold',
  'Bed': 'ph:moon-stars-bold',
  'Medicine': 'custom:Vitamin',
  'SmokingOff': 'custom:NoSmoking',
  'FoodOff': 'custom:NoJunkFood',
  'Broom': 'custom:Cleaning',
  'Breathe': 'ph:wind-bold',
  'Praying': 'custom:Praying',
  'MusicNote': 'ph:music-notes-bold',
  'Deep Work': 'custom:Working',
  'Reading': 'ph:book-open-bold',
  'News': 'ph:newspaper-bold',
  'Deep Learning': 'ph:atom-bold',
  'Journaling': 'ph:notebook-bold',
  'Language Learning': 'ph:translate-bold',
  'Skin Care': 'custom:Skincare',
  'Weight': 'custom:Weight',
  'PushUp': 'custom:PushUp',
  'SitUp': 'custom:SitUp',
  'Treadmill': 'custom:Treadmill',
  'Basketball': 'ph:basketball-bold',
  'Skipping': 'custom:Skipping',
  'Bike': 'custom:Cycling',
  'Monitor': 'ph:monitor-bold',
  'WalletMoney': 'ph:wallet-bold',
  'Agenda': 'ph:calendar-check-bold',
  'MoonSleep': 'ph:moon-bold',
  'Users': 'ph:users-three-bold',
  'Leaf': 'ph:leaf-bold',
  'Breakfast': 'ph:coffee-bold',
  'MealTime': 'ph:fork-knife-bold',
  'ToothBrush': 'ph:tooth-bold',
  'Meditation': 'ph:flower-lotus-bold',
  'Gratitude': 'ph:heart-bold',
  'Walking': 'ph:person-simple-walk-bold',
  'Coding': 'ph:code-bold',
  'Drawing': 'ph:paint-brush-bold',
  'Podcast': 'ph:headphones-bold',
  'Yoga': 'mdi:yoga',
  'Plank': 'ph:barbell-bold',
  'Running': 'ph:person-simple-run-bold',
  'Swimming': 'ph:swimming-pool-bold',
  'Stretching': 'ph:person-arms-spread-bold',
  'Guitar': 'ph:guitar-bold',
  'Shower': 'ph:shower-bold',
  'MorningRitual': 'ph:sparkle-bold',
  'solar:book-2-bold': 'ph:book-open-bold',
  'solar:tv-bold': 'ph:newspaper-bold',
  'solar:lightbulb-bold': 'ph:atom-bold',
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
  'WalletMoney': '#FACC15',
  'Agenda': '#A78BFA',
  'MoonSleep': '#60A5FA',
  'Users': '#FB7185',
  'Leaf': '#4ADE80',
  'Breakfast': '#F59E0B',
  'MealTime': '#FB923C',
  'ToothBrush': '#38BDF8',
  'Meditation': '#A78BFA',
  'Gratitude': '#F472B6',
  'Walking': '#34D399',
  'Coding': '#22D3EE',
  'Drawing': '#E879F9',
  'Podcast': '#F97316',
  'Yoga': '#818CF8',
  'Plank': '#F43F5E',
  'Running': '#10B981',
  'Swimming': '#0EA5E9',
  'Stretching': '#A3E635',
  'Guitar': '#D946EF',
  'Shower': '#67E8F9',
  'MorningRitual': '#FBBF24',
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
  { name: 'Mandi Pagi', iconName: 'Shower', category: 'Rutinitas', imageUrl: '/all_images/display_images/mandi.png', frequency: 'harian', difficulty: 1, intensity: { type: 'none' } },
  { name: 'Morning Ritual', iconName: 'MorningRitual', category: 'Rutinitas', imageUrl: '/all_images/display_images/morning.png', frequency: 'harian', difficulty: 2, intensity: { type: 'none' } },

  // Ketenangan Diri
  { name: 'Beribadah', iconName: 'Praying', category: 'Ketenangan Diri', imageUrl: '/all_images/display_images/beribadah.png', frequency: 'harian', difficulty: 1, intensity: { type: 'numeric', unit: 'Waktu', options: [1, 2, 3, 4, 5], defaultValue: 5 } },
  { name: 'Mendengar Musik', iconName: 'MusicNote', category: 'Ketenangan Diri', imageUrl: '/all_images/display_images/dengarmusik.png', frequency: 'harian', difficulty: 1, intensity: { type: 'none' } },
  { name: 'Latihan Napas', iconName: 'Breathe', category: 'Ketenangan Diri', imageUrl: '/all_images/display_images/nafasdalam.png', imagePosition: 'object-right', frequency: 'harian', difficulty: 1, intensity: { type: 'numeric', unit: 'Menit', options: [5, 10, 15, 20], defaultValue: 10 } },
  { name: 'Latihan Musik', iconName: 'Guitar', category: 'Ketenangan Diri', imageUrl: '/all_images/display_images/belajarmusik.png', imagePosition: 'object-right', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Menit', options: [15, 30, 45, 60], defaultValue: 30 } },

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
    imageUrl: '/all_images/display_images/baca_berita.png',
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
  { name: 'Push-Up', iconName: 'PushUp', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/pushup.png', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Rep', options: [5, 10, 15, 20, 30, 40, 50, 60], defaultValue: 10 } },
  { name: 'Sit-Up', iconName: 'SitUp', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/sit_up.png', imagePosition: 'object-left', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Rep', options: [5, 10, 15, 20, 30, 40, 50, 60], defaultValue: 10 } },
  { name: 'Sesi Kardio', iconName: 'Treadmill', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/cardio.png', imagePosition: 'object-right', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Menit', options: [15, 30, 45, 60], defaultValue: 30 } },
  { name: 'Basket', iconName: 'Basketball', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/basket.png', frequency: 'Mingguan', difficulty: 2, intensity: { type: 'numeric', unit: 'Menit', options: [30, 60, 90, 120], defaultValue: 60 } },
  { name: 'Lompat Tali', iconName: 'Skipping', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/skipping.png', imagePosition: 'object-top', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Sesi', options: [1, 2, 3, 4, 5], defaultValue: 1 } },
  { name: 'Bersepeda', iconName: 'Bike', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/sepeda.png', imagePosition: 'object-right', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Km', options: [1, 2, 5, 10, 20], defaultValue: 5 } },
  
  // New Protocols
  { 
    name: 'Mencatat Keuangan', 
    iconName: 'WalletMoney', 
    category: 'Rutinitas', 
    imageUrl: '/all_images/display_images/mencatat_keuangan.png', 
    frequency: 'harian', 
    difficulty: 1, 
    intensity: { type: 'none' } 
  },
  { 
    name: 'Rencana Esok Hari', 
    iconName: 'ph:calendar-blank-bold', 
    category: 'Evolusi Diri', 
    imageUrl: '/all_images/display_images/perencanaanbesok.png', 
    frequency: 'harian', 
    difficulty: 1, 
    intensity: { type: 'none' } 
  },
  { 
    name: 'Digital Detox', 
    iconName: 'MoonSleep', 
    category: 'Ketenangan Diri', 
    imageUrl: '/all_images/display_images/digitaldetox.png', 
    frequency: 'harian', 
    difficulty: 2, 
    intensity: { type: 'none' } 
  },
  { 
    name: 'Koneksi Sosial', 
    iconName: 'Users', 
    category: 'Evolusi Diri', 
    imageUrl: '/all_images/display_images/koneksisosial.png', 
    frequency: 'harian', 
    difficulty: 1, 
    intensity: { type: 'none' } 
  },
  { 
    name: 'Nutrisi Harian', 
    iconName: 'Leaf', 
    category: 'Rutinitas', 
    imageUrl: '/all_images/display_images/nutrisiharian.png', 
    frequency: 'harian', 
    difficulty: 1, 
    intensity: { type: 'none' } 
  },

  // --- NEW HABITS ---

  // Rutinitas (new)
  { name: 'Sarapan', iconName: 'Breakfast', category: 'Rutinitas', imageUrl: '/all_images/display_images/breakfast.png', frequency: 'harian', difficulty: 1, intensity: { type: 'none' } },
  { name: 'Makan Teratur', iconName: 'MealTime', category: 'Rutinitas', imageUrl: '/all_images/display_images/eatontime.png', frequency: 'harian', difficulty: 1, intensity: { type: 'numeric', unit: 'Kali', options: [2, 3, 4], defaultValue: 3 } },
  { name: 'Sikat Gigi', iconName: 'ToothBrush', category: 'Rutinitas', imageUrl: '/all_images/display_images/brushteeth.png', frequency: 'harian', difficulty: 1, intensity: { type: 'numeric', unit: 'Kali', options: [1, 2, 3], defaultValue: 2 } },

  // Ketenangan Diri (new)
  { name: 'Meditasi', iconName: 'Meditation', category: 'Ketenangan Diri', imageUrl: '/all_images/display_images/meditation.png', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Menit', options: [1, 2, 3, 4, 5], defaultValue: 2 } },
  { name: 'Bersyukur', iconName: 'Gratitude', category: 'Ketenangan Diri', imageUrl: '/all_images/display_images/thankful.png', frequency: 'harian', difficulty: 1, intensity: { type: 'none' } },
  { name: 'Jalan Santai', iconName: 'Walking', category: 'Ketenangan Diri', imageUrl: '/all_images/display_images/walkingchild.png', frequency: 'harian', difficulty: 1, intensity: { type: 'numeric', unit: 'Menit', options: [10, 15, 20, 30, 45], defaultValue: 20 } },

  // Evolusi Diri (new)
  { name: 'Belajar Coding', iconName: 'Coding', category: 'Evolusi Diri', imageUrl: '/all_images/display_images/coding.png', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Menit', options: [15, 30, 45, 60, 90, 120], defaultValue: 30 } },
  { name: 'Menggambar', iconName: 'Drawing', category: 'Evolusi Diri', imageUrl: '/all_images/display_images/drawing.png', frequency: 'harian', difficulty: 1, intensity: { type: 'numeric', unit: 'Menit', options: [15, 30, 45, 60], defaultValue: 30 } },
  { name: 'Podcast', iconName: 'Podcast', category: 'Evolusi Diri', imageUrl: '/all_images/display_images/podcast.png', frequency: 'harian', difficulty: 1, intensity: { type: 'none' } },

  // Latihan Fisik (new)
  { name: 'Yoga', iconName: 'Yoga', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/yoga.png', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Menit', options: [15, 20, 30, 45, 60], defaultValue: 20 } },
  { name: 'Plank', iconName: 'Plank', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/plank.png', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Detik', options: [30, 45, 60, 90, 120, 180], defaultValue: 60 } },
  { name: 'Lari', iconName: 'Running', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/jogging.png', frequency: 'harian', difficulty: 2, intensity: { type: 'numeric', unit: 'Km', options: [1, 2, 3, 5, 7, 10], defaultValue: 3 } },
  { name: 'Renang', iconName: 'Swimming', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/swimming.png', frequency: 'Mingguan', difficulty: 2, intensity: { type: 'numeric', unit: 'Menit', options: [30, 45, 60, 90], defaultValue: 45 } },
  { name: 'Stretching', iconName: 'Stretching', category: 'Latihan Fisik', imageUrl: '/all_images/display_images/stretching.png', frequency: 'harian', difficulty: 1, intensity: { type: 'numeric', unit: 'Menit', options: [5, 10, 15, 20], defaultValue: 10 } },
];
