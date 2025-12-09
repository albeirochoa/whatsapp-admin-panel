import { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { canCreateProject } from '../utils/permissions';

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
    if (!name.trim() || !user || !userData) return { success: false, error: 'Datos incompletos' };

    // Check plan limits
    const userPlan = userData.subscription?.plan || 'free';
    if (!canCreateProject(userData.role, projects.length, userPlan)) {
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
