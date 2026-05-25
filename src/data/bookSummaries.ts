export type BookCategory =
  | 'Spiritual'
  | 'Productivity'
  | 'Psychology'
  | 'Philosophy'
  | 'Society'
  | 'Wealth'
  | 'Self Development'
  | 'Leadership'
  | 'Health'
  | 'Creativity';

export interface BookEntry {
  id: string;
  title: string;
  author: string;
  year?: number;
  category: BookCategory;
  readingTimeMinutes: number;
  coverImage?: string; // path to /perpustakaan/covers/
  hasContent: boolean; // true if summary content exists
  summary: string;
}

export const CATEGORIES: BookCategory[] = [
  'Spiritual',
  'Productivity',
  'Psychology',
  'Philosophy',
  'Society',
  'Wealth',
  'Self Development',
  'Leadership',
  'Health',
  'Creativity',
];

export const BOOK_LIBRARY: BookEntry[] = [
  // === SPIRITUAL ===
  // (konten akan ditambahkan)

  // === PRODUCTIVITY ===
  {
    id: 'atomic-habits',
    title: 'Atomic Habits',
    author: 'James Clear',
    year: 2018,
    category: 'Productivity',
    readingTimeMinutes: 10,
    coverImage: '/perpustakaan/atomichabits/1_cover_atomichabits.png',
    hasContent: true,
    summary: '',
  },

  // === SOCIETY ===
  {
    id: 'how-to-influence',
    title: 'How to Win Friends and Influence People',
    author: 'Dale Carnegie',
    year: 1936,
    category: 'Society',
    readingTimeMinutes: 15,
    coverImage: '/perpustakaan/how_to_influence/cover.png',
    hasContent: true,
    summary: '',
  },

  // === WEALTH ===
  {
    id: 'psychology-of-money',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    year: 2020,
    category: 'Wealth',
    readingTimeMinutes: 15,
    coverImage: '/perpustakaan/psycology_of_money/1.png',
    hasContent: true,
    summary: '',
  },
];
