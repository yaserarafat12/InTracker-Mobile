import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

interface MathRacingProps {
  onBack: () => void;
}

type GameMode = 'timer' | 'exercise';
type GameState = 'menu' | 'playing' | 'result';

interface Question {
  text: string;
  answer: number;
  options: number[];
}

// === LEVEL SYSTEM ===
function generateQuestion(level: number): Question {
  let a: number, b: number, answer: number, text: string;
  const ops = getOpsForLevel(level);
  const op = ops[Math.floor(Math.random() * ops.length)];

  switch (op) {
    case '+':
      [a, b] = getAddNumbers(level);
      answer = a + b;
      text = `${a} + ${b}`;
      break;
    case '-':
      [a, b] = getSubNumbers(level);
      answer = a - b;
      text = `${a} - ${b}`;
      break;
    case '×':
      [a, b] = getMulNumbers(level);
      answer = a * b;
      text = `${a} × ${b}`;
      break;
    case '÷':
      [b, answer] = getDivNumbers(level);
      a = b * answer;
      text = `${a} ÷ ${b}`;
      break;
    default:
      a = 1; b = 1; answer = 2; text = '1 + 1';
  }

  const options = generateOptions(answer, level);
  return { text, answer, options };
}

function getOpsForLevel(level: number): string[] {
  if (level <= 2) return ['+', '-'];
  if (level <= 3) return ['+', '-', '×'];
  return ['+', '-', '×', '÷'];
}

function getAddNumbers(level: number): [number, number] {
  if (level === 1) return [rand(1, 9), rand(1, 9)];
  if (level === 2) return [rand(10, 50), rand(10, 50)];
  if (level === 3) return [rand(50, 200), rand(50, 200)];
  if (level === 4) return [rand(100, 500), rand(100, 500)];
  return [rand(500, 2000), rand(500, 2000)];
}

function getSubNumbers(level: number): [number, number] {
  if (level === 1) { const b = rand(1, 9); return [rand(b, 18), b]; }
  if (level === 2) { const b = rand(10, 50); return [rand(b + 10, 99), b]; }
  if (level === 3) { const b = rand(50, 200); return [rand(b + 50, 500), b]; }
  if (level === 4) { const b = rand(100, 500); return [rand(b + 100, 999), b]; }
  const b = rand(500, 2000); return [rand(b + 200, 4000), b];
}

function getMulNumbers(level: number): [number, number] {
  if (level <= 2) return [rand(2, 9), rand(2, 9)];
  if (level === 3) return [rand(10, 30), rand(2, 9)];
  if (level === 4) return [rand(20, 99), rand(2, 9)];
  return [rand(50, 200), rand(2, 9)];
}

