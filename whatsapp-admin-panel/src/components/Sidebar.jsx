import React from 'react';

const Sidebar = ({ projects, selectedProject, onSelectProject, onNewProject }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-label">Proyectos</div>
        <div className="project-list">
          {projects.map(project => (
            <div
              key={project.id}
              className={`project-item ${selectedProject?.id === project.id ? 'active' : ''}`}
              onClick={() => onSelectProject(project)}
            >
              <div className="project-icon">🌐</div>
              <span className="project-name">{project.name}</span>
            </div>
          ))}
          <button className="add-project-btn" onClick={onNewProject}>
            <span style={{ fontSize: '18px' }}>+</span>
            Nuevo proyecto
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
