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

## Sistema de Conversiones (n8n + Postgres + OpenAI)

### Objetivo
Sistema de conversión tracking que captura clicks del widget Firebase, mensajes de WhatsApp vía yCloud, y clasifica conversaciones usando IA (OpenAI GPT-4) para atribución offline en Google Ads.

### Arquitectura del Sistema de Conversiones

```
┌─────────────────────────────────────────────────────────────────┐
│                    Usuario visita landing page                   │
│              ejemplo.com?gclid=CjwKCAiA0eTJBhBa...               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│         Widget Firebase captura click_id + genera hash           │
│                                                                  │
│  Cookie: _gcl_aw = "CjwKCAiA0eTJ..."                            │
│  Cookie: _gcl_hash = "3KL0P"                                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ Usuario hace clic en WhatsApp
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Webhook a n8n Workflow 1                     │
│                     (Click Ingest)                               │
│                                                                  │
│  Payload: {                                                      │
│    project_id: "color-tapetes",                                  │
│    phone_e164: "+573103069696",                                  │
│    gclid: "CjwKCAiA0eTJ...",                                     │
│    gclid_hash: "3KL0P",                                          │
│    landing_url: "https://ejemplo.com"                            │
│  }                                                               │
│                                                                  │
│  ├─→ INSERT INTO events (event_type='click') → Postgres         │
│  └─→ Append Row → Google Sheets (backup)                        │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ Usuario envía mensaje WhatsApp
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              yCloud envía webhook a n8n Workflow 2               │
│                   (Message Ingest)                               │
│                                                                  │
│  Webhook: POST /ycloud/:project_id                               │
│  URL: /ycloud/color-tapetes                                      │
│                                                                  │
│  Payload: {                                                      │
│    type: "whatsapp.inbound_message.received",                    │
│    whatsappInboundMessage: {                                     │
│      from: "+573103069696",                                      │
│      to: "+573123725256",                                        │
│      text: { body: "Hola! Necesito información" }                │
│    }                                                             │
│  }                                                               │
│                                                                  │
│  Flujo:                                                          │
│  1. Parse yCloud → Extrae project_id desde URL                   │
│  2. Get Config → SELECT config WHERE project_id                  │
│  3. Validate Phone → IF phone_filter match + status=active       │
│  4. Prepare SQL → Genera query parametrizado                     │
│  5. ├─→ INSERT INTO events (event_type='message_in') → Postgres │
│     └─→ Filter for Sheets → Append Row → Google Sheets          │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ Cron cada 5 minutos
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   n8n Workflow 3 (AI Classification)             │
│                                                                  │
│  1. Get Unprocessed Messages                                     │
│     SELECT * FROM events WHERE processed_at IS NULL              │
│                                                                  │
│  2. Group by Conversation                                        │
│     Agrupa por (project_id + phone_e164)                         │
│                                                                  │
│  3. Get Config + Prompt Template                                 │
│     SELECT prompt_template FROM clients_config                   │
│                                                                  │
│  4. Classify with OpenAI GPT-4                                   │
│     Prompt: "Analiza esta conversación..."                       │
│     Response: { is_conversion, confidence, category }            │
│                                                                  │
│  5. Save Conversion                                              │
│     INSERT INTO conversions (...)                                │
│                                                                  │
│  6. Mark as Processed                                            │
│     UPDATE events SET processed_at = NOW()                       │
│                                                                  │
│  7. Update Google Sheets                                         │
│     Append Row con resultado clasificación                       │
└─────────────────────────────────────────────────────────────────┘
```

### Base de Datos PostgreSQL (Railway)

**Tablas:**

1. **`clients_config`** - Configuración multi-tenant
   ```sql
   project_id TEXT PRIMARY KEY
   client_name TEXT
   status TEXT (active/inactive)
   phone_filter TEXT
   sheet_spreadsheet_id TEXT
   sheet_messages_name TEXT
   prompt_template TEXT
   conversion_config JSONB
   ```

