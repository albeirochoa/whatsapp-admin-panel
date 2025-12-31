import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import ConfigSection from './sections/ConfigSection';
import MonitoringSection from './sections/MonitoringSection';
import AgentsSection from './sections/AgentsSection';
import CodeSection from './sections/CodeSection';
import PreviewSection from './sections/PreviewSection';
import ProjectModal from './modals/ProjectModal';
import AgentModal from './modals/AgentModal';
import PlanLimitsBanner from './PlanLimitsBanner';
import { useProjects } from '../hooks/useProjects';
import { useAgents } from '../hooks/useAgents';
import { useConfig } from '../hooks/useConfig';

const Dashboard = ({ user, userData, onLogout, onSwitchView, isSuperAdmin }) => {
  const { projects, selectedProject, setSelectedProject, createProject, deleteProject } = useProjects(user, userData);
  const { agents, saveAgent, deleteAgent } = useAgents(user, selectedProject, userData);
  const { config, setConfig, saveConfig, publishing } = useConfig(user, selectedProject);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [notification, setNotification] = useState(null);

  const handleCreateProject = async (name) => {
    const result = await createProject(name);
    if (result.success) {
      setShowProjectModal(false);
    } else {
      alert(result.error || 'Error al crear proyecto');
    }
  };

  const handleSaveAgent = async (agentForm, editingAgent) => {
    const result = await saveAgent(agentForm, editingAgent);
    if (result.success) {
      setShowAgentModal(false);
      setEditingAgent(null);
    } else {
      alert(result.error || 'Error al guardar agente');
    }
  };

  const handleEditAgent = (agent) => {
    setEditingAgent(agent);
    setShowAgentModal(true);
  };

  const handleAddAgent = () => {
    setEditingAgent(null);
    setShowAgentModal(true);
  };

  const handleSaveConfig = async () => {
    const result = await saveConfig();
    if (result.success) {
      setNotification({ type: 'success', message: result.message });
      console.log('✅ URL del widget:', result.publicUrl);
    } else {
      setNotification({ type: 'error', message: result.error });
    }
    setTimeout(() => setNotification(null), 5000);
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

          footerSlot={
            isSuperAdmin && (
              <div style={{ padding: '10px 15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                  onClick={onSwitchView}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🛡️</span> Panel Admin
                </button>
              </div>
            )
          }
        />

        <main className="content-area">
          {selectedProject ? (
            <>
              <PlanLimitsBanner userData={userData} projects={projects} agents={agents} />

              <div className="content-header">
                <div>
                  <h1 className="content-title">{selectedProject.name}</h1>
                  <p className="content-subtitle">
                    Plan: <strong>{userData?.subscription?.plan?.toUpperCase() || 'FREE'}</strong>
                  </p>
                </div>
                <button
                  className="btn-delete"
                  style={{ padding: '10px 20px' }}
                  onClick={() => deleteProject(selectedProject.id)}
                >
                  Eliminar proyecto
                </button>
              </div>

              <MonitoringSection selectedProject={selectedProject} />

              {notification && (
                <div style={{
                  padding: '16px',
                  marginBottom: '20px',
                  borderRadius: '8px',
                  background: notification.type === 'success'
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  border: `2px solid ${notification.type === 'success' ? '#10b981' : '#ef4444'}`,
                  color: notification.type === 'success' ? '#047857' : '#991b1b',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {notification.type === 'success' ? '✅' : '❌'} {notification.message}
                </div>
              )}

              <ConfigSection config={config} setConfig={setConfig} onSave={handleSaveConfig} publishing={publishing} />
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
              {userData && (
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
                  Plan {userData.subscription?.plan?.toUpperCase() || 'FREE'}:
                  {projects.length} / {userData.subscription?.limits?.projects === -1 ? 'ilimitados' : userData.subscription?.limits?.projects} proyectos
                </p>
              )}
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
