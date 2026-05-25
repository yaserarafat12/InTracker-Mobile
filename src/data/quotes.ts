export interface Quote {
  text: string;
  explanation: string;
  category: 'hustle' | 'deep' | 'chill' | 'sarcastic';
}

export const QUOTES: Quote[] = [
  // HUSTLE
  { text: "Don't stop when you're tired. Stop when you're done.", explanation: "Jangan berhenti pas capek. Berhenti pas tugas lo udah beres.", category: 'hustle' },
  { text: "Consistency is more important than perfection.", explanation: "Nggak perlu nunggu sempurna buat mulai. Konsistensi itu kunci segalanya.", category: 'hustle' },
  { text: "Your only limit is your mind.", explanation: "Satu-satunya hal yang nahan lo cuma isi kepala lo sendiri.", category: 'hustle' },
  { text: "Hard work beats talent when talent doesn't work hard.", explanation: "Kerja keras bakal nendang bakat kalau bakatnya malas-malasan.", category: 'hustle' },
  { text: "Action is the foundational key to all success.", explanation: "Nggak usah kebanyakan teori, mulai aja dulu. Itu kunci utamanya.", category: 'hustle' },
  { text: "Wake up with determination. Go to bed with satisfaction.", explanation: "Bangun bawa ambisi, tidur bawa hasil yang bikin puas.", category: 'hustle' },
  { text: "The dream is free. The hustle is sold separately.", explanation: "Mimpi itu gratis, tapi kalau mau jago ya harus bayar pakai keringat.", category: 'hustle' },
  { text: "Focus on the goal, not the obstacles.", explanation: "Liat tujuannya, jangan sibuk ngitungin rintangannya.", category: 'hustle' },
  { text: "Discipline is choosing between what you want now and what you want most.", explanation: "Disiplin itu seni milih antara kesenangan sesaat atau masa depan hebat.", category: 'hustle' },
  { text: "Small progress is still progress.", explanation: "Progres sekecil apa pun tetep progres. Jangan remehin langkah kecil.", category: 'hustle' },

  // DEEP
  { text: "Silence is the ultimate weapon.", explanation: "Diam itu senjata paling ngeri buat bales orang-orang berisik.", category: 'deep' },
  { text: "Knowledge is power, but character is everything.", explanation: "Pinter doang percuma kalau attitude lo nol besar.", category: 'deep' },
  { text: "Your vibe attracts your tribe.", explanation: "Energimu itu magnet. Bakal narik orang-orang yang sefrekuensi.", category: 'deep' },
  { text: "Be the exception.", explanation: "Jadilah orang yang beda dari yang lain, yang luar biasa.", category: 'deep' },
  { text: "Everything is hard before it is easy.", explanation: "Semua hal kerasa sulit banget di awal sebelum akhirnya jadi enteng.", category: 'deep' },
  { text: "Integrity is doing the right thing when no one is watching.", explanation: "Integritas itu tetap jujur meski nggak ada satu pun yang liat.", category: 'deep' },
  { text: "You are not your mistakes.", explanation: "Lo bukan kesalahan masa lalu lo. Masa depan lo masih bisa diubah.", category: 'deep' },
  { text: "Quality over quantity.", explanation: "Kualitas nomor satu. Jangan sibuk ngejar jumlah tapi hasilnya ampas.", category: 'deep' },
  { text: "Character is fate.", explanation: "Karakter lo hari ini bakal nentuin takdir lo nanti.", category: 'deep' },
  { text: "Stay original in a world of copies.", explanation: "Tetap jadi diri sendiri di dunia yang isinya cuma tukang fotokopi.", category: 'deep' },

  // CHILL
  { text: "Simplify your life.", explanation: "Sederhanain hidup lo. Buang hal-hal nggak penting yang bikin berat.", category: 'chill' },
  { text: "Enjoy the walk.", explanation: "Nikmati prosesnya, jangan cuma ngejar hasil akhirnya doang.", category: 'chill' },
  { text: "Self-care isn't selfish.", explanation: "Ngerawat diri sendiri itu investasi, bukan berarti egois.", category: 'chill' },
  { text: "Take it slow, but keep going.", explanation: "Pelan asal kelakon. Yang penting tetep gerak, jangan diem.", category: 'chill' },
  { text: "Breathe. You're doing fine.", explanation: "Tarik napas. Lo udah berjuang hebat hari ini.", category: 'chill' },
  { text: "Less is more.", explanation: "Kadang yang simpel itu jauh lebih bermakna daripada yang ribet.", category: 'chill' },
  { text: "Stay calm and focused.", explanation: "Tetep tenang, jangan panik, jaga fokus lo tetep tajam.", category: 'chill' },
  { text: "Nature doesn't hurry, yet everything is accomplished.", explanation: "Alam nggak pernah buru-buru, tapi semuanya tetap beres tepat waktu.", category: 'chill' },
  { text: "Happiness is a direction, not a place.", explanation: "Bahagia itu cara lo melangkah, bukan cuma sekadar titik tujuan.", category: 'chill' },
  { text: "Santai bukan berarti lalai.", explanation: "Istirahat dulu bentar buat kumpulin tenaga biar makin kenceng.", category: 'chill' },

  // SARCASTIC
  { text: "Excuses don't build empires.", explanation: "Alasan terus nggak bakal bikin lo jadi orang hebat.", category: 'sarcastic' },
  { text: "Dreams don't work unless you do.", explanation: "Mimpi nggak bakal jadi nyata kalau lo cuma tidur doang.", category: 'sarcastic' },
  { text: "Results, not excuses.", explanation: "Kasih liat hasil nyata, jangan cuma jago nyari alasan.", category: 'sarcastic' },
  { text: "Stop talking, start doing.", explanation: "Berhenti omong kosong, mending langsung eksekusi sekarang.", category: 'sarcastic' },
  { text: "Do it with passion or not at all.", explanation: "Kerjain pakai hati atau nggak usah sama sekali. Jangan setengah-setengah.", category: 'sarcastic' },
  { text: "Hustle beats talent.", explanation: "Kerja keras bakal selalu ngalahin orang berbakat yang malas.", category: 'sarcastic' },
  { text: "Integrity is the best shield.", explanation: "Jujur itu pelindung reputasi paling kuat di dunia.", category: 'sarcastic' },
  { text: "Results speak louder.", explanation: "Nggak usah banyak omong, hasil akhir lo yang bakal bicara.", category: 'sarcastic' },
  { text: "Don't be a rocking horse.", explanation: "Jangan sibuk gerak tapi nggak pindah tempat. Gerak maju!", category: 'sarcastic' },
  { text: "Validation is for parking.", explanation: "Gak perlu haus validasi orang lain. Lo tau kualitas lo sendiri.", category: 'sarcastic' }
];

export const getRandomQuote = (previousQuote?: Quote) => {
  if (QUOTES.length <= 1) return QUOTES[0];
  
  let newQuote: Quote;
  do {
    newQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  } while (previousQuote && newQuote.text === previousQuote.text);
  
  return newQuote;
};
