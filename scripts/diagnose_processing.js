const { Client } = require('pg');
const connectionString = 'postgresql://postgres:kbwksBtAiRaXWUPkwYMAZJpNLrpZPqGl@switchyard.proxy.rlwy.net:22428/railway';

async function diagnoseFixed() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();

        console.log('--- EVENT PROCESSING STATUS ---');
        const eventStats = await client.query(`
            SELECT 
                processed_at IS NOT NULL as is_processed,
                COUNT(*) as count
            FROM events 
            WHERE project_id = 'test-color-tapetes'
            GROUP BY is_processed
        `);
        console.table(eventStats.rows);

        console.log('\n--- RECENT PROCESSED CONVERSIONS (Detailed) ---');
        const convs = await client.query(`
            SELECT 
                phone_e164, 
                lead_name, 
                lead_email, 
                LEFT(email_sha256, 12) as email_hash, 
                LEFT(phone_sha256, 12) as phone_hash,
                conversion_name,
                ai_label,
                ai_confidence,
                attribution_method,
                created_at
            FROM conversions 
            WHERE project_id = 'test-color-tapetes'
            ORDER BY created_at DESC
            LIMIT 10
        `);
        console.table(convs.rows);

        console.log('\n--- LEAD ATTRIBUTION RECORDS ---');
        // Schema from ARQUITECTURA.md: project_id, phone_e164, click_id_hash, first_click_ts, last_update_ts, expires_at
        const attr = await client.query(`
            SELECT phone_e164, click_id_hash, first_click_ts, expires_at 
            FROM lead_attribution 
            WHERE project_id = 'test-color-tapetes'
        `);
        console.table(attr.rows);

        console.log('\n--- WHY ONLY ONE? CHECKING LIMITS ---');
        // Check if there are messages with different phones
        const phones = await client.query(`
            SELECT phone_e164, COUNT(*) as msg_count, MIN(ts) as first_msg
            FROM events 
            WHERE project_id = 'test-color-tapetes' 
            AND processed_at IS NULL 
            AND event_type IN ('message_in', 'message_out')
            GROUP BY phone_e164
            ORDER BY first_msg ASC
        `);
        console.log('Pending groups (by phone):');
        console.table(phones.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

diagnoseFixed();
