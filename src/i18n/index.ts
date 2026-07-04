import { useUserStore } from '../store/useUserStore';
import { id } from './id';
import { en } from './en';
import { es } from './es';
import { zh } from './zh';
import { hi } from './hi';
import { ar } from './ar';
import { pt } from './pt';
import { fr } from './fr';
import { ja } from './ja';
import { de } from './de';

export const dictionaries: Record<string, any> = {
  'English': en,
  'Bahasa Indonesia': id,
  'Español': es,
  'Chinese': zh,
  'Hindi': hi,
  'Arabic': ar,
  'Portuguese': pt,
  'Français': fr,
  'Japanese': ja,
  'Deutsch': de
};

export function useTranslation() {
  const language = useUserStore((state) => state.settings.language);

  const t = (key: string): string => {
    // Determine active dictionary. Default to 'en' for any unsupported language.
    const dict = dictionaries[language] || en;

    const keys = key.split('.');
    let value: any = dict;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English dictionary if key is missing in active dictionary
        let fallbackValue: any = en;
        for (const fk of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
            fallbackValue = fallbackValue[fk];
          } else {
            fallbackValue = key;
            break;
          }
        }
        return typeof fallbackValue === 'string' ? fallbackValue : key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return { t, language };
}
export { id, en, es, zh, hi, ar, pt, fr, ja, de };
export default useTranslation;

