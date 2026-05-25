import type { BookPage } from './atomicHabitsContent';

export const HOW_TO_INFLUENCE_INTRO = {
  title: 'How to Win Friends and Influence People',
  author: 'Dale Carnegie',
  year: 1936,
  readingTime: '15 menit',
  coverImage: '/perpustakaan/how_to_influence/cover.png',
  whyRead: 'Kesuksesan karir dan bisnis 85% ditentukan oleh kemampuan berkomunikasi, sisanya baru keahlian teknis. Buku ini membongkar psikologi dasar manusia agar kamu bisa disukai siapa saja, memenangkan negosiasi, dan memimpin orang lain tanpa memicu konflik.',
  youWillLearn: [
    'Cara membuat orang lain langsung nyaman dengan kamu',
    'Teknik mengkritik tanpa memicu rasa dendam',
    'Rahasia memenangkan argumen tanpa debat kusir',
  ],
};

export const HOW_TO_INFLUENCE_PAGES: BookPage[] = [
  {
    id: 'hti-1',
    type: 'content',
    title: 'Rahasia Terbesar Manusia: Ingin Merasa Penting',
    subtitle: undefined,
    image: '/perpustakaan/how_to_influence/1.png',
    paragraphs: [
      'Hasrat paling mendalam pada setiap manusia adalah keinginan untuk dihargai dan dianggap penting.',
      'Banyak orang gagal dalam hubungan karena terlalu sibuk menyombongkan diri sendiri, bukannya membuat orang lain merasa berharga.',
    ],
    insightBox: {
      label: 'Penerapan',
      text: 'Perhatikan hal kecil yang dilakukan rekan kerja atau teman, lalu puji secara spesifik.\nJangan cuma "Kerja bagus!" — ganti jadi: "Analisis lo di slide 5 tadi rapi banget, ngebantu gw paham masalahnya dengan cepat."',
      color: 'blue',
    },
  },
  {
    id: 'hti-2',
    type: 'content',
    title: 'Cara Termudah Bikin Orang Lain Terpikat',
    image: '/perpustakaan/how_to_influence/2.png',
    paragraphs: [
      'Cara tercepat agar disukai orang lain bukanlah dengan mencoba membuat mereka terkesan pada kamu, melainkan dengan menunjukkan ketertarikan yang tulus pada mereka.',
      'Tersenyumlah saat menyapa, lalu ajukan pertanyaan tentang kehidupan, minat, atau hobi mereka. Biarkan mereka yang bercerita 70% dari total obrolan.',
    ],
    insightBox: {
      label: 'Contoh',
      text: 'Seekor anjing bisa menjadi sahabat manusia tanpa perlu bekerja. Mengapa? Karena mereka tidak menjual apa-apa — mereka hanya melompat kegirangan dan tulus senang setiap kali melihat pemiliknya pulang.',
      color: 'amber',
    },
  },
  {
    id: 'hti-3',
    type: 'content',
    title: 'Nama Seseorang adalah Suara Termerdu bagi Mereka',
    image: '/perpustakaan/how_to_influence/3.png',
    paragraphs: [
      'Bagi setiap orang, nama mereka adalah kata yang paling penting dan paling merdu di dunia ini.',
      'Mengingat dan menyebut nama seseorang dalam obrolan menciptakan kedekatan psikologis yang instan dan rasa dihormati.',
    ],
    insightBox: {
      label: 'Penerapan',
      text: 'Saat berkenalan, ulangi namanya di awal obrolan agar nempel di otak. Sebut namanya minimal 2-3 kali selama percakapan.\n\n"Halo Budi, salam kenal. Budi sekarang kesibukannya lagi megang projek apa?"',
      color: 'blue',
    },
  },
  {
    id: 'hti-4',
    type: 'content',
    title: 'Cara Menghindari Debat Kusir yang Sia-Sia',
    image: '/perpustakaan/how_to_influence/4.png',
    paragraphs: [
      'Sembilan dari sepuluh debat kusir hanya berakhir dengan masing-masing pihak makin meyakini kebenarannya sendiri.',
      'Kamu gak akan pernah bisa menang dalam sebuah perdebatan. Jika kalah, kamu kalah. Jika menang pun, kamu membuat lawan bicara merasa direndahkan dan dendam.',
    ],
    insightBox: {
      label: 'Insight',
      text: 'Mengalah di awal untuk mendengarkan argumen mereka sampai selesai justru menurunkan ego lawan bicara, sehingga mereka akan lebih terbuka mendengarkan sudut pandang kamu kemudian.',
      color: 'green',
    },
  },
  {
    id: 'hti-5',
    type: 'content',
    title: 'Buat Orang Lain Mengatakan "Ya" Sejak Awal',
    image: '/perpustakaan/how_to_influence/5.png',
    paragraphs: [
      'Saat berbicara dengan orang yang berseberangan pendapat, jangan mulai dengan hal-hal yang membuat kalian berbeda. Mulailah dengan menekankan hal-hal yang kalian berdua sepakati.',
      'Gunakan Metode Socrates — ajukan pertanyaan pancingan yang jawabannya sudah pasti "Ya". Begitu otak mereka masuk mode "setuju", akan jauh lebih mudah mengarahkan mereka ke tujuan utama.',
    ],
    insightBox: {
      label: 'Contoh',
      text: 'Ingin menawarkan sistem baru ke bos? Jangan langsung sebut harga.\n\nTanya dulu: "Bos ingin produktivitas kantor aman tanpa kendala data bocor kan?" (Pasti dijawab Ya). Baru masuk ke inti penawaran.',
      color: 'amber',
    },
  },
  {
    id: 'hti-6',
    type: 'content',
    title: 'Seni Mengkritik Tanpa Memicu Kebencian',
    image: '/perpustakaan/how_to_influence/6.png',
    paragraphs: [
      'Sifat dasar manusia adalah menolak disalahkan. Jika kamu mengkritik seseorang secara frontal, harga diri mereka akan terluka, dan mereka akan mencari seribu alasan untuk membela diri.',
      'Gunakan teknik Sandwich Kritik: mulai dengan pujian tulus, lapisi dengan masukan secara tidak langsung, lalu tutup dengan kalimat penyemangat.',
    ],
    insightBox: {
      label: 'Contoh',
      text: '"Laporan lo minggu ini rapi banget bro. Cuma di bagian grafik ini akan jauh lebih tajam kalau lo tambahin data kompetitor sedikit lagi. Tapi overall ini keren banget, lanjutin ya!"',
      color: 'amber',
    },
  },
  {
    id: 'hti-7',
    type: 'content',
    title: 'Biarkan Orang Lain yang Merasa Memiliki Ide',
    image: '/perpustakaan/how_to_influence/7.png',
    paragraphs: [
      'Orang akan jauh lebih berkomitmen dan bersemangat melakukan sesuatu jika mereka merasa ide tersebut keluar dari kepala mereka sendiri, bukan karena didekte orang lain.',
      'Dibanding memberikan instruksi langsung, ubah menjadi pancingan pertanyaan. Ketika mereka memberikan idenya, dukung penuh.',
    ],
    insightBox: {
      label: 'Penerapan',
      text: '"Kita butuh naikin konversi 20% bulan ini, kira-kira menurut lo strategi apa yang paling pas buat tim lo?"\n\nMereka akan bekerja dua kali lebih keras karena merasa memiliki tanggung jawab moral atas ide yang mereka ciptakan sendiri.',
      color: 'blue',
    },
  },
];
