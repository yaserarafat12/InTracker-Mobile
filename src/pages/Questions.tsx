import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { supabase } from '../lib/supabase';

const CUBIC_BEZIER = "easeOut" as const;

// --- COMPONENT: CINEMATIC BUTTON ---
const CinematicButton = ({ onClick, children, className = "" }: { onClick: () => void, children: React.ReactNode, className?: string }) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98, x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
      className={`group relative overflow-hidden rounded-xl bg-[#00FF85] py-3 px-8 border-[2px] border-black shadow-[5px_5px_0px_rgba(0,0,0,1)] transition-all ${className}`}
    >
      <div className="absolute inset-0 bg-[#0F1110]/10 group-hover:bg-transparent transition-colors" />
      <span className="relative z-10 font-['Outfit'] text-[15px] font-black tracking-[0.15em] uppercase text-[#050A07]">
        {children}
      </span>
    </motion.button>
  );
};

// Data & Questions
const COUNTRIES = ["Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Norway", "Oman", "Pakistan", "Palau", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Samoa", "San Marino", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"];
const STEPS = [
  { id: 1, question: "Di mana Anda tinggal saat ini?", options: ["Indonesia", "Luar Negeri"], type: "single", layout: "grid-2" },
  { id: 2, question: "Apa jenis kelamin Anda?", options: ["Laki-laki", "Perempuan", "Lainnya"], type: "single", layout: "grid-2" },
  { id: 3, question: "Berapa umur Anda sekarang?", options: ["13 - 17", "18 - 24", "25 - 34", "35 - 44", "45 - 54", "55 atau lebih"], type: "single", layout: "grid-2" },
  { id: 4, question: "Apa status Anda sekarang?", options: ["Pelajar", "Mahasiswa", "Karyawan", "Wirausaha", "Freelance", "Tidak Bekerja", "Lainnya"], type: "single", layout: "grid-2" },
  { id: 5, question: "Bagaimana Anda mendeskripsikan hidup Anda saat ini?", options: ["Sangat Puas & Bahagia", "Biasa Saja", "Ingin Melakukan Perubahan", "Sedang di Titik Terendah"], type: "single" },
  { id: 6, question: "Apa yang ingin Anda prioritaskan?", instruction: "(Pilih maks. 3)", options: ["Manajemen Keuangan", "Disiplin & Kebiasaan", "Karir & Produktivitas", "Kesehatan Fisik", "Pendidikan / Skill Baru"], type: "multi", max: 3 },
  { id: 7, question: "Apa tantangan terbesar Anda saat ini?", instruction: "(Pilih maks. 3)", options: ["Sering Menunda", "Kurang Motivasi", "Bingung Mulai dari Mana", "Masalah Biaya / Modal", "Lingkungan Tidak Mendukung"], type: "multi", max: 3 },
  { id: 8, question: "Dari mana Anda tahu tentang InTracker?", options: ["TikTok", "Instagram / Facebook", "Iklan Digital", "Rekomendasi Teman", "Lainnya"], type: "single" },
];

