
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Friendship {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  sender?: {
    id: string;
    nickname: string;
    full_name: string;
  };
  friend_profile?: {
    id: string;
    nickname: string;
    full_name: string;
  };
}

interface SocialStore {
  friends: any[];
  pendingRequests: Friendship[];
  loading: boolean;
  fetchFriends: () => Promise<void>;
  fetchRequests: () => Promise<void>;
  sendFriendRequest: (receiverId: string) => Promise<boolean>;
  respondToRequest: (friendshipId: string, status: 'accepted' | 'blocked' | 'deleted') => Promise<void>;
  searchUsers: (query: string) => Promise<any[]>;
  fetchComments: (postId: string) => Promise<any[]>;
  addComment: (postId: string, content: string) => Promise<boolean>;
  deleteComment: (commentId: string) => Promise<boolean>;
}

export const useSocialStore = create<SocialStore>((set, get) => ({
  friends: [],
  pendingRequests: [],
  loading: false,

  fetchFriends: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ loading: true });
    
    // Fetch where user is sender OR receiver and status is accepted
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        sender:profiles!friendships_sender_id_fkey(id, nickname, full_name),
        receiver:profiles!friendships_receiver_id_fkey(id, nickname, full_name)
      `)
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (!error && data) {
      const processedFriends = data.map(f => {
        return f.sender_id === user.id ? f.receiver : f.sender;
      });
      set({ friends: processedFriends });
    }
    set({ loading: false });
  },

  fetchRequests: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        sender:profiles!friendships_sender_id_fkey(id, nickname, full_name)
      `)
      .eq('receiver_id', user.id)
      .eq('status', 'pending');

    if (!error && data) {
      set({ pendingRequests: data });
    }
  },

  sendFriendRequest: async (receiverId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('friendships')
      .insert([
        { sender_id: user.id, receiver_id: receiverId, status: 'pending' }
      ]);

    return !error;
  },

  respondToRequest: async (friendshipId: string, status: 'accepted' | 'blocked' | 'deleted') => {
    if (status === 'deleted') {
      await supabase.from('friendships').delete().eq('id', friendshipId);
    } else {
      await supabase
        .from('friendships')
        .update({ status })
        .eq('id', friendshipId);
    }
    
    await get().fetchFriends();
    await get().fetchRequests();
  },

  searchUsers: async (query: string) => {
    if (!query.trim()) return [];
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, full_name')
      .ilike('nickname', `%${query}%`)
      .limit(10);

    return error ? [] : data;
  },

  fetchComments: async (postId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles!comments_user_id_profiles_fkey(id, nickname)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    return error ? [] : data;
  },

  addComment: async (postId: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !content.trim()) return false;

    const { error } = await supabase
      .from('comments')
      .insert([{ post_id: postId, user_id: user.id, content }]);

    return !error;
  },

  deleteComment: async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    return !error;
  }
}));
