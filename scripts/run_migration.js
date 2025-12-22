// Run migration for Enhanced Conversions
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:kbwksBtAiRaXWUPkwYMAZJpNLrpZPqGl@switchyard.proxy.rlwy.net:22428/railway';

const migration = `
-- 1. Create lead_attribution table
CREATE TABLE IF NOT EXISTS lead_attribution (
  project_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  click_id_hash TEXT,
  first_click_ts TIMESTAMPTZ,
  last_message_ts TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, phone_e164)
);

-- 2. Add new columns to conversions
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS lead_email TEXT;
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS lead_name TEXT;
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS email_sha256 TEXT;
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS phone_sha256 TEXT;

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_conversions_email_sha256 ON conversions(email_sha256);
CREATE INDEX IF NOT EXISTS idx_conversions_phone_sha256 ON conversions(phone_sha256);
CREATE INDEX IF NOT EXISTS idx_lead_attribution_expires ON lead_attribution(project_id, phone_e164, expires_at);
`;

async function runMigration() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✓ Connected to Railway PostgreSQL');

        // Run migration statements one by one
        const statements = migration.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

        for (const stmt of statements) {
            if (stmt.trim()) {
                try {
                    await client.query(stmt);
                    console.log('✓ Executed:', stmt.substring(0, 60).replace(/\n/g, ' ') + '...');
                } catch (err) {
                    // Ignore "already exists" errors
                    if (!err.message.includes('already exists')) {
                        console.log('⚠ Warning:', err.message);
                    } else {
                        console.log('✓ Already exists:', stmt.substring(0, 50).replace(/\n/g, ' ') + '...');
                    }
                }
            }
        }

        // Verify schema
        const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
        console.log('\n📋 Tables in database:');
        tables.rows.forEach(r => console.log('  -', r.table_name));

        // Verify lead_attribution columns
        const leadAttrCols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'lead_attribution'
      ORDER BY ordinal_position
    `);
        console.log('\n📋 lead_attribution columns:');
        leadAttrCols.rows.forEach(r => console.log('  -', r.column_name, ':', r.data_type));

        // Verify conversions new columns
        const convCols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'conversions' 
      AND column_name IN ('lead_email', 'lead_name', 'email_sha256', 'phone_sha256')
      ORDER BY ordinal_position
    `);
        console.log('\n📋 conversions (new columns):');
        convCols.rows.forEach(r => console.log('  -', r.column_name, ':', r.data_type));

        console.log('\n✅ Migration completed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
