// Verify complete schema for n8n workflows
const { Client } = require('pg');

const connectionString = 'postgresql://postgres:kbwksBtAiRaXWUPkwYMAZJpNLrpZPqGl@switchyard.proxy.rlwy.net:22428/railway';

async function verify() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to Railway PostgreSQL\n');

        // 1. Verify all tables exist
        console.log('═══════════════════════════════════════════════');
        console.log('📋 TABLES CHECK');
        console.log('═══════════════════════════════════════════════');
        const requiredTables = ['clients_config', 'events', 'conversions', 'lead_attribution'];
        const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        const existingTables = tables.rows.map(r => r.table_name);

        for (const t of requiredTables) {
            const exists = existingTables.includes(t);
            console.log(`  ${exists ? '✓' : '✗'} ${t}`);
        }

        // 2. Verify conversions columns
        console.log('\n═══════════════════════════════════════════════');
        console.log('📋 CONVERSIONS TABLE COLUMNS');
        console.log('═══════════════════════════════════════════════');
        const convCols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'conversions'
      ORDER BY ordinal_position
    `);
        convCols.rows.forEach(r => {
            const nullable = r.is_nullable === 'YES' ? '(nullable)' : '(not null)';
            console.log(`  - ${r.column_name}: ${r.data_type} ${nullable}`);
        });

        // 3. Verify lead_attribution columns
        console.log('\n═══════════════════════════════════════════════');
        console.log('📋 LEAD_ATTRIBUTION TABLE COLUMNS');
        console.log('═══════════════════════════════════════════════');
        const leadCols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'lead_attribution'
      ORDER BY ordinal_position
    `);
        leadCols.rows.forEach(r => {
            const nullable = r.is_nullable === 'YES' ? '(nullable)' : '(not null)';
            console.log(`  - ${r.column_name}: ${r.data_type} ${nullable}`);
        });

        // 4. Verify indexes
        console.log('\n═══════════════════════════════════════════════');
        console.log('📋 INDEXES CHECK');
        console.log('═══════════════════════════════════════════════');
        const indexes = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `);
        indexes.rows.forEach(r => {
            console.log(`  ✓ ${r.indexname} (${r.tablename})`);
        });

        // 5. Check clients_config
        console.log('\n═══════════════════════════════════════════════');
        console.log('📋 ACTIVE CLIENTS');
        console.log('═══════════════════════════════════════════════');
        const clients = await client.query(`
      SELECT project_id, client_name, status, 
             CASE WHEN prompt_template IS NOT NULL THEN 'Yes' ELSE 'No' END as has_prompt,
             CASE WHEN sheet_spreadsheet_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_sheet
      FROM clients_config
      ORDER BY project_id
    `);
        clients.rows.forEach(r => {
            console.log(`  - ${r.project_id} (${r.client_name}): ${r.status}, prompt: ${r.has_prompt}, sheet: ${r.has_sheet}`);
        });

        // 6. Quick stats
        console.log('\n═══════════════════════════════════════════════');
        console.log('📊 DATA STATS');
        console.log('═══════════════════════════════════════════════');

        const eventCount = await client.query('SELECT COUNT(*) as c FROM events');
        const convCount = await client.query('SELECT COUNT(*) as c FROM conversions');
        const attrCount = await client.query('SELECT COUNT(*) as c FROM lead_attribution');

        console.log(`  - events: ${eventCount.rows[0].c} rows`);
        console.log(`  - conversions: ${convCount.rows[0].c} rows`);
        console.log(`  - lead_attribution: ${attrCount.rows[0].c} rows`);

        console.log('\n✅ Schema verification complete!');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}

verify();
