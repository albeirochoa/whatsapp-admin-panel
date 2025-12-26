import { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { canCreateProject } from '../utils/permissions';
import { syncClientConfig } from '../utils/syncClient';

export const useProjects = (user, userData) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (!user) return;

    const projectsRef = collection(db, 'users', user.uid, 'projects');
    const unsubscribe = onSnapshot(projectsRef, (snapshot) => {
      const projectsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsList);

      if (!selectedProject && projectsList.length > 0) {
        setSelectedProject(projectsList[0]);
      }

      // Update user usage count
      if (userData) {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, {
          'usage.projects': projectsList.length
        }).catch(err => console.error('Error updating usage:', err));
      }
    });

    return () => unsubscribe();
  }, [user]);

  const createProject = async (name) => {
    console.log('📝 Creando proyecto:', { name, user: !!user, userData: !!userData });

    if (!name || !name.trim()) {
      return { success: false, error: 'Por favor ingresa un nombre para el proyecto' };
    }

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    if (!userData) {
      console.warn('⚠️ userData no disponible, esperando...');
      return { success: false, error: 'Cargando datos de usuario, intenta nuevamente en un momento' };
    }

    // Check plan limits
    const userPlan = userData.subscription?.plan || 'free';
    const userRole = userData.role || 'client';

    console.log('📊 Validando límites:', { userPlan, userRole, currentProjects: projects.length });

    if (!canCreateProject(userRole, projects.length, userPlan)) {
      return {
        success: false,
        error: 'Has alcanzado el límite de proyectos de tu plan. Actualiza para crear más.'
      };
    }

    try {
      const projectRef = doc(collection(db, 'users', user.uid, 'projects'));
      await setDoc(projectRef, {
        name,
        createdAt: new Date().toISOString(),
        config: {
          message: '¡Hola! 👋 Me gustaría obtener más información.',
          webhookUrl: '',
          excludePages: '/checkout, /gracias',
          delayShow: 2000,
          onlyMobile: false
        }
      });

      // Sync inicial con n8n (Workflow 0)
      try {
        const syncResult = await syncClientConfig({
          projectId: projectRef.id,
          projectName: name,
          config: {},
          agents: []
        });
        if (!syncResult.success) {
          console.error('Sync n8n fallo en createProject:', syncResult.error);
        }
      } catch (syncError) {
        console.error('Sync n8n exception en createProject:', syncError);
      }

      return { success: true };
    } catch (error) {
      console.error('Error creating project:', error);
      return { success: false, error: 'Error al crear proyecto' };
    }
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm('¿Eliminar este proyecto?') || !user) return;

    await deleteDoc(doc(db, 'users', user.uid, 'projects', projectId));
    if (selectedProject?.id === projectId) {
      setSelectedProject(null);
    }
  };

  return {
    projects,
    selectedProject,
    setSelectedProject,
    createProject,
    deleteProject
  };
};
