const { Client } = require('pg');
const connectionString = 'postgresql://postgres:kbwksBtAiRaXWUPkwYMAZJpNLrpZPqGl@switchyard.proxy.rlwy.net:22428/railway';

async function getPrompt() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query("SELECT prompt_template FROM clients_config WHERE project_id = 'color-tapetes' AND status = 'active' LIMIT 1");
        if (res.rows[0]) {
            console.log('--- PROMPT START ---');
            console.log(res.rows[0].prompt_template);
            console.log('--- PROMPT END ---');
        } else {
            console.log('No prompt found');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

getPrompt();
