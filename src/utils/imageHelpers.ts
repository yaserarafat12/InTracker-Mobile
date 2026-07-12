import { useUserStore } from '../store/useUserStore';

export function getGenderedImageUrl(url: string | undefined | null, gender: string = 'Male'): string {
  if (!url) return '/all_images/custom_habit_bg.png';
  
  if (url.startsWith('/all_images/display_images/')) {
    const filename = url.replace('/all_images/display_images/', '');
    
    // If it's already mapped to a subfolder, don't change it
    if (!filename.includes('/') && !filename.startsWith('boy/') && !filename.startsWith('girl/')) {
      const folder = gender === 'Female' ? 'girl' : 'boy';
      return `/all_images/display_images/${folder}/${filename}`;
    }
  }
  
  return url;
}

export function useGenderedImageUrl(url: string | undefined | null): string {
  const gender = useUserStore((state) => state.settings?.gender) || 'Male';
  return getGenderedImageUrl(url, gender);
}
