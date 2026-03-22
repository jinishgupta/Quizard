import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse Supabase connection string
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Create PostgreSQL connection
const sql = postgres(connectionString, {
  ssl: 'require',
  max: 1, // Single connection for migrations
});

// Migration files in order
const migrations = [
  '001_initial_schema.sql',
  '002_seed_data.sql',
  '003_helper_functions.sql',
];

async function runMigration(filename) {
  const filePath = join(__dirname, 'migrations', filename);
  const sqlContent = readFileSync(filePath, 'utf8');
  
  console.log(`\n📄 Running migration: ${filename}`);
  
  try {
    await sql.unsafe(sqlContent);
    console.log(`✅ Migration ${filename} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Migration ${filename} failed:`, error.message);
    throw error;
  }
}

async function createMigrationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  try {
    await sql.unsafe(query);
    console.log('✅ Migrations table ready');
  } catch (error) {
    console.error('❌ Failed to create migrations table:', error.message);
    throw error;
  }
}

async function getMigratedFiles() {
  try {
    const result = await sql`SELECT filename FROM migrations ORDER BY id`;
    return result.map(row => row.filename);
  } catch (error) {
    return [];
  }
}

async function recordMigration(filename) {
  await sql`INSERT INTO migrations (filename) VALUES (${filename})`;
}

async function migrate() {
  console.log('🚀 Starting database migration...\n');
  
  try {
    // Test connection
    await sql`SELECT NOW()`;
    console.log('✅ Database connection established');
    
    // Create migrations tracking table
    await createMigrationsTable();
    
    // Get already executed migrations
    const executedMigrations = await getMigratedFiles();
    console.log(`\n📊 Found ${executedMigrations.length} previously executed migrations`);
    
    // Run pending migrations
    let newMigrations = 0;
    for (const migration of migrations) {
      if (executedMigrations.includes(migration)) {
        console.log(`⏭️  Skipping ${migration} (already executed)`);
        continue;
      }
      
      await runMigration(migration);
      await recordMigration(migration);
      newMigrations++;
    }
    
    console.log(`\n✨ Migration complete! Executed ${newMigrations} new migration(s)`);
    
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run migrations
migrate();
