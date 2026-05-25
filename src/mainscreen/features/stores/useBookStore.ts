import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BookState {
  completedBookIds: string[];
}

interface BookActions {
  markAsDone: (bookId: string) => void;
  isBookDone: (bookId: string) => boolean;
  getCompletedBooks: () => string[];
}

export const useBookStore = create<BookState & BookActions>()(
  persist(
    (set, get) => ({
      completedBookIds: [],

      markAsDone: (bookId) => {
        const current = get().completedBookIds;
        if (!current.includes(bookId)) {
          set({ completedBookIds: [...current, bookId] });
        }
      },

      isBookDone: (bookId) => {
        return get().completedBookIds.includes(bookId);
      },

      getCompletedBooks: () => {
        return get().completedBookIds;
      },
    }),
    {
      name: 'intracker-book-store',
    }
  )
);
