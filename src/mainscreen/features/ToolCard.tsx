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

  return (
    <motion.div
      id={id}
      whileTap={{ scale: 0.96, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
      onClick={onPress}
      className={`relative aspect-[4/5] rounded-[16px] border-[2px] overflow-hidden cursor-pointer select-none shadow-[4px_4px_0px_rgba(0,0,0,1)] ${
        isLight ? 'border-black' : 'border-white/15'
      }`}
      style={{
        background: backgroundImage
          ? `url(${backgroundImage}) center/cover no-repeat`
          : 'linear-gradient(135deg, #1c1e22 0%, #141518 100%)',
      }}
    >
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <h3 className="text-[15px] font-black text-force-white leading-tight font-['Outfit']">{title}</h3>
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
