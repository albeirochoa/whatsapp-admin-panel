import React, { useState } from 'react';

const ProjectModal = ({ onClose, onSave }) => {
  const [projectName, setProjectName] = useState('');

  const handleSave = () => {
    onSave(projectName);
    setProjectName('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Nuevo Proyecto</h2>
        <div className="form-group">
          <label className="form-label">Nombre del proyecto</label>
          <input
            type="text"
            className="form-input"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Mi sitio web"
            autoFocus
          />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-save" onClick={handleSave}>
            Crear proyecto
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
