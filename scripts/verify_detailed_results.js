const { Client } = require('pg');
const connectionString = 'postgresql://postgres:kbwksBtAiRaXWUPkwYMAZJpNLrpZPqGl@switchyard.proxy.rlwy.net:22428/railway';

async function verifyDetailedResults() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();

        console.log('--- LEAD ATTRIBUTION (Recientes) ---');
        const la = await client.query("SELECT * FROM lead_attribution WHERE project_id = 'test-color-tapetes' OR updated_at > NOW() - INTERVAL '1 hour'");
        if (la.rows.length === 0) {
            console.log('No se encontraron registros de atribución aún.');
        } else {
            console.table(la.rows);
        }

        console.log('\n--- CONVERSIONS (Enhanced Columns Check) ---');
        const conv = await client.query(`
            SELECT 
                phone_e164, 
                lead_name, 
                lead_email, 
                LEFT(email_sha256, 12) as email_hash, 
                LEFT(phone_sha256, 12) as phone_hash,
                conversion_name,
                created_at
            FROM conversions 
            WHERE project_id = 'test-color-tapetes' 
            AND (lead_name IS NOT NULL OR email_sha256 IS NOT NULL OR phone_sha256 IS NOT NULL)
            ORDER BY created_at DESC
        `);
        if (conv.rows.length === 0) {
            console.log('Aún no hay conversiones procesadas con datos mejorados (lead_name, hashes).');
        } else {
            console.table(conv.rows);
        }

    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await client.end();
    }
}

verifyDetailedResults();
