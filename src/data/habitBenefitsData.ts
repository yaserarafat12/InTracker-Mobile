// ============================================================
// Habit Benefits Data — Full 46 Habits
// Extracted from 46-habit-panduan-lengkap.txt
// ============================================================

export interface HabitBenefitData {
  top5: string[];
  full: string[];
  timeline: { day30: string; day60: string; day90: string };
  quote: string;
}

const GENERIC_BENEFIT: HabitBenefitData = {
  quote: 'Konsistensi mengalahkan intensitas. Lakukan setiap hari, hasilnya akan datang.',
  top5: [
    'Membangun konsistensi dan disiplin diri',
    'Meningkatkan rasa percaya diri melalui pencapaian harian',
    'Membentuk kebiasaan positif yang bertahan lama',
    'Meningkatkan produktivitas dan fokus',
    'Memberikan struktur dan tujuan pada hari-hari lo',
  ],
  full: [
    'Mengurangi stress dan kecemasan',
    'Meningkatkan kualitas hidup secara keseluruhan',
    'Membangun momentum positif',
    'Melatih willpower dan mental toughness',
  ],
  timeline: {
    day30: 'Kebiasaan mulai terbentuk, resistensi awal mereda, manfaat pertama terasa',
    day60: 'Momentum terbentuk, perubahan mulai terlihat, willpower berkurang kebutuhannya',
    day90: 'Identitas baru terbentuk, kebiasaan menjadi otomatis dan natural',
  },
};

