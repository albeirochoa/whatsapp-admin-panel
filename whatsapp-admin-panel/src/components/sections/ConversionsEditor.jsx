import React, { useState } from 'react';

const ConversionsEditor = ({ conversions, onChange }) => {
  const [localConversions, setLocalConversions] = useState(conversions || {
    "1": { name: "clic_boton_wa", value: 0, currency: "USD" },
    "2": { name: "chat_iniciado_wa", value: 15, currency: "USD" },
    "3": { name: "venta_confirmada_wa", value: 85, currency: "USD" }
  });

  const handleConversionChange = (label, field, value) => {
    const updated = {
      ...localConversions,
      [label]: {
        ...localConversions[label],
        [field]: field === 'value' ? (parseFloat(value) || 0) : value
      }
    };
    setLocalConversions(updated);
    onChange(updated);
  };

  const addConversion = () => {
    const labels = Object.keys(localConversions).map(Number).sort((a, b) => a - b);
    const nextLabel = labels.length > 0 ? Math.max(...labels) + 1 : 1;

    const updated = {
      ...localConversions,
      [nextLabel]: { name: "", value: 0, currency: "USD" }
    };
    setLocalConversions(updated);
    onChange(updated);
  };

  const removeConversion = (label) => {
    const updated = { ...localConversions };
    delete updated[label];
    setLocalConversions(updated);
    onChange(updated);
  };

  const sortedLabels = Object.keys(localConversions).map(Number).sort((a, b) => a - b);

  return (
    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#374151', display: 'flex', alignItems: 'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        Configuración de Conversiones
      </h4>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
        Define los tipos de conversión que OpenAI puede clasificar. Cada label (1, 2, 3...) representa un nivel de calificación.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedLabels.map((label) => (
          <div
            key={label}
            style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  Label {label}
                </span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  OpenAI clasificará con este número
                </span>
              </div>

              {sortedLabels.length > 1 && (
                <button
                  onClick={() => removeConversion(label)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  title="Eliminar conversión"
                >
                  ×
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Nombre de la conversión *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={localConversions[label].name}
                  onChange={(e) => handleConversionChange(label, 'name', e.target.value)}
                  placeholder="ej: chat_iniciado_wa"
                  style={{ width: '100%' }}
                />
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  Usado en external_attrib_id (usar snake_case)
                </p>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Valor
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={localConversions[label].value}
                  onChange={(e) => handleConversionChange(label, 'value', e.target.value)}
                  placeholder="0"
                  step="0.01"
                  style={{ width: '100%' }}
                />
                <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  Puede ser 0 (vacío)
                </p>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                  Moneda
                </label>
                <select
                  className="form-input"
                  value={localConversions[label].currency}
                  onChange={(e) => handleConversionChange(label, 'currency', e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="COP">COP</option>
                  <option value="MXN">MXN</option>
                  <option value="ARS">ARS</option>
                  <option value="BRL">BRL</option>
                  <option value="CLP">CLP</option>
                  <option value="PEN">PEN</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addConversion}
        style={{
          marginTop: '12px',
          padding: '10px 16px',
          background: 'transparent',
          border: '2px dashed #d1d5db',
          borderRadius: '8px',
          color: '#6b7280',
          cursor: 'pointer',
          width: '100%',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = '#10b981';
          e.target.style.color = '#10b981';
          e.target.style.background = '#f0fdf4';
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = '#d1d5db';
          e.target.style.color = '#6b7280';
          e.target.style.background = 'transparent';
        }}
      >
        <span style={{ fontSize: '18px' }}>+</span>
        Agregar Conversión
      </button>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#fffbeb',
        border: '1px solid #fcd34d',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#92400e'
      }}>
        <strong>💡 Tip:</strong> Asegúrate de actualizar el <code>prompt_template</code> abajo para que OpenAI conozca todos los labels que definiste aquí.
      </div>
    </div>
  );
};

export default ConversionsEditor;
