import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { BOOK_LIBRARY, CATEGORIES, type BookEntry, type BookCategory } from '../../data/bookSummaries';
import { BookReader } from './BookReader';
import { useTranslation } from '../../i18n';
import { useUserStore } from '../../store/useUserStore';

interface BookSummaryProps {
  onBack: () => void;
}

export function BookSummary({ onBack }: BookSummaryProps) {
  const { t } = useTranslation();
  const { settings } = useUserStore();
  const isLight = !document.documentElement.classList.contains('dark');
  const [readingBook, setReadingBook] = useState<BookEntry | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | BookCategory>('all');
  const [selectedCategory, setSelectedCategory] = useState<BookCategory>('Psychology');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  if (readingBook) {
    return <BookReader book={readingBook} onBack={() => setReadingBook(null)} />;
  }

  // Group books by category
  const booksByCategory = CATEGORIES.reduce((acc, cat) => {
    const books = BOOK_LIBRARY.filter((b) => b.category === cat);
    if (books.length > 0) acc[cat] = books;
    return acc;
  }, {} as Record<BookCategory, BookEntry[]>);

  const categoriesToShow = activeFilter === 'all'
    ? CATEGORIES.filter(cat => booksByCategory[cat] && booksByCategory[cat].length > 0)
    : [activeFilter];
  return (
    <div className={`fixed inset-0 flex flex-col z-[200] overflow-hidden transition-all ${
      isLight ? 'bg-[#f2faf5] text-black' : 'bg-[#16181c] text-white'
    }`}>
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        {/* Header Row */}
        <div className="relative w-full flex items-center justify-between mb-8 h-10">
          {/* Back button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className={`w-10 h-10 rounded-[10px] border-2 flex items-center justify-center transition-all ${
              isLight
                ? 'border-black/50 bg-white text-black shadow-none'
                : 'border-white/40 bg-[#2a2c32] text-white shadow-none'
            }`}
          >
            <Icon icon="ph:caret-left-bold" className={isLight ? 'text-black' : 'text-white'} width={18} />
          </motion.button>

          {/* Title in the center */}
          <h1 className={`text-[19px] font-bold font-['Outfit'] tracking-wide text-center flex-1 mx-2 truncate ${
            isLight ? 'text-black/85' : 'text-white/90'
          }`}>
            {t('features.library.title')}
          </h1>

          {/* Right Placeholder to balance centering */}
          <div className="w-10 h-10 pointer-events-none" />
        </div>

        {/* Filter tabs with drop-down */}
        <div className="relative flex w-full gap-3 pb-1 z-50">
          {/* Tab "Semua" */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveFilter('all');
              setIsDropdownOpen(false);
            }}
            className={`flex-1 py-2.5 rounded-[8px] text-[12px] font-bold whitespace-nowrap transition-all border-2 flex items-center justify-center ${
              activeFilter === 'all'
                ? isLight
                  ? 'sheen-active-tab transform scale-[1.03] border-[#48BB78]/30 bg-gradient-to-br from-[#E6FFFA] to-[#C6F6D5] border-[#81E6D9] shadow-[0_6px_16px_rgba(34,84,61,0.15)] text-[#22543D]'
                  : 'sheen-active-tab transform scale-[1.03] border-[#00FF85]/30 bg-gradient-to-br from-[#102A1E] to-[#0A1A12] border-[#1C4D38] shadow-[0_6px_16px_rgba(0,255,133,0.18)] text-[#00FF85]'
                : isLight
                  ? 'bg-white border-neutral-200 text-neutral-400 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:text-neutral-600'
                  : 'bg-[#1C1E22]/50 border-white/[0.07] text-[#E3DAC9]/40 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:text-[#E3DAC9]/60'
            }`}
          >
            {t('features.library.allFilter')}
          </motion.button>

          {/* Category Dropdown Tab */}
          <div className="flex-1 relative" ref={dropdownRef}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (activeFilter === 'all') {
                  setActiveFilter(selectedCategory);
                  setIsDropdownOpen(true);
                } else {
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
              className={`w-full py-2.5 rounded-[8px] text-[12px] font-bold whitespace-nowrap transition-all border-2 flex items-center justify-center gap-1.5 ${
                activeFilter !== 'all'
                  ? isLight
                    ? 'sheen-active-tab transform scale-[1.03] border-[#48BB78]/30 bg-gradient-to-br from-[#E6FFFA] to-[#C6F6D5] border-[#81E6D9] shadow-[0_6px_16px_rgba(34,84,61,0.15)] text-[#22543D]'
                    : 'sheen-active-tab transform scale-[1.03] border-[#00FF85]/30 bg-gradient-to-br from-[#102A1E] to-[#0A1A12] border-[#1C4D38] shadow-[0_6px_16px_rgba(0,255,133,0.18)] text-[#00FF85]'
                  : isLight
                    ? 'bg-white border-neutral-200 text-neutral-400 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:text-neutral-600'
                    : 'bg-[#1C1E22]/50 border-white/[0.07] text-[#E3DAC9]/40 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:text-[#E3DAC9]/60'
              }`}
            >
              <span>{t('features.library.categories.' + selectedCategory)}</span>
              <Icon 
                icon="ph:caret-down-bold" 
                className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                width={12} 
              />
            </motion.button>

            {/* Dropdown Options List */}
            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  {/* Backdrop overlay to close dropdown */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)} 
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className={`absolute right-0 mt-2 w-[200px] max-h-[300px] overflow-y-auto rounded-xl border p-1.5 shadow-xl z-50 transition-colors ${
                      isLight 
                        ? 'bg-white border-black/10 text-black' 
                        : 'bg-[#1c1e22] border-white/10 text-white'
                    }`}
                  >
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setActiveFilter(cat);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-bold transition-all flex items-center justify-between ${
                          selectedCategory === cat
                            ? isLight
                              ? 'bg-[#00FF85]/20 text-[#00b577]'
                              : 'bg-[#00FF85]/10 text-[#00FF85]'
                            : isLight
                              ? 'text-black/70 hover:bg-black/5'
                              : 'text-white/70 hover:bg-white/5'
                        }`}
                      >
                        <span>{t('features.library.categories.' + cat)}</span>
                        {selectedCategory === cat && (
                          <Icon icon="ph:check-bold" className="text-[#00b577] dark:text-[#00FF85]" width={12} />
                        )}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content — scrollable */}
      <div className="flex-1 overflow-y-auto pb-10 pt-4">
        {categoriesToShow.map((cat) => {
          const books = booksByCategory[cat];
          if (!books || books.length === 0) return null;
          return (
            <CategorySection
              key={cat}
              category={cat}
              books={books}
              onBookPress={setReadingBook}
              isLight={isLight}
            />
          );
        })}
      </div>
    </div>
  );
}

function CategorySection({ category, books, onBookPress, isLight }: { category: BookCategory; books: BookEntry[]; onBookPress: (book: BookEntry) => void; isLight: boolean }) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mb-10">
      {/* Category header */}
      <div className="px-6 mb-4">
        <h2 className={`text-[13px] font-bold font-space uppercase tracking-wider ${isLight ? 'text-black/85' : 'text-white/90'}`}>
          {t('features.library.categories.' + category)}{' '}
          <span className={`font-normal lowercase text-[11px] ${isLight ? 'text-black/40' : 'text-white/40'}`}>
            ({books.length})
          </span>
        </h2>
      </div>

      {/* Horizontal scroll cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar px-6"
      >
        {books.map((book) => (
          <BookCard key={book.id} book={book} onPress={() => onBookPress(book)} isLight={isLight} />
        ))}
      </div>
    </div>
  );
}

function BookCard({ book, onPress, isLight }: { book: BookEntry; onPress: () => void; isLight: boolean }) {
  const { t } = useTranslation();
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={onPress}
      className="flex-shrink-0 w-[160px] cursor-pointer"
    >
      {/* Cover */}
      <div className={`w-[160px] h-[220px] rounded-lg overflow-hidden border mb-3 relative transition-all ${
        isLight
          ? 'border-black/12 bg-white shadow-sm'
          : 'border-white/10 bg-gradient-to-b from-white/5 to-black/20 shadow-sm'
      }`}>
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const fallback = img.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        {/* Fallback — hidden by default, shown on image error */}
        <div className="absolute inset-0 flex-col items-center justify-center p-3 text-center hidden">
          <Icon icon="ph:book-open-bold" className={isLight ? 'text-black/20' : 'text-white/20'} width={32} />
          <span className={`text-[11px] font-bold leading-tight ${isLight ? 'text-black/40' : 'text-white/30'}`}>{book.title}</span>
        </div>

        {/* Coming soon badge if no content */}
        {!book.hasContent && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur-sm rounded text-[8px] font-bold text-white/50 uppercase">
            Soon
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-center justify-between mt-0.5">
        <h3 className={`text-[13px] font-black leading-tight truncate flex-1 ${isLight ? 'text-black' : 'text-white'}`}>{book.title}</h3>
        <span className={`text-[10px] font-bold flex-shrink-0 ml-2 ${isLight ? 'text-black/50' : 'text-white/30'}`}>{book.readingTimeMinutes} min</span>
      </div>
      <p className={`text-[11px] font-bold mt-0.5 truncate ${isLight ? 'text-black/60' : 'text-white/40'}`}>{book.author}</p>

      {/* Start reading button */}
      {book.hasContent && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          className={`mt-2 w-full py-1.5 rounded-[8px] text-[10px] font-bold border-2 transition-all text-center sheen-active-tab ${
            isLight
              ? 'border-[#48BB78]/30 bg-gradient-to-br from-[#E6FFFA] to-[#C6F6D5] border-[#81E6D9] shadow-[0_4px_12px_rgba(34,84,61,0.1)] text-[#22543D]'
              : 'border-[#00FF85]/30 bg-gradient-to-br from-[#102A1E] to-[#0A1A12] border-[#1C4D38] shadow-[0_4px_12px_rgba(0,255,133,0.12)] text-[#00FF85]'
          }`}
        >
          {t('features.library.startReading')}
        </motion.button>
      )}
    </motion.div>
  );
}
