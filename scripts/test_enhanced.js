const https = require('https');
const fs = require('fs');
const path = require('path');

const N8N_URL = 'primary-production-3fcd.up.railway.app';
const PROJECT_ID = 'test-color-tapetes';

const WEBHOOK_PATHS = {
    click: '/webhook/click-webhook-uuid/click',
    ycloud: '/webhook/ycloud-webhook-uuid/ycloud'
};

function sendWebhook(endpoint, projectId, body, description) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const basePath = WEBHOOK_PATHS[endpoint];
        const options = {
            hostname: N8N_URL,
            port: 443,
            path: `${basePath}/${projectId}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let resData = '';
            res.on('data', (chunk) => { resData += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`✓ ${description}`);
                    resolve(true);
                } else {
                    console.error(`✗ ${description} - Status: ${res.statusCode}, Body: ${resData}`);
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error(`✗ ${description} - Error: ${error.message}`);
            resolve(false);
        });

        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log('========================================');
    console.log('  TEST: Enhanced Conversions System');
    console.log('========================================\n');

    const testDataDir = path.join(__dirname, '..', 'n8n', 'test_data');

    const clicksData = JSON.parse(fs.readFileSync(path.join(testDataDir, 'click_test_data.json'), 'utf8'));
    const inboundData = JSON.parse(fs.readFileSync(path.join(testDataDir, 'ycloud_enhanced_test_data.json'), 'utf8'));
    const outboundData = JSON.parse(fs.readFileSync(path.join(testDataDir, 'ycloud_outbound_enhanced_test_data.json'), 'utf8'));

    console.log('📊 Datos cargados:');
    console.log(`  - Clicks: ${clicksData.length}`);
    console.log(`  - Mensajes inbound: ${inboundData.length}`);
    console.log(`  - Mensajes outbound: ${outboundData.length}\n`);

    // FASE 1: Clicks
    console.log('🔗 FASE 1: Enviando clicks...\n');
    let clicksSent = 0;
    for (const click of clicksData) {
        if (click.body.gclid) {
            const sent = await sendWebhook('click', click.params.project_id, click.body, click.description);
            if (sent) clicksSent++;
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    console.log(`\n📈 Clicks enviados: ${clicksSent}\n`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // FASE 2: Inbound
    console.log('📥 FASE 2: Enviando mensajes inbound...\n');
    let inboundSent = 0;
    for (const msg of inboundData) {
        const sent = await sendWebhook('ycloud', msg.params.project_id, msg.body, msg.description);
        if (sent) inboundSent++;
        await new Promise(resolve => setTimeout(resolve, 800));
    }
    console.log(`\n📈 Mensajes inbound enviados: ${inboundSent}\n`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // FASE 3: Outbound
    console.log('📤 FASE 3: Enviando mensajes outbound...\n');
    let outboundSent = 0;
    for (const msg of outboundData) {
        const sent = await sendWebhook('ycloud', msg.params.project_id, msg.body, msg.description);
        if (sent) outboundSent++;
        await new Promise(resolve => setTimeout(resolve, 800));
    }
    console.log(`\n📈 Mensajes outbound enviados: ${outboundSent}\n`);

    console.log('========================================');
    console.log('  RESUMEN DE PRUEBAS');
    console.log('========================================\n');
    console.log(`✓ Clicks enviados: ${clicksSent}`);
    console.log(`✓ Mensajes inbound: ${inboundSent}`);
    console.log(`✓ Mensajes outbound: ${outboundSent}\n`);
    console.log('✅ Test completado!');
    console.log('\n🔍 Siguiente paso: Verificar en la DB y ejecutar el Workflow 3 de n8n.');
}

runTests().catch(err => console.error('Fatal error:', err));
