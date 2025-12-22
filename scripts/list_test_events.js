const { Client } = require('pg');
const connectionString = 'postgresql://postgres:kbwksBtAiRaXWUPkwYMAZJpNLrpZPqGl@switchyard.proxy.rlwy.net:22428/railway';

async function listEvents() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const res = await client.query("SELECT event_type, direction, COUNT(*) FROM events WHERE project_id = 'test-color-tapetes' AND created_at > NOW() - INTERVAL '1 hour' GROUP BY event_type, direction");
        console.log('Event Stats (Last hour):');
        console.table(res.rows);

        const details = await client.query("SELECT event_id, direction, message_id, message_text FROM events WHERE project_id = 'test-color-tapetes' AND created_at > NOW() - INTERVAL '1 hour' ORDER BY created_at ASC");
        console.log('\nEvent Details (Last hour):');
        console.table(details.rows);
    } catch (err) {
        console.error('Error querying DB:', err);
    } finally {
        await client.end();
    }
}

listEvents();
