-- Create user_stats table for RPG progression system
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  stat_kebijaksanaan integer NOT NULL DEFAULT 0,
  stat_kepercayaan_diri integer NOT NULL DEFAULT 0,
  stat_kekuatan integer NOT NULL DEFAULT 0,
  stat_disiplin integer NOT NULL DEFAULT 0,
  stat_fokus integer NOT NULL DEFAULT 0,
  daily_xp_earned integer NOT NULL DEFAULT 0,
  daily_feed_xp_earned integer NOT NULL DEFAULT 0,
  daily_journal_count integer NOT NULL DEFAULT 0,
  daily_stat_kebijaksanaan integer NOT NULL DEFAULT 0,
  daily_stat_kepercayaan_diri integer NOT NULL DEFAULT 0,
  daily_stat_kekuatan integer NOT NULL DEFAULT 0,
  daily_stat_disiplin integer NOT NULL DEFAULT 0,
  daily_stat_fokus integer NOT NULL DEFAULT 0,
  last_reset_date date NOT NULL DEFAULT CURRENT_DATE,
  migration_completed boolean NOT NULL DEFAULT false,
  completed_todo_ids text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own row
CREATE POLICY "Users can view own stats"
  ON public.user_stats
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON public.user_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON public.user_stats
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add constraint checks
ALTER TABLE public.user_stats
  ADD CONSTRAINT user_stats_level_range CHECK (level >= 1 AND level <= 100),
  ADD CONSTRAINT user_stats_total_xp_non_negative CHECK (total_xp >= 0),
  ADD CONSTRAINT user_stats_daily_xp_range CHECK (daily_xp_earned >= 0 AND daily_xp_earned <= 1000),
  ADD CONSTRAINT user_stats_daily_feed_xp_range CHECK (daily_feed_xp_earned >= 0 AND daily_feed_xp_earned <= 200),
  ADD CONSTRAINT user_stats_daily_journal_range CHECK (daily_journal_count >= 0 AND daily_journal_count <= 5);
