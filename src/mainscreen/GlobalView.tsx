
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FeedCard from '../components/FeedCard';
import { Plus, Loader2, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';

type TabType = 'Publik' | 'Teman' | 'Punyaku';

const GlobalView: React.FC = () => {
  const { profile } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabType>('Publik');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const tabs: TabType[] = ['Publik', 'Teman', 'Punyaku'];

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:profiles (
            nickname,
            location
          )
        `)
        .order('created_at', { ascending: false });

      if (activeTab === 'Punyaku' && profile) {
        query = query.eq('user_id', profile.id);
      }
      // Note: 'Teman' tab logic not implemented as friendship table doesn't exist yet

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching feeds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab, profile]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !profile) return;
    
    setIsPosting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .insert([{
          user_id: profile.id,
          type: 'text',
          content: newPostContent,
          metadata: {},
          reactions: { '🔥': 0, '💪': 0, '👏': 0, '❤️': 0, '🎉': 0 }
        }]);

      if (error) throw error;
      
      setNewPostContent('');
      setShowAddModal(false);
      fetchPosts();
    } catch (err) {
      console.error('Error posting:', err);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#212121] text-[#E3DAC9] font-['Outfit']">
      {/* Dynamic Transparent Header (Fixed) */}
      <div className="fixed top-[75px] left-0 right-0 z-40 px-6 py-6 bg-transparent">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-black/40 backdrop-blur-xl border-[2px] border-white/10 rounded-[28px] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-between gap-2 max-w-[450px] mx-auto w-full relative overflow-hidden"
        >
          {/* Subtle Inner Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
          {tabs.map((tab) => (
            <motion.button
              key={tab}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (navigator.vibrate) navigator.vibrate(10);
                setActiveTab(tab);
              }}
              className={`
                flex-1 py-3 rounded-[22px] transition-all duration-500 flex items-center justify-center relative overflow-hidden
                ${activeTab === tab 
                  ? 'bg-[#00FF85] text-black shadow-[0_0_20px_rgba(0,255,133,0.3)]' 
                  : 'bg-transparent text-[#E3DAC9]/30 hover:text-[#E3DAC9]'}
              `}
            >
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#00FF85] border-[1.5px] border-black rounded-[22px]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className={`text-[11px] font-black tracking-[0.1em] text-center relative z-10 uppercase transition-colors duration-300 ${activeTab === tab ? 'text-black' : ''}`}>
                {tab}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Placeholder to prevent content being covered by fixed tabs */}
      <div className="h-[150px]" />

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-20">
              <Loader2 className="animate-spin mb-4" size={40} />
              <p className="text-[12px] font-black uppercase tracking-widest">Sabar, Rin lagi narik data...</p>
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {posts.length > 0 ? (
                <div className="flex flex-col pb-24">
                  {posts.map((post) => (
                    <FeedCard 
                      key={post.id} 
                      {...post} 
                      user={{
                        nickname: post.user?.nickname || 'Anonymous',
                        region: post.user?.location?.region || 'ID'
                      }}
                      initialReactions={post.reactions}
                    />
                  ))}
                  
                  {/* Empty State / End of Feed */}
                  <div className="py-16 text-center border-[2px] border-dashed border-white/10 rounded-[24px] mb-10 group hover:border-[#00FF85]/30 transition-colors">
                    <div className="w-12 h-12 bg-black border-[1.5px] border-black rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] rotate-3 group-hover:rotate-0 transition-transform">
                      <span className="text-xl">⌛</span>
                    </div>
                    <p className="text-[12px] font-black tracking-tighter uppercase text-white/30 group-hover:text-[#00FF85]/50 transition-colors">Sekian dari masa depan.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                  <div className="w-20 h-20 border-[2px] border-black bg-black rounded-2xl mb-6 flex items-center justify-center rotate-6 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                    <span className="text-3xl italic font-black">?</span>
                  </div>
                  <h3 className="font-black text-[18px] italic tracking-tight uppercase">Masih Kosong, Boss.</h3>
                  <p className="text-[11px] mt-2 tracking-tight max-w-[220px] font-medium leading-relaxed">Belum ada data di bagian {activeTab}.{activeTab === 'Teman' ? ' Fitur teman lagi digodok!' : ' Yuk, post sesuatu!'}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-[110px] right-6 z-[60]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ x: 5, y: 5, boxShadow: "0px 0px 0px rgba(0,0,0,1)" }}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(20);
            setShowAddModal(true);
          }}
          className="w-16 h-16 bg-[#00FF85] border-[2.5px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] rounded-[22px] flex items-center justify-center text-black"
        >
          <Plus size={34} strokeWidth={4} />
        </motion.button>
      </div>

      {/* Quick Post Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-[#222] border-t-[3px] border-black rounded-t-[40px] p-8 z-[101] shadow-[0_-20px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Sebarkan Vibes, Boss!</h3>
                <button onClick={() => setShowAddModal(false)} className="text-[#E3DAC9]/40 hover:text-white transition-colors">
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>
              
              <div className="bg-black border-[2px] border-black rounded-[24px] p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] mb-6">
                <textarea 
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Lagi mikirin apa hari ini?"
                  className="w-full bg-transparent border-none outline-none text-[#E3DAC9] font-medium resize-none min-h-[120px]"
                />
              </div>

              <motion.button
                disabled={isPosting || !newPostContent.trim()}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreatePost}
                className="w-full py-5 bg-[#00FF85] text-black font-black uppercase italic text-lg rounded-[22px] border-[2.5px] border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
              >
                {isPosting ? <Loader2 className="animate-spin" /> : <Send size={20} strokeWidth={3} />}
                <span>GAS POST!</span>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalView;
