import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import { generateWidgetJS } from './widgetJsGenerator';

/**
 * Publica la configuración del widget como JSON estático en Firebase Storage
 * ADEMÁS publica el código JavaScript del widget
 * Esto evita lecturas costosas de Firestore desde el widget público
 */
export const publishWidgetConfig = async (userId, projectId, config, agents) => {
  try {
    // 1. Preparar los datos del widget (solo lo necesario)
    const widgetData = {
      config: {
        message: config.message,
        siteName: config.siteName || '',
        webhookUrl: config.webhookUrl,
        excludePages: config.excludePages,
        delayShow: config.delayShow,
        onlyMobile: config.onlyMobile,
        enableUniversalHash: config.enableUniversalHash || false,
        trackingMaxAgeDays: config.trackingMaxAgeDays || 90
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
    const jsonRef = ref(storage, `widgets/${userId}/${projectId}.json`);

    // 4. Subir el archivo JSON con metadata correcta
    await uploadString(jsonRef, jsonString, 'raw', {
      contentType: 'application/json',
      cacheControl: 'public, max-age=300', // Cache de 5 minutos
      customMetadata: {
        projectId: projectId,
        lastModified: new Date().toISOString()
      }
    });

    // 5. Obtener la URL pública del JSON
    const jsonUrl = await getDownloadURL(jsonRef);

    // 6. NUEVO: Generar y subir el código JavaScript puro
    const jsCode = generateWidgetJS(jsonUrl, projectId);
    const jsRef = ref(storage, `widgets/${userId}/${projectId}.js`);

    await uploadString(jsRef, jsCode, 'raw', {
      contentType: 'application/javascript',
      cacheControl: 'public, max-age=3600', // Cache de 1 hora (más largo que JSON)
      customMetadata: {
        projectId: projectId,
        lastModified: new Date().toISOString()
      }
    });

    // 7. Obtener la URL pública del JavaScript
    const jsUrl = await getDownloadURL(jsRef);

    return {
      success: true,
      jsonUrl,
      jsUrl, // Nueva URL para el archivo .js
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
 * Genera las URLs públicas del widget sin necesidad de subirlo
 * Útil para mostrar las URLs antes de guardar
 */
export const getWidgetPublicUrl = (userId, projectId) => {
  // URL directa de Firebase Storage (formato alt=media para descarga directa)
  const bucketUrl = storage.app.options.storageBucket;
  return `https://firebasestorage.googleapis.com/v0/b/${bucketUrl}/o/widgets%2F${userId}%2F${projectId}.json?alt=media`;
};

/**
 * Genera la URL pública del archivo JavaScript
 */
export const getWidgetJsUrl = (userId, projectId) => {
  const bucketUrl = storage.app.options.storageBucket;
  return `https://firebasestorage.googleapis.com/v0/b/${bucketUrl}/o/widgets%2F${userId}%2F${projectId}.js?alt=media`;
};

/**
 * Elimina el JSON y el archivo JS cuando se elimina un proyecto
 */
export const deleteWidgetConfig = async (userId, projectId) => {
  try {
    // Borrar el archivo JSON
    const jsonRef = ref(storage, `widgets/${userId}/${projectId}.json`);
    await deleteObject(jsonRef);

    // Borrar el archivo JavaScript
    const jsRef = ref(storage, `widgets/${userId}/${projectId}.js`);
    await deleteObject(jsRef);

    return { success: true };
  } catch (error) {
    console.error('Error deleting widget:', error);
    return { success: false, error: error.message };
  }
};
