# Arquitectura del Proyecto - WhatsApp Admin Panel

## Flujo de Datos y Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        App.js (27 líneas)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           AuthProvider (Context)                   │    │
│  │  - user, loading, handleLogin, handleLogout        │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                  │
│              ┌────────────┴────────────┐                    │
│              ▼                         ▼                     │
│      ┌──────────────┐         ┌──────────────┐             │
│      │ LoginScreen  │         │  Dashboard   │             │
│      └──────────────┘         └──────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

## Dashboard - Composición de Componentes

```
┌────────────────────────────────────────────────────────────┐
│                      Dashboard.jsx                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Custom Hooks (Business Logic)                       │  │
│  │  • useProjects(user)  → CRUD proyectos              │  │
│  │  • useAgents(user, selectedProject)  → CRUD agentes │  │
│  │  • useConfig(user, selectedProject)  → Config       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────┐  ┌──────────────────────────────────┐   │
│  │   Header    │  │       Main Content               │   │
│  │  - Logo     │  │                                   │   │
│  │  - User     │  │  ┌──────────┐  ┌──────────────┐  │   │
│  │  - Logout   │  │  │ Sidebar  │  │ Content Area │  │   │
│  └─────────────┘  │  │          │  │              │  │   │
│                   │  │ Projects │  │ ┌──────────┐ │  │   │
│  ┌─────────────┐  │  │  List    │  │ │ Config   │ │  │   │
│  │   Modals    │  │  │          │  │ │ Section  │ │  │   │
│  │             │  │  │ + New    │  │ └──────────┘ │  │   │
│  │ • Project   │  │  │ Project  │  │              │  │   │
│  │ • Agent     │  │  └──────────┘  │ ┌──────────┐ │  │   │
│  └─────────────┘  │                │ │ Agents   │ │  │   │
│                   │                │ │ Section  │ │  │   │
│                   │                │ └──────────┘ │  │   │
│                   │                │              │  │   │
│                   │                │ ┌──────────┐ │  │   │
│                   │                │ │ Code     │ │  │   │
│                   │                │ │ Section  │ │  │   │
│                   │                │ └──────────┘ │  │   │
│                   │                │              │  │   │
│                   │                │ ┌──────────┐ │  │   │
│                   │                │ │ Preview  │ │  │   │
│                   │                │ │ Section  │ │  │   │
│                   │                │ └──────────┘ │  │   │
│                   │                └──────────────┘  │   │
│                   └──────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos - Firestore Integration

```
┌──────────────┐
│   Firebase   │
│  Firestore   │
└──────┬───────┘
       │
       │ onSnapshot / CRUD operations
       │
       ▼
┌─────────────────────────────────────────┐
│         Custom Hooks Layer              │
│                                         │
│  ┌────────────────┐                    │
│  │ useProjects.js │                    │
│  │  - projects[]  │                    │
│  │  - create()    │                    │
│  │  - delete()    │                    │
│  └────────┬───────┘                    │
│           │                             │
│  ┌────────▼───────┐                    │
│  │ useAgents.js   │                    │
│  │  - agents[]    │                    │
│  │  - save()      │                    │
│  │  - delete()    │                    │
│  └────────┬───────┘                    │
│           │                             │
│  ┌────────▼───────┐                    │
│  │ useConfig.js   │                    │
│  │  - config{}    │                    │
│  │  - save()      │                    │
│  └────────────────┘                    │
└─────────┬───────────────────────────────┘
          │
          ▼
