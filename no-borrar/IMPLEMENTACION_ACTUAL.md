# IMPLEMENTACIÓN ACTUAL - SISTEMA N8N + POSTGRES
**Fecha:** 2025-12-16
**Estado:** Fase 1 y Fase 2 completadas ✅

---

## 🎯 OBJETIVO DEL SISTEMA

Migrar el sistema de conversiones de WhatsApp de **Make + Google Sheets** a **n8n + Postgres** con clasificación IA.

**Arquitectura final:**
```
Widget Firebase → n8n Workflow 1 → Postgres + Google Sheets (clicks)
                                     ↓
yCloud WhatsApp → n8n Workflow 2 → Postgres + Google Sheets (mensajes)
                                     ↓
                n8n Workflow 3 (cron) → OpenAI → Conversiones
```

---

## ✅ FASE 1 COMPLETADA: SETUP BASE

### **1.1 Base de Datos Postgres (Railway)**

**Credenciales:**
- Host: `switchyard.proxy.rlwy.net`
- Port: `22428`
- Database: `railway`
- User: `postgres`
- Password: `kbwksBtAiRaXWUPkwYMAZJpNLrpZPqGl`

**Conexión n8n:**
- ✅ SSL configurado en modo `Allow`
- ✅ Ignore SSL Issues: `ON`

### **1.2 Schema Postgres**

**Tablas creadas:**
1. `clients_config` - Configuración multi-tenant por cliente
2. `events` - Registro unificado de clicks y mensajes
3. `conversions` - Conversiones clasificadas por IA

**Clientes configurados:**
1. `konversion-web` - Cliente inicial de prueba
   - `phone_filter`: `+573115810311`
   - `sheet_spreadsheet_id`: `1lvM3HHcbfv1hWpatJUs5QvITS4QsQB7SXUIfm9ERCSI`

2. `color-tapetes` - Cliente multi-tenant adicional
   - `phone_filter`: `+573123725256`
   - `sheet_spreadsheet_id`: `1lvM3HHcbfv1hWpatJUs5QvITS4QsQB7SXUIfm9ERCSI`

**Archivos:**
- [scripts/create_tables.sql](../scripts/create_tables.sql) - Schema completo
- [scripts/seed_client.sql](../scripts/seed_client.sql) - Cliente de prueba

### **1.3 Workflow 1: Click Ingest**

**URL webhook:**
```
https://n8n.railway.app/webhook/4843cac6-8188-4ac2-b178-2a9faf226fab
```

**Flujo:**
```
┌─────────────┐
│   Webhook   │ POST /webhook/{uuid}
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Parse Body  │ Code: Extrae y normaliza JSON
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Prepare SQL │ Code: Genera event_id, query y params
└──────┬──────┘
       │
       ├────────────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│  Postgres   │  │   Sheets    │
│ INSERT      │  │ Append Row  │
│ events      │  │ 'clicks'    │
└─────────────┘  └─────────────┘
```

**Nodos:**

1. **Webhook** - Recibe POST con datos del widget Firebase
2. **Parse Body** (Code) - Parsea y normaliza JSON
3. **Prepare SQL** (Code) - Genera SQL query con parámetros
4. **Postgres** - Inserta evento en tabla `events`
5. **Google Sheets** - Append a sheet "clicks" (backup)

**Código del nodo "Prepare SQL":**
```javascript
// Obtener datos del nodo anterior
const body = $input.first().json.body;
const project_id = body.project_id || 'konversion-web';
const phone_e164 = body.phone_e164;
const gclid = body.gclid;
const gclid_hash = body.gclid_hash;
const landing_url = body.landing_url;
const first_click_time_iso = body.first_click_time_iso;

// Generar event_id único sin crypto (timestamp + random)
const event_id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

// Generar timestamp actual si no viene
const ts = first_click_time_iso || new Date().toISOString();
const created_at = new Date().toISOString();

// Preparar query con valores escapados
const query = `
INSERT INTO events (
  event_id,
  project_id,
  event_type,
  phone_e164,
  ts,
  click_id,
  click_id_type,
  click_id_hash,
  landing_url,
  traffic_source,
  payload_raw,
  created_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
)
ON CONFLICT (event_id) DO NOTHING
RETURNING event_id;
`;

// Preparar parámetros
const params = [
  event_id,
  project_id,
  'click',
  phone_e164,
  ts,
  gclid,
  'gclid',
  gclid_hash,
  landing_url || null,
  'google_ads',
  JSON.stringify(body),
  created_at
];

// Retornar query y params para el nodo Postgres
return {
  query,
  params,
  body
};
```

