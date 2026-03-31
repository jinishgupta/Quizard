import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    host: process.env.HOST || 'localhost',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  database: {
    url: process.env.DATABASE_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  },
  bedrock: {
    tenantId: process.env.BEDROCK_TENANT_ID,
    subscriptionKey: process.env.BEDROCK_SUBSCRIPTION_KEY,
    baseUrl: process.env.BEDROCK_BASE_URL,
    authCallbackUrl: process.env.BEDROCK_AUTH_CALLBACK_URL,
  },
  orange: {
    tenantCode: process.env.ORANGE_TENANT_CODE,
    gamePassApiUrl: process.env.ORANGE_GAME_PASS_API_URL,
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
  },
  league: {
    resetDay: parseInt(process.env.LEAGUE_RESET_DAY, 10) || 0,
    resetHour: parseInt(process.env.LEAGUE_RESET_HOUR, 10) || 0,
  },
  credits: {
    standardRound: parseInt(process.env.CREDITS_STANDARD_ROUND, 10) || 12,
    hintEliminate: parseInt(process.env.CREDITS_HINT_ELIMINATE, 10) || 6,
    hintClue: parseInt(process.env.CREDITS_HINT_CLUE, 10) || 6,
    hintFirstLetter: parseInt(process.env.CREDITS_HINT_FIRST_LETTER, 10) || 6,
    explanationPack: parseInt(process.env.CREDITS_EXPLANATION_PACK, 10) || 15,
    bonusRound: parseInt(process.env.CREDITS_BONUS_ROUND, 10) || 10,
    customQuiz: parseInt(process.env.CREDITS_CUSTOM_QUIZ, 10) || 30,
    sendChallenge: parseInt(process.env.CREDITS_SEND_CHALLENGE, 10) || 10,
    earlyDigest: parseInt(process.env.CREDITS_EARLY_DIGEST, 10) || 10,
  },
};

export function validateConfig() {
  const required = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'BEDROCK_TENANT_ID',
    'BEDROCK_SUBSCRIPTION_KEY',
    'ORANGE_TENANT_CODE',
    'GEMINI_API_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
