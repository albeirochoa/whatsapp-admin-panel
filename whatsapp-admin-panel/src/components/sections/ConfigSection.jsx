import React from 'react';
import ConversionsEditor from './ConversionsEditor';

const ConfigSection = ({ config, setConfig, onSave, publishing }) => {
  return (
    <div className="card">
      <h3 className="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" />
        </svg>
        Configuración General
      </h3>

      {publishing && (
        <div style={{
          padding: '12px',
          background: 'rgba(37, 211, 102, 0.1)',
          border: '1px solid rgba(37, 211, 102, 0.3)',
          borderRadius: '8px',
          marginBottom: '20px',
          color: '#25D366',
          fontSize: '14px'
        }}>
          🚀 Publicando widget...
        </div>
      )}

      <div className="form-grid">
        <div className="form-group full-width">
          <label className="form-label">Mensaje predeterminado</label>
          <textarea
            className="form-input"
            value={config.message}
            onChange={(e) => setConfig({ ...config, message: e.target.value })}
            placeholder="¡Hola! 👋 Me gustaría obtener más información."
          />
        </div>
        <div className="form-group">
          <label className="form-label">URL del Webhook (Make/n8n)</label>
          <input
            type="text"
            className="form-input"
            value={config.webhookUrl}
            onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
            placeholder="https://hook.us1.make.com/..."
          />
        </div>
        <div className="form-group">
          <label className="form-label">Páginas a excluir (separadas por coma)</label>
          <input
            type="text"
            className="form-input"
            value={config.excludePages}
            onChange={(e) => setConfig({ ...config, excludePages: e.target.value })}
            placeholder="/checkout, /gracias, /carrito"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Delay para mostrar (ms)</label>
          <input
            type="number"
            className="form-input"
            value={config.delayShow}
            onChange={(e) => setConfig({ ...config, delayShow: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Solo en móvil</label>
          <select
            className="form-input"
            value={config.onlyMobile ? 'true' : 'false'}
            onChange={(e) => setConfig({ ...config, onlyMobile: e.target.value === 'true' })}
          >
            <option value="false">No, mostrar en todos</option>
            <option value="true">Sí, solo móvil</option>
          </select>
        </div>
      </div>

      {/* Sección de Conversiones */}
      <ConversionsEditor
        conversions={config.conversion_config || {
          "1": { name: "clic_boton_wa", value: 0, currency: "USD" },
          "2": { name: "chat_iniciado_wa", value: 15, currency: "USD" },
          "3": { name: "venta_confirmada_wa", value: 85, currency: "USD" }
        }}
        onChange={(updated) => setConfig({ ...config, conversion_config: updated })}
      />

      {/* Sección de Clasificación IA */}
      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#374151', display: 'flex', alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          Clasificación con OpenAI
        </h4>

        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Prompt Template *</label>
            <textarea
              className="form-input"
              value={config.prompt_template || ''}
              onChange={(e) => setConfig({ ...config, prompt_template: e.target.value })}
              placeholder="Eres un clasificador de leads. Clasifica cada conversación con un número:\n1 = Solo consultó\n2 = Interesado\n3 = Compró\n\nResponde SOLO con JSON: {\"label\": 1, \"confidence\": 0.95}"
              rows="6"
              style={{ fontFamily: 'monospace', fontSize: '13px' }}
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Define las reglas para OpenAI. Debe explicar cada label definido arriba.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Modelo OpenAI</label>
            <select
              className="form-input"
              value={config.openai_model || 'gpt-4o-mini'}
              onChange={(e) => setConfig({ ...config, openai_model: e.target.value })}
            >
              <option value="gpt-4o-mini">gpt-4o-mini (rápido, económico)</option>
              <option value="gpt-4o">gpt-4o (más potente)</option>
              <option value="gpt-4-turbo">gpt-4-turbo</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo (legacy)</option>
            </select>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Modelo usado para clasificación
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Temperatura</label>
            <input
              type="number"
              className="form-input"
              value={config.openai_temperature ?? 0.3}
              onChange={(e) => setConfig({ ...config, openai_temperature: parseFloat(e.target.value) || 0 })}
              min="0"
              max="1"
              step="0.1"
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              0.1 = más determinista, 0.7 = más creativo
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Max Tokens</label>
            <input
              type="number"
              className="form-input"
              value={config.openai_max_tokens ?? 150}
              onChange={(e) => setConfig({ ...config, openai_max_tokens: parseInt(e.target.value) || 150 })}
              min="50"
              max="1000"
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Longitud máxima de respuesta
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Ventana de Matching (días)</label>
            <input
              type="number"
              className="form-input"
              value={config.click_matching_window_days ?? 7}
              onChange={(e) => setConfig({ ...config, click_matching_window_days: parseInt(e.target.value) || 7 })}
              min="1"
              max="365"
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Ventana para buscar clicks anteriores
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Límite de mensajes por conversación</label>
            <input
              type="number"
              className="form-input"
              value={config.message_limit_per_conversation ?? 15}
              onChange={(e) => setConfig({ ...config, message_limit_per_conversation: parseInt(e.target.value) || 15 })}
              min="5"
              max="200"
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Cantidad máxima de mensajes a analizar
            </p>
          </div>
        </div>
      </div>

      {/* Sección de Google Sheets */}
      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#374151', display: 'flex', alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Google Sheets
        </h4>

        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Spreadsheet ID *</label>
            <input
              type="text"
              className="form-input"
              value={config.sheet_spreadsheet_id || ''}
              onChange={(e) => setConfig({ ...config, sheet_spreadsheet_id: e.target.value })}
              placeholder="1a2b3c4d5e6f7g8h9i0j..."
            />
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              ID del Google Sheet (desde la URL)
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Hoja de mensajes</label>
            <input
              type="text"
              className="form-input"
              value={config.sheet_messages_name || 'chats_raw'}
              onChange={(e) => setConfig({ ...config, sheet_messages_name: e.target.value })}
              placeholder="chats_raw"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hoja de conversiones</label>
            <input
              type="text"
              className="form-input"
              value={config.sheet_conversions_name || 'conversions'}
              onChange={(e) => setConfig({ ...config, sheet_conversions_name: e.target.value })}
              placeholder="conversions"
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Tracking & Privacidad
        </h4>

        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label" style={{ display: 'flex', alignItems: 'start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.enableTracking !== false}
                onChange={(e) => setConfig({ ...config, enableTracking: e.target.checked })}
                style={{ marginRight: '8px', marginTop: '2px' }}
              />
              <span>
                <strong>Habilitar tracking de Google Ads (gclid/gbraid/wbraid)</strong>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px', fontWeight: 'normal' }}>
                  Captura automáticamente IDs de campaña para atribución de conversiones
                </p>
              </span>
            </label>
          </div>

          {config.enableTracking !== false && (
            <>
              <div className="form-group full-width">
                <label className="form-label" style={{ display: 'flex', alignItems: 'start', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={config.requireConsent !== false}
                    onChange={(e) => setConfig({ ...config, requireConsent: e.target.checked })}
                    style={{ marginRight: '8px', marginTop: '2px' }}
                  />
                  <span>
                    <strong>Requerir consentimiento GDPR antes de guardar datos</strong>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '4px', fontWeight: 'normal' }}>
                      Cumple con regulaciones europeas de privacidad (recomendado para EU)
                    </p>
                  </span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Días de persistencia del tracking</label>
                <input
                  type="number"
                  className="form-input"
                  value={config.trackingMaxAgeDays || 90}
                  onChange={(e) => setConfig({ ...config, trackingMaxAgeDays: parseInt(e.target.value) || 90 })}
                  min="1"
                  max="365"
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Tiempo máximo que se conserva el ID de campaña (1-365 días)
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Formato del tracking en mensaje</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.trackingFormat || '[ref:{id}]'}
                  onChange={(e) => setConfig({ ...config, trackingFormat: e.target.value })}
                  placeholder="[ref:{id}]"
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Usa {'{id}'}, {'{type}'}, {'{source}'} como variables
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <button
        className="add-agent-btn"
        style={{ marginTop: '20px' }}
        onClick={onSave}
        disabled={publishing}
      >
        {publishing ? 'Publicando...' : 'Guardar y Publicar Widget 🚀'}
      </button>
    </div>
  );
};

export default ConfigSection;
