# Arquitectura del Proyecto - WhatsApp Admin Panel

## Actualización 2025-12-20 (estado real + planes inmediatos)

- **Workflow 3 (AI Classification)** ya usa: batch de 500 eventos, agrupación por `project_id + phone_e164`, `Find Click` con ventana dinámica `click_matching_window_days` (hash o fallback por teléfono), merge manual de clicks (left join) y `Merge Branches` antes de OpenAI para mantener índices estables. No incluye flujo de retry/error en BASIC.
- **Dedupe de conversiones:** `ON CONFLICT (external_attrib_id) DO UPDATE` actualiza la conversión existente solo si el nuevo `ai_label` es igual o mayor (progresión de funnel).
- **Atribución persistente:** `lead_attribution` se actualiza con `click_matching_window_days` por cliente.
- **BD `events`:** incluye `retry_count INTEGER DEFAULT 0` y `error_message TEXT`.
- **Próximo “Workflow 0” (sync Panel → n8n):** Webhook en n8n con header `x-api-key`, hace UPSERT en `clients_config` con el payload del panel. El panel enviará `project_id`, prompt, conversion_config, openai*, click_matching_window_days, message_limit_per_conversation, sheets, etc.
- **Panel (Firebase/React):** Los agentes (subcolección `agents`) permiten múltiples números por cliente; al publicar (`saveConfig`) se lee toda la lista de agentes y se publica en Storage. En la sync hacia n8n se deberá enviar el `phone_filter` principal (o la lista de teléfonos si se decide soportar varios).

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
### Workflow 3: AI Classification & Attribution (BASIC-WITH-ATTRIBUTION)

Este workflow procesa los mensajes pendientes, agrupa por conversación (project + phone), clasifica con OpenAI, atribuye clics si existen y guarda conversiones + backup en Sheets.

**Versión actual:** `Workflow 3 - AI Classification (BASIC-WITH-ATTRIBUTION).json`  
**Trigger:** Cron cada 5 minutos  
**Arquitectura:** Flujo lineal con merge manual de clicks y merge de ramas antes de OpenAI

```mermaid
graph TD
    A[Every 5 Minutes] --> B[Get Pending Messages]
    B --> C{Has Messages?}
    C -->|No| D[No Messages - Stop]
    C -->|Yes| E[Group by Phone]
    E --> F[Process Conversation]
    F --> G[Find Click]
    G --> H[Merge Click Data (Left Join Manual)]
    H --> I[Lookup Attribution]
    I --> J[Merge Attribution]
    J --> K{Has Click Hash?}
    K -->|Yes| L[Upsert Attribution]
    K -->|Yes| M[Merge Branches]
    K -->|No| M
    L -.actualiza lead_attribution.-> M
    M --> N[Classify with OpenAI]
    N --> O[Parse AI Response]
    O --> P[Save Conversion]
    O --> Q[Prepare for Sheets]
    P --> R[Prepare Update]
    R --> S[Mark as Processed]
    Q --> T[Upsert to Sheets]
```

#### 1) Get Pending Messages (Postgres)
Consulta hasta 500 eventos de mensajes pendientes y trae configuración por cliente.

```sql
SELECT e.event_id, e.project_id, e.phone_e164, e.ts, e.message_text, e.direction,
       c.client_name, c.prompt_template, c.conversion_config, c.openai_model,
       c.openai_temperature, c.openai_max_tokens, c.click_matching_window_days,
       c.sheet_spreadsheet_id, c.sheet_conversions_name
FROM events e
INNER JOIN clients_config c ON e.project_id = c.project_id
WHERE e.event_type IN ('message_in', 'message_out')
  AND e.processed_at IS NULL
  AND c.status = 'active'
ORDER BY e.project_id, e.phone_e164, e.ts ASC
LIMIT 500;
```

Notas:
- No usa `retry_count` ni cache en esta versión BASIC.
- El orden es por `project_id + phone + ts`.

