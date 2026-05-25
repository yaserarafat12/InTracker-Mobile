import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { BOOK_LIBRARY, CATEGORIES, type BookEntry, type BookCategory } from '../../data/bookSummaries';
import { BookReader } from './BookReader';

interface BookSummaryProps {
  onBack: () => void;
}

export function BookSummary({ onBack }: BookSummaryProps) {
  const [readingBook, setReadingBook] = useState<BookEntry | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | BookCategory>('all');

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
    ? Object.keys(booksByCategory) as BookCategory[]
    : [activeFilter];

  return (
    <div className="fixed inset-0 bg-[#0d0f12] flex flex-col z-[200] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-14 pb-4">
        {/* Back + Title */}
        <div className="flex items-center gap-4 mb-5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <Icon icon="ph:arrow-left-bold" className="text-white" width={18} />
          </motion.button>
          <h1 className="text-[22px] font-black text-white font-['Outfit']">Perpustakaan</h1>
        </div>

        {/* Filter tabs — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <FilterPill
            label="Semua"
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
          />
          {CATEGORIES.map((cat) => (
            <FilterPill
              key={cat}
              label={cat}
              active={activeFilter === cat}
              onClick={() => setActiveFilter(cat)}
            />
          ))}
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
            />
          );
        })}
      </div>
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
        active
          ? 'bg-[#00FF85] text-black border-[2px] border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
          : 'bg-white/5 text-white/50 border border-white/10'
      }`}
    >
      {label}
    </motion.button>
  );
}

function CategorySection({ category, books, onBookPress }: { category: BookCategory; books: BookEntry[]; onBookPress: (book: BookEntry) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mb-10">
      {/* Category header */}
      <div className="px-6 mb-4">
        <h2 className="text-[16px] font-bold text-white font-['Outfit']">
          {category} <span className="text-white/50 font-normal">({books.length})</span>
        </h2>
      </div>

      {/* Horizontal scroll cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar px-6"
      >
        {books.map((book) => (
          <BookCard key={book.id} book={book} onPress={() => onBookPress(book)} />
        ))}
      </div>
    </div>
  );
}

function BookCard({ book, onPress }: { book: BookEntry; onPress: () => void }) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      onClick={onPress}
      className="flex-shrink-0 w-[160px] cursor-pointer"
    >
      {/* Cover */}
      <div className="w-[160px] h-[220px] rounded-xl overflow-hidden border-[2px] border-white/10 shadow-[4px_4px_0px_rgba(0,0,0,0.8)] mb-3 relative bg-gradient-to-b from-white/5 to-black/20">
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
          <Icon icon="ph:book-open-bold" className="text-white/20 mb-2" width={32} />
          <span className="text-[11px] text-white/30 font-medium leading-tight">{book.title}</span>
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
        <h3 className="text-[13px] font-bold text-white leading-tight truncate flex-1">{book.title}</h3>
        <span className="text-[10px] text-white/30 flex-shrink-0 ml-2">{book.readingTimeMinutes} min</span>
      </div>
      <p className="text-[11px] text-white/40 mt-0.5 truncate">{book.author}</p>

      {/* Start reading button */}
      {book.hasContent && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="mt-2 w-full py-1.5 bg-[#00FF85]/10 border border-[#00FF85]/30 rounded-lg text-[10px] font-bold text-[#00FF85] text-center"
        >
          Mulai Baca
        </motion.button>
      )}
    </motion.div>
  );
}
