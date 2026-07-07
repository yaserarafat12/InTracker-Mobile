import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { HABIT_OPTIONS } from './icons';
import { getDefaultHabitStatsMap } from '../../engines/statsEngine';
import { XP_VALUES } from '../../engines/types';
import { getHabitBenefitData } from '../../data/habitBenefitsData';
import { useTranslation } from '../../i18n';

// ============================================================
// HabitInfoModal Component
// ============================================================
interface HabitInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: {
    name: string;
    category: string;
    difficulty: number;
    iconName: string;
    subtitle?: string;
  };
}

const STAT_DISPLAY: Record<string, { key: string; icon: string; color: string }> = {
  kebijaksanaan: { key: 'rpg.stats.wisdom', icon: 'ph:brain-bold', color: '#A855F7' },
  kepercayaanDiri: { key: 'rpg.stats.confidence', icon: 'ph:crown-bold', color: '#00FF85' },
  kekuatan: { key: 'rpg.stats.strength', icon: 'ph:lightning-bold', color: '#FF4D00' },
  disiplin: { key: 'rpg.stats.discipline', icon: 'ph:sword-bold', color: '#3B82F6' },
  fokus: { key: 'rpg.stats.focus', icon: 'ph:crosshair-bold', color: '#F59E0B' },
};

const getCategoryTranslation = (cat: string, t: any) => {
  const map: Record<string, string> = {
    'Rutinitas': 'habits.categories.routine',
    'Ketenangan Diri': 'habits.categories.mindfulness',
    'Perkembangan Diri': 'habits.categories.evolution',
    'Latihan Fisik': 'habits.categories.exercise',
  };
  const key = map[cat];
  return key ? t(key) : cat;
};

