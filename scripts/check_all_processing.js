const { Client } = require('pg');
const connectionString = 'postgresql://postgres:kbwksBtAiRaXWUPkwYMAZJpNLrpZPqGl@switchyard.proxy.rlwy.net:22428/railway';

async function checkAllProcessing() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT 
                project_id,
                COUNT(*) as total,
                COUNT(processed_at) as processed
            FROM events 
            GROUP BY project_id
        `);
        console.table(res.rows);
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await client.end();
    }
}

checkAllProcessing();
