import type { BookPage } from './atomicHabitsContent';

export const PSYCHOLOGY_OF_MONEY_INTRO = {
  title: 'The Psychology of Money',
  author: 'Morgan Housel',
  year: 2020,
  readingTime: '15 menit',
  coverImage: '/perpustakaan/psycology_of_money/1.png',
  whyRead: 'Mengelola keuangan ternyata bukan soal seberapa pintar kamu matematika, melainkan soal seberapa baik kamu mengendalikan perilaku. Buku ini membongkar sisi psikologis manusia terhadap uang, ego, dan kekayaan, serta memberikan sudut pandang waras tentang cara mencapai kebebasan finansial sejati.',
  youWillLearn: [
    'Perbedaan mendasar antara menjadi kaya (rich) dan memiliki kekayaan (wealthy)',
    'Mengapa menjaga kekayaan butuh kemampuan yang berbeda dengan mencari uang',
    'Rahasia finansial terbesar: kekuatan waktu dan efek compounding',
  ],
};

export const PSYCHOLOGY_OF_MONEY_PAGES: BookPage[] = [
  {
    id: 'pom-1',
    type: 'content',
    title: 'Gak Ada Orang yang Gila dalam Mengelola Uang',
    image: '/perpustakaan/psycology_of_money/2.png',
    paragraphs: [
      'Setiap orang punya latar belakang, generasi, dan pengalaman hidup yang berbeda tentang ekonomi.',
      'Keputusan finansial yang terlihat gila bagi kamu, bisa jadi terlihat sangat logis bagi orang lain karena mereka melihat dunia dari kacamata yang berbeda.',
    ],
    insightBox: {
      label: 'Penerapan',
      text: 'Sadari bias kamu sendiri. Strategi keuangan terbaik adalah yang membuat kamu bisa tidur nyenyak di malam hari, bukan yang paling tinggi untungnya di atas kertas.',
      color: 'blue',
    },
  },
  {
    id: 'pom-2',
    type: 'content',
    title: 'Rasa Cukup: Menahan Ego Agar Gak Kebobolan',
    image: '/perpustakaan/psycology_of_money/3.png',
    paragraphs: [
      'Banyak orang cerdas bangkrut karena mereka mempertaruhkan apa yang mereka miliki dan butuhkan demi mengejar apa yang mereka tidak miliki dan tidak butuhkan.',
      'Mereka tidak tahu kapan harus memasang rem pada standar hidup mereka.',
    ],
    insightBox: {
      label: 'Insight',
      text: 'Reputasi, kebebasan, keluarga, dan kebahagiaan adalah aset yang tidak layak dipertaruhkan demi uang receh tambahan atau sekadar pengakuan dari orang yang bahkan gak kamu sukai.',
      color: 'green',
    },
  },
  {
    id: 'pom-3',
    type: 'content',
    title: 'Efek Domino: Keajaiban Investasi yang Membosankan',
    image: '/perpustakaan/psycology_of_money/4.png',
    paragraphs: [
      'Keberhasilan finansial terbesar sering kali bukan hasil dari investasi yang rumit atau tebakan yang jenius, melainkan hasil dari konsistensi dalam waktu yang sangat lama.',
    ],
    insightBox: {
      label: 'Contoh',
      text: 'Rahasia kekayaan Warren Buffett: dia mulai berinvestasi sejak usia 10 tahun. Lebih dari 90% kekayaannya baru didapat setelah usia 50 tahun. Kunci utamanya bukan kepintaran, tapi waktu.',
      color: 'amber',
    },
  },
  {
    id: 'pom-4',
    type: 'content',
    title: 'Mendapatkan Uang vs. Menjaga Uang',
    image: '/perpustakaan/psycology_of_money/5.png',
    paragraphs: [
      'Mendapatkan uang membutuhkan kemampuan mengambil risiko, optimisme, dan keberanian.',
      'Sebaliknya, menjaga uang membutuhkan kemampuan yang 180 derajat berbeda: kerendahan hati, rasa takut kehilangan, dan sedikit paranoia.',
    ],
    insightBox: {
      label: 'Penerapan',
      text: 'Selalu miliki dana darurat yang cair (cash) yang cukup untuk membiayai hidup selama 6-12 bulan ke depan. Dana darurat menjauhkan kamu dari keharusan menjual aset investasi di saat pasar sedang hancur.',
      color: 'blue',
    },
  },
  {
    id: 'pom-5',
    type: 'content',
    title: 'Menang Besar dari Banyaknya Kegagalan',
    image: '/perpustakaan/psycology_of_money/6.png',
    paragraphs: [
      'Kamu bisa salah dalam separuh keputusan keuangan, tapi tetap bisa kaya raya.',
      'Keberhasilan finansial digerakkan oleh tail events — sejumlah kecil peristiwa (1% dari total keputusan) yang memberikan dampak 99% kesuksesan.',
    ],
    insightBox: {
      label: 'Contoh',
      text: 'Disney menghasilkan ratusan film yang merugi, namun satu film blockbuster seperti Frozen atau Avengers sudah cukup untuk menutup seluruh biaya kegagalan dan memberikan keuntungan masif.',
      color: 'amber',
    },
  },
  {
    id: 'pom-6',
    type: 'content',
    title: 'Makna Tertinggi Uang: Membeli Kendali Atas Waktu',
    image: '/perpustakaan/psycology_of_money/7.png',
    paragraphs: [
      'Bentuk dividen tertinggi yang bisa diberikan oleh uang adalah kebebasan untuk mengendalikan waktu kamu sendiri.',
      'Gunakan uang bukan untuk membeli barang mewah demi membuat orang lain terkesan, melainkan untuk membeli fleksibilitas hidup.',
    ],
    insightBox: {
      label: 'Insight',
      text: 'Bahagia sejati adalah ketika kamu bangun di pagi hari dan bisa berkata: "Hari ini gw bisa melakukan apa saja yang gw mau."',
      color: 'green',
    },
  },
  {
    id: 'pom-7',
    type: 'content',
    title: 'Kaya vs. Memiliki Kekayaan',
    image: '/perpustakaan/psycology_of_money/8.png',
    paragraphs: [
      'Rich (Terlihat Kaya): Fungsi dari pendapatan saat ini. Mobil sport seharga 3 Milyar kelihatan jelas di mata.',
      'Wealthy (Memiliki Kekayaan): Fungsi dari uang yang tidak dibelanjakan. Investasi, saham, tabungan yang belum ditukarkan menjadi barang.',
    ],
    insightBox: {
      label: 'Insight',
      text: 'Menjadi rich itu mudah kelihatan, tapi jalan menuju wealthy mengharuskan kamu untuk menahan ego dan tidak membeli barang-barang yang sebenarnya gak dibutuhkan.',
      color: 'green',
    },
  },
];
