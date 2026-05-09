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

  const renderGreeting = () => {
    const hours = new Date().getHours();
    let timeOfDay = '';
    let motivation = '';

    if (hours < 12) {
      timeOfDay = 'Pagi';
      motivation = 'Siap menaklukkan hari ini?';
    } else if (hours < 15) {
      timeOfDay = 'Siang';
      motivation = 'Tetap fokus, jaga momentum!';
    } else if (hours < 18) {
      timeOfDay = 'Sore';
      motivation = 'Rekap progres hari ini yuk.';
    } else {
      timeOfDay = 'Malam';
      motivation = 'Siapkan amunisi buat besok.';
    }

    return (
      <div className="flex flex-col gap-1 items-start">
        <h1 className="text-[22px] font-medium text-white/90 tracking-tight">
          Selamat {timeOfDay.toLowerCase()}, {profile?.nickname || 'Bos'}!
        </h1>
        <p className="text-[15px] text-white/40 font-medium tracking-wide">
          {motivation}
        </p>
      </div>
    );
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="flex flex-col mb-10 pl-1">
      <span className="text-[34px] font-normal font-['Bebas_Neue'] text-[#E3DAC9] tracking-widest mb-1.5 leading-none">
        {dateStr}
      </span>
      {renderGreeting()}
    </div>
  );
};

export { dynamicHighlight };