2. **`events`** - Registro unificado clicks + mensajes
   ```sql
   event_id TEXT PRIMARY KEY
   project_id TEXT REFERENCES clients_config
   event_type TEXT (click, message_in, message_out)
   phone_e164 TEXT
   ts TIMESTAMPTZ
   -- Campos específicos de clicks
   click_id TEXT
   click_id_type TEXT
   click_id_hash TEXT
   landing_url TEXT
   traffic_source TEXT
   -- Campos específicos de mensajes
   message_id TEXT
   message_text TEXT
   direction TEXT
   provider_event_type TEXT
   -- Metadata
   payload_raw JSONB
   processed_at TIMESTAMPTZ
   created_at TIMESTAMPTZ
   ```

3. **`conversions`** - Conversiones clasificadas por IA
   ```sql
   conversion_id TEXT PRIMARY KEY
   project_id TEXT
   phone_e164 TEXT
   click_event_id TEXT
   first_message_event_id TEXT
   is_conversion BOOLEAN
   confidence_score NUMERIC
   category TEXT
   reasoning TEXT
   conversation_summary TEXT
   classified_at TIMESTAMPTZ
   ```

### n8n Workflows

**Workflow 1: Click Ingest** ✅ Implementado
- **Trigger:** Webhook POST desde widget Firebase
- **Path:** `/click/:project_id` (multi-tenant)
- **Archivo:** `n8n/Workflow 1 - Click Ingest.json`
- **Payload:** `{ phone_e164, gclid, gclid_hash, landing_url, agent_selected }`
- **Acciones:**
  1. Parse Click → Extrae project_id desde URL params + normaliza teléfono
  2. Get Config → SELECT config WHERE project_id = $1
  3. Is Active? → IF status = 'active'
  4. Prepare SQL → Genera query parametrizado
  5. Insert to Postgres → Tabla `events` (event_type='click')
  6. Filter for Sheets → Solo campos necesarios
  7. Append to Sheets → Sheet "clicks" (backup)
  8. Respond to Webhook → JSON success response

**Workflow 2: Message Ingest** ✅ Implementado
- **Trigger:** Webhook POST desde yCloud
- **Path:** `/ycloud/:project_id` (multi-tenant)
- **Archivo:** `n8n/Workflow 2 - yCloud Ingest.json`
- **Eventos:** `whatsapp.inbound_message.received`, `whatsapp.message.updated`
- **Acciones:**
  1. Parse yCloud → Extrae `project_id` desde URL params
  2. Get Config → SELECT config WHERE project_id = $1
  3. Validate Phone & Status → IF phone_filter match + active
  4. Prepare Message SQL → Genera query + prepara datos
  5. Insert to Postgres → Tabla `events` (event_type='message_in/out')
  6. Filter for Sheets → Solo 5 campos necesarios
  7. Append to Sheets → Sheet "chats_raw" (backup)
  8. Respond to Webhook → JSON success response

**Workflow 3: AI Classification** ✅ Implementado
- **Trigger:** Cron cada 5 minutos
- **Modelo:** GPT-4o-mini (configurable por cliente)
- **Archivo:** `n8n/Workflow 3 - AI Classification.json`
- **Acciones:**
  1. Get Pending Messages → SELECT eventos sin processed_at + JOIN clients_config
  2. Has Messages? → IF check para evitar ejecuciones vacías
  3. Group by Phone → Agrupa mensajes por (project_id + phone_e164)
  4. Loop Conversations → Procesa cada conversación
  5. Aggregate Conversation → Formatea: CLIENTE: / AGENTE:
  6. Find Click by Phone → Busca click atribuible (ventana 60 días)
  7. Merge Click Data → Combina datos de conversación + click
  8. Classify with OpenAI → Usa prompt_template del cliente
  9. Parse AI Response → Extrae label, confidence, reason
  10. Save Conversion → INSERT/UPSERT INTO conversions (dedupe por external_attrib_id)
  11. Mark as Processed → UPDATE events SET processed_at = NOW()
  12. Append to Sheets → Sheet "conversions" con formato Google Ads

**Campos de clasificación:**
- Label 1: No Calificado (value: 0)
- Label 2: Lead Calificado (value configurable)
- Label 3: Venta Confirmada (value configurable)

**Workflow 3 → Sheet "conversions":**
- Columnas: `click_id`, `conversion_name`, `conversion_time`, `conversion_value`, `conversion_currency`, `phone_e164`, `ai_reason`, `ai_confidence`, `external_attrib_id`

