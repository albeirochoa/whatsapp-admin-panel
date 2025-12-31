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

  const [expandedLabel, setExpandedLabel] = useState("1"); // Por defecto el primero abierto

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
        Define los tipos de conversión que OpenAI puede clasificar. Cada label representa un nivel de calificación.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedLabels.map((label) => (
          <div
            key={label}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Cabecera del Acordeón */}
            <div
              onClick={() => setExpandedLabel(expandedLabel === label.toString() ? null : label.toString())}
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                background: expandedLabel === label.toString() ? '#f8fafc' : '#fff',
                borderBottom: expandedLabel === label.toString() ? '1px solid #e5e7eb' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '2px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  Label {label}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                  {localConversions[label].name || '(Sin nombre)'}
                </span>
                {expandedLabel !== label.toString() && (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    • {localConversions[label].value} {localConversions[label].currency}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {sortedLabels.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeConversion(label);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '4px'
                    }}
                    onMouseEnter={(e) => e.target.style.color = '#ef4444'}
                    onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                )}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transition: 'transform 0.2s',
                    transform: expandedLabel === label.toString() ? 'rotate(180deg)' : 'rotate(0deg)',
                    color: '#64748b'
                  }}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            {/* Contenido del Acordeón */}
            {expandedLabel === label.toString() && (
              <div style={{ padding: '16px', background: '#fff' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Nombre de la conversión
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={localConversions[label].name}
                      onChange={(e) => handleConversionChange(label, 'name', e.target.value)}
                      placeholder="ej: venta_confirmada"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                      Valor Fijo
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
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
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
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Criterios de Clasificación para la IA
                  </label>
                  <textarea
                    className="form-input"
                    value={localConversions[label].criteria || ''}
                    onChange={(e) => handleConversionChange(label, 'criteria', e.target.value)}
                    placeholder="Describe qué define a este lead (ej: pregunta por catálogo, confirma pago...)"
                    rows="3"
                    style={{ width: '100%', fontSize: '13px', fontFamily: 'inherit', lineHeight: '1.5' }}
                  />
                </div>

                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f8fafc', borderRadius: '6px' }}>
                  <input
                    type="checkbox"
                    id={`dynamic-${label}`}
                    checked={localConversions[label].use_dynamic_value || false}
                    onChange={(e) => handleConversionChange(label, 'use_dynamic_value', e.target.checked)}
                    style={{ width: 'auto', height: 'auto', cursor: 'pointer' }}
                  />
                  <label htmlFor={`dynamic-${label}`} style={{ fontSize: '12px', color: '#334155', cursor: 'pointer', fontWeight: '500' }}>
                    Priorizar valor detectado por IA en el chat
                  </label>
                </div>
              </div>
            )}
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
