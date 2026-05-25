import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { BookEntry } from '../../data/bookSummaries';
import { ATOMIC_HABITS_INTRO, ATOMIC_HABITS_PAGES, type BookPage } from '../../data/atomicHabitsContent';
import { HOW_TO_INFLUENCE_INTRO, HOW_TO_INFLUENCE_PAGES } from '../../data/howToInfluenceContent';
import { PSYCHOLOGY_OF_MONEY_INTRO, PSYCHOLOGY_OF_MONEY_PAGES } from '../../data/psychologyOfMoneyContent';

interface BookReaderProps {
  book: BookEntry;
  onBack: () => void;
}

export function BookReader({ book, onBack }: BookReaderProps) {
  const [view, setView] = useState<'intro' | 'reading'>('intro');
  const [currentPage, setCurrentPage] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  const hasStructuredContent = book.id === 'atomic-habits' || book.id === 'how-to-influence' || book.id === 'psychology-of-money';
  const intro = book.id === 'atomic-habits' ? ATOMIC_HABITS_INTRO
    : book.id === 'how-to-influence' ? HOW_TO_INFLUENCE_INTRO
    : book.id === 'psychology-of-money' ? PSYCHOLOGY_OF_MONEY_INTRO
    : null;
  const pages = book.id === 'atomic-habits' ? ATOMIC_HABITS_PAGES
    : book.id === 'how-to-influence' ? HOW_TO_INFLUENCE_PAGES
    : book.id === 'psychology-of-money' ? PSYCHOLOGY_OF_MONEY_PAGES
    : [];
  const totalPages = pages.length;

  const goNext = () => { if (currentPage < totalPages - 1) setCurrentPage((p) => p + 1); };
  const goPrev = () => { if (currentPage > 0) setCurrentPage((p) => p - 1); };

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <IntroView
              book={book}
              intro={intro}
              onBack={onBack}
              onStartReading={() => { setView('reading'); setCurrentPage(0); }}
            />
          </motion.div>
        )}

        {view === 'reading' && (
          <motion.div
            key="reading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <ReadingView
              page={pages[currentPage]}
              currentPage={currentPage}
              totalPages={totalPages}
              darkMode={darkMode}
              onToggleDark={() => setDarkMode(!darkMode)}
              onNext={goNext}
              onPrev={goPrev}
              onClose={() => setView('intro')}
              bookTitle={book.title}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// === INTRO VIEW ===
function IntroView({ book, intro, onBack, onStartReading }: {
  book: BookEntry;
  intro: typeof ATOMIC_HABITS_INTRO | null;
  onBack: () => void;
  onStartReading: () => void;
}) {
  return (
    <div className="h-full bg-[#FAF8F5] flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Back button */}
        <div className="px-5 pt-6 pb-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center"
          >
            <Icon icon="ph:arrow-left-bold" className="text-black/40" width={16} />
          </motion.button>
        </div>

        <div className="px-8 pb-8">
          {/* Cover + Title */}
          <div className="text-center mb-10 mt-4">
            {intro?.coverImage && (
              <div className="w-[150px] h-[210px] mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={intro.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}

            <h1 className="text-[28px] font-black text-[#1a1a1a] font-['Outfit'] mt-3 leading-tight">
              {book.title}
            </h1>
            <p className="text-[14px] text-[#888] mt-2">
              {book.author}{book.year ? `, ${book.year}` : ''}
            </p>
          </div>

          {/* Why Read */}
          {intro && (
            <>
              <div className="mb-8">
                <h2 className="text-[17px] font-bold text-[#1a1a1a] mb-4">Mengapa Harus Membaca?</h2>
                <p className="text-[15px] text-[#555] leading-[1.8]">{intro.whyRead}</p>
              </div>

              {/* You'll Learn */}
              <div className="p-5 bg-white border border-black/5 rounded-2xl shadow-sm">
                <h3 className="text-[15px] font-bold text-[#1a1a1a] mb-4">Yang Akan Kamu Pelajari</h3>
                <div className="space-y-4">
                  {intro.youWillLearn.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Icon icon="ph:check-bold" className="text-blue-500 flex-shrink-0 mt-0.5" width={16} />
                      <span className="text-[14px] text-[#555] leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!intro && !book.hasContent && (
            <div className="text-center py-16">
              <Icon icon="ph:book-open-bold" className="text-black/10 mx-auto mb-4" width={56} />
              <p className="text-[16px] text-[#999] font-medium">Konten segera hadir</p>
            </div>
          )}
        </div>
      </div>

      {/* Start Reading Button */}
      {intro && (
        <div className="px-8 pb-8 pt-4">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onStartReading}
            className="w-full py-4 bg-[#1a1a1a] text-white font-black rounded-2xl text-[16px] font-['Outfit']"
          >
            Mulai Membaca
          </motion.button>
        </div>
      )}
    </div>
  );
}

// === READING VIEW ===
function ReadingView({ page, currentPage, totalPages, darkMode, onToggleDark, onNext, onPrev, onClose, bookTitle }: {
  page: BookPage;
  currentPage: number;
  totalPages: number;
  darkMode: boolean;
  onToggleDark: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  bookTitle: string;
}) {
  const isLast = currentPage === totalPages - 1;
  const isFirst = currentPage === 0;

  const bg = darkMode ? 'bg-[#0d0f12]' : 'bg-white';
  const textMain = darkMode ? 'text-white' : 'text-[#1a1a1a]';
  const textBody = darkMode ? 'text-white/70' : 'text-[#333]';
  const textMuted = darkMode ? 'text-white/30' : 'text-[#bbb]';
  const borderColor = darkMode ? 'border-white/10' : 'border-[#eee]';

  return (
    <div className={`h-full ${bg} flex flex-col transition-colors duration-300`}>
      {/* Header */}
      <div className={`px-6 pt-5 pb-3 flex items-center gap-4 border-b ${borderColor}`}>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}>
          <Icon icon="ph:x-bold" className={darkMode ? 'text-white/50' : 'text-[#333]'} width={18} />
        </motion.button>
        <span className={`text-[15px] font-bold flex-1 ${textMain}`}>{bookTitle}</span>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onToggleDark}>
          <Icon icon={darkMode ? 'ph:sun-bold' : 'ph:moon-bold'} className={textMuted} width={16} />
        </motion.button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={page.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex-1 overflow-y-auto px-6 pt-8 pb-6"
        >
          {/* Section title */}
          {page.title && (
            <h1 className={`text-[20px] font-bold leading-snug mb-6 ${textMain}`}>
              {page.title}
            </h1>
          )}

          {/* Image */}
          {page.image && (
            <div className={`w-full rounded-xl overflow-hidden border ${borderColor} mb-6`}>
              <img
                src={page.image}
                alt=""
                className="w-full h-auto"
                onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
              />
            </div>
          )}

          {/* Body paragraphs */}
          {page.paragraphs.map((p, i) => (
            <p key={i} className={`text-[16px] leading-[1.75] mb-4 font-[450] ${textBody} whitespace-pre-line`}>{p}</p>
          ))}

          {/* Bullets */}
          {page.bullets && page.bullets.map((bullet, i) => {
            const [title, ...rest] = bullet.split(' — ');
            return (
              <div key={i} className="flex items-start gap-3 mb-4">
                <span className={`text-[16px] leading-[1.85] ${textMuted}`}>•</span>
                <p className={`text-[16px] leading-[1.85] ${textBody}`}>
                  <span className={`font-semibold ${textMain}`}>{title}</span>
                  {rest.length > 0 && ` — ${rest.join(' — ')}`}
                </p>
              </div>
            );
          })}

          {/* Insight box — subtle */}
          {page.insightBox && (
            <InsightBox
              label={page.insightBox.label}
              text={page.insightBox.text}
              color={page.insightBox.color}
              darkMode={darkMode}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer navigation */}
      <div className={`px-6 py-5 flex items-center justify-center gap-8 border-t ${borderColor}`}>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={onPrev}
          disabled={isFirst}
          className={isFirst ? 'opacity-20' : ''}
        >
          <Icon icon="ph:arrow-left-bold" className={darkMode ? 'text-white/50' : 'text-[#333]'} width={20} />
        </motion.button>

        <span className={`text-[14px] font-medium ${textMuted}`}>
          {currentPage + 1} dari {totalPages}
        </span>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={isLast ? onClose : onNext}
        >
          <Icon icon={isLast ? 'ph:check-bold' : 'ph:arrow-right-bold'} className={isLast ? 'text-[#00CC6A]' : (darkMode ? 'text-white/50' : 'text-[#333]')} width={20} />
        </motion.button>
      </div>
    </div>
  );
}

// === INSIGHT BOX ===
function InsightBox({ label, text, color, darkMode }: { label: string; text: string; color: 'green' | 'blue' | 'amber'; darkMode: boolean }) {
  const labelColors = { green: darkMode ? 'text-[#4ade80]' : 'text-[#16a34a]', blue: darkMode ? 'text-blue-400' : 'text-[#2563eb]', amber: darkMode ? 'text-amber-400' : 'text-[#d97706]' };
  const textColor = darkMode ? 'text-white/70' : 'text-[#333]';

  return (
    <div className="mt-10 mb-2">
      <p className={`text-[12px] ${labelColors[color]} font-bold uppercase tracking-wider mb-1`}>{label}</p>
      <p className={`text-[15px] font-[450] ${textColor} leading-[1.7] whitespace-pre-line`}>{text}</p>
    </div>
  );
}
