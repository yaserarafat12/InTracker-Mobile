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
import { useTranslation } from '../../i18n';
import { useUserStore } from '../../store/useUserStore';
import { supabase } from '../../lib/supabase';

type ActiveView = 'grid' | 'pomodoro' | 'workout' | 'breathing' | 'books' | 'mathican' | 'nutrition';

interface ToolCardData {
  id: string;
  titleKey: string;
  descKey: string;
  backgroundImage?: string;
  comingSoon?: boolean;
  view: ActiveView | 'coming-soon';
}

const TOOL_CARDS_CONFIG: ToolCardData[] = [
  {
    id: 'nutrition',
    titleKey: 'features.hub.cards.calorieTracker',
    descKey: 'features.hub.cards.calorieTrackerDesc',
    backgroundImage: '/all_images/features_bg/calorie_tracker_card.png',
    view: 'nutrition',
  },
  {
    id: 'pomodoro',
    titleKey: 'features.hub.cards.pomodoroTimer',
    descKey: 'features.hub.cards.pomodoroTimerDesc',
    backgroundImage: '/all_images/features_bg/pomodoro_card.png',
    view: 'pomodoro',
  },
  {
    id: 'workout',
    titleKey: 'features.hub.cards.workoutCounter',
    descKey: 'features.hub.cards.workoutCounterDesc',
    backgroundImage: '/all_images/features_bg/workout_card.png',
    view: 'workout',
  },
  {
    id: 'breathing',
    titleKey: 'features.hub.cards.deepBreathing',
    descKey: 'features.hub.cards.deepBreathingDesc',
    backgroundImage: '/all_images/features_bg/deepbreathing_card.png',
    view: 'breathing',
  },
  {
    id: 'books',
    titleKey: 'features.hub.cards.library',
    descKey: 'features.hub.cards.libraryDesc',
    backgroundImage: '/all_images/features_bg/perpustakaan_bg.png',
    view: 'books',
  },
  {
    id: 'mathican',
    titleKey: 'features.hub.cards.mathican',
    descKey: 'features.hub.cards.mathicanDesc',
    backgroundImage: '/all_images/features_bg/mathican_card.png',
    view: 'mathican',
  },
  {
    id: 'screen-blocker',
    titleKey: 'features.hub.cards.screenBlocker',
    descKey: 'features.hub.cards.screenBlockerDesc',
    backgroundImage: '/all_images/features_bg/screenblocking_bg.png',
    comingSoon: true,
    view: 'coming-soon',
  },
];

