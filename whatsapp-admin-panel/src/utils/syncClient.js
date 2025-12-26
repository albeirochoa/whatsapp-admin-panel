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

  const primaryPhone = (config && config.phone_filter) || (agents[0] && agents[0].phone) || '';

  const payload = {
    project_id: projectId,
    client_name: projectName || projectId,
    status: 'active',
    phone_filter: primaryPhone,
    prompt_template: config?.prompt_template || '',
    conversion_config: config?.conversion_config || null,
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
      phone: a.phone || '',
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
