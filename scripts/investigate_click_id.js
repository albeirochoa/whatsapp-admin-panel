const { Client } = require('pg');
const connectionString = 'postgresql://postgres:kbwksBtAiRaXWUPkwYMAZJpNLrpZPqGl@switchyard.proxy.rlwy.net:22428/railway';

const TARGET_CLICK_ID = 'Cj0KCQiA6sjKBhCSARIsAJvYcpNxslARMCa-qgWDVWo5-irHttMiXTqQgx5t5E8H8isMY__d_kKt0msaAndgEALw_wcB';

async function investigateClickId() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();

        console.log(`\n=== Investigation for Click ID: ${TARGET_CLICK_ID} ===`);

        // 2. Sample Conversions in detail
        console.log('\n--- 2. Detailed Conversions (Sample of 3) ---');
        const detailedConv = await client.query(`
            SELECT conversion_id, phone_e164, attribution_method, aggregated_conversation, created_at
            FROM conversions
            WHERE click_id = $1
            LIMIT 3
        `, [TARGET_CLICK_ID]);
        console.log(JSON.stringify(detailedConv.rows, null, 2));

        // 3. Check for any other events for these phones
        const phones = detailedConv.rows.map(c => c.phone_e164);
        console.log('\n--- 3. Events for Sample Phones ---');
        const events = await client.query(`
            SELECT event_id, phone_e164, event_type, click_id_hash, LEFT(message_text, 50) as msg
            FROM events
            WHERE phone_e164 = ANY($1)
            ORDER BY phone_e164, ts ASC
        `, [phones]);
        console.log(JSON.stringify(events.rows, null, 2));

        // 4. Do these phones have their own clicks?
        if (conversions.rows.length > 0) {
            const phones = conversions.rows.map(c => c.phone_e164);
            console.log('\n--- 4. Own Clicks for these phones ---');
            const ownClicks = await client.query(`
                SELECT phone_e164, ts, click_id, click_id_hash
                FROM events
                WHERE phone_e164 = ANY($1) AND event_type = 'click'
                ORDER BY ts DESC
            `, [phones]);
            console.log(JSON.stringify(ownClicks.rows, null, 2));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

investigateClickId();
