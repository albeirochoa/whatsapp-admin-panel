import React, { useState, useEffect } from 'react';

const AgentModal = ({ onClose, onSave, editingAgent }) => {
  const [agentForm, setAgentForm] = useState({
    name: '',
    role: '',
    phone: '',
    photo: 'https://cdn-icons-png.flaticon.com/512/3001/3001764.png',
    showOn: '',
    hideOn: ''
  });

  useEffect(() => {
    if (editingAgent) {
      setAgentForm({
        ...editingAgent,
        showOn: editingAgent.showOn?.join(', ') || '',
        hideOn: editingAgent.hideOn?.join(', ') || ''
      });
    }
  }, [editingAgent]);

  const handleSave = () => {
    onSave(agentForm, editingAgent);
    setAgentForm({
      name: '',
      role: '',
      phone: '',
      photo: 'https://cdn-icons-png.flaticon.com/512/3001/3001764.png',
      showOn: '',
      hideOn: ''
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">
          {editingAgent ? 'Editar agente' : 'Nuevo agente'}
        </h2>
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input
            type="text"
            className="form-input"
            value={agentForm.name}
            onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
            placeholder="María García"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Rol / Área</label>
          <input
            type="text"
            className="form-input"
            value={agentForm.role}
            onChange={(e) => setAgentForm({ ...agentForm, role: e.target.value })}
            placeholder="Ventas Bogotá"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Teléfono (con código de país, sin +)</label>
          <input
            type="text"
            className="form-input"
            value={agentForm.phone}
            onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
            placeholder="573001234567"
          />
        </div>
        <div className="form-group">
          <label className="form-label">URL de foto</label>
          <input
            type="text"
            className="form-input"
            value={agentForm.photo}
            onChange={(e) => setAgentForm({ ...agentForm, photo: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div className="form-group">
          <label className="form-label">Mostrar solo en URLs que contengan (separar por coma)</label>
          <input
            type="text"
            className="form-input"
            value={agentForm.showOn}
            onChange={(e) => setAgentForm({ ...agentForm, showOn: e.target.value })}
            placeholder="bogota, norte"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Ocultar en URLs que contengan (separar por coma)</label>
          <input
            type="text"
            className="form-input"
            value={agentForm.hideOn}
            onChange={(e) => setAgentForm({ ...agentForm, hideOn: e.target.value })}
            placeholder="medellin, sur"
          />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-save" onClick={handleSave}>
            {editingAgent ? 'Guardar cambios' : 'Agregar agente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentModal;
