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
      <button
        className="add-agent-btn"
        style={{ marginTop: '12px' }}
        onClick={onSave}
        disabled={publishing}
      >
        {publishing ? 'Publicando...' : 'Guardar y Publicar Widget 🚀'}
      </button>
    </div>
  );
};

export default ConfigSection;
