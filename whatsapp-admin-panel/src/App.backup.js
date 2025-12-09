import React, { useState, useEffect } from 'react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  onSnapshot 
} from 'firebase/firestore';

// ==========================================
// ESTILOS
// ==========================================
const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
    background: linear-gradient(135deg, #0a1628 0%, #1a2744 50%, #0d1f3c 100%);
    min-height: 100vh;
    color: #e2e8f0;
  }

  .app-container {
    min-height: 100vh;
  }

  /* Login Screen */
  .login-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .login-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 48px;
    text-align: center;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .login-logo {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    box-shadow: 0 10px 40px rgba(37, 211, 102, 0.3);
  }

  .login-logo svg {
    width: 44px;
    height: 44px;
  }

  .login-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .login-subtitle {
    color: #64748b;
    margin-bottom: 32px;
    font-size: 15px;
  }

  .google-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    padding: 16px 24px;
    background: #fff;
    color: #1a1a2e;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .google-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 40px rgba(255, 255, 255, 0.2);
  }

  /* Header */
  .header {
    background: rgba(255, 255, 255, 0.02);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    padding: 16px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-logo {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-logo svg {
    width: 24px;
    height: 24px;
  }

  .header-title {
    font-size: 18px;
    font-weight: 700;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 100px;
  }

  .user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }

  .user-name {
    font-size: 14px;
    font-weight: 500;
  }

  .logout-btn {
    padding: 10px 20px;
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  /* Main Layout */
  .main-content {
    display: flex;
    min-height: calc(100vh - 73px);
  }

  /* Sidebar */
  .sidebar {
    width: 280px;
    background: rgba(255, 255, 255, 0.02);
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    padding: 24px 16px;
  }

  .sidebar-section {
    margin-bottom: 24px;
  }

  .sidebar-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748b;
    padding: 0 12px;
    margin-bottom: 8px;
  }

  .project-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .project-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid transparent;
  }

  .project-item:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  .project-item.active {
    background: rgba(37, 211, 102, 0.1);
    border-color: rgba(37, 211, 102, 0.3);
  }

  .project-icon {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .project-item.active .project-icon {
    background: rgba(37, 211, 102, 0.2);
  }

  .project-name {
    font-size: 14px;
    font-weight: 500;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .add-project-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    width: 100%;
    background: transparent;
    border: 1px dashed rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    color: #64748b;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .add-project-btn:hover {
    border-color: #25D366;
    color: #25D366;
    background: rgba(37, 211, 102, 0.05);
  }

  /* Content Area */
  .content-area {
    flex: 1;
    padding: 32px;
    overflow-y: auto;
  }

  .content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }

  .content-title {
    font-size: 24px;
    font-weight: 700;
  }

  .content-subtitle {
    color: #64748b;
    font-size: 14px;
    margin-top: 4px;
  }

  /* Cards */
  .card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .card-title svg {
    color: #25D366;
  }

  /* Form Elements */
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group.full-width {
    grid-column: span 2;
  }

  .form-label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #94a3b8;
    margin-bottom: 8px;
  }

  .form-input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #fff;
    font-size: 14px;
    transition: all 0.2s;
    font-family: inherit;
  }

  .form-input:focus {
    outline: none;
    border-color: #25D366;
    box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
  }

  .form-input::placeholder {
    color: #475569;
  }

  textarea.form-input {
    resize: vertical;
    min-height: 80px;
  }

  /* Agents List */
  .agents-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .add-agent-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .add-agent-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(37, 211, 102, 0.3);
  }

  .agents-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  .agent-card {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 20px;
    transition: all 0.2s;
  }

  .agent-card:hover {
    border-color: rgba(37, 211, 102, 0.3);
  }

  .agent-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }

  .agent-avatar {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    object-fit: cover;
    background: rgba(255, 255, 255, 0.1);
  }

  .agent-info h4 {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .agent-info p {
    font-size: 13px;
    color: #64748b;
  }

  .agent-phone {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #25D366;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: rgba(37, 211, 102, 0.1);
    border-radius: 8px;
  }

  .agent-rules {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 16px;
  }

  .agent-rules strong {
    color: #94a3b8;
  }

  .agent-actions {
    display: flex;
    gap: 8px;
  }

  .agent-actions button {
    flex: 1;
    padding: 10px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .btn-edit {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    color: #60a5fa;
  }

  .btn-edit:hover {
    background: rgba(59, 130, 246, 0.2);
  }

  .btn-delete {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #f87171;
  }

  .btn-delete:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  /* Code Output */
  .code-section {
    margin-top: 24px;
  }

  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .copy-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .copy-btn:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .copy-btn.copied {
    background: rgba(37, 211, 102, 0.2);
    border-color: rgba(37, 211, 102, 0.4);
    color: #25D366;
  }

  .code-block {
    background: #0d1117;
    border-radius: 12px;
    padding: 20px;
    overflow-x: auto;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 13px;
    line-height: 1.6;
    color: #c9d1d9;
    max-height: 400px;
    overflow-y: auto;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 32px;
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 24px;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
  }

  .modal-actions button {
    flex: 1;
    padding: 14px 24px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .btn-cancel {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #94a3b8;
  }

  .btn-cancel:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .btn-save {
    background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
    border: none;
    color: white;
  }

  .btn-save:hover {
    transform: translateY(-1px);
    box-shadow: 0 5px 20px rgba(37, 211, 102, 0.3);
  }

  /* Preview Widget */
  .preview-section {
    position: relative;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-radius: 12px;
    min-height: 200px;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    padding: 20px;
  }

  .preview-widget {
    position: relative;
  }

  .preview-fab {
    width: 60px;
    height: 60px;
    background: #25D366;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    cursor: pointer;
  }

  .preview-fab svg {
    width: 32px;
    height: 32px;
    fill: white;
  }

  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #64748b;
  }

  .empty-icon {
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    font-size: 32px;
  }

  .empty-state h3 {
    font-size: 18px;
    color: #94a3b8;
    margin-bottom: 8px;
  }

  .empty-state p {
    font-size: 14px;
    margin-bottom: 24px;
  }

  /* Responsive */
  @media (max-width: 900px) {
    .main-content {
      flex-direction: column;
    }
    
    .sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .form-group.full-width {
      grid-column: span 1;
    }
  }

  @media (max-width: 600px) {
    .header {
      padding: 12px 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    
    .content-area {
      padding: 20px 16px;
    }
    
    .agents-grid {
      grid-template-columns: 1fr;
    }
  }
`;

// ==========================================
// ICONOS SVG
// ==========================================
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="white">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.43 1.27 4.88L2 22l5.23-1.24C8.7 21.55 10.32 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.46 14.27c-.24.67-1.18 1.23-1.93 1.39-.52.11-1.19.2-3.46-.74-2.9-1.2-4.77-4.16-4.92-4.35-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.01-2.42.24-.27.63-.39.87-.39.11 0 .2 0 .29.01.26.01.39.03.56.43.21.51.73 1.78.79 1.91.06.13.11.29.02.46-.09.18-.13.28-.26.44-.13.15-.27.34-.39.45-.13.12-.26.26-.11.51.14.25.64 1.06 1.38 1.72.95.85 1.75 1.11 2 1.24.25.13.4.11.54-.07.15-.18.63-.73.8-.98.17-.25.33-.21.56-.12.23.08 1.45.68 1.69.81.25.12.41.18.47.28.06.11.06.62-.18 1.29z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
function App() {
  // Estado de autenticación
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado de proyectos
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  // Estado de configuración
  const [config, setConfig] = useState({
    message: '¡Hola! 👋 Me gustaría obtener más información.',
    webhookUrl: '',
    excludePages: '/checkout, /gracias',
    delayShow: 2000,
    onlyMobile: false
  });

  // Estado de agentes
  const [agents, setAgents] = useState([]);

  // Modales
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  
  // Código copiado
  const [copied, setCopied] = useState(false);

  // Formulario de agente
  const [agentForm, setAgentForm] = useState({
    name: '',
    role: '',
    phone: '',
    photo: 'https://cdn-icons-png.flaticon.com/512/3001/3001764.png',
    showOn: '',
    hideOn: ''
  });

  // ==========================================
  // AUTH EFFECTS
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Cargar proyectos cuando hay usuario
  useEffect(() => {
    if (!user) return;

    const projectsRef = collection(db, 'users', user.uid, 'projects');
    const unsubscribe = onSnapshot(projectsRef, (snapshot) => {
      const projectsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsList);
      
      // Seleccionar primer proyecto si no hay ninguno seleccionado
      if (!selectedProject && projectsList.length > 0) {
        setSelectedProject(projectsList[0]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Cargar configuración y agentes del proyecto seleccionado
  useEffect(() => {
    if (!user || !selectedProject) return;

    // Cargar config
    const configRef = doc(db, 'users', user.uid, 'projects', selectedProject.id);
    getDoc(configRef).then((docSnap) => {
      if (docSnap.exists() && docSnap.data().config) {
        setConfig(docSnap.data().config);
      }
    });

    // Cargar agentes
    const agentsRef = collection(db, 'users', user.uid, 'projects', selectedProject.id, 'agents');
    const unsubscribe = onSnapshot(agentsRef, (snapshot) => {
      const agentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAgents(agentsList);
    });

    return () => unsubscribe();
  }, [user, selectedProject]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error login:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSelectedProject(null);
      setProjects([]);
    } catch (error) {
      console.error('Error logout:', error);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    const projectRef = doc(collection(db, 'users', user.uid, 'projects'));
    await setDoc(projectRef, {
      name: newProjectName,
      createdAt: new Date().toISOString(),
      config: {
        message: '¡Hola! 👋 Me gustaría obtener más información.',
        webhookUrl: '',
        excludePages: '/checkout, /gracias',
        delayShow: 2000,
        onlyMobile: false
      }
    });

    setNewProjectName('');
    setShowProjectModal(false);
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm('¿Eliminar este proyecto?')) return;
    
    await deleteDoc(doc(db, 'users', user.uid, 'projects', projectId));
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
    }
  };

  const saveConfig = async () => {
    if (!selectedProject) return;

    const projectRef = doc(db, 'users', user.uid, 'projects', selectedProject.id);
    await setDoc(projectRef, {
      ...selectedProject,
      config
    }, { merge: true });
  };

  const saveAgent = async () => {
    if (!selectedProject) return;

    const agentsRef = collection(db, 'users', user.uid, 'projects', selectedProject.id, 'agents');
    
    const agentData = {
      ...agentForm,
      showOn: agentForm.showOn.split(',').map(s => s.trim()).filter(Boolean),
      hideOn: agentForm.hideOn.split(',').map(s => s.trim()).filter(Boolean)
    };

    if (editingAgent) {
      await setDoc(doc(agentsRef, editingAgent.id), agentData);
    } else {
      await setDoc(doc(agentsRef), agentData);
    }

    setShowAgentModal(false);
    setEditingAgent(null);
    setAgentForm({
      name: '',
      role: '',
      phone: '',
      photo: 'https://cdn-icons-png.flaticon.com/512/3001/3001764.png',
      showOn: '',
      hideOn: ''
    });
  };

  const deleteAgent = async (agentId) => {
    if (!window.confirm('¿Eliminar este agente?')) return;
    
    await deleteDoc(doc(db, 'users', user.uid, 'projects', selectedProject.id, 'agents', agentId));
  };

  const openEditAgent = (agent) => {
    setEditingAgent(agent);
    setAgentForm({
      ...agent,
      showOn: agent.showOn?.join(', ') || '',
      hideOn: agent.hideOn?.join(', ') || ''
    });
    setShowAgentModal(true);
  };

  // ==========================================
  // GENERAR CÓDIGO
  // ==========================================
  const generateCode = () => {
    if (!selectedProject || !user) return '';

    return `<!-- WhatsApp Widget Dinámico - ${selectedProject.name} -->
<!-- Los cambios en el panel se reflejan automáticamente -->

<script>
(function(){var e="whatsapp-widget-admin",t="${user.uid}",a="${selectedProject.id}",n="https://firestore.googleapis.com/v1/projects/"+e+"/databases/(default)/documents/users/"+t+"/projects/"+a,o=n+"/agents",i={},r=[];function s(e){if(!e)return null;for(var t=0,a=0;a<e.length;a++){var n=e.charCodeAt(a);t=(t<<5)-t+n,t&=t}for(var o=Math.abs(t).toString(36).substring(0,5);o.length<5;)o+="0";return o.toUpperCase()}function c(){var e=window.location.origin+window.location.pathname,t=window.location.search;if(!t||"?"===t)return e;for(var a=["gclid","gbraid","wbraid","fbclid","msclkid","utm_source","utm_medium","utm_campaign","utm_term","utm_content","gad_source","gad_campaignid"],n=t.substring(1).split("&"),o=[],i=0;i<n.length;i++){var r=n[i].split("=")[0];-1===a.indexOf(r)&&n[i]&&o.push(n[i])}return o.length>0&&(e+="?"+o.join("&")),e}function l(e){if(!e)return"direct";var t=e;-1!==e.indexOf(".")&&(t=e.split(".").pop());var a=t.substring(0,2);return"Cj"===a?"google":"GB"===a?"google-gbraid":"wb"===a||"WB"===a?"google-wbraid":t.length>20?"google":"unknown"}function d(){return/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)||window.innerWidth<=768}!function(){var e=window.location.search,t=null;if(e)for(var a=e.substring(1).split("&"),n=0;n<a.length;n++){var o=a[n].split("=");if(-1!==["gclid","gbraid","wbraid"].indexOf(o[0])){t=decodeURIComponent(o[1]);break}}if(t){var i=new Date;i.setDate(i.getDate()+90);var r=s(t);document.cookie="_gcl_aw="+t+"; expires="+i.toUTCString()+"; path=/; SameSite=Lax",document.cookie="_gcl_hash="+r+"; expires="+i.toUTCString()+"; path=/; SameSite=Lax";try{localStorage.setItem("_gcl_aw",t),localStorage.setItem("_gcl_hash",r)}catch(e){}}}();function u(){var e=null,t=document.cookie.match(new RegExp("(^| )_gcl_aw=([^;]+)"));if(t)e=t[2];else try{e=localStorage.getItem("_gcl_aw")}catch(e){}return e?-1!==e.indexOf(".")?e.split(".").pop():e:null}function g(){var e=document.cookie.match(new RegExp("(^| )_gcl_hash=([^;]+)"));if(e)return e[2];try{return localStorage.getItem("_gcl_hash")}catch(e){return null}}function p(e,t,n){var o=u(),r=g();o&&!r&&(r=s(o));var p=(n||i.message||"¡Hola! 👋")+" 📄 "+document.title;r&&(p+=" 📋 Ref: #"+r),p+=" 🔗 "+c();var f=d()?"https://wa.me/"+e+"?text="+encodeURIComponent(p):"https://web.whatsapp.com/send?phone="+e+"&text="+encodeURIComponent(p);d()?window.location.href=f:window.open(f,"_blank"),function(e){if(i.webhookUrl){var t=JSON.stringify(e);if(navigator.sendBeacon){var a=new Blob([t],{type:"text/plain"});if(navigator.sendBeacon(i.webhookUrl,a))return}fetch(i.webhookUrl,{method:"POST",headers:{"Content-Type":"text/plain"},body:t,keepalive:!0,credentials:"omit"}).catch(function(e){})}}({gclid:o||null,gclid_hash:r||null,phone_e164:e,agent_selected:t||"default",first_click_time_iso:(new Date).toISOString(),landing_url:window.location.href,page_title:document.title,source:l(o),user_agent:navigator.userAgent,device_type:d()?"mobile":"desktop",project_id:a}),window.dataLayer=window.dataLayer||[],window.dataLayer.push({event:"whatsapp_lead_click",lead_platform:"whatsapp",agent_name:t||"default",lead_traffic:o?"paid_google":"organic",lead_ref:r||"sin_ref"})}function f(e){var t=window.location.href.toLowerCase();if(e.hideOn&&e.hideOn.length>0)for(var a=0;a<e.hideOn.length;a++)if(-1!==t.indexOf(e.hideOn[a].toLowerCase()))return!1;if(!e.showOn||0===e.showOn.length)return!0;for(var n=0;n<e.showOn.length;n++)if(-1!==t.indexOf(e.showOn[n].toLowerCase()))return!0;return!1}function m(e){return void 0!==e.stringValue?e.stringValue:void 0!==e.integerValue?parseInt(e.integerValue):void 0!==e.booleanValue?e.booleanValue:void 0!==e.arrayValue?(e.arrayValue.values||[]).map(m):void 0!==e.mapValue?function(e){var t={},a=e.mapValue.fields||{};for(var n in a)t[n]=m(a[n]);return t}(e):null}function h(e){var t={},a=e.fields||{};for(var n in a)t[n]=m(a[n]);return t}function v(){var e=document.getElementById("wa-widget-menu");e&&("block"===e.style.display?(e.style.display="none",e.style.opacity="0",e.style.transform="translateY(20px)"):(e.style.display="block",setTimeout(function(){e.style.opacity="1",e.style.transform="translateY(0)"},10)))}var W='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#25D366" d="M4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98c-0.001,0,0,0,0,0h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303z"/><path fill="#25D366" d="M4.868,43.803c-0.132,0-0.26-0.052-0.355-0.148c-0.125-0.127-0.174-0.312-0.127-0.483l2.639-9.636c-1.636-2.906-2.499-6.206-2.497-9.556C4.532,13.238,13.273,4.5,24.014,4.5c5.21,0.002,10.105,2.031,13.784,5.713c3.679,3.683,5.704,8.577,5.702,13.781c-0.004,10.741-8.746,19.48-19.486,19.48c-3.189-0.001-6.344-0.788-9.144-2.277l-9.875,2.589C4.953,43.798,4.911,43.803,4.868,43.803z"/><path fill="#cfd8dc" d="M24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,4C24.014,4,24.014,4,24.014,4C12.998,4,4.032,12.962,4.027,23.979c-0.001,3.367,0.849,6.685,2.461,9.622l-2.585,9.439c-0.094,0.345,0.002,0.713,0.254,0.967c0.19,0.192,0.447,0.297,0.711,0.297c0.085,0,0.17-0.011,0.254-0.033l9.687-2.54c2.828,1.468,5.998,2.243,9.197,2.244c11.024,0,19.99-8.963,19.995-19.98c0.002-5.339-2.075-10.359-5.848-14.135C34.378,6.083,29.357,4.002,24.014,4L24.014,4z"/><path fill="#40c351" d="M35.176,12.832c-2.98-2.982-6.941-4.625-11.157-4.626c-8.704,0-15.783,7.076-15.787,15.774c-0.001,2.981,0.833,5.883,2.413,8.396l0.376,0.597l-1.595,5.821l5.973-1.566l0.577,0.342c2.422,1.438,5.2,2.198,8.032,2.199h0.006c8.698,0,15.777-7.077,15.78-15.776C39.795,19.778,38.156,15.814,35.176,12.832z"/><path fill="#fff" fill-rule="evenodd" d="M19.268,16.045c-0.355-0.79-0.729-0.806-1.068-0.82c-0.277-0.012-0.593-0.011-0.909-0.011c-0.316,0-0.83,0.119-1.265,0.594c-0.435,0.475-1.661,1.622-1.661,3.956c0,2.334,1.7,4.59,1.937,4.906c0.237,0.316,3.282,5.259,8.104,7.161c4.007,1.58,4.823,1.266,5.693,1.187c0.87-0.079,2.807-1.147,3.202-2.255c0.395-1.108,0.395-2.057,0.277-2.255c-0.119-0.198-0.435-0.316-0.909-0.554s-2.807-1.385-3.242-1.543c-0.435-0.158-0.751-0.237-1.068,0.238c-0.316,0.475-1.225,1.543-1.502,1.859c-0.277,0.316-0.554,0.356-1.028,0.119c-0.475-0.238-2.006-0.739-3.821-2.357c-1.412-1.26-2.367-2.814-2.644-3.29c-0.277-0.475-0.03-0.732,0.208-0.968c0.213-0.213,0.475-0.554,0.712-0.831c0.237-0.277,0.316-0.475,0.475-0.791c0.158-0.316,0.079-0.593-0.04-0.831C18.963,19.292,18.036,16.953,19.268,16.045z" clip-rule="evenodd"/></svg>';function w(){var e=r.filter(f);if(0!==e.length){var t=document.createElement("div");if(t.id="wa-widget-container",document.body.appendChild(t),1===e.length){var a=e[0];t.innerHTML='<div class="wa-widget-fab" id="wa-widget-btn">'+W+'</div>',document.getElementById("wa-widget-btn").addEventListener("click",function(){p(a.phone,a.name)})}else{for(var n="",o=0;o<e.length;o++){var i=e[o];n+='<div class="wa-agent-item" data-phone="'+i.phone+'" data-name="'+i.name+'"><img src="'+(i.photo||"https://cdn-icons-png.flaticon.com/512/3001/3001764.png")+'" class="wa-agent-avatar"><div class="wa-agent-info"><div class="wa-agent-name">'+i.name+'</div><div class="wa-agent-role">'+(i.role||"")+'</div></div><div class="wa-agent-arrow">›</div></div>'}t.innerHTML='<div class="wa-widget-fab" id="wa-widget-btn">'+W+'</div><div class="wa-widget-menu" id="wa-widget-menu"><div class="wa-menu-header"><span>Iniciar conversación</span><span class="wa-menu-close" id="wa-menu-close">×</span></div><div class="wa-agents-list">'+n+'</div><div class="wa-menu-footer">Solemos responder en minutos</div></div>',document.getElementById("wa-widget-btn").addEventListener("click",v),document.getElementById("wa-menu-close").addEventListener("click",function(){document.getElementById("wa-widget-menu").style.display="none"});for(var s=document.querySelectorAll(".wa-agent-item"),c=0;c<s.length;c++)s[c].addEventListener("click",function(){var e=this.getAttribute("data-phone"),t=this.getAttribute("data-name");p(e,t),document.getElementById("wa-widget-menu").style.display="none"})}}else console.log("ℹ️ Ningún agente disponible")}function b(){var e=document.createElement("style");e.id="wa-widget-styles",e.textContent="#wa-widget-container{position:fixed;bottom:20px;right:20px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,\\"Segoe UI\\",Roboto,sans-serif}.wa-widget-fab{width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.15);transition:transform .3s,box-shadow .3s;background:transparent}.wa-widget-fab:hover{transform:scale(1.1);box-shadow:0 6px 20px rgba(0,0,0,.25)}.wa-widget-fab svg{width:60px;height:60px}.wa-widget-menu{display:none;opacity:0;transform:translateY(20px);transition:all .3s ease;position:absolute;bottom:70px;right:0;width:300px;background:#fff;border-radius:16px;box-shadow:0 5px 30px rgba(0,0,0,.2);overflow:hidden}.wa-menu-header{background:#075e54;color:#fff;padding:16px;font-weight:600;font-size:15px;display:flex;justify-content:space-between;align-items:center}.wa-menu-close{cursor:pointer;font-size:24px;line-height:1;opacity:.8}.wa-menu-close:hover{opacity:1}.wa-agents-list{max-height:300px;overflow-y:auto}.wa-agent-item{display:flex;align-items:center;padding:14px 16px;cursor:pointer;transition:background .2s;border-bottom:1px solid #f0f0f0}.wa-agent-item:hover{background:#f8f9fa}.wa-agent-item:last-child{border-bottom:none}.wa-agent-avatar{width:44px;height:44px;border-radius:50%;object-fit:cover;margin-right:12px;border:2px solid #25D366}.wa-agent-info{flex:1}.wa-agent-name{font-weight:600;color:#1a1a1a;font-size:14px}.wa-agent-role{font-size:12px;color:#666;margin-top:2px}.wa-agent-arrow{color:#25D366;font-size:20px;font-weight:700}.wa-menu-footer{background:#f8f9fa;padding:10px;text-align:center;font-size:11px;color:#888}@media (max-width:480px){.wa-widget-menu{width:calc(100vw - 40px);right:0}#wa-widget-container{bottom:15px;right:15px}}",document.head.appendChild(e)}function y(){if(i.excludePages){var e=[];e="string"==typeof i.excludePages?i.excludePages.split(",").map(function(e){return e.trim()}):Array.isArray(i.excludePages)?i.excludePages:[];for(var t=window.location.pathname,a=0;a<e.length;a++)if(-1!==t.indexOf(e[a]))return!0}return!1}Promise.all([fetch(n).then(function(e){return e.json()}).then(function(e){var t=h(e);return t.config&&(i=t.config),i}).catch(function(e){return{}}),fetch(o).then(function(e){return e.json()}).then(function(e){return r=[],e.documents&&e.documents.forEach(function(e){var t=h(e);r.push(t)}),r}).catch(function(e){return[]})]).then(function(){y()||i.onlyMobile&&!d()||(b(),setTimeout(w,i.delayShow||2e3))}).catch(function(e){})})();
<\/script>`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ==========================================
  // RENDER: LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="app-container">
        <style>{styles}</style>
        <div className="login-screen">
          <div className="login-card">
            <div className="login-logo">
              <WhatsAppIcon />
            </div>
            <p style={{ color: '#64748b' }}>Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: LOGIN
  // ==========================================
  if (!user) {
    return (
      <div className="app-container">
        <style>{styles}</style>
        <div className="login-screen">
          <div className="login-card">
            <div className="login-logo">
              <WhatsAppIcon />
            </div>
            <h1 className="login-title">WhatsApp Widget</h1>
            <p className="login-subtitle">Panel de administración para tu widget multi-agente</p>
            <button className="google-btn" onClick={handleLogin}>
              <GoogleIcon />
              Continuar con Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: DASHBOARD
  // ==========================================
  return (
    <div className="app-container">
      <style>{styles}</style>

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="header-logo">
            <WhatsAppIcon />
          </div>
          <span className="header-title">Widget Admin</span>
        </div>
        <div className="header-right">
          <div className="user-info">
            <img src={user.photoURL} alt="" className="user-avatar" />
            <span className="user-name">{user.displayName?.split(' ')[0]}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>

      <div className="main-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Proyectos</div>
            <div className="project-list">
              {projects.map(project => (
                <div 
                  key={project.id}
                  className={`project-item ${selectedProject?.id === project.id ? 'active' : ''}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="project-icon">🌐</div>
                  <span className="project-name">{project.name}</span>
                </div>
              ))}
              <button className="add-project-btn" onClick={() => setShowProjectModal(true)}>
                <span style={{ fontSize: '18px' }}>+</span>
                Nuevo proyecto
              </button>
            </div>
          </div>
        </aside>

        {/* Content */}
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

              {/* Config General */}
              <div className="card">
                <h3 className="card-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                  </svg>
                  Configuración General
                </h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Mensaje predeterminado</label>
                    <textarea 
                      className="form-input"
                      value={config.message}
                      onChange={(e) => setConfig({...config, message: e.target.value})}
                      placeholder="¡Hola! 👋 Me gustaría obtener más información."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">URL del Webhook (Make/n8n)</label>
                    <input 
                      type="text"
                      className="form-input"
                      value={config.webhookUrl}
                      onChange={(e) => setConfig({...config, webhookUrl: e.target.value})}
                      placeholder="https://hook.us1.make.com/..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Páginas a excluir (separadas por coma)</label>
                    <input 
                      type="text"
                      className="form-input"
                      value={config.excludePages}
                      onChange={(e) => setConfig({...config, excludePages: e.target.value})}
                      placeholder="/checkout, /gracias, /carrito"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Delay para mostrar (ms)</label>
                    <input 
                      type="number"
                      className="form-input"
                      value={config.delayShow}
                      onChange={(e) => setConfig({...config, delayShow: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Solo en móvil</label>
                    <select 
                      className="form-input"
                      value={config.onlyMobile ? 'true' : 'false'}
                      onChange={(e) => setConfig({...config, onlyMobile: e.target.value === 'true'})}
                    >
                      <option value="false">No, mostrar en todos</option>
                      <option value="true">Sí, solo móvil</option>
                    </select>
                  </div>
                </div>
                <button className="add-agent-btn" style={{ marginTop: '12px' }} onClick={saveConfig}>
                  Guardar configuración
                </button>
              </div>

              {/* Agentes */}
              <div className="card">
                <div className="agents-header">
                  <h3 className="card-title" style={{ marginBottom: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/>
                    </svg>
                    Agentes ({agents.length})
                  </h3>
                  <button className="add-agent-btn" onClick={() => {
                    setEditingAgent(null);
                    setAgentForm({
                      name: '',
                      role: '',
                      phone: '',
                      photo: 'https://cdn-icons-png.flaticon.com/512/3001/3001764.png',
                      showOn: '',
                      hideOn: ''
                    });
                    setShowAgentModal(true);
                  }}>
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
                          <button className="btn-edit" onClick={() => openEditAgent(agent)}>
                            Editar
                          </button>
                          <button className="btn-delete" onClick={() => deleteAgent(agent.id)}>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Código generado */}
              <div className="card">
                <div className="code-header">
                  <h3 className="card-title" style={{ marginBottom: 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                    </svg>
                    Código para instalar
                  </h3>
                  <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copyCode}>
                    {copied ? '✓ Copiado!' : 'Copiar código'}
                  </button>
                </div>
                <pre className="code-block">
                  <code>{generateCode()}</code>
                </pre>
              </div>

              {/* Preview */}
              <div className="card">
                <h3 className="card-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  Vista previa
                </h3>
                <div className="preview-section">
                  <div className="preview-widget">
                    <div className="preview-fab">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.43 1.27 4.88L2 22l5.23-1.24C8.7 21.55 10.32 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
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

      {/* Modal: Nuevo Proyecto */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Nuevo Proyecto</h2>
            <div className="form-group">
              <label className="form-label">Nombre del proyecto</label>
              <input 
                type="text"
                className="form-input"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Mi sitio web"
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowProjectModal(false)}>
                Cancelar
              </button>
              <button className="btn-save" onClick={createProject}>
                Crear proyecto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agente */}
      {showAgentModal && (
        <div className="modal-overlay" onClick={() => setShowAgentModal(false)}>
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
                onChange={(e) => setAgentForm({...agentForm, name: e.target.value})}
                placeholder="María García"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Rol / Área</label>
              <input 
                type="text"
                className="form-input"
                value={agentForm.role}
                onChange={(e) => setAgentForm({...agentForm, role: e.target.value})}
                placeholder="Ventas Bogotá"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono (con código de país, sin +)</label>
              <input 
                type="text"
                className="form-input"
                value={agentForm.phone}
                onChange={(e) => setAgentForm({...agentForm, phone: e.target.value})}
                placeholder="573001234567"
              />
            </div>
            <div className="form-group">
              <label className="form-label">URL de foto</label>
              <input 
                type="text"
                className="form-input"
                value={agentForm.photo}
                onChange={(e) => setAgentForm({...agentForm, photo: e.target.value})}
                placeholder="https://..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mostrar solo en URLs que contengan (separar por coma)</label>
              <input 
                type="text"
                className="form-input"
                value={agentForm.showOn}
                onChange={(e) => setAgentForm({...agentForm, showOn: e.target.value})}
                placeholder="bogota, norte"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ocultar en URLs que contengan (separar por coma)</label>
              <input 
                type="text"
                className="form-input"
                value={agentForm.hideOn}
                onChange={(e) => setAgentForm({...agentForm, hideOn: e.target.value})}
                placeholder="medellin, sur"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAgentModal(false)}>
                Cancelar
              </button>
              <button className="btn-save" onClick={saveAgent}>
                {editingAgent ? 'Guardar cambios' : 'Agregar agente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
