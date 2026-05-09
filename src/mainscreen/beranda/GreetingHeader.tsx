import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../../store/useUserStore';

// --- HELPERS ---
const dynamicHighlight = (text: string) => {
  const words = text.split(' ');
  if (words.length <= 1) return text;
  
  let longestIndex = 0;
  for (let i = 1; i < words.length; i++) {
    const currentLen = words[i].replace(/[.,!]/g, '').length;
    const longestLen = words[longestIndex].replace(/[.,!]/g, '').length;
    if (currentLen > longestLen) longestIndex = i;
  }

  return words.map((word, i) => {
    if (i === longestIndex) {
      return (
        <span key={i} className="text-white font-[900]">
          {word}{' '}
        </span>
      );
    }
    return <span key={i} className="text-[#E3DAC9]/70 font-medium">{word} </span>;
  });
};

export const GreetingHeader = () => {
  const { profile } = useUserStore();

  const getGreetingData = () => {
    const hours = new Date().getHours();
    const name = profile?.nickname || 'Bos';
    
    const greetings = {
      pagi: [
        { h1: `Selamat pagi!`, p: `Siap buat 1% lebih baik hari ini?` },
        { h1: `Halo, ${name}!`, p: `Pagi yang cerah untuk membangun kebiasaan baru. Apa target utamamu hari ini?` },
        { h1: `Mulai pagimu dengan komitmen.`, p: `Yuk, cek daftar habit-mu!` },
        { h1: `Good morning!`, p: `Satu centang pagi ini, seribu langkah menuju goals.` }
      ],
      siang: [
        { h1: `Halo siang!`, p: `Bagaimana progres kebiasaanmu? Jangan lupa minum air putih, ya!` },
        { h1: `Tengah hari!`, p: `Waktunya istirahat sejenak dan lihat apa yang sudah tercentang.` },
        { h1: `Tetap fokus, ${name}!`, p: `Kamu punya energi untuk selesaikan tugas-tugas siang ini.` },
        { h1: `Satu kebiasaan lagi siang ini,`, p: `agar harimu lebih terstruktur.` }
      ],
      sore: [
        { h1: `Selamat sore!`, p: `Sedikit lagi menuju streak harian. Kamu hebat!` },
        { h1: `Sore!`, p: `Yuk, tuntaskan habit terakhir sebelum santai.` },
        { h1: `Progres hari ini luar biasa!`, p: `Jangan lupa catat kebiasaan soremu.` },
        { h1: `Apresiasi dirimu hari ini.`, p: `Cek progres harianmu di sini.` }
      ],
      malam: [
        { h1: `Selamat malam!`, p: `Waktunya refleksi. Apa satu hal baik yang kamu lakukan hari ini?` },
        { h1: `Hari sudah malam.`, p: `Istirahat yang cukup agar besok lebih semangat.` },
        { h1: `Selesai!`, p: `Terima kasih sudah konsisten hari ini. Tidur nyenyak, ya.` },
        { h1: `Tutup harimu dengan tenang.`, p: `Sampai jumpa lagi besok!` }
      ]
    };

    let selectedCategory: keyof typeof greetings = 'pagi';
    if (hours >= 12 && hours < 15) selectedCategory = 'siang';
    else if (hours >= 15 && hours < 18) selectedCategory = 'sore';
    else if (hours >= 18 || hours < 4) selectedCategory = 'malam';

    return greetings[selectedCategory];
  };

  // Pick a random one from the category ONCE on mount
  const { h1, p } = useMemo(() => {
    const categoryList = getGreetingData();
    const randomIndex = Math.floor(Math.random() * categoryList.length);
    return categoryList[randomIndex];
  }, [profile?.nickname]); // Re-pick if profile changes to ensure name is correct

  const today = new Date();
  const dateStr = today.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="flex flex-col mb-10 pl-1 mt-3 gap-3">
      <span className="text-[34px] font-normal font-['Bebas_Neue'] text-[#E3DAC9] tracking-widest leading-none">
        {dateStr}
      </span>
      <div className="flex flex-col gap-1.5 items-start">
        <h1 className="text-[22px] font-medium text-white/90 tracking-tight leading-tight">
          {h1}
        </h1>
        <p className="text-[15px] text-white/40 font-medium tracking-wide leading-snug">
          {p}
        </p>
      </div>
    </div>
  );
};

export { dynamicHighlight };
