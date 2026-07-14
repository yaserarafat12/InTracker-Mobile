import { motion } from 'framer-motion';
import { useUserStore } from '../../store/useUserStore';

interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  backgroundImage?: string;
  comingSoon?: boolean;
  onPress: () => void;
}

export function ToolCard({ id, title, description, backgroundImage, comingSoon, onPress }: ToolCardProps) {
  const { settings } = useUserStore();
  const isLight = !document.documentElement.classList.contains('dark');

  // Dynamic font size class to keep titles in a single line
  const getFontSizeClass = (text: string) => {
    const len = text.length;
    if (len <= 14) return 'text-[17px]';
    if (len <= 17) return 'text-[15.5px]';
    if (len <= 22) return 'text-[14px]';
    return 'text-[12.5px]';
  };

  return (
    <motion.div
      id={id}
      whileTap={{ scale: 0.96 }}
      onClick={onPress}
      className={`relative aspect-[4/5] rounded-[10px] border-[1.5px] overflow-hidden cursor-pointer select-none transition-all duration-300 hover:scale-[1.02] ${
        isLight 
          ? 'border-black/20 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]' 
          : 'border-white/25 bg-[#1c1e22] shadow-[0_8px_24px_rgba(0,0,0,0.25)]'
      }`}
      style={{
        background: backgroundImage
          ? `url(${backgroundImage}) center/cover no-repeat`
          : 'linear-gradient(135deg, #1c1e22 0%, #141518 100%)',
      }}
    >
      {/* Gradient overlays for text readability & premium depth */}
      <div className="absolute inset-0 bg-black/25 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-[2]" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <h3
          className={`font-black text-force-white leading-tight font-['Outfit'] whitespace-nowrap truncate ${getFontSizeClass(title)}`}
          style={{ wordSpacing: '0.15em' }}
        >
          {title}
        </h3>
      </div>

      {/* Coming Soon overlay */}
      {comingSoon && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <span className="px-3 py-1.5 bg-black/60 border-[1.5px] border-white/20 rounded-full text-[9px] font-black text-white/70 uppercase tracking-[0.15em]">
            Coming Soon
          </span>
        </div>
      )}
    </motion.div>
  );
}