#### 2) Group by Phone (Code, runOnceForAllItems)
Agrupa mensajes por `project_id:phone_e164` y construye:
- `config` (prompt, conversion_config, openai*, click_matching_window_days, sheets).
- `messages[]` (ts, text, direction, click_id_hash).
- `event_ids[]` (todos los event_id del grupo).

#### 3) Process Conversation (Code, runOnceForEachItem)
Para cada grupo:
- Ordena mensajes por `ts`.
- `first_message_ts` / `last_message_ts`.
- Construye `aggregated_conversation` (CLIENTE/AGENTE).
- Extrae `click_id_hash` del primer inbound.
- `message_count = messages.length`.
- Rate limiting: 500 ms por conversación.

#### 4) Find Click (Postgres, alwaysOutputData = true)
Busca el último click previo al primer mensaje:
- Match preferente por `click_id_hash`.
- Fallback por `phone_e164` si no hay hash.
- Ventana configurable: `click_matching_window_days`.

```sql
SELECT $1::text as project_id, $2::text as phone_e164, event_id as click_event_id,
       click_id, click_id_type, click_id_hash, ts as click_ts, landing_url
FROM events
WHERE project_id = $1
  AND ((click_id_hash = $4 AND click_id_hash IS NOT NULL) OR phone_e164 = $2)
  AND event_type = 'click'
  AND ts < $3
  AND ts >= NOW() - ($5 || ' days')::interval
ORDER BY CASE WHEN click_id_hash = $4 THEN 0 ELSE 1 END, ts DESC
LIMIT 1;
```

#### 5) Merge Click Data (Code, runOnceForAllItems)
Left join manual:
- **Base**: todas las conversaciones de `Process Conversation`.
- **Lookup**: clicks encontrados en `Find Click`.
- Output: cada conversación mantiene sus datos y agrega `click_data` y `has_click`.
- Evita el colapso cuando `Find Click` devuelve 0 filas.

#### 6) Lookup Attribution (Postgres)
Busca en `lead_attribution`:
- `stored_click_id_hash` vigente por `(project_id, phone_e164)`.
- `stored_expires_at`.

#### 7) Merge Attribution (Code)
Combina `click_id_hash`:
- Prioridad: `click_id_hash` del mensaje.
- Fallback: `stored_click_id_hash`.
- Define `click_id_hash_source` (`message` o `stored`).

#### 8) Has Click Hash? (IF)
Si `click_id_hash` no está vacío:
- Ejecuta **Upsert Attribution** (persistencia de hash).
Siempre (hash o no):
- Envía el item a **Merge Branches**.

#### 9) Upsert Attribution (Postgres)
Guarda/actualiza `lead_attribution`:
- `expires_at = NOW() + click_matching_window_days`.
- Mantiene `first_click_ts` más antiguo con `LEAST`.

#### 10) Merge Branches (Merge v3)
Une las ramas de Has Click Hash? en un solo lote para que OpenAI procese todos los items con índices consistentes.

#### 11) Classify with OpenAI (LangChain OpenAI)
Usa configuración por cliente:
- `openai_model`, `openai_temperature`, `openai_max_tokens`.
- System: `config.prompt_template`.
- User: conversación completa.

#### 12) Parse AI Response (Code)
Procesa la respuesta y arma la conversión:
- Parsea JSON (sin markdown).
- Defaults: label=1, confidence=0.5, reason="Clasificación automática".
- Valida label según `conversion_config` (usa keys disponibles).
- Construye:
  - `conversion_id = conv_{timestamp}_{rand}`
  - `external_attrib_id = conv-{project_id}-{phone_e164}-{conversion_name}`
  - `conversion_time = now()`
  - `attribution_method`:
    - `click_id_hash_match` si hay click con hash
    - `click_id_match` si hay click sin hash
    - `organic` si no hay click_data
- Esta versión BASIC no calcula `email_sha256` / `phone_sha256`.

