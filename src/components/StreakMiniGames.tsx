import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

interface MiniGameProps {
  onWin: () => void;
  onBack: () => void;
}

// ============================================
// GAME 1: MATH MATCH
// Jawab 3 soal matematika sederhana berturut-turut
// ============================================
export const MathMatchGame: React.FC<MiniGameProps> = ({ onWin, onBack }) => {
  const [score, setScore] = useState(0);
  const [question, setQuestion] = useState({ text: '', answer: 0 });
  const [options, setOptions] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const targetScore = 3;

  const generateQuestion = () => {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a: number, b: number, answer: number;

    switch (op) {
      case '+':
        a = Math.floor(Math.random() * 50) + 10;
        b = Math.floor(Math.random() * 50) + 10;
        answer = a + b;
        break;
      case '-':
        a = Math.floor(Math.random() * 50) + 30;
        b = Math.floor(Math.random() * 30) + 5;
        answer = a - b;
        break;
      case '×':
        a = Math.floor(Math.random() * 12) + 2;
        b = Math.floor(Math.random() * 12) + 2;
        answer = a * b;
        break;
      default:
        a = 1; b = 1; answer = 2;
    }

    const text = `${a} ${op} ${b}`;
    
    // Generate 3 wrong options
    const wrongOptions = new Set<number>();
    while (wrongOptions.size < 3) {
      const offset = Math.floor(Math.random() * 20) - 10;
      const wrong = answer + offset;
      if (wrong !== answer && wrong > 0) wrongOptions.add(wrong);
    }

    const allOptions = [...wrongOptions, answer].sort(() => Math.random() - 0.5);
    
    setQuestion({ text, answer });
    setOptions(allOptions);
    setFeedback(null);
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  const handleAnswer = (selected: number) => {
    if (feedback || gameOver) return;
    
    if (selected === question.answer) {
      setFeedback('correct');
      const newScore = score + 1;
      setScore(newScore);
      if (navigator.vibrate) navigator.vibrate(10);
      
      if (newScore >= targetScore) {
        setTimeout(() => onWin(), 600);
      } else {
        setTimeout(() => generateQuestion(), 500);
      }
    } else {
      setFeedback('wrong');
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      setTimeout(() => generateQuestion(), 800);
    }
  };

  if (gameOver) {
    return (
      <div className="flex flex-col items-center text-center py-6">
        <Icon icon="solar:clock-circle-bold" className="text-[#FF4D00] mb-4" width={40} />
        <h3 className="text-[18px] font-black font-['Outfit'] text-white mb-2">Waktu Habis!</h3>
        <p className="text-[12px] font-medium font-['Outfit'] text-[#E3DAC9]/40 mb-6">
          Skor: {score}/{targetScore}
        </p>
        <div className="flex gap-3 w-full">
          <button onClick={onBack} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-[12px] text-[11px] font-bold font-['Outfit'] text-[#E3DAC9]/60 uppercase tracking-wider">
            Kembali
          </button>
          <button onClick={() => { setScore(0); setTimeLeft(30); setGameOver(false); generateQuestion(); }} className="flex-1 py-3 bg-[#00CC6A] rounded-[12px] text-[11px] font-black font-['Outfit'] text-black uppercase tracking-wider">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className="flex items-center justify-between w-full mb-3">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center text-[#E3DAC9]/40 hover:text-white transition-colors">
          <Icon icon="solar:alt-arrow-left-bold" width={20} />
        </button>
        <span className={`text-[12px] font-black font-['Outfit'] ${timeLeft <= 10 ? 'text-[#FF4D00]' : 'text-[#E3DAC9]/60'}`}>{timeLeft}s</span>
      </div>

      {/* Question */}
      <div className={`w-full py-10 rounded-[20px] border text-center mb-4 transition-colors ${
        feedback === 'correct' ? 'bg-[#00CC6A]/10 border-[#00CC6A]/30' :
        feedback === 'wrong' ? 'bg-[#FF4D00]/10 border-[#FF4D00]/30' :
        'bg-white/[0.03] border-[#E3DAC9]/10'
      }`}>
        <span className="text-[36px] font-black font-['Outfit'] text-white tracking-tight">
          {question.text} = ?
        </span>
      </div>

      {/* Progress dots - between question and options */}
      <div className="flex items-center gap-2.5 mb-4">
        {Array.from({ length: targetScore }).map((_, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i < score ? 'bg-[#00CC6A] shadow-[0_0_8px_rgba(0,204,106,0.5)]' : 'bg-white/10'}`} />
        ))}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {options.map((opt, idx) => (
          <motion.button
            key={`${question.text}-${idx}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAnswer(opt)}
            className="aspect-[2/1] bg-white/[0.04] border border-[#E3DAC9]/15 rounded-[16px] text-[20px] font-black font-['Outfit'] text-white hover:bg-white/[0.08] transition-colors active:bg-[#00CC6A]/20 flex items-center justify-center"
          >
            {opt}
          </motion.button>
        ))}
      </div>
    </div>
  );
};


// ============================================
// GAME 2: TYPE RACE
// Ketik ulang kata dengan benar sebelum waktu habis
// ============================================
const phrases = [
  "Konsisten adalah kunci",
  "Satu langkah setiap hari",
  "Jangan menyerah sekarang",
  "Progres bukan perfeksi",
  "Hari ini lebih baik",
  "Bangun kebiasaan kuat",
  "Fokus pada proses",
  "Kecil tapi konsisten",
  "Mulai dari sekarang",
  "Disiplin mengalahkan motivasi",
];

export const TypeRaceGame: React.FC<MiniGameProps> = ({ onWin, onBack }) => {
  const [phrase, setPhrase] = useState('');
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [roundKey, setRoundKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const targetScore = 2;

  const newPhrase = () => {
    const p = phrases[Math.floor(Math.random() * phrases.length)];
    setPhrase(p);
    setInput('');
    setRoundKey(k => k + 1);
  };

  useEffect(() => {
    newPhrase();
  }, []);

  // Focus input whenever roundKey changes (new round)
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [roundKey]);

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  const handleInput = (value: string) => {
    if (gameOver) return;
    setInput(value);
    
    if (value === phrase) {
      if (navigator.vibrate) navigator.vibrate(10);
      const newScore = score + 1;
      setScore(newScore);
      
      if (newScore >= targetScore) {
        setTimeout(() => onWin(), 400);
      } else {
        // Next round with slight delay
        setTimeout(() => newPhrase(), 300);
      }
    }
  };

  // Character-by-character coloring
  const renderPhrase = () => {
    return phrase.split('').map((char, i) => {
      let color = 'text-[#E3DAC9]/40';
      if (i < input.length) {
        color = input[i] === char ? 'text-[#00CC6A]' : 'text-[#FF4D00]';
      }
      return <span key={i} className={`${color} transition-colors`}>{char}</span>;
    });
  };

  if (gameOver) {
    return (
      <div className="flex flex-col items-center text-center py-6">
        <Icon icon="solar:clock-circle-bold" className="text-[#FF4D00] mb-4" width={40} />
        <h3 className="text-[18px] font-black font-['Outfit'] text-white mb-2">Waktu Habis!</h3>
        <p className="text-[12px] font-medium font-['Outfit'] text-[#E3DAC9]/40 mb-6">
          Skor: {score}/{targetScore}
        </p>
        <div className="flex gap-3 w-full">
          <button onClick={onBack} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-[12px] text-[11px] font-bold font-['Outfit'] text-[#E3DAC9]/60 uppercase tracking-wider">
            Kembali
          </button>
          <button onClick={() => { setScore(0); setTimeLeft(30); setGameOver(false); newPhrase(); }} className="flex-1 py-3 bg-[#00CC6A] rounded-[12px] text-[11px] font-black font-['Outfit'] text-black uppercase tracking-wider">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Header - same as MathMatch */}
      <div className="flex items-center justify-between w-full mb-3">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center text-[#E3DAC9]/40 hover:text-white transition-colors">
          <Icon icon="solar:alt-arrow-left-bold" width={20} />
        </button>
        <span className={`text-[12px] font-black font-['Outfit'] ${timeLeft <= 5 ? 'text-[#FF4D00]' : 'text-[#E3DAC9]/60'}`}>{timeLeft}s</span>
      </div>

      {/* Phrase Display - same shape as question box */}
      <div className="w-full py-8 px-5 bg-white/[0.03] border border-[#E3DAC9]/10 rounded-[20px] text-center mb-4">
        <p className="text-[18px] font-bold font-['Outfit'] leading-relaxed tracking-tight">
          {renderPhrase()}
        </p>
      </div>

      {/* Progress dots - between phrase and input */}
      <div className="flex items-center gap-2.5 mb-4">
        {Array.from({ length: targetScore }).map((_, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i < score ? 'bg-[#00CC6A] shadow-[0_0_8px_rgba(0,204,106,0.5)]' : 'bg-white/10'}`} />
        ))}
      </div>

      {/* Input */}
      <input
        key={roundKey}
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => handleInput(e.target.value)}
        placeholder="Ketik di sini..."
        className="w-full py-4 px-5 bg-black/40 border border-[#E3DAC9]/15 rounded-[16px] text-[16px] font-bold font-['Outfit'] text-white placeholder:text-white/20 focus:outline-none focus:border-[#00CC6A]/50 transition-colors text-center"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
    </div>
  );
};
