/**
 * Script de actualización masiva de widgets
 *
 * Propósito:
 * - Regenerar todos los archivos .js en Firebase Storage cuando se actualiza el código base
 * - Evitar que usuarios tengan que "guardar de nuevo" manualmente
 *
 * Uso:
 * node scripts/updateAllWidgets.js
 *
 * Cuándo ejecutar:
 * - Después de modificar widgetJsGenerator.js
 * - Después de modificar widgetCodeGenerator.optimized.js
 * - Cuando agregas nuevas features al widget
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { publishWidgetConfig } from '../src/utils/staticJsonPublisher.js';

// Configuración de Firebase (asegúrate de usar tu config real)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDVcN9TvXLhcqzLKxH-oLLnpMOVH_kbS-0",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "whatsapp-widget-admin.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "whatsapp-widget-admin",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "whatsapp-widget-admin.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateAllWidgets() {
  console.log('');
  console.log('🚀 ============================================');
  console.log('   ACTUALIZACIÓN MASIVA DE WIDGETS');
  console.log('============================================');
  console.log('');
  console.log('📝 Este script regenerará todos los archivos .js en Storage');
  console.log('   con la última versión del código base.');
  console.log('');

  let totalUpdated = 0;
  let totalErrors = 0;
  const errors = [];

  try {
    // 1. Obtener todos los usuarios
    console.log('📂 Obteniendo usuarios...');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log(`✅ Encontrados ${usersSnapshot.size} usuarios\n`);

    // 2. Iterar por cada usuario
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      console.log(`👤 Usuario: ${userData.email || userId}`);

      // 3. Obtener proyectos del usuario
      const projectsSnapshot = await getDocs(
        collection(db, `users/${userId}/projects`)
      );

      if (projectsSnapshot.empty) {
        console.log('   ⚠️  No tiene proyectos\n');
        continue;
      }

      console.log(`   📁 Proyectos: ${projectsSnapshot.size}`);

      // 4. Iterar por cada proyecto
      for (const projectDoc of projectsSnapshot.docs) {
        const projectId = projectDoc.id;
        const projectData = projectDoc.data();
        const projectName = projectData.name || projectId;

        console.log(`   📦 Proyecto: ${projectName} (${projectId})`);

        // 5. Obtener agentes del proyecto
        const agentsSnapshot = await getDocs(
          collection(db, `users/${userId}/projects/${projectId}/agents`)
        );
        const agents = agentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log(`      👥 Agentes: ${agents.length}`);

        // 6. Obtener configuración del widget
        const widgetConfig = projectData.widgetConfig || {
          message: '¡Hola! 👋',
          position: 'right',
          delayShow: 2000,
          onlyMobile: false
        };

        // 7. Republicar widget con código actualizado
        try {
          const result = await publishWidgetConfig(
            userId,
            projectId,
            widgetConfig,
            agents
          );

          if (result.success) {
            console.log(`      ✅ Widget actualizado`);
            console.log(`      🔗 JSON: ${result.jsonUrl}`);
            console.log(`      🔗 JS:   ${result.jsUrl}`);
            totalUpdated++;
          } else {
            console.log(`      ❌ Error: ${result.error}`);
            totalErrors++;
            errors.push({
              user: userData.email || userId,
              project: projectName,
              error: result.error
            });
          }
        } catch (error) {
          console.log(`      ❌ Error: ${error.message}`);
          totalErrors++;
          errors.push({
            user: userData.email || userId,
            project: projectName,
            error: error.message
          });
        }

        console.log('');
      }

      console.log('');
    }

    // 8. Resumen final
    console.log('============================================');
    console.log('   RESUMEN DE ACTUALIZACIÓN');
    console.log('============================================');
    console.log('');
    console.log(`✅ Widgets actualizados: ${totalUpdated}`);
    console.log(`❌ Errores: ${totalErrors}`);
    console.log('');

    if (errors.length > 0) {
      console.log('⚠️  ERRORES ENCONTRADOS:');
      console.log('');
      errors.forEach((err, index) => {
        console.log(`${index + 1}. Usuario: ${err.user}`);
        console.log(`   Proyecto: ${err.project}`);
        console.log(`   Error: ${err.error}`);
        console.log('');
      });
    }

    console.log('🎉 Actualización completada\n');

  } catch (error) {
    console.error('');
    console.error('❌ ERROR CRÍTICO:', error);
    console.error('');
    process.exit(1);
  }
}

// Ejecutar el script
updateAllWidgets()
  .then(() => {
    console.log('✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script finalizado con errores:', error);
    process.exit(1);
  });
