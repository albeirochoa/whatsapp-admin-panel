const { Client } = require('pg');
const connectionString = 'postgresql://postgres:kbwksBtAiRaXWUPkwYMAZJpNLrpZPqGl@switchyard.proxy.rlwy.net:22428/railway';

async function getLastConversion() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();

        const res = await client.query(`
            SELECT 
                project_id,
                phone_e164, 
                conversion_name, 
                conversion_value, 
                conversion_time, 
                ai_label, 
                ai_reason,
                ai_confidence,
                created_at
            FROM conversions 
            WHERE project_id = 'color-tapetes'
            ORDER BY created_at DESC
            LIMIT 1
        `);

        if (res.rows.length > 0) {
            console.log('FINAL_RESULT_START');
            console.log(JSON.stringify(res.rows[0], null, 2));
            console.log('FINAL_RESULT_END');
        } else {
            console.log('No records found for color-tapetes.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

getLastConversion();