**Configuración nodo Postgres:**
- Query: `={{ $json.query }}`
- Query Parameters: `={{ $json.params }}`

**Payload esperado del webhook:**
```json
{
  "project_id": "konversion-web",
  "phone_e164": "+573115810311",
  "gclid": "Cj0KCQiA...",
  "gclid_hash": "sha256hash...",
  "landing_url": "https://konversion.com.co",
  "first_click_time_iso": "2025-12-15T10:30:00Z",
  "source": "google_ads"
}
```

**Estado:** ✅ Funcionando correctamente
- ✅ Inserta clicks en Postgres (tabla `events`)
- ✅ Append a Google Sheets (backup)
- ✅ Dedupe por `event_id` (ON CONFLICT)

---

## 📊 VERIFICACIÓN FASE 1

**Query de verificación:**
```sql
-- Ver clicks insertados
SELECT
  event_id,
  project_id,
  event_type,
  phone_e164,
  click_id,
  ts,
  created_at
FROM events
WHERE event_type = 'click'
ORDER BY created_at DESC
LIMIT 10;

-- Verificar cliente configurado
SELECT
  project_id,
  client_name,
  status,
  phone_filter,
  sheet_spreadsheet_id
FROM clients_config
WHERE project_id = 'konversion-web';
```

---

## ✅ FASE 2 COMPLETADA: YCLOUD INGEST

### **2.1 Workflow 2: yCloud Message Ingest**

**Objetivo:** Capturar mensajes WhatsApp bidireccionales (inbound/outbound)

**URL webhook:**
```
https://primary-production-3fcd.up.railway.app/webhook/ycloud-webhook-uuid/ycloud/:project_id
```

**Ejemplo:**
```
https://primary-production-3fcd.up.railway.app/webhook/ycloud-webhook-uuid/ycloud/color-tapetes
```

**Trigger:** Webhook yCloud con path parameter `:project_id`

**Eventos soportados:**
- `whatsapp.inbound_message.received` - Mensajes entrantes
- `whatsapp.message.updated` (status=delivered) - Mensajes salientes

**Flujo:**
```
┌─────────────────┐
│ yCloud Webhook  │ POST /ycloud/:project_id
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parse yCloud   │ Code: Extrae project_id, normaliza payload
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Get Config    │ Postgres: SELECT config WHERE project_id = $1
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validate Phone  │ IF: phone_filter match + status = active
│    & Status     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Prepare Message │ Code: Genera SQL query + prepara datos Sheets
│      SQL        │
└────────┬────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌──────────────────┐
│ Insert Message  │   │ Filter for Sheets│ Code: Solo 5 campos
│   to Postgres   │   └────────┬─────────┘
└─────────────────┘            │
                               ▼
                      ┌──────────────────┐
                      │ Append to Sheets │
                      └──────────────────┘
```

**Nodos:**

1. **yCloud Webhook** - Recibe POST desde yCloud con path param `:project_id`
2. **Parse yCloud** (Code) - Extrae y normaliza datos del payload
3. **Get Config** (Postgres) - Obtiene configuración del cliente
4. **Validate Phone & Status** (IF) - Valida phone_filter y status=active
5. **Prepare Message SQL** (Code) - Genera SQL query con parámetros
6. **Insert Message to Postgres** (Postgres) - Inserta en tabla `events`
7. **Filter for Sheets** (Code) - Filtra solo campos necesarios para Sheets
8. **Append to Sheets** (Google Sheets) - Append a sheet configurada

### **2.2 Código Nodo "Parse yCloud"**

