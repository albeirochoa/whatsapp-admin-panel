import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import ConfigSection from './sections/ConfigSection';
import AgentsSection from './sections/AgentsSection';
import CodeSection from './sections/CodeSection';
import PreviewSection from './sections/PreviewSection';
import ProjectModal from './modals/ProjectModal';
import AgentModal from './modals/AgentModal';
import { useProjects } from '../hooks/useProjects';
import { useAgents } from '../hooks/useAgents';
import { useConfig } from '../hooks/useConfig';

const Dashboard = ({ user, onLogout }) => {
  const { projects, selectedProject, setSelectedProject, createProject, deleteProject } = useProjects(user);
  const { agents, saveAgent, deleteAgent } = useAgents(user, selectedProject);
  const { config, setConfig, saveConfig } = useConfig(user, selectedProject);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);

  const handleCreateProject = async (name) => {
    await createProject(name);
    setShowProjectModal(false);
  };

  const handleSaveAgent = async (agentForm, editingAgent) => {
    await saveAgent(agentForm, editingAgent);
    setShowAgentModal(false);
    setEditingAgent(null);
  };

  const handleEditAgent = (agent) => {
    setEditingAgent(agent);
    setShowAgentModal(true);
  };

  const handleAddAgent = () => {
    setEditingAgent(null);
    setShowAgentModal(true);
  };

  return (
    <>
      <Header user={user} onLogout={onLogout} />

      <div className="main-content">
        <Sidebar
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
          onNewProject={() => setShowProjectModal(true)}
        />

        <main className="content-area">
          {selectedProject ? (
            <>
              <div className="content-header">
                <div>
                  <h1 className="content-title">{selectedProject.name}</h1>
                  <p className="content-subtitle">Configura tu widget de WhatsApp</p>
                </div>
                <button
                  className="btn-delete"
                  style={{ padding: '10px 20px' }}
                  onClick={() => deleteProject(selectedProject.id)}
                >
                  Eliminar proyecto
                </button>
              </div>

              <ConfigSection config={config} setConfig={setConfig} onSave={saveConfig} />
              <AgentsSection
                agents={agents}
                onAddAgent={handleAddAgent}
                onEditAgent={handleEditAgent}
                onDeleteAgent={deleteAgent}
              />
              <CodeSection user={user} selectedProject={selectedProject} />
              <PreviewSection />
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>Selecciona o crea un proyecto</h3>
              <p>Cada proyecto representa un sitio web donde instalarás el widget</p>
              <button className="add-agent-btn" onClick={() => setShowProjectModal(true)}>
                + Crear proyecto
              </button>
            </div>
          )}
        </main>
      </div>

      {showProjectModal && (
        <ProjectModal onClose={() => setShowProjectModal(false)} onSave={handleCreateProject} />
      )}

      {showAgentModal && (
        <AgentModal
          onClose={() => {
            setShowAgentModal(false);
            setEditingAgent(null);
          }}
          onSave={handleSaveAgent}
          editingAgent={editingAgent}
        />
      )}
    </>
  );
};

export default Dashboard;
