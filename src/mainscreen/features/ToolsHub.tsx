import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { ToolCard } from './ToolCard';
import { ComingSoonModal } from './ComingSoonModal';
import { PomodoroTimer } from './PomodoroTimer';
import { WorkoutCounter } from './WorkoutCounter';
import { DeepBreathing } from './DeepBreathing';
import { BookSummary } from './BookSummary';
import { MathRacing } from './MathRacing';
import { CalorieDashboard } from '../nutrition/CalorieDashboard';

type ActiveView = 'grid' | 'pomodoro' | 'workout' | 'breathing' | 'books' | 'mathican' | 'nutrition';

interface ToolCardData {
  id: string;
  title: string;
  description: string;
  backgroundImage?: string;
  comingSoon?: boolean;
  view: ActiveView | 'coming-soon';
}

const TOOL_CARDS: ToolCardData[] = [
  {
    id: 'nutrition',
    title: 'Calorie Tracker',
    description: 'Lacak kalori & makro harian',
    backgroundImage: '/all_images/features_bg/calorie_tracker_card.png',
    view: 'nutrition',
  },
  {
    id: 'pomodoro',
    title: 'Pomodoro Timer',
    description: 'Timer fokus dengan durasi kustom',
    backgroundImage: '/all_images/features_bg/pomodoro_card.png',
    view: 'pomodoro',
  },
  {
    id: 'workout',
    title: 'Workout Counter',
    description: 'Latihan terstruktur & tracking',
    backgroundImage: '/all_images/features_bg/workout_card.png',
    view: 'workout',
  },
  {
    id: 'breathing',
    title: 'Deep Breathing',
    description: 'Latihan napas box breathing',
    backgroundImage: '/all_images/features_bg/deepbreathing_card.png',
    view: 'breathing',
  },
  {
    id: 'books',
    title: 'Perpustakaan',
    description: 'Ringkasan buku pilihan',
    backgroundImage: '/all_images/features_bg/perpustakaan_bg.png',
    view: 'books',
  },
  {
    id: 'screen-blocker',
    title: 'Screen Blocker',
    description: 'Blokir distraksi digital',
    backgroundImage: '/all_images/features_bg/screenblocking_bg.png',
    comingSoon: true,
    view: 'coming-soon',
  },
  {
    id: 'mathican',
    title: 'Mathican',
    description: 'Math racing game',
    backgroundImage: '/all_images/features_bg/mathican_card.png',
    view: 'mathican',
  },
];

export function ToolsHub() {
  const [activeView, setActiveView] = useState<ActiveView>('grid');
  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleCardPress = (card: ToolCardData) => {
    if (card.comingSoon) {
      setShowComingSoon(true);
    } else if (card.view !== 'coming-soon') {
      setActiveView(card.view);
    }
  };

  const handleBack = () => {
    setActiveView('grid');
  };

  return (
    <div className="relative min-h-screen">
      {/* Grid view - always rendered but hidden when feature active */}
      <AnimatePresence>
        {activeView === 'grid' && (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="px-6 py-8 pb-32"
          >
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-[24px] font-bold text-white font-['Outfit']">Features</h2>
              <p className="text-[13px] text-white/40 mt-1">Tap untuk memulai sesi</p>
            </div>

            {/* 2-column grid */}
            <div className="grid grid-cols-2 gap-4">
              {TOOL_CARDS.map((card) => (
                <ToolCard
                  key={card.id}
                  id={card.id}
                  title={card.title}
                  description={card.description}
                  backgroundImage={card.backgroundImage}
                  comingSoon={card.comingSoon}
                  onPress={() => handleCardPress(card)}
                />
              ))}
            </div>

            {/* Kirim Saran card */}
            <motion.div
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                window.open('mailto:feedback@intracker.app?subject=Saran%20Fitur%20Tools', '_blank');
              }}
              className="mt-4 p-4 bg-white/5 border border-white/10 border-dashed rounded-[20px] flex items-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-[#00FF85]/10 flex items-center justify-center flex-shrink-0">
                <Icon icon="ph:lightbulb-bold" className="text-[#00FF85]" width={20} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">Kirim Saran</p>
                <p className="text-[11px] text-white/40">Punya ide fitur baru? Beritahu kami!</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen overlays — render independently, no wait */}
      <AnimatePresence>
        {activeView === 'pomodoro' && (
          <motion.div
            key="pomodoro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PomodoroTimer onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeView === 'workout' && (
          <motion.div
            key="workout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <WorkoutCounter onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeView === 'breathing' && (
          <motion.div
            key="breathing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DeepBreathing onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeView === 'books' && (
          <motion.div
            key="books"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <BookSummary onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeView === 'mathican' && (
          <motion.div
            key="mathican"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MathRacing onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeView === 'nutrition' && (
          <motion.div
            key="nutrition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CalorieDashboard onBack={handleBack} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coming Soon Modal */}
      <ComingSoonModal isOpen={showComingSoon} onClose={() => setShowComingSoon(false)} />
    </div>
  );
}
