# WhatsApp Admin Panel - Documentación del Código Fuente

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes React de la interfaz
│   ├── modals/         # Componentes modales (diálogos)
│   └── sections/       # Secciones del dashboard
├── constants/          # Constantes y configuraciones
├── contexts/           # Context API de React (estado global)
├── hooks/              # Custom hooks de React
├── styles/             # Archivos CSS
├── utils/              # Utilidades y helpers
├── App.js              # Componente principal de la aplicación
├── firebase.js         # Configuración de Firebase
├── index.js            # Punto de entrada de la app
└── theme.js            # Tema de Material-UI
```

---

## 🎨 Componentes UI

### Componentes Principales

#### `App.js`
**Propósito:** Punto de entrada principal de la aplicación. Maneja el routing entre diferentes vistas basándose en el rol del usuario.

**Responsabilidades:**
- Provider de tema Material-UI (`ThemeProvider`)
- Provider de autenticación (`AuthProvider`)
- Provider de datos de usuario (`UserProvider`)
- Routing condicional entre:
  - `LoginScreen` (no autenticado)
  - `PublicRegistration` (registro nuevo)
  - `Dashboard` (usuario normal)
  - `SuperAdminDashboard` (super admin)

**Estado:**
- `viewMode`: Switch entre vista de admin y app (para super admins)
- `showRegistration`: Toggle entre login y registro

---

#### `Dashboard.jsx`
**Propósito:** Panel principal del administrador con sistema de pestañas.

**Features:**
- Sistema de tabs para organizar contenido (Configuración, Agentes, Estadísticas, Código)
- Header con nombre del proyecto y acciones
- Gestión de proyectos y agentes
- Notificaciones con Snackbar
- Modales para crear/editar proyectos y agentes

**Hooks utilizados:**
- `useProjects`: Gestión de proyectos
- `useAgents`: Gestión de agentes
- `useConfig`: Configuración del widget

**Tabs:**
1. **Configuración** → `ConfigSection` + `PreviewSection`
2. **Agentes** → `AgentsSection`
3. **Estadísticas** → `MonitoringSection`
4. **Código** → `CodeSection`

---

#### `Header.jsx`
**Propósito:** Barra superior de navegación con Material-UI AppBar.

**Contenido:**
- Logo de WhatsApp
- Título "Widget Admin"
- Avatar del usuario
- Botón de logout

**Tecnología:** Material-UI (AppBar, Toolbar, Avatar, Button)

---

#### `Sidebar.jsx`
**Propósito:** Navegación lateral para seleccionar proyectos.

**Features:**
- Lista de proyectos del usuario
- Botón para crear nuevo proyecto
- Indicador visual del proyecto seleccionado
- Slot opcional para footer (ej: botón Panel Admin)

**Tecnología:** Material-UI (Drawer, List, ListItemButton)

---

### Secciones del Dashboard

#### `sections/ConfigSection.jsx`
**Propósito:** Formulario completo de configuración del widget de WhatsApp.

**Configuraciones:**
- **Datos básicos:** Nombre del sitio, mensaje de bienvenida, webhook URL
- **Conversiones:** Editor de eventos de conversión con valores
- **IA:** Integración con OpenAI (API key, modelo, descripción del negocio)
- **Google Sheets:** Credenciales y configuración de sincronización
- **Tracking:** Google Analytics, Meta Pixel
- **Comportamiento:** Delay, páginas excluidas, solo móvil

**Estado:**
- Múltiples estados para cada campo de configuración
- `publishing`: Indicador de guardado en progreso

---

#### `sections/AgentsSection.jsx`
**Propósito:** Gestión de agentes de WhatsApp.

**Features:**
- Grid de cards con información de cada agente
- Avatar, nombre, rol, teléfono
- Reglas de visibilidad (mostrar/ocultar en URLs)
- Botones para editar/eliminar
- Estado vacío cuando no hay agentes

**Tecnología:** Material-UI (Grid, Card, Avatar, Chip, IconButton)

---

#### `sections/MonitoringSection.jsx`
**Propósito:** Dashboard de conversiones en tiempo real.

**Características:**
- **KPIs:** Cards con métricas (Hoy, Semana, Total)
- **Tabla:** Listado de conversiones con fecha, tipo, valor
- **Estado de carga:** CircularProgress mientras carga datos
- **Formato de datos:** Timestamps de Firestore convertidos a fechas

**Hook:** `useConversions` (datos en tiempo real de Firestore)

---

#### `sections/CodeSection.jsx`
**Propósito:** Generador y visualizador del código del widget.

**Features:**
- Tabs para elegir entre JavaScript Vanilla y React
- Código generado dinámicamente basado en la configuración
- Botón de copiar al portapapeles
- Notificación de éxito al copiar

**Utilidades usadas:**
- `widgetCodeGenerator.js`
- `widgetJsGenerator.js`

---

#### `sections/ConversionsEditor.jsx`
**Propósito:** Editor de configuración de conversiones (eventos y valores).

**Estructura:**
- Acordeones para cada tipo de conversión
- Campos: nombre del evento, valor en dólares
- Agregar/eliminar conversiones dinámicamente

**Datos:** Objeto con estructura `{ conversion1: {nombre, valor}, ... }`

---

#### `sections/PreviewSection.jsx`
**Propósito:** Vista previa del FAB (botón flotante) del widget.

**Contenido:**
- Representación visual del botón de WhatsApp
- SVG del ícono de WhatsApp
- Posicionamiento flotante

---

### Modales

#### `modals/ProjectModal.jsx`
**Propósito:** Modal para crear nuevos proyectos.

**Campos:**
- Nombre del proyecto (TextField)

**Tecnología:** Material-UI Dialog

---

#### `modals/AgentModal.jsx`
**Propósito:** Modal para crear/editar agentes de WhatsApp.

**Campos:**
- Nombre
- Rol/Área
- Teléfono (con código de país)
- URL de foto
- Mostrar en (URLs, separadas por coma)
- Ocultar en (URLs, separadas por coma)

**Modo edición:** Pre-rellena los campos si `editingAgent` está presente.

**Tecnología:** Material-UI Dialog con Grid layout de 2 columnas.

---

### Otros Componentes

#### `PlanLimitsBanner.jsx`
**Propósito:** Banner de advertencia cuando el usuario está cerca o alcanzó los límites de su plan.

**Lógica:**
- Se muestra solo si el uso es > 80% (warning) o >= 100% (error)
- Calcula porcentaje de uso de proyectos y agentes
- Botón de "Actualizar Plan"

**Tecnología:** Material-UI Alert con AlertTitle

---

#### `LoginScreen.jsx`
**Propósito:** Pantalla de inicio de sesión con Google.

**Features:**
- Input de email (informativo)
- Botón de login con Google
- Toggle para mostrar formulario de registro

---

#### `PublicRegistration.jsx`
**Propósito:** Formulario de registro público para nuevos usuarios.

**Campos:**
- Información personal
- Selección de plan (Free, Starter, Pro)
- Login con Google

---

#### `SuperAdminDashboard.jsx`
**Propósito:** Panel de administración para super admins.

**Features:**
- Gestión de usuarios
- Estadísticas globales
- Cambio de planes
- Vista de proyectos y agentes por usuario

---

#### `Icons.jsx`
**Propósito:** Componente de ícono de WhatsApp personalizado (SVG).

---

## 🔧 Hooks Personalizados

### `hooks/useProjects.js`
**Propósito:** Gestión de proyectos del usuario.

**Funciones:**
- `createProject(name)`: Crear nuevo proyecto
- `deleteProject(id)`: Eliminar proyecto
- `setSelectedProject(project)`: Seleccionar proyecto activo

**Datos:**
- `projects`: Array de proyectos del usuario
- `selectedProject`: Proyecto actualmente seleccionado

**Firestore:** Colección `projects` con filtro por `userId`

---

### `hooks/useAgents.js`
**Propósito:** Gestión de agentes de WhatsApp por proyecto.

**Funciones:**
- `saveAgent(agentForm, editingAgent)`: Crear o actualizar agente
- `deleteAgent(id)`: Eliminar agente

**Datos:**
- `agents`: Array de agentes del proyecto seleccionado

**Firestore:** Subcolección `projects/{projectId}/agents`

**Validaciones:**
- Límites de plan (Free: 1, Starter: 5, Pro: 50)

---

### `hooks/useConfig.js`
**Propósito:** Gestión de la configuración del widget.

**Funciones:**
- `setConfig(newConfig)`: Actualizar configuración local
- `saveConfig()`: Guardar en Firestore y publicar código del widget

**Datos:**
- `config`: Objeto con toda la configuración del widget
- `publishing`: Boolean de estado de guardado

**Proceso de guardado:**
1. Validar datos
2. Guardar en Firestore
3. Generar código del widget
4. Publicar en Firebase Storage (JSON estático)

---

### `hooks/useConversions.js`
**Propósito:** Obtener conversiones en tiempo real de Firestore.

**Datos:**
- `conversions`: Array de conversiones del proyecto
- `stats`: Objeto con métricas agregadas
  - `todayCount`: Conversiones de hoy
  - `weekCount`: Conversiones de esta semana
  - `totalCount`: Total de conversiones
- `loading`: Estado de carga

**Firestore:** Subcolección `projects/{projectId}/conversions`

**Actualización:** Listener en tiempo real (onSnapshot)

---

## 🔐 Contextos (Estado Global)

### `contexts/AuthContext.jsx`
**Propósito:** Gestión de autenticación con Firebase Auth.

**Funciones:**
- `handleLogin(plan)`: Login con Google y creación/actualización de usuario
- `handleLogout()`: Cerrar sesión

**Estado:**
- `user`: Usuario de Firebase Auth
- `loading`: Estado de carga de autenticación

**Provider:** Envuelve la app y provee autenticación a todos los componentes

---

### `contexts/UserContext.jsx`
**Propósito:** Gestión de datos extendidos del usuario desde Firestore.

**Datos:**
- `userData`: Documento del usuario con plan, límites, metadata
- `loading`: Estado de carga

**Firestore:** Colección `users` con documento del `userId`

**Actualización:** Listener en tiempo real cuando el usuario cambia

---

## ⚙️ Utilidades

### `utils/widgetCodeGenerator.js`
**Propósito:** Generar código HTML del widget para JavaScript Vanilla.

**Output:** String de código HTML con el script del widget embebido

**Parámetros:**
- `config`: Configuración del widget
- `agents`: Array de agentes
- `projectId`: ID del proyecto

---

### `utils/widgetCodeGenerator.optimized.js`
**Propósito:** Versión optimizada del generador de código del widget.

**Mejoras:**
- Minificación
- Lazy loading
- Optimización de performance

---

### `utils/widgetJsGenerator.js`
**Propósito:** Generar archivo JavaScript del widget para publicación.

**Output:** Código JavaScript puro del widget

**Uso:** Se sube a Firebase Storage para servir el widget públicamente

---

### `utils/staticJsonPublisher.js`
**Propósito:** Publicar configuración del widget como JSON estático en Firebase Storage.

**Funciones:**
- `publishWidgetConfig(projectId, config, agents)`: Subir JSON a Storage

**Ubicación:** `widgets/{projectId}/config.json`

**Uso:** El widget público consume este JSON para renderizarse

---

### `utils/syncClient.js`
**Propósito:** Sincronización con sistemas externos (n8n, Google Sheets).

**Funciones:**
- Enviar datos de conversiones a webhook de n8n
- Sincronizar con Google Sheets
- Tracking de eventos

---

### `utils/trackingUtils.js`
**Propósito:** Helpers para tracking de analytics.

**Integraciones:**
- Google Analytics (GA4)
- Meta Pixel (Facebook)

**Funciones:**
- `sendGAEvent(eventName, eventData)`
- `sendMetaPixelEvent(eventName, eventData)`

---

### `utils/permissions.js`
**Propósito:** Validación de permisos basados en planes.

**Funciones:**
- `canCreateProject(userData, currentCount)`: Validar si puede crear más proyectos
- `canCreateAgent(userData, currentCount)`: Validar si puede crear más agentes
- `formatLimit(limit)`: Formatear límite (ej: -1 → "ilimitados")

---

### `utils/batchUpdateWidgets.js`
**Propósito:** Actualización masiva de widgets para todos los proyectos.

**Uso:** Script para migración o actualización de código del widget

---

## 🔥 Firebase

### `firebase.js`
**Propósito:** Configuración e inicialización de Firebase.

**Servicios:**
- **Auth:** Autenticación con Google
- **Firestore:** Base de datos NoSQL
- **Storage:** Almacenamiento de archivos (código del widget)

**Exports:**
- `auth`: Instancia de Firebase Auth
- `db`: Instancia de Firestore
- `storage`: Instancia de Storage

---

## 📊 Constantes

### `constants/plans.js`
**Propósito:** Definición de planes y límites.

**Estructura:**
```javascript
{
  FREE: {
    name: 'Free',
    limits: { projects: 1, agents: 1 }
  },
  STARTER: {
    name: 'Starter',
    limits: { projects: 3, agents: 5 }
  },
  PRO: {
    name: 'Pro',
    limits: { projects: -1, agents: 50 } // -1 = ilimitado
  }
}
```

**Roles:**
- `USER`: Usuario normal
- `ADMIN`: Administrador
- `SUPER_ADMIN`: Super administrador

---

## 🎨 Tema

### `theme.js`
**Propósito:** Configuración del tema de Material-UI (estilo Devias Kit).

**Paleta de colores:**
- **Primary:** #25D366 (WhatsApp Green)
- **Secondary:** #6366F1 (Indigo)
- **Error:** #F04438
- **Warning:** #F79009
- **Success:** #12B76A

**Tipografía:**
- Font: Inter
- Headings: 600-700 weight
- Body: 400-500 weight

**Componentes customizados:**
- Botones sin transformación de texto a mayúsculas
- Cards con border-radius 16px
- Inputs con mejor contraste
- Tabs con indicador de 3px

---

## 📦 Archivos de Backup

- `App.backup.js`: Versión anterior del App
- `App.multitenant.js`: Versión multi-tenant (experimental)
- `App.new.js`: Versión nueva en desarrollo
- `App.single-tenant.backup.js`: Versión single-tenant antigua
- `Dashboard.original.jsx`: Dashboard antes de migración a MUI

---

## 🚀 Flujo de Datos

### Flujo de creación de widget:

1. Usuario configura widget en `ConfigSection`
2. Al guardar, `useConfig` hook:
   - Guarda config en Firestore (`projects/{id}`)
   - Genera código del widget con `widgetCodeGenerator`
   - Publica JSON estático con `staticJsonPublisher`
3. Widget público consume `config.json` de Firebase Storage
4. Conversiones se guardan en Firestore (`projects/{id}/conversions`)
5. `MonitoringSection` muestra conversiones en tiempo real

---

## 🔄 Flujo de autenticación:

1. Usuario hace clic en "Login con Google"
2. `AuthContext` ejecuta Firebase Auth
3. Al recibir usuario:
   - Busca/crea documento en Firestore (`users/{uid}`)
   - `UserContext` sincroniza datos del usuario
4. App renderiza `Dashboard` o `SuperAdminDashboard` según rol

---

## 📝 Notas de Migración a Material-UI

Los siguientes componentes fueron migrados de CSS vanilla a Material-UI:

- ✅ `Header.jsx` → AppBar
- ✅ `Sidebar.jsx` → Drawer
- ✅ `Dashboard.jsx` → Tabs system
- ✅ `PlanLimitsBanner.jsx` → Alert
- ✅ `AgentsSection.jsx` → Cards + Grid
- ✅ `ProjectModal.jsx` → Dialog
- ✅ `AgentModal.jsx` → Dialog con Grid

**Componentes pendientes de migración:**
- `ConfigSection.jsx` (formularios complejos)
- `MonitoringSection.jsx` (tabla)
- `CodeSection.jsx` (tabs de código)
- `LoginScreen.jsx`
- `PublicRegistration.jsx`
- `SuperAdminDashboard.jsx`

---

## 🛠️ Tecnologías Utilizadas

- **React** 18.2 - Framework UI
- **Material-UI** 5.15 - Component library
- **Firebase** 10.7 - Backend (Auth, Firestore, Storage)
- **Emotion** - CSS-in-JS para MUI
- **React Context API** - Estado global

---

## 📚 Recursos

- [Material-UI Docs](https://mui.com/)
- [Firebase Docs](https://firebase.google.com/docs)
- [React Docs](https://react.dev/)
