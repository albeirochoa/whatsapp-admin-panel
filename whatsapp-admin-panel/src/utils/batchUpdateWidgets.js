/**
 * Función para actualizar todos los widgets desde el navegador (con autenticación)
 *
 * Uso:
 * 1. Abre el panel admin en el navegador
 * 2. Inicia sesión
 * 3. Abre la consola del navegador (F12)
 * 4. Ejecuta: window.batchUpdateWidgets()
 *
 * Esto regenerará todos los widgets con la última versión del código
 */

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { publishWidgetConfig } from './staticJsonPublisher';

export async function batchUpdateWidgets() {
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
    // 1. Obtener todos los usuarios (solo el usuario actual si no es super_admin)
    const currentUser = window.currentUser; // Asumiendo que guardas el usuario en window

    if (!currentUser) {
      console.error('❌ No hay usuario autenticado');
      return;
    }

    console.log(`👤 Usuario: ${currentUser.email}`);
    console.log(`📁 Actualizando proyectos...`);
    console.log('');

    // 2. Obtener proyectos del usuario actual
    const projectsSnapshot = await getDocs(
      collection(db, `users/${currentUser.uid}/projects`)
    );

    if (projectsSnapshot.empty) {
      console.log('⚠️  No tienes proyectos para actualizar\n');
      return;
    }

    console.log(`📦 Total de proyectos: ${projectsSnapshot.size}`);
    console.log('');

    // 3. Iterar por cada proyecto
    for (const projectDoc of projectsSnapshot.docs) {
      const projectId = projectDoc.id;
      const projectData = projectDoc.data();
      const projectName = projectData.name || projectId;

      console.log(`📦 Proyecto: ${projectName}`);

      // 4. Obtener agentes del proyecto
      const agentsSnapshot = await getDocs(
        collection(db, `users/${currentUser.uid}/projects/${projectId}/agents`)
      );
      const agents = agentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`   👥 Agentes: ${agents.length}`);

      // 5. Obtener configuración del widget
      const widgetConfig = projectData.widgetConfig || {
        message: '¡Hola! 👋',
        position: 'right',
        delayShow: 2000,
        onlyMobile: false
      };

      // 6. Republicar widget con código actualizado
      try {
        const result = await publishWidgetConfig(
          currentUser.uid,
          projectId,
          widgetConfig,
          agents
        );

        if (result.success) {
          console.log(`   ✅ Widget actualizado`);
          console.log(`   🔗 JSON: ${result.jsonUrl}`);
          console.log(`   🔗 JS:   ${result.jsUrl}`);
          totalUpdated++;
        } else {
          console.log(`   ❌ Error: ${result.error}`);
          totalErrors++;
          errors.push({
            project: projectName,
            error: result.error
          });
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        totalErrors++;
        errors.push({
          project: projectName,
          error: error.message
        });
      }

      console.log('');
    }

    // 7. Resumen final
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
        console.log(`${index + 1}. Proyecto: ${err.project}`);
        console.log(`   Error: ${err.error}`);
        console.log('');
      });
    }

    console.log('🎉 Actualización completada\n');

    return {
      success: true,
      totalUpdated,
      totalErrors,
      errors
    };

  } catch (error) {
    console.error('');
    console.error('❌ ERROR CRÍTICO:', error);
    console.error('');
    return {
      success: false,
      error: error.message
    };
  }
}

// Exportar para uso en consola del navegador
if (typeof window !== 'undefined') {
  window.batchUpdateWidgets = batchUpdateWidgets;
  console.log('✅ batchUpdateWidgets() disponible en consola del navegador');
}
