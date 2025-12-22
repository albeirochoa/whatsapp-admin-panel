const { Client } = require('pg');
const connectionString = 'postgresql://postgres:kbwksBtAiRaXWUPkwYMAZJpNLrpZPqGl@switchyard.proxy.rlwy.net:22428/railway';

async function verifyEnhancedData() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();

        const res = await client.query(`
            SELECT 
                COUNT(*) as total_conversions,
                COUNT(lead_email) as with_email,
                COUNT(email_sha256) as with_email_sha256,
                COUNT(phone_sha256) as with_phone_sha256,
                COUNT(lead_name) as with_name
            FROM conversions 
            WHERE project_id = 'test-color-tapetes'
        `);
        console.table(res.rows);

        const samples = await client.query(`
            SELECT 
                phone_e164, 
                lead_email, 
                LEFT(email_sha256, 10) as email_hash_start, 
                lead_name, 
                conversion_name
            FROM conversions 
            WHERE project_id = 'test-color-tapetes' 
            AND email_sha256 IS NOT NULL
            LIMIT 5
        `);
        console.log('\nSamples with Enhanced Data:');
        console.table(samples.rows);

    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await client.end();
    }
}

verifyEnhancedData();
