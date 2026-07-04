import { useMemo } from 'react';
import { useUserStore } from '../../store/useUserStore';

export const GreetingHeader = () => {
  const { profile, settings } = useUserStore();

  const getGreetingData = () => {
    const hours = new Date().getHours();
    
    const greetings = {
      pagi: [
        { h1: `Selamat pagi!`, p: `Mari mulai hari dengan langkah kecil.` },
        { h1: `Pagi ini milikmu.`, p: `Satu kebiasaan baik dulu aja.` },
        { h1: `Hari baru, kesempatan baru.`, p: `Pelan-pelan juga tetap maju.` }
      ],
      siang: [
        { h1: `Selamat siang!`, p: `Jangan lupa cek progresmu hari ini.` },
        { h1: `Masih ada waktu`, p: `untuk jadi lebih baik hari ini.` },
        { h1: `Tetap fokus.`, p: `Sedikit lagi menuju targetmu.` }
      ],
      sore: [
        { h1: `Selamat sore!`, p: `Terima kasih sudah bertahan sejauh ini.` },
        { h1: `Hari hampir selesai.`, p: `Apresiasi progres kecilmu hari ini.` },
        { h1: `Pelan, tapi konsisten.`, p: `Itu yang paling penting.` }
      ],
      malam: [
        { h1: `Hari ini cukup.`, p: `Besok kita lanjut lagi.` },
        { h1: `Good night.`, p: `Rest your mind gently tonight.` },
        { h1: `The day is over.`, p: `You did enough.` },
        { h1: `Small progress matters.`, p: `Good night.` }
      ]
    };

    let selectedCategory: keyof typeof greetings = 'pagi';
    if (hours >= 12 && hours < 15) selectedCategory = 'siang';
    else if (hours >= 15 && hours < 18) selectedCategory = 'sore';
    else if (hours >= 18 || hours < 4) selectedCategory = 'malam';

    return greetings[selectedCategory];
  };

  const currentDay = useMemo(() => {
    if (!profile?.created_at) return 1;
    try {
      const joinDate = new Date(profile.created_at);
      joinDate.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const diffTime = today.getTime() - joinDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const pausedDays = settings.pausedDays || [];
      const pausedBeforeToday = pausedDays.filter(dStr => {
        const d = new Date(dStr + 'T00:00:00');
        d.setHours(0, 0, 0, 0);
        return d <= today;
      }).length;
      
      const programDuration = settings.programDuration || 90;
      return Math.min(programDuration, Math.max(1, diffDays - pausedBeforeToday + 1));
    } catch {
      return 1;
    }
  }, [profile?.created_at, settings.pausedDays, settings.programDuration]);

  const { h1, p } = useMemo(() => {
    const categoryList = getGreetingData();
    const randomIndex = Math.floor(Math.random() * categoryList.length);
    return categoryList[randomIndex];
  }, [profile?.nickname]);

  return (
    <div className="flex flex-col pl-1 mt-3 gap-8">
      <div className="flex items-center gap-4 mt-4">
        <h2 className="font-black font-['Outfit'] text-white tracking-tight flex items-baseline leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.35)]">
          <span className="text-[35px]">Day</span>
          <span className="font-['Inter'] text-[31px] text-white ml-4 tracking-[0.03em]">
            {currentDay}<span className="mx-1">/</span>{settings.programDuration || 90}
          </span>
        </h2>
      </div>
      
      <div className="flex flex-col gap-1.5 mt-0.5">
        <h1 className="text-[28px] text-white font-black font-['Outfit'] leading-tight tracking-tight drop-shadow-[0_2px_15px_rgba(255,255,255,0.15)]">
          {h1}
        </h1>
        <p className="text-[16px] text-[#E3DAC9] font-semibold font-['Outfit'] tracking-[0.05em] leading-relaxed opacity-95">
          {p}
        </p>
      </div>
    </div>
  );
};

