import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { CATEGORY_COLORS } from './icons';
import { useTranslation } from '../../i18n';
import { useUserStore } from '../../store/useUserStore';

// Curated icon list for habit tracking (~90 icons)
const ICON_GROUPS = [
  {
    label: 'Health & Body',
    icons: [
      'solar:heart-pulse-bold', 'solar:heart-bold', 'solar:sleeping-square-bold',
      'solar:bed-bold', 'solar:cup-bold', 'solar:waterdrop-bold',
      'solar:pill-bold', 'solar:medical-kit-bold', 'solar:thermometer-bold',
      'solar:eye-bold', 'solar:hand-heart-bold', 'solar:shield-bold',
    ]
  },
  {
    label: 'Fitness',
    icons: [
      'solar:dumbbells-bold', 'solar:running-round-bold', 'solar:bicycle-bold',
      'solar:flame-bold', 'solar:body-bold', 'solar:bolt-bold',
      'solar:basketball-bold', 'solar:football-bold', 'solar:stopwatch-bold',
      'solar:mountains-bold', 'solar:flag-bold', 'solar:timer-bold',
    ]
  },
  {
    label: 'Mind & Spirit',
    icons: [
      'solar:book-2-bold', 'solar:notebook-bold', 'solar:pen-new-square-bold',
      'solar:music-note-bold', 'solar:music-notes-bold', 'solar:headphones-bold',
      'solar:moon-sleep-bold', 'solar:wind-bold', 'solar:moon-bold',
      'solar:sun-bold', 'solar:star-bold', 'solar:lightbulb-bold',
    ]
  },
  {
    label: 'Productivity',
    icons: [
      'solar:checklist-minimalistic-bold', 'solar:target-bold', 'solar:alarm-bold',
      'solar:calendar-bold', 'solar:clock-circle-bold', 'solar:laptop-bold',
      'solar:monitor-bold', 'solar:code-bold', 'solar:presentation-graph-bold',
      'solar:wallet-money-bold', 'solar:chart-bold', 'solar:notes-bold',
    ]
  },
  {
    label: 'Social & Lifestyle',
    icons: [
      'solar:users-group-rounded-bold', 'solar:user-speak-bold', 'solar:phone-bold',
      'solar:chat-round-bold', 'solar:home-bold', 'solar:chef-hat-bold',
      'solar:cart-bold', 'solar:camera-bold', 'solar:palette-bold',
      'solar:gamepad-bold', 'solar:tv-bold', 'solar:translation-bold',
    ]
  },
  {
    label: 'Nature & Misc',
    icons: [
      'solar:leaf-bold', 'solar:tree-bold', 'solar:flower-bold',
      'solar:fire-bold', 'solar:water-bold', 'solar:cloud-bold',
      'solar:earth-bold', 'solar:compass-bold', 'solar:rocket-bold',
      'solar:bolt-circle-bold', 'solar:diamond-bold', 'solar:crown-bold',
    ]
  },
];

const ALL_ICONS = ICON_GROUPS.flatMap(g => g.icons);

interface CustomHabitFormProps {
  isOpen: boolean;
  category: string;
  onClose: () => void;
  onSubmit: (habit: any) => void;
  currentHabits: any[];
}

