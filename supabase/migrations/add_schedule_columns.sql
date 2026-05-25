-- Migration: Add schedule columns to habits table
-- Feature: Habit Schedule System
-- Requirements: 1.1, 1.2, 1.6, 7.3
--
-- Adds schedule_type and schedule_days columns to support daily, weekly, and custom scheduling.
-- Existing habits default to 'daily' with all 7 days active [0,1,2,3,4,5,6].

-- Add schedule_type column with CHECK constraint
ALTER TABLE habits ADD COLUMN IF NOT EXISTS schedule_type TEXT NOT NULL DEFAULT 'daily';

-- Add CHECK constraint for schedule_type values (use DO block to handle if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'habits_schedule_type_check'
  ) THEN
    ALTER TABLE habits ADD CONSTRAINT habits_schedule_type_check
      CHECK (schedule_type IN ('daily', 'weekly', 'custom'));
  END IF;
END $$;

-- Add schedule_days column (integer array)
ALTER TABLE habits ADD COLUMN IF NOT EXISTS schedule_days INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}';

-- Populate existing rows to ensure defaults are set
UPDATE habits
SET schedule_type = 'daily'
WHERE schedule_type IS NULL;

UPDATE habits
SET schedule_days = '{0,1,2,3,4,5,6}'
WHERE schedule_days IS NULL;