#### 13) Save Conversion (Postgres)
Inserta o actualiza por `external_attrib_id`:
```sql
INSERT INTO conversions (...)
ON CONFLICT (external_attrib_id) DO UPDATE SET
  ai_label = EXCLUDED.ai_label,
  ai_confidence = EXCLUDED.ai_confidence,
  ai_reason = EXCLUDED.ai_reason,
  conversion_name = EXCLUDED.conversion_name,
  conversion_value = EXCLUDED.conversion_value,
  aggregated_conversation = EXCLUDED.aggregated_conversation,
  message_count = EXCLUDED.message_count,
  last_message_ts = EXCLUDED.last_message_ts,
  updated_at = NOW()
WHERE conversions.ai_label <= EXCLUDED.ai_label
RETURNING conversion_id;
```

**Deduplicación y progresión:**
- Key: `conv-{project}-{phone}-{conversion_name}`.
- Permite 3 conversiones por teléfono (una por tipo).
- No sobrescribe si el nuevo `ai_label` es menor.

#### 14) Prepare Update + Mark as Processed
`Prepare Update` toma `event_ids` y `Mark as Processed` marca todos como procesados:
```sql
UPDATE events
SET processed_at = NOW()
WHERE event_id = ANY($1::text[])
RETURNING event_id;
```

#### 15) Prepare for Sheets + Upsert to Sheets
`Prepare for Sheets` pasa datos desde `Parse AI Response` y agrega:
- `sheet_spreadsheet_id`, `sheet_name`, `click_id`.

