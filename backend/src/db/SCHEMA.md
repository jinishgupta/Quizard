# Database Schema Documentation

## Overview

This document describes the database schema for the Production-Ready Trivia Platform. The schema is designed for PostgreSQL (via Supabase) and supports Orange ID authentication, quiz gameplay, league competition, credit tracking, and telemetry.

## Key Design Decisions

### No Questions Table
Questions are **NOT** stored in the database. All questions are generated on-demand by Google Gemini AI based on category and difficulty. This approach:
- Ensures fresh, varied questions
- Eliminates question pool exhaustion
- Reduces database storage requirements
- Allows dynamic difficulty adjustment

### Question Storage in Answers
Since questions aren't persisted, the `session_answers` table stores the question text along with each answer. This allows:
- Historical review of what was asked
- Performance analysis per question type
- Audit trail for user sessions

## Tables

### users
Stores user profiles with Orange ID integration.

**Key Fields:**
- `orange_id` - Unique identifier from Orange ID (Bedrock Passport)
- `eth_address` - Ethereum wallet address from Orange profile
- `credits` - In-game currency balance (synced with Orange Game Pass)
- `current_streak` / `best_streak` - Daily play streak tracking
- `total_rounds` / `total_correct` / `total_questions` - Lifetime statistics

**Indexes:**
- `orange_id`, `email`, `username`, `eth_address` for lookups
- `last_play_date` for streak calculations

### categories
Quiz categories (seeded with 10 categories).

**Seeded Categories:**
- Science 🔬
- History 📜
- Geography 🌍
- Sports ⚽
- Entertainment 🎬
- Technology 💻
- Literature 📚
- Art 🎨
- Music 🎵
- Food & Drink 🍕

### game_sessions
Tracks individual quiz sessions.

**Key Fields:**
- `difficulty` - easy, medium, or hard
- `status` - active, completed, or abandoned
- `score` - Total points earned
- `avg_time_per_question` - Performance metric

**Indexes:**
- `user_id`, `status`, `completed_at`, `category_id`

### session_answers
Individual answer records (includes question text).

**Key Fields:**
- `question_text` - The question that was asked (stored here since no questions table)
- `correct_answer` - The correct answer
- `user_answer` - What the user answered
- `is_correct` - Boolean correctness
- `time_spent` - Seconds taken to answer
- `points_earned` - Points awarded for this answer

### league_scores
Weekly league rankings and scores.

**Key Fields:**
- `week_number` / `year` - ISO week identification
- `tier` - Bronze, Silver, Gold, Platinum, or Diamond
- `weekly_score` - Points accumulated this week
- `rank` - Position in tier
- `tier_change` - promoted, demoted, or maintained

**Indexes:**
- Composite index on `(week_number, year)` for weekly queries
- `tier` and `weekly_score DESC` for leaderboards

### category_mastery
User progress and mastery levels per category.

**Key Fields:**
- `mastery_level` - Beginner, Novice, Adept, or Expert
- `progress_percentage` - 0-100 progress to next level
- `total_questions` / `correct_answers` - Statistics

**Mastery Thresholds:**
- **Beginner**: 0-19 questions
- **Novice**: 20+ questions, 60%+ accuracy
- **Adept**: 50+ questions, 70%+ accuracy
- **Expert**: 100+ questions, 80%+ accuracy

### badges
Achievement definitions (seeded with 20 badges).

**Rarity Levels:**
- **Common**: Easy achievements (5 badges)
- **Rare**: Moderate difficulty (6 badges)
- **Epic**: Hard achievements (5 badges)
- **Legendary**: Very hard achievements (5 badges)

**Criteria Format (JSONB):**
```json
{
  "type": "streak",
  "days": 7
}
```

### user_badges
Tracks which badges users have earned.

### weekly_digests
AI-generated performance summaries.

**Key Fields:**
- `summary` - Overall performance text
- `strengths` - Array of strength areas
- `suggestions` - Array of improvement suggestions
- `fun_fact` - Optional interesting fact

### challenges
Real-time player vs player matches.

