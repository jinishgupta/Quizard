# Backend Setup Guide

## Prerequisites

- Node.js 18+ installed
- Supabase account and project created
- Orange ID credentials (Bedrock Passport)
- Google Gemini API key

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to Project Settings > Database
4. Copy the connection string (URI format)
5. Go to Project Settings > API
6. Copy the Project URL and anon/public key

## Step 3: Configure Environment Variables

Edit the `.env` file and update the following:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

The Orange ID and Gemini API credentials are already configured in the .env file.

## Step 4: Run Database Migrations

```bash
npm run migrate
```

This will:
- Create all database tables
- Set up indexes for performance
- Seed 10 quiz categories
- Seed 20 achievement badges

## Step 5: Verify Database Setup

```bash
npm run db:verify
```

You should see:
- ✅ All 13 tables created
- ✅ 10 categories seeded
- ✅ 20 badges seeded
- ✅ Indexes created

## Step 6: Start the Server

```bash
npm run dev
```

The server will start on http://localhost:3000

## Database Schema Overview

### Core Tables

1. **users** - User profiles with Orange ID integration
2. **categories** - Quiz categories (10 seeded)
3. **game_sessions** - Quiz session tracking
4. **session_answers** - Answer records with question text
5. **league_scores** - Weekly league rankings
6. **category_mastery** - User progress per category
7. **badges** - Achievement definitions (20 seeded)
8. **user_badges** - User badge awards
9. **weekly_digests** - AI-generated summaries
10. **challenges** - Real-time PvP matches
11. **credit_transactions** - Orange Game Pass tracking
12. **telemetry_events** - Competition metrics

### Key Design Notes

- **No Questions Table**: Questions are generated on-demand by Gemini AI
- **Session Answers Store Questions**: Since questions aren't persisted, we store the question text with each answer
- **Orange ID Integration**: Users table includes orange_id, eth_address, and Orange profile fields

## Troubleshooting

### Connection Error

If you get a connection error:
1. Verify your DATABASE_URL is correct
2. Check that your Supabase project is active
3. Ensure your IP is allowed (Supabase allows all IPs by default)

### Migration Already Run

If migrations were already run, you'll see:
```
⏭️  Skipping 001_initial_schema.sql (already executed)
⏭️  Skipping 002_seed_data.sql (already executed)
```

This is normal and safe.

### Reset Database

To completely reset:

1. Go to Supabase SQL Editor
2. Run the reset script from `src/db/README.md`
3. Run `npm run migrate` again

## Next Steps

After setup:
1. Test the API endpoints
2. Verify Orange ID authentication flow
3. Test quiz session creation
4. Verify credit transactions
5. Test telemetry tracking

## API Documentation

See the main README.md for API endpoint documentation.
