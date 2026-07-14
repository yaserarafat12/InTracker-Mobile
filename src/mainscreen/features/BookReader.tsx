import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import type { BookEntry } from '../../data/bookSummaries';
import { useTranslation } from '../../i18n';
import { ATOMIC_HABITS_INTRO, ATOMIC_HABITS_PAGES, type BookPage } from '../../data/atomicHabitsContent';
import { HOW_TO_INFLUENCE_INTRO, HOW_TO_INFLUENCE_PAGES } from '../../data/howToInfluenceContent';
import { PSYCHOLOGY_OF_MONEY_INTRO, PSYCHOLOGY_OF_MONEY_PAGES } from '../../data/psychologyOfMoneyContent';

interface BookReaderProps {
  book: BookEntry;
  onBack: () => void;
}

export function BookReader({ book, onBack }: BookReaderProps) {
  const isLight = !document.documentElement.classList.contains('dark');
  const [view, setView] = useState<'intro' | 'reading'>('intro');
  const [currentPage, setCurrentPage] = useState(0);
  const [darkMode, setDarkMode] = useState(!isLight);

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
              isLight={isLight}
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
function IntroView({ book, intro, onBack, onStartReading, isLight }: {
  book: BookEntry;
  intro: typeof ATOMIC_HABITS_INTRO | null;
  onBack: () => void;
  onStartReading: () => void;
  isLight: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className={`h-full flex flex-col transition-all ${isLight ? 'bg-[#f2faf5] text-black' : 'bg-[#16181c] text-white'}`}>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Back button */}
        <div className="px-5 pt-6 pb-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className={`w-10 h-10 rounded-[10px] border-2 flex items-center justify-center transition-all ${
              isLight
                ? 'border-black/50 bg-white text-black shadow-none'
                : 'border-white/40 bg-[#2a2c32] text-white shadow-none'
            }`}
          >
            <Icon icon="ph:caret-left-bold" className={isLight ? 'text-black' : 'text-white'} width={18} />
          </motion.button>
        </div>

        <div className="px-8 pb-8">
          {/* Cover + Title */}
          <div className="text-center mb-10 mt-4">
            {intro?.coverImage && (
              <div className={`w-[150px] h-[210px] mx-auto mb-6 rounded-lg overflow-hidden border transition-all ${
                isLight ? 'border-black/12 bg-white shadow-sm' : 'border-white/10 shadow-lg'
              }`}>
                <img
                  src={intro.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}

            <h1 className={`text-[28px] font-black font-['Outfit'] mt-3 leading-tight ${isLight ? 'text-black' : 'text-white'}`}>
              {book.title}
            </h1>
            <p className={`text-[14px] mt-2 font-bold ${isLight ? 'text-black/60' : 'text-white/40'}`}>
              {book.author}{book.year ? `, ${book.year}` : ''}
            </p>
          </div>

          {/* Why Read */}
          {intro && (
            <>
              <div className="mb-8">
                <h2 className={`text-[17px] font-black mb-4 ${isLight ? 'text-black' : 'text-white'}`}>{t('features.library.whyRead')}</h2>
                <p className={`text-[15px] leading-[1.8] font-bold ${isLight ? 'text-black/70' : 'text-white/70'}`}>{intro.whyRead}</p>
              </div>

              {/* You'll Learn */}
              <div className={`p-5 border rounded-lg transition-all ${
                isLight
                  ? 'bg-white border-black/10 shadow-sm text-black'
                  : 'bg-white/5 border border-white/10 text-white'
              }`}>
                <h3 className={`text-[15px] font-black mb-4 ${isLight ? 'text-black' : 'text-white'}`}>{t('features.library.whatYouWillLearn')}</h3>
                <div className="space-y-4">
                  {intro.youWillLearn.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Icon icon="ph:check-bold" className="text-[#00FF85] border-2 border-black bg-black rounded-full p-0.5 flex-shrink-0 mt-0.5" width={16} />
                      <span className={`text-[14px] leading-relaxed font-bold ${isLight ? 'text-black/75' : 'text-white/70'}`}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!intro && !book.hasContent && (
            <div className="text-center py-16">
              <Icon icon="ph:book-open-bold" className={`mx-auto mb-4 ${isLight ? 'text-black/10' : 'text-white/10'}`} width={56} />
              <p className={`text-[16px] font-bold ${isLight ? 'text-black/40' : 'text-white/40'}`}>{t('features.library.contentComingSoon')}</p>
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
            className={`w-full py-4 font-bold rounded-lg text-[16px] font-['Outfit'] border transition-all uppercase tracking-wide ${
              isLight
                ? 'bg-[#00FF85] text-black border-black/12 shadow-none'
                : 'bg-[#00FF85] text-black border-transparent shadow-none'
            }`}
          >
            {t('features.library.startReadingBtn')}
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
  const { t } = useTranslation();
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
        <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
          className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
            darkMode 
              ? 'border-white/10 bg-white/5 text-white shadow-sm' 
              : 'border-black/12 bg-white text-black shadow-sm'
          }`}
        >
          <Icon icon="ph:x-bold" width={16} />
        </motion.button>
        <span className={`text-[15px] font-bold flex-1 ${textMain}`}>{bookTitle}</span>
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
          className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${isFirst ? 'opacity-20 cursor-not-allowed' : ''} ${
            darkMode 
              ? 'border-white/10 bg-white/5 text-white shadow-sm' 
              : 'border-black/12 bg-white text-black shadow-sm'
          }`}
        >
          <Icon icon="ph:caret-left-bold" width={18} />
        </motion.button>

        <span className={`text-[14px] font-medium ${textMuted}`}>
          {currentPage + 1} {t('features.library.ofPage')} {totalPages}
        </span>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={isLast ? onClose : onNext}
          className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
            isLast
              ? 'bg-[#00FF85] border-transparent text-black shadow-sm'
              : darkMode 
                ? 'border-white/10 bg-white/5 text-white shadow-sm' 
                : 'border-black/12 bg-white text-black shadow-sm'
          }`}
        >
          <Icon icon={isLast ? 'ph:check-bold' : 'ph:caret-right-bold'} width={18} />
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