const HabitInfoModal = ({ isOpen, onClose, habit }: HabitInfoModalProps) => {
  const { t } = useTranslation();
  const [showMore, setShowMore] = useState(false);

  if (!habit) return null;

  const benefitData = getHabitBenefitData(habit.name);
  const statsMap = getDefaultHabitStatsMap(habit.category, habit.difficulty);
  const xp = XP_VALUES[(habit.difficulty as 1 | 2 | 3) || 1];

  const habitOption = HABIT_OPTIONS.find((h) => h.name === habit.name);
  const imageUrl = habitOption?.imageUrl || '/all_images/custom_habit_bg.png';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-[28px] border-t-[2px] border-x-[2px] border-border-theme shadow-[0_-8px_40px_rgba(0,0,0,0.6)] overflow-hidden max-h-[75vh] bg-os-card-bg"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 relative z-20">
              <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-white/20" />
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto max-h-[calc(75vh-20px)] no-scrollbar">
              {/* Hero Section with background image */}
              <div className="relative w-full h-[200px] overflow-hidden">
                <img
                  src={imageUrl}
                  alt={habit.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 hero-gradient-overlay" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent h-[80px]" />
              </div>

              {/* Habit name */}
              <div className="px-6 pt-5 pb-1">
                <h2 className="text-[26px] font-black font-['Outfit'] text-white leading-tight tracking-[0.3px]">
                  {(() => {
                    const translated = t(`presets.${habit.name}`);
                    return translated === `presets.${habit.name}` ? habit.name : translated;
                  })()}
                </h2>
              </div>

              {/* Stats Reward Section */}
              <div className="px-6 pt-5">
                <span className="text-[10px] font-black font-['Outfit'] text-white/30 uppercase tracking-[0.15em]">
                  {t('habits.infoModal.statsReward')}
                </span>

                <div className="mt-3 space-y-3">
                  {statsMap.categories.map((entry) => {
                    const config = STAT_DISPLAY[entry.category];
                    if (!config) return null;
                    return (
                      <div key={entry.category} className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <Icon icon={config.icon} width={18} height={18} style={{ color: config.color }} />
                        </div>
                        <span className="text-[14px] font-bold font-['Outfit'] text-white/80 flex-1">
                          {t(config.key)}
                        </span>
                        <span
                          className="text-[14px] font-black font-['Outfit']"
                          style={{ color: config.color }}
                        >
                          +{entry.points}
                        </span>
                      </div>
                    );
                  })}

                  {/* XP Row */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#00FF85]/15">
                      <Icon icon="ph:star-four-bold" width={18} height={18} className="text-[#00FF85]" />
                    </div>
                    <span className="text-[14px] font-bold font-['Outfit'] text-white/80 flex-1">
                      {t('habits.infoModal.experiencePoints')}
                    </span>
                    <span className="text-[14px] font-black font-['Outfit'] text-[#00FF85]">
                      +{xp} XP
                    </span>
                  </div>
                </div>
              </div>

              {/* TOP 5 MANFAAT Section */}
              <div className="px-6 pt-6">
                <span className="text-[10px] font-black font-['Outfit'] text-white/30 uppercase tracking-[0.15em]">
                  {t('habits.infoModal.top5Benefits')}
                </span>

                <div className="mt-3 space-y-3">
                  {benefitData.top5.map((benefit, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#00FF85]/50 mt-[7px] shrink-0" />
                      <span className="text-[13px] font-['Outfit'] text-white/60 leading-[1.5]">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expandable Section */}
              <div className="px-6 pt-4">
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="flex items-center gap-2 py-2 group"
                >
                  <span className="text-[12px] font-bold font-['Outfit'] text-white/40 group-hover:text-white/60 transition-colors">
                    {showMore ? t('habits.infoModal.hide') : t('habits.infoModal.showMore')}
                  </span>
                  <motion.div
                    animate={{ rotate: showMore ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon
                      icon="ph:caret-down-bold"
                      width={12}
                      height={12}
                      className="text-white/40 group-hover:text-white/60 transition-colors"
                    />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showMore && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      {/* MANFAAT LENGKAP */}
                      <div className="pt-2 pb-4">
                        <span className="text-[10px] font-black font-['Outfit'] text-white/30 uppercase tracking-[0.15em]">
                          {t('habits.infoModal.fullBenefits')}
                        </span>
                        <div className="mt-3 space-y-2.5">
                          {benefitData.full.map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/20 mt-[7px] shrink-0" />
                              <span className="text-[12px] font-['Outfit'] text-white/50 leading-[1.5]">
                                {item}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* TIMELINE 30/60/90 */}
                      <div className="pt-2 pb-4">
                        <span className="text-[10px] font-black font-['Outfit'] text-white/30 uppercase tracking-[0.15em]">
                          {t('habits.infoModal.timeline')}
                        </span>
                        <div className="mt-3 space-y-3">
                          {/* 30 Days */}
                          <div className="rounded-xl border border-white/5 bg-neutral-50 dark:bg-white/[0.02] p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-5 h-5 rounded-md bg-[#3B82F6]/20 flex items-center justify-center">
                                <span className="text-[9px] font-black font-['Outfit'] text-[#3B82F6]">30</span>
                              </div>
                              <span className="text-[11px] font-bold font-['Outfit'] text-white/50">{t('habits.infoModal.days')}</span>
                            </div>
                            <p className="text-[12px] font-['Outfit'] text-white/40 leading-[1.5]">
                              {benefitData.timeline.day30}
                            </p>
                          </div>

                          {/* 60 Days */}
                          <div className="rounded-xl border border-white/5 bg-neutral-50 dark:bg-white/[0.02] p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-5 h-5 rounded-md bg-[#A855F7]/20 flex items-center justify-center">
                                <span className="text-[9px] font-black font-['Outfit'] text-[#A855F7]">60</span>
                              </div>
                              <span className="text-[11px] font-bold font-['Outfit'] text-white/50">{t('habits.infoModal.days')}</span>
                            </div>
                            <p className="text-[12px] font-['Outfit'] text-white/40 leading-[1.5]">
                              {benefitData.timeline.day60}
                            </p>
                          </div>

                          {/* 90 Days */}
                          <div className="rounded-xl border border-white/5 bg-neutral-50 dark:bg-white/[0.02] p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-5 h-5 rounded-md bg-[#00FF85]/20 flex items-center justify-center">
                                <span className="text-[9px] font-black font-['Outfit'] text-[#00FF85]">90</span>
                              </div>
                              <span className="text-[11px] font-bold font-['Outfit'] text-white/50">{t('habits.infoModal.days')}</span>
                            </div>
                            <p className="text-[12px] font-['Outfit'] text-white/40 leading-[1.5]">
                              {benefitData.timeline.day90}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom padding */}
              <div className="h-6" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HabitInfoModal;