**Key Fields:**
- `challenger_id` / `opponent_id` - The two players
- `status` - pending, active, completed, or cancelled
- `winner_id` - Winner (null for ties)
- `challenger_score` / `opponent_score` - Final scores

### credit_transactions
Orange Game Pass credit tracking.

**Key Fields:**
- `transaction_type` - earn, spend, or sync
- `orange_transaction_id` - Transaction ID from Orange Game Pass API
- `balance_after` - Credit balance after transaction
- `metadata` - Additional transaction data (JSONB)

**Indexes:**
- `user_id`, `transaction_type`, `orange_transaction_id`, `created_at`

### telemetry_events
Competition engagement metrics for Orange Agent Jam.

**Event Types:**
- `session` - Quiz session completion
- `credit_redemption` - Orange Game Pass credit usage
- `ai_usage` - AI feature interaction
- `challenge` - PvP challenge participation

**Event Data (JSONB):**
Flexible structure based on event type.

## Helper Functions

### increment_user_stats
Atomically increments user statistics after session completion.

### calculate_mastery_level
Calculates mastery level and progress based on questions and accuracy.

### update_category_mastery
Updates or creates category mastery record after answering questions.

### calculate_streak
Calculates new streak based on last play date.

### add_league_score
Adds points to user's current league score.

### record_credit_transaction
Records a credit transaction and updates user balance.

### record_telemetry_event
Records a telemetry event for competition tracking.

### get_current_week
Returns the current ISO week number and year.

## Performance Optimizations

### Indexes
- All foreign keys are indexed
- Frequently queried fields have dedicated indexes
- Composite indexes for common query patterns

### Triggers
- `updated_at` automatically updated on row changes
- Applied to: users, league_scores, category_mastery

### Constraints
- Foreign keys with CASCADE delete for data integrity
- CHECK constraints for enum-like fields
- UNIQUE constraints for preventing duplicates

## Data Integrity

### Referential Integrity
- All foreign keys use `ON DELETE CASCADE` to maintain consistency
- Deleting a user cascades to all related records

### Validation
- CHECK constraints enforce valid enum values
- NOT NULL constraints on required fields
- UNIQUE constraints prevent duplicates

### Atomicity
- Helper functions use transactions implicitly
- Credit transactions are atomic (balance update + transaction record)

## Migration System

Migrations are tracked in the `migrations` table and run in order:

1. `001_initial_schema.sql` - Creates all tables and indexes
2. `002_seed_data.sql` - Seeds categories and badges
3. `003_helper_functions.sql` - Creates database helper functions

## Usage Examples

### Creating a User from Orange ID
```javascript
const user = await User.upsertFromOrangeId(orangeUserData);
```

### Creating a Game Session
```javascript
const session = await GameSession.create(userId, categoryId, 'medium');
```

### Recording an Answer
```javascript
await GameSession.recordAnswer(
  sessionId,
  questionText,
  correctAnswer,
  userAnswer,
  isCorrect,
  timeSpent,
  pointsEarned
);
```

### Completing a Session
```javascript
const result = await GameSession.complete(sessionId);
// Returns: { session, answers }
```

### Updating Category Mastery
```sql
SELECT update_category_mastery(user_id, category_id, questions_answered, correct_answers);
```

### Recording Credit Transaction
```sql
SELECT record_credit_transaction(
  user_id,
  amount,
  'earn',
  'Session completion',
  NULL,
  '{"session_id": "..."}'::jsonb
);
```

## Backup and Maintenance

### Recommended Backups
- Full backup: Daily at 2 AM UTC
- Incremental backup: Every 6 hours
- Retention: 30 days

### Maintenance Tasks
- Weekly VACUUM ANALYZE on large tables
- Monthly index rebuild if needed
- Quarterly review of slow queries

## Security Considerations

### Row Level Security (RLS)
Consider enabling RLS in Supabase for:
- Users can only read/update their own data
- Admin-only access to certain tables
- Public read access to categories and badges

### Sensitive Data
- No passwords stored (Orange ID handles auth)
- Credit transactions include Orange transaction IDs for audit
- Telemetry events may contain PII - handle carefully