export const CustomHabitForm = ({ isOpen, category, onClose, onSubmit, currentHabits }: CustomHabitFormProps) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('solar:star-bold');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { t } = useTranslation();
  const { settings } = useUserStore();
  const isLight = !document.documentElement.classList.contains('dark');
  const categoryColor = CATEGORY_COLORS[category] || '#00FF85';
  const categoryKeys: Record<string, string> = {
    'Rutinitas': 'habits.categories.routine',
    'Ketenangan Diri': 'habits.categories.mindfulness',
    'Perkembangan Diri': 'habits.categories.evolution',
    'Latihan Fisik': 'habits.categories.exercise'
  };

  const filteredIcons = searchQuery
    ? ALL_ICONS.filter(icon => icon.toLowerCase().includes(searchQuery.toLowerCase().replace(' ', '-')))
    : ALL_ICONS;

  const handleSubmit = () => {
    if (!name.trim()) return;

    const isDuplicate = currentHabits.some(h => h.name.toLowerCase() === name.trim().toLowerCase());
    if (isDuplicate) {
      if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
      return;
    }

    onSubmit({
      name: name.trim(),
      iconName: selectedIcon,
      category,
      imageUrl: '',
      imagePosition: '',
      frequency: 'harian',
      difficulty: 1,
      intensity: { type: 'none' },
      color: categoryColor,
      customGradient: true,
    });

    setName('');
    setSelectedIcon('solar:star-bold');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/90 z-[250]"
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-[#16181c] z-[260] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 pt-14 pb-4 flex items-center justify-between">
              <button 
                onClick={onClose}
                className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  isLight 
                    ? 'bg-white border-black text-black shadow-[3px_3px_0px_rgba(0,0,0,1)]' 
                    : 'border-2 border-white/10 bg-[#2a2c32] text-white shadow-none'
                }`}
              >
                <Icon icon="ph:x-bold" width={18} />
              </button>
              <h3 className="text-[15px] font-bold font-['Outfit'] text-[#E3DAC9]">{t('addHabit.customHabit')}</h3>
              <button
                onClick={handleSubmit}
                disabled={!name.trim()}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  name.trim() 
                    ? (isLight ? 'bg-black text-white' : 'bg-white text-black') 
                    : (isLight ? 'bg-neutral-100 text-neutral-400' : 'bg-[#2a2c32] text-white/20')
                }`}
              >
                <Icon icon="ph:check-bold" width={18} />
              </button>
            </div>

            {/* Name Input */}
            <div className="px-6 mb-5">
              <div className="flex items-center gap-3 h-[56px] rounded-2xl px-4" style={{ backgroundColor: `${categoryColor}15`, border: `1.5px solid ${categoryColor}30` }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 30))}
                  placeholder={t('addHabit.namePlaceholder')}
                  className="flex-1 bg-transparent text-[15px] font-bold font-['Outfit'] text-[#E3DAC9] placeholder:text-white/25 outline-none"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[9px] font-bold text-white/20 uppercase">{t(categoryKeys[category] || category)}</span>
                <span className="text-[9px] font-bold text-white/20">{name.length}/30</span>
              </div>
            </div>

            {/* Icon Picker Toggle */}
            <div className="px-6 mb-4">
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-full flex items-center justify-between h-[50px] bg-[#222] rounded-xl border border-white/10 px-4"
              >
                <div className="flex items-center gap-3">
                  <Icon icon="solar:palette-bold" width={18} className="text-white/40" />
                  <span className="text-[13px] font-bold text-[#E3DAC9]/70 font-['Outfit']">{t('addHabit.chooseIcon')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon={selectedIcon} width={18} style={{ color: categoryColor }} />
                  <Icon icon={showIconPicker ? "ph:caret-up-bold" : "ph:caret-down-bold"} width={12} className="text-white/30" />
                </div>
              </button>
            </div>

            {/* Icon Grid */}
            <AnimatePresence>
              {showIconPicker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6">
                    {/* Search */}
                    <div className="flex items-center gap-2 h-[40px] bg-[#222] rounded-lg border border-white/10 px-3 mb-4">
                      <Icon icon="solar:magnifer-bold" width={14} className="text-white/30" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('addHabit.searchIcon')}
                        className="flex-1 bg-transparent text-[12px] font-bold text-[#E3DAC9] placeholder:text-white/20 outline-none font-['Outfit']"
                      />
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-6 gap-2 max-h-[250px] overflow-y-auto no-scrollbar">
                      {filteredIcons.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => { setSelectedIcon(icon); if (navigator.vibrate) navigator.vibrate(3); }}
                          className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                            selectedIcon === icon
                              ? 'bg-white/10 border-[1.5px]'
                              : 'bg-[#222] border border-white/5 active:bg-white/10'
                          }`}
                          style={{ borderColor: selectedIcon === icon ? categoryColor : undefined }}
                        >
                          <Icon
                            icon={icon}
                            width={20}
                            style={{ color: selectedIcon === icon ? categoryColor : 'rgba(255,255,255,0.5)' }}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
