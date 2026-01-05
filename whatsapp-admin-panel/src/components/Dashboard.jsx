import { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
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
  const [activeTab, setActiveTab] = useState(0);

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header user={user} onLogout={onLogout} />

      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <Sidebar
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
          onNewProject={() => setShowProjectModal(true)}
          footerSlot={
            isSuperAdmin && (
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AdminPanelSettingsIcon />}
                onClick={onSwitchView}
                size="small"
              >
                Panel Admin
              </Button>
            )
          }
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            bgcolor: 'background.default',
          }}
        >
          {selectedProject ? (
            <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
              <PlanLimitsBanner userData={userData} projects={projects} agents={agents} />

              {/* Header del proyecto */}
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {selectedProject.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Plan: <strong>{userData?.subscription?.plan?.toUpperCase() || 'FREE'}</strong>
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => deleteProject(selectedProject.id)}
                >
                  Eliminar proyecto
                </Button>
              </Box>

              {/* Sistema de Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, newValue) => setActiveTab(newValue)}
                  aria-label="Dashboard sections"
                >
                  <Tab label="Configuración" />
                  <Tab label="Agentes" />
                  <Tab label="Estadísticas" />
                  <Tab label="Código" />
                </Tabs>
              </Box>

              {/* Tab 0: Configuración */}
              <Box role="tabpanel" hidden={activeTab !== 0}>
                {activeTab === 0 && (
                  <>
                    <ConfigSection
                      config={config}
                      setConfig={setConfig}
                      onSave={handleSaveConfig}
                      publishing={publishing}
                    />
                    <Box mt={4}>
                      <PreviewSection />
                    </Box>
                  </>
                )}
              </Box>

              {/* Tab 1: Agentes */}
              <Box role="tabpanel" hidden={activeTab !== 1}>
                {activeTab === 1 && (
                  <AgentsSection
                    agents={agents}
                    onAddAgent={handleAddAgent}
                    onEditAgent={handleEditAgent}
                    onDeleteAgent={deleteAgent}
                  />
                )}
              </Box>

              {/* Tab 2: Estadísticas */}
              <Box role="tabpanel" hidden={activeTab !== 2}>
                {activeTab === 2 && (
                  <MonitoringSection selectedProject={selectedProject} />
                )}
              </Box>

              {/* Tab 3: Código */}
              <Box role="tabpanel" hidden={activeTab !== 3}>
                {activeTab === 3 && (
                  <CodeSection user={user} selectedProject={selectedProject} />
                )}
              </Box>
            </Container>
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="60vh"
            >
              <Box textAlign="center" maxWidth={500}>
                <Typography variant="h1" fontSize="4rem" mb={2}>
                  📁
                </Typography>
                <Typography variant="h5" gutterBottom>
                  Selecciona o crea un proyecto
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={2}>
                  Cada proyecto representa un sitio web donde instalarás el widget
                </Typography>
                {userData && (
                  <Typography variant="caption" color="text.secondary" display="block" mb={3}>
                    Plan {userData.subscription?.plan?.toUpperCase() || 'FREE'}:
                    {' '}{projects.length} / {userData.subscription?.limits?.projects === -1 ? 'ilimitados' : userData.subscription?.limits?.projects} proyectos
                  </Typography>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => setShowProjectModal(true)}
                >
                  + Crear proyecto
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Modals */}
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

      {/* Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={5000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notification && (
          <Alert
            onClose={() => setNotification(null)}
            severity={notification.type}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
