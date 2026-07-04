import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useTranslation } from '../../i18n';

interface MathRacingProps {
  onBack: () => void;
}

type GameMode = 'timer' | 'exercise';
type GameState = 'menu' | 'playing' | 'gameover';

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
      answer = 2; text = '1 + 1';
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
  const isLight = !document.documentElement.classList.contains('dark');
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
            setGameState('gameover');
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
    setGameState('gameover');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className={`fixed inset-0 flex flex-col z-[200] overflow-hidden transition-all ${
      isLight ? 'bg-[#f0fdf4] text-black' : 'bg-[#16181c] text-white'
    }`}>
      {/* Background image for light mode across all states */}
      {isLight && (
        <>
          <img
            src="/all_images/antigravitybg/math_bg.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
          <div className="absolute inset-0 bg-white/10 z-[1] pointer-events-none" />
        </>
      )}

      <AnimatePresence mode="wait">
        {gameState === 'menu' && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full relative z-10">
            <MenuView onBack={onBack} onStart={startGame} isLight={isLight} />
          </motion.div>
        )}
        {gameState === 'playing' && question && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full relative z-10">
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
              isLight={isLight}
            />
          </motion.div>
        )}
        {gameState === 'gameover' && (
          <motion.div key="gameover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full relative z-10">
            <ResultView score={score} wrongCount={wrongCount} totalQuestions={totalQuestions} bestStreak={bestStreak} onRestart={() => startGame(mode)} onBack={onBack} isLight={isLight} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// === MENU VIEW ===
function MenuView({ onBack, onStart, isLight }: { onBack: () => void; onStart: (mode: GameMode, duration?: number) => void; isLight: boolean }) {
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState<GameMode>('timer');
  const timerOptions = [60, 120, 180, 240, 300, 360];

  return (
    <div className="h-full flex flex-col px-6 pt-14 pb-8 relative z-10">
      {/* Back */}
      <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}
        className={`w-10 h-10 rounded-xl border-[2px] flex items-center justify-center mb-10 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
          isLight
            ? 'border-black bg-white shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
            : 'border-white/10 bg-[#2a2c32] shadow-none'
        }`}
      >
        <Icon icon="ph:arrow-left-bold" className={isLight ? 'text-black' : 'text-white'} width={18} />
      </motion.button>

      {/* Title — centered */}
      <div className="text-center mb-10">
        <h1 className={`text-[36px] font-black font-['Outfit'] ${isLight ? 'text-black' : 'text-white'}`}>{t('mathRacing.title')}</h1>
        <p className={`text-[14px] mt-2 font-bold ${isLight ? 'text-black/50' : 'text-white/40'}`}>{t('mathRacing.subtitle')}</p>
      </div>

      {/* Mode selection — neobrutalist */}
      <div className="flex gap-3 mb-10">
        <motion.button
          whileTap={{ scale: 0.95, y: 2, x: 2, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
          onClick={() => setSelectedMode('timer')}
          className={`flex-1 py-5 rounded-xl text-[13px] font-black border-[2px] transition-all uppercase tracking-wide ${
            selectedMode === 'timer'
              ? 'bg-[#10B981] text-black border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]'
              : isLight
                ? 'bg-white text-black/60 border-black/25 hover:border-black/50 shadow-[3px_3px_0px_rgba(0,0,0,0.15)]'
                : 'bg-white/5 text-white/50 border-white/10'
          }`}
        >
          ⏱️ {t('mathRacing.timerMode')}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95, y: 2, x: 2, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
          onClick={() => setSelectedMode('exercise')}
          className={`flex-1 py-5 rounded-xl text-[13px] font-black border-[2px] transition-all uppercase tracking-wide ${
            selectedMode === 'exercise'
              ? 'bg-[#10B981] text-black border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]'
              : isLight
                ? 'bg-white text-black/60 border-black/25 hover:border-black/50 shadow-[3px_3px_0px_rgba(0,0,0,0.15)]'
                : 'bg-white/5 text-white/50 border-white/10'
          }`}
        >
          🔥 {t('mathRacing.exerciseMode')}
        </motion.button>
      </div>

      {/* Timer options — grid */}
      {selectedMode === 'timer' && (
        <div className="flex-1">
          <p className={`text-[11px] mb-4 uppercase tracking-[0.15em] font-black ${isLight ? 'text-black/50' : 'text-white/30'}`}>{t('mathRacing.chooseDuration')}</p>
          <div className="grid grid-cols-3 gap-3">
            {timerOptions.map((sec) => (
              <motion.button
                key={sec}
                whileTap={{ scale: 0.93 }}
                onClick={() => onStart('timer', sec)}
                className={`py-4 border-[2px] rounded-xl text-[12px] font-black uppercase tracking-wider font-['Outfit'] transition-all ${
                  isLight
                    ? 'bg-white text-black border-black shadow-[3px_3px_0px_rgba(0,0,0,0.65)]'
                    : 'bg-[#2a2c32] text-white border-white/10 shadow-none'
                }`}
              >
                {sec / 60} {t('units.Menit')}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Exercise start */}
      {selectedMode === 'exercise' && (
        <div className="flex-1 flex flex-col">
          <p className={`text-[13px] mb-6 text-center font-bold ${isLight ? 'text-black/60' : 'text-white/40'}`}>{t('mathRacing.exerciseDesc')}</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onStart('exercise')}
            className={`w-full py-5 bg-[#00FF85] text-black font-black rounded-xl text-[16px] border-[2px] transition-all ${
              isLight
                ? 'border-black shadow-[5px_5px_0px_rgba(0,0,0,1)]'
                : 'border-transparent shadow-none'
            }`}
          >
            {t('mathRacing.start')}
          </motion.button>
        </div>
      )}
    </div>
  );
}

function PlayView({ mode, question, score, wrongCount, streak, timeLeft, feedback, comboAnim, onAnswer, onStop, isLight }: {
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
  isLight: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col px-6 pt-8 pb-8 relative overflow-hidden">
      {/* Background image for dark mode */}
      {!isLight && (
        <>
          <img
            src="/all_images/features_bg/mathican_bg.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-20"
          />
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#0d1117]/90 via-[#0d0f12]/95 to-[#0a0c0f]" />
        </>
      )}

      {/* Content above bg */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Top bar — score */}
        <div className="flex items-center justify-between mb-2">
          {/* Correct + Wrong */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-4 py-2 border-[2px] rounded-xl ${
              isLight ? 'bg-white border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' : 'bg-white/5 border-white/10'
            }`}>
              <Icon icon="solar:check-circle-bold" className="text-[#00FF85]" width={18} />
              <span className={`text-[14px] font-black ${isLight ? 'text-black' : 'text-white'}`}>{score}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-4 py-2 border-[2px] rounded-xl ${
              isLight ? 'bg-white border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' : 'bg-white/5 border-white/10'
            }`}>
              <Icon icon="solar:close-circle-bold" className="text-red-400" width={18} />
              <span className={`text-[14px] font-black ${isLight ? 'text-black' : 'text-white'}`}>{wrongCount}</span>
            </div>
          </div>

          {/* Timer */}
          {mode === 'timer' && (
            <div className={`flex items-center gap-1.5 px-4 py-2 border-[2px] rounded-xl ${
              isLight ? 'bg-white border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' : 'bg-white/5 border-white/10'
            }`}>
              <Icon icon="solar:clock-circle-bold" className="text-amber-400" width={18} />
              <span className={`text-[14px] font-black tabular-nums ${isLight ? 'text-black' : 'text-white'}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Streak — Fixed height to prevent layout shift */}
        <div className="h-14 flex items-center justify-center mb-2">
          <AnimatePresence mode="wait">
            {streak > 1 ? (
              <motion.div
                key={comboAnim}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center"
              >
                <span className="text-[13px] font-black border-[2px] border-black px-4 py-2 bg-amber-400 text-black rounded-xl shadow-[3px_3px_0px_rgba(0,0,0,1)] whitespace-nowrap">
                  🔥 {streak} STREAK!
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Question — centered inside a neobrutalist card */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Feedback */}
          <div className="h-16 flex items-center justify-center -mt-10 mb-4">
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="text-[64px] font-black leading-none"
                >
                  {feedback === 'correct' ? (
                    <span className="text-[#00FF85] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">✓</span>
                  ) : (
                    <span className="text-red-500 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">✗</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={`w-full max-w-[320px] py-12 px-6 rounded-2xl border-[2px] text-center mb-8 transition-all ${
            isLight
              ? 'bg-white border-black shadow-[6px_6px_0px_rgba(0,0,0,0.85)]'
              : 'bg-[#1c1e22]/90 border-white/10 shadow-none'
          }`}>
            <AnimatePresence mode="wait">
              <motion.p
                key={question.text}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className={`text-[52px] font-black font-['Outfit'] tabular-nums tracking-tight leading-none ${
                  isLight ? 'text-black' : 'text-white'
                }`}
              >
                {question.text}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Options — 2x2 grid, neobrutalist */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-[320px]">
            {question.options.map((opt) => (
              <motion.button
                key={`${question.text}-${opt}`}
                whileTap={{ scale: 0.93 }}
                onClick={() => onAnswer(opt)}
                className={`py-5 rounded-xl text-[22px] font-black border-[2px] transition-all ${
                  isLight
                    ? 'bg-white text-black border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                    : 'bg-[#2a2c32] border-white/10 text-white shadow-none'
                }`}
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Stop button — bottom */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onStop}
          className={`w-full py-4 mt-6 border-[2px] rounded-xl text-[14px] font-black transition-all ${
            isLight
              ? 'bg-amber-400 text-black border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]'
              : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
          }`}
        >
          {t('mathRacing.stop')}
        </motion.button>
      </div>
    </div>
  );
}

function ResultView({ score, wrongCount, totalQuestions, bestStreak, onRestart, onBack, isLight }: {
  score: number; wrongCount: number; totalQuestions: number; bestStreak: number; onRestart: () => void; onBack: () => void; isLight: boolean;
}) {
  const { t } = useTranslation();
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="h-full flex flex-col px-6 pt-10 pb-10 relative overflow-hidden">
      {/* Background for dark mode */}
      {!isLight && (
        <>
          <img
            src="/all_images/features_bg/mathican_bg.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-30"
          />
          <div className="absolute inset-0 z-[1] bg-black/50" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        {/* Results Card */}
        <div className={`w-full max-w-[320px] p-6 rounded-2xl border-[2px] text-center mb-8 ${
          isLight
            ? 'bg-white border-black shadow-[6px_6px_0px_rgba(0,0,0,1)]'
            : 'bg-[#1c1e22]/90 border-white/10 shadow-none'
        }`}>
          <p className={`text-[12px] font-black uppercase tracking-wider mb-2 ${isLight ? 'text-black/50' : 'text-white/40'}`}>
            {t('mathRacing.accuracy')}
          </p>
          <p className={`text-[68px] font-black font-['Outfit'] leading-none ${isLight ? 'text-black' : 'text-white'}`}>
            {percentage}%
          </p>
          <p className={`text-[13px] mt-4 font-bold ${isLight ? 'text-black/60' : 'text-white/45'}`}>
            {score} {t('mathRacing.correctOf')} {totalQuestions} {t('mathRacing.questions')}
          </p>

          <hr className={`my-5 border-t-[1.5px] ${isLight ? 'border-black/10' : 'border-white/10'}`} />

          {/* Score details */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/40 uppercase font-black tracking-wider mb-1">Benar</span>
              <div className="flex items-center gap-1">
                <Icon icon="solar:check-circle-bold" className="text-[#00FF85]" width={16} />
                <span className={`text-[16px] font-black ${isLight ? 'text-black' : 'text-white'}`}>{score}</span>
              </div>
            </div>
            <div className="flex flex-col items-center border-x border-white/10">
              <span className="text-[10px] text-white/40 uppercase font-black tracking-wider mb-1">Salah</span>
              <div className="flex items-center gap-1">
                <Icon icon="solar:close-circle-bold" className="text-red-400" width={16} />
                <span className={`text-[16px] font-black ${isLight ? 'text-black' : 'text-white'}`}>{wrongCount}</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-white/40 uppercase font-black tracking-wider mb-1">Combo</span>
              <div className="flex items-center gap-1">
                <Icon icon="solar:fire-bold" className="text-amber-400" width={16} />
                <span className={`text-[16px] font-black ${isLight ? 'text-black' : 'text-white'}`}>{bestStreak}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons — bottom */}
      <div className="relative z-10 space-y-3 w-full max-w-[320px] mx-auto">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRestart}
          className={`w-full py-5 bg-[#00FF85] text-black font-black rounded-xl text-[15px] border-[2px] transition-all uppercase tracking-wider ${
            isLight
              ? 'border-black shadow-[4px_4px_0px_rgba(0,0,0,1)]'
              : 'border-transparent shadow-none'
          }`}
        >
          {t('mathRacing.playAgain')}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className={`w-full py-4 border-[2px] font-bold rounded-xl text-[14px] transition-all ${
            isLight
              ? 'bg-white text-black border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]'
              : 'bg-white/5 border-white/10 text-white/50'
          }`}
        >
          {t('mathRacing.back')}
        </motion.button>
      </div>
    </div>
  );
}
