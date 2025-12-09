import { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { canCreateAgent } from '../utils/permissions';

export const useAgents = (user, selectedProject, userData) => {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    if (!user || !selectedProject) return;

    const agentsRef = collection(db, 'users', user.uid, 'projects', selectedProject.id, 'agents');
    const unsubscribe = onSnapshot(agentsRef, (snapshot) => {
      const agentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAgents(agentsList);

      // Update user usage count
      if (userData) {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, {
          'usage.agents': agentsList.length
        }).catch(err => console.error('Error updating usage:', err));
      }
    });

    return () => unsubscribe();
  }, [user, selectedProject]);

  const saveAgent = async (agentForm, editingAgent = null) => {
    if (!selectedProject || !user || !userData) return { success: false, error: 'Datos incompletos' };

    // Check plan limits for new agents only
    if (!editingAgent) {
      const userPlan = userData.subscription?.plan || 'free';
      if (!canCreateAgent(userData.role, agents.length, userPlan)) {
        return {
          success: false,
          error: 'Has alcanzado el límite de agentes de tu plan. Actualiza para crear más.'
        };
      }
    }

    try {
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

      return { success: true };
    } catch (error) {
      console.error('Error saving agent:', error);
      return { success: false, error: 'Error al guardar agente' };
    }
  };

  const deleteAgent = async (agentId) => {
    if (!window.confirm('¿Eliminar este agente?') || !user || !selectedProject) return;

    await deleteDoc(doc(db, 'users', user.uid, 'projects', selectedProject.id, 'agents', agentId));
  };

  return {
    agents,
    saveAgent,
    deleteAgent
  };
};
