/**
 * Atomic Habits — Structured content for paginated reader.
 * Each page is one screen. Images are optional.
 */

export interface BookPage {
  id: string;
  type: 'intro' | 'content' | 'insight' | 'laws' | 'closing';
  title?: string;
  subtitle?: string;
  image?: string; // path to /perpustakaan/atomichabits/
  paragraphs: string[];
  bullets?: string[];
  insightBox?: { label: string; text: string; color: 'green' | 'blue' | 'amber' };
  checklist?: string[];
}

export const ATOMIC_HABITS_INTRO = {
  title: 'Atomic Habits',
  author: 'James Clear',
  year: 2018,
  readingTime: '10 menit',
  coverImage: '/perpustakaan/atomichabits/1_cover_atomichabits.png',
  whyRead: 'Perubahan besar tidak lahir dari lompatan raksasa dalam semalam, melainkan dari akumulasi keputusan-keputusan kecil yang konsisten. Buku ini memberikan panduan praktis berbasis sains tentang cara membangun kebiasaan baik dan menghilangkan kebiasaan buruk lewat perubahan kecil sebesar 1% setiap harinya.',
  youWillLearn: [
    'Efek domino dari perubahan kecil 1% (compounding effect)',
    'Cara mengubah identitas, bukan cuma mengubah hasil',
    'Sistem "4 Hukum Perubahan Perilaku" untuk membentuk atau menghapus kebiasaan',
    'Cara mendesain lingkungan sekitar agar mendukung kesuksesan kebiasaan baru',
  ],
};

