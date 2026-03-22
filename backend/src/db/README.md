# Database Setup

This directory contains the database schema, migrations, and connection utilities for the Production-Ready Trivia Platform.

## Overview

The platform uses **PostgreSQL** via **Supabase** as the database backend. All questions are generated on-demand by Google Gemini AI - there is NO questions table in the schema.

## Database Schema

### Tables

1. **users** - User profiles with Orange ID integration
2. **categories** - Quiz categories (seeded with 10 categories)
3. **game_sessions** - Quiz session tracking
4. **session_answers** - Individual answer records (stores question text)
5. **league_scores** - Weekly league rankings and scores
6. **category_mastery** - User progress per category
7. **badges** - Achievement definitions (seeded with 20 badges)
8. **user_badges** - User badge awards
9. **weekly_digests** - AI-generated performance summaries
10. **challenges** - Real-time player vs player matches
11. **credit_transactions** - Orange Game Pass credit tracking
12. **telemetry_events** - Competition engagement metrics

### Key Design Decisions

- **No Questions Table**: All questions are generated on-demand by Gemini AI based on category and difficulty
- **Session Answers Store Question Text**: Since questions aren't persisted, we store the question text with each answer
- **Orange ID Integration**: Users table includes orange_id, eth_address, and other Orange profile fields
- **Telemetry for Competition**: Comprehensive event tracking for Orange Agent Jam scoring

## Setup Instructions

### 1. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Migrations

```bash
npm run migrate
```

This will:
- Create all database tables with proper indexes
- Seed 10 quiz categories
- Seed 20 achievement badges
- Set up triggers for updated_at timestamps

### 4. Verify Setup

Check that all tables were created:

```bash
node src/db/verify.js
```

## Migration System

Migrations are tracked in the `migrations` table. Each migration runs only once.

### Migration Files

- `001_initial_schema.sql` - Creates all tables, indexes, and constraints
- `002_seed_data.sql` - Seeds categories and badges

### Adding New Migrations

1. Create a new file: `003_your_migration.sql`
2. Add the filename to the `migrations` array in `migrate.js`
3. Run `npm run migrate`

## Database Connection

The application uses two connection methods:

1. **Supabase Client** (`src/db/index.js`) - For application queries
2. **pg Pool** (`src/db/migrate.js`) - For running migrations

## Performance Optimizations

### Indexes

The schema includes indexes on:
- User lookups (orange_id, email, username, eth_address)
- Session queries (user_id, status, completed_at)
- League rankings (week_number, year, tier, score)
- Telemetry queries (user_id, event_type, timestamp)
- Credit transactions (user_id, type, orange_transaction_id)

### Constraints

- Foreign keys with CASCADE delete for data integrity
- CHECK constraints for enum-like fields
- UNIQUE constraints for preventing duplicates

## Troubleshooting

### Connection Issues

If you get connection errors:
1. Verify your `DATABASE_URL` is correct
2. Check that your Supabase project is active
3. Ensure your IP is allowed in Supabase settings

### Migration Failures

If a migration fails:
1. Check the error message in the console
2. Manually fix any issues in the database
3. Remove the failed migration from the `migrations` table
4. Re-run `npm run migrate`

### Reset Database

To completely reset the database:

```sql
-- Drop all tables (in Supabase SQL editor)
DROP TABLE IF EXISTS telemetry_events CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS weekly_digests CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS category_mastery CASCADE;
DROP TABLE IF EXISTS league_scores CASCADE;
DROP TABLE IF EXISTS session_answers CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS migrations CASCADE;
```

Then run migrations again: `npm run migrate`
