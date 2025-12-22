const { Client } = require('pg');
const connectionString = 'postgresql://postgres:kbwksBtAiRaXWUPkwYMAZJpNLrpZPqGl@switchyard.proxy.rlwy.net:22428/railway';

async function checkProcessing() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(processed_at) as processed,
                COUNT(*) - COUNT(processed_at) as pending
            FROM events 
            WHERE project_id = 'test-color-tapetes' 
            AND created_at > NOW() - INTERVAL '1 hour'
        `);
        console.table(res.rows);
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await client.end();
    }
}

checkProcessing();
