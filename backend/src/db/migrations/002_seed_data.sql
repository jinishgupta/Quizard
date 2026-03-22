-- Production-Ready Trivia Platform - Seed Data
-- Migration: 002_seed_data
-- Description: Seeds initial categories and badges

-- ============================================================================
-- SEED CATEGORIES
-- ============================================================================
INSERT INTO categories (name, emoji, description, color, is_active) VALUES
  ('Science', '🔬', 'Test your knowledge of physics, chemistry, biology, and more', '#3B82F6', true),
  ('History', '📜', 'Journey through time with questions about historical events', '#8B5CF6', true),
  ('Geography', '🌍', 'Explore the world with questions about countries, capitals, and landmarks', '#10B981', true),
  ('Sports', '⚽', 'Challenge yourself with questions about athletes, teams, and competitions', '#F59E0B', true),
  ('Entertainment', '🎬', 'Test your knowledge of movies, music, TV shows, and celebrities', '#EC4899', true),
  ('Technology', '💻', 'Dive into the world of computers, gadgets, and innovation', '#6366F1', true),
  ('Literature', '📚', 'Explore the world of books, authors, and literary classics', '#14B8A6', true),
  ('Art', '🎨', 'Discover questions about paintings, artists, and art movements', '#F97316', true),
  ('Music', '🎵', 'Test your knowledge of songs, artists, and musical genres', '#EF4444', true),
  ('Food & Drink', '🍕', 'Explore culinary knowledge from cuisines to cooking techniques', '#84CC16', true);

-- ============================================================================
-- SEED BADGES
-- ============================================================================

-- Common Badges (Easy to achieve)
INSERT INTO badges (name, description, emoji, rarity, criteria, is_active) VALUES
  ('First Steps', 'Complete your first quiz session', '👶', 'common', '{"type": "sessions_completed", "count": 1}', true),
  ('Quick Learner', 'Answer 10 questions correctly', '🎯', 'common', '{"type": "correct_answers", "count": 10}', true),
  ('Dedicated', 'Play for 3 consecutive days', '📅', 'common', '{"type": "streak", "days": 3}', true),
  ('Explorer', 'Try 3 different categories', '🗺️', 'common', '{"type": "categories_played", "count": 3}', true),
  ('Rookie', 'Complete 5 quiz sessions', '🌟', 'common', '{"type": "sessions_completed", "count": 5}', true);

-- Rare Badges (Moderate difficulty)
INSERT INTO badges (name, description, emoji, rarity, criteria, is_active) VALUES
  ('Week Warrior', 'Play for 7 consecutive days', '🔥', 'rare', '{"type": "streak", "days": 7}', true),
  ('Perfectionist', 'Get 100% accuracy in a session with 10+ questions', '💯', 'rare', '{"type": "perfect_session", "min_questions": 10}', true),
  ('Speed Demon', 'Answer 5 questions in under 5 seconds each', '⚡', 'rare', '{"type": "fast_answers", "count": 5, "max_time": 5}', true),
  ('Category Master', 'Reach Expert level in any category', '🎓', 'rare', '{"type": "mastery_level", "level": "Expert", "count": 1}', true),
  ('Competitor', 'Win 5 player challenges', '🏆', 'rare', '{"type": "challenges_won", "count": 5}', true),
  ('Century Club', 'Answer 100 questions correctly', '💪', 'rare', '{"type": "correct_answers", "count": 100}', true);

-- Epic Badges (Hard to achieve)
INSERT INTO badges (name, description, emoji, rarity, criteria, is_active) VALUES
  ('Unstoppable', 'Maintain a 30-day streak', '🚀', 'epic', '{"type": "streak", "days": 30}', true),
  ('Polymath', 'Reach Expert level in 3 different categories', '🧠', 'epic', '{"type": "mastery_level", "level": "Expert", "count": 3}', true),
  ('League Champion', 'Finish in top 3 of your league tier', '👑', 'epic', '{"type": "league_rank", "max_rank": 3}', true),
  ('Knowledge Seeker', 'Answer 500 questions correctly', '📖', 'epic', '{"type": "correct_answers", "count": 500}', true),
  ('Challenger', 'Win 25 player challenges', '⚔️', 'epic', '{"type": "challenges_won", "count": 25}', true);

-- Legendary Badges (Very hard to achieve)
INSERT INTO badges (name, description, emoji, rarity, criteria, is_active) VALUES
  ('Eternal Flame', 'Maintain a 100-day streak', '🔥', 'legendary', '{"type": "streak", "days": 100}', true),
  ('Grand Master', 'Reach Expert level in all categories', '🌟', 'legendary', '{"type": "mastery_level", "level": "Expert", "count": 10}', true),
  ('Diamond League', 'Reach Diamond tier in the league system', '💎', 'legendary', '{"type": "league_tier", "tier": "Diamond"}', true),
  ('Trivia Legend', 'Answer 1000 questions correctly', '🏅', 'legendary', '{"type": "correct_answers", "count": 1000}', true),
  ('Undefeated', 'Win 100 player challenges', '🥇', 'legendary', '{"type": "challenges_won", "count": 100}', true);