`Upsert to Sheets`:
- Operación: `appendOrUpdate`.
- Matching column: `external_attrib_id`.
- Columnas: `Google Click ID`, `Conversion Name`, `Conversion Time`, `Conversion Value`, `Conversion Currency`, `phone_e164`, `ai_reason`, `ai_confidence`, `external_attrib_id`.


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
   sheet_conversions_name TEXT
   prompt_template TEXT
   conversion_config JSONB
   openai_model TEXT
   openai_temperature NUMERIC
   openai_max_tokens INTEGER
   click_matching_window_days INTEGER
   message_limit_per_conversation INTEGER
   ```

2. **`events`** - Registro unificado clicks + mensajes
   ```sql
   event_id TEXT PRIMARY KEY
   project_id TEXT REFERENCES clients_config
   event_type TEXT (click, message_in, message_out)
   phone_e164 TEXT
   customer_phone_e164 TEXT
   business_phone_e164 TEXT
   ts TIMESTAMPTZ
   -- Campos específicos de clicks
   click_id TEXT
   click_id_type TEXT (gclid, gbraid, wbraid)
   click_id_hash TEXT
   landing_url TEXT
   traffic_source TEXT
   -- Campos específicos de mensajes
   message_id TEXT
   message_text TEXT
   direction TEXT (in, out)
   provider_event_type TEXT
   -- Nota de semántica
   -- customer_phone_e164: numero del cliente (chat)
   -- business_phone_e164: numero del negocio/destino (click)
   -- Metadata
   payload_raw JSONB (contiene extracted_email, extracted_name)
   processed_at TIMESTAMPTZ
   created_at TIMESTAMPTZ
   ```

3. **`conversions`** - Conversiones clasificadas por IA
   ```sql
   conversion_id TEXT PRIMARY KEY
   project_id TEXT
   phone_e164 TEXT
   click_event_id TEXT
   click_id TEXT
   click_id_type TEXT
   attribution_method TEXT (click_id_hash_match, click_id_match, organic)
   ai_label INTEGER (1=no_qualified, 2=lead_qualified, 3=sale_confirmed)
   ai_confidence NUMERIC
   ai_reason TEXT
   ai_model_used TEXT
   conversion_name TEXT
   conversion_value NUMERIC
   conversion_currency TEXT
   conversion_time TIMESTAMPTZ
   external_attrib_id TEXT UNIQUE
   aggregated_conversation TEXT
   message_count INTEGER
   first_message_ts TIMESTAMPTZ
   last_message_ts TIMESTAMPTZ
   -- Enhanced Conversions (Google Ads)
   lead_email TEXT
   lead_name TEXT
   email_sha256 TEXT
   phone_sha256 TEXT
   -- Metadata
   status TEXT
   sent_at TIMESTAMPTZ
   error_message TEXT
   created_at TIMESTAMPTZ
   updated_at TIMESTAMPTZ
   ```

4. **`lead_attribution`** - Persistencia de atribución por lead
   ```sql
   project_id TEXT
   phone_e164 TEXT
   click_id_hash TEXT
   first_click_ts TIMESTAMPTZ
   last_message_ts TIMESTAMPTZ
   expires_at TIMESTAMPTZ
   updated_at TIMESTAMPTZ
   PRIMARY KEY (project_id, phone_e164)
   ```
   
   **Propósito:** Almacena la atribución de `click_id_hash` por lead (project + phone) para que mensajes tardíos (sin hash en el texto) puedan heredar la atribución del primer contacto. Expira según `click_matching_window_days`.

### n8n Workflows

**Workflow 0: Sync Client (Panel → n8n)**
- Webhook POST `/sync-client` (respuesta inmediata `{ "status": "queued" }`).
- Header obligatorio `x-api-key` debe coincidir con `N8N_SYNC_SECRET` (default `set-me` si no se define). Si falta o no coincide: error `Unauthorized: invalid x-api-key`.
- Payload esperado (JSON):
  - `project_id` (requerido)
  - `client_name` (fallback `project_id`)
  - `status` (default `active`)
  - `phone_filter`
  - `prompt_template`
  - `conversion_config` (JSON)
  - `openai_model` (default `gpt-4o-mini`)
  - `openai_temperature` (default 0.3)
  - `openai_max_tokens` (default 150)
  - `click_matching_window_days` (default 60)
  - `message_limit_per_conversation` (default 15)
  - `sheet_spreadsheet_id`, `sheet_messages_name` (default `chats_raw`), `sheet_conversions_name` (default `conversions`)
- Nodo Validate & Map: normaliza defaults y valida `project_id`.
- Nodo Upsert clients_config: `INSERT ... ON CONFLICT (project_id) DO UPDATE` actualiza todos los campos anteriores.
- Respuesta final: `{ "success": true, "project_id": <project_id> }`.
- No escribe en Sheets; solo actualiza `clients_config` en Postgres.

**Workflow 1: Click Ingest** ✅
- Webhook POST `/click/:project_id`.
- Parse Click: normaliza phone E.164, toma `gclid/gbraid/wbraid` como `click_id`, opcional `gclid_hash`, guarda payload completo.
- Valida `clients_config.status = active`.
	- Inserta en `events` (`event_type='click'`) con `click_id`, `click_id_type`, `click_id_hash`, `landing_url`, `traffic_source`, `payload_raw`, `business_phone_e164 = phone_e164` y `customer_phone_e164 = NULL` (en un click no se conoce el cliente). Sheets `clicks` es solo respaldo.
	- Google Sheets (Clicks): `Filter for Sheets` envía `click_id`, `click_id_hash`, `phone_e164`, `timestamp`, `landing_url`, `source` y, si las columnas existen, `business_phone_e164` y `customer_phone_e164` (auto-map o mapping explícito).
	- Responde JSON con `success` y `event_id`.
	- Nota actual: en BD `customer_phone_e164` guarda el número del cliente y `business_phone_e164` el número del negocio; el nodo Filter for Sheets puede enviar ambos a `chats_raw` si existen esas columnas (auto-map o mapping explícito).

**Workflow 2: Message Ingest (yCloud)** ✅
- Webhook POST `/ycloud/:project_id`.
- Parsea inbound/outbound; outbound solo si `status=delivered`. Inbound intenta extraer `click_id_hash` del texto con regex `#ABCDE`, detecta email si aparece (regex email) y toma nombre si yCloud lo envía; email/nombre se guardan dentro de `payload_raw` (jsonb) en `events` como `extracted_email`/`extracted_name` para no requerir cambios de schema.
- Valida `phone_filter` y `status=active` desde `clients_config`.
- Inserta en `events` (`event_type='message_in/out'`) con `click_id_hash`, `provider_event_type`, `customer_phone_e164` (cliente) y `business_phone_e164` (numero del negocio si se dispone); Sheets `chats_raw` como backup.
- Responde JSON con `success` y `event_id`.

**Workflow 3: AI Classification (BASIC-WITH-ATTRIBUTION)**

