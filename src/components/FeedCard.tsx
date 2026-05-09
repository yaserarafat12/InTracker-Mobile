
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getRinComment } from '../utils/rinEngine';
import { useUserStore } from '../store/useUserStore';
import { Icon } from '@iconify/react';
import { supabase } from '../lib/supabase';

interface FeedCardProps {
  id: string;
  user: {
    nickname: string;
    avatar_url?: string;
    region?: string;
  };
  type: 'habit_completion' | 'milestone' | 'text' | 'streak';
  content: string;
  metadata?: {
    habit_name?: string;
    milestone_name?: string;
    count?: number;
    day?: number;
    total_days?: number;
  };
  created_at: string;
  initialReactions?: Record<string, number>;
}

const FeedCard: React.FC<FeedCardProps> = ({ id, user, type, content, metadata, created_at, initialReactions }) => {
  const { profile } = useUserStore();
  const [reactions, setReactions] = useState(initialReactions || { '🔥': 0, '💪': 0, '👏': 0, '❤️': 0, '🎉': 0 });
  const [isReacting, setIsReacting] = useState(false);
  
  // Logic Rin Comment: Only if not own post
  const isOwnPost = profile?.nickname === user.nickname;
  
  // Memoize rin comment to prevent change on every re-render unless nickname changes
  const [rinComment] = useState(() => !isOwnPost 
    ? getRinComment(profile?.nickname || 'Bos', user.nickname, type, metadata?.habit_name || metadata?.milestone_name || content, metadata?.count || metadata?.day)
    : null);

  const handleReact = async (emoji: string) => {
    if (isReacting) return;
    
    // Optimistic Update
    const newReactions = {
      ...reactions,
      [emoji]: (reactions[emoji] || 0) + 1
    };
    setReactions(newReactions);
    
    if (navigator.vibrate) navigator.vibrate(10);
    
    setIsReacting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({ reactions: newReactions })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating reaction:', err);
      // Rollback on error
      setReactions(reactions);
    } finally {
      setIsReacting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-[#222] border-[2px] border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6 mb-8 flex flex-col gap-4 rounded-[32px] relative overflow-hidden group"
    >
      {/* GLOW DECORATION */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#00FF85]/5 blur-[40px] rounded-full pointer-events-none group-hover:bg-[#00FF85]/10 transition-colors" />

      {/* Header: User Info + Flag */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#00FF85] border-[2px] border-black flex items-center justify-center font-black text-black overflow-hidden rounded-2xl shadow-[4px_4px_0px_rgba(0,0,0,1)] rotate-[-3deg]">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.nickname} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">{user.nickname.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-black text-[#E3DAC9] text-[15px] tracking-tight">{user.nickname}</h4>
              {user.region && (
                <span className="text-[10px] bg-black px-1.5 py-0.5 rounded border border-white/10 text-white/40 font-bold">
                  {user.region}
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500 font-bold tracking-tight uppercase">
              {new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {type.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* HABIT CONTEXT: Day X of Y */}
        {metadata?.day && metadata?.total_days && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-[#00FF85] tracking-widest uppercase opacity-60">Progress</span>
            <span className="text-[14px] font-black text-white tracking-tighter">
              DAY {metadata.day}/{metadata.total_days}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="py-2">
        {type === 'habit_completion' ? (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00FF85] border-[1.5px] border-black rounded-lg shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              <Icon icon="solar:check-circle-bold" className="text-black" width={14} />
              <span className="text-[10px] text-black font-black uppercase tracking-tight">Protocol Completed</span>
            </div>
            <p className="text-[#E3DAC9] font-black text-[22px] leading-[1.1] tracking-tight">
              Selesai mengerjakan <span className="text-[#00FF85] italic">"{metadata?.habit_name || content}"</span>
            </p>
          </div>
        ) : type === 'streak' ? (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF4D00] border-[1.5px] border-black rounded-lg shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              <Icon icon="solar:fire-bold" className="text-white" width={14} />
              <span className="text-[10px] text-white font-black uppercase tracking-tight">On Fire</span>
            </div>
            <p className="text-[#E3DAC9] font-black text-[22px] leading-[1.1] tracking-tight">
              Mencapai Streak <span className="text-[#FF4D00] italic">{metadata?.count} Hari</span> Berturut-turut!
            </p>
          </div>
        ) : type === 'milestone' ? (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border-[1.5px] border-black rounded-lg shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              <Icon icon="solar:medal-star-bold" className="text-black" width={14} />
              <span className="text-[10px] text-black font-black uppercase tracking-tight">Milestone Unlocked</span>
            </div>
            <p className="text-[#E3DAC9] font-black text-[22px] leading-[1.1] tracking-tight">
              {content}
            </p>
          </div>
        ) : (
          <p className="text-[#E3DAC9] font-medium text-[17px] leading-relaxed italic border-l-[3px] border-[#00FF85]/30 pl-4">
            "{content}"
          </p>
        )}
      </div>

      {/* RIN'S SNARKY COMMENT */}
      {rinComment && (
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/40 border-[1.5px] border-black p-4 rounded-2xl flex gap-3 items-start shadow-[inset_4px_4px_10px_rgba(0,0,0,0.3)]"
        >
          <div className="w-8 h-8 rounded-full bg-[#00FF85] border border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <Icon icon="solar:magic-stick-3-bold" className="text-black" width={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-[#00FF85] uppercase tracking-widest opacity-50 mb-0.5">Rin's Insight</span>
            <p className="text-[12px] text-[#E3DAC9]/80 font-medium leading-tight">
              {rinComment}
            </p>
          </div>
        </motion.div>
      )}

      {/* Reactions Bar */}
      <div className="flex flex-wrap items-center gap-3 mt-2">
        {Object.entries(reactions).map(([emoji, count]) => (
          <motion.button
            key={emoji}
            whileTap={{ x: 2, y: 2, boxShadow: "0px 0px 0px black" }}
            onClick={() => handleReact(emoji)}
            className={`
              flex items-center gap-2 bg-[#212121] border-[2px] border-black px-4 py-2.5 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-[#252525] transition-all rounded-2xl
              ${count > 0 ? 'border-[#00FF85]/40 text-[#00FF85]' : 'text-white/40'}
            `}
          >
            <span className="text-sm">{emoji}</span>
            {count > 0 && (
              <span className="text-[11px] font-black">{count}</span>
            )}
          </motion.button>
        ))}
        
        <button className="flex items-center gap-1.5 ml-auto text-[11px] font-black text-white/20 hover:text-[#00FF85] transition-colors uppercase tracking-tighter">
          <Icon icon="solar:chat-round-dots-bold" width={16} />
          <span>Komentar</span>
        </button>
      </div>

    </motion.div>
  );
};

export default FeedCard;
