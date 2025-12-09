import React from 'react';
import { WhatsAppIcon } from '../Icons';

const AgentsSection = ({ agents, onAddAgent, onEditAgent, onDeleteAgent }) => {
  return (
    <div className="card">
      <div className="agents-header">
        <h3 className="card-title" style={{ marginBottom: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75" />
          </svg>
          Agentes ({agents.length})
        </h3>
        <button className="add-agent-btn" onClick={onAddAgent}>
          + Agregar agente
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <h3>Sin agentes</h3>
          <p>Agrega tu primer agente para comenzar</p>
        </div>
      ) : (
        <div className="agents-grid">
          {agents.map(agent => (
            <div key={agent.id} className="agent-card">
              <div className="agent-header">
                <img src={agent.photo} alt="" className="agent-avatar" />
                <div className="agent-info">
                  <h4>{agent.name}</h4>
                  <p>{agent.role}</p>
                </div>
              </div>
              <div className="agent-phone">
                <WhatsAppIcon />
                +{agent.phone}
              </div>
              <div className="agent-rules">
                {agent.showOn?.length > 0 && (
                  <div><strong>Mostrar en:</strong> {agent.showOn.join(', ')}</div>
                )}
                {agent.hideOn?.length > 0 && (
                  <div><strong>Ocultar en:</strong> {agent.hideOn.join(', ')}</div>
                )}
                {(!agent.showOn?.length && !agent.hideOn?.length) && (
                  <div>Aparece en todas las páginas</div>
                )}
              </div>
              <div className="agent-actions">
                <button className="btn-edit" onClick={() => onEditAgent(agent)}>
                  Editar
                </button>
                <button className="btn-delete" onClick={() => onDeleteAgent(agent.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentsSection;
