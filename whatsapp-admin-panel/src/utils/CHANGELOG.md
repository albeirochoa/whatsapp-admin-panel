# Changelog - Utils

Registro de cambios significativos en los archivos de utilidades.

---

## [2025-12-30] - Sistema de Variables Dinámicas en Mensajes (Tier 1)

### 🆕 Agregado

#### Variables Dinámicas (estilo JoinChat)
Sistema completo de variables para personalización flexible de mensajes de WhatsApp.

**Variables Tier 1 implementadas**:
- **`{SITE}`**: Nombre del sitio (configurable o auto desde `document.title`)
- **`{TITLE}`**: Título de la página actual (`document.title`)
- **`{URL}`**: URL limpia sin parámetros de tracking
- **`{HREF}`**: URL completa con todos los parámetros
- **`{HASH}`**: Hash de referencia del gclid (ej: `#A7K9Q`)
- **`{AGENT}`**: Nombre del agente seleccionado
- **`{DATE}`**: Fecha actual en formato `DD/MM/YYYY`

#### `widgetJsGenerator.js`
- **Función `replaceMessageVariables(template, agentName)`** (líneas 138-186):
  - Recibe template con variables y nombre de agente
  - Obtiene valores dinámicos del navegador: `document.title`, `window.location.href`, etc.
  - Genera fecha actual en formato español
  - Reemplaza todas las ocurrencias de variables en el mensaje
  - Debug logging con `window._waDebug`
  - Retorna mensaje final con variables reemplazadas

- **Actualizada `buildWhatsAppMessage(customMessage, agentName)`** (líneas 189-192):
  - Ahora acepta `agentName` como segundo parámetro
  - Usa `replaceMessageVariables()` en lugar de construcción hardcoded
  - Simplificada de ~15 líneas a 3 líneas

- **Actualizada `openWhatsApp(phone, agentName, customMessage)`** (líneas 292-296):
  - Usa `buildWhatsAppMessage()` con `agentName`
  - Eliminada lógica duplicada de construcción de mensaje

- **Actualizado `attachLinkHandlers(agents)`** (línea 486):
  - Pasa `name` a `buildWhatsAppMessage()` para variable `{AGENT}`

#### `widgetCodeGenerator.optimized.js`
- **Cambios idénticos a `widgetJsGenerator.js`**:
  - Función `replaceMessageVariables()` (líneas 151-199)
  - Actualizada `buildWhatsAppMessage()` (líneas 202-205)
  - Actualizada `openWhatsApp()` (líneas 305-309)
  - Actualizado `attachLinkHandlers()` (línea 499)

#### `ConfigSection.jsx`
- **Nuevo campo "Nombre del sitio"**:
  - Input para configurar variable `{SITE}`
  - Placeholder: "Ej: Mi Tienda Online"
  - Helper text: "Si no se configura, se usará el título de la página"

- **Lista de variables disponibles**:
  - Muestra debajo del textarea de mensaje
  - Formato: `<code>{SITE}</code>`, `<code>{TITLE}</code>`, etc.
  - 7 variables con descripción clara

- **Preview en tiempo real del mensaje**:
  - Caja con fondo gris mostrando resultado
  - Reemplaza variables con valores de ejemplo:
    - `{SITE}` → valor de `siteName` o "Mi Sitio"
    - `{TITLE}` → "Título de Ejemplo | Mi Sitio"
    - `{URL}` → "https://ejemplo.com/producto"
    - `{HREF}` → "https://ejemplo.com/producto?utm_source=google"
    - `{HASH}` → "#A7K9Q"
    - `{AGENT}` → "Nombre del Agente"
    - `{DATE}` → Fecha actual en español
  - Se actualiza en tiempo real al editar mensaje o siteName

- **Placeholder actualizado**:
  - Antes: "¡Hola! 👋 Me gustaría obtener más información."
  - Ahora: "¡Hola! 👋 Estoy en {TITLE} - {URL}"

#### `useConfig.js`
- **Agregado `siteName: ''` al estado inicial**
- **Mensaje por defecto actualizado**:
  - Antes: "¡Hola! 👋 Me gustaría obtener más información."
  - Ahora: "¡Hola! 👋 Estoy en {TITLE} - {URL}"