**Trigger:** Cron cada 5 minutos  
**Total nodos:** 20  
**Arquitectura:** Flujo lineal con merge manual de clicks + merge de ramas antes de OpenAI

---

#### **Flujo Detallado Nodo por Nodo:**

##### **1. Every 5 Minutes** (Schedule Trigger)
- **Tipo:** `n8n-nodes-base.scheduleTrigger`
- **Funcion:** Dispara el workflow automaticamente cada 5 minutos
- **Configuracion:** `interval: 5 minutes`

##### **2. Get Pending Messages** (Postgres Query)
- **Tipo:** `n8n-nodes-base.postgres`
- **Funcion:** Obtiene eventos pendientes de procesamiento (max 500)
- **Query SQL:**
  ```sql
  SELECT
    e.event_id, e.project_id, e.phone_e164, e.customer_phone_e164, e.business_phone_e164, e.ts,
    e.message_text, e.direction,
    c.client_name, c.prompt_template,
    c.conversion_config, c.openai_model,
    c.openai_temperature, c.openai_max_tokens,
    c.click_matching_window_days,
    c.sheet_spreadsheet_id, c.sheet_conversions_name
  FROM events e
  INNER JOIN clients_config c ON e.project_id = c.project_id
  WHERE e.event_type IN ('message_in', 'message_out')
    AND e.processed_at IS NULL
    AND c.status = 'active'
  ORDER BY e.project_id, e.phone_e164, e.ts ASC
  LIMIT 500;
  ```

##### **3. Has Messages?** (IF node)
- **Tipo:** `n8n-nodes-base.if`
- **Condicion:** `$input.all().length > 0`
- **TRUE:** continua; **FALSE:** va a `No Messages`

##### **4. Group by Phone** (Code node)
- **Tipo:** `n8n-nodes-base.code`
- **Modo:** `runOnceForAllItems`
- **Funcion:** Agrupa por `project_id:customer_phone_e164` (fallback `phone_e164`), parsea `conversion_config` y crea:
  - `config` (prompt, conversion_config, openai*, click_matching_window_days, sheets)
  - `messages[]` (ts, text, direction, click_id_hash)
  - `event_ids[]`

##### **5. Process Conversation** (Code node)
- **Tipo:** `n8n-nodes-base.code`
- **Modo:** `runOnceForEachItem`
- **Funcion:** Ordena mensajes, crea `aggregated_conversation`, define `first_message_ts`/`last_message_ts`, extrae `click_id_hash` del primer inbound y aplica delay 500ms.

##### **6. Find Click** (Postgres Query)
- **Tipo:** `n8n-nodes-base.postgres`
- **Funcion:** Busca click previo al primer mensaje (hash primero, fallback por `business_phone_e164`).
- **Query SQL:**
  ```sql
  SELECT
    $1::text as project_id,
    $2::text as phone_e164,
    event_id as click_event_id,
    click_id,
    click_id_type,
    click_id_hash,
    ts as click_ts,
    landing_url
  FROM events
  WHERE project_id = $1
    AND (
      (click_id_hash = $4 AND click_id_hash IS NOT NULL)
      OR phone_e164 = $2
    )
    AND event_type = 'click'
    AND ts < $3
    AND ts >= NOW() - ($5 || ' days')::interval
  ORDER BY
    CASE WHEN click_id_hash = $4 THEN 0 ELSE 1 END,
    ts DESC
  LIMIT 1;
  ```
- **Nota:** `alwaysOutputData = true`

##### **7. Merge Click Data** (Code node)
- **Tipo:** `n8n-nodes-base.code`
- **Modo:** `runOnceForAllItems`
- **Funcion:** Left join manual entre `Process Conversation` (base) y clicks encontrados.
- **Salida:** `click_data` + `has_click` sin perder conversaciones organicas.

##### **8. Lookup Attribution** (Postgres Query)
- **Tipo:** `n8n-nodes-base.postgres`
- **Funcion:** Consulta `lead_attribution` para `stored_click_id_hash` vigente.

