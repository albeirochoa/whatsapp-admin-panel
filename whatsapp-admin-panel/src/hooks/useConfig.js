import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { publishWidgetConfig } from '../utils/staticJsonPublisher';

export const useConfig = (user, selectedProject) => {
  const [config, setConfig] = useState({
    message: '¡Hola! 👋 Me gustaría obtener más información.',
    webhookUrl: '',
    excludePages: '/checkout, /gracias',
    delayShow: 2000,
    onlyMobile: false
  });
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!user || !selectedProject) return;

    const configRef = doc(db, 'users', user.uid, 'projects', selectedProject.id);
    getDoc(configRef).then((docSnap) => {
      if (docSnap.exists() && docSnap.data().config) {
        setConfig(docSnap.data().config);
      }
    });
  }, [user, selectedProject]);

  const saveConfig = async () => {
    if (!selectedProject || !user) return { success: false };

    try {
      setPublishing(true);

      // 1. Guardar en Firestore (para el panel de administración)
      const projectRef = doc(db, 'users', user.uid, 'projects', selectedProject.id);
      await setDoc(projectRef, {
        ...selectedProject,
        config
      }, { merge: true });

      // 2. Obtener los agentes del proyecto
      const agentsRef = collection(db, 'users', user.uid, 'projects', selectedProject.id, 'agents');
      const agentsSnap = await getDocs(agentsRef);
      const agents = agentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 3. Publicar JSON estático en Firebase Storage
      const result = await publishWidgetConfig(
        user.uid,
        selectedProject.id,
        config,
        agents
      );

      setPublishing(false);

      if (result.success) {
        return {
          success: true,
          message: 'Configuración guardada y widget publicado ✅',
          publicUrl: result.publicUrl
        };
      } else {
        return {
          success: false,
          error: result.error
        };
      }

    } catch (error) {
      setPublishing(false);
      console.error('Error saving config:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  return {
    config,
    setConfig,
    saveConfig,
    publishing
  };
};
