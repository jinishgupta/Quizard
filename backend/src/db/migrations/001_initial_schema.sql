-- Production-Ready Trivia Platform - Initial Database Schema
-- Migration: 001_initial_schema
-- Description: Creates all tables, indexes, and constraints for the trivia platform
-- Note: NO questions table - all questions generated on-demand by Gemini AI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orange_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar VARCHAR(255),
  banner VARCHAR(255),
  eth_address VARCHAR(42),
  provider VARCHAR(50),
  credits INTEGER DEFAULT 100,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_play_date DATE,
  total_rounds INTEGER DEFAULT 0,
  total_correct INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_orange_id ON users(orange_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_eth_address ON users(eth_address);
CREATE INDEX idx_users_last_play_date ON users(last_play_date);

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_active ON categories(is_active);

-- ============================================================================
-- GAME SESSIONS TABLE
-- ============================================================================
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  avg_time_per_question DECIMAL(5,2),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_sessions_status ON game_sessions(status);
CREATE INDEX idx_sessions_completed_at ON game_sessions(completed_at);
CREATE INDEX idx_sessions_category ON game_sessions(category_id);

-- ============================================================================
-- SESSION ANSWERS TABLE
-- ============================================================================
CREATE TABLE session_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_spent INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_answers_session ON session_answers(session_id);
CREATE INDEX idx_answers_correct ON session_answers(is_correct);

-- ============================================================================
-- LEAGUE SCORES TABLE
-- ============================================================================
CREATE TABLE league_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond')),
  weekly_score INTEGER DEFAULT 0,
  rank INTEGER,
  tier_change VARCHAR(20) CHECK (tier_change IN ('promoted', 'demoted', 'maintained')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, week_number, year)
);

CREATE INDEX idx_league_week ON league_scores(week_number, year);
CREATE INDEX idx_league_tier ON league_scores(tier);
CREATE INDEX idx_league_user ON league_scores(user_id);
CREATE INDEX idx_league_score ON league_scores(weekly_score DESC);

-- ============================================================================
-- CATEGORY MASTERY TABLE
-- ============================================================================
CREATE TABLE category_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  mastery_level VARCHAR(20) DEFAULT 'Beginner' CHECK (mastery_level IN ('Beginner', 'Novice', 'Adept', 'Expert')),
  progress_percentage INTEGER DEFAULT 0,
  last_played TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category_id)
);

CREATE INDEX idx_mastery_user ON category_mastery(user_id);
CREATE INDEX idx_mastery_category ON category_mastery(category_id);
CREATE INDEX idx_mastery_level ON category_mastery(mastery_level);

-- ============================================================================
-- BADGES TABLE
-- ============================================================================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  emoji VARCHAR(10) NOT NULL,
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  criteria JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_badges_rarity ON badges(rarity);
CREATE INDEX idx_badges_active ON badges(is_active);

-- ============================================================================
-- USER BADGES TABLE
-- ============================================================================
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);

-- ============================================================================
-- WEEKLY DIGESTS TABLE
-- ============================================================================
CREATE TABLE weekly_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  summary TEXT NOT NULL,
  strengths TEXT[] NOT NULL,
  suggestions TEXT[] NOT NULL,
  fun_fact TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, week_number, year)
);

CREATE INDEX idx_digests_user ON weekly_digests(user_id);
CREATE INDEX idx_digests_week ON weekly_digests(week_number, year);

-- ============================================================================
-- CHALLENGES TABLE
-- ============================================================================
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES users(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  winner_id UUID REFERENCES users(id),
  challenger_score INTEGER DEFAULT 0,
  opponent_score INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_challenges_users ON challenges(challenger_id, opponent_id);
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_created ON challenges(created_at);

-- ============================================================================
-- CREDIT TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'sync')),
  reason VARCHAR(255) NOT NULL,
  orange_transaction_id VARCHAR(255),
  balance_after INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_orange ON credit_transactions(orange_transaction_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at);

-- ============================================================================
-- TELEMETRY EVENTS TABLE
-- ============================================================================
CREATE TABLE telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('session', 'credit_redemption', 'ai_usage', 'challenge')),
  event_data JSONB NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telemetry_user ON telemetry_events(user_id);
CREATE INDEX idx_telemetry_type ON telemetry_events(event_type);
CREATE INDEX idx_telemetry_timestamp ON telemetry_events(timestamp);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_league_scores_updated_at BEFORE UPDATE ON league_scores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_mastery_updated_at BEFORE UPDATE ON category_mastery
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