export default function Questions() {
  const { step } = useParams();
  const navigate = useNavigate();
  
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [allAnswers, setAllAnswers] = useState<Record<number, string[]>>({});
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentStep = step === undefined ? 0 : parseInt(step);
  const currentQuestion = STEPS.find(s => s.id === currentStep);

  // Sync selectedOptions with allAnswers when step changes
  useEffect(() => {
    setSelectedOptions(allAnswers[currentStep] || []);
    setShowCountryPicker(false);
    setSearchQuery("");
    setIsTransitioning(false);
  }, [currentStep, allAnswers]);

  if (step === undefined) {
    return <Navigate to="/questions/0" replace />;
  }

  const handleNext = async () => {
    const updatedAnswers = { ...allAnswers, [currentStep]: selectedOptions };
    setAllAnswers(updatedAnswers);

    if (currentStep < STEPS.length) {
      navigate(`/questions/${currentStep + 1}`);
    } else {
      // Final Step Survey: Save to Supabase and then go to Intro
      setIsSaving(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').update({
            onboarding_data: updatedAnswers,
            updated_at: new Date().toISOString()
          }).eq('id', user.id);
        }
        navigate('/notif');
      } catch (error) {
        console.error("Error saving survey:", error);
        navigate('/notif');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (showCountryPicker) setShowCountryPicker(false);
    else if (currentStep > 1) navigate(`/questions/${currentStep - 1}`);
    else navigate('/questions/0');
  };

  const toggleOption = (option: string) => {
    if (isTransitioning) return;
    if (currentStep === 1 && option === "Luar Negeri") {
      setShowCountryPicker(true);
      return;
    }
    if (currentQuestion?.type === "single") {
      setSelectedOptions([option]);
      setIsTransitioning(true);
      setTimeout(() => handleNext(), 450);
    } else {
      setSelectedOptions(prev => {
        if (prev.includes(option)) return prev.filter(i => i !== option);
        if (currentQuestion?.max && prev.length >= currentQuestion.max) return prev;
        return [...prev, option];
      });
    }
  };



  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4, ease: CUBIC_BEZIER } },
    exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" as const } }
  };

  // --- COUNTRY PICKER ---
  if (showCountryPicker) {
    const filteredCountries = COUNTRIES.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return (
      <div className="min-h-screen bg-[#212121] text-white font-['Inter'] relative flex flex-col items-center overflow-hidden">
        <div className="relative z-20 w-full px-6 pt-12 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full border border-white/10 active:scale-90 transition-transform"><Icon icon="solar:alt-arrow-left-bold" width={20} height={20} /></button>
            <h2 className="font-['Outfit'] text-[20px] font-bold">Pilih Negara</h2>
          </div>
          <div className="relative">
            <Icon icon="solar:magnifer-bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" width={18} height={18} />
            <input type="text" placeholder="Cari negara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-[15px] focus:outline-none focus:border-[#00FF85]/40 transition-colors" />
          </div>
        </div>
        <div className="relative z-10 flex-1 w-full overflow-y-auto px-6 py-4 mt-2 custom-scrollbar">
          <div className="flex flex-col gap-2 pb-10">
            {filteredCountries.map((country, idx) => (
              <button 
                key={idx} 
                onClick={() => { setSelectedOptions([country]); setIsTransitioning(true); setTimeout(() => handleNext(), 450); }} 
                className="w-full py-4 px-4 bg-[#1A1A1A] border border-[#E3DAC9]/20 rounded-xl text-left hover:border-[#00FF85]/40 active:bg-[#00FF85]/10 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              >
                <span className="text-white/80 font-bold font-['Outfit'] tracking-wide">{country}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- STEP 0: INTRO ---
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-[#212121] text-white font-['Inter'] relative flex flex-col items-center overflow-hidden select-none">
        <div className="absolute inset-0 z-0">
          <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src="/all_images/antigravitybg/3.jpg" className="w-full h-full object-cover object-center -translate-y-[3vh]" style={{ filter: 'contrast(1.2) brightness(0.85) saturate(1.1) hue-rotate(15deg)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#212121]/60" />
        </div>
        <div className="relative z-10 flex-1 w-full max-w-[400px] px-6 flex flex-col items-center justify-end pb-[calc(env(safe-area-inset-bottom,20px)+8vh)]">
          <CinematicButton onClick={() => navigate('/questions/1')} className="w-full">Mulai sekarang</CinematicButton>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-[#212121] text-white font-['Inter'] relative flex flex-col items-center overflow-hidden select-none">
      
      <div className="relative z-20 w-full px-6 pt-12 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full border border-white/10 active:scale-90 transition-transform">
            <Icon icon="solar:alt-arrow-left-bold" width={20} height={20} />
          </button>
          <div className="text-[12px] font-bold text-[#00FF85] tracking-widest font-['Outfit'] bg-[#00FF85]/10 px-3 py-1 rounded-full border border-[#00FF85]/20">
            {currentStep} / {STEPS.length}
          </div>
        </div>
        <div className="relative w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${(currentStep / STEPS.length) * 100}%` }} 
            transition={{ duration: 0.8, ease: CUBIC_BEZIER }} 
            className="relative h-full bg-[#00FF85]"
          >
            <div className="absolute right-0 top-0 h-full w-2 bg-white/30 rounded-full" />
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-6 flex flex-col flex-1 pt-24 overflow-hidden">
        
        {/* HEADING SECTION (FIXED HEIGHT FOR CONSISTENCY) */}
        <div className="h-28 flex flex-col justify-center mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-2 text-center"
            >
              <h2 className="text-[19px] font-bold font-['Outfit'] leading-tight tracking-normal px-4">
                {currentQuestion?.question}
              </h2>
              {currentQuestion?.instruction && (
                <p className="font-['Inter'] text-[12px] font-medium text-[#A0A0A0] tracking-wide italic opacity-80">
                  {currentQuestion.instruction}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* OPTIONS SECTION (SCROLLABLE AREA) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 pb-28">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col gap-3 pb-8"
          >
            {currentQuestion?.options?.map((option, idx) => {
              const isSelected = selectedOptions.includes(option);
              return (
                <motion.button 
                  key={idx} 
                  variants={itemVariants} 
                  whileTap={{ scale: 0.98, x: 2, y: 2, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }} 
                  onClick={() => toggleOption(option)} 
                  className={`relative py-4 px-6 rounded-xl text-left transition-all duration-300 border backdrop-blur-md shadow-[5px_5px_0px_rgba(0,0,0,1)] ${
                    isSelected 
                    ? 'bg-[#00FF85]/10 border-[#00FF85]' 
                    : 'bg-[#1A1A1A] border-[#E3DAC9]/20 hover:border-[#E3DAC9]/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[15px] font-bold transition-colors ${isSelected ? 'text-[#00FF85]' : 'text-white/60'}`}>
                      {option}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                      isSelected ? 'bg-[#00FF85] border-[#00FF85]' : 'bg-transparent border-white/20'
                    }`}>
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div 
                            initial={{ scale: 0, rotate: -45 }} 
                            animate={{ scale: 1.2, rotate: 0 }} 
                            transition={{ type: "spring", stiffness: 600, damping: 20 }}
                          >
                            <Icon icon="solar:check-read-bold" width={10} height={10} className="text-black font-bold" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* CONTINUE BUTTON (TRULY MENTOK AT BOTTOM) */}
        <div className="absolute bottom-0 left-0 w-full px-6 pb-6 bg-gradient-to-t from-[#212121] via-[#212121]/90 to-transparent pt-12 pointer-events-none">
          <div className="h-14 pointer-events-auto">
            {((currentQuestion?.type === "multi") || (currentQuestion?.type === "single" && selectedOptions.length > 0 && !isTransitioning)) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CinematicButton onClick={handleNext} className="w-full">
                  {isSaving ? "Menyimpan..." : "Lanjutkan"}
                </CinematicButton>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