function getDivNumbers(level: number): [number, number] {
  if (level <= 2) { const ans = rand(2, 9); return [rand(2, 9), ans]; }
  if (level === 3) { const ans = rand(5, 20); return [rand(2, 9), ans]; }
  if (level === 4) { const ans = rand(10, 50); return [rand(2, 9), ans]; }
  const ans = rand(20, 99); return [rand(2, 9), ans];
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateOptions(correct: number, level: number): number[] {
  const opts = new Set<number>([correct]);
  const range = level <= 2 ? 5 : level <= 3 ? 15 : level <= 4 ? 30 : 50;
  while (opts.size < 4) {
    const offset = rand(1, range) * (Math.random() > 0.5 ? 1 : -1);
    const val = correct + offset;
    if (val > 0 && val !== correct) opts.add(val);
  }
  return [...opts].sort(() => Math.random() - 0.5);
}

function getLevelFromScore(score: number): number {
  if (score < 5) return 1;
  if (score < 12) return 2;
  if (score < 22) return 3;
  if (score < 35) return 4;
  return 5;
}

// === COMPONENT ===
export function MathRacing({ onBack }: MathRacingProps) {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [mode, setMode] = useState<GameMode>('timer');
  const [timerDuration, setTimerDuration] = useState(60);
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [question, setQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [comboAnim, setComboAnim] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = useCallback((selectedMode: GameMode, duration?: number) => {
    setMode(selectedMode);
    setScore(0);
    setWrongCount(0);
    setTotalQuestions(0);
    setStreak(0);
    setBestStreak(0);
    setFeedback(null);
    if (selectedMode === 'timer') {
      const dur = duration || timerDuration;
      setTimerDuration(dur);
      setTimeLeft(dur);
    }
    setQuestion(generateQuestion(1));
    setGameState('playing');
  }, [timerDuration]);

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing' && mode === 'timer') {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setGameState('result');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [gameState, mode]);

  const handleAnswer = (selected: number) => {
    if (!question) return;
    const isCorrect = selected === question.answer;
    setTotalQuestions((t) => t + 1);

    if (isCorrect) {
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);
      setFeedback('correct');
      setComboAnim(newStreak);
    } else {
      setWrongCount((w) => w + 1);
      setStreak(0);
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      const level = getLevelFromScore(score + (isCorrect ? 1 : 0));
      setQuestion(generateQuestion(level));
    }, 400);
  };

  const stopExercise = () => {
    setGameState('result');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="fixed inset-0 bg-[#0d0f12] flex flex-col z-[200] overflow-hidden">
      <AnimatePresence mode="wait">
        {gameState === 'menu' && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <MenuView onBack={onBack} onStart={startGame} />
          </motion.div>
        )}
        {gameState === 'playing' && question && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <PlayView
              mode={mode}
              question={question}
              score={score}
              wrongCount={wrongCount}
              streak={streak}
              timeLeft={timeLeft}
              feedback={feedback}
              comboAnim={comboAnim}
              onAnswer={handleAnswer}
              onStop={stopExercise}
              onBack={onBack}
            />
          </motion.div>
        )}
        {gameState === 'result' && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
            <ResultView score={score} wrongCount={wrongCount} totalQuestions={totalQuestions} bestStreak={bestStreak} mode={mode} onRestart={() => startGame(mode)} onBack={onBack} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// === MENU VIEW ===
function MenuView({ onBack, onStart }: { onBack: () => void; onStart: (mode: GameMode, duration?: number) => void }) {
  const [selectedMode, setSelectedMode] = useState<GameMode>('timer');
  const timerOptions = [60, 120, 180, 240, 300, 360];

  return (
    <div className="h-full flex flex-col px-6 pt-14 pb-8">
      {/* Back */}
      <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}
        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-10"
      >
        <Icon icon="ph:arrow-left-bold" className="text-white" width={18} />
      </motion.button>

      {/* Title — centered */}
      <div className="text-center mb-10">
        <h1 className="text-[36px] font-black text-white font-['Outfit']">Mathican</h1>
        <p className="text-[14px] text-white/40 mt-2">Latih otak, pecahkan soal secepat mungkin</p>
      </div>

      {/* Mode selection — neobrutalist */}
      <div className="flex gap-3 mb-10">
        <motion.button
          whileTap={{ scale: 0.95, y: 2, x: 2, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
          onClick={() => setSelectedMode('timer')}
          className={`flex-1 py-5 rounded-xl text-[15px] font-black border-[2px] transition-all ${
            selectedMode === 'timer'
              ? 'bg-[#00FF85] text-black border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]'
              : 'bg-white/5 text-white/50 border-white/10'
          }`}
        >
          ⏱️ Timer
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95, y: 2, x: 2, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
          onClick={() => setSelectedMode('exercise')}
          className={`flex-1 py-5 rounded-xl text-[15px] font-black border-[2px] transition-all ${
            selectedMode === 'exercise'
              ? 'bg-[#00FF85] text-black border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]'
              : 'bg-white/5 text-white/50 border-white/10'
          }`}
        >
          🔥 Exercise
        </motion.button>
      </div>

      {/* Timer options — grid */}
      {selectedMode === 'timer' && (
        <div className="flex-1">
          <p className="text-[11px] text-white/30 mb-4 uppercase tracking-[0.15em] font-bold">Pilih Durasi</p>
          <div className="grid grid-cols-3 gap-3">
            {timerOptions.map((sec) => (
              <motion.button
                key={sec}
                whileTap={{ scale: 0.93, y: 2, x: 2, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
                onClick={() => onStart('timer', sec)}
                className="py-4 bg-white/5 border-[2px] border-white/10 rounded-xl text-[14px] font-bold text-white shadow-[3px_3px_0px_rgba(0,0,0,0.6)]"
              >
                {sec / 60} min
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Exercise start */}
      {selectedMode === 'exercise' && (
        <div className="flex-1 flex flex-col">
          <p className="text-[13px] text-white/40 mb-6 text-center">Jawab sebanyak mungkin. Streak = motivasi.</p>
          <motion.button
            whileTap={{ scale: 0.95, y: 3, x: 3, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
            onClick={() => onStart('exercise')}
            className="w-full py-5 bg-[#00FF85] text-black font-black rounded-xl text-[16px] border-[2px] border-black shadow-[5px_5px_0px_rgba(0,0,0,1)]"
          >
            Mulai
          </motion.button>
        </div>
      )}
    </div>
  );
}

// === PLAY VIEW ===
function PlayView({ mode, question, score, wrongCount, streak, timeLeft, feedback, comboAnim, onAnswer, onStop, onBack }: {
  mode: GameMode;
  question: Question;
  score: number;
  wrongCount: number;
  streak: number;
  timeLeft: number;
  feedback: 'correct' | 'wrong' | null;
  comboAnim: number;
  onAnswer: (n: number) => void;
  onStop: () => void;
  onBack: () => void;
}) {
  const level = getLevelFromScore(score);
  const wrong = score > 0 ? Math.max(0, comboAnim - streak) : 0;

  return (
    <div className="h-full flex flex-col px-6 pt-8 pb-8 relative overflow-hidden">
      {/* Background image */}
      <img src="/all_images/features_bg/mathican_bg.png" alt="" className="absolute inset-0 w-full h-full object-cover z-0 opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117]/90 via-[#0d0f12]/95 to-[#0a0c0f] z-[1]" />

      {/* Content above bg */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Top bar — score */}
        <div className="flex items-center justify-between mb-2">

          {/* Correct + Wrong */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#00FF85]/10 border-[2px] border-[#00FF85]/30 rounded-xl">
              <span className="text-[18px] font-black text-[#00FF85]">✓ {score}</span>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500/10 border-[2px] border-red-500/30 rounded-xl">
              <span className="text-[18px] font-black text-red-400">✗ {wrongCount}</span>
            </div>
          </div>

          {/* Timer */}
          {mode === 'timer' && (
            <div className="px-3 py-2 bg-white/5 border-[2px] border-white/10 rounded-xl">
              <span className="text-[14px] font-bold text-white tabular-nums">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
          )}
        </div>

        {/* Streak — below score bar */}
        {streak > 1 && (
          <motion.div
            key={comboAnim}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center mt-2 mb-4"
          >
            <span className={`text-[22px] font-black ${
              streak >= 10 ? 'text-red-400' : streak >= 5 ? 'text-amber-400' : 'text-[#00FF85]'
            }`}>
              🔥 {streak} STREAK!
            </span>
          </motion.div>
        )}

        {/* Question — centered, big */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Feedback — above question */}
          <div className="h-16 flex items-center justify-center -mt-16">
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="text-[72px] font-black"
                >
                  {feedback === 'correct' ? <span className="text-[#00FF85]">✓</span> : <span className="text-red-400">✗</span>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={question.text}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="text-center mb-10"
            >
              <p className="text-[48px] font-black text-white font-['Outfit'] tabular-nums">
                {question.text}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Options — 2x2 grid, neobrutalist */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-[300px]">
            {question.options.map((opt) => (
              <motion.button
                key={`${question.text}-${opt}`}
                whileTap={{ scale: 0.9, y: 2, x: 2, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
                onClick={() => onAnswer(opt)}
                className="py-5 rounded-xl text-[20px] font-black text-white bg-white/5 border-[2px] border-white/15 shadow-[4px_4px_0px_rgba(0,0,0,1)]"
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Stop button — bottom, amber neobrutalist (both modes) */}
        <motion.button
          whileTap={{ scale: 0.95, y: 2, x: 2, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
          onClick={onStop}
          className="w-full py-4 mt-4 bg-amber-500/20 border-[2px] border-amber-500 rounded-xl text-[14px] font-black text-amber-400 shadow-[3px_3px_0px_rgba(0,0,0,1)]"
        >
          Berhenti
        </motion.button>
      </div>

    </div>
  );
}

// === RESULT VIEW ===
function ResultView({ score, wrongCount, totalQuestions, bestStreak, mode, onRestart, onBack }: {
  score: number; wrongCount: number; totalQuestions: number; bestStreak: number; mode: GameMode; onRestart: () => void; onBack: () => void;
}) {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="h-full flex flex-col px-8 pt-10 pb-10 relative overflow-hidden">
      {/* Background */}
      <img src="/all_images/features_bg/mathican_bg.png" alt="" className="absolute inset-0 w-full h-full object-cover z-0 opacity-30" />
      <div className="absolute inset-0 bg-black/50 z-[1]" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        {/* Akurasi label */}
        <p className="text-[14px] text-white/50 mb-2">Akurasi</p>

        {/* Big percentage */}
        <p className="text-[64px] font-black text-white font-['Outfit'] leading-none">{percentage}%</p>

        {/* Sub text */}
        <p className="text-[14px] text-white/40 mt-3">{score} benar dari {totalQuestions} soal</p>

        {/* Score cards — 3 in a row, compact */}
        <div className="flex items-center justify-center gap-8 mt-8">
          <div className="flex items-center gap-2">
            <span className="text-[22px] text-[#00FF85]">✓</span>
            <span className="text-[22px] font-black text-white">{score}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[22px] text-red-400">✗</span>
            <span className="text-[22px] font-black text-white">{wrongCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[22px]">🔥</span>
            <span className="text-[22px] font-black text-white">{bestStreak}</span>
          </div>
        </div>
      </div>

      {/* Buttons — bottom */}
      <div className="relative z-10 space-y-3">
        <motion.button
          whileTap={{ scale: 0.95, y: 3, x: 3, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
          onClick={onRestart}
          className="w-full py-5 bg-[#00FF85] text-black font-black rounded-xl text-[16px] border-[2px] border-black shadow-[5px_5px_0px_rgba(0,0,0,1)]"
        >
          Main Lagi
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="w-full py-4 bg-white/5 border-[2px] border-white/10 text-white/50 font-bold rounded-xl text-[14px]"
        >
          Kembali
        </motion.button>
      </div>
    </div>
  );
}
