-- High Scores Table for Alin's Basement
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jchypxfwvgdnhrshvgbz/sql

-- Create the alingame schema
CREATE SCHEMA IF NOT EXISTS alingame;

-- Create high_scores table in alingame schema
CREATE TABLE IF NOT EXISTS alingame.high_scores (
  id BIGSERIAL PRIMARY KEY,
  player_name VARCHAR(50) NOT NULL DEFAULT 'Anonymous',
  score INTEGER NOT NULL DEFAULT 0,
  sanity_remaining INTEGER NOT NULL DEFAULT 0,
  time_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_high_scores_score ON alingame.high_scores(score DESC);

-- Enable Row Level Security
ALTER TABLE alingame.high_scores ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read high scores (drop first if exists for re-runs)
DROP POLICY IF EXISTS "Anyone can read high scores" ON alingame.high_scores;
CREATE POLICY "Anyone can read high scores" ON alingame.high_scores
  FOR SELECT USING (true);

-- Allow anyone to insert high scores (no auth required for arcade-style game)
DROP POLICY IF EXISTS "Anyone can insert high scores" ON alingame.high_scores;
CREATE POLICY "Anyone can insert high scores" ON alingame.high_scores
  FOR INSERT WITH CHECK (true);

-- Game Saves Table (for future use)
CREATE TABLE IF NOT EXISTS alingame.game_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name VARCHAR(50) NOT NULL DEFAULT 'Anonymous',
  score INTEGER NOT NULL DEFAULT 0,
  sanity INTEGER NOT NULL DEFAULT 100,
  health INTEGER NOT NULL DEFAULT 5,
  stamina INTEGER NOT NULL DEFAULT 100,
  mission TEXT NOT NULL DEFAULT 'Boot up the main server',
  game_state VARCHAR(20) NOT NULL DEFAULT 'menu',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for game_saves
ALTER TABLE alingame.game_saves ENABLE ROW LEVEL SECURITY;

-- Public read/write for game saves (no auth) - drop first for re-runs
DROP POLICY IF EXISTS "Anyone can read game saves" ON alingame.game_saves;
CREATE POLICY "Anyone can read game saves" ON alingame.game_saves
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert game saves" ON alingame.game_saves;
CREATE POLICY "Anyone can insert game saves" ON alingame.game_saves
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update game saves" ON alingame.game_saves;
CREATE POLICY "Anyone can update game saves" ON alingame.game_saves
  FOR UPDATE USING (true);

-- Collision Boxes Table (for level editor)
CREATE TABLE IF NOT EXISTS alingame.collision_boxes (
  id BIGSERIAL PRIMARY KEY,
  level_name VARCHAR(50) NOT NULL DEFAULT 'level1',
  boxes JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on level_name for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_collision_boxes_level ON alingame.collision_boxes(level_name);

-- Enable RLS for collision_boxes
ALTER TABLE alingame.collision_boxes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read collision boxes" ON alingame.collision_boxes;
CREATE POLICY "Anyone can read collision boxes" ON alingame.collision_boxes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert collision boxes" ON alingame.collision_boxes;
CREATE POLICY "Anyone can insert collision boxes" ON alingame.collision_boxes
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update collision boxes" ON alingame.collision_boxes;
CREATE POLICY "Anyone can update collision boxes" ON alingame.collision_boxes
  FOR UPDATE USING (true);

-- Grant usage on schema to anon and authenticated roles
GRANT USAGE ON SCHEMA alingame TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA alingame TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA alingame TO anon, authenticated;
