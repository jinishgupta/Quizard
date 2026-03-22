-- Production-Ready Trivia Platform - Helper Functions
-- Migration: 003_helper_functions
-- Description: Creates database helper functions for common operations

-- ============================================================================
-- INCREMENT USER STATS FUNCTION
-- ============================================================================
-- Atomically increment user statistics after completing a session
CREATE OR REPLACE FUNCTION increment_user_stats(
  p_user_id UUID,
  p_rounds INTEGER,
  p_correct INTEGER,
  p_questions INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    total_rounds = total_rounds + p_rounds,
    total_correct = total_correct + p_correct,
    total_questions = total_questions + p_questions,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GET CURRENT WEEK NUMBER FUNCTION
-- ============================================================================
-- Returns the current ISO week number and year
CREATE OR REPLACE FUNCTION get_current_week()
RETURNS TABLE(week_number INTEGER, year INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(WEEK FROM CURRENT_DATE)::INTEGER as week_number,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER as year;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CALCULATE MASTERY LEVEL FUNCTION
-- ============================================================================
-- Calculates mastery level based on questions answered and accuracy
CREATE OR REPLACE FUNCTION calculate_mastery_level(
  p_total_questions INTEGER,
  p_correct_answers INTEGER
)
RETURNS TABLE(level VARCHAR(20), progress INTEGER) AS $$
DECLARE
  v_accuracy DECIMAL;
  v_level VARCHAR(20);
  v_progress INTEGER;
BEGIN
  -- Calculate accuracy percentage
  IF p_total_questions = 0 THEN
    v_accuracy := 0;
  ELSE
    v_accuracy := (p_correct_answers::DECIMAL / p_total_questions::DECIMAL) * 100;
  END IF;

  -- Determine level and progress
  IF p_total_questions >= 100 AND v_accuracy >= 80 THEN
    v_level := 'Expert';
    v_progress := LEAST(100, v_accuracy::INTEGER);
  ELSIF p_total_questions >= 50 AND v_accuracy >= 70 THEN
    v_level := 'Adept';
    v_progress := LEAST(100, ((p_total_questions::DECIMAL / 100) * 100)::INTEGER);
  ELSIF p_total_questions >= 20 AND v_accuracy >= 60 THEN
    v_level := 'Novice';
    v_progress := LEAST(100, ((p_total_questions::DECIMAL / 50) * 100)::INTEGER);
  ELSE
    v_level := 'Beginner';
    v_progress := LEAST(100, ((p_total_questions::DECIMAL / 20) * 100)::INTEGER);
  END IF;

  RETURN QUERY SELECT v_level, v_progress;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE CATEGORY MASTERY FUNCTION
-- ============================================================================
-- Updates or creates category mastery record after answering questions
CREATE OR REPLACE FUNCTION update_category_mastery(
  p_user_id UUID,
  p_category_id UUID,
  p_questions_answered INTEGER,
  p_correct_answers INTEGER
)
RETURNS void AS $$
DECLARE
  v_total_questions INTEGER;
  v_total_correct INTEGER;
  v_mastery_result RECORD;
BEGIN
  -- Insert or update mastery record
  INSERT INTO category_mastery (user_id, category_id, total_questions, correct_answers, last_played)
  VALUES (p_user_id, p_category_id, p_questions_answered, p_correct_answers, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id, category_id)
  DO UPDATE SET
    total_questions = category_mastery.total_questions + p_questions_answered,
    correct_answers = category_mastery.correct_answers + p_correct_answers,
    last_played = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  RETURNING total_questions, correct_answers INTO v_total_questions, v_total_correct;

  -- Calculate new mastery level
  SELECT * INTO v_mastery_result FROM calculate_mastery_level(v_total_questions, v_total_correct);

  -- Update mastery level and progress
  UPDATE category_mastery
  SET
    mastery_level = v_mastery_result.level,
    progress_percentage = v_mastery_result.progress,
    updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id AND category_id = p_category_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CALCULATE STREAK FUNCTION
-- ============================================================================
-- Calculates new streak based on last play date
CREATE OR REPLACE FUNCTION calculate_streak(
  p_last_play_date DATE,
  p_current_streak INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_today DATE;
  v_days_diff INTEGER;
BEGIN
  v_today := CURRENT_DATE;
  
  -- If never played before
  IF p_last_play_date IS NULL THEN
    RETURN 1;
  END IF;
  
  v_days_diff := v_today - p_last_play_date;
  
  -- Same day, no change
  IF v_days_diff = 0 THEN
    RETURN p_current_streak;
  -- Consecutive day, increment
  ELSIF v_days_diff = 1 THEN
    RETURN p_current_streak + 1;
  -- Missed days, reset
  ELSE
    RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ADD LEAGUE SCORE FUNCTION
-- ============================================================================
-- Adds points to user's current league score
CREATE OR REPLACE FUNCTION add_league_score(
  p_user_id UUID,
  p_points INTEGER,
  p_tier VARCHAR(20)
)
RETURNS void AS $$
DECLARE
  v_week_result RECORD;
BEGIN
  -- Get current week
  SELECT * INTO v_week_result FROM get_current_week();
  
  -- Insert or update league score
  INSERT INTO league_scores (user_id, week_number, year, tier, weekly_score)
  VALUES (p_user_id, v_week_result.week_number, v_week_result.year, p_tier, p_points)
  ON CONFLICT (user_id, week_number, year)
  DO UPDATE SET
    weekly_score = league_scores.weekly_score + p_points,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RECORD CREDIT TRANSACTION FUNCTION
-- ============================================================================
-- Records a credit transaction and updates user balance
CREATE OR REPLACE FUNCTION record_credit_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type VARCHAR(20),
  p_reason VARCHAR(255),
  p_orange_transaction_id VARCHAR(255) DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update user credits
  UPDATE users
  SET credits = credits + p_amount,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_user_id
  RETURNING credits INTO v_new_balance;
  
  -- Record transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    reason,
    orange_transaction_id,
    balance_after,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    p_transaction_type,
    p_reason,
    p_orange_transaction_id,
    v_new_balance,
    p_metadata
  );
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RECORD TELEMETRY EVENT FUNCTION
-- ============================================================================
-- Records a telemetry event for competition tracking
CREATE OR REPLACE FUNCTION record_telemetry_event(
  p_user_id UUID,
  p_event_type VARCHAR(50),
  p_event_data JSONB
)
RETURNS void AS $$
BEGIN
  INSERT INTO telemetry_events (user_id, event_type, event_data)
  VALUES (p_user_id, p_event_type, p_event_data);
END;
$$ LANGUAGE plpgsql;