export function ToolsHub() {
  const [activeView, setActiveView] = useState<ActiveView>('grid');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const { t } = useTranslation();

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'suggestion' | 'bug'>('suggestion');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { profile, settings } = useUserStore();

  const handleSubmitFeedback = async () => {
    if (!feedbackSubject.trim() || !feedbackMessage.trim()) {
      setToastMessage(settings.language === 'Bahasa Indonesia' ? 'Harap isi semua kolom' : 'Please fill all fields');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    setIsSubmittingFeedback(true);
    const feedbackId = Math.random().toString();
    const newFeedbackLoc = {
      id: feedbackId,
      created_at: new Date().toISOString(),
      type: feedbackType,
      subject: feedbackSubject.trim(),
      message: feedbackMessage.trim(),
      nickname: settings.username || profile?.nickname || 'guest',
      fullName: settings.nickname || profile?.full_name || 'Anonymous User',
      email: settings.email || 'guest@intracker.app'
    };

    try {
      const contentStr = JSON.stringify({
        subject: feedbackSubject.trim(),
        message: feedbackMessage.trim(),
        type: feedbackType
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('comments').insert([{
          post_id: feedbackType,
          content: contentStr,
          user_id: user.id
        }]);
      }
    } catch (e) {
      console.warn("Could not sync feedback to Supabase", e);
    }

    const existing = localStorage.getItem('intracker-local-feedbacks');
    let feedbackList = [];
    if (existing) {
      try { feedbackList = JSON.parse(existing); } catch (err) {}
    }
    feedbackList.push(newFeedbackLoc);
    localStorage.setItem('intracker-local-feedbacks', JSON.stringify(feedbackList));

    setIsSubmittingFeedback(false);
    setIsFeedbackOpen(false);
    setFeedbackSubject('');
    setFeedbackMessage('');
    
    setToastMessage(settings.language === 'Bahasa Indonesia' ? 'Saran/Keluhan berhasil dikirim!' : 'Feedback submitted successfully!');
    if (navigator.vibrate) navigator.vibrate([30, 80]);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const TOOL_CARDS = TOOL_CARDS_CONFIG.map((card) => ({
    ...card,
    title: t(card.titleKey),
    description: t(card.descKey),
  }));

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

  const isLight = !document.documentElement.classList.contains('dark');

  return (
    <div className={`relative min-h-screen ${isLight ? 'bg-[#F2F2F7]' : 'features-dark-zone'}`}>
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
            {/* Header Spacer to preserve vertical positioning */}
            <div className="mb-6 invisible select-none pointer-events-none" aria-hidden="true">
              <h2 className="text-[24px] font-bold text-white font-['Outfit']">{t('nav.features')}</h2>
              <p className="text-[13px] text-white/40 mt-1">{t('features.hub.tapToStart')}</p>
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

            <motion.div
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(10);
                setIsFeedbackOpen(true);
              }}
              className="suggestion-card-lime mt-4 p-4 rounded-[20px] flex items-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Icon icon="ph:lightbulb-bold" className="text-black" width={20} />
              </div>
              <div>
                <p className="text-[13px] font-black text-black">{settings.language === 'Bahasa Indonesia' ? 'Kirim Saran & Lapor Bug' : 'Send Suggestion / Report Bug'}</p>
                <p className="text-[11px] font-bold text-black/60">{settings.language === 'Bahasa Indonesia' ? 'Punya ide fitur baru atau menemukan kendala? Beritahu kami!' : 'Have a new feature idea or encountered a bug? Tell us!'}</p>
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

      {/* Feedback / Suggestion Popup Modal (Neobrutalist Style) */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center px-6"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsFeedbackOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative z-10 w-full max-w-[360px] bg-[#111] border-[3px] border-black rounded-3xl p-6 shadow-[6px_6px_0px_rgba(0,255,133,0.3)] flex flex-col gap-4 text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black font-['Outfit'] text-white uppercase tracking-wide">
                  {settings.language === 'Bahasa Indonesia' ? 'Kirim Masukan' : 'Send Feedback'}
                </h3>
                <button 
                  onClick={() => setIsFeedbackOpen(false)}
                  className="w-9 h-9 rounded-xl border-[2px] border-white/10 bg-[#2a2c32] flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  <Icon icon="ph:x-bold" className="text-white" width={16} />
                </button>
              </div>

              {/* Type selector tabs */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => setFeedbackType('suggestion')}
                  className={`py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                    feedbackType === 'suggestion'
                      ? 'bg-[#00FF85] text-black border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                      : 'bg-black/40 border-white/10 text-white/50'
                  }`}
                >
                  {settings.language === 'Bahasa Indonesia' ? 'Saran Fitur' : 'Suggestion'}
                </button>
                <button
                  onClick={() => setFeedbackType('bug')}
                  className={`py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                    feedbackType === 'bug'
                      ? 'bg-red-500 text-white border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]'
                      : 'bg-black/40 border-white/10 text-white/50'
                  }`}
                >
                  {settings.language === 'Bahasa Indonesia' ? 'Laporkan Bug' : 'Report Bug'}
                </button>
              </div>

              {/* Subject */}
              <div className="space-y-1.5 mt-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-wider">
                  {settings.language === 'Bahasa Indonesia' ? 'Subjek' : 'Subject'}
                </label>
                <input
                  type="text"
                  placeholder={feedbackType === 'bug' ? 'e.g. Calorie tracker error' : 'e.g. Add dark mode to journeys'}
                  value={feedbackSubject}
                  onChange={(e) => setFeedbackSubject(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-[#00FF85] transition-all"
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-wider">
                  {settings.language === 'Bahasa Indonesia' ? 'Deskripsi Lengkap' : 'Message Details'}
                </label>
                <textarea
                  placeholder={feedbackType === 'bug' ? 'What happened and how can we reproduce it?' : 'Describe your suggestion in detail...'}
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-[#00FF85] transition-all resize-none"
                />
              </div>

              {/* Submit button */}
              <button
                disabled={isSubmittingFeedback}
                onClick={handleSubmitFeedback}
                className="w-full py-4 mt-2 bg-[#00FF85] text-black font-black text-sm rounded-xl border border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
              >
                {isSubmittingFeedback ? (
                  <>
                    <Icon icon="ph:spinner-gap-bold" className="animate-spin" width={16} />
                    <span>{settings.language === 'Bahasa Indonesia' ? 'Mengirim...' : 'Sending...'}</span>
                  </>
                ) : (
                  <>
                    <Icon icon="ph:paper-plane-right-bold" width={16} />
                    <span>{settings.language === 'Bahasa Indonesia' ? 'Kirim Laporan' : 'Submit Feedback'}</span>
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-24 left-6 right-6 z-[300] bg-[#00FF85] text-black font-['Outfit'] font-black text-xs text-center px-4 py-3.5 rounded-2xl border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
          >
            <Icon icon="ph:check-circle-bold" width={16} height={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
