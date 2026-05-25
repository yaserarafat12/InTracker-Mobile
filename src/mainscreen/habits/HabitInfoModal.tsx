import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { HABIT_OPTIONS } from './icons';
import { getDefaultHabitStatsMap } from '../../engines/statsEngine';
import { XP_VALUES } from '../../engines/types';
import { getHabitBenefitData } from '../../data/habitBenefitsData';

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

const STAT_DISPLAY: Record<string, { name: string; icon: string; color: string }> = {
  kebijaksanaan: { name: 'Kebijaksanaan', icon: 'ph:brain-bold', color: '#A855F7' },
  kepercayaanDiri: { name: 'Kepercayaan Diri', icon: 'ph:crown-bold', color: '#00FF85' },
  kekuatan: { name: 'Kekuatan', icon: 'ph:lightning-bold', color: '#FF4D00' },
  disiplin: { name: 'Disiplin', icon: 'ph:sword-bold', color: '#3B82F6' },
  fokus: { name: 'Fokus', icon: 'ph:crosshair-bold', color: '#F59E0B' },
};

const HabitInfoModal = ({ isOpen, onClose, habit }: HabitInfoModalProps) => {
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
            className="w-full max-w-md rounded-t-[28px] border-t-[2px] border-x-[2px] border-white/10 shadow-[0_-8px_40px_rgba(0,0,0,0.6)] overflow-hidden max-h-[75vh]"
            style={{ background: '#141518' }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 relative z-20">
              <div className="w-10 h-1 rounded-full bg-white/20" />
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#141518] via-[#141518]/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent h-[80px]" />
                
                {/* Habit name + category overlaid */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-[26px] font-black font-['Outfit'] text-white leading-tight tracking-[0.3px]">
                    {habit.name}
                  </h2>
                  <span className="text-[11px] font-bold font-['Outfit'] text-white/40 uppercase tracking-[0.15em] mt-1">
                    {habit.category}
                  </span>
                </div>
              </div>

              {/* Quote */}
              <div className="px-6 pt-3">
                <p className="text-[12px] italic font-['Outfit'] text-white/40 leading-[1.5]">
                  "{benefitData.quote}"
                </p>
              </div>

              {/* Stats Reward Section */}
              <div className="px-6 pt-5">
                <span className="text-[10px] font-black font-['Outfit'] text-white/30 uppercase tracking-[0.15em]">
                  STATS REWARD
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
                          {config.name}
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
                      Experience Points
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
                  TOP 5 MANFAAT
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
                    {showMore ? 'Sembunyikan' : 'Lihat Selengkapnya'}
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
                          MANFAAT LENGKAP
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
                          TIMELINE
                        </span>
                        <div className="mt-3 space-y-3">
                          {/* 30 Days */}
                          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-5 h-5 rounded-md bg-[#3B82F6]/20 flex items-center justify-center">
                                <span className="text-[9px] font-black font-['Outfit'] text-[#3B82F6]">30</span>
                              </div>
                              <span className="text-[11px] font-bold font-['Outfit'] text-white/50">Hari</span>
                            </div>
                            <p className="text-[12px] font-['Outfit'] text-white/40 leading-[1.5]">
                              {benefitData.timeline.day30}
                            </p>
                          </div>

                          {/* 60 Days */}
                          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-5 h-5 rounded-md bg-[#A855F7]/20 flex items-center justify-center">
                                <span className="text-[9px] font-black font-['Outfit'] text-[#A855F7]">60</span>
                              </div>
                              <span className="text-[11px] font-bold font-['Outfit'] text-white/50">Hari</span>
                            </div>
                            <p className="text-[12px] font-['Outfit'] text-white/40 leading-[1.5]">
                              {benefitData.timeline.day60}
                            </p>
                          </div>

                          {/* 90 Days */}
                          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-5 h-5 rounded-md bg-[#00FF85]/20 flex items-center justify-center">
                                <span className="text-[9px] font-black font-['Outfit'] text-[#00FF85]">90</span>
                              </div>
                              <span className="text-[11px] font-bold font-['Outfit'] text-white/50">Hari</span>
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
