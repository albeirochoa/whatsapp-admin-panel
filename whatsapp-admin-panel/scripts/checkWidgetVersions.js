/**
 * Script de verificación de versiones de widgets
 *
 * Propósito:
 * - Verificar qué archivos .js en Storage tienen los últimos cambios
 * - Identificar widgets que necesitan actualización
 * - NO modifica nada, solo reporta
 *
 * Uso:
 * node scripts/checkWidgetVersions.js
 *
 * El script verifica si el código contiene:
 * - attachLinkHandlers (cambio #whatsapp del 2025-12-28)
 * - buildWhatsAppMessage (cambio #whatsapp del 2025-12-28)
 * - isMobile() con detección móvil/escritorio
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// NOTA: Este script requiere que tengas las reglas de Firestore configuradas para permitir
// lectura pública de la colección 'users', O que estés autenticado con Firebase Auth.
// Alternativamente, usa Firebase Admin SDK con service account para acceso completo.

// Configuración de Firebase (importada desde src/firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyBuOstFD6-UoZlqzWtnHGmmaNCLpXlq3us",
  authDomain: "whatsapp-widget-admin.firebaseapp.com",
  projectId: "whatsapp-widget-admin",
  storageBucket: "whatsapp-widget-admin.firebasestorage.app",
  messagingSenderId: "293950188828",
  appId: "1:293950188828:web:43ccd14c23490cff629ed9"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Features a verificar (últimos cambios)
const FEATURES_TO_CHECK = [
  { name: 'Enlaces #whatsapp', pattern: 'attachLinkHandlers' },
  { name: 'Construcción de mensajes', pattern: 'buildWhatsAppMessage' },
  { name: 'Tracking con project_id', pattern: 'project_id:' },
  { name: 'Detección móvil/escritorio', pattern: 'wa.me/' }
];

async function checkWidgetVersions() {
  console.log('');
  console.log('🔍 ============================================');
  console.log('   VERIFICACIÓN DE VERSIONES DE WIDGETS');
  console.log('============================================');
  console.log('');
  console.log('📝 Verificando features:');
  FEATURES_TO_CHECK.forEach(feature => {
    console.log(`   - ${feature.name}`);
  });
  console.log('');

  let totalChecked = 0;
  let totalUpdated = 0;
  let totalOutdated = 0;
  let totalMissing = 0;
  const outdatedWidgets = [];
  const missingWidgets = [];

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

        console.log(`   📦 Proyecto: ${projectName}`);

        // 5. Intentar descargar el archivo .js desde Storage
        try {
          const jsRef = ref(storage, `widgets/${userId}/${projectId}.js`);
          const jsUrl = await getDownloadURL(jsRef);

          // 6. Descargar el contenido del archivo
          const response = await fetch(jsUrl);
          const jsCode = await response.text();

          totalChecked++;

          // 7. Verificar features
          let hasAllFeatures = true;
          const missingFeatures = [];

          for (const feature of FEATURES_TO_CHECK) {
            if (!jsCode.includes(feature.pattern)) {
              hasAllFeatures = false;
              missingFeatures.push(feature.name);
            }
          }

          if (hasAllFeatures) {
            console.log(`      ✅ Actualizado (tiene todas las features)`);
            totalUpdated++;
          } else {
            console.log(`      ⚠️  DESACTUALIZADO - Falta:`);
            missingFeatures.forEach(feature => {
              console.log(`         - ${feature}`);
            });
            totalOutdated++;
            outdatedWidgets.push({
              user: userData.email || userId,
              project: projectName,
              projectId,
              userId,
              missingFeatures
            });
          }

        } catch (error) {
          if (error.code === 'storage/object-not-found') {
            console.log(`      ❌ Archivo .js NO EXISTE en Storage`);
            totalMissing++;
            missingWidgets.push({
              user: userData.email || userId,
              project: projectName,
              projectId,
              userId
            });
          } else {
            console.log(`      ❌ Error: ${error.message}`);
          }
        }

        console.log('');
      }

      console.log('');
    }

    // 8. Resumen final
    console.log('============================================');
    console.log('   RESUMEN DE VERIFICACIÓN');
    console.log('============================================');
    console.log('');
    console.log(`📊 Total verificados: ${totalChecked}`);
    console.log(`✅ Actualizados: ${totalUpdated} (${totalChecked > 0 ? Math.round(totalUpdated / totalChecked * 100) : 0}%)`);
    console.log(`⚠️  Desactualizados: ${totalOutdated} (${totalChecked > 0 ? Math.round(totalOutdated / totalChecked * 100) : 0}%)`);
    console.log(`❌ Sin archivo .js: ${totalMissing}`);
    console.log('');

    if (outdatedWidgets.length > 0) {
      console.log('⚠️  WIDGETS DESACTUALIZADOS:');
      console.log('');
      outdatedWidgets.forEach((widget, index) => {
        console.log(`${index + 1}. ${widget.user} - ${widget.project}`);
        console.log(`   Usuario ID: ${widget.userId}`);
        console.log(`   Proyecto ID: ${widget.projectId}`);
        console.log(`   Features faltantes: ${widget.missingFeatures.join(', ')}`);
        console.log('');
      });
      console.log('💡 Ejecuta "node scripts/updateAllWidgets.js" para actualizarlos\n');
    }

    if (missingWidgets.length > 0) {
      console.log('❌ WIDGETS SIN ARCHIVO .JS:');
      console.log('');
      missingWidgets.forEach((widget, index) => {
        console.log(`${index + 1}. ${widget.user} - ${widget.project}`);
        console.log(`   Usuario ID: ${widget.userId}`);
        console.log(`   Proyecto ID: ${widget.projectId}`);
        console.log('');
      });
      console.log('💡 Estos proyectos nunca publicaron su widget\n');
    }

    if (totalOutdated === 0 && totalMissing === 0) {
      console.log('🎉 Todos los widgets están actualizados!\n');
    }

  } catch (error) {
    console.error('');
    console.error('❌ ERROR CRÍTICO:', error);
    console.error('');
    process.exit(1);
  }
}

// Ejecutar el script
checkWidgetVersions()
  .then(() => {
    console.log('✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verificación finalizada con errores:', error);
    process.exit(1);
  });
