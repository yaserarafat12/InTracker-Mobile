-- Migration: Add intensity_value column to habit_logs table
-- Feature: Habit Intensity System
-- Requirement: 4.3 - THE habit_logs table SHALL include an intensity_value column of numeric type that accepts null values
--
-- This column stores the actual intensity value logged by the user when completing a numeric habit.
-- Single-action habits will have NULL in this column.
-- The existing unique constraint (user_id, habit_id, date) remains unchanged.

ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS intensity_value INTEGER DEFAULT NULL;
