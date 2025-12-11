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
    if (!selectedProject || !user) {
      return { success: false, error: 'Proyecto o usuario no seleccionado' };
    }

    console.log('🚀 Iniciando guardado y publicación...');
    setPublishing(true);

    try {
      // 1. Guardar en Firestore (para el panel de administración)
      console.log('💾 Guardando configuración en Firestore...');
      const projectRef = doc(db, 'users', user.uid, 'projects', selectedProject.id);

      await setDoc(projectRef, {
        ...selectedProject,
        config
      }, { merge: true });

      console.log('✅ Configuración guardada en Firestore');

      // 2. Obtener los agentes del proyecto
      console.log('👥 Obteniendo agentes...');
      const agentsRef = collection(db, 'users', user.uid, 'projects', selectedProject.id, 'agents');
      const agentsSnap = await getDocs(agentsRef);
      const agents = agentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`✅ ${agents.length} agente(s) encontrado(s)`);

      // Validar que hay al menos un agente
      if (agents.length === 0) {
        console.warn('⚠️ No hay agentes configurados');
      }

      // 3. Publicar JSON estático en Firebase Storage con timeout
      console.log('📤 Publicando widget en Storage...');

      const publishPromise = publishWidgetConfig(
        user.uid,
        selectedProject.id,
        config,
        agents
      );

      // Timeout de 15 segundos
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: La publicación está tardando más de lo normal')), 15000);
      });

      const result = await Promise.race([publishPromise, timeoutPromise]);

      console.log('✅ Widget publicado exitosamente');
      console.log('🔗 URL:', result.publicUrl);

      setPublishing(false);

      if (result.success) {
        return {
          success: true,
          message: `✅ Widget publicado con ${agents.length} agente(s)`,
          publicUrl: result.publicUrl
        };
      } else {
        return {
          success: false,
          error: result.error || 'Error desconocido al publicar'
        };
      }

    } catch (error) {
      setPublishing(false);
      console.error('❌ Error:', error);

      // Mensajes de error más descriptivos
      let errorMessage = error.message;

      if (error.message.includes('Timeout')) {
        errorMessage = 'La publicación está tardando demasiado. Verifica tu conexión a internet o las reglas de Storage.';
      } else if (error.message.includes('permission-denied')) {
        errorMessage = 'Permisos denegados. Verifica las reglas de Firebase Storage.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Error de red. Verifica tu conexión a internet.';
      }

      return {
        success: false,
        error: errorMessage
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