##### **9. Merge Attribution** (Code node)
- **Tipo:** `n8n-nodes-base.code`
- **Funcion:** Prioriza hash del mensaje y luego hash almacenado (`click_id_hash_source`).

##### **10. Has Click Hash?** (IF node)
- **Condicion:** `{{ $json.click_id_hash }}` notEmpty
- **TRUE:** `Upsert Attribution` + `Merge Branches`
- **FALSE:** `Merge Branches`

##### **11. Merge Branches** (Merge node)
- **Tipo:** `n8n-nodes-base.merge`
- **Funcion:** Unifica las ramas para OpenAI (indices consistentes).

##### **12. Upsert Attribution** (Postgres Query)
- **Funcion:** Inserta/actualiza `lead_attribution`:
  ```sql
  INSERT INTO lead_attribution (
    project_id, phone_e164, click_id_hash,
    first_click_ts, last_message_ts, expires_at, updated_at
  ) VALUES (
    $1, $2, $3, $4, $5,
    NOW() + ($6 || ' days')::interval,
    NOW()
  )
  ON CONFLICT (project_id, phone_e164) DO UPDATE SET
    click_id_hash = EXCLUDED.click_id_hash,
    first_click_ts = LEAST(lead_attribution.first_click_ts, EXCLUDED.first_click_ts),
    last_message_ts = EXCLUDED.last_message_ts,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW()
  RETURNING project_id;
  ```

##### **13. Classify with OpenAI** (OpenAI node)
- **Modelo:** `config.openai_model`
- **System:** `config.prompt_template`
- **User:** conversacion agregada
- **Options:** `maxTokens`, `temperature` desde config

##### **14. Parse AI Response** (Code node)
- **Funcion:**
  - Parsea JSON de OpenAI
  - Defaults y validacion de label con `conversion_config`
  - Genera `conversion_id` y `external_attrib_id`
  - Define `attribution_method` segun `click_data`
  - Ahora retorna tambien `business_phone_e164` (de la conversacion o del click) y `customer_phone_e164` (cliente) para que lleguen a Sheets

##### **15. Save Conversion** (Postgres Query)
- **Funcion:** Inserta/actualiza por `external_attrib_id` con progresion de label
- **Query SQL:**
  ```sql
  INSERT INTO conversions (...)
  ON CONFLICT (external_attrib_id) DO UPDATE SET
    ai_label = EXCLUDED.ai_label,
    ai_confidence = EXCLUDED.ai_confidence,
    ai_reason = EXCLUDED.ai_reason,
    conversion_name = EXCLUDED.conversion_name,
    conversion_value = EXCLUDED.conversion_value,
    aggregated_conversation = EXCLUDED.aggregated_conversation,
    message_count = EXCLUDED.message_count,
    last_message_ts = EXCLUDED.last_message_ts,
    updated_at = NOW()
  WHERE conversions.ai_label <= EXCLUDED.ai_label
  RETURNING conversion_id;
  ```

##### **16. Prepare Update** (Code node)
- **Funcion:** Arma `event_ids_array` para marcar como procesados.

##### **17. Mark as Processed** (Postgres Query)
- **Query SQL:**
  ```sql
  UPDATE events
  SET processed_at = NOW()
  WHERE event_id = ANY($1::text[])
  RETURNING event_id;
  ```

##### **18. Prepare for Sheets** (Code node)
- **Funcion:** Reusa datos de `Parse AI Response` y agrega `sheet_spreadsheet_id`/`sheet_name`.

##### **19. Upsert to Sheets** (Google Sheets)
- **Operacion:** `appendOrUpdate`
- **Match:** `external_attrib_id`
- **Columnas:** Click ID, Conversion Name, Conversion Time, Conversion Value, Conversion Currency, phone_e164, ai_reason, ai_confidence, external_attrib_id

##### **20. No Messages** (NoOp)
- **Funcion:** Termina el flujo cuando no hay mensajes pendientes.

#### **Resumen de Optimizaciones:**

