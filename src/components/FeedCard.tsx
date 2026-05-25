
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../store/useUserStore';
import { Icon } from '@iconify/react';
import { supabase } from '../lib/supabase';
import { useSocialStore } from '../store/useSocialStore';
import { Loader2, Send, Trash2 } from 'lucide-react';

interface FeedCardProps {
  id: string;
  user: {
    nickname: string;
    avatar_url?: string;
    region?: string;
    id: string;
  };
  type: 'habit_completion' | 'milestone' | 'text' | 'streak';
  content: string;
  metadata?: {
    habit_name?: string;
    milestone_name?: string;
    count?: number;
    day?: number;
    total_days?: number;
    streak?: number;
    image_url?: string;
  };
  created_at: string;
  initialReactions?: Record<string, number>;
  onProfileClick?: () => void;
  onDelete?: (id: string) => void;
}

const FeedCard: React.FC<FeedCardProps> = ({ id, user, type, content, metadata, created_at, initialReactions, onProfileClick, onDelete }) => {
  const { profile } = useUserStore();
  // Normalize reactions to new format
  const normalizeReactions = (r: Record<string, number> | undefined) => {
    const defaults = { '❤️': 0, '🔥': 0, '👏': 0, '😱': 0, '💪': 0, '🫡': 0, '🥶': 0 };
    if (!r) return defaults;
    // Map old emojis to new ones
    return {
      '❤️': (r['❤️'] || 0),
      '🔥': (r['🔥'] || 0),
      '👏': (r['👏'] || 0),
      '😱': (r['😱'] || 0) + (r['🎉'] || 0),
      '💪': (r['💪'] || 0),
      '🫡': (r['🫡'] || 0),
      '🥶': (r['🥶'] || 0),
    };
  };

  const [reactions, setReactions] = useState(normalizeReactions(initialReactions));
  const [isReacting, setIsReacting] = useState(false);
  const [hasReacted, setHasReacted] = useState(false);
  const [reactedEmoji, setReactedEmoji] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const { fetchComments, addComment, deleteComment } = useSocialStore();

  // Time ago helper
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };
  
  const handleReact = async (emoji: string) => {
    if (isReacting || hasReacted) return;
    
    if (navigator.vibrate) navigator.vibrate([8, 20, 8]);
    const newReactions = { ...reactions, [emoji]: (reactions[emoji] || 0) + 1 };
    setReactions(newReactions);
    setHasReacted(true);
    setReactedEmoji(emoji);
    
    if (navigator.vibrate) navigator.vibrate(10);
    if (id.startsWith('dummy')) return;

    setIsReacting(true);
    try {
      await supabase.from('posts').update({ reactions: newReactions }).eq('id', id);
    } catch (err) {
      setReactions(reactions);
      setHasReacted(false);
    } finally {
      setIsReacting(false);
    }
  };

  const handleOpenComments = async () => {
    setShowCommentModal(true);
    setLoadingComments(true);
    if (!id.startsWith('dummy')) {
      const data = await fetchComments(id);
      setComments(data);
    }
    setLoadingComments(false);
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    if (navigator.vibrate) navigator.vibrate(10);
    setIsCommenting(true);
    
    if (id.startsWith('dummy')) {
      setComments(prev => [...prev, {
        id: `local-${Date.now()}`,
        user_id: profile?.id,
        content: newComment,
        created_at: new Date().toISOString(),
        user: { nickname: profile?.nickname || 'Kamu' }
      }]);
      setNewComment('');
      setIsCommenting(false);
      return;
    }

    const success = await addComment(id, newComment);
    if (success) {
      setNewComment('');
      const data = await fetchComments(id);
      setComments(data);
    }
    setIsCommenting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (commentId.startsWith('local-')) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      return;
    }
    const success = await deleteComment(commentId);
    if (success) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="pb-6 mb-6 border-b-[2px] border-white/20 last:border-0 flex flex-col gap-3"
    >
      {/* Header: Avatar + Name + Time */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div 
            onClick={onProfileClick}
            className="w-10 h-10 bg-[#c4c4c4] flex items-center justify-center overflow-hidden rounded-full active:scale-95 transition-transform cursor-pointer"
          >
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.nickname} className="w-full h-full object-cover" />
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="9" r="4" fill="#8a8a8a"/>
                <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" fill="#8a8a8a"/>
              </svg>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 
                onClick={onProfileClick}
                className="font-black text-[#E3DAC9] text-[14px] tracking-normal cursor-pointer hover:text-[#00FF85] transition-colors"
              >
                {user.nickname}
              </h4>
              <span className="text-[11px] text-[#E3DAC9]/30 font-medium">{timeAgo(created_at)}</span>
            </div>
            {/* Habit subtitle - green like reference */}
            {type === 'habit_completion' && metadata?.habit_name && (
              <p className="text-[12px] font-bold text-[#00FF85] mt-0.5">
                Day {metadata?.streak || 0} of {metadata.habit_name}
              </p>
            )}
            {type === 'streak' && (
              <p className="text-[12px] font-bold text-[#FF4D00] mt-0.5">
                🔥 Streak {metadata?.count} Hari
              </p>
            )}
            {type === 'milestone' && (
              <p className="text-[12px] font-bold text-[#E3DAC9]/60 mt-0.5">
                🏆 Milestone
              </p>
            )}
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-white/70 hover:text-white transition-colors"
          >
            <Icon icon="solar:menu-dots-bold" width={18} />
          </button>
          {/* Delete menu - only for own posts */}
          {showMenu && profile?.id === user.id && onDelete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-8 bg-[#1c1e22] border border-white/10 rounded-xl p-1 z-50 shadow-lg"
            >
              <button
                onClick={() => { if (confirm('Hapus postingan ini?')) { onDelete(id); } setShowMenu(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#FF4D00] hover:bg-white/5 transition-colors w-full"
              >
                <Icon icon="solar:trash-bin-trash-bold" width={14} />
                <span className="text-[11px] font-bold">Hapus</span>
              </button>
            </motion.div>
          )}
          {showMenu && profile?.id !== user.id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-8 bg-[#1c1e22] border border-white/10 rounded-xl p-2 z-50 shadow-lg"
            >
              <span className="text-[10px] text-white/30 px-2">Tidak ada opsi</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Image - 9:16 portrait but constrained height */}
      {metadata?.image_url && (
        <div className="w-[65%] aspect-[9/16] overflow-hidden bg-black/20 rounded-[12px] mx-4 border border-white/25">
          <img src={metadata.image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Caption / Content */}
      {content && (
        <p className="text-[#E3DAC9] font-medium text-[14px] leading-relaxed px-4">
          {content}
        </p>
      )}

      {/* Reactions Bar + Comment */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {Object.entries(reactions).map(([emoji, count]) => (
            <motion.button
              key={emoji}
              whileTap={{ scale: 0.85 }}
              onClick={() => handleReact(emoji)}
              className={`flex items-center gap-0.5 transition-all px-1.5 py-1 rounded-full ${
                reactedEmoji === emoji ? 'bg-[#00FF85]/15 border border-[#00FF85]/30' : 'bg-[#1c1e22] border border-[#E3DAC9]/5'
              } ${hasReacted && reactedEmoji !== emoji ? 'opacity-40' : ''}`}
            >
              <span className="text-[13px]">{emoji}</span>
              {count > 0 && <span className={`font-black text-[9px] ${reactedEmoji === emoji ? 'text-[#00FF85]' : 'text-[#E3DAC9]/50'}`}>{count}</span>}
            </motion.button>
          ))}
        </div>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleOpenComments}
          className="text-[#E3DAC9]/30 hover:text-[#00FF85] transition-colors"
        >
          <Icon icon="solar:chat-round-dots-bold" width={20} />
        </motion.button>
      </div>

      {/* Comment Modal */}
      <AnimatePresence>
        {showCommentModal && (
          <div className="fixed inset-0 z-[99999] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCommentModal(false)}
              className="absolute inset-0 bg-black/85"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full max-h-[70vh] bg-[#212121] rounded-t-[32px] border-t-[1.5px] border-[#E3DAC9]/10 p-6 pb-10 flex flex-col"
            >
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5" />
              <h4 className="text-[16px] font-black font-['Outfit'] text-[#E3DAC9] uppercase tracking-wider mb-4">Komentar</h4>

              {/* Comment List */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 no-scrollbar max-h-[300px]">
                {loadingComments ? (
                  <div className="flex justify-center py-6 opacity-30">
                    <Loader2 className="animate-spin" size={20} />
                  </div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#00FF85]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-black text-[#00FF85]">{comment.user?.nickname?.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-black text-[#E3DAC9]">{comment.user?.nickname}</span>
                          <span className="text-[9px] text-[#E3DAC9]/30">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[13px] text-[#E3DAC9]/70 font-medium mt-0.5">{comment.content}</p>
                      </div>
                      {profile?.id === comment.user_id && (
                        <button onClick={() => handleDeleteComment(comment.id)} className="text-[#E3DAC9]/20 hover:text-[#FF4D00] transition-colors flex-shrink-0 mt-1">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center py-6 text-[11px] text-[#E3DAC9]/30">Belum ada komentar</p>
                )}
              </div>

              {/* Input */}
              <div className="flex items-center gap-3 pt-3 border-t border-[#E3DAC9]/5">
                <input
                  autoFocus
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                  placeholder="Tulis komentar..."
                  className="flex-1 bg-[#1c1e22] border border-[#E3DAC9]/10 rounded-xl px-4 py-3 text-[13px] text-[#E3DAC9] font-medium placeholder:text-[#E3DAC9]/20 focus:outline-none focus:border-[#00FF85]/30"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  disabled={!newComment.trim() || isCommenting}
                  onClick={handlePostComment}
                  className="w-10 h-10 bg-[#00FF85] rounded-xl flex items-center justify-center disabled:opacity-30 transition-all"
                >
                  {isCommenting ? <Loader2 className="animate-spin text-black" size={14} /> : <Send size={14} strokeWidth={3} className="text-black" />}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FeedCard;