export const HABIT_BENEFITS_FULL: Record<string, HabitBenefitData> = {
  'Hidrasi Harian': {
    quote: 'Otak lo berjalan di atas air. Kurang 2% saja, fokus lo turun 20%.',
    top5: [
      'Meningkatkan fungsi kognitif — dehidrasi ringan menurunkan konsentrasi 20%',
      'Mempercepat metabolisme 30% selama 30-40 menit',
      'Menurunkan risiko batu ginjal hingga 50%',
      'Memperbaiki kondisi kulit dalam 4 minggu',
      '75% rasa lelah siang hari dipicu dehidrasi ringan',
    ],
    full: [
      'Melancarkan pencernaan dan mencegah sembelit',
      'Membantu mengontrol nafsu makan (kurangi kalori 13%)',
      'Menjaga suhu tubuh tetap stabil',
      'Melumasi sendi, mengurangi nyeri lutut dan punggung',
      'Membantu detoksifikasi ginjal secara alami',
      'Meningkatkan performa fisik saat olahraga',
      'Mempercepat penyembuhan luka dan regenerasi sel',
    ],
    timeline: {
      day30: 'Energi lebih stabil, kulit lebih cerah, sakit kepala berkurang',
      day60: 'Berat badan turun 1-2kg, pencernaan lancar, fokus meningkat',
      day90: 'Kebiasaan otomatis, metabolisme efisien, performa konsisten tinggi',
    },
  },

  'Bangun Pagi': {
    quote: 'Setiap jam yang lo habiskan di pagi hari sebelum dunia berisik adalah milik lo sepenuhnya.',
    top5: [
      'Produktivitas 25% lebih tinggi — studi Harvard Business Review',
      'Kortisol alami jam 6-8 pagi memberi energi dan fokus optimal',
      'Menurunkan risiko depresi 23% per jam lebih awal bangun',
      'Orang yang merencanakan pagi 40% lebih mungkin selesaikan prioritas',
      'Menyinkronkan ritme sirkadian, perbaiki kualitas tidur dalam 3-4 minggu',
    ],
    full: [
      'Waktu tenang untuk diri sendiri sebelum tanggung jawab mulai',
      'Sarapan lebih teratur karena ada waktu yang cukup',
      'Mengurangi stress pagi hari (tidak terburu-buru)',
      'Meningkatkan rasa kontrol dan disiplin diri',
      'Paparan sinar matahari pagi meningkatkan serotonin',
      'Membangun momentum positif sejak awal hari',
      'Morning people cenderung lebih proaktif dan berorientasi tujuan',
    ],
    timeline: {
      day30: 'Tubuh mulai menyesuaikan ritme, minggu ke-3 bangun lebih segar',
      day60: 'Ritme sirkadian terbentuk, bangun tanpa alarm mulai terjadi alami',
      day90: 'Kebiasaan permanen, energi konsisten, tidur malam lebih berkualitas',
    },
  },

  'Tidur 8 Jam': {
    quote: 'Lo bisa bertahan lebih lama tanpa makan daripada tanpa tidur. Tidur adalah senjata paling underrated.',
    top5: [
      'Kurang tidur meningkatkan risiko penyakit jantung 48% dan stroke 15%',
      'Otak membersihkan protein penyebab Alzheimer saat tidur nyenyak',
      'Menyerap informasi 40% lebih baik dengan tidur cukup',
      'Kurang tidur meningkatkan rasa lapar 24% dan craving lemak 45%',
      'Tidur 8 jam menghasilkan 3x lebih banyak sel T imun',
    ],
    full: [
      'Pemulihan otot dan jaringan tubuh terjadi saat tidur dalam',
      'Regulasi emosi membaik — kurang tidur = mudah marah dan reaktif',
      'Performa atletik meningkat 9% dengan tidur optimal',
      'Kulit beregenerasi dan memproduksi kolagen lebih banyak saat tidur',
      'Menurunkan kadar kortisol (hormon stress)',
      'Meningkatkan kreativitas dan kemampuan problem-solving',
      'Risiko kecelakaan berkurang — mengantuk setara BAC 0.05%',
    ],
    timeline: {
      day30: 'Mood lebih stabil, konsentrasi meningkat, tidak butuh kafein berlebihan',
      day60: 'Sistem imun menguat, lebih jarang sakit, performa kerja meningkat',
      day90: 'Otak berfungsi optimal, risiko penyakit kronis turun, hormon seimbang',
    },
  },

  'Minum Pil': {
    quote: 'Konsistensi adalah perbedaan antara suplemen yang bekerja dan suplemen yang jadi debu di rak.',
    top5: [
      'Konsistensi suplemen meningkatkan efektivitas hingga 70%',
      'Vitamin D3 menurunkan risiko depresi musiman 50%',
      'Magnesium meningkatkan kualitas tidur dan menurunkan tekanan darah',
      'Omega-3 rutin 3 bulan menurunkan trigliserida hingga 30%',
      'Probiotik harian memperbaiki microbiome usus dalam 8 minggu',
    ],
    full: [
      'Menutupi celah nutrisi yang tidak terpenuhi dari makanan',
      'Meningkatkan energi dan vitalitas harian',
      'Mendukung kesehatan tulang (Kalsium + D3)',
      'Antioksidan melawan radikal bebas dan penuaan dini',
      'Zinc meningkatkan penyembuhan luka dan fungsi reproduksi',
      'Membangun kebiasaan disiplin melalui ritual harian',
      'Mencegah komplikasi pada kondisi kronis yang butuh obat rutin',
    ],
    timeline: {
      day30: 'Kadar vitamin meningkat, energi lebih stabil, gejala defisiensi berkurang',
      day60: 'Efek akumulatif terasa jelas, sistem imun lebih kuat, kulit membaik',
      day90: 'Level optimal tercapai, perubahan fisik dan mental konsisten dan terukur',
    },
  },

  'Berhenti Merokok': {
    quote: '20 menit setelah rokok terakhir, tubuh lo mulai memperbaiki dirinya sendiri.',
    top5: [
      'Risiko serangan jantung turun 50% setelah 1 tahun berhenti',
      '20 menit berhenti: tekanan darah dan detak jantung kembali normal',
      'Kapasitas paru meningkat hingga 30% dalam setahun berhenti',
      'Risiko kanker paru turun 50% setelah 10 tahun',
      'Hemat Rp 1.5-3 juta per bulan atau Rp 18-36 juta per tahun',
    ],
    full: [
      'Kulit kembali mendapat oksigen — warna membaik dalam 2-4 minggu',
      'Indera penciuman dan rasa pulih dalam 2 hari-2 minggu',
      'Stamina olahraga meningkat drastis — napas lebih panjang',
      'Gigi dan gusi lebih sehat, nafas segar',
      'Libido dan fungsi seksual membaik',
      'Risiko impotensi turun signifikan',
      'Mengurangi paparan orang terdekat dari asap rokok pasif',
      'Keseimbangan hormon dan mood menjadi lebih stabil',
    ],
    timeline: {
      day30: 'Withdrawal mereda, pernapasan lebih lapang, kulit lebih segar',
      day60: 'Risiko infeksi paru turun, stamina naik 15-20%, craving berkurang',
      day90: 'Paru-paru bersih dari tar, risiko jantung turun, identitas bukan perokok terbentuk',
    },
  },

  'Hindari Junk Food': {
    quote: 'Lo adalah apa yang lo makan — secara harfiah. Setiap sel di tubuh lo dibuat dari nutrisi yang lo konsumsi.',
    top5: [
      'Mengurangi risiko obesitas dan kenaikan berat 500gr/bulan',
      'Stabilisasi gula darah, risiko diabetes tipe 2 turun 23%',
      'Mengurangi inflamasi sistemik — akar 90% penyakit modern',
      'Diet tinggi junk food meningkatkan risiko depresi 31%',
      'Kulit bersih — reduksi junk food kurangi jerawat 50% dalam 12 minggu',
    ],
    full: [
      'Berat badan turun dan lebih mudah dikontrol',
      'Pencernaan lebih sehat — serat dari real food mendukung microbiome',
      'Konsentrasi dan fokus meningkat — tidak ada sugar crash',
      'Tidur lebih berkualitas tanpa makanan berat sebelum tidur',
      'Hemat uang — junk food lebih mahal per nutrisinya',
      'Mengurangi risiko penyakit kardiovaskular jangka panjang',
      'Kolesterol LDL turun, HDL meningkat dengan pola makan bersih',
    ],
    timeline: {
      day30: 'Energi lebih stabil, kulit membaik, bloating berkurang, mood konsisten',
      day60: 'Berat badan turun 2-4kg, pencernaan lancar, craving berkurang signifikan',
      day90: 'Taste preferences berubah neurologis, makanan sehat terasa lebih enak',
    },
  },

  'Bersih-bersih': {
    quote: 'Lingkungan luar adalah cerminan pikiran dalam. Rumah yang bersih = pikiran yang lebih tenang secara sains.',
    top5: [
      'Clutter menguras perhatian kognitif dan meningkatkan kortisol',
      'Rumah bersih membuat 31% lebih aktif secara fisik',
      'Allergen berkurang drastis, risiko asma turun hingga 40%',
      'Tidur di kamar bersih dikaitkan dengan tidur lebih nyenyak',
      'Produktivitas meningkat 15% di ruang yang rapi',
    ],
    full: [
      'Mengurangi anxiety dan rasa overwhelmed',
      'Memudahkan menemukan barang — hemat rata-rata 4 jam/minggu',
      'Meningkatkan rasa kontrol dan self-efficacy',
      'Mengurangi risiko kecelakaan (tersandung, dll)',
      'Tamu dan hubungan sosial lebih nyaman',
      'Aktivitas fisik ringan yang konsisten (150-300 kkal per sesi)',
    ],
    timeline: {
      day30: 'Rumah lebih lapang dan nyaman, stress saat pulang berkurang',
      day60: 'Rutinitas bersih-bersih efisien, kualitas tidur dan fokus meningkat',
      day90: 'Standar kebersihan terinternalisasi, rumah konsisten rapi tanpa effort besar',
    },
  },

  'Mandi Pagi': {
    quote: 'Air dingin di pagi hari bukan siksaan — itu adalah reset system yang tidak butuh password.',
    top5: [
      'Air dingin meningkatkan norepinefrin hingga 300% — mood dan fokus naik',
      'Meningkatkan sirkulasi darah dan melatih sistem kardiovaskular',
      'Mengurangi infeksi bakteri dan jamur di kulit',
      'Menjadi anchor habit yang mengaktifkan rutinitas pagi lainnya',
      'Mengurangi gejala depresi — efek antidepresan signifikan',
    ],
    full: [
      'Membantu tubuh terbangun sepenuhnya dan meninggalkan kantuk',
      'Membersihkan keringat dan bakteri dari tidur malam',
      'Meningkatkan kepercayaan diri — tampil bersih dan segar',
      'Cold shower meningkatkan brown fat activity dan metabolisme',
      'Mengurangi nyeri otot pasca olahraga',
      'Melatih mental untuk menghadapi ketidaknyamanan (willpower training)',
    ],
    timeline: {
      day30: 'Tubuh terbiasa, pagi terasa lebih segar dan siap',
      day60: 'Sirkulasi membaik, kulit lebih bersih, energi pagi konsisten tinggi',
      day90: 'Anchor habit kuat, seluruh rutinitas pagi lebih terstruktur dan konsisten',
    },
  },

  'Morning Ritual': {
    quote: 'Cara lo memulai pagi menentukan nada seluruh hari. Hampir semua pemimpin dunia punya morning ritual ketat.',
    top5: [
      'Morning routine konsisten menurunkan skor stress 32%',
      'Mencegah decision fatigue — energi mental tersimpan untuk siang',
      'Meningkatkan sense of control dan motivasi intrinsik',
      '89% eksekutif Fortune 500 memiliki morning ritual konsisten',
      'Gerakan fisik pagi meningkatkan BDNF — menumbuhkan sel otak baru',
    ],
    full: [
      'Transisi dari tidur ke produktif lebih smooth',
      'Waktu untuk refleksi sebelum reaktif terhadap dunia luar',
      'Meningkatkan self-discipline melalui kepatuhan pada struktur',
      'Menyiapkan mental dan fisik untuk tantangan hari ini',
      'Mengurangi kecemasan tentang hari yang tidak terencana',
      'Waktu terbaik untuk investasi diri (baca, meditasi, olahraga)',
    ],
    timeline: {
      day30: 'Ritual mulai terbentuk, hari lebih terstruktur, stress pagi berkurang',
      day60: 'Ritual mengalir alami, produktivitas meningkat nyata',
      day90: 'Morning ritual menjadi identitas, efek domino positif di seluruh aspek kehidupan',
    },
  },

  'Mencatat Keuangan': {
    quote: 'Lo tidak bisa memperbaiki apa yang tidak lo ukur. Tidak ada uang bukan masalah saldo — itu masalah visibility.',
    top5: [
      'Mencatat rutin meningkatkan tabungan rata-rata 20% lebih banyak',
      '80% orang kaget dengan pola belanja mereka saat pertama mencatat',
      'Anxiety keuangan 34% lebih rendah dengan budget tertulis',
      'Mencapai tujuan finansial 2.5x lebih cepat',
      'Jeda untuk mencatat mengurangi pembelian impulsif',
    ],
    full: [
      'Memahami pola pengeluaran dan area pemborosan',
      'Bisa mengalokasikan lebih banyak untuk investasi dan tabungan',
      'Persiapan darurat finansial lebih matang',
      'Meningkatkan rasa tanggung jawab dan kedewasaan finansial',
      'Data untuk negosiasi berdasarkan kebutuhan nyata',
      'Mengurangi konflik keuangan dalam hubungan/keluarga',
      'Memudahkan laporan pajak dan perencanaan jangka panjang',
    ],
    timeline: {
      day30: 'Pola pengeluaran terlihat jelas, kebocoran keuangan teridentifikasi',
      day60: 'Pengeluaran terkontrol, tabungan meningkat, cemas soal uang berkurang',
      day90: 'Kebiasaan finansial solid, tabungan naik 15-25%, siap investasi',
    },
  },

  'Nutrisi Harian': {
    quote: 'Makanan bukan sekadar bahan bakar — itu adalah informasi yang dikirim ke setiap sel di tubuh lo.',
    top5: [
      'Diet bergizi seimbang menurunkan risiko kematian dini 22%',
      'Omega-3, antioksidan, dan vitamin B mendukung fungsi otak dan memori',
      'Protein cukup mempertahankan massa otot dan meningkatkan metabolisme',
      'Serat 25-30g/hari menurunkan risiko kanker kolorektal 17%',
      'Micronutrient cukup meningkatkan imunitas dan kurangi durasi sakit 50%',
    ],
    full: [
      'Energi lebih stabil sepanjang hari',
      'Hormon lebih seimbang (termasuk mood dan seksual)',
      'Tulang dan gigi kuat dengan kalsium dan vitamin D cukup',
      'Kulit, rambut, dan kuku lebih sehat',
      'Sistem imun kuat menangkal infeksi',
      'Menurunkan risiko semua penyakit kronis',
      'Umur panjang dan kualitas hidup lebih tinggi di usia tua',
    ],
    timeline: {
      day30: 'Energi lebih stabil, mood lebih baik, pencernaan lancar',
      day60: 'Komposisi tubuh berubah, sistem imun lebih responsif, fokus meningkat',
      day90: 'Biomarker kesehatan membaik terukur, risiko penyakit kronis turun nyata',
    },
  },

  'Sarapan': {
    quote: 'Otak butuh glukosa setelah 8 jam puasa. Melewatkan sarapan itu seperti berangkat perang dengan senjata kosong.',
    top5: [
      'Konsentrasi dan memori 20% lebih tinggi dengan sarapan',
      'Mengurangi total asupan kalori harian 10-15%',
      'Meningkatkan sensitivitas insulin dan stabilisasi gula darah',
      'Thermogenic effect of food paling optimal di pagi hari',
      'LDL kolesterol lebih rendah dan HDL lebih tinggi secara konsisten',
    ],
    full: [
      'Mood lebih stabil di pagi hari (tidak irritable karena lapar)',
      'Performa fisik olahraga pagi lebih optimal',
      'Membangun kebiasaan makan teratur sepanjang hari',
      'Mengurangi craving makanan tidak sehat di siang hari',
      'Protein pagi membantu pembentukan neurotransmitter',
    ],
    timeline: {
      day30: 'Energi pagi stabil, konsentrasi meningkat, tidak lapar berlebihan siang',
      day60: 'Metabolisme lebih efisien, berat badan terkontrol, produktivitas naik',
      day90: 'Kebiasaan permanen, gula darah stabil, pola makan keseluruhan teratur',
    },
  },

  'Makan Teratur': {
    quote: 'Tubuh lo adalah mesin yang bekerja terbaik dengan jadwal. Tidak ada mesin yang bisa diandalkan kalau BBnya tidak tentu.',
    top5: [
      'Makan konsisten meningkatkan efisiensi metabolisme hingga 12%',
      'Mencegah overeating dari survival mode eating akibat terlalu lapar',
      'Gula darah lebih stabil — mencegah insulin spike dan crash',
      'Enzim pencernaan diproduksi lebih efisien saat waktu makan konsisten',
      'Meningkatkan thermogenesis dan menurunkan lemak visceral',
    ],
    full: [
      'Mengurangi risiko gastritis dan GERD',
      'Mood lebih stabil karena gula darah tidak fluktuatif',
      'Tidur lebih baik (tidak lapar atau kekenyangan saat tidur)',
      'Memudahkan kontrol porsi dan total kalori harian',
      'Performa kerja lebih konsisten tanpa lapar distraction',
    ],
    timeline: {
      day30: 'Gula darah mulai stabil, tidak ada lagi energy crash ekstrem',
      day60: 'Metabolisme lebih efisien, berat badan lebih mudah dikontrol',
      day90: 'Ritme pencernaan optimal, risiko penyakit lambung berkurang',
    },
  },

  'Sikat Gigi': {
    quote: 'Kesehatan mulut adalah jendela kesehatan seluruh tubuh. Bakteri dari gusi bisa masuk ke aliran darah.',
    top5: [
      'Menurunkan risiko penyakit jantung sebesar 14%',
      'Mencegah gigi berlubang — kondisi kronis paling umum di dunia',
      'Mengurangi risiko stroke hingga 2.8x lipat',
      'Diabetes lebih terkontrol — HbA1c 0.5% lebih rendah',
      'Nafas segar meningkatkan kepercayaan diri sosial dan profesional',
    ],
    full: [
      'Mencegah penumpukan plak dan karang gigi',
      'Mempertahankan gigi alami lebih lama',
      'Mengurangi risiko kanker mulut',
      'Menghemat biaya perawatan gigi jangka panjang',
      'Meningkatkan penampilan (gigi putih dan bersih)',
      'Melindungi kesehatan ibu dan janin saat kehamilan',
    ],
    timeline: {
      day30: 'Nafas segar, gusi lebih sehat (tidak mudah berdarah)',
      day60: 'Plak berkurang signifikan, gigi terasa lebih bersih dan putih',
      day90: 'Risiko penyakit gigi dan gusi turun drastis, kebiasaan otomatis',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // KATEGORI 2 — KETENANGAN DIRI
  // ═══════════════════════════════════════════════════════════

  'Beribadah': {
    quote: 'Di tengah semua yang bisa lo kontrol dan tidak bisa lo kontrol, ibadah adalah anchor yang tidak bisa diambil.',
    top5: [
      'Dikaitkan dengan umur lebih panjang rata-rata 7 tahun — Mayo Clinic',
      'Menurunkan gejala depresi hingga 21% — meta-analisis 48 studi',
      'Meningkatkan resiliensi dan pemulihan trauma lebih cepat',
      'Menurunkan risiko kesepian yang setara merokok 15 batang/hari',
      'Struktur ibadah memperkuat self-discipline di area lain',
    ],
    full: [
      'Memberikan makna dan tujuan yang melampaui kesuksesan materi',
      'Meningkatkan rasa syukur dan kepuasan hidup',
      'Mengurangi rasa takut akan kematian dan ketidakpastian',
      'Panduan moral yang mengurangi konflik internal',
      'Ketenangan dalam menghadapi situasi di luar kendali',
      'Meningkatkan empati dan kepedulian terhadap orang lain',
    ],
    timeline: {
      day30: 'Rasa tenang setelah ibadah konsisten, stress harian lebih mudah dilepas',
      day60: 'Perspektif hidup lebih luas, resiliensi dalam menghadapi masalah meningkat',
      day90: 'Kedamaian batin sebagai baseline, hubungan lebih bermakna dan mendalam',
    },
  },

  'Mendengar Musik': {
    quote: 'Musik adalah bahasa paling langsung ke emosi manusia — tidak perlu diterjemahkan, tidak perlu dianalisis.',
    top5: [
      'Meningkatkan kadar dopamin hingga 9% — setara efek makanan lezat',
      'Musik 60-70 BPM menurunkan tekanan darah dan detak jantung',
      'Performa olahraga meningkat 12-15% dengan musik',
      'Mengurangi nyeri pasca operasi 20-25% lebih efektif',
      'Musik instrumental saat belajar meningkatkan fokus dan retensi',
    ],
    full: [
      'Mengekspresikan dan memproses emosi yang sulit diungkapkan',
      'Meningkatkan mood instan dan cepat',
      'Membantu transisi antara aktivitas (work-relax-workout)',
      'Mengurangi rasa kesepian',
      'Stimulasi kreativitas dan asosiasi bebas',
      'Meningkatkan motivasi saat melakukan tugas monoton',
    ],
    timeline: {
      day30: 'Mood lebih terkelola, ada playlist untuk setiap kondisi emosional',
      day60: 'Musik menjadi alat regulasi diri yang handal dan terinternalisasi',
      day90: 'Kecerdasan emosional meningkat, stress lebih mudah dikelola',
    },
  },

  'Latihan Napas': {
    quote: 'Lo bisa hidup berminggu tanpa makan, berhari tanpa minum, tapi hanya menit tanpa napas.',
    top5: [
      'Teknik 4-7-8 menurunkan kortisol dalam 5 menit tanpa efek samping',
      'Meningkatkan HRV — marker terbaik ketahanan stress',
      'Box breathing (Navy SEAL) menurunkan heart rate saat high-stress',
      'Kapasitas paru meningkat 15-20% dalam 8 minggu',
      'Wim Hof Method meningkatkan aktivitas imun secara klinis',
    ],
    full: [
      'Akses langsung ke sistem saraf parasimpatis (mode rileks)',
      'Meredakan serangan panik dalam 2-3 menit',
      'Meningkatkan fokus sebelum presentasi atau kompetisi',
      'Membantu tidur lebih cepat (sinyal tidur ke otak)',
      'Mengurangi tekanan darah tinggi tanpa obat',
      'Meningkatkan performa atletik dengan oksigenasi optimal',
    ],
    timeline: {
      day30: 'Mampu menenangkan diri dalam hitungan menit, tidur lebih mudah',
      day60: 'HRV meningkat, ketahanan stress lebih baik, tekanan darah turun',
      day90: 'Kesadaran napas otomatis, tubuh refleks beralih ke napas terkontrol saat chaos',
    },
  },

  'Latihan Musik': {
    quote: 'Belajar instrumen adalah satu-satunya aktivitas yang mengaktifkan SEMUA bagian otak secara bersamaan.',
    top5: [
      'Meningkatkan volume materi abu-abu di otak — terukur dalam MRI',
      'IQ rata-rata 7.5 poin lebih tinggi — berlaku juga untuk dewasa',
      'Melatih working memory dan multitasking lebih efektif dari aktivitas lain',
      'Risiko Alzheimer dan demensia 60% lebih rendah',
      'Meningkatkan disiplin dan growth mindset melalui proses lambat terukur',
    ],
    full: [
      'Ekspresi emosional dan kreativitas meningkat',
      'Kepercayaan diri melalui pencapaian skill yang nyata',
      'Koneksi sosial (bermusik bersama, komunitas)',
      'Terapi stres yang aktif dan produktif',
      'Meningkatkan kemampuan matematika dan bahasa',
    ],
    timeline: {
      day30: 'Dasar teknik terbentuk, rasa frustasi diganti percaya diri saat lagu pertama',
      day60: 'Koordinasi tangan meningkat, otak terasa lebih fleksibel belajar hal baru',
      day90: 'Kemampuan terukur, neuroplastisitas meningkat, disiplin menular ke area lain',
    },
  },

  'Digital Detox': {
    quote: 'Lo bukan yang scroll Instagram — lo adalah yang diperhatikan oleh algoritma agar terus scroll.',
    top5: [
      'Setiap interupsi butuh 23 menit untuk kembali fokus penuh',
      'Kurangi medsos 30 menit/hari turunkan depresi dan anxiety signifikan',
      'Blue light menunda onset tidur rata-rata 47 menit',
      'Attention span pulih dalam 2-4 minggu detox',
      'Kurang dari 48 jam tanpa medsos sudah kurangi FOMO signifikan',
    ],
    full: [
      'Waktu pulih untuk hal produktif, kreatif, atau relasional',
      'Koneksi lebih dalam dengan orang di sekitar',
      'Mengurangi perbandingan sosial yang merusak self-esteem',
      'Kreativitas meningkat — boredom adalah ibu dari ide baru',
      'Mengurangi neck pain dan eye strain',
      'Lebih sadar terhadap lingkungan dan momen saat ini',
    ],
    timeline: {
      day30: 'Withdrawal berubah jadi rasa lega, waktu terasa lebih banyak, tidur lebih baik',
      day60: 'Fokus meningkat drastis, hubungan real-world lebih berkualitas',
      day90: 'Hubungan dengan teknologi lebih sehat, lo yang mengontrol teknologi',
    },
  },

  'Meditasi': {
    quote: 'Latihan meditasi konsisten mengubah otak secara fisik — bukan metafora, tapi perubahan struktural di MRI.',
    top5: [
      '8 minggu meditasi mengubah struktur otak — amigdala mengecil, prefrontal menebal',
      'Menurunkan kadar kortisol rata-rata 20% dalam 8 minggu',
      'Sustain attention 50% lebih lama dibanding non-meditator',
      'Sama efektifnya dengan antidepresan untuk depresi ringan-sedang',
      'Meningkatkan aktivitas telomere — memperlambat penuaan seluler',
    ],
    full: [
      'Respons emosional lebih terukur, tidak reaktif',
      'Meningkatkan empati dan hubungan interpersonal',
      'Mengurangi nyeri kronis melalui perubahan persepsi nyeri',
      'Meningkatkan kreativitas dan lateral thinking',
      'Menurunkan tekanan darah secara signifikan',
      'Meningkatkan kualitas tidur (tertidur 15 menit lebih cepat)',
    ],
    timeline: {
      day30: 'Lebih mudah menangkap pikiran reaktif, stress lebih manageable',
      day60: 'Perubahan struktural otak mulai terjadi, fokus meningkat, emosi stabil',
      day90: 'Mindfulness menjadi cara hidup, otak literal berubah lebih sehat',
    },
  },

  'Bersyukur': {
    quote: 'Otak manusia default lebih memperhatikan ancaman daripada berkah. Bersyukur adalah latihan meretas bias negatif.',
    top5: [
      'Meningkatkan kebahagiaan 25% dalam 6 minggu',
      '10% lebih sedikit gejala fisik penyakit, tidur 30 menit lebih lama',
      'Memperkuat ikatan sosial dan kepuasan dalam hubungan',
      'Menurunkan biomarker inflamasi dalam 8 minggu',
      'Survivor trauma yang bersyukur pulih 2x lebih cepat',
    ],
    full: [
      'Mengurangi kecemburuan dan perbandingan sosial',
      'Meningkatkan self-esteem yang stabil',
      'Memperkuat optimisme yang realistis',
      'Membantu melihat peluang di tengah kesulitan',
      'Meningkatkan kepuasan dengan kehidupan yang sudah ada',
    ],
    timeline: {
      day30: 'Mood baseline meningkat, lebih mudah menemukan hal positif di hari biasa',
      day60: 'Perspektif berubah — problem terasa lebih kecil, hubungan sosial membaik',
      day90: 'Rewiring otak menuju positivity, kebahagiaan tidak bergantung kondisi eksternal',
    },
  },

  'Jalan Santai': {
    quote: 'Berjalan adalah satu-satunya olahraga yang direkomendasikan hampir semua ahli untuk hampir semua kondisi.',
    top5: [
      'Risiko jantung turun 35%, diabetes 30%, stroke 20% dengan 30 menit/hari',
      'Hippocampus meningkat 2% dalam setahun — membalikkan shrinkage penuaan',
      'Kreativitas meningkat 60% saat berjalan dibanding duduk',
      'Risiko kematian dini turun 20% dengan 8.000 langkah/hari',
      'Menurunkan gejala depresi setara antidepresan ringan',
    ],
    full: [
      'Low-impact, aman untuk semua usia dan kondisi',
      'Meningkatkan suasana hati melalui endorfin dan BDNF',
      'Paparan alam/luar ruangan menambah efek restoratif',
      'Membantu proses pemikiran dan problem-solving',
      'Mengurangi nyeri punggung akibat duduk terlalu lama',
      'Waktu untuk podcast, musik, atau sekadar berpikir',
    ],
    timeline: {
      day30: 'Stamina meningkat, mood lebih konsisten positif, jalan terasa berharga',
      day60: 'Berat badan mulai turun, tidur lebih nyenyak, stress lebih rendah',
      day90: 'Risiko penyakit kronis turun, otak lebih tajam, kebahagiaan baseline naik',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // KATEGORI 3 — EVOLUSI DIRI
  // ═══════════════════════════════════════════════════════════

  'Deep Work': {
    quote: 'Kemampuan untuk fokus dalam tanpa gangguan adalah superpower paling langka dan berharga di era ini.',
    top5: [
      '4 jam deep work > 8 jam shallow work — peak performance research',
      'Mempelajari skill kompleks secara eksponensial lebih cepat',
      'Mengurangi waktu penyelesaian tugas 50% tanpa interupsi',
      'Flow state meningkatkan produktivitas 5x lipat — McKinsey',
      'Membangun competitive advantage di dunia yang semakin distracted',
    ],
    full: [
      'Kepuasan kerja lebih tinggi dari pekerjaan yang selesai dengan baik',
      'Mengurangi rasa overwhelmed dan backlog pekerjaan',
      'Kualitas output meningkat drastis',
      'Waktu bebas lebih banyak karena efisiensi kerja meningkat',
      'Membangun reputation sebagai orang yang bisa diandalkan',
    ],
    timeline: {
      day30: 'Kemampuan fokus memanjang dari 20 menit ke 60+ menit, output lebih berkualitas',
      day60: 'Flow state lebih mudah dicapai, kemampuan belajar skill baru meningkat drastis',
      day90: 'Deep work menjadi default mode kerja, karir dan skill berkembang jauh melampaui rata-rata',
    },
  },

  'Membaca Buku': {
    quote: 'Membaca buku adalah cara paling murah untuk mengakses pemikiran terbaik manusia sepanjang sejarah.',
    top5: [
      '20 menit/hari = ~20 buku/tahun = top 1% pembaca aktif',
      'Mengurangi risiko Alzheimer hingga 32%',
      'Empati meningkat via theory of mind dari membaca fiksi',
      'Kosakata meningkat eksponensial — tingkatkan komunikasi dan persuasi',
      'Membaca 6 menit/hari mengurangi stress 68%',
    ],
    full: [
      'Memperluas perspektif dan cara pandang dunia',
      'Meningkatkan kemampuan analitis dan kritis',
      'Membangun knowledge base di bidang yang relevan',
      'Meningkatkan kemampuan menulis dan komunikasi',
      'Hiburan yang menstimulasi vs hiburan pasif',
      'Meningkatkan daya imajinasi dan kreativitas',
    ],
    timeline: {
      day30: '1 buku selesai, topik baru dikuasai, kebiasaan baca mulai menyenangkan',
      day60: '2-3 buku selesai, koneksi antar ide terbentuk, komunikasi meningkat',
      day90: '4-5 buku selesai, knowledge compounding dimulai, pemikiran kualitatif berbeda',
    },
  },

  'Membaca Berita': {
    quote: 'Informasi adalah kekuatan — tapi hanya kalau lo bisa memfilter mana yang sinyal dan mana yang noise.',
    top5: [
      'Meningkatkan kemampuan berpikir kritis dan kontekstual',
      'Menurunkan kerentanan terhadap disinformasi dan manipulasi opini',
      'Membantu keputusan keuangan dan karir yang lebih baik',
      'Kesadaran global meningkatkan empati dan pemahaman perspektif',
      'Pengetahuan terkini meningkatkan kualitas percakapan dan networking',
    ],
    full: [
      'Wawasan untuk diskusi intelektual dan profesional',
      'Mengurangi kerentanan terhadap hoaks dengan baseline knowledge kuat',
      'Memahami tren yang memengaruhi karir dan investasi',
      'Kewarganegaraan yang lebih bertanggung jawab dan aktif',
    ],
    timeline: {
      day30: 'Pengetahuan terkini lebih solid, percakapan lebih substantif',
      day60: 'Pattern recognition dalam berita terbentuk, bisa bedakan opini dan fakta',
      day90: 'Media literacy tinggi, bisa analisis berita kritis untuk keputusan lebih baik',
    },
  },

  'Deep Learning': {
    quote: 'Belajar bagaimana cara belajar adalah meta-skill paling berharga. Yang bisa belajar cepat akan selalu relevan.',
    top5: [
      'Deliberate practice membedakan expert dari novice — lebih dari bakat',
      'Spaced repetition meningkatkan retensi long-term hingga 90%',
      'Interleaving menghasilkan pemahaman lebih dalam dan transfer knowledge',
      'Feynman Technique meningkatkan retensi 90% dan ekspos gap pemahaman',
      'Mindset belajar aktif — skill paling kritis di era otomatisasi',
    ],
    full: [
      'Percepatan akuisisi skill baru di bidang apapun',
      'Meningkatkan kemampuan problem-solving kompleks',
      'Membuka peluang karir dan pendapatan lebih besar',
      'Membangun kepercayaan diri melalui mastery yang nyata',
      'Melatih otak tetap fleksibel dan adaptif sepanjang hidup',
    ],
    timeline: {
      day30: 'Skill target mulai terbentuk fondasi, metode belajar lebih efisien',
      day60: 'Kemampuan mulai nyata terlihat, belajar lebih menyenangkan karena progress',
      day90: 'Kompetensi signifikan di area yang dipilih, siap tantangan kompleks',
    },
  },

  'Journaling': {
    quote: 'Pikiran yang tidak ditulis adalah rumah yang tidak pernah dibersihkan. Journaling adalah sapu untuk pikiran lo.',
    top5: [
      'Meningkatkan fungsi imun secara terukur — landmark study direplikasi 200+x',
      'Menurunkan gejala PTSD 35% dalam 4 minggu',
      'Goal achievement rate 42% lebih tinggi dengan menulis tujuan',
      'Meningkatkan clarity dan pengambilan keputusan',
      'Predictor terkuat kepemimpinan efektif dan kesuksesan interpersonal',
    ],
    full: [
      'Memproses emosi sulit tanpa membebani orang lain',
      'Mengenali pola pikir negatif dan mengubahnya',
      'Dokumentasi pertumbuhan diri yang bisa dilihat kembali',
      'Meningkatkan kreativitas melalui free writing',
      'Mengurangi ruminasi (pikiran yang berulang-ulang)',
      'Memperjelas nilai, prioritas, dan tujuan hidup',
    ],
    timeline: {
      day30: 'Lebih mudah memahami emosi dan reaksi diri, pikiran lebih terorganisir',
      day60: 'Pola pikiran dan perilaku terlihat, self-awareness meningkat signifikan',
      day90: 'Bukti nyata pertumbuhan, self-knowledge mendalam, goal achievement meningkat',
    },
  },

  'Belajar Bahasa': {
    quote: 'Setiap bahasa baru yang dikuasai adalah jendela baru ke cara pandang dunia — dan peluang ekonomi baru.',
    top5: [
      'Onset Alzheimer 4.5 tahun lebih lambat pada bilingual',
      'Pendapatan meningkat rata-rata 10-15% per tahun di pasar global',
      'Meningkatkan cognitive flexibility — predictor kuat kreativitas dan IQ',
      'Membuka akses ke budaya dan koneksi manusia yang tak terjangkau',
      'Melatih toleransi ambiguitas dan pattern recognition',
    ],
    full: [
      'Peluang karir internasional terbuka lebar',
      'Perjalanan internasional jauh lebih kaya dan bermakna',
      'Meningkatkan empati lintas budaya',
      'Kepercayaan diri bertumbuh melalui skill nyata dan terukur',
      'Memory dan multitasking meningkat dari latihan rutin',
    ],
    timeline: {
      day30: '300-500 kata dasar dikuasai, kalimat sederhana bisa dibangun',
      day60: 'Percakapan dasar mulai bisa dilakukan, otak mulai berpikir dalam bahasa target',
      day90: 'Fondasi solid terbentuk, A2/B1 bisa dicapai dalam 6-12 bulan dengan konsistensi',
    },
  },

  'Perawatan Kulit': {
    quote: 'Kulit adalah organ terbesar tubuh dan wajah pertama yang dilihat dunia. Merawatnya bukan vanity — itu investasi.',
    top5: [
      'Sunscreen harian mencegah 90% tanda-tanda penuaan dini',
      'Menurunkan risiko kanker kulit melanoma',
      'Ritual skincare malam jadi anchor habit untuk sleep routine',
      'Kulit sehat meningkatkan kepercayaan diri sosial dan profesional',
      'Rutin merawat kulit = deteksi dini perubahan mencurigakan',
    ],
    full: [
      'Kulit lebih terhidrasi, elastis, dan bercahaya',
      'Mengurangi jerawat melalui cleansing dan kontrol minyak konsisten',
      'Melatih disiplin diri melalui ritual harian',
      'Investasi jangka panjang lebih murah dari treatment mahal di masa depan',
    ],
    timeline: {
      day30: 'Kulit lebih bersih, lembut, terhidrasi, jerawat berkurang',
      day60: 'Manfaat aktif skincare mulai terlihat, bintik memudar, kulit lebih cerah',
      day90: 'Transformasi nyata, skin barrier sehat, aging melambat, kulit di kondisi terbaik',
    },
  },

  'Perencanaan besok': {
    quote: '5 menit malam ini menghemat 1 jam kebingungan besok pagi.',
    top5: [
      'Menyelesaikan 20-25% lebih banyak prioritas penting',
      'Menurunkan anxiety sebelum tidur — otak bisa melepas tugas',
      'Mengurangi morning decision fatigue — keputusan sudah dibuat',
      'Meningkatkan goal alignment — aktivitas terhubung tujuan jangka panjang',
      'MIT yang direncanakan malam sebelum 42% lebih mungkin diselesaikan',
    ],
    full: [
      'Pagi yang lebih tenang dan terarah',
      'Tidak ada lagi hari yang hilang tanpa output jelas',
      'Lebih mudah masuk ke deep work lebih cepat',
      'Meningkatkan rasa kontrol dan kepuasan kerja',
      'Memberikan closure mental di akhir hari kerja',
    ],
    timeline: {
      day30: 'Pagi lebih smooth, produktivitas meningkat, stress mulai dari mana hilang',
      day60: 'Ritme planning terbentuk, gap antara niat dan eksekusi mengecil drastis',
      day90: 'System planning solid, setiap hari dijalani dengan intention, progress terukur',
    },
  },

  'Koneksi Sosial': {
    quote: 'Kualitas hubungan lo adalah prediktor terkuat kebahagiaan dan umur panjang — lebih kuat dari diet dan olahraga.',
    top5: [
      'Predictor terkuat umur panjang dan kebahagiaan — Harvard 75+ tahun',
      'Kesepian = risiko kematian dini setara merokok 15 batang/hari',
      'Social support kuat = ketahanan imun 50% lebih tinggi',
      'Buffer terkuat terhadap stress dan burnout di kerja',
      'Meningkatkan self-esteem, sense of purpose, dan motivasi intrinsik',
    ],
    full: [
      'Sumber dukungan emosional saat masa sulit',
      'Peluang karir dan kolaborasi melalui network yang kuat',
      'Perspektif dan ide baru dari orang dengan background berbeda',
      'Kebahagiaan yang genuine dan berkelanjutan',
      'Membantu orang lain memberikan meaning yang kuat',
    ],
    timeline: {
      day30: 'Hubungan renggang mulai membaik, merasa lebih terhubung dan didukung',
      day60: 'Lingkaran sosial bermakna terbangun, rasa kesepian berkurang signifikan',
      day90: 'Jaringan dukungan solid, kualitas hidup meningkat nyata',
    },
  },

  'Belajar Coding': {
    quote: 'Coding adalah bahasa abad ke-21. Yang tidak bisa koding akan dipekerjakan oleh yang bisa.',
    top5: [
      'Gaji 2-4x lipat profesi non-tech dengan pendidikan setara',
      'Demand developer tumbuh 25% hingga 2030',
      'Meningkatkan logical thinking dan problem decomposition',
      'Otomatisasi pekerjaan repetitif yang memakan waktu berjam-jam',
      'Entrepreneurship digital — bangun produk dari nol tanpa hire developer',
    ],
    full: [
      'Kemandirian teknologi — tidak bergantung orang lain untuk solusi digital',
      'Berpikir sistematis dan terstruktur',
      'Komunitas global developer yang sangat supportif',
      'Fleksibilitas kerja remote dari mana saja',
      'Kreativitas yang bisa diwujudkan menjadi produk nyata',
    ],
    timeline: {
      day30: 'Dasar sintaks dikuasai, program sederhana bisa dibuat',
      day60: 'Proyek kecil fungsional bisa diselesaikan, confidence meningkat',
      day90: 'Fondasi cukup untuk freelance kecil atau bangun tools sendiri',
    },
  },

  'Menggambar': {
    quote: 'Menggambar bukan tentang bakat — itu tentang belajar melihat. Orang yang bisa melihat detail, berpikir lebih jelas.',
    top5: [
      'Meningkatkan observational skills yang transfer ke semua bidang',
      'Art therapy mengurangi kortisol dalam 45 menit',
      'Meningkatkan fine motor skills dan koordinasi tangan-mata',
      'Mengaktifkan mode right brain — istirahat dari analytical thinking',
      'Ekspresi emosi non-verbal yang membantu memproses perasaan sulit',
    ],
    full: [
      'Kepuasan dari menciptakan sesuatu dengan tangan sendiri',
      'Meningkatkan kesabaran dan perhatian terhadap proses',
      'Skill yang bisa jadi karir atau side income',
      'Terapi yang accessible dan murah',
      'Meningkatkan kemampuan visualisasi untuk presentasi dan desain',
    ],
    timeline: {
      day30: 'Teknik dasar dikuasai, frustasi awal tergantikan progress, latihan menenangkan',
      day60: 'Kemampuan observasi meningkat nyata, gambar mulai punya karakteristik personal',
      day90: 'Skill terukur, kreativitas di area lain terstimulasi, menggambar jadi meditasi aktif',
    },
  },

  'Podcast': {
    quote: 'Podcast mengubah waktu mati — commute, olahraga, masak — menjadi universitas berjalan.',
    top5: [
      'Setara konsumsi 26 buku/tahun dalam bentuk audio',
      'Bisa dikonsumsi sambil aktivitas fisik atau berkendara',
      'Paparan ide dari ahli di bidang yang tak terjangkau jaringan pribadi',
      'Meningkatkan kemampuan mendengar aktif dan retensi audio',
      'Inspirasi dan motivasi konsisten menjaga momentum dan growth mindset',
    ],
    full: [
      'Mengisi waktu mati dengan konten bernilai',
      'Menemukan komunitas dan ide di niche yang sangat spesifik',
      'Menjaga diri tetap di ujung pengetahuan di bidang tertentu',
      'Hiburan intelektual yang stimulatif',
      'Gratis atau sangat murah dibanding kursus dan seminar',
    ],
    timeline: {
      day30: '8-12 episode selesai, wawasan baru terintegrasi ke percakapan sehari-hari',
      day60: 'Kebiasaan belajar sambil jalan terbentuk, commute jadi waktu produktif',
      day90: 'Pengetahuan setara beberapa buku, world view lebih kaya dan nuanced',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // KATEGORI 4 — LATIHAN FISIK
  // ═══════════════════════════════════════════════════════════

  'Latihan Beban': {
    quote: 'Muscle mass adalah asuransi kesehatan terbaik. Setiap kilogram otot yang lo bangun melindungi lo dekade ke depan.',
    top5: [
      '1kg otot membakar 50-100 kkal ekstra per hari bahkan saat istirahat',
      'Risiko diabetes tipe 2 turun hingga 32% — otot adalah sink glukosa',
      'Kepadatan tulang meningkat, risiko osteoporosis turun 40%',
      'Massa otot tinggi = risiko kematian 46% lebih rendah — JAMA 2022',
      'Meningkatkan testosteron, GH, dan IGF-1 secara alami — anti-aging',
    ],
    full: [
      'Performa atletik di semua cabang olahraga meningkat',
      'Postur tubuh lebih baik, nyeri punggung berkurang',
      'Kepercayaan diri dan body image meningkat drastis',
      'Latihan beban setara antidepresan untuk depresi ringan',
      'Kemampuan fungsional di usia tua tetap terjaga',
      'Meningkatkan kualitas tidur secara signifikan',
    ],
    timeline: {
      day30: 'Newbie gains dimulai, kekuatan naik 20-30%, energi lebih tinggi',
      day60: 'Perubahan komposisi tubuh terlihat jelas, otot lebih padat, lemak berkurang',
      day90: 'Transformasi fisik signifikan, baseline kekuatan 2-3x lipat dari awal',
    },
  },

  'Push-Up': {
    quote: 'Push-up adalah benchmark fitness paling jujur. Tidak ada yang bisa berbohong saat angkat beban tubuh sendiri.',
    top5: [
      '40+ push-up = risiko kardiovaskular 96% lebih rendah — JAMA 2019',
      'Melatih 8 kelompok otot sekaligus dalam satu gerakan',
      'Zero equipment — bisa di mana saja, kapan saja, tanpa biaya',
      'Meningkatkan kekuatan fungsional untuk aktivitas sehari-hari',
      'Progresif dan scalable — dari push-up lutut hingga one-arm',
    ],
    full: [
      'Meningkatkan postur dan mengurangi nyeri bahu',
      'Meningkatkan stabilitas core',
      'Aksesibel untuk pemula sebagai entry point ke fitness',
      'Membangun disiplin harian melalui habit simpel tapi powerful',
    ],
    timeline: {
      day30: 'Dari 5 ke 15-25 push-up, otot dada dan lengan mulai terasa',
      day60: '30-50 push-up feasible, kekuatan tubuh atas meningkat drastis',
      day90: '50-100 push-up bisa dilakukan, fitness kardiovaskular meningkat terukur',
    },
  },

  'Sit-Up': {
    quote: 'Core yang kuat bukan hanya soal six-pack — itu fondasi dari setiap gerakan tubuh dan pelindung tulang punggung.',
    top5: [
      'Memperkuat core — pencegahan utama nyeri punggung (80% dewasa alami)',
      'Meningkatkan performa atletik — core sebagai transfer point kekuatan',
      'Meningkatkan stabilitas dan keseimbangan — cegah jatuh di usia tua',
      'Postur lebih baik — core kuat menopang tulang belakang tegak',
      'Meningkatkan pernapasan — otot abdomen mendukung diafragma efisien',
    ],
    full: [
      'Pengurangan nyeri punggung kronis',
      'Penampilan fisik lebih atletis',
      'Meningkatkan performa seksual (kekuatan dan fleksibilitas)',
      'Mendukung postur duduk yang benar saat kerja di depan komputer',
    ],
    timeline: {
      day30: 'Core lebih kuat, nyeri punggung ringan mulai berkurang',
      day60: 'Otot core solid, performa olahraga lain meningkat, keseimbangan membaik',
      day90: 'Core strength protektif jangka panjang, risiko cedera berkurang signifikan',
    },
  },

  'Sesi Kardio': {
    quote: 'Kardio bukan hanya soal berat badan. Jantung adalah otot yang juga harus dilatih — lo tidak bisa hidup tanpanya.',
    top5: [
      '150 menit/minggu turunkan risiko kematian dini 35% dan jantung 53%',
      'Setiap 1 unit VO2max = risiko kematian turun 12-15%',
      'Endorfin dan BDNF — efek antidepresan natural 2-4 jam pasca sesi',
      'Membakar lemak visceral lebih efektif dari jenis olahraga lain',
      'Jantung memompa lebih efisien — usia jantung lebih panjang',
    ],
    full: [
      'Stamina dan daya tahan meningkat untuk semua aktivitas',
      'Tekanan darah menurun secara signifikan',
      'Kolesterol baik (HDL) meningkat',
      'Fungsi paru meningkat, pernapasan lebih efisien',
      'Kualitas tidur meningkat drastis',
      'Manajemen berat badan lebih efektif',
    ],
    timeline: {
      day30: 'Stamina meningkat, napas tidak cepat habis, tidur lebih nyenyak',
      day60: 'Komposisi tubuh berubah nyata, VO2max meningkat, jantung lebih efisien',
      day90: 'Kesehatan kardiovaskular signifikan, risiko penyakit kronis turun nyata',
    },
  },

  'Basket': {
    quote: 'Olahraga tim mengajarkan hal yang tidak bisa dipelajari dari gym sendirian: komunikasi, kepercayaan, dan kalah bermartabat.',
    top5: [
      'Kombinasi aerobik-anaerobik: 600-900 kkal/jam',
      'Melatih koordinasi, agility, dan reaction time',
      'Olahraga tim menurunkan depresi dan meningkatkan wellbeing',
      'Meningkatkan explosive power dan fast-twitch muscle fiber',
      'Kompetitif dan fun — lebih mudah konsisten jangka panjang',
    ],
    full: [
      'Membangun persahabatan dan koneksi sosial melalui permainan',
      'Meningkatkan sportivitas dan mental kompetitif yang sehat',
      'Koordinasi tangan-mata yang exceptional',
      'Kepemimpinan dan komunikasi real-time dalam tekanan',
      'Stres hilang dalam kompetisi dan permainan bersama',
    ],
    timeline: {
      day30: 'Stamina dan skill dasar meningkat, koneksi sosial mulai terbentuk',
      day60: 'Permainan lebih fluid, koordinasi lebih baik, fitness level naik',
      day90: 'Skill berkembang, tim solid, kesehatan kardiovaskular dan kebahagiaan sosial naik',
    },
  },

  'Lompat Tali': {
    quote: 'Lompat tali adalah olahraga paling underrated. 10 menit setara 30 menit jogging — dalam alat yang muat di saku.',
    top5: [
      'Membakar 700-1000 kkal/jam — lebih efisien dari hampir semua kardio',
      'Latihan koordinasi neuromuskuler terbaik',
      'Full body workout — calves, quads, hamstrings, shoulders, core',
      'Portabel dan murah — bisa dilakukan di mana saja',
      'Bone density meningkat — impact merangsang pembentukan tulang',
    ],
    full: [
      'Meningkatkan footwork dan kecepatan kaki',
      'Koordinasi ritme dan timing',
      'Cardiovascular endurance meningkat dramatis',
      'Sangat efisien untuk sesi pendek di hari yang sibuk',
      'Melatih konsentrasi dan focus (mudah tersandung kalau tidak fokus)',
    ],
    timeline: {
      day30: 'Dari 2 menit ke 10+ menit tanpa berhenti, koordinasi meningkat pesat',
      day60: 'Double unders mulai bisa, fitness level meningkat dramatis, body fat turun',
      day90: 'Level kompeten tercapai, cardiovascular fitness protektif terhadap penyakit kronis',
    },
  },

  'Bersepeda': {
    quote: 'Bersepeda adalah satu-satunya olahraga yang bisa mengantar lo dari A ke B, membakar 400 kkal, dan menyenangkan.',
    top5: [
      'Low-impact kardio tanpa stress pada lutut dan sendi',
      'Risiko kematian dini turun 41% dengan bersepeda — BMJ 2017',
      'Meningkatkan fungsi kognitif via kardio + navigasi + alam',
      'Hemat biaya transportasi Rp 500rb-2jt per bulan',
      'Eksplorasi — membuka aspek kota/alam yang tak terjangkau kendaraan',
    ],
    full: [
      'Kekuatan kaki dan glute meningkat',
      'Mental health: waktu di luar ruangan + gerakan = mood booster kuat',
      'Komunitas bersepeda yang supportif di hampir semua kota',
      'Sustainable habit — masih bisa dilakukan di usia 70+',
      'Melatih keseimbangan dan koordinasi',
    ],
    timeline: {
      day30: 'Stamina meningkat, commute lebih menyenangkan, kaki lebih kuat',
      day60: 'Jarak tempuh meningkat 2-3x lipat, berat badan mulai turun',
      day90: 'Cardiovascular fitness solid, kebiasaan seumur hidup terbentuk kuat',
    },
  },

  'Yoga': {
    quote: 'Yoga bukan agama, bukan stretching mewah. Yoga adalah praktik untuk siapapun yang punya tubuh dan pikiran.',
    top5: [
      'Menurunkan kadar kortisol rata-rata 27% setelah 8 minggu',
      'Fleksibilitas meningkat 35% dalam 8 minggu',
      'Tekanan darah sistolik turun rata-rata 5 mmHg',
      'Meningkatkan keseimbangan — cegah jatuh pada lansia',
      'Meningkatkan kualitas tidur — tertidur 15 menit lebih cepat',
    ],
    full: [
      'Kesadaran tubuh (body awareness) yang lebih tinggi',
      'Mengurangi nyeri kronis (punggung, leher, lutut)',
      'Melatih napas yang menjadi tool stress management',
      'Meningkatkan mood melalui regulasi sistem saraf',
      'Komunitas yang mendukung dan inklusif',
      'Melatih kesabaran dan penerimaan diri',
    ],
    timeline: {
      day30: 'Fleksibilitas meningkat nyata, stress lebih mudah dikelola, tidur lebih baik',
      day60: 'Pose sulit menjadi accessible, nyeri kronis berkurang, mind-body connection nyata',
      day90: 'Transformasi fisik dan mental komprehensif — fleksibilitas, kekuatan, ketenangan',
    },
  },

  'Plank': {
    quote: '60 detik plank setiap hari. 60 detik yang membangun core yang melindungi tulang punggung lo untuk dekade ke depan.',
    top5: [
      'Melatih semua otot core lebih efisien dari sit-up',
      'Mencegah nyeri punggung yang diderita 80% orang dewasa',
      'Anti-rotation dan anti-extension — lebih relevan untuk kehidupan nyata',
      'Tidak ada compression pada tulang belakang — aman setiap hari',
      'Time-efficient — 60-90 detik per set sudah substantial',
    ],
    full: [
      'Postur tegak yang terjaga sepanjang hari',
      'Performa olahraga lain meningkat (semua butuh core)',
      'Mengurangi risiko cedera saat angkat beban atau aktivitas berat',
      'Estetika perut yang lebih flat dan tone',
    ],
    timeline: {
      day30: 'Dari 20 detik ke 60+ detik, core lebih solid, nyeri punggung berkurang',
      day60: '2 menit plank feasible, postur signifikan membaik, performa latihan naik',
      day90: 'Core strength protektif, risiko cedera turun, foundation atletik kuat',
    },
  },

  'Lari': {
    quote: 'Manusia berevolusi untuk berlari. Setiap langkah adalah tubuh lo melakukan apa yang 2 juta tahun dia didesain untuk.',
    top5: [
      "Runner's high — endocannabinoid alami menciptakan euforia pasca lari",
      'Risiko kematian turun 30-45% bahkan hanya 5-10 menit/hari',
      'Satu-satunya olahraga yang konsisten menumbuhkan sel otak baru',
      'Bone density meningkat di kaki dan pinggul secara spesifik',
      'Mental toughness — mengatasi the wall melatih hambatan psikologis',
    ],
    full: [
      'Membakar lemak secara efisien',
      'Waktu untuk refleksi, meditasi bergerak, atau podcast',
      'Komunitas lari yang sangat aktif dan motivating',
      'Goal-oriented (5K, 10K, marathon) memberikan sense of achievement',
      'Murah — hanya butuh sepatu yang layak',
      'Melatih disiplin dan konsistensi melalui training plan',
    ],
    timeline: {
      day30: 'Dari 1km ke 3-5km tanpa berhenti, napas lebih teratur, runner\'s high mulai terasa',
      day60: '5-8km comfortable distance, berat badan turun, mood konsisten lebih baik',
      day90: '10km achievable, cardiovascular fitness solid, mental resilience nyata meningkat',
    },
  },

  'Renang': {
    quote: 'Renang adalah satu-satunya olahraga yang melatih seluruh tubuh tanpa kompetisi gravitasi. Semua manfaat, minimal cedera.',
    top5: [
      'Zero-impact — ideal untuk olahraga sepanjang hidup tanpa wear-and-tear',
      'Meningkatkan lung capacity 15-20% lebih dari kebanyakan olahraga',
      'Survival skill — 372.000 orang meninggal tenggelam per tahun (WHO)',
      'Menurunkan kolesterol, tekanan darah, dan risiko jantung',
      'Efek terapeutik air — menurunkan stress dan meredakan nyeri',
    ],
    full: [
      'Full-body workout yang komprehensif dan seimbang',
      'Sangat cocok untuk semua usia termasuk anak-anak dan lansia',
      'Melatih teknik pernapasan yang berguna di olahraga dan kehidupan',
      'Meningkatkan fleksibilitas tanpa risiko cedera',
      'Cooling exercise yang ideal untuk iklim tropis Indonesia',
    ],
    timeline: {
      day30: 'Teknik dasar membaik, jarak tempuh meningkat, pernapasan lebih terkontrol',
      day60: 'Kapasitas paru meningkat, bisa berenang 500m-1km tanpa berhenti',
      day90: 'Skill renang solid, cardiovascular fitness excellent, risiko cedera minimal',
    },
  },

  'Stretching': {
    quote: 'Fleksibilitas adalah komponen fitness paling diabaikan — sampai lo bangun pagi dan punggung tidak bisa diluruskan.',
    top5: [
      'Mengurangi chronic back pain pada 72% orang',
      'Otot fleksibel 40% lebih jarang cedera',
      'Sirkulasi darah ke otot meningkat, recovery lebih cepat',
      'Mengurangi tension headache dari postur buruk',
      'Range of motion yang dibangun sekarang = asuransi gerak 30 tahun ke depan',
    ],
    full: [
      'Mengurangi DOMS pasca olahraga',
      'Postur lebih baik dengan stretching chest dan hip flexors',
      'Relaksasi dan penurunan stress (parasympathetic activation)',
      'Meningkatkan koordinasi dan body awareness',
      'Ritual penutup olahraga yang membantu transisi ke mode istirahat',
    ],
    timeline: {
      day30: 'Fleksibilitas meningkat nyata, nyeri dan kekakuan pagi berkurang',
      day60: 'Range of motion meningkat signifikan, postur membaik, badan terasa lebih ringan',
      day90: 'Fleksibilitas yang sebelumnya tak terjangkau kini accessible, risiko cedera turun drastis',
    },
  },
};

/**
 * Get benefit data for a habit by name.
 * Falls back to generic data if habit not found.
 */
export function getHabitBenefitData(habitName: string): HabitBenefitData {
  return HABIT_BENEFITS_FULL[habitName] || GENERIC_BENEFIT;
}