### Multi-Tenant Architecture

El sistema soporta múltiples clientes usando `project_id` como tenant identifier:

```javascript
// Workflow 2: project_id desde URL
const project_id = $input.first().json.params?.project_id || 'unknown';

// Cada cliente tiene su propia configuración
SELECT * FROM clients_config WHERE project_id = 'color-tapetes';
```

**Clientes actuales:**
- `konversion-web` - Cliente principal
- `color-tapetes` - Cliente adicional

### Integración Google Sheets

Ambos workflows escriben a Google Sheets como backup/reporting:

**Workflow 1 → Sheet "clicks":**
- Columnas: `phone_e164`, `gclid`, `gclid_hash`, `landing_url`, `timestamp`

**Workflow 2 → Sheet "chats_raw":**
- Columnas: `phone_e164`, `direction`, `message_text`, `timestamp_iso`, `message_id`

**Lección aprendida:** Google Sheets v4.7 con `autoMapInputData` envía **todos** los campos del input. Solución: agregar nodo intermedio "Filter for Sheets" que retorna solo los campos necesarios.

### Atribución Offline Google Ads

El sistema captura `gclid` para permitir importación de conversiones offline a Google Ads:

**Archivo CSV para importar:**
```csv
gclid,conversion_name,conversion_time,conversion_value
CjwKCAiA0eTJ...,whatsapp_lead,2025-12-16 15:30:00,50
```

**Flujo de atribución:**
1. Usuario clic en anuncio → gclid capturado en cookie
2. Usuario contacta por WhatsApp → gclid enviado en webhook
3. Conversación clasificada por IA → is_conversion = true
4. Query final JOIN events + conversions → Genera CSV
5. Importar CSV a Google Ads → Atribución completada

### Seguridad y Best Practices

✅ **SQL Injection Prevention**: Queries parametrizados ($1, $2, ...)
✅ **Dedupe**: ON CONFLICT (event_id) DO NOTHING
✅ **Multi-tenant Isolation**: Filtro por project_id en todas las queries
✅ **SSL/TLS**: Postgres con SSL mode "Allow" + Ignore SSL Issues
✅ **Phone Validation**: Filtro por phone_filter en cada cliente
✅ **Normalización E.164**: Todos los teléfonos en formato +573XXXXXXXXX
✅ **Backup**: Google Sheets como segunda capa de persistencia

### Lecciones Aprendidas

1. **n8n Path Parameters**: Vienen en `$input.first().json.params`, no en `$input.params`
2. **Referencias entre nodos**: Usar `$json` en lugar de `$('NodeName').item.json`
3. **Crypto Module**: Deshabilitado en n8n self-hosted, usar `Date.now() + Math.random()`
4. **Google Sheets Filter**: Necesario nodo intermedio para filtrar campos
5. **Railway SSL**: Requiere "Ignore SSL Issues: ON" para certificados autofirmados

---



---

## Actualizaciones recientes (Workflow 3)

### Cache de clasificacion (OpenAI)
- Antes de llamar a OpenAI, se consulta `conversions` por `project_id`, `phone_e164`, `last_message_ts` y `message_count`.
- Si hay cache, se reutilizan `ai_label`, `ai_confidence`, `ai_reason`, `conversion_name`, `conversion_value`, `conversion_currency`.
- Si no hay cache, se ejecuta OpenAI y se guarda el resultado como siempre.

### Atribucion persistente por telefono
- Se agrega una tabla `lead_attribution` para guardar el ultimo `click_id_hash` por `project_id + phone_e164`.
- Cuando llega un mensaje con `click_id_hash`, se hace upsert con expiracion basada en `click_matching_window_days`.
- Si un mensaje llega sin `click_id_hash`, se intenta reutilizar el guardado si no expiro.

### Tabla nueva (lead_attribution)
```sql
CREATE TABLE IF NOT EXISTS lead_attribution (
  project_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  click_id_hash TEXT,
  first_click_ts TIMESTAMPTZ,
  last_message_ts TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  PRIMARY KEY (project_id, phone_e164)
);
```
