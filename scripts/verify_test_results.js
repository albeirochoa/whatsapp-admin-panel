const { Client } = require('pg');
const connectionString = 'postgresql://postgres:kbwksBtAiRaXWUPkwYMAZJpNLrpZPqGl@switchyard.proxy.rlwy.net:22428/railway';

async function verifyResults() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();

        console.log('--- LEAD ATTRIBUTION ---');
        const la = await client.query("SELECT * FROM lead_attribution WHERE project_id = 'test-color-tapetes'");
        console.table(la.rows);

        console.log('\n--- CONVERSIONS (Enhanced) ---');
        const conv = await client.query("SELECT phone_e164, lead_email, email_sha256, phone_sha256, lead_name, conversion_name, attribution_method, ai_confidence FROM conversions WHERE project_id = 'test-color-tapetes' ORDER BY created_at DESC");
        console.table(conv.rows);

    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await client.end();
    }
}

verifyResults();
