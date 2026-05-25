-- Migration: Create nutrition tables for Calorie Tracker feature
-- Requirements: 9.1, 16.2, 18.1, 18.2, 18.7

-- =============================================================================
-- Table: nutrition_profiles
-- Stores user nutrition profile data and calculated targets
-- =============================================================================
CREATE TABLE nutrition_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  height INTEGER NOT NULL CHECK (height BETWEEN 100 AND 250),
  weight DECIMAL(5,1) NOT NULL CHECK (weight BETWEEN 20.0 AND 300.0),
  age INTEGER NOT NULL CHECK (age BETWEEN 13 AND 120),
  goal TEXT NOT NULL CHECK (goal IN (
    'lose_fat_keep_muscle',
    'aggressive_fat_loss',
    'lean_bulk',
    'bulk',
    'body_recomposition',
    'maintain_weight'
  )),
  activity_multiplier DECIMAL(4,3) NOT NULL CHECK (activity_multiplier IN (1.2, 1.375, 1.55, 1.725, 1.9)),
  dietary_preference TEXT NOT NULL DEFAULT 'no_preference' CHECK (dietary_preference IN (
    'no_preference',
    'vegetarian',
    'vegan',
    'keto',
    'paleo'
  )),
  target_weight DECIMAL(5,1) CHECK (target_weight BETWEEN 30.0 AND 300.0),
  duration_weeks INTEGER CHECK (duration_weeks IN (4, 8, 12, 16)),
  daily_calories INTEGER NOT NULL,
  protein_grams INTEGER NOT NULL,
  carbs_grams INTEGER NOT NULL,
  fat_grams INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS: Users can only access their own profile
ALTER TABLE nutrition_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile"
  ON nutrition_profiles
  FOR ALL
  USING (auth.uid() = user_id);

-- =============================================================================
-- Table: food_entries
-- Stores individual food log entries per user per date
-- =============================================================================
CREATE TABLE food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name TEXT NOT NULL CHECK (char_length(food_name) BETWEEN 1 AND 100),
  calories INTEGER NOT NULL CHECK (calories BETWEEN 0 AND 99999),
  protein DECIMAL(6,1) NOT NULL CHECK (protein BETWEEN 0 AND 9999.9),
  carbs DECIMAL(6,1) NOT NULL CHECK (carbs BETWEEN 0 AND 9999.9),
  fat DECIMAL(6,1) NOT NULL CHECK (fat BETWEEN 0 AND 9999.9),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'search', 'usda', 'ai_scan')),
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying entries by user and date (primary access pattern)
CREATE INDEX idx_food_entries_user_date ON food_entries(user_id, date);

-- Index for sync queries filtering by deletion status
CREATE INDEX idx_food_entries_sync ON food_entries(user_id, is_deleted);

-- RLS: Users can only access their own entries
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own entries"
  ON food_entries
  FOR ALL
  USING (auth.uid() = user_id);

-- =============================================================================
-- Table: food_items
-- Food database with seeded items and cached USDA/AI results
-- =============================================================================
CREATE TABLE food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_name TEXT NOT NULL,
  category TEXT NOT NULL,
  serving_description TEXT NOT NULL,
  serving_weight_grams DECIMAL(7,1) NOT NULL,
  calories INTEGER NOT NULL,
  protein DECIMAL(6,1) NOT NULL,
  carbs DECIMAL(6,1) NOT NULL,
  fat DECIMAL(6,1) NOT NULL,
  data_source TEXT NOT NULL CHECK (data_source IN ('seed', 'usda', 'ai')),
  usda_fdc_id INTEGER,
  search_terms TEXT[],  -- includes Indonesian translations for bilingual search
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIN index on search_terms array for fast array-contains queries
CREATE INDEX idx_food_items_search ON food_items USING GIN(search_terms);

-- GIN index on food_name for full-text search
CREATE INDEX idx_food_items_name ON food_items USING GIN(to_tsvector('simple', food_name));

-- RLS: All authenticated users can read, only insert cached items (usda/ai)
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read food items"
  ON food_items
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users insert cached items"
  ON food_items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND data_source IN ('usda', 'ai'));

-- =============================================================================
-- Table: food_translations
-- Indonesian-English food term mapping for bilingual search support
-- =============================================================================
CREATE TABLE food_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indonesian_term TEXT NOT NULL UNIQUE,
  english_term TEXT NOT NULL
);

-- RLS: All authenticated users can read translations
ALTER TABLE food_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read translations"
  ON food_translations
  FOR SELECT
  USING (auth.role() = 'authenticated');
