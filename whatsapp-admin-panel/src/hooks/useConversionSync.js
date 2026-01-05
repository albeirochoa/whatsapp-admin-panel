import { useState } from 'react';

/**
 * Hook personalizado para sincronizar ediciones de conversiones
 * de Firestore a PostgreSQL y Google Sheets vía Workflow 6 (n8n)
 *
 * @returns {Object} { syncConversionEdits, syncing, syncError }
 */
export const useConversionSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // URL del webhook de n8n (Railway)
  const WEBHOOK_URL = process.env.REACT_APP_N8N_WEBHOOK_SYNC_EDITS ||
    'https://primary-production-3fcd.up.railway.app/webhook/firestore-edits';

  /**
   * Sincroniza cambios a PostgreSQL y Google Sheets
   *
   * @param {string} conversionId - ID de la conversión (ej: "conv_1767452419732_r58erxa8")
   * @param {Object} changedFields - Campos modificados
   * @param {string} [changedFields.conversion_name] - Nombre de la conversión
   * @param {number} [changedFields.conversion_value] - Valor de la conversión
   * @param {string} [changedFields.conversion_currency] - Moneda (COP, USD, etc.)
   * @param {string} [changedFields.lead_name] - Nombre del lead
   * @param {string} [changedFields.lead_email] - Email del lead
   * @param {string} [changedFields.ai_reason] - Razón de clasificación
   *
   * @returns {Promise<Object>} Resultado de la sincronización
   * @throws {Error} Si la sincronización falla
   */
  const syncConversionEdits = async (conversionId, changedFields) => {
    if (!WEBHOOK_URL) {
      throw new Error('❌ REACT_APP_N8N_WEBHOOK_SYNC_EDITS no está configurado en .env.local');
    }

    if (!conversionId) {
      throw new Error('❌ conversion_id es requerido');
    }

    if (!changedFields || Object.keys(changedFields).length === 0) {
      throw new Error('❌ changedFields no puede estar vacío');
    }

    setSyncing(true);
    setSyncError(null);

    try {
      console.log('📤 Sincronizando cambios a n8n:', {
        conversion_id: conversionId,
        changed_fields: changedFields,
        webhook_url: WEBHOOK_URL
      });

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversion_id: conversionId,
          changed_fields: changedFields,
          timestamp: new Date().toISOString(),
          source: 'admin_panel'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error en la sincronización');
      }

      console.log('✅ Sincronización exitosa:', result);

      return {
        success: true,
        conversion_id: result.conversion_id,
        updated_fields: result.updated_fields,
        updated_at: result.updated_at
      };

    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      setSyncError(error.message);
      throw error;

    } finally {
      setSyncing(false);
    }
  };

  return {
    syncConversionEdits,
    syncing,
    syncError
  };
};
