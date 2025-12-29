/**
 * Script para ejecutar en la consola del navegador (con usuario autenticado)
 *
 * INSTRUCCIONES:
 * 1. Abre el panel admin en tu navegador
 * 2. Inicia sesión normalmente
 * 3. Abre DevTools (F12) → pestaña "Console"
 * 4. Copia y pega TODO este código en la consola
 * 5. Presiona Enter
 * 6. Espera a que termine (verás progreso en consola)
 *
 * NOTA: Este script usa las funciones ya cargadas en el panel admin
 */

(async function() {
  console.log('');
  console.log('🚀 ============================================');
  console.log('   ACTUALIZACIÓN MASIVA DE WIDGETS');
  console.log('============================================');
  console.log('');

  try {
    // Importar módulos necesarios (ya están cargados en el panel)
    const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');

    // Obtener instancias de Firebase del panel
    const db = window.db || firebase.firestore();
    const storage = window.storage || firebase.storage();
    const auth = window.auth || firebase.auth();

    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error('❌ No hay usuario autenticado. Inicia sesión primero.');
      return;
    }

    console.log(`👤 Usuario: ${currentUser.email}`);
    console.log(`📁 Actualizando tus proyectos...`);
    console.log('');

    let totalUpdated = 0;
    let totalErrors = 0;

    // Obtener proyectos
    const projectsRef = collection(db, `users/${currentUser.uid}/projects`);
    const projectsSnapshot = await getDocs(projectsRef);

    if (projectsSnapshot.empty) {
      console.log('⚠️  No tienes proyectos para actualizar\n');
      return;
    }

    console.log(`📦 Total de proyectos: ${projectsSnapshot.size}`);
    console.log('');

    // Iterar proyectos
    for (const projectDoc of projectsSnapshot.docs) {
      const projectId = projectDoc.id;
      const projectData = projectDoc.data();
      const projectName = projectData.name || projectId;

      console.log(`📦 Proyecto: ${projectName}`);

      // Obtener agentes
      const agentsRef = collection(db, `users/${currentUser.uid}/projects/${projectId}/agents`);
      const agentsSnapshot = await getDocs(agentsRef);
      const agents = agentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      console.log(`   👥 Agentes: ${agents.length}`);

      // Configuración
      const widgetConfig = projectData.widgetConfig || {
        message: '¡Hola! 👋',
        position: 'right',
        delayShow: 2000,
        onlyMobile: false
      };

      try {
        // Llamar a la función publishWidgetConfig que ya existe en el panel
        // Asumiendo que está disponible globalmente o la importamos
        const result = await window.publishWidgetConfig(
          currentUser.uid,
          projectId,
          widgetConfig,
          agents
        );

        if (result && result.success) {
          console.log(`   ✅ Widget actualizado`);
          console.log(`   🔗 JS: ${result.jsUrl}`);
          totalUpdated++;
        } else {
          console.log(`   ❌ Error al actualizar`);
          totalErrors++;
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        totalErrors++;
      }

      console.log('');
    }

    console.log('============================================');
    console.log('   RESUMEN');
    console.log('============================================');
    console.log('');
    console.log(`✅ Widgets actualizados: ${totalUpdated}`);
    console.log(`❌ Errores: ${totalErrors}`);
    console.log('');
    console.log('🎉 Actualización completada\n');

  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error('');
    console.error('💡 Asegúrate de:');
    console.error('   1. Estar en el panel admin');
    console.error('   2. Haber iniciado sesión');
    console.error('   3. Tener la pestaña del panel abierta');
  }
})();