#### `staticJsonPublisher.js`
- **Agregado `siteName` al JSON publicado** (línea 16):
  - Se incluye en `widgetData.config.siteName`
  - Se publica junto con `message`, `webhookUrl`, etc.

### 🔧 Modificado

#### Construcción de mensajes (antes vs después)

**Antes** (hardcoded):
```javascript
var message = (customMessage || config.message || '¡Hola! 👋');
message += ' 📄 ' + document.title;
if (hash) {
  message += ' 🏷️ Ref: #' + hash;
}
message += ' 🔗 ' + getCurrentUrl();
```

**Ahora** (con variables):
```javascript
var message = customMessage || config.message || '¡Hola! 👋 Estoy en {TITLE} - {URL}';
return replaceMessageVariables(message, agentName);
```

**Ventajas**:
- ✅ Usuario controla orden de elementos
- ✅ Puede omitir elementos no deseados
- ✅ Puede personalizar formato y emojis
- ✅ Sintaxis familiar tipo JoinChat

### 📝 Ejemplos de Uso

#### Ejemplo 1: Minimalista
```javascript
Config: "Hola, estoy en {URL}"
Output: "Hola, estoy en https://ejemplo.com/producto"
```

#### Ejemplo 2: Con agente y fecha
```javascript
Config: "Hola {AGENT}, consulta del {DATE} sobre {TITLE}"
Output: "Hola María González, consulta del 30/12/2025 sobre Producto Premium | Mi Tienda"
```

#### Ejemplo 3: Completo con tracking
```javascript
Config: "👋 {AGENT} | {TITLE} | Ref: {HASH} | {DATE}"
Output: "👋 María González | Producto Premium | Ref: #A7K9Q | 30/12/2025"
```

#### Ejemplo 4: Solo nombre del sitio
```javascript
Config: "Consulta desde {SITE}"
siteName: "Tienda ABC"
Output: "Consulta desde Tienda ABC"
```

#### Ejemplo 5: URL completa vs limpia
```javascript
Config: "Original: {HREF} | Limpia: {URL}"
URL visitada: https://ejemplo.com/producto?utm_source=google&gclid=123
Output: "Original: https://ejemplo.com/producto?utm_source=google&gclid=123 | Limpia: https://ejemplo.com/producto"
```

### 💡 Mejora Arquitectónica

**Problema identificado**:
- Mensajes tenían orden fijo: mensaje → título → hash → URL
- No se podían omitir elementos (siempre incluía título y URL)
- Emojis hardcoded (📄 🏷️ 🔗)
- Formato no personalizable

**Solución implementada**:
- Sistema de variables dinámicas estilo JoinChat
- Usuario controla completamente el mensaje
- Preview en tiempo real para validar
- Backwards compatible (mensajes antiguos sin variables funcionan igual)

### 🔮 Próximos Pasos (Tier 2)

Variables planificadas para próxima iteración:
- **`{GCLID}`**: Google Click ID completo (no solo hash)
- **`{UTM_SOURCE}`**: Origen del tráfico (google, facebook, etc.)
- **`{DEVICE}`**: Tipo de dispositivo (Móvil o Escritorio)

Variables Tier 3 (avanzadas):
- **`{TIME}`**: Hora actual
- **`{UTM_MEDIUM}`**, **`{UTM_CAMPAIGN}`**: Más parámetros UTM
- **`{BROWSER}`**: Navegador del usuario

---

## [2025-12-29] - Scripts de Actualización Masiva de Widgets

### 🆕 Agregado

#### `scripts/updateAllWidgets.js` (nuevo archivo)
- **Propósito**: Actualizar todos los archivos `.js` en Firebase Storage cuando se actualiza el código base
- **Funcionalidad**:
  - Lee todos los usuarios y proyectos de Firestore
  - Regenera archivos `.json` y `.js` en Storage con última versión del código
  - Mantiene configuración de cada proyecto (no la modifica)
  - Genera reporte detallado con estadísticas de actualización
- **Evita**: Tener que notificar a 30+ usuarios para que "guarden de nuevo" manualmente

