import React from 'react';

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
