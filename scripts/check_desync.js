const { Client } = require('pg');
const connectionString = 'postgresql://postgres:kbwksBtAiRaXWUPkwYMAZJpNLrpZPqGl@switchyard.proxy.rlwy.net:22428/railway';

async function checkDesync() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();

        console.log('--- CHECKING IF ANY CONVERSIONS WERE SAVED UNDER OTHER PROJECT_IDS ---');
        const res = await client.query(`
            SELECT project_id, COUNT(*) 
            FROM conversions 
            WHERE created_at > NOW() - INTERVAL '2 hours'
            GROUP BY project_id
        `);
        console.table(res.rows);

        console.log('\n--- CHECKING LATEST CONVERSIONS REGARDLESS OF PROJECT ---');
        const latest = await client.query(`
            SELECT conversion_id, project_id, phone_e164, lead_name, conversion_name, created_at 
            FROM conversions 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        console.table(latest.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkDesync();