┌──────────────────────────┐
│  UI Components (React)   │
│  - ConfigSection         │
│  - AgentsSection         │
│  - CodeSection           │
│  - etc.                  │
└──────────────────────────┘
```

---

## Estructura de Estados

### AuthContext (Global)
```javascript
{
  user: FirebaseUser | null,
  loading: boolean,
  handleLogin: () => Promise<void>,
  handleLogout: () => Promise<void>
}
```

### useProjects Hook
```javascript
{
  projects: Project[],
  selectedProject: Project | null,
  setSelectedProject: (project) => void,
  createProject: (name) => Promise<void>,
  deleteProject: (id) => Promise<void>
}
```

### useAgents Hook
```javascript
{
  agents: Agent[],
  saveAgent: (form, editing?) => Promise<void>,
  deleteAgent: (id) => Promise<void>
}
```

### useConfig Hook
```javascript
{
  config: Config,
  setConfig: (config) => void,
  saveConfig: () => Promise<void>
}
```

### Dashboard (Local State)
```javascript
{
  showProjectModal: boolean,
  showAgentModal: boolean,
  editingAgent: Agent | null
}
```

---

## Separación de Responsabilidades

### 📁 Contexts
**Responsabilidad:** Estado global compartido
- AuthContext: Autenticación de usuario

### 🎣 Hooks
**Responsabilidad:** Lógica de negocio + integración Firestore
- useProjects: Gestión de proyectos
- useAgents: Gestión de agentes
- useConfig: Configuración del widget

### 🎨 Components
**Responsabilidad:** Renderizado UI puro
- LoginScreen, Header, Sidebar
- Modals: ProjectModal, AgentModal
- Sections: Config, Agents, Code, Preview

### 🔧 Utils
**Responsabilidad:** Funciones auxiliares
- widgetCodeGenerator: Genera código del widget
- trackingUtils: Gestión de Click IDs (gclid/gbraid/wbraid) con validación y GDPR
- staticJsonPublisher: Publicación en Firebase Storage

### 💅 Styles
**Responsabilidad:** Estilos CSS
- App.css: Todos los estilos centralizados

---

## Patrones de Diseño Utilizados

### 1. **Container/Presentational Pattern**
- **Container:** Dashboard.jsx (lógica)
- **Presentational:** Sections/*.jsx (UI pura)

### 2. **Custom Hooks Pattern**
- Encapsulación de lógica reutilizable
- Separación de concerns
- Testing más fácil

### 3. **Context API Pattern**
- Estado global sin prop drilling
- AuthContext para autenticación

### 4. **Compound Components Pattern**
- Modal overlay + modal content
- Secciones independientes pero coordinadas

---

## Ventajas de Esta Arquitectura

### ✅ Mantenibilidad
- Cada componente tiene una responsabilidad única
- Fácil encontrar y corregir bugs
- Código autodocumentado

### ✅ Testabilidad
- Hooks pueden testearse independientemente
- Componentes UI pueden testearse sin lógica
- Mocking simplificado

### ✅ Escalabilidad
- Agregar features nuevas es simple
- No hay código acoplado
- Reutilización de componentes

### ✅ Performance
- CSS en archivo separado (mejor caching)
- Componentes pequeños (re-renders optimizados)
- Posibilidad de lazy loading

### ✅ Developer Experience
- Navegación clara entre archivos
- IntelliSense mejorado
- Menos merge conflicts

---

## Migración del Código Legacy

### Antes (App.js - 1,392 líneas)
```
[CSS inline 878 líneas]
[SVG components 50 líneas]
[useState x15 declaraciones]
[useEffect x3 grandes]
[Handlers x10 funciones]
[JSX rendering 400+ líneas]
[Modales inline]
```

### Después (App.js - 27 líneas)
```javascript
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <AppContent />
      </div>
    </AuthProvider>
  );
}
```

---

## Performance Considerations

### Code Splitting Potencial
```javascript
// Futuro: lazy loading
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const LoginScreen = React.lazy(() => import('./components/LoginScreen'));
```

### Memoization Oportunidades
```javascript
// En AgentsSection.jsx
const AgentCard = React.memo(({ agent, onEdit, onDelete }) => {
  // ...
});
```

### Optimización de Re-renders
- useState local solo donde se necesita
- useCallback para handlers en listas
- useMemo para cálculos costosos

---

## Estructura Final del Proyecto

```
whatsapp-admin-panel/
├── public/
├── src/
│   ├── components/
│   │   ├── modals/
│   │   └── sections/
│   ├── contexts/
│   ├── hooks/
│   ├── styles/
│   ├── utils/
│   ├── App.js (27 líneas)
│   ├── firebase.js
│   └── index.js
├── REFACTORIZACION.md
├── ARQUITECTURA.md
└── package.json
```

**Resultado:** Código mantenible, escalable y profesional ✅

---

## Sistema de Tracking (Google Ads Click IDs)

### Objetivo
Capturar y persistir Click IDs de Google Ads (gclid, gbraid, wbraid) para atribución de conversiones offline en Google Ads.

### Arquitectura del Sistema de Tracking

```
┌─────────────────────────────────────────────────────────────────┐
│                    Usuario visita landing page                   │
│              ejemplo.com?gclid=CjwKCAiA0eTJBhBa...               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│         Widget cargado (widgetCodeGenerator.optimized.js)        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │   captureClickIdFromUrl() - Auto-ejecuta al cargar     │    │
│  │                                                         │    │
│  │   1. Lee URL params → gclid/gbraid/wbraid              │    │
│  │   2. Genera hash corto (5 chars) → "3KL0P"             │    │
│  │   3. Guarda en _gcl_aw y _gcl_hash:                    │    │
│  │      • Cookie (90 días expira)                         │    │
│  │      • localStorage (backup)                           │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Usuario navega por el sitio
                            │ (gclid ya NO está en URL)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Usuario hace clic en widget WhatsApp                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │      getStoredClickId() + getStoredHash()              │    │
