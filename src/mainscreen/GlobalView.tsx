
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FeedCard from '../components/FeedCard';
import { Plus, Loader2, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';
import { useSocialStore } from '../store/useSocialStore';
import { Search, UserPlus, Check, X, Users } from 'lucide-react';
import { Icon } from '@iconify/react';
import { AddGlobalPost } from './global/AddGlobalPost';
import LoadingScreen from '../components/LoadingScreen';
import { useTranslation } from '../i18n';

type TabType = 'Publik' | 'Teman' | 'Personal';

const GlobalView: React.FC = () => {
  const { profile } = useUserStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('Publik');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { friends, pendingRequests, fetchFriends, fetchRequests, sendFriendRequest, respondToRequest, searchUsers } = useSocialStore();

  const tabs: TabType[] = ['Publik', 'Teman', 'Personal'];
  const [showFriendsSheet, setShowFriendsSheet] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          user:profiles!posts_user_id_profiles_fkey (
            id,
            nickname,
            location
          )
        `)
        .order('created_at', { ascending: false });

      if (activeTab === 'Personal' && profile) {
        query = query.eq('user_id', profile.id);
      } else if (activeTab === 'Teman' && profile) {
        // Ambil ID teman-teman
        const friendIds = friends.map(f => f.id);
        if (friendIds.length > 0) {
          query = query.in('user_id', [...friendIds, profile.id]);
        } else {
          // Jika tidak ada teman, cuma tampilkan post sendiri atau kosong
          query = query.eq('user_id', profile.id);
        }
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching feeds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, [profile]);

  useEffect(() => {
    fetchPosts();
  }, [activeTab, profile, friends]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const results = await searchUsers(searchQuery);
    // Check if we already requested these users
    const resultsWithStatus = results.map(u => ({
      ...u,
      requested: pendingRequests.some(r => r.receiver_id === u.id) || friends.some(f => f.id === u.id)
    }));
    setSearchResults(resultsWithStatus);
  };

  const handleSendRequest = async (userId: string) => {
    const success = await sendFriendRequest(userId);
    if (success) {
      setSearchResults(prev => prev.map(u => u.id === userId ? { ...u, requested: true } : u));
    }
  };

  const handleOpenProfile = async (userId: string) => {
    // Fetch full profile data
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setSelectedProfile(data);
      setShowProfileModal(true);
    }
  };

  return (
    <div className="flex flex-col h-full text-[#E3DAC9] font-['Outfit']">
      {/* Dynamic Transparent Header (Fixed) */}
      <div className="fixed top-[80px] left-0 right-0 z-40 px-6 py-6 bg-transparent">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 max-w-[500px] mx-auto w-full"
        >
          <div className="flex-1 flex items-center gap-2">
            {tabs.map((tab) => (
              <motion.button
                key={tab}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(10);
                  setActiveTab(tab);
                }}
                className={`flex-1 py-3 rounded-xl border-[1.5px] text-[11px] font-black uppercase tracking-wider transition-all ${
                  activeTab === tab 
                    ? 'bg-[#E3DAC9] border-[#E3DAC9] text-black' 
                    : 'bg-[#1c1e22] border-[#E3DAC9]/15 text-[#E3DAC9]/40'
                }`}
              >
                {tab === 'Publik' ? t('global.tabs.public') : tab === 'Teman' ? t('global.tabs.friends') : t('global.tabs.personal')}
              </motion.button>
            ))}
          </div>
          {/* Friends Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(10);
              setShowFriendsSheet(true);
            }}
            className="w-11 h-11 rounded-xl border-[1.5px] border-[#E3DAC9]/15 bg-[#1c1e22] flex items-center justify-center shrink-0"
          >
            <Icon icon="ph:users-bold" className="text-[#E3DAC9]/60" width={20} />
          </motion.button>
        </motion.div>
      </div>

      {/* Placeholder to prevent content being covered by fixed tabs */}
      <div className="h-[140px]" />

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
        <AnimatePresence mode="wait">
          {loading ? (
            <LoadingScreen message={t('global.loading')} />
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
                        region: post.user?.location?.region || 'ID',
                        id: post.user_id
                      }}
                      initialReactions={post.reactions}
                      onProfileClick={() => handleOpenProfile(post.user_id)}
                      onDelete={async (postId) => {
                        await supabase.from('posts').delete().eq('id', postId);
                        setPosts(prev => prev.filter(p => p.id !== postId));
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                  <div className="w-14 h-14 border-[1.5px] border-[#E3DAC9]/20 rounded-2xl mb-5 flex items-center justify-center">
                    <Icon icon="solar:cloud-cross-bold" className="text-[#E3DAC9]/40" width={24} />
                  </div>
                  <h3 className="font-black text-[14px] tracking-normal uppercase text-[#E3DAC9]">{t('global.empty.title')}</h3>
                  <p className="text-[11px] mt-2 tracking-normal max-w-[220px] font-medium leading-relaxed text-[#E3DAC9]">{t('global.empty.subtitle')}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Add Button */}
      <div className="fixed bottom-24 right-6 z-[60]">
        <motion.button
          whileTap={{ scale: 0.9, x: 4, y: 4, boxShadow: '0px 0px 0px rgba(0,0,0,1)' }}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(20);
            setShowAddModal(true);
          }}
          className="w-[60px] h-[60px] bg-[#00FF85] border-[2px] border-black rounded-2xl shadow-[5px_5px_0px_rgba(0,0,0,1)] flex items-center justify-center"
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="black" strokeWidth="5" strokeLinecap="square" />
          </svg>
        </motion.button>
      </div>

      {/* Share Progress Modal */}
      <AddGlobalPost 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onPosted={fetchPosts} 
      />

      {/* FRIENDS PLACEHOLDER BOTTOM SHEET */}
      <AnimatePresence>
        {showFriendsSheet && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFriendsSheet(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 bg-[#1c1e22] border-t-[2px] border-[#E3DAC9]/15 rounded-t-[32px] z-[101] p-6 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)]"
            >
              <div className="w-10 h-1 rounded-full bg-white/10 mx-auto mb-6" />
              <h3 className="text-[18px] font-black font-['Outfit'] text-[#E3DAC9] uppercase tracking-wider mb-5">{t('global.friends.title')}</h3>
              <div className="w-full p-4 bg-[#16181c] border-[1.5px] border-[#E3DAC9]/15 rounded-[14px] mb-4">
                <input
                  type="text"
                  placeholder={t('global.friends.placeholder')}
                  disabled
                  className="w-full bg-transparent border-none outline-none text-[13px] font-medium font-['Outfit'] text-[#E3DAC9]/30 placeholder:text-[#E3DAC9]/30"
                />
              </div>
              <button
                disabled
                className="w-full py-3.5 rounded-[12px] bg-[#00FF85]/20 border-[1.5px] border-[#00FF85]/20 text-[#00FF85]/40 font-black font-['Outfit'] uppercase text-[12px] tracking-wider mb-4"
              >
                {t('global.friends.addBtn')}
              </button>
              <p className="text-center text-[11px] font-bold font-['Outfit'] text-[#E3DAC9]/30 uppercase tracking-widest">
                {t('global.friends.comingSoon')}
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SOCIAL HUB MODAL (Friends & Search) */}
      <AnimatePresence>
        {showSocialModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSocialModal(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 top-20 bg-[#1c1e22] border-t-[3px] border-black rounded-t-[40px] z-[111] flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.8)]"
            >
              <div className="p-8 pb-4">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black italic uppercase tracking-normal">The Nexus Hub</h3>
                  <button onClick={() => setShowSocialModal(false)} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* SEARCH BOX */}
                <div className="relative mb-8">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20">
                    <Search size={20} />
                  </div>
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Cari nickname teman..."
                    className="w-full bg-black border-[2px] border-black rounded-[24px] py-5 pl-14 pr-6 text-[#E3DAC9] font-bold focus:border-[#00FF85]/50 transition-all shadow-[inset_4px_4px_10px_rgba(0,0,0,0.3)]"
                  />
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#00FF85] text-black px-4 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                  >
                    CARI
                  </motion.button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pt-[170px] pb-32 no-scrollbar scroll-smooth">
                {/* Pending Requests Section */}
                {pendingRequests.length > 0 && (
                  <div className="mb-10">
                    <h4 className="text-[10px] font-black text-[#00FF85] uppercase tracking-[0.3em] mb-4">Permintaan Pertemanan ({pendingRequests.length})</h4>
                    <div className="space-y-3">
                      {pendingRequests.map((req) => (
                        <div key={req.id} className="bg-black/40 border-[2px] border-black p-4 rounded-[24px] flex items-center justify-between shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-[#E3DAC9]">
                              {req.sender?.nickname?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-black text-sm">{req.sender?.nickname}</span>
                          </div>
                          <div className="flex gap-2">
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => respondToRequest(req.id, 'accepted')}
                              className="w-10 h-10 bg-[#00FF85] text-black rounded-xl flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                            >
                              <Check size={18} strokeWidth={3} />
                            </motion.button>
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => respondToRequest(req.id, 'deleted')}
                              className="w-10 h-10 bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl flex items-center justify-center"
                            >
                              <X size={18} strokeWidth={3} />
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mb-10">
                    <h4 className="text-[10px] font-black text-[#00FF85] uppercase tracking-[0.3em] mb-4">Hasil Pencarian</h4>
                    <div className="space-y-3">
                      {searchResults.map((user) => (
                        <div key={user.id} className="bg-white/[0.03] border-[2px] border-black p-4 rounded-[24px] flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center font-black text-[#00FF85]">
                              {user.nickname.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-black text-sm">{user.nickname}</span>
                              <span className="text-[9px] text-white/20 uppercase font-bold">{user.full_name || 'InTracker User'}</span>
                            </div>
                          </div>
                          {user.requested ? (
                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-white/30 uppercase">Requested</div>
                          ) : (
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleSendRequest(user.id)}
                              className="bg-[#00FF85] text-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-[3px_3px_0px_rgba(0,0,0,1)]"
                            >
                              <UserPlus size={14} strokeWidth={3} />
                              <span className="text-[9px] font-black uppercase">Tambah</span>
                            </motion.button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Friends List */}
                <div className="mb-10">
                  <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">{t('global.friends.title')} ({friends.length})</h4>
                  {friends.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {friends.map((friend) => (
                          <div 
                            key={friend.id}
                            onClick={() => handleOpenProfile(friend.id)}
                            className="bg-black/20 border border-white/5 p-4 rounded-[24px] flex items-center justify-between cursor-pointer hover:bg-black/40 transition-colors active:scale-[0.98]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#00FF85]/10 border border-[#00FF85]/30 rounded-xl flex items-center justify-center font-black text-[#00FF85]">
                                {friend.nickname.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-black text-sm">{friend.nickname}</span>
                            </div>
                            <Icon icon="solar:chat-round-dots-bold" className="text-white/20" width={20} />
                          </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 opacity-20">
                      <Users size={32} className="mx-auto mb-3" />
                      <p className="text-[10px] font-black uppercase tracking-widest">{t('global.friends.noFriends')}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* USER PROFILE MODAL */}
      <AnimatePresence>
        {showProfileModal && selectedProfile && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileModal(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[120]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-10 bg-[#1c1e22] border-[3px] border-black rounded-[40px] z-[121] flex flex-col overflow-hidden shadow-[20px_20px_0px_rgba(0,0,0,1)]"
            >
              <div className="h-32 bg-[#00FF85] border-b-[3px] border-black relative">
                <div className="absolute -bottom-12 left-8 w-24 h-24 bg-[#222] border-[3px] border-black rounded-full shadow-[6px_6px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
                  {selectedProfile.avatar_url ? (
                    <img src={selectedProfile.avatar_url} alt={selectedProfile.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-[#00FF85]">{selectedProfile.nickname?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="absolute top-6 right-6 w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white/40 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-16 p-8 flex-1 overflow-y-auto">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-black italic uppercase">{selectedProfile.nickname}</h3>
                  {selectedProfile.is_pro && (
                    <div className="px-2 py-0.5 bg-black border border-[#00FF85] rounded text-[8px] font-black text-[#00FF85] uppercase tracking-tighter">PRO</div>
                  )}
                </div>
                <p className="text-[12px] text-white/40 font-bold uppercase tracking-widest mb-6">
                  {selectedProfile.location?.region || 'InUniverse'} • {t('global.profile.memberSince')} {new Date(selectedProfile.created_at).getFullYear()}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-black/40 border-[2px] border-black p-4 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    <span className="text-[9px] font-black text-[#00FF85] uppercase tracking-widest block mb-1">{t('global.profile.currentStreak')}</span>
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:fire-bold" className="text-orange-500" width={20} />
                      <span className="text-xl font-black">{selectedProfile.streak_count || 0} {t('global.profile.days')}</span>
                    </div>
                  </div>
                  <div className="bg-black/40 border-[2px] border-black p-4 rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    <span className="text-[9px] font-black text-[#00FF85] uppercase tracking-widest block mb-1">{t('global.profile.intrackerLevel')}</span>
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:star-bold" className="text-[#00FF85]" width={20} />
                      <span className="text-xl font-black">LVL {Math.floor((selectedProfile.streak_count || 0) / 10) + 1}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{t('global.profile.quickActions')}</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {!friends.some(f => f.id === selectedProfile.id) && profile?.id !== selectedProfile.id && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSendRequest(selectedProfile.id)}
                        className="w-full py-4 bg-[#00FF85] text-black font-black uppercase italic rounded-2xl border-[2px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
                      >
                        <UserPlus size={18} strokeWidth={3} />
                        <span>{t('global.profile.sendRequest')}</span>
                      </motion.button>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-4 bg-white/5 text-white/60 font-black uppercase italic rounded-2xl border-[2px] border-black flex items-center justify-center gap-2"
                    >
                      <Icon icon="solar:chat-round-dots-bold" width={18} />
                      <span>{t('global.profile.sendMessage')}</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlobalView;
