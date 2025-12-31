// Sync client config from Firebase Panel to n8n (Workflow 0)
export const syncClientConfig = async ({
  projectId,
  projectName,
  config,
  agents = []
}) => {
  const url = process.env.REACT_APP_N8N_SYNC_URL || 'https://n8n.railway.app/webhook/sync-client';
  const apiKey = process.env.REACT_APP_N8N_SYNC_SECRET;

  if (!url || !apiKey) {
    console.warn('[SyncClient] Falta configurar REACT_APP_N8N_SYNC_URL o REACT_APP_N8N_SYNC_SECRET');
    return { success: false, error: 'Configuración de sync incompleta' };
  }

  const formatPhone = (p) => {
    if (!p) return '';
    const clean = p.toString().replace(/\s+/g, '').replace('+', '');
    return clean ? `+${clean}` : '';
  };

  const primaryPhone = formatPhone((config && config.phone_filter) || (agents[0] && agents[0].phone) || '');

  // --- ENSAMBLADO AUTOMÁTICO DEL PROMPT ---
  const businessDesc = config?.business_description || 'un negocio';
  const conversions = config?.conversion_config || {};

  let labelInstructions = '';
  let hasDynamicValue = false;

  Object.entries(conversions).forEach(([label, data]) => {
    labelInstructions += `Label ${label} - ${data.name}:\n${data.criteria || 'Sin criterios definidos.'}\n\n`;
    if (data.use_dynamic_value) hasDynamicValue = true;
  });

  const basePrompt = `Eres un asistente experto que clasifica conversaciones de WhatsApp para ${businessDesc}.
  
Tus opciones de clasificación son:
${labelInstructions}${config?.prompt_template ? `Instrucciones adicionales:\n${config.prompt_template}` : ''}`;

  const TECHNICAL_PROMPT_SUFFIX = `\n\n---
      IMPORTANTE (INSTRUCCIONES DE SISTEMA):
      1. EXTRACCIÓN DE EMAIL: Si el cliente proporciona su correo en la charla, extráelo en "lead_email".
      2. VALOR DINÁMICO: ${hasDynamicValue ? 'Busca activamente valores monetarios de venta mencionados por el cliente o el agente.' : 'Usa el valor por defecto configurado para cada label.'} Extráelo como número con punto decimal en "value".
      3. FORMATO DE RESPUESTA: Responde ÚNICAMENTE con un objeto JSON válido, sin markdown ni texto extra.
      
      Estructura de respuesta:
      {
        "label": 1,
        "value": 0,
        "lead_email": "...",
        "confidence": 0.95,
        "reason": "..."
      }`;

  const fullPrompt = `${basePrompt}${TECHNICAL_PROMPT_SUFFIX}`;

  const payload = {
    project_id: projectId,
    client_name: projectName || projectId,
    status: 'active',
    phone_filter: primaryPhone,
    prompt_template: fullPrompt,
    conversion_config: conversions,
    openai_model: config?.openai_model || 'gpt-4o-mini',
    openai_temperature: config?.openai_temperature ?? 0.3,
    openai_max_tokens: config?.openai_max_tokens ?? 150,
    click_matching_window_days: config?.click_matching_window_days ?? 60,
    message_limit_per_conversation: config?.message_limit_per_conversation ?? 15,
    sheet_spreadsheet_id: config?.sheet_spreadsheet_id || '',
    sheet_messages_name: config?.sheet_messages_name || 'chats_raw',
    sheet_conversions_name: config?.sheet_conversions_name || 'conversions',
    agents: agents.map((a) => ({
      id: a.id || null,
      name: a.name || '',
      phone: formatPhone(a.phone),
      role: a.role || ''
    }))
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Sync fallo (${res.status}): ${text}`);
    }

    return { success: true };
  } catch (error) {
    console.error('[SyncClient] Error sincronizando con n8n:', error);
    return { success: false, error: error.message };
  }
};