```javascript
// Obtener project_id de la URL (viene en params del webhook)
const project_id = $input.first().json.params?.project_id ||
                   $('yCloud Webhook').first().json.params?.project_id ||
                   'unknown';
const payload = $input.first().json.body;

// Detectar tipo de evento
const is_inbound = payload.type === 'whatsapp.inbound_message.received';
const is_outbound = payload.type === 'whatsapp.message.updated';

if (!is_inbound && !is_outbound) {
  throw new Error(`Unknown event type: ${payload.type}`);
}

// Extraer datos según tipo
let message_data;

if (is_inbound) {
  message_data = {
    message_id: payload.whatsappInboundMessage.id,
    phone: payload.whatsappInboundMessage.from,
    business_phone: payload.whatsappInboundMessage.to,
    text: payload.whatsappInboundMessage.text?.body || '',
    ts: payload.whatsappInboundMessage.sendTime,
    direction: 'in',
    event_type: 'message_in'
  };
} else {
  // Solo procesar si status = delivered
  if (payload.whatsappMessage.status !== 'delivered') {
    return [];
  }

  message_data = {
    message_id: payload.whatsappMessage.id,
    phone: payload.whatsappMessage.to,
    business_phone: payload.whatsappMessage.from,
    text: payload.whatsappMessage.text?.body || '',
    ts: payload.whatsappMessage.sendTime,
    direction: 'out',
    event_type: 'message_out'
  };
}

// Normalizar teléfono
function normalizePhone(phone) {
  let clean = phone.replace(/[^0-9+]/g, '');
  if (!clean.startsWith('+')) clean = '+' + clean;
  return clean;
}

// Generar event_id único
const event_id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

return {
  event_id,
  project_id,
  business_phone: normalizePhone(message_data.business_phone),
  phone_e164: normalizePhone(message_data.phone),
  message_id: message_data.message_id,
  message_text: message_data.text,
  direction: message_data.direction,
  event_type: message_data.event_type,
  ts: message_data.ts,
  provider_event_type: payload.type,
  payload_raw: JSON.stringify(payload)
};
```

### **2.3 Código Nodo "Filter for Sheets"**

```javascript
// Filtrar solo campos necesarios para Sheets
return {
  phone_e164: $json.phone_e164,
  direction: $json.direction,
  message_text: $json.message_text,
  timestamp_iso: $json.ts,
  message_id: $json.message_id,
  sheet_spreadsheet_id: $json.sheet_spreadsheet_id,
  sheet_messages_name: $json.sheet_messages_name
};
```

**Razón:** El nodo "Prepare Message SQL" retorna también `query` y `params` que contaminaban Google Sheets. Este nodo intermedio filtra solo los 5 campos de datos + 2 de configuración.

### **2.4 Configuración Nodo "Get Config"**

**Query:**
```sql
SELECT
  project_id,
  client_name,
  status,
  phone_filter,
  sheet_spreadsheet_id,
  sheet_messages_name
FROM clients_config
WHERE project_id = $1
LIMIT 1;
```

**Query Parameters:**
```javascript
{{ [$json.project_id] }}
```

**Nota importante:** Usar `$json.project_id` en lugar de `$('Parse yCloud').item.json.project_id` cuando los nodos están directamente conectados.

### **2.5 Payload Ejemplo yCloud**

**Mensaje Inbound:**
```json
{
  "type": "whatsapp.inbound_message.received",
  "whatsappInboundMessage": {
    "id": "wamid.test789",
    "from": "+573103069696",
    "to": "+573123725256",
    "text": {
      "body": "Hola! Necesito información sobre tapetes"
    },
    "sendTime": "2025-12-16T15:30:00Z"
  }
}
```

**Mensaje Outbound:**
```json
{
  "type": "whatsapp.message.updated",
  "whatsappMessage": {
    "id": "wamid.sent123",
    "from": "+573123725256",
    "to": "+573103069696",
    "status": "delivered",
    "text": {
      "body": "Gracias por tu mensaje"
    },
    "sendTime": "2025-12-16T15:31:00Z"
  }
}
```

### **2.6 Test PowerShell**

