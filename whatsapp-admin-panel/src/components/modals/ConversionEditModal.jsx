import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useConversionSync } from '../../hooks/useConversionSync';

const ConversionEditModal = ({ conversion, isOpen, onClose, onSave }) => {
  // Estados del formulario
  const [conversionName, setConversionName] = useState(conversion?.conversion_name || '');
  const [conversionValue, setConversionValue] = useState(conversion?.conversion_value || 0);
  const [leadName, setLeadName] = useState(conversion?.lead_name || '');
  const [leadEmail, setLeadEmail] = useState(conversion?.lead_email || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Hook de sincronización
  const { syncConversionEdits, syncing } = useConversionSync();

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // 1️⃣ Detectar qué cambió
      const changedFields = {};

      if (conversionName !== conversion.conversion_name) {
        changedFields.conversion_name = conversionName;
      }
      if (Number(conversionValue) !== Number(conversion.conversion_value)) {
        changedFields.conversion_value = Number(conversionValue);
      }
      if (leadName !== conversion.lead_name) {
        changedFields.lead_name = leadName;
      }
      if (leadEmail !== conversion.lead_email) {
        changedFields.lead_email = leadEmail;
      }

      // Si no hay cambios
      if (Object.keys(changedFields).length === 0) {
        setError('No hay cambios para guardar');
        setSaving(false);
        return;
      }

      console.log('💾 Guardando cambios:', changedFields);

      // 2️⃣ Guardar en Firestore (para el panel)
      const conversionRef = doc(db, 'conversions', conversion.id);
      await updateDoc(conversionRef, {
        ...changedFields,
        _edited_by: 'user',
        _edit_timestamp: new Date().toISOString()
      });

      console.log('✅ Firestore actualizado');

      // 3️⃣ Sincronizar a PostgreSQL + Google Sheets
      await syncConversionEdits(conversion.conversion_id, changedFields);

      console.log('✅ PostgreSQL y Sheets sincronizados');

      // 4️⃣ Notificar y cerrar
      if (onSave) onSave();
      onClose();

    } catch (error) {
      console.error('❌ Error al guardar:', error);
      setError(error.message || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
            Editar Conversión
          </h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Los cambios se sincronizarán automáticamente con PostgreSQL y Google Sheets
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#991b1b',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Conversion Name */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Nombre de Conversión
            </label>
            <input
              type="text"
              value={conversionName}
              onChange={(e) => setConversionName(e.target.value)}
              disabled={saving || syncing}
              placeholder="ej: venta_confirmada_wa"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Conversion Value */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Valor de Conversión
            </label>
            <input
              type="number"
              value={conversionValue}
              onChange={(e) => setConversionValue(e.target.value)}
              disabled={saving || syncing}
              placeholder="0"
              step="0.01"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Lead Name */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Nombre del Lead
            </label>
            <input
              type="text"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              disabled={saving || syncing}
              placeholder="ej: Juan Pérez"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Lead Email */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Email del Lead
            </label>
            <input
              type="email"
              value={leadEmail}
              onChange={(e) => setLeadEmail(e.target.value)}
              disabled={saving || syncing}
              placeholder="ej: juan@email.com"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#10b981'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>

        {/* Read-Only Fields Info */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>
            Campos de Solo Lectura
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '12px' }}>
            <span style={{ color: '#64748b' }}>ID:</span>
            <span style={{ color: '#334155', fontFamily: 'monospace' }}>{conversion.conversion_id}</span>

            <span style={{ color: '#64748b' }}>Teléfono:</span>
            <span style={{ color: '#334155', fontFamily: 'monospace' }}>{conversion.phone_e164}</span>

            <span style={{ color: '#64748b' }}>AI Label:</span>
            <span style={{ color: '#334155' }}>
              {conversion.ai_label} ({conversion.ai_label === 1 ? 'Sin calificar' : conversion.ai_label === 2 ? 'Lead calificado' : 'Venta confirmada'})
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          marginTop: '24px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            disabled={saving || syncing}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '600',
              cursor: saving || syncing ? 'not-allowed' : 'pointer',
              opacity: saving || syncing ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => !saving && !syncing && (e.target.style.background = '#f9fafb')}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={saving || syncing}
            style={{
              padding: '10px 20px',
              background: saving || syncing ? '#9ca3af' : '#10b981',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: saving || syncing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => !saving && !syncing && (e.target.style.background = '#059669')}
            onMouseLeave={(e) => !saving && !syncing && (e.target.style.background = '#10b981')}
          >
            {saving || syncing ? (
              <>
                <span style={{ marginRight: '8px' }}>⏳</span>
                Guardando...
              </>
            ) : (
              <>
                <span style={{ marginRight: '8px' }}>💾</span>
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversionEditModal;
