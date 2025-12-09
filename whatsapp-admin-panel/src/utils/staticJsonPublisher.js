import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Publica la configuración del widget como JSON estático en Firebase Storage
 * Esto evita lecturas costosas de Firestore desde el widget público
 */
export const publishWidgetConfig = async (userId, projectId, config, agents) => {
  try {
    // 1. Preparar los datos del widget (solo lo necesario)
    const widgetData = {
      config: {
        message: config.message,
        webhookUrl: config.webhookUrl,
        excludePages: config.excludePages,
        delayShow: config.delayShow,
        onlyMobile: config.onlyMobile
      },
      agents: agents.map(agent => ({
        name: agent.name,
        role: agent.role,
        phone: agent.phone,
        photo: agent.photo,
        showOn: agent.showOn || [],
        hideOn: agent.hideOn || []
      })),
      lastUpdated: new Date().toISOString()
    };

    // 2. Convertir a JSON string
    const jsonString = JSON.stringify(widgetData, null, 2);

    // 3. Crear referencia en Storage: widgets/{userId}/{projectId}.json
    const storageRef = ref(storage, `widgets/${userId}/${projectId}.json`);

    // 4. Subir el archivo con metadata correcta
    await uploadString(storageRef, jsonString, 'raw', {
      contentType: 'application/json',
      cacheControl: 'public, max-age=300', // Cache de 5 minutos
      customMetadata: {
        projectId: projectId,
        lastModified: new Date().toISOString()
      }
    });

    // 5. Obtener la URL pública
    const publicUrl = await getDownloadURL(storageRef);

    return {
      success: true,
      publicUrl,
      message: 'Widget publicado exitosamente'
    };

  } catch (error) {
    console.error('Error publishing widget:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Genera la URL pública del widget sin necesidad de subirlo
 * Útil para mostrar la URL antes de guardar
 */
export const getWidgetPublicUrl = (userId, projectId) => {
  // URL directa de Firebase Storage (formato alt=media para descarga directa)
  const bucketUrl = storage.app.options.storageBucket;
  return `https://firebasestorage.googleapis.com/v0/b/${bucketUrl}/o/widgets%2F${userId}%2F${projectId}.json?alt=media`;
};

/**
 * Elimina el JSON estático cuando se elimina un proyecto
 */
export const deleteWidgetConfig = async (userId, projectId) => {
  try {
    const storageRef = ref(storage, `widgets/${userId}/${projectId}.json`);
    await deleteObject(storageRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting widget:', error);
    return { success: false, error: error.message };
  }
};
