# Documentación de Secciones (WhatsApp Admin Panel)

Esta carpeta contiene los componentes modulares que componen la interfaz de configuración del proyecto. La arquitectura está diseñada para que `ConfigSection.jsx` actúe como el contenedor principal (orquestador).

## 📂 Estructura de Archivos

### 1. [ConfigSection.jsx](file:///c:/proyectos/whatsapp-admin-panel/whatsapp-admin-panel/src/components/sections/ConfigSection.jsx)
**El Orquestador.** Es la sección principal que el usuario ve al editar un proyecto.
- **Función**: Gestiona el estado global de la configuración del cliente y coordina el guardado en Firebase/Sincronización con n8n.
- **Relación**: Importa y renderiza a `AgentsSection`, `ConversionsEditor`, `CodeSection` y `PreviewSection`.
- **Novedad**: Ahora incluye el campo de "Descripción del Negocio" que alimenta el prompt automático.

### 2. [ConversionsEditor.jsx](file:///c:/proyectos/whatsapp-admin-panel/whatsapp-admin-panel/src/components/sections/ConversionsEditor.jsx)
**Gestor de Labels.** Permite definir qué eventos clasificará la IA.
- **Función**: Permite añadir, editar y eliminar conversiones (Labels 1, 2, 3...).
- **UX**: Implementado con un sistema de **Acordeón** para optimizar el espacio vertical.
- **Relación**: Envía los cambios de vuelta a `ConfigSection` mediante callbacks.

### 3. [AgentsSection.jsx](file:///c:/proyectos/whatsapp-admin-panel/whatsapp-admin-panel/src/components/sections/AgentsSection.jsx)
**Equipo y Teléfonos.** Gestión de los agentes que atienden el WhatsApp.
- **Función**: Maneja la lista de nombres y números de teléfono de los agentes.
- **Dato**: Estos números son usados para el filtrado de mensajes y la sincronización con n8n.

### 4. [PreviewSection.jsx](file:///c:/proyectos/whatsapp-admin-panel/whatsapp-admin-panel/src/components/sections/PreviewSection.jsx)
**Visualizador en Tiempo Real.**
- **Función**: Muestra una previsualización estética de cómo se verá el mensaje configurado en el widget real del sitio web.

### 5. [CodeSection.jsx](file:///c:/proyectos/whatsapp-admin-panel/whatsapp-admin-panel/src/components/sections/CodeSection.jsx)
**Implementación.**
- **Función**: Genera dinámicamente el código JavaScript que el cliente debe copiar y pegar en su sitio web para activar el widget.

---

## 🔄 Flujo de Datos
1. El usuario modifica datos en `ConversionsEditor` o `AgentsSection`.
2. `ConfigSection` actualiza el estado local (`config`).
3. Al hacer clic en "Guardar", se invoca a `syncClient.js` (en `src/utils`) que ensambla el prompt final y limpia los números de teléfono antes de enviarlos a la nube.