```powershell
$body = @{
  type = "whatsapp.inbound_message.received"
  whatsappInboundMessage = @{
    id = "wamid.test790"
    from = "+573103069696"
    to = "+573123725256"
    text = @{ body = "Test final después de filtro" }
    sendTime = "2025-12-16T16:00:00Z"
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Uri "https://primary-production-3fcd.up.railway.app/webhook/ycloud-webhook-uuid/ycloud/color-tapetes" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Estado:** ✅ Funcionando correctamente
- ✅ Inserta mensajes en Postgres (tabla `events`)
- ✅ Append a Google Sheets con 5 columnas correctas
- ✅ Multi-tenant funcional (project_id desde URL)
- ✅ Filtra mensajes por phone_filter
- ✅ Dedupe por `event_id` (ON CONFLICT)

---

## 📝 NOTAS TÉCNICAS

### **Problema resuelto: Módulo crypto deshabilitado**

n8n v1.123.5 Self-Hosted tiene el módulo `crypto` deshabilitado por seguridad.

**Solución:** Generar IDs únicos con timestamp + random:
```javascript
const event_id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
```

Genera IDs como: `evt_1734278901234_a3k9f2x`

### **Problema resuelto: Certificado SSL Railway**

Railway Postgres usa certificado autofirmado.

**Solución:** En credenciales n8n:
- SSL: `Allow`
- Ignore SSL Issues: `ON` ✅

### **Referencias entre nodos**

❌ Incorrecto:
```javascript
$('Prepare SQL').item.json.body.gclid
```

✅ Correcto:
```javascript
$json.body.gclid
```

n8n recomienda usar `$json` para acceder al output del nodo anterior.

### **Problema resuelto: Google Sheets enviando todos los campos**

Cuando usas `autoMapInputData` en el nodo Google Sheets v4.7, envía **todos** los campos del input, incluyendo `query`, `params`, etc.

**Síntoma:** Columnas extras en Google Sheets con SQL queries completos.

**Solución:** Agregar un nodo Code intermedio "Filter for Sheets" que retorne solo los campos necesarios:
```javascript
return {
  phone_e164: $json.phone_e164,
  direction: $json.direction,
  message_text: $json.message_text,
  timestamp_iso: $json.ts,
  message_id: $json.message_id,
  sheet_spreadsheet_id: $json.sheet_spreadsheet_id,
  sheet_messages_name: $json.sheet_messages_name
};
```

**Flujo correcto:**
```
Prepare SQL → Filter for Sheets → Append to Sheets
```

### **Problema resuelto: project_id no llegaba desde URL**

**Síntoma:** El nodo "Get Config" mostraba `[Array: [null]]` en Query Parameters.

**Causa:** La sintaxis para obtener path parameters del webhook era incorrecta.

❌ Incorrecto:
```javascript
const project_id = $input.params.project_id;
```

✅ Correcto:
```javascript
const project_id = $input.first().json.params?.project_id ||
                   $('yCloud Webhook').first().json.params?.project_id ||
                   'unknown';
```

Los path parameters del webhook vienen en `$input.first().json.params`, no en `$input.params`.

---

## 📚 DOCUMENTACIÓN RELACIONADA

- [docs/GUIA_IMPLEMENTACION.md](GUIA_IMPLEMENTACION.md) - Guía paso a paso completa
- [docs/data_model.md](data_model.md) - Schema Postgres detallado
- [docs/workflows_plan.md](workflows_plan.md) - Detalles técnicos workflows
- [scripts/create_tables.sql](../scripts/create_tables.sql) - SQL schema
- [scripts/seed_client.sql](../scripts/seed_client.sql) - Cliente de prueba

---

## 🚀 PRÓXIMOS PASOS (FASE 3)

### **Workflow 3: AI Classification**

**Objetivo:** Clasificar conversaciones con OpenAI y detectar conversiones

**Trigger:** Cron cada 5 minutos

**Flujo esperado:**
```
Cron → Get Unprocessed Conversations → Group by Phone
                                          ↓
                                    Classify with OpenAI
                                          ↓
                                    Save to conversions
                                          ↓
                                    Update Google Sheets
```

**Tareas pendientes:**
1. ⏳ Configurar credenciales OpenAI en n8n
2. ⏳ Crear Workflow 3 (AI Classification)
3. ⏳ Testear clasificación con datos reales

---

**Última actualización:** 2025-12-16
**Siguiente paso:** Implementar Workflow 3 (AI Classification) 🚀