#### `scripts/checkWidgetVersions.js` (nuevo archivo)
- **Propósito**: Verificar qué widgets tienen los últimos cambios del código base
- **Funcionalidad**:
  - Descarga todos los archivos `.js` de Storage
  - Verifica presencia de features recientes:
    - `attachLinkHandlers` (enlaces #whatsapp)
    - `buildWhatsAppMessage` (construcción de mensajes)
    - `project_id` (tracking multi-tenant)
    - `wa.me/` (detección móvil/escritorio)
  - Genera reporte de widgets desactualizados
  - Solo lectura (no modifica nada)

#### `scripts/README.md` (nuevo archivo)
- Documentación completa de scripts de mantenimiento
- Instrucciones de uso y workflow recomendado
- Ejemplos de output de cada script
- Troubleshooting y precauciones

#### `.env.example` (nuevo archivo)
- Template para variables de entorno de Firebase
- Documentación de configuración necesaria para scripts

### 🔧 Modificado

#### `package.json`
- **Agregado `"type": "module"`**: Soporte para ES6 imports en scripts
- **Nuevos comandos npm**:
  - `npm run check-widgets`: Ejecuta verificación de versiones
  - `npm run update-widgets`: Ejecuta actualización masiva

#### `staticJsonPublisher.js`
- **Función `deleteWidgetConfig()`**: Ahora borra AMBOS archivos (JSON + JS)
  - Antes: Solo borraba el `.json`
  - Ahora: Borra `.json` y `.js` para evitar archivos huérfanos

### 💡 Mejora arquitectónica

**Problema identificado**:
- Cuando se actualiza el código base (`widgetJsGenerator.js`), los archivos `.js` en Storage quedan con código viejo
- Requería notificar a usuarios para que "guarden de nuevo" manualmente

**Solución implementada**:
- Scripts de actualización masiva que regeneran todos los `.js` centralizadamente
- Workflow: Modificar código → Commit → `npm run update-widgets` → Todos los usuarios actualizados
- Ventaja del patrón Script Loader: Código en Storage se actualiza → todos los sitios tienen última versión

---

## [2025-12-28] - Soporte para Enlaces `#whatsapp` + Detección Móvil/Escritorio

### 🆕 Agregado

#### `widgetCodeGenerator.optimized.js`
- **Función `buildWhatsAppMessage(customMessage)`**: Construye mensaje de WhatsApp reutilizable para botón y enlaces
  - Soporta mensaje personalizado
  - Agrega título de página, ref hash y URL limpia
  - Debug logging con `window._waDebug`

- **Función `sendTrackingData(phone, agentName, customMessage)`**: Envía tracking sin bloquear navegación
  - Diseñada para enlaces `#whatsapp` que necesitan tracking pero no preventDefault
  - Incluye `project_id` hardcoded en webhook
  - Campo `trigger`: `'custom_link'` si hay customMessage, sino `'link'`

- **Función `attachLinkHandlers(agents)`**: Sistema completo de manejo de enlaces `#whatsapp`
  - **`processWhatsAppLinks()`**: Busca y procesa enlaces con `#whatsapp`
    - Detecta `<a href*="#whatsapp">`
    - Reescribe href a URL de WhatsApp (elimina `#whatsapp`)
    - **Detección móvil/escritorio**:
      - Móvil: `https://wa.me/{phone}?text=...` (abre app)
      - Escritorio: `https://web.whatsapp.com/send?phone={phone}&text=...` (abre WhatsApp Web)
    - Soporta atributos personalizados:
      - `data-phone`: Teléfono específico
      - `data-name`: Nombre de agente
      - `data-message`: Mensaje personalizado
    - Marca enlaces procesados: `data-wa-processed="true"`
    - Agrega tracking con closure para capturar variables

  - **MutationObserver**: Detecta enlaces agregados dinámicamente (AJAX/SPA)
    - Observa `document.body` con `childList: true, subtree: true`
    - Procesa automáticamente nuevos enlaces

  - **Llamada en `renderWidget(agents)`**: Se ejecuta al final del render

- **Campo `project_id` en webhooks**: Inyectado via template string para multi-tenant tracking
  - En `openWhatsApp()`: `project_id: '${projectId}'`
  - En `sendTrackingData()`: `project_id: '${projectId}'`

#### `widgetJsGenerator.js`
- **Función `buildWhatsAppMessage(customMessage)`**: Versión idéntica a optimized.js
- **Función `sendTrackingData(phone, agentName, customMessage)`**: Versión idéntica con `project_id`
- **Función `attachLinkHandlers(agents)`**: Versión completa para archivo JS separado
- **Detección móvil/escritorio**: Lógica de `isMobile()` aplicada a generación de URLs
- **Parámetro `projectId` en `generateWidgetJS(configUrl, projectId)`**:
  - Antes: `generateWidgetJS(configUrl)`
  - Ahora: Acepta `projectId` como segundo parámetro
  - Se inyecta en template strings para webhooks

#### `staticJsonPublisher.js`
- **Paso de `projectId` a `generateWidgetJS()`**:
  - Línea 52: `const jsCode = generateWidgetJS(jsonUrl, projectId);`
  - Permite que el archivo JS generado tenga `project_id` correcto en webhooks

### 🔧 Modificado

#### `widgetCodeGenerator.optimized.js`
- **`openWhatsApp(phone, agentName, customMessage)`**:
  - Antes: `openWhatsApp(phone, agentName)` - solo 2 parámetros
  - Ahora: Acepta `customMessage` como tercer parámetro
  - Usa `customMessage` en construcción del mensaje si está presente
  - Webhook incluye `project_id: '${projectId}'`

#### `widgetJsGenerator.js`
- **`openWhatsApp(phone, agentName, customMessage)`**:
  - Actualizado para aceptar `customMessage`
  - Webhook incluye `project_id: '${projectId}'`

### 🐛 Corregido

#### `widgetCodeGenerator.optimized.js` + `widgetJsGenerator.js`
- **Enlaces `#whatsapp` causaban recarga de página**:
  - **Problema**: Enfoque previo usaba `preventDefault()` con event delegation, pero `#whatsapp` en URL causaba scroll/reload
  - **Solución**: Reescribir href directamente (elimina `#whatsapp` del DOM)
  - **Ventajas**:
    - ✅ No hay recarga de página
    - ✅ Hover muestra URL correcta de WhatsApp
    - ✅ Clic derecho "Abrir en nueva pestaña" funciona
    - ✅ Tracking funciona sin bloquear navegación

- **Enlaces en móvil abrían `wa.me` en navegador en lugar de app**:
  - **Problema**: Solo se usaba `wa.me` sin importar el dispositivo
  - **Solución**: Detectar dispositivo y usar URL apropiada
    - Móvil: `wa.me` → Abre app de WhatsApp
    - Escritorio: `web.whatsapp.com/send` → Abre WhatsApp Web

- **Código corto (archivo JS en Storage) desactualizado**:
  - **Problema**: `widgetJsGenerator.js` no tenía las funciones nuevas
  - **Solución**: Sincronizado con `widgetCodeGenerator.optimized.js`
  - **Afecta**: Usuarios que usan snippet corto de Tag Manager

### 📝 Notas Técnicas

#### Patrón de Reescritura de Enlaces
Similar al código de Tag Manager previo del usuario:
```javascript
// Tag Manager (previo):
var refLinks = document.querySelectorAll('a[href="#ref"]');
link.href = whatsappUrl;  // Reescribe directamente
link.target = '_blank';

// Nuevo código widget:
var whatsappLinks = document.querySelectorAll('a[href*="#whatsapp"]');
link.href = whatsappUrl;  // Mismo patrón
link.target = '_blank';
```

#### Diferencias Código Embebido vs Archivo JS
- **Embebido** (`widgetCodeGenerator.optimized.js`):
  - Output: `<script>..código completo..</script>`
  - Usado en: `CodeSection.jsx` para snippet largo

- **Archivo JS** (`widgetJsGenerator.js`):
  - Output: `(function() { ...código... })();` (sin tags)
  - Usado en: `staticJsonPublisher.js` para archivo en Storage
  - Loader corto: 10 líneas en Tag Manager

#### Multi-Tenant con `project_id`
```javascript
// Template string injection:
project_id: '${projectId}'

// Runtime (ejemplo lucilu.com.co):
project_id: 'HMR9Z75xI0PYxEYStK1l'

// n8n Workflow 1 recibe:
{
  "project_id": "HMR9Z75xI0PYxEYStK1l",
  "phone_e164": "+573142856021",
  "gclid": "CjwKCAiA...",
  // ...
}
```

---

## [2025-12-20] - Sincronización Panel → n8n

### 🆕 Agregado

#### `syncClient.js`
- **Archivo nuevo**: Sincronización de configuración Firebase → PostgreSQL
- **Función `syncClientConfig()`**: POST a n8n Workflow 0
  - Headers: `x-api-key` para autenticación
  - Payload completo de configuración del cliente:
    - Datos básicos: `project_id`, `client_name`, `status`
    - Teléfono: `phone_filter` (E.164)
    - IA: `prompt_template`, `conversion_config`, `openai_*`
    - Ventanas: `click_matching_window_days`, `message_limit_per_conversation`
    - Sheets: `sheet_spreadsheet_id`, `sheet_*_name`
    - Agentes: Array con `id`, `name`, `phone`, `role`

- **Variables de entorno requeridas**:
  - `REACT_APP_N8N_SYNC_URL`: URL de n8n Workflow 0
  - `REACT_APP_N8N_SYNC_SECRET`: API key compartida

- **Integración con `useConfig.js`**:
  - Se llama después de `publishWidgetConfig()`
  - Flujo completo: Firestore → Storage → PostgreSQL

### 🔧 Modificado

#### `staticJsonPublisher.js`
- **Función `publishWidgetConfig()`**:
  - Ahora sube 2 archivos a Storage:
    1. JSON: `widgets/{userId}/{projectId}.json` (config + agents)
    2. JS: `widgets/{userId}/{projectId}.js` (código completo del widget)
  - Import de `widgetJsGenerator.js`
  - Retorna `{ jsonUrl, jsUrl }` en lugar de solo `jsonUrl`

- **Cache control diferenciado**:
  - JSON: `max-age=300` (5 minutos) - cambios frecuentes
  - JS: `max-age=3600` (1 hora) - código estable

### 📝 Notas

#### n8n Workflow 0 (Sync Client)
```sql
-- UPSERT ejecutado por n8n:
INSERT INTO clients_config (
  project_id, client_name, status, phone_filter,
  prompt_template, conversion_config, openai_model,
  openai_temperature, openai_max_tokens,
  click_matching_window_days, message_limit_per_conversation,
  sheet_spreadsheet_id, sheet_messages_name, sheet_conversions_name
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
ON CONFLICT (project_id) DO UPDATE SET
  client_name = EXCLUDED.client_name,
  status = EXCLUDED.status,
  -- ... todos los campos
  updated_at = NOW();
```

---

## [2025-12-15] - Optimización de Costos con Storage

### 🆕 Agregado

#### `staticJsonPublisher.js`
- **Archivo nuevo**: Reemplazo de lecturas de Firestore por archivos estáticos
- **Función `publishWidgetConfig()`**: Sube JSON a Firebase Storage
  - Path: `widgets/{userId}/{projectId}.json`
  - Content-Type: `application/json`
  - Metadata: `projectId`, `lastModified`

- **Función `getWidgetPublicUrl()`**: Genera URL sin subir
- **Función `deleteWidgetConfig()`**: Limpieza al eliminar proyecto

#### `widgetCodeGenerator.optimized.js`
- **Archivo nuevo**: Generador de widget optimizado
- **Lectura desde Storage**: `fetch(CONFIG_URL)` en lugar de Firestore SDK
- **Ventajas**:
  - Costo: $0 hasta 1GB/día (Storage) vs $0.06/100k lecturas (Firestore)
  - Performance: CDN de Firebase Storage
  - Escalabilidad: Millones de visitas sin costos extra

### 🔧 Modificado

#### `widgetCodeGenerator.js` → `widgetCodeGenerator.optimized.js`
- **Antes**: Widget llamaba a Firestore directamente
  ```javascript
  firebase.firestore().collection('projects').doc(projectId).get()
  ```

- **Ahora**: Widget carga JSON estático
  ```javascript
  fetch('https://firebasestorage.googleapis.com/.../widget.json')
  ```

### 📊 Impacto

#### Costos proyectados (10,000 visitas/día)
- **Antes** (Firestore):
  - 10,000 lecturas/día × 30 días = 300,000 lecturas/mes
  - Costo: ~$1.80/mes

- **Ahora** (Storage):
  - 10,000 × 5KB = 50MB/día
  - Costo: $0/mes (dentro de quota gratuita)

#### Performance
- **Latencia**: 50-100ms más rápido (Storage con CDN)
- **Disponibilidad**: 99.95% (Storage) vs 99.95% (Firestore) - igual

---

## [2025-12-10] - Sistema de Permisos por Plan

### 🆕 Agregado

#### `permissions.js`
- **Archivo nuevo**: Sistema de permisos basado en roles y planes
- **Funciones de validación**:
  - `hasPermission(userRole, permission)`: Verifica permisos por rol
  - `canCreateProject(userRole, currentProjects, userPlan)`: Límite de proyectos
  - `canCreateAgent(userRole, projectAgents, userPlan)`: Límite de agentes

- **Funciones de utilidad**:
  - `getPlanLimits(planId)`: Obtiene límites de un plan
  - `formatLimit(limit)`: Formatea límites (-1 = "Ilimitado")

- **Planes soportados**:
  - **FREE**: 1 proyecto, 1 agente
  - **PRO**: 5 proyectos, 3 agentes
  - **ENTERPRISE**: Ilimitado (-1)

- **Permisos por rol**:
  - **admin**: Todos los permisos
  - **editor**: Crear/editar proyectos y agentes
  - **viewer**: Solo lectura

### 📝 Integración

```javascript
// En useProjects.js
import { canCreateProject } from './utils/permissions';

const createProject = async (name) => {
  if (!canCreateProject(user.role, projects.length, user.plan)) {
    throw new Error('Límite de proyectos alcanzado. Upgrade a PRO.');
  }
  // ...crear proyecto
};
```

---

## [2025-12-05] - Tracking de Google Ads

### 🆕 Agregado

#### `trackingUtils.js`
- **Archivo nuevo**: Utilidades avanzadas de tracking con soporte GDPR
- **Captura de Click IDs**:
  - `captureClickIds(requireConsent)`: Auto-captura desde URL
  - Tipos soportados: gclid, gbraid (iOS 14.5+), wbraid
  - Validación de formato: `isValidClickId(value, type)`

- **Persistencia multi-capa**:
  - localStorage (prioridad 1)
  - Cookie 1st-party (fallback)
  - Cookie de Google `_gcl_aw` (último recurso)

- **Recuperación inteligente**:
  - `getBestClickId(maxAgeDays)`: Sistema de prioridad
  - Validación de edad (default: 90 días)
  - Auto-limpieza de Click IDs expirados

- **GDPR Compliance**:
  - `hasStorageConsent()`: Verifica consentimiento
  - `setStorageConsent(granted)`: Gestión de consentimiento
  - `clearAllClickIds()`: Limpieza total

- **Generación de URLs**:
  - `generateWhatsAppURL(phone, message, options)`: URL con tracking
  - Formato configurable de ref

- **Debug**:
  - `getDebugInfo()`: Información completa de estado
  - Console logs en modo desarrollo

### 📝 Notas

Este archivo es una **utilidad avanzada** que NO se usa directamente en el panel. El widget usa una versión simplificada inline para reducir tamaño del código generado.

**Uso potencial**:
- Clientes enterprise que quieren tracking personalizado
- Testing y debugging de tracking
- Integración con consent management platforms

---

## Convenciones de Versionado

### Tipos de Cambios
- 🆕 **Agregado**: Nuevas funciones/archivos
- 🔧 **Modificado**: Cambios en funciones existentes
- 🐛 **Corregido**: Bug fixes
- 🗑️ **Eliminado**: Código deprecado removido
- 📝 **Notas**: Información adicional

### Semantic Versioning
Este proyecto no usa versionado semántico formal, pero sigue estos principios:
- **YYYY-MM-DD**: Fecha del cambio
- **Descripción breve**: Qué se cambió y por qué
- **Impacto**: Quién/qué se ve afectado

---

## Próximos Cambios Planeados

### Q1 2026
- [ ] **Retry automático en `syncClient.js`**: Reintentos si n8n falla
- [ ] **Versionado de widgets**: Rollback a versiones anteriores
- [ ] **Webhook bidireccional**: n8n → Panel para notificar conversiones
- [ ] **Analytics integrado**: Dashboard con métricas en tiempo real

### Q2 2026
- [ ] **A/B testing**: Múltiples variantes de widget por proyecto
- [ ] **Localización**: Soporte para múltiples idiomas en widget
- [ ] **Tema personalizable**: Colores y estilos desde panel
- [ ] **Widget headless**: API para implementación custom

---

**Última actualización**: 2025-12-30
**Mantenido por**: Equipo de desarrollo WhatsApp Admin Panel
