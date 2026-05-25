import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useProgressionStore } from './useProgressionStore';

export interface JourneyEntry {
  id?: string;
  user_id: string;
  entry_date: string;
  mood_id: number | null;
  journal_text: string;
  media_urls: string[];
  created_at?: string;
}

interface JourneyStore {
  entries: Record<string, JourneyEntry>; // Key: date (YYYY-MM-DD)
  loading: boolean;
  fetchEntries: () => Promise<void>;
  saveEntry: (entry: Partial<JourneyEntry> & { entry_date: string }) => Promise<void>;
  uploadMedia: (file: File) => Promise<string | null>;
}

export const useJourneyStore = create<JourneyStore>((set, get) => ({
  entries: {},
  loading: false,

  fetchEntries: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ loading: true });
    const { data, error } = await supabase
      .from('journey_logs')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      const entryMap: Record<string, JourneyEntry> = {};
      data.forEach((entry: JourneyEntry) => {
        // Handle database date format
        entryMap[entry.entry_date] = entry;
      });
      set({ entries: entryMap });
    }
    set({ loading: false });
  },

  saveEntry: async (entryUpdate) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      ...entryUpdate,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('journey_logs')
      .upsert(payload, { onConflict: 'user_id, entry_date' })
      .select()
      .single();

    if (!error && data) {
      set((state) => ({
        entries: {
          ...state.entries,
          [data.entry_date]: data as JourneyEntry,
        }
      }));

      // Award XP and stats for journal entry
      const charCount = entryUpdate.journal_text?.length ?? 0;
      useProgressionStore.getState().awardJournalEntry(charCount);
    } else {
      console.error("Error saving journey entry:", error);
    }
  },

  uploadMedia: async (file) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Compress image before upload
    const compressedFile = await compressImage(file, 1200, 0.75);

    // Sanitize file name - always save as .jpg after compression
    const fileName = `${user.id}/${Date.now()}.jpg`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('journey-media')
      .upload(filePath, compressedFile, {
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.error("Error uploading media:", uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('journey-media')
      .getPublicUrl(filePath);

    return publicUrl;
  }
}));

// Compress image using canvas - resize to maxWidth and reduce quality
async function compressImage(file: File, maxWidth: number, quality: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Resize if wider than maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(blob || file);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}
