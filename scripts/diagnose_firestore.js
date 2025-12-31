// Script de diagnóstico para verificar datos en Firestore
const admin = require('firebase-admin');

// Inicializar con las credenciales del proyecto
// NOTA: Necesitas tener el archivo de credenciales o usar las credenciales de aplicación por defecto
const serviceAccount = require('./path/to/serviceAccountKey.json'); // Ajusta la ruta

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function diagnoseConversions() {
    console.log('🔍 Diagnóstico de Firestore - Colección: conversions\n');

    try {
        // 1. Verificar que existan documentos
        const snapshot = await db.collection('conversions').limit(5).get();
        console.log(`📊 Total de documentos encontrados (muestra): ${snapshot.size}`);

        if (snapshot.empty) {
            console.log('❌ La colección está vacía');
            return;
        }

        // 2. Analizar estructura de los primeros documentos
        snapshot.forEach((doc, index) => {
            const data = doc.data();
            console.log(`\n--- Documento ${index + 1} (ID: ${doc.id}) ---`);
            console.log('project_id:', data.project_id);
            console.log('created_at tipo:', typeof data.created_at);
            console.log('created_at valor:', data.created_at);
            console.log('conversion_name:', data.conversion_name);
            console.log('conversion_value:', data.conversion_value);
        });

        // 3. Buscar específicamente por el project_id de lucilu
        console.log('\n\n🔎 Buscando conversiones para project_id: HMR9Z75xI0PYxEYStK1l');
        const luciluQuery = await db.collection('conversions')
            .where('project_id', '==', 'HMR9Z75xI0PYxEYStK1l')
            .limit(3)
            .get();

        console.log(`Conversiones encontradas: ${luciluQuery.size}`);

        if (luciluQuery.empty) {
            console.log('❌ No se encontraron conversiones para este project_id');
            console.log('Verifica que el Workflow 4 haya usado el project_id correcto');
        } else {
            console.log('✅ Conversiones encontradas para lucilu.com.co');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

diagnoseConversions();
