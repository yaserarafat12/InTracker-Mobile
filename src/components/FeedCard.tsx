
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getRinComment } from '../utils/rinEngine';
import { useUserStore } from '../store/useUserStore';

interface FeedCardProps {
  id: string;
  user: {
    nickname: string;
    avatar_url?: string;
  };
  type: 'habit_completion' | 'milestone' | 'text' | 'streak';
  content: string;
  metadata?: any;
  created_at: string;
  initialReactions?: Record<string, number>;
}

const FeedCard: React.FC<FeedCardProps> = ({ user, type, content, metadata, created_at, initialReactions }) => {
  const { profile } = useUserStore();
  const [reactions, setReactions] = useState(initialReactions || { '🔥': 0, '💪': 0, '❤️': 0 });
  const rinComment = getRinComment(profile?.nickname || 'Boss', user.nickname, type, metadata?.habit_name, metadata?.count);

  const handleReact = (emoji: string) => {
    setReactions(prev => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1
    }));
    // In a real app, sync with Supabase here
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#2A2A2A] border-[1.5px] border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] p-4 mb-5 flex flex-col gap-3"
    >
      {/* Header: User Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#00FF85] border-[1.5px] border-black flex items-center justify-center font-bold text-black overflow-hidden">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.nickname} className="w-full h-full object-cover" />
          ) : (
            user.nickname.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h4 className="font-bold text-[#E3DAC9] text-sm uppercase">{user.nickname}</h4>
          <p className="text-[10px] text-gray-400 uppercase">{new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {type.replace('_', ' ')}</p>
        </div>
      </div>

      {/* Content */}
      <div className="py-2">
        {type === 'habit_completion' ? (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] bg-[#00FF85] text-black font-bold px-2 py-1 self-start border-[1px] border-black">
              COMPLETED
            </span>
            <p className="text-[#E3DAC9] font-medium text-lg leading-tight">
              Selesai mengerjakan <span className="text-[#00FF85]">{metadata?.habit_name || content}</span>
            </p>
          </div>
        ) : type === 'streak' ? (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] bg-orange-500 text-black font-bold px-2 py-1 self-start border-[1px] border-black uppercase">
              STREAK ON FIRE
            </span>
            <p className="text-[#E3DAC9] font-medium text-lg leading-tight">
              Mencapai <span className="text-orange-500">{metadata?.count} HARI</span> berturut-turut!
            </p>
          </div>
        ) : (
          <p className="text-[#E3DAC9] leading-relaxed">{content}</p>
        )}
      </div>

      {/* Reactions */}
      <div className="flex items-center gap-2 mt-1">
        {Object.entries(reactions).map(([emoji, count]) => (
          <button
            key={emoji}
            onClick={() => handleReact(emoji)}
            className="flex items-center gap-1.5 bg-[#1A1A1A] border-[1px] border-black px-2 py-1 hover:bg-[#333] transition-colors active:scale-95"
          >
            <span>{emoji}</span>
            <span className="text-[10px] font-bold text-[#E3DAC9]">{count}</span>
          </button>
        ))}
        <button className="ml-auto text-[10px] font-bold text-gray-500 uppercase hover:text-[#00FF85]">
          COMMENT
        </button>
      </div>

      {/* Rin Snarky Comment */}
      <div className="mt-2 bg-[#1A1A1A] border-l-[3px] border-[#00FF85] p-3 relative">
        <div className="absolute -top-2.5 right-3 bg-[#00FF85] text-black text-[8px] font-black px-1.5 py-0.5 border-[1px] border-black">
          RIN.EXE
        </div>
        <p className="text-[11px] text-gray-300 italic leading-snug">
          "{rinComment}"
        </p>
      </div>
    </motion.div>
  );
};

export default FeedCard;
