export interface Quote {
  text: string;
  explanation: string;
  category: 'hustle' | 'chill' | 'sarcastic' | 'deep';
}

export const QUOTES: Quote[] = [
  {
    text: "The version of you that you’re becoming is costing you people, relationships, spaces, and material things. Choose yourself over them.",
    explanation: "Versi dirimu yang lebih baik akan membuatmu kehilangan beberapa orang dan lingkungan lama. Pilih dirimu sendiri di atas segalanya.",
    category: 'deep'
  },
  {
    text: "Your focus is a currency. Spend it on things that actually give you a return on your life.",
    explanation: "Fokusmu adalah mata uang. Habiskan hanya untuk hal-hal yang memberikan timbal balik positif bagi hidupmu.",
    category: 'hustle'
  },
  {
    text: "The hard days are where the growth happens.\nYou don't build muscle on a rest day, you build it under tension.",
    explanation: "Pertumbuhan terjadi di hari-hari berat. Otot tidak terbentuk saat istirahat, tapi saat dilatih di bawah tekanan.",
    category: 'hustle'
  },
  {
    text: "Comfort is the enemy of progress. If you’re not slightly uncomfortable, you’re not growing.",
    explanation: "Kenyamanan adalah musuh kemajuan. Jika kamu tidak merasa sedikit tidak nyaman, berarti kamu tidak berkembang.",
    category: 'hustle'
  },
  {
    text: "Stop telling people your plans. Show them your results and let the success do the talking.",
    explanation: "Berhenti menceritakan rencanamu. Tunjukkan hasil, dan biarkan kesuksesan yang berbicara.",
    category: 'hustle'
  },
  {
    text: "You are not your mistakes,\nyou are the person who survived them and learned how to build a better path.",
    explanation: "Kamu bukanlah kesalahanmu,\nkamu adalah orang yang selamat dari kesalahan itu dan belajar membangun jalan yang lebih baik.",
    category: 'deep'
  },
  {
    text: "Discipline is doing what needs to be done, even when you don’t feel like doing it at all.",
    explanation: "Disiplin adalah melakukan apa yang harus dilakukan, bahkan saat kamu sama sekali tidak merasa ingin melakukannya.",
    category: 'hustle'
  },
  {
    text: "A private life is a happy life. Not everyone deserves a front-row seat to your journey.",
    explanation: "Hidup yang tertutup adalah hidup yang bahagia. Tidak semua orang pantas duduk di barisan depan perjalanan hidupmu.",
    category: 'deep'
  },
  {
    text: "Your potential is infinite, but your time is limited. Don’t waste it living someone else’s life.",
    explanation: "Potensimu tak terbatas, tapi waktumu terbatas. Jangan sia-siakan untuk menjalani hidup orang lain.",
    category: 'deep'
  },
  {
    text: "Success is a slow process and a quick result. Stay patient through the invisible work.",
    explanation: "Kesuksesan adalah proses yang lambat dengan hasil yang terlihat cepat. Tetaplah sabar melalui fase kerja keras yang tak terlihat orang lain.",
    category: 'hustle'
  },
  {
    text: "Comparison is the thief of joy, but it’s also the killer of your unique frequency.",
    explanation: "Membandingkan diri bukan hanya mencuri kebahagiaan, tapi juga membunuh keunikan pribadimu.",
    category: 'deep'
  },
  {
    text: "Don’t mistake movement for progress. A rocking horse keeps moving but never goes anywhere.",
    explanation: "Jangan keliru menganggap gerakan sebagai kemajuan. Kuda goyang terus bergerak tapi tidak pernah pindah tempat.",
    category: 'hustle'
  },
  {
    text: "The only person you should try to be better than is the person you were yesterday.",
    explanation: "Satu-satunya orang yang harus kamu kalahkan adalah dirimu yang kemarin.",
    category: 'hustle'
  },
  {
    text: "Integrity is doing the right thing when you know that nobody is watching you.",
    explanation: "Integritas adalah melakukan hal yang benar saat kamu tahu tidak ada seorang pun yang melihatmu.",
    category: 'deep'
  },
  {
    text: "You can't pour from an empty cup,\nSelf-care isn't selfish, it's essential for survival.",
    explanation: "Kamu tidak bisa memberi dari gelas yang kosong,\nMenjaga diri bukan egois, itu sangat penting untuk bertahan.",
    category: 'chill'
  },
  {
    text: "Mastering others is strength. Mastering yourself is true power.",
    explanation: "Menguasai orang lain adalah kekuatan. Menguasai diri sendiri adalah kekuatan yang sesungguhnya.",
    category: 'deep'
  },
  {
    text: "The goal isn't to be rich,\nthe goal is to be free. Wealth is just the tool to get there.",
    explanation: "Tujuannya bukan jadi kaya, tapi jadi bebas. Kekayaan hanyalah alat untuk mencapai kebebasan itu.",
    category: 'hustle'
  },
  {
    text: "Protect your energy like it’s your bank account. Don’t let people withdraw without depositing.",
    explanation: "Jaga energimu seperti menjaga saldo bank. Jangan biarkan orang menarik energi tanpa memberikan deposit yang sepadan.",
    category: 'deep'
  },
  {
    text: "Confidence is not 'they will like me.' Confidence is 'I’ll be fine if they don’t.'",
    explanation: "Percaya diri bukan \"mereka akan menyukaiku.\" Percaya diri adalah \"aku akan baik-baik saja meski mereka tidak menyukaiku.\"",
    category: 'deep'
  },
  {
    text: "If you want to fly, you have to give up the things that weigh you down.",
    explanation: "Jika ingin terbang, kamu harus melepaskan hal-hal yang membuatmu terasa berat dan terbebani.",
    category: 'hustle'
  },
  {
    text: "Burnout doesn't come from hard work,\nit comes from working on things that don't align with your soul.",
    explanation: "Kelelahan mental bukan datang dari kerja keras, tapi dari mengerjakan hal yang tidak sejalan dengan jiwamu.",
    category: 'chill'
  },
  {
    text: "The bridges you burn today might be the only way back home tomorrow. Think before you act.",
    explanation: "Jembatan yang kamu bakar hari ini mungkin satu-satunya jalan pulang besok. Berpikirlah sebelum bertindak.",
    category: 'deep'
  },
  {
    text: "A smart person solves a problem. A wise person avoids it entirely.",
    explanation: "Orang pintar menyelesaikan masalah. Orang bijak menghindari masalah itu sama sekali.",
    category: 'deep'
  },
  {
    text: "Growth is painful. Change is painful. But nothing is as painful as staying stuck where you don’t belong.",
    explanation: "Tumbuh itu sakit. Berubah itu sakit. Tapi tidak ada yang lebih sakit daripada terjebak di tempat yang bukan milikmu.",
    category: 'deep'
  },
  {
    text: "Your environment will either be the wind beneath your wings or the cage that holds you back.",
    explanation: "Lingkunganmu akan menjadi angin di bawah sayapmu atau menjadi kandang yang menahanmu.",
    category: 'deep'
  },
  {
    text: "Kindness is a language that the deaf can hear and the blind can see.",
    explanation: "Kebaikan adalah bahasa yang bisa didengar oleh yang tuli dan dilihat oleh yang buta.",
    category: 'chill'
  },
  {
    text: "Don't let yesterday take up too much of today. Every sunrise is a reset button.",
    explanation: "Jangan biarkan hari kemarin menyita terlalu banyak waktu hari ini. Setiap matahari terbit adalah tombol reset.",
    category: 'chill'
  },
  {
    text: "If the path is clear, it’s probably someone else’s. Real winners forge their own trails.",
    explanation: "Jika jalannya terlalu mulus dan jelas, mungkin itu jalan milik orang lain. Pemenang sejati membuka jalannya sendiri.",
    category: 'hustle'
  },
  {
    text: "Intelligence without ambition is a bird without wings. You need both to reach the peak.",
    explanation: "Kecerdasan tanpa ambisi bagaikan burung tanpa sayap. Kamu butuh keduanya untuk mencapai puncak.",
    category: 'hustle'
  },
  {
    text: "People don't fail because they aim high and miss,\nthey fail because they aim low and hit.",
    explanation: "Orang gagal bukan karena membidik terlalu tinggi lalu meleset,\nmereka gagal karena membidik terlalu rendah dan berhasil mencapainya.",
    category: 'hustle'
  },
  {
    text: "Value your time more than your money. You can always earn more money, but time is gone forever.",
    explanation: "Hargai waktumu lebih dari uangmu. Kamu selalu bisa mencari uang lagi, tapi waktu yang hilang takkan kembali.",
    category: 'hustle'
  },
  {
    text: "The secret of change is to focus all of your energy not on fighting the old, but on building the new.",
    explanation: "Fokuskan energimu bukan untuk melawan yang lama, tapi untuk membangun yang baru.",
    category: 'hustle'
  },
  {
    text: "Whatever you are physically, male or female, strong or weak, ill or whole, all those things matter less than what your heart contains.",
    explanation: "Apapun kondisi fisikmu, kuat atau lemah, semua itu tidak lebih penting daripada apa yang ada di dalam hatimu.",
    category: 'deep'
  },
  {
    text: "Great things never came from comfort zones. Stretch yourself until you find your limit.",
    explanation: "Hal-hal hebat tidak pernah datang dari zona nyaman. Regangkan dirimu sampai kamu menemukan batasmu.",
    category: 'hustle'
  },
  {
    text: "You are under no obligation to be the same person you were five minutes ago.",
    explanation: "Kamu tidak berkewajiban untuk menjadi orang yang sama dengan dirimu lima menit yang lalu.",
    category: 'deep'
  },
  {
    text: "The cave you fear to enter holds the treasure you seek.",
    explanation: "Gua yang paling kamu takuti untuk dimasuki menyimpan harta karun yang selama ini kamu cari.",
    category: 'deep'
  },
  {
    text: "Consistency is the only thing that separates the dreamers from the achievers.",
    explanation: "Konsistensi adalah satu-satunya pembeda antara sang pemimpi dan sang pencapai (achiever).",
    category: 'hustle'
  },
  {
    text: "Don't be afraid to start over. This time, you're not starting from scratch; you're starting from experience.",
    explanation: "Jangan takut memulai dari awal. Kali ini kamu tidak mulai dari nol, tapi mulai dari pengalaman.",
    category: 'deep'
  },
  {
    text: "Small steps in the right direction can turn out to be the biggest steps of your life.",
    explanation: "Langkah-langkah kecil di arah yang benar bisa menjadi langkah terbesar dalam hidupmu.",
    category: 'hustle'
  },
  {
    text: "Be so good they can't ignore you. Skill is the best marketing strategy.",
    explanation: "Jadilah sangat hebat sampai mereka tidak bisa mengabaikanmu. Skill adalah strategi pemasaran terbaik.",
    category: 'hustle'
  },
  {
    text: "Happiness is a direction, not a place. Enjoy the walk as much as the destination.",
    explanation: "Kebahagiaan adalah arah, bukan tempat tujuan. Nikmati perjalanannya sama seperti tujuannya.",
    category: 'chill'
  },
  {
    text: "Hard times create strong men. Strong men create easy times. Easy times create weak men.",
    explanation: "Masa sulit menciptakan orang kuat. Orang kuat menciptakan masa mudah. Masa mudah menciptakan orang lemah.",
    category: 'deep'
  },
  {
    text: "Everything you’ve ever wanted is sitting on the other side of fear.",
    explanation: "Segala yang kamu inginkan berada tepat di balik rasa takutmu.",
    category: 'hustle'
  },
  {
    text: "If you are the smartest person in the room, you are in the wrong room.",
    explanation: "Jika kamu adalah orang paling pintar di ruangan tersebut, berarti kamu berada di ruangan yang salah.",
    category: 'deep'
  },
  {
    text: "Learn to sit back and observe. Not everything needs a reaction.",
    explanation: "Belajarlah untuk tenang dan mengamati. Tidak semua hal membutuhkan reaksi darimu.",
    category: 'deep'
  },
  {
    text: "The best revenge is massive success and total indifference.",
    explanation: "Balas dendam terbaik adalah kesuksesan besar dan sikap yang benar-benar tidak peduli lagi.",
    category: 'hustle'
  },
  {
    text: "Life is 10% what happens to you and 90% how you react to it.",
    explanation: "Hidup adalah 10% apa yang terjadi padamu dan 90% bagaimana kamu bereaksi terhadapnya.",
    category: 'deep'
  },
  {
    text: "Work until your idols become your rivals. That is the ultimate benchmark.",
    explanation: "Bekerjalah sampai idolamu menjadi sainganmu. Itulah tolak ukur kesuksesan yang hakiki.",
    category: 'hustle'
  },
  {
    text: "Do not pray for an easy life, pray for the strength to endure a difficult one.",
    explanation: "Jangan berdoa untuk hidup yang mudah, berdoalah untuk kekuatan agar bisa bertahan di hidup yang sulit.",
    category: 'deep'
  },
  {
    text: "Your life does not get better by chance, it gets better by change.",
    explanation: "Hidupmu tidak jadi lebih baik karena keberuntungan; hidupmu jadi lebih baik karena sebuah perubahan.",
    category: 'hustle'
  },
  {
    text: "Don't decrease the goal. Increase the effort until the goal becomes the reality.",
    explanation: "Jangan turunkan ambisimu. Tingkatkan usahamu sampai kenyataan menyamai apa yang kamu impikan.",
    category: 'hustle'
  },
  {
    text: "The price of anything is the amount of life you exchange for it.",
    explanation: "Harga dari segala sesuatu adalah jumlah 'waktu hidup' yang kamu tukarkan untuk mendapatkannya.",
    category: 'deep'
  },
  {
    text: "You don’t find willpower, you create it by deciding that your excuses are no longer valid.",
    explanation: "Tekad itu tidak dicari, tapi diciptakan saat kamu memutuskan bahwa alasan/alibi sudah tidak berlaku lagi.",
    category: 'hustle'
  },
  {
    text: "Be careful who you vent to. A listening ear could also be a running mouth.",
    explanation: "Hati-hati saat curhat. Telinga yang mendengar bisa jadi mulut yang ember (menyebarkan rahasiamu).",
    category: 'deep'
  },
  {
    text: "If you are searching for that one person who will change your life, take a look in the mirror.",
    explanation: "Kalau kamu mencari satu orang yang bisa mengubah hidupmu, coba lihat ke cermin. Itu dirimu sendiri.",
    category: 'deep'
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    explanation: "Waktu terbaik menanam pohon adalah 20 tahun lalu. Waktu terbaik kedua adalah sekarang.",
    category: 'hustle'
  },
  {
    text: "Don’t let the internet rush you. No one is posting their failures, only their curated highlights.",
    explanation: "Jangan biarkan internet memburu-burumu. Orang hanya memposting hasil editan terbaik, bukan kegagalan mereka.",
    category: 'chill'
  },
  {
    text: "You cannot heal in the same environment that made you sick. Sometimes, moving on is medicine.",
    explanation: "Kamu tidak bisa sembuh di lingkungan yang sama dengan yang membuatmu sakit. Kadang, pergi adalah obat.",
    category: 'deep'
  },
  {
    text: "Work for a cause, not for applause. Live life to express, not to impress.",
    explanation: "Bekerjalah untuk sebuah tujuan, bukan untuk tepuk tangan. Hiduplah untuk berekspresi, bukan untuk pamer.",
    category: 'hustle'
  },
  {
    text: "If they don’t know you personally, don’t take it personally. Their opinion is based on a version of you that doesn't exist.",
    explanation: "Kalau mereka tidak kenal kamu secara pribadi, jangan bawa ke hati. Opini mereka cuma berdasarkan bayangan tentangmu yang tidak nyata.",
    category: 'deep'
  },
  {
    text: "You win some, you learn some. There is no such thing as losing if you gain a lesson.",
    explanation: "Kamu menang atau kamu belajar. Tidak ada istilah kalah jika kamu mendapatkan pelajaran berharga.",
    category: 'hustle'
  },
  {
    text: "A ship in harbor is safe, but that is not what ships are built for.",
    explanation: "Kapal di pelabuhan itu aman, tapi bukan untuk itu kapal diciptakan. Kapal ada untuk menerjang ombak.",
    category: 'hustle'
  },
  {
    text: "Your salary is the bribe they give you to forget your dreams. Use it to fund them instead.",
    explanation: "Gaji adalah 'sogokan' agar kamu melupakan mimpimu. Pakailah gaji itu untuk mendanai mimpimu sendiri.",
    category: 'hustle'
  },
  {
    text: "The more you seek validation from others, the less you will find it in yourself.",
    explanation: "Semakin kamu mencari pengakuan dari orang lain, semakin sedikit kamu akan menemukannya di dalam dirimu.",
    category: 'deep'
  },
  {
    text: "Be humble in your confidence yet courageous in your character.",
    explanation: "Tetaplah rendah hati dalam kepercayaan dirimu, tapi tetap berani dalam karaktermu.",
    category: 'deep'
  },
  {
    text: "People will notice the change in your attitude from you, but they won't notice their behavior that caused it.",
    explanation: "Orang akan sadar saat sikapmu berubah, tapi mereka jarang sadar bahwa perilaku merekalah yang menyebabkan perubahan itu.",
    category: 'deep'
  },
  {
    text: "What you do every day matters more than what you do every once in a while.",
    explanation: "Apa yang kamu lakukan setiap hari jauh lebih penting daripada apa yang kamu lakukan sesekali.",
    category: 'hustle'
  },
  {
    text: "Don't go back to the things that broke you, even if you miss the memories.",
    explanation: "Jangan kembali ke hal-hal yang pernah menghancurkanmu, meskipun kamu sangat merindukan kenangannya.",
    category: 'deep'
  },
  {
    text: "Everything is hard before it is easy. Everything is awkward before it is elegant.",
    explanation: "Segalanya terasa sulit sebelum jadi mudah. Segalanya terasa canggung sebelum jadi elegan.",
    category: 'deep'
  },
  {
    text: "A comfort zone is a beautiful place, but nothing ever grows there.",
    explanation: "Zona nyaman adalah tempat yang indah, tapi tidak ada satu pun hal yang bisa tumbuh di sana.",
    category: 'hustle'
  },
  {
    text: "Stop being a prisoner of your past. Become the architect of your future.",
    explanation: "Berhentilah jadi tawanan masa lalumu. Jadilah arsitek bagi masa depanmu.",
    category: 'deep'
  },
  {
    text: "Your circle should be proud, not jealous. If they aren't clenching their fists when you win, you're in the right room.",
    explanation: "Temanmu harusnya bangga, bukan iri. Jika mereka tidak tulus saat kamu menang, kamu di ruangan yang salah.",
    category: 'deep'
  },
  {
    text: "Logic will get you from A to B. Imagination will take you everywhere.",
    explanation: "Logika membawamu dari A ke B. Imajinasi bisa membawamu ke mana saja tanpa batas.",
    category: 'deep'
  },
  {
    text: "Never argue with someone who believes their own lies. You cannot win against a distorted reality.",
    explanation: "Jangan berdebat dengan orang yang percaya pada kebohongannya sendiri. Kamu tidak bisa menang melawan realitas yang diputarbalikkan.",
    category: 'sarcastic'
  },
  {
    text: "The biggest communication problem is we do not listen to understand. We listen to reply.",
    explanation: "Masalah komunikasi terbesar adalah kita tidak mendengar untuk mengerti, tapi mendengar untuk membalas.",
    category: 'deep'
  },
  {
    text: "Success is not just about what you accomplish in your life; it’s about what you inspire others to do.",
    explanation: "Kesuksesan bukan soal apa yang kamu capai, tapi seberapa banyak orang yang kamu inspirasi untuk bergerak.",
    category: 'hustle'
  },
  {
    text: "The quieter you become, the more you are able to hear what truly matters.",
    explanation: "Semakin kamu tenang dan diam, semakin banyak hal penting yang bisa kamu dengar dan pahami.",
    category: 'deep'
  },
  {
    text: "Your values are like a compass; they don’t tell you where to go, but they keep you on the right track.",
    explanation: "Nilai-nilaimu seperti kompas; mereka tidak memberi tahu arah tujuan, tapi menjagamu tetap di jalur yang benar.",
    category: 'deep'
  },
  {
    text: "Pain is temporary. Quitting lasts forever. Choose your struggle wisely.",
    explanation: "Rasa sakit itu sementara, tapi menyerah itu selamanya. Pilih perjuanganmu dengan bijak.",
    category: 'hustle'
  },
  {
    text: "If you want something you've never had, you must be willing to do something you've never done.",
    explanation: "Jika ingin sesuatu yang belum pernah kamu miliki, kamu harus melakukan sesuatu yang belum pernah kamu lakukan.",
    category: 'hustle'
  },
  {
    text: "A negative mind will never give you a positive life. Audit your thoughts regularly.",
    explanation: "Pikiran negatif tidak akan pernah memberimu hidup yang positif. Audit pikiranmu secara rutin.",
    category: 'hustle'
  },
  {
    text: "Don’t judge each day by the harvest you reap but by the seeds that you plant.",
    explanation: "Jangan menilai harimu dari hasil panen yang kamu petik, tapi dari benih yang kamu tanam hari itu.",
    category: 'deep'
  },
  {
    text: "Life is short, and it’s up to you to make it sweet without waiting for permission.",
    explanation: "Hidup itu singkat, kamulah yang harus membuatnya manis tanpa perlu menunggu izin dari siapa pun.",
    category: 'chill'
  },
  {
    text: "The dream is free, but the hustle is sold separately. Pay the price today to own your tomorrow.",
    explanation: "Mimpi itu gratis, tapi kerja keras dijual terpisah. Bayar harganya sekarang untuk memiliki masa depanmu.",
    category: 'hustle'
  },
  {
    text: "Small minds discuss people. Average minds discuss events. Great minds discuss ideas.",
    explanation: "Pikiran kecil membicarakan orang. Pikiran rata-rata membicarakan peristiwa. Pikiran besar membicarakan ide.",
    category: 'deep'
  },
  {
    text: "Your reputation is what others think of you. Your character is who you really are when nobody is looking.",
    explanation: "Reputasi adalah apa yang orang pikirkan tentangmu. Karakter adalah siapa kamu saat tidak ada yang melihat.",
    category: 'deep'
  },
  {
    text: "You are the average of the five people you spend the most time with. Choose your tribe carefully.",
    explanation: "Kamu adalah rata-rata dari lima orang terdekatmu. Pilih 'suku/circle'-mu dengan sangat hati-hati.",
    category: 'deep'
  },
  {
    text: "Sometimes you have to let go of the life you planned to find the life that is waiting for you.",
    explanation: "Kadang kamu harus melepaskan hidup yang kamu rencanakan demi menemukan hidup yang sebenarnya menunggumu.",
    category: 'deep'
  },
  {
    text: "If it's out of your hands, it deserves to be out of your mind too.",
    explanation: "Jika sesuatu berada di luar kendalimu, maka hal itu juga layak untuk keluar dari pikiranmu.",
    category: 'chill'
  },
  {
    text: "The secret of getting ahead is getting started. Procrastination is the thief of dreams.",
    explanation: "Rahasia untuk maju adalah dengan memulai. Menunda-nunda adalah pencuri mimpi yang paling licik.",
    category: 'hustle'
  },
  {
    text: "Don't waste your energy trying to change opinions. Focus on changing your own reality.",
    explanation: "Jangan buang energimu untuk mengubah opini orang. Fokuslah mengubah realitas hidupmu sendiri.",
    category: 'hustle'
  },
  {
    text: "The person who says it cannot be done should not interrupt the person doing it.",
    explanation: "Orang yang bilang 'itu tidak mungkin dilakukan' jangan sampai mengganggu orang yang sedang melakukannya.",
    category: 'hustle'
  },
  {
    text: "An investment in knowledge always pays the best interest in the long run.",
    explanation: "Investasi dalam pengetahuan selalu memberikan bunga (hasil) terbaik dalam jangka panjang.",
    category: 'hustle'
  },
  {
    text: "Forgive others, not because they deserve forgiveness, but because you deserve peace.",
    explanation: "Maafkan orang lain, bukan karena mereka pantas dimaafkan, tapi karena kamu layak mendapatkan kedamaian.",
    category: 'deep'
  },
  {
    text: "Character is how you treat those who can do absolutely nothing for you.",
    explanation: "Karakter asli terlihat dari bagaimana kamu memperlakukan orang yang sama sekali tidak bisa memberikan keuntungan bagimu.",
    category: 'deep'
  },
  {
    text: "Hard work beats talent when talent doesn’t work hard.",
    explanation: "Kerja keras mengalahkan bakat ketika bakat tersebut tidak mau bekerja keras.",
    category: 'hustle'
  },
  {
    text: "It’s better to be a lonely lion than a popular sheep.",
    explanation: "Lebih baik jadi singa yang kesepian daripada jadi domba populer yang cuma ikut-ikutan.",
    category: 'deep'
  },
  {
    text: "Don't look for a miracle. Be the miracle through your own actions and kindness.",
    explanation: "Jangan mencari mukjizat. Jadilah mukjizat itu sendiri melalui tindakan dan kebaikanmu.",
    category: 'deep'
  },
  {
    text: "The only limit to our realization of tomorrow will be our doubts of today.",
    explanation: "Satu-satunya batasan untuk pencapaian kita esok hari adalah keraguan yang kita pelihara hari ini.",
    category: 'deep'
  },
  {
    text: "Life doesn't have a remote control. Get up and change it yourself.",
    explanation: "Hidup tidak punya remote control. Kamu harus bangun dan mengubahnya sendiri dengan tanganmu.",
    category: 'hustle'
  },
  {
    text: "Kedewasaan bukan soal seberapa banyak tahun yang telah kamu lewati, tapi seberapa banyak badai yang telah kamu lalui dengan tenang.",
    explanation: "Kedewasaan sejati diukur dari ketenangan hati saat menghadapi badai hidup, bukan sekadar angka usia.",
    category: 'deep'
  },
  {
    text: "Jangan hanya sibuk menghitung hari, buatlah hari-hari itu menjadi bermakna untuk dihitung.",
    explanation: "Kualitas hidup ditentukan oleh apa yang kita lakukan setiap harinya, bukan seberapa lama kita hidup.",
    category: 'hustle'
  },
  {
    text: "Seringkali kita terlalu sibuk menyesali pintu yang tertutup, sampai kita tidak sadar ada jendela yang sengaja dibuka untuk kita.",
    explanation: "Jangan terpaku pada kegagalan masa lalu sampai kamu melewatkan kesempatan baru yang ada di depan mata.",
    category: 'deep'
  },
  {
    text: "Ilmu yang tidak diamalkan bagaikan pohon yang tidak berbuah,\nindah dipandang namun tidak memberi manfaat.",
    explanation: "Pengetahuan hanya akan menjadi kekuatan jika dipraktikkan untuk memberi manfaat bagi diri sendiri dan orang lain.",
    category: 'deep'
  },
  {
    text: "Kejujuran mungkin tidak memberimu banyak teman, tapi ia akan selalu memberimu teman yang tepat.",
    explanation: "Kualitas pertemanan jauh lebih penting daripada kuantitas. Kejujuran adalah penyaring terbaik.",
    category: 'deep'
  },
  {
    text: "Hidup ini terlalu singkat untuk digunakan hanya untuk menyenangkan orang yang bahkan tidak peduli pada kebahagiaanmu.",
    explanation: "Berhentilah mencari validasi dari orang yang salah. Fokuslah pada kebahagiaanmu sendiri.",
    category: 'deep'
  },
  {
    text: "Jangan bandingkan prosesmu dengan hasil orang lain. Matahari dan bulan punya waktunya masing-masing untuk bersinar.",
    explanation: "Setiap orang punya garis waktu kesuksesannya sendiri. Jangan terburu-buru oleh pencapaian orang lain.",
    category: 'chill'
  },
  {
    text: "Kesalahan terbesar yang bisa dilakukan seseorang adalah terus-menerus takut bahwa mereka akan melakukan kesalahan.",
    explanation: "Rasa takut gagal adalah penghambat terbesar kemajuan. Terimalah kesalahan sebagai bagian dari belajar.",
    category: 'deep'
  },
  {
    text: "Rezeki itu sudah ada takarannya, tapi keberkahan itu kita sendiri yang harus menjemputnya dengan cara yang benar.",
    explanation: "Bukan soal seberapa banyak yang kita dapat, tapi seberapa berkah cara kita mendapatkannya.",
    category: 'deep'
  },
  {
    text: "Orang yang paling kuat bukanlah dia yang tidak pernah jatuh, tapi dia yang mampu bangkit setiap kali terjatuh.",
    explanation: "Ketangguhan mental diuji saat kita mampu berdiri kembali setelah dihantam kegagalan berkali-kali.",
    category: 'hustle'
  },
  {
    text: "Adab itu lebih tinggi daripada ilmu. Pintar saja tidak cukup jika kamu tidak tahu cara menghargai sesama.",
    explanation: "Kecerdasan tanpa etika dan rasa hormat hanya akan membuat seseorang menjadi pintar yang merugikan.",
    category: 'deep'
  },
  {
    text: "Terkadang, melepaskan adalah cara terbaik untuk menggenggam sesuatu yang jauh lebih baik di masa depan.",
    explanation: "Jangan takut kehilangan hal lama demi memberi ruang bagi hal baru yang lebih baik masuk ke hidupmu.",
    category: 'deep'
  },
  {
    text: "Jangan menjelaskan tentang dirimu kepada siapapun, karena yang menyukaimu tidak butuh itu, dan yang membencimu tidak akan percaya itu.",
    explanation: "Biarkan kualitas dirimu yang berbicara melalui tindakan, bukan melalui pembelaan kata-kata.",
    category: 'deep'
  },
  {
    text: "Kesabaran bukan berarti diam dan menunggu, tapi kemampuan untuk menjaga sikap positif saat sedang berjuang.",
    explanation: "Sabar adalah tentang bagaimana kita berperilaku dan tetap berprasangka baik di tengah kesulitan.",
    category: 'hustle'
  },
  {
    text: "Dunia ini cukup untuk memenuhi kebutuhan semua orang, tapi tidak cukup untuk memenuhi ketamakan satu orang saja.",
    explanation: "Keserakahan tidak akan pernah ada ujungnya. Belajarlah merasa cukup agar hidup lebih tenang.",
    category: 'deep'
  },
  {
    text: "Hargai dia yang ada saat kamu jatuh, karena saat kamu sukses, semua orang akan berpura-pura menjadi temanmu.",
    explanation: "Kesetiaan diuji saat sulit. Jangan lupakan orang-orang yang tetap mendukungmu saat kamu bukan siapa-siapa.",
    category: 'deep'
  },
  {
    text: "Masa lalu adalah guru, masa kini adalah tugas, dan masa depan adalah hadiah yang harus kita persiapkan dari sekarang.",
    explanation: "Belajarlah dari masa lalu, kerjakan yang terbaik hari ini, dan nikmati hasilnya di masa depan.",
    category: 'deep'
  },
  {
    text: "Jangan jadikan kegagalan hari ini sebagai alasan untuk menyerah, tapi jadikan itu sebagai modal untuk mencoba lagi dengan lebih cerdas.",
    explanation: "Kegagalan adalah data. Gunakan pengalaman itu untuk memperbaiki strategi dan mencoba kembali.",
    category: 'hustle'
  },
  {
    text: "Bahagia itu sederhana: bersyukur dengan apa yang dimiliki dan tidak iri dengan apa yang dicapai orang lain.",
    explanation: "Kunci kebahagiaan adalah rasa syukur atas apa yang ada di genggaman kita saat ini.",
    category: 'chill'
  },
  {
    text: "Lebih baik berjalan sendirian di jalan yang benar daripada berlari bersama kerumunan di jalan yang salah.",
    explanation: "Prinsip dan integritas jauh lebih berharga daripada sekadar rasa aman karena mengikuti arus.",
    category: 'deep'
  },
  {
    text: "Apa yang ditanam dengan niat yang baik, akan tumbuh menjadi buah yang manis pada waktunya.",
    explanation: "Niat yang tulus akan membuahkan hasil yang berkah dan manis, meski butuh waktu untuk tumbuh.",
    category: 'deep'
  },
  {
    text: "Diam bukan berarti lemah. Terkadang, itu adalah cara paling elegan untuk menghadapi kebodohan.",
    explanation: "Menghemat energi dengan tidak menanggapi hal yang tidak penting adalah bentuk kekuatan mental.",
    category: 'sarcastic'
  },
  {
    text: "Jadilah pribadi yang tetap membumi meski prestasimu sudah menyentuh langit.",
    explanation: "Kerendahan hati adalah mahkota sejati bagi mereka yang telah mencapai kesuksesan besar.",
    category: 'deep'
  },
  {
    text: "Kekayaan yang sesungguhnya bukan tentang seberapa banyak harta yang terkumpul, tapi seberapa sedikit beban keinginan dalam hati.",
    explanation: "Kebebasan sejati adalah ketika kita tidak lagi diperbudak oleh keinginan-keinginan yang tak terbatas.",
    category: 'deep'
  },
  {
    text: "Perjalanan ribuan mil selalu dimulai dengan satu langkah kecil yang berani.",
    explanation: "Jangan takut memulai hal besar. Segala sesuatu dimulai dari keberanian untuk mengambil langkah pertama.",
    category: 'hustle'
  },
  {
    text: "Jangan terlalu keras pada dirimu sendiri. Kamu melakukan yang terbaik yang kamu bisa dengan apa yang kamu tahu saat ini.",
    explanation: "Berikan dirimu ruang untuk bernapas. Menghargai usaha sendiri adalah bentuk *self-love* yang penting.",
    category: 'chill'
  },
  {
    text: "Satu-satunya hal yang menghalangimu untuk mencapai tujuanmu adalah cerita yang terus kamu ceritakan pada dirimu sendiri tentang mengapa kamu tidak bisa mencapainya.",
    explanation: "Berhenti memberi makan alasan-alasan yang hanya akan membatasi potensi besarmu.",
    category: 'hustle'
  },
  {
    text: "Jika kamu ingin tahu karakter asli seseorang, lihatlah bagaimana cara dia memperlakukan orang yang tidak bisa memberikan apa-apa untuknya.",
    explanation: "Kebaikan tanpa pamrih adalah indikator utama dari kemuliaan hati seseorang.",
    category: 'deep'
  },
  {
    text: "Hidup bukan tentang menemukan jati diri, tapi tentang menciptakan jati diri.",
    explanation: "Kamu adalah arsitek hidupmu sendiri. Tentukan mau jadi apa kamu melalui tindakan harianmu.",
    category: 'deep'
  },
  {
    text: "Kita tidak bisa mengubah arah angin, tapi kita selalu bisa mengatur layar kapal kita untuk sampai ke tujuan.",
    explanation: "Kita tidak bisa mengontrol keadaan, tapi kita selalu bisa mengontrol respon kita terhadap keadaan itu.",
    category: 'hustle'
  },
  {
    text: "Keberhasilan tidak akan pernah menurunkan harganya. Kamu yang harus menaikkan standar usahamu.",
    explanation: "Jangan berharap jalan pintas. Jika ingin hasil luar biasa, tingkatkan kualitas perjuanganmu.",
    category: 'hustle'
  },
  {
    text: "Lebih baik dibenci karena menjadi diri sendiri daripada dicintai karena menjadi orang lain.",
    explanation: "Keaslian diri (authenticity) adalah kemewahan yang hanya dimiliki oleh orang-orang berani.",
    category: 'deep'
  },
  {
    text: "Setiap orang yang kamu temui tahu sesuatu yang tidak kamu ketahui; belajarlah dari mereka.",
    explanation: "Rendah hatilah untuk belajar dari siapa pun. Setiap pertemuan adalah kesempatan untuk tumbuh.",
    category: 'deep'
  },
  {
    text: "Kesuksesan adalah kemampuan untuk berpindah dari satu kegagalan ke kegagalan lain tanpa kehilangan semangat.",
    explanation: "Api semangat yang tetap menyala meski gagal berkali-kali adalah bahan bakar utama kesuksesan.",
    category: 'hustle'
  },
  {
    text: "Jangan biarkan kemarin mengonsumsi terlalu banyak dari hari ini.",
    explanation: "Masa lalu adalah sejarah. Fokuslah pada apa yang bisa kamu lakukan hari ini untuk masa depan.",
    category: 'chill'
  },
  {
    text: "Luka akan sembuh, tapi bekasnya ada untuk mengingatkan kita bahwa kita lebih kuat dari apa yang pernah menyakiti kita.",
    explanation: "Bekas luka adalah simbol keberanian dan bukti bahwa kamu telah memenangkan pertempuranmu.",
    category: 'deep'
  },
  {
    text: "Pikiran yang positif akan memberimu energi yang positif, dan energi yang positif akan mendatangkan hasil yang positif.",
    explanation: "Semesta merespon frekuensi pikiranmu. Jaga pikiran agar tetap optimis dan terarah.",
    category: 'hustle'
  },
  {
    text: "Waktu adalah modal utama yang tidak bisa diperbarui. Gunakanlah untuk hal-hal yang benar-benar layak.",
    explanation: "Setiap detik yang berlalu adalah bagian dari hidupmu. Jangan habiskan untuk hal-hal yang sia-sia.",
    category: 'deep'
  },
  {
    text: "Tujuan hidup adalah hidup yang bertujuan.",
    explanation: "Tanpa tujuan, kita hanya sekadar ada. Carilah alasan yang membuatmu semangat bangun setiap pagi.",
    category: 'deep'
  },
  {
    text: "Jangan hanya bermimpi, tapi bangunlah dan kerjakan apa yang perlu dilakukan agar mimpi itu tidak hanya jadi bunga tidur.",
    explanation: "Eksekusi adalah pembeda antara khayalan dan kenyataan. Segera mulai langkah nyatamu.",
    category: 'hustle'
  },
  {
    text: "Ketenangan batin dimulai saat kamu berhenti membiarkan orang lain mengendalikan emosimu.",
    explanation: "Kedaulatan atas perasaanmu sendiri adalah kunci kedamaian hidup yang hakiki.",
    category: 'deep'
  },
  {
    text: "Orang bijak bicara karena punya sesuatu untuk dikatakan, orang bodoh bicara karena harus mengatakan sesuatu.",
    explanation: "Pilihlah kata-kata dengan bijak. Kualitas bicara lebih penting daripada kuantitas suara.",
    category: 'deep'
  },
  {
    text: "Kerja keras tanpa doa adalah kesombongan, doa tanpa kerja keras adalah kebohongan.",
    explanation: "Keseimbangan antara ikhtiar dan tawakal adalah jalan ninja menuju keberhasilan yang berkah.",
    category: 'deep'
  },
  {
    text: "Kadang-kadang, hal yang paling sulit dilakukan adalah hal yang paling benar untuk dilakukan.",
    explanation: "Jalan kebenaran seringkali terjal. Kuatkan hatimu untuk tetap memilih jalur yang benar.",
    category: 'deep'
  },
  {
    text: "Jangan menunggu waktu yang tepat untuk melakukan hal yang baik. Waktunya adalah sekarang.",
    explanation: "Menunda kebaikan hanya akan menjauhkanmu dari keberuntungan. Lakukan sekarang juga.",
    category: 'hustle'
  },
  {
    text: "Kepintaran mungkin membawamu ke puncak, tapi karakterlah yang akan menjagamu agar tetap di sana.",
    explanation: "Tanpa integritas, kesuksesan hanya akan bersifat sementara. Bangun fondasi karakter yang kuat.",
    category: 'deep'
  },
  {
    text: "Seberapa jauh kamu melangkah tidaklah penting, selama kamu tidak berhenti.",
    explanation: "Kecepatan bukan segalanya. Yang terpenting adalah konsistensi untuk terus bergerak maju.",
    category: 'hustle'
  },
  {
    text: "Kunci dari segala kebahagiaan adalah rida (menerima dengan hati terbuka) atas apa yang telah ditetapkan untukmu.",
    explanation: "Kedamaian sejati datang dari penerimaan yang tulus terhadap ketetapan Tuhan dalam hidup.",
    category: 'deep'
  },
  {
    text: "Jangan biarkan dunia mengubah senyummu, biarkan senyummu yang mengubah dunia.",
    explanation: "Pertahankan aura positifmu. Jadilah sumber cahaya bagi lingkungan di sekitarmu.",
    category: 'chill'
  },
  {
    text: "Apa yang hilang darimu akan digantikan dengan sesuatu yang lebih baik, asalkan kamu tetap berprasangka baik pada takdir.",
    explanation: "Kehilangan adalah bagian dari proses pergantian menuju sesuatu yang lebih indah.",
    category: 'deep'
  },
  {
    text: "Jangan sampai kesibukanmu mengejar apa yang belum ada, membuatmu lupa menikmati apa yang sudah kamu punya.",
    explanation: "Syukuri yang ada di genggaman sambil tetap berjuang untuk yang ada di impian.",
    category: 'chill'
  },
  {
    text: "Tinggikan kata-katamu, bukan suaramu. Hujanlah yang menumbuhkan bunga, bukan petir.",
    explanation: "Kekuatan argumen jauh lebih efektif daripada kerasnya teriakan untuk meyakinkan orang lain.",
    category: 'deep'
  },
  {
    text: "Kita terlalu sering membangun tembok dan lupa membangun jembatan.",
    explanation: "Kurangi ego yang memisahkan, perbanyak empati yang menghubungkan antar sesama manusia.",
    category: 'deep'
  },
  {
    text: "Orang yang mencoba menjatuhkanmu sebenarnya sudah berada di bawahmu.",
    explanation: "Jangan terganggu oleh serangan dari belakang. Itu bukti bahwa kamu sudah melangkah lebih jauh.",
    category: 'sarcastic'
  },
  {
    text: "Kritik itu seperti obat pahit,\ntidak enak di lidah, tapi menyembuhkan jika ditelan dengan bijak.",
    explanation: "Jangan benci kritik yang membangun. Jadikan itu sebagai evaluasi untuk menjadi lebih baik.",
    category: 'deep'
  },
  {
    text: "Jangan pernah merasa paling benar di atas bumi, karena esok atau lusa kita semua akan berada di bawahnya.",
    explanation: "Kesombongan hanyalah ilusi. Tetaplah rendah hati karena semua hal di dunia ini bersifat sementara.",
    category: 'deep'
  },
  {
    text: "Hati yang penuh rasa syukur adalah magnet bagi keajaiban.",
    explanation: "Semakin banyak kamu bersyukur, semakin banyak alasan yang akan Tuhan berikan untukmu bersyukur.",
    category: 'chill'
  },
  {
    text: "Masalahmu tidak akan menjadi besar jika kamu tidak memberinya makan dengan pikiran negatifmu.",
    explanation: "Ukuran masalah tergantung pada cara pandangmu. Kendalikan pikiranmu agar masalah tidak mendominasi.",
    category: 'chill'
  },
  {
    text: "Lebih baik diam dan dianggap bodoh daripada bicara dan menghilangkan semua keraguan orang tentang kebodohanmu.",
    explanation: "Bijaklah dalam berbicara. Kadang diam adalah perlindungan terbaik bagi reputasimu.",
    category: 'sarcastic'
  },
  {
    text: "Rezeki tidak akan tertukar, tapi rezeki bisa terhambat oleh kurangnya usaha dan buruknya niat.",
    explanation: "Jemputlah rezekimu dengan kerja keras dan niat yang lurus agar mendatangkan keberkahan.",
    category: 'deep'
  },
  {
    text: "Jadilah seperti padi; semakin berisi, semakin merunduk. Jangan jadi seperti ilalang; kosong tapi tegak menantang.",
    explanation: "Kualitas diri seseorang tercermin dari kerendahan hatinya saat ia memiliki segalanya.",
    category: 'deep'
  },
  {
    text: "Kadang Tuhan tidak memberikan apa yang kita inginkan, bukan karena kita tidak pantas, tapi karena kita berhak mendapatkan yang lebih baik.",
    explanation: "Percayalah pada skenario Tuhan. Penolakan-Nya seringkali adalah perlindungan bagi kita.",
    category: 'deep'
  },
  {
    text: "Uang bisa membeli tempat tidur, tapi tidak bisa membeli tidur yang nyenyak.",
    explanation: "Kebahagiaan dan ketenangan batin tidak selalu bisa dibeli dengan materi semata.",
    category: 'deep'
  },
  {
    text: "Kesuksesan bukan tentang seberapa banyak orang yang mengenalmu, tapi seberapa banyak orang yang terbantu oleh kehadiranmu.",
    explanation: "Nilai sejati seseorang diukur dari kebermanfaatannya bagi orang lain.",
    category: 'deep'
  },
  {
    text: "Jangan takut kehilangan orang yang tidak takut kehilanganmu.",
    explanation: "Hargai dirimu sendiri. Jangan memaksakan diri bertahan di lingkungan yang tidak menghargaimu.",
    category: 'deep'
  },
  {
    text: "Kebohongan mungkin bisa menyelamatkanmu sementara, tapi ia akan menghancurkanmu selamanya.",
    explanation: "Kejujuran mungkin pahit di awal, tapi kebohongan akan meninggalkan luka yang permanen.",
    category: 'deep'
  },
  {
    text: "Dunia ini panggung sandiwara, tapi pastikan kamu tidak sedang memerankan peran yang dipaksakan orang lain.",
    explanation: "Jadilah dirimu sendiri. Jangan biarkan ekspektasi orang lain mendikte jalan hidupmu.",
    category: 'deep'
  },
  {
    text: "Apa yang kamu benci dari orang lain, biasanya adalah cerminan dari apa yang belum kamu perbaiki dalam dirimu.",
    explanation: "Gunakan ketidaksukaanmu sebagai sarana introspeksi untuk memperbaiki kualitas jiwamu.",
    category: 'deep'
  },
  {
    text: "Jangan terlalu cepat menilai hidup orang lain; kamu hanya melihat bab yang mereka pilih untuk dibaca dengan keras.",
    explanation: "Setiap orang punya perjuangan yang tidak mereka tunjukkan. Berempatilah daripada menghakimi.",
    category: 'deep'
  },
  {
    text: "Gengsi adalah biaya hidup paling mahal yang pernah ada.",
    explanation: "Hiduplah sesuai kemampuan, bukan sesuai kemauan untuk pamer di depan orang lain.",
    category: 'hustle'
  },
  {
    text: "Kemarahan adalah asam yang dapat merusak wadah penyimpannya lebih daripada apa pun yang dituangkan ke dalamnya.",
    explanation: "Kemarahan yang dipelihara hanya akan merugikan kesehatan mental dan fisikmu sendiri.",
    category: 'deep'
  },
  {
    text: "Orang yang paling bebas di dunia adalah orang yang sudah tidak butuh pengakuan dari siapa pun.",
    explanation: "Kemerdekaan sejati adalah ketika kamu sudah selesai dengan dirimu sendiri dan tidak haus validasi.",
    category: 'deep'
  },
  {
    text: "Jika rencanamu tidak berhasil, ubah strateginya, tapi jangan pernah ubah tujuannya.",
    explanation: "Fleksibel dalam metode, namun teguh dalam visi. Teruslah mencari jalan menuju puncak.",
    category: 'hustle'
  },
  {
    text: "Satu kata baik bisa menghangatkan tiga bulan musim dingin.",
    explanation: "Kekuatan kata-kata positif bisa memberi semangat luar biasa bagi orang yang sedang terpuruk.",
    category: 'chill'
  },
  {
    text: "Jangan menunggu bahagia untuk tersenyum, tapi tersenyumlah maka kamu akan bahagia.",
    explanation: "Bahagia adalah pilihan dan tindakan. Mulailah dari tindakan sederhana seperti tersenyum.",
    category: 'chill'
  },
  {
    text: "Kelemahan terbesar kita adalah menyerah. Cara paling pasti untuk sukses adalah selalu mencoba satu kali lagi.",
    explanation: "Keberhasilan seringkali datang satu langkah tepat setelah kita hampir memutuskan untuk menyerah.",
    category: 'hustle'
  },
  {
    text: "Kamu tidak bisa memulai bab baru dalam hidupmu jika kamu terus membaca bab yang lama.",
    explanation: "Lepaskan masa lalu agar kamu bisa fokus menulis masa depan yang lebih gemilang.",
    category: 'deep'
  },
  {
    text: "Jangan menceritakan kesulitanmu pada semua orang. 20% tidak peduli, and 80% lainnya senang kamu memilikinya.",
    explanation: "Pilihlah tempat bercerita yang tepat. Tidak semua telinga memiliki simpati yang tulus.",
    category: 'deep'
  },
  {
    text: "Kebahagiaan bukan tentang memiliki segalanya, tapi tentang tidak menginginkan apa yang tidak kamu perlukan.",
    explanation: "Minimalisme dalam keinginan adalah kunci maksimalisme dalam ketenangan batin.",
    category: 'chill'
  },
  {
    text: "Penghargaan terbaik untuk pekerjaan yang dilakukan dengan baik adalah kesempatan untuk melakukan lebih banyak lagi.",
    explanation: "Kesuksesan adalah tanggung jawab untuk memberikan dampak yang lebih besar lagi.",
    category: 'hustle'
  },
  {
    text: "Jadilah pribadi yang sulit dicari, tapi mudah ingat karena kebaikanmu.",
    explanation: "Membangun personal branding melalui kebaikan yang otentik dan langka di zaman sekarang.",
    category: 'deep'
  },
  {
    text: "Waktu tidak menyembuhkan luka, waktu hanya membuat kita terbiasa dengan rasa sakitnya sampai kita menjadi lebih kuat.",
    explanation: "Pertumbuhan karakter adalah proses berdamai dengan rasa sakit masa lalu.",
    category: 'deep'
  },
  {
    text: "Setiap orang hebat pernah menjadi pemula yang tidak menyerah.",
    explanation: "Jangan malu jadi amatir. Setiap ahli dulunya adalah pemula yang mau terus belajar.",
    category: 'hustle'
  },
  {
    text: "Jangan biarkan lidahmu memotong lehermu sendiri.",
    explanation: "Hati-hati dalam berucap. Kata-kata yang ceroboh bisa berbalik menjadi bumerang bagimu.",
    category: 'sarcastic'
  },
  {
    text: "Lebih baik kehilangan masa muda demi masa depan, daripada kehilangan masa depan demi masa muda.",
    explanation: "Disiplin di masa muda adalah investasi paling menguntungkan untuk hari tua nanti.",
    category: 'hustle'
  },
  {
    text: "Hargai proses orang lain, karena kamu tidak tahu beban apa yang sedang mereka pikul di pundaknya.",
    explanation: "Empati adalah kemampuan untuk tidak menghakimi hasil akhir tanpa tahu perjuangan di baliknya.",
    category: 'deep'
  },
  {
    text: "Pemenang sejati adalah dia yang mampu mengalahkan egonya sendiri.",
    explanation: "Kemenangan terbesar bukanlah menundukkan dunia, tapi menundukkan hawa nafsu diri sendiri.",
    category: 'deep'
  },
  {
    text: "Takdir memang di tangan Tuhan, tapi usaha adalah bentuk penghormatan kita terhadap takdir tersebut.",
    explanation: "Berikhtiar secara maksimal adalah cara kita memuliakan kesempatan hidup yang diberikan.",
    category: 'deep'
  },
  {
    text: "Jangan hanya melihat ke atas untuk mengejar kesuksesan, lihatlah juga ke bawah untuk mensyukuri keadaan.",
    explanation: "Perspektif yang seimbang akan membuatmu tetap ambisius namun penuh rasa syukur.",
    category: 'chill'
  },
  {
    text: "Kesempurnaan itu tidak ada, yang ada hanyalah kemauan untuk terus memperbaiki diri.",
    explanation: "Berhentilah mengejar kesempurnaan. Fokuslah pada kemajuan (progress) sekecil apa pun.",
    category: 'deep'
  },
  {
    text: "Jarak antara mimpi dan kenyataan disebut dengan disiplin.",
    explanation: "Disiplin harian adalah jembatan yang akan membawamu menyeberang ke pulau impian.",
    category: 'hustle'
  },
  {
    text: "Jangan menghakimi masa lalu seseorang; kamu tidak tahu betapa kerasnya mereka berjuang untuk meninggalkannya.",
    explanation: "Hargai setiap orang yang sedang berusaha menjadi versi yang lebih baik dari dirinya.",
    category: 'deep'
  },
  {
    text: "Keberanian bukan berarti tidak memiliki rasa takut, tapi kemampuan untuk bertindak meskipun rasa takut itu ada.",
    explanation: "Lakukan saja. Keberanian akan muncul seiring dengan langkah kakimu yang mulai bergerak.",
    category: 'hustle'
  },
  {
    text: "Apa pun yang kamu lakukan hari ini adalah investasi untuk dirimu di masa depan.",
    explanation: "Pilihlah kegiatan harianmu dengan bijak, karena itulah yang akan membentuk masa depanmu.",
    category: 'hustle'
  },
  {
    text: "Hidup itu seperti naik sepeda; untuk menjaga keseimbangan, kamu harus tetap bergerak.",
    explanation: "Stagnasi adalah awal dari kemunduran. Teruslah belajar dan bergerak untuk tetap seimbang.",
    category: 'hustle'
  },
  {
    text: "Jangan pernah berjanji saat bahagia, jangan menjawab saat marah, dan jangan memutuskan saat sedih.",
    explanation: "Kendalikan emosimu sebelum mengambil tindakan yang bisa kamu sesali di kemudian hari.",
    category: 'deep'
  },
  {
    text: "Rumah yang besar tidak menjamin kebahagiaan, tapi hati yang luas pasti akan menemukannya.",
    explanation: "Kapasitas kebahagiaan ditentukan oleh kelapangan hati, bukan luasnya aset material.",
    category: 'deep'
  },
  {
    text: "Sesuatu yang dikerjakan dengan hati akan sampai ke hati.",
    explanation: "Ketulusan adalah frekuensi yang bisa dirasakan oleh orang lain tanpa perlu banyak kata.",
    category: 'deep'
  },
  {
    text: "Jangan jadi orang yang hanya baik karena ada maunya, jadilah orang baik karena itu memang jati dirimu.",
    explanation: "Kebaikan sejati bersifat konsisten dan tidak tergantung pada kepentingan pribadi.",
    category: 'deep'
  },
  {
    text: "Akhir dari segala sesuatu adalah awal dari sesuatu yang baru. Tetaplah melangkah.",
    explanation: "Setiap penutupan adalah pembukaan bagi peluang baru. Jangan takut untuk melangkah ke depan.",
    category: 'chill'
  }
];

export const getRandomQuote = (previousQuote?: Quote) => {
  if (QUOTES.length <= 1) return QUOTES[0];
  
  let newQuote: Quote;
  do {
    newQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  } while (previousQuote && newQuote.text === previousQuote.text);
  
  return newQuote;
};