- ✅ **Flujo lineal simple**: Basado en BASIC, sin cache ni retries.
- ✅ **Merge manual de clicks**: Left join con `Process Conversation` como base.
- ✅ **Merge Branches antes de OpenAI**: índices estables para parseo.
- ✅ **alwaysOutputData en Find Click**: evita cortes cuando no hay clicks.
- ✅ **Rate limiting**: 500ms por conversación.
- ✅ **Dedupe con progresión**: `ON CONFLICT` solo actualiza si sube el `ai_label`.
- ✅ **Upsert en Sheets**: `appendOrUpdate` con `external_attrib_id`.
- ✅ **Batch processing**: hasta 500 eventos por ejecución.

**Workflow 3 → Sheet "conversions":**
- Columnas: `Google Click ID`, `Conversion Name`, `Conversion Time`, `Conversion Value`, `Conversion Currency`, `phone_e164`, `ai_reason`, `ai_confidence`, `external_attrib_id`

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

### Integración Firebase ↔ n8n (Sincronización)

Para que los widgets creados en el Admin Panel funcionen con los flujos de IA, los datos deben estar sincronizados entre Firestore (Source of Truth del panel) y PostgreSQL (Source of Truth de n8n).

#### Proceso de Sincronización
1. **Trigger**: El usuario pulsa "Guardar" en el Admin Panel (`useConfig.js` -> `saveConfig`).
2. **Local Save**: Se guarda en Firestore y se publica el JSON en Storage.
3. **Webhook Sync**: El panel hace una llamada `fetch` al webhook de n8n:
   ```javascript
   // Ejemplo de función de conexión
   const syncWithN8n = async (projectId, config) => {
     await fetch('https://n8n.tu-instancia.com/webhook/sync-client', {
       method: 'POST',
       headers: { 
         'Content-Type': 'application/json',
         'x-api-key': 'tu-secreto-compartido'
       },
       body: JSON.stringify({ projectId, config })
     });
   };
   ```
4. **n8n Processing**: Un nuevo flujo (Workflow 0) recibe el JSON y ejecuta un `INSERT ... ON CONFLICT (project_id) DO UPDATE` en la tabla `clients_config`.

#### Funciones involucradas:
- `useProjects.js` -> `createProject()`: Dispara el registro inicial.
- `useConfig.js` -> `saveConfig()`: Sincroniza cambios en prompt, valores de conversión y teléfonos.
- `n8n Sync Workflow`: Procesa el mapeo de campos de Firebase al esquema de Postgres.


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

#### **Workflow 1 y 2:**
1. **n8n Path Parameters**: Vienen en `$input.first().json.params`, no en `$input.params`
2. **Referencias entre nodos**: Usar `$json` en lugar de `$('NodeName').item.json`
3. **Crypto Module**: Deshabilitado en n8n self-hosted, usar `Date.now() + Math.random()`
4. **Google Sheets Filter**: Necesario nodo intermedio para filtrar campos
5. **Railway SSL**: Requiere "Ignore SSL Issues: ON" para certificados autofirmados

#### **Workflow 3 - AI Classification:**
6. **Batch real en SQL**: el BASIC usa `LIMIT 500` y ordena por `project_id, phone_e164, ts`. No hay `ROW_NUMBER` ni reparto justo.

7. **Find Click con fallback por teléfono**: busca por `click_id_hash` o `phone_e164` dentro de `click_matching_window_days`. Si no hay click, la conversión queda `organic`.

8. **Merge Click Data runOnceForAllItems**: el left join manual evita perder conversaciones cuando `Find Click` devuelve 0 filas.

9. **Merge Branches antes de OpenAI**: une las dos salidas de `Has Click Hash?` para mantener índices estables en `Parse AI Response`.

10. **alwaysOutputData en Find Click**: ayuda a que el nodo no corte el flujo en escenarios orgánicos.

11. **Rate limiting**: 500 ms por conversación en `Process Conversation`.

12. **Atribución persistente**: `lead_attribution` se actualiza cuando hay `click_id_hash` (mensaje o stored), con expiración configurable por cliente.

13. **Dedupe con progresión**: `ON CONFLICT (external_attrib_id)` solo actualiza si `ai_label` no baja.

---
