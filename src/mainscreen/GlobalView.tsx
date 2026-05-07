
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FeedCard from '../components/FeedCard';

type TabType = 'PUBLIC' | 'CIRCLE' | 'MY MEDIA';

const MOCK_DATA: any[] = [
  {
    id: '1',
    user: { nickname: 'Farel' },
    type: 'habit_completion',
    content: 'Membaca Buku',
    metadata: { habit_name: 'Membaca Buku 30 Halaman' },
    created_at: new Date().toISOString(),
    initialReactions: { '🔥': 12, '💪': 5, '❤️': 8 }
  },
  {
    id: '2',
    user: { nickname: 'Zidan' },
    type: 'streak',
    content: 'Push Up',
    metadata: { habit_name: 'Push Up', count: 15 },
    created_at: new Date(Date.now() - 3600000).toISOString(),
    initialReactions: { '🔥': 20, '💪': 15, '❤️': 2 }
  },
  {
    id: '3',
    user: { nickname: 'Rara' },
    type: 'milestone',
    content: 'Lari 10km pertama!',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    initialReactions: { '🔥': 45, '💪': 30, '❤️': 20 }
  }
];

const GlobalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('PUBLIC');

  const tabs: TabType[] = ['PUBLIC', 'CIRCLE', 'MY MEDIA'];

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] text-[#E3DAC9] font-['Outfit']">
      {/* Sticky Top Header with Boxes */}
      <div className="sticky top-0 z-20 bg-[#1A1A1A]/80 backdrop-blur-md pt-4 pb-6 px-6">
        {/* Box Tabs - Centered */}
        <div className="flex items-center justify-center gap-2 mt-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                px-4 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center
                border-[1.5px] ${activeTab === tab 
                  ? 'bg-[#E3DAC9] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] text-black' 
                  : 'bg-[#1A1A1A] border-white/10 shadow-[4px_4px_0px_rgba(0,0,0,1)] text-[#E3DAC9]/40'}
              `}
            >
              <span className="text-[11px] font-black uppercase tracking-widest">
                {tab}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'PUBLIC' ? (
              <div className="flex flex-col pb-20">
                {MOCK_DATA.map((post) => (
                  <FeedCard key={post.id} {...post} />
                ))}
                
                {/* Empty State / End of Feed */}
                <div className="py-10 text-center border-[1.5px] border-dashed border-gray-700 opacity-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest">Sekian dari masa depan.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                <div className="w-16 h-16 border-[1.5px] border-black bg-gray-800 mb-4 flex items-center justify-center rotate-3">
                  <span className="text-2xl italic font-black">?</span>
                </div>
                <h3 className="font-bold text-sm uppercase italic">Masih Kosong, Boss.</h3>
                <p className="text-[10px] mt-1 uppercase max-w-[200px]">Belum ada data di bagian {tab}.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GlobalView;
