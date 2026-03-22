import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Parse connection string
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function verifySchema() {
  console.log('🔍 Verifying database schema...\n');
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
    
    // Expected tables
    const expectedTables = [
      'users',
      'categories',
      'game_sessions',
      'session_answers',
      'league_scores',
      'category_mastery',
      'badges',
      'user_badges',
      'weekly_digests',
      'challenges',
      'credit_transactions',
      'telemetry_events',
      'migrations',
    ];
    
    // Check each table
    console.log('📊 Checking tables:\n');
    for (const table of expectedTables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [table]);
      
      const exists = result.rows[0].exists;
      console.log(`${exists ? '✅' : '❌'} ${table}`);
    }
    
    // Count records in seeded tables
    console.log('\n📈 Seeded data counts:\n');
    
    const categoriesCount = await pool.query('SELECT COUNT(*) FROM categories');
    console.log(`✅ Categories: ${categoriesCount.rows[0].count}`);
    
    const badgesCount = await pool.query('SELECT COUNT(*) FROM badges');
    console.log(`✅ Badges: ${badgesCount.rows[0].count}`);
    
    // Check indexes
    console.log('\n🔍 Checking indexes:\n');
    const indexResult = await pool.query(`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename IN (${expectedTables.map((_, i) => `$${i + 1}`).join(',')})
      ORDER BY tablename, indexname;
    `, expectedTables);
    
    console.log(`✅ Found ${indexResult.rows.length} indexes`);
    
    // Group indexes by table
    const indexesByTable = {};
    indexResult.rows.forEach(row => {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    });
    
    Object.entries(indexesByTable).forEach(([table, indexes]) => {
      console.log(`   ${table}: ${indexes.length} indexes`);
    });
    
    console.log('\n✨ Schema verification complete!\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verifySchema();