export const ATOMIC_HABITS_PAGES: BookPage[] = [
  // Page 1: Kekuatan 1%
  {
    id: 'page-1',
    type: 'content',
    title: 'Kekuatan Dahsyat dari Perubahan 1%',
    subtitle: 'Poin 1 dari 5',
    image: '/perpustakaan/atomichabits/2.png',
    paragraphs: [
      'Kebanyakan orang fokus pada hasil akhir yang besar dan meremehkan kemajuan kecil harian. Padahal, kebiasaan adalah bunga majemuk (compounding interest) dari perbaikan diri.',
      'Jika lo bisa menjadi 1% lebih baik setiap hari dalam setahun, lo akan menjadi 37 kali lipat lebih baik di akhir tahun. Sebaliknya, kalau lo makin memburuk 1% setiap hari, kemampuan lo akan merosot hampir ke angka nol.',
    ],
    insightBox: {
      label: 'Penerapan',
      text: 'Jangan targetkan langsung menulis 1 buku dalam sebulan. Targetkan menulis 1 paragraf saja setiap hari tanpa putus.',
      color: 'blue',
    },
  },

  // Page 2: Ubah Identitas
  {
    id: 'page-2',
    type: 'content',
    title: 'Ubah Identitas, Bukan Hasil Akhir',
    subtitle: 'Poin 2 dari 5',
    image: '/perpustakaan/atomichabits/3.png',
    paragraphs: [
      'Ada tiga lapisan perubahan perilaku:',
      'Hasil — apa yang lo dapat.\nProses — apa yang lo lakukan.\nIdentitas — apa yang lo percayai.',
      'Penghalang terbesar kegagalan kebiasaan baru adalah kita mencoba mengubah hasil tanpa mengubah identitas.',
    ],
    insightBox: {
      label: 'Contoh',
      text: 'Orang A ditawari rokok: "Saya sedang berusaha berhenti merokok" — dia masih menganggap dirinya perokok.\n\nOrang B: "Saya bukan perokok" — identitas sudah berubah total.',
      color: 'amber',
    },
  },

  // Page 3: Hukum 1 — Make It Obvious
  {
    id: 'page-3',
    type: 'laws',
    title: 'Jadikan Itu Terlihat',
    subtitle: 'Hukum ke-1: Make It Obvious',
    image: '/perpustakaan/atomichabits/4.png',
    paragraphs: [
      'Kebiasaan dipicu oleh tanda (cue). Jika tandanya tidak terlihat, kebiasaan tidak akan dimulai.',
      'Gunakan teknik Habit Stacking: "Setelah [Kebiasaan Lama], gw akan [Kebiasaan Baru]."',
    ],
    insightBox: {
      label: 'Penerapan',
      text: 'Setelah menuang kopi di pagi hari, bermeditasi 1 menit. Taruh botol minum besar di meja kerja yang langsung kelihatan mata.',
      color: 'blue',
    },
  },

  // Page 4: Hukum 2 — Make It Attractive
  {
    id: 'page-4',
    type: 'laws',
    title: 'Jadikan Itu Menarik',
    subtitle: 'Hukum ke-2: Make It Attractive',
    image: '/perpustakaan/atomichabits/5.png',
    paragraphs: [
      'Otak kita melepaskan dopamin bukan hanya saat mendapatkan kesenangan, tapi saat mengantisipasi kesenangan tersebut.',
      'Gunakan Temptation Bundling: gabungkan hal yang harus lo lakukan dengan hal yang ingin lo lakukan.',
    ],
    insightBox: {
      label: 'Contoh',
      text: 'Lo butuh belajar materi kuliah tapi ingin dengerin playlist favorit. Aturannya: lo cuma boleh dengerin playlist itu saat lagi belajar.',
      color: 'amber',
    },
  },

  // Page 5: Hukum 3 — Make It Easy
  {
    id: 'page-5',
    type: 'laws',
    title: 'Jadikan Itu Mudah',
    subtitle: 'Hukum ke-3: Make It Easy',
    image: '/perpustakaan/atomichabits/6.png',
    paragraphs: [
      'Manusia secara alami memilih opsi yang membutuhkan energi paling sedikit. Kuncinya adalah mengurangi hambatan (friction).',
      'Gunakan Aturan 2 Menit: saat memulai kebiasaan baru, usahakan prosesnya kurang dari 2 menit.',
    ],
    insightBox: {
      label: 'Penerapan',
      text: 'Jangan "baca buku 1 jam" → "baca 1 halaman". Jangan "olahraga 30 menit" → "pakai sepatu olahraga dan gelar matras". Begitu mulai bergerak, momentum membuat lo lanjut.',
      color: 'blue',
    },
  },

  // Page 6: Hukum 4 — Make It Satisfying
  {
    id: 'page-6',
    type: 'laws',
    title: 'Jadikan Itu Memuaskan',
    subtitle: 'Hukum ke-4: Make It Satisfying',
    image: '/perpustakaan/atomichabits/7.png',
    paragraphs: [
      'Tiga hukum pertama meningkatkan peluang kebiasaan dilakukan sekarang. Hukum keempat meningkatkan peluang kebiasaan diulangi di masa depan.',
      'Otak manusia menyukai kepuasan instan. Gunakan Habit Tracker visual — coret kalender setiap kali berhasil.',
    ],
    insightBox: {
      label: 'Insight',
      text: 'Kepuasan melihat coretan beruntun di kalender akan membuat otak lo gak mau merusak "rekor kesuksesan" tersebut.',
      color: 'green',
    },
  },

  // Page 7: Menghilangkan Kebiasaan Buruk
  {
    id: 'page-7',
    type: 'closing',
    title: 'Menghilangkan Kebiasaan Buruk',
    subtitle: 'Balik 4 Hukum',
    image: '/perpustakaan/atomichabits/8.png',
    paragraphs: [
      'Untuk mematikan kebiasaan negatif, balik sistem 4 Hukum:',
    ],
    bullets: [
      'Jadikan Tidak Terlihat — Sembunyikan pemicunya. Taruh HP di kamar sebelah saat kerja.',
      'Jadikan Tidak Menarik — Cari tahu kerugian besarnya jika diteruskan.',
      'Jadikan Sulit — Perbesar hambatan. Jangan stok camilan di rumah.',
      'Jadikan Mengecewakan — Buat Habit Contract. Kalau melanggar, bayar denda ke teman.',
    ],
  },
];