│  │                                                         │    │
│  │   Lee de:                                              │    │
│  │   1. Cookie _gcl_aw (primero)                          │    │
│  │   2. localStorage _gcl_aw (fallback)                   │    │
│  │                                                         │    │
│  │   Maneja formato Google con puntos: "GCL.123.ABC"      │    │
│  │   → Extrae último segmento: "ABC"                      │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Mensaje WhatsApp generado:                                     │
│  "¡Hola! 👋 📄 Título 🏷️ Ref: #3KL0P 🔗 https://ejemplo.com" │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Webhook enviado a Make/n8n                      │
│                                                                  │
│  {                                                               │
│    "gclid": "CjwKCAiA0eTJBhBa...",   ← CAMPO REQUERIDO GOOGLE │
│    "gclid_hash": "3KL0P",             ← Hash corto referencia   │
│    "phone_e164": "+573123725256",                               │
│    "agent_selected": "Ligia Vargas",                            │
│    "landing_url": "https://ejemplo.com",                        │
│    ...                                                           │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Tipos de Click IDs Soportados

| Tipo | Descripción | Plataforma | Formato Típico |
|------|-------------|------------|----------------|
| `gclid` | Google Click ID | Google Ads (general) | 70-90 chars alfanuméricos |
| `gbraid` | Google Brand Click ID | iOS 14.5+ (Safari) | Similar a gclid |
| `wbraid` | Web Brand Click ID | Cross-platform | Similar a gclid |

### Funciones Principales

#### 1. captureClickIdFromUrl()
```javascript
// Se ejecuta automáticamente al cargar el widget
function captureClickIdFromUrl() {
  // 1. Lee gclid/gbraid/wbraid de URL
  var clickId = URLSearchParams.get('gclid') || ...;

  // 2. Genera hash corto (para referencia humana)
  var hash = getShortHash(clickId); // → "3KL0P"

  // 3. Guarda en cookies y localStorage
  document.cookie = '_gcl_aw=' + clickId + '; expires=90días';
  document.cookie = '_gcl_hash=' + hash + '; expires=90días';
  localStorage.setItem('_gcl_aw', clickId);
  localStorage.setItem('_gcl_hash', hash);
}
```

#### 2. getStoredClickId()
```javascript
// Lee el gclid almacenado (cookie primero, localStorage fallback)
function getStoredClickId() {
  var rawValue = getCookie('_gcl_aw') || localStorage.getItem('_gcl_aw');

  // Maneja formato Google: "GCL.1234567890.ABC123"
  if (rawValue.includes('.')) {
    return rawValue.split('.').pop(); // → "ABC123"
  }

  return rawValue; // → valor directo
}
```

#### 3. getShortHash(str)
```javascript
// Genera hash alfanumérico de 5 caracteres (único por gclid)
function getShortHash(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
  }
  return Math.abs(hash).toString(36).substring(0, 5).toUpperCase();
  // Ejemplo: "CjwKCAiA..." → "3KL0P"
}
```

### Casos de Uso Reales

#### Caso 1: Conversión Inmediata
```
Usuario:
1. Clic en anuncio Google → konversion.studio?gclid=CjwKCAiA0eTJBhBa...
2. Widget captura → _gcl_aw y _gcl_hash
3. Click en WhatsApp → Mensaje: "🏷️ Ref: #3KL0P"
4. Webhook: { gclid: "CjwKCAiA0eTJ...", gclid_hash: "3KL0P" }
```

#### Caso 2: Conversión Tardía (3 días después)
```
Usuario:
1. Día 1: Clic en anuncio → gclid guardado en cookies
2. Día 3: Vuelve directo a konversion.studio (sin gclid en URL)
3. Click en WhatsApp → Lee de cookie _gcl_aw
4. Webhook: { gclid: "CjwKCAiA0eTJ...", gclid_hash: "3KL0P" }
```

#### Caso 3: iOS Safari (gbraid)
```
Usuario iOS 14.5+:
1. Clic en anuncio → ?gbraid=1234567890ABCDEF...
2. Widget captura → _gcl_aw y _gcl_hash
3. Mensaje: "🏷️ Ref: #5XY9Z"
4. Webhook: { gclid: "1234567890ABCDEF...", gclid_hash: "5XY9Z" }
```

### Integración con Google Analytics

```javascript
// Evento automático en dataLayer
window.dataLayer.push({
  event: 'whatsapp_lead_click',
  lead_platform: 'whatsapp',
  agent_name: 'Ligia Vargas',
  lead_traffic: clickId ? 'paid_google' : 'organic',
  lead_ref: hash || 'sin_ref'
});
```

### Por qué _gcl_aw es el campo correcto

Google Ads requiere el campo `gclid` para **conversiones offline**:

```csv
# Archivo CSV para importar a Google Ads
gclid,conversion_name,conversion_time,conversion_value
CjwKCAiA0eTJBhBa...,whatsapp_lead,2025-01-10 15:30:00,50
```

El campo `gclid` debe contener el valor **completo** del click ID (70-90 chars), no un hash corto.

Por eso el webhook envía:
- `gclid`: Valor completo → Para importar a Google Ads
- `gclid_hash`: Hash corto → Para referencia humana en mensajes

### Seguridad y Privacidad

✅ **Cookie SameSite=Lax**: Previene CSRF
✅ **Try-catch global**: No rompe widget si falla tracking
✅ **Sin PII**: Solo almacena Click IDs (no info personal)
✅ **Expiración 90 días**: Cookies auto-expiran
✅ **Compatible Google**: Usa formato estándar `_gcl_aw`

---

