const { Client } = require('pg');
const connectionString = 'postgresql://postgres:kbwksBtAiRaXWUPkwYMAZJpNLrpZPqGl@switchyard.proxy.rlwy.net:22428/railway';

async function checkSchema() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        console.log('--- EVENTS TABLE ---');
        const eventCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'events'");
        console.log(eventCols.rows.map(r => r.column_name));

        console.log('\n--- CONVERSIONS TABLE ---');
        const convCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'conversions'");
        console.log(convCols.rows.map(r => r.column_name));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkSchema();
