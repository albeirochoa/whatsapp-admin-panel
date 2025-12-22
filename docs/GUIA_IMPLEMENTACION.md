# GUÍA DE IMPLEMENTACIÓN - PASO A PASO
## Migración Firebase Widget + n8n + Postgres

**Última actualización:** 2025-12-13
**Tiempo estimado:** 2-3 días (trabajando 4 horas/día)
**Nivel de dificultad:** Intermedio

---

## 📚 DOCUMENTOS DE REFERENCIA

### **SEGUIR (en este orden):**

1. ✅ **GUIA_IMPLEMENTACION.md** (este archivo) - Paso a paso
2. ✅ **data_model.md** - Referencia del schema Postgres
3. ✅ **workflows_plan.md** - Detalles técnicos de workflows

### **CONSULTAR (solo si necesitas profundizar):**

4. 📖 **integracion_firebase_n8n.md** - Arquitectura completa
5. 📖 **workflow_maestro_multi_tenant.md** - Multi-tenant explicado
6. 📖 **dashboard_firebase_n8n.md** - Dashboard (opcional, Fase 3)
7. 📖 **arquitectura_hibrida_firebase_postgres.md** - Filosofía del diseño

### **IGNORAR (no aplicables):**

❌ **ARQUITECTURA.md** - Es del proyecto Firebase (widget), no de n8n

---

## 🎯 OBJETIVO FINAL

### **Estado Actual:**
```
Widget Firebase → n8n Workflow 1 → Google Sheets
```

### **Estado Deseado:**
```
Widget Firebase → n8n Workflow 1 → Postgres + Google Sheets
                                     ↓
yCloud → n8n Workflow 2 → Postgres + Google Sheets
                           ↓
               n8n Workflow 3 → Clasificación IA → Conversiones
                                 ↓
                       Google Sheets + Firebase Storage
```

---

## 📋 PLAN DE IMPLEMENTACIÓN (3 FASES)

### **FASE 1: Setup Base (1 día)**
- Crear schema Postgres
- Modificar Workflow 1 existente
- Validar que funciona con datos reales

### **FASE 2: Ingesta Mensajes (1 día)**
- Crear Workflow 2 (yCloud)
- Configurar webhook yCloud
- Validar ingesta bidireccional

### **FASE 3: Match + Score (1-2 días)**
- Crear Workflow 3 (clasificación IA)
- Configurar OpenAI
- Testing end-to-end
- (Opcional) Dashboard Firebase

---

## 🚀 FASE 1: SETUP BASE

### **PASO 1.1: Crear Base de Datos Postgres en Railway**

**Tiempo:** 15 minutos

```bash
# 1. Ir a Railway Dashboard
https://railway.app

# 2. Crear nuevo proyecto
New Project → Deploy PostgreSQL

# 3. Copiar DATABASE_URL
Settings → Variables → DATABASE_URL
postgresql://postgres:password@host:5432/railway

# 4. Conectar desde tu máquina local (opcional, para testing)
psql postgresql://postgres:password@host:5432/railway
```

---

### **PASO 1.2: Ejecutar SQL Schema**

**Tiempo:** 10 minutos

Copia y ejecuta este SQL en Railway Postgres:

```sql
-- ============================================
-- SCHEMA POSTGRES - KONVERSION N8N
-- Ejecutar TODO este bloque una sola vez
-- ============================================

-- Función auxiliar para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLA 1: clients_config
-- ============================================
CREATE TABLE IF NOT EXISTS clients_config (
  -- Identificación
  project_id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),

  -- Filtros
  phone_filter TEXT NOT NULL,

  -- Destinos Google Sheets
  sheet_spreadsheet_id TEXT NOT NULL,
  sheet_clicks_name TEXT DEFAULT 'clicks',
  sheet_messages_name TEXT DEFAULT 'chats_raw',
  sheet_conversions_name TEXT DEFAULT 'conversions',

  -- Clasificación IA
  prompt_template TEXT NOT NULL,
  openai_model TEXT DEFAULT 'gpt-4o-mini',
  openai_temperature DECIMAL(2,1) DEFAULT 0.3,
  openai_max_tokens INTEGER DEFAULT 150,

  -- Valores de conversión (JSON)
  conversion_config JSONB NOT NULL DEFAULT '{
    "1": {"name": "click_button", "value": 0, "currency": "USD"},
    "2": {"name": "qualified_lead", "value": 15, "currency": "USD"},
    "3": {"name": "sale_confirmed", "value": 100, "currency": "USD"}
  }'::jsonb,

  -- Matching
  regex_code_pattern TEXT DEFAULT '(?:Ref:\\s*#|Código:\\s*)([A-Z0-9]{5})',
  click_matching_window_days INTEGER DEFAULT 60,
  message_limit_per_conversation INTEGER DEFAULT 100,

  -- Metadata
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_status ON clients_config(status) WHERE status = 'active';
CREATE INDEX idx_clients_phone ON clients_config(phone_filter);

CREATE TRIGGER update_clients_config_updated_at
  BEFORE UPDATE ON clients_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA 2: events
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  -- Identificación
  event_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES clients_config(project_id),
  event_type TEXT NOT NULL CHECK (event_type IN ('click', 'message_in', 'message_out')),

  -- Campos comunes
  phone_e164 TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL,

  -- Campos de CLICK
  click_id TEXT,
  click_id_type TEXT,
  click_id_hash TEXT,
  landing_url TEXT,
  traffic_source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Campos de MENSAJE
  message_text TEXT,
  message_id TEXT,
  direction TEXT CHECK (direction IN ('in', 'out')),
  provider_event_type TEXT,

  -- Metadata
  payload_raw JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices críticos
CREATE INDEX idx_events_project_phone_ts ON events(project_id, phone_e164, ts DESC);
CREATE INDEX idx_events_project_type_unprocessed ON events(project_id, event_type, processed_at)
  WHERE processed_at IS NULL;
CREATE INDEX idx_events_click_id_hash ON events(click_id_hash) WHERE click_id_hash IS NOT NULL;
CREATE INDEX idx_events_phone_ts ON events(phone_e164, ts DESC);
CREATE INDEX idx_events_message_id ON events(message_id) WHERE message_id IS NOT NULL;

-- ============================================
-- TABLA 3: conversions
-- ============================================
CREATE TABLE IF NOT EXISTS conversions (
  -- Identificación
  conversion_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES clients_config(project_id),
  phone_e164 TEXT NOT NULL,

  -- Atribución
  click_event_id TEXT REFERENCES events(event_id),
  click_id TEXT,
  click_id_type TEXT,
  attribution_method TEXT NOT NULL CHECK (attribution_method IN ('click_id_hash_match', 'phone_match', 'organic')),

  -- Clasificación IA
  ai_label INTEGER NOT NULL CHECK (ai_label IN (1, 2, 3)),
  ai_confidence DECIMAL(4,3) CHECK (ai_confidence BETWEEN 0 AND 1),
  ai_reason TEXT,
  ai_model_used TEXT,

  -- Conversión
  conversion_name TEXT NOT NULL,
  conversion_value DECIMAL(10,2) NOT NULL,
  conversion_currency TEXT DEFAULT 'USD',
  conversion_time TIMESTAMPTZ NOT NULL,

  -- Dedupe
  external_attrib_id TEXT UNIQUE NOT NULL,

  -- Agregación mensajes (auditoría)
  aggregated_conversation TEXT,
  message_count INTEGER,
  first_message_ts TIMESTAMPTZ,
  last_message_ts TIMESTAMPTZ,

  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent_to_gads', 'failed', 'manual_review')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_conversions_project_phone ON conversions(project_id, phone_e164);
CREATE INDEX idx_conversions_external_attrib ON conversions(external_attrib_id);
CREATE INDEX idx_conversions_pending ON conversions(project_id, status) WHERE status = 'pending';
CREATE INDEX idx_conversions_click ON conversions(click_event_id) WHERE click_event_id IS NOT NULL;
CREATE INDEX idx_conversions_created ON conversions(created_at DESC);

CREATE TRIGGER update_conversions_updated_at
  BEFORE UPDATE ON conversions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED: Cliente Lucilu (ejemplo)
-- ============================================
INSERT INTO clients_config (
  project_id,
  client_name,
  status,
  phone_filter,
  sheet_spreadsheet_id,
  prompt_template,
  conversion_config
) VALUES (
  'lucilu',
  'Lucilu - Desayunos Sorpresa',
  'active',
  '+573142856021',
  '1VmsfR_Ta6ZL_Cyst3NcBjBbAaSomqbmnPdrFbHNVMbM',
  'Eres un asistente que clasifica conversaciones de WhatsApp para un negocio de desayunos sorpresa en Colombia.

Tu tarea: analizar la conversación completa (mensajes del Cliente y del Vendedor) y clasificarla en uno de estos 3 niveles:

**Label 1 - No Calificado (value: 0):**
- Solo saludos sin preguntas específicas
- Consultas muy generales sin intención clara
- Conversación no avanza

**Label 2 - Lead Calificado (value: 15000):**
- Pregunta precios específicos de productos
- Consulta disponibilidad u horarios
- Muestra interés claro pero no confirma compra

**Label 3 - Venta Confirmada (value: 85000):**
- Confirma compra explícitamente
- Proporciona datos de pago o dirección de entrega
- Dice "lo llevo", "lo quiero", "confirmo el pedido"

IMPORTANTE: Debes responder SOLO con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks.

Formato de respuesta:
{
  "label": 1,
  "value": 0,
  "confidence": 0.95,
  "reason": "Breve explicación de por qué asignaste este label"
}',
  '{
    "1": {"name": "clic_boton_wa", "value": 0, "currency": "COP"},
    "2": {"name": "chat_iniciado_wa", "value": 15000, "currency": "COP"},
    "3": {"name": "venta_confirmada_wa", "value": 85000, "currency": "COP"}
  }'::jsonb
)
ON CONFLICT (project_id) DO NOTHING;

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 'Schema creado exitosamente ✅' as status;
SELECT * FROM clients_config;
```

**Verificar que funcionó:**

```sql
-- Debería retornar 1 fila (Lucilu)
SELECT * FROM clients_config;

-- Debería retornar 0 filas (aún no hay eventos)
SELECT COUNT(*) FROM events;
SELECT COUNT(*) FROM conversions;
```

---

### **PASO 1.3: Conectar n8n a Postgres**

**Tiempo:** 10 minutos

```bash
# 1. En n8n, ir a:
Settings → Credentials → Add Credential → Postgres

# 2. Llenar formulario:
Name: Railway Postgres - Konversion
Host: [de DATABASE_URL]
Database: railway
User: postgres
Password: [de DATABASE_URL]
Port: 5432
SSL: Enabled

# 3. Test Connection → ✅ Success

# 4. Save
```

---

### **PASO 1.4: Modificar Workflow 1 Existente**

**Tiempo:** 30 minutos

**Abrir tu workflow actual de clicks en n8n y agregar este nodo:**

```
Workflow actual:
  Node 1: Webhook ✅
  Node 2: Code - Extract Data ✅
  Node 3: Google Sheets Append ✅

AGREGAR entre Node 2 y Node 3:
  Node 2.5: Postgres - Insert Event ⭐ NUEVO
```

**Código del nodo nuevo:**

**Tipo:** Postgres
**Operation:** Execute Query
**Nombre:** "Insert Event to Postgres"

```javascript
// Query SQL (campo "Query")
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
  processed_at,
  created_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
)
ON CONFLICT (event_id) DO NOTHING
RETURNING event_id;

// Parameters (campo "Parameters")
[
  "={{ $crypto.randomUUID() }}",
  "={{ $('Extract Data').item.json.project_id || 'lucilu' }}",
  "click",
  "={{ $('Extract Data').item.json.phone }}",
  "={{ $now.toISO() }}",
  "={{ $('Extract Data').item.json.gclid }}",
  "gclid",
  "={{ $crypto.createHash('sha256').update($('Extract Data').item.json.gclid || '').digest('hex') }}",
  "={{ $('Extract Data').item.json.landing_url }}",
  "google_ads",
  "={{ JSON.stringify($('Extract Data').item.json) }}",
  null,
  "={{ $now.toISO() }}"
]
```

**Alternativa simplificada (si lo anterior no funciona):**

Usa nodo **Code** antes de Postgres:

```javascript
const crypto = require('crypto');
const data = $input.first().json;

const event_id = crypto.randomUUID();
const project_id = data.project_id || 'lucilu';
const phone_e164 = data.phone;
const ts = new Date().toISOString();
const click_id = data.gclid || data.click_id;
const click_id_hash = crypto.createHash('sha256').update(click_id || '').digest('hex');

return {
  query: `
    INSERT INTO events (
      event_id, project_id, event_type, phone_e164, ts,
      click_id, click_id_type, click_id_hash, landing_url, traffic_source,
      payload_raw, processed_at, created_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
    )
    ON CONFLICT (event_id) DO NOTHING
    RETURNING event_id;
  `,
  params: [
    event_id,
    project_id,
    'click',
    phone_e164,
    ts,
    click_id,
    'gclid',
    click_id_hash,
    data.landing_url || null,
    'google_ads',
    JSON.stringify(data),
    null,
    ts
  ]
};
```

Luego agregar nodo **Postgres Execute Query** usando `{{ $json.query }}` y `{{ $json.params }}`.

---

### **PASO 1.5: Testing Workflow 1 Modificado**

**Tiempo:** 15 minutos

```bash
# 1. Hacer clic en tu widget (en tu landing page real)
https://tudominio.com?gclid=TEST123

# 2. Verificar Google Sheets (debería funcionar igual que antes)
# Abrir: https://docs.google.com/spreadsheets/d/1VmsfR_Ta6ZL.../edit
# Sheet "clicks" → Verificar última fila ✅

# 3. Verificar Postgres (NUEVO)
psql $DATABASE_URL

SELECT
  event_id,
  project_id,
  event_type,
  phone_e164,
  click_id,
  ts
FROM events
WHERE event_type = 'click'
ORDER BY created_at DESC
LIMIT 5;

# Deberías ver el click recién creado ✅
```

**Si algo falla:**

```sql
-- Ver errores en n8n:
-- Abrir workflow → Executions → Ver último error

-- Verificar tabla existe:
SELECT COUNT(*) FROM events;

-- Ver estructura tabla:
\d events

-- Ver último error Postgres:
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

---

## ✅ CHECKPOINT FASE 1

**Al terminar esta fase debes tener:**

- ✅ Postgres creado en Railway
- ✅ 3 tablas creadas (clients_config, events, conversions)
- ✅ 1 cliente seed (Lucilu)
- ✅ Workflow 1 modificado (Postgres + Sheets)
- ✅ Al menos 1 click guardado en Postgres

**Validación:**

```sql
-- Debe retornar 1
SELECT COUNT(*) FROM clients_config WHERE project_id = 'lucilu';

-- Debe retornar >0 (tus clicks de prueba)
SELECT COUNT(*) FROM events WHERE event_type = 'click';

-- Debe retornar 0 (aún no hay conversiones)
SELECT COUNT(*) FROM conversions;
```

---

## 🚀 FASE 2: INGESTA MENSAJES WHATSAPP

### **PASO 2.1: Crear Workflow 2 en n8n**

**Tiempo:** 45 minutos

**En n8n Dashboard:**

1. Click en **"Add workflow"**
2. Nombre: `Workflow 2 - yCloud Ingest`
3. Agregar los siguientes nodos:

---

#### **Node 1: Webhook**

**Tipo:** Webhook
**Nombre:** "yCloud Webhook"

```javascript
HTTP Method: POST
Path: ycloud/:project_id
Response Mode: responseNode
Authentication: None (o Header Auth si prefieres)
```

**URL generada:**
```
https://tu-n8n.railway.app/webhook/ycloud/lucilu
```

---

#### **Node 2: Code - Parse yCloud Payload**

**Tipo:** Code
**Nombre:** "Parse yCloud"

```javascript
const crypto = require('crypto');

const project_id = $input.params.project_id;
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

// Generar event_id
const event_id = crypto
  .createHash('sha256')
  .update(`${project_id}|${message_data.phone}|${message_data.ts}|${message_data.message_id}`)
  .digest('hex');

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

---

#### **Node 3: Postgres - Get Config**

**Tipo:** Postgres
**Nombre:** "Get Config"

```sql
SELECT
  project_id,
  client_name,
  status,
  phone_filter,
  sheet_spreadsheet_id,
  sheet_messages_name
FROM clients_config
WHERE project_id = '{{ $json.project_id }}'
LIMIT 1;
```

---

#### **Node 4: IF - Validate Phone**

**Tipo:** IF
**Nombre:** "Check Phone Filter"

```javascript
// Condition
return items[0].json.phone_filter === $('Parse yCloud').first().json.business_phone;
```

**Ruta TRUE:** Continuar
**Ruta FALSE:** Stop (no procesar)

---

#### **Node 5: Postgres - Insert Event**

**Tipo:** Postgres
**Nombre:** "Insert Message"

```sql
INSERT INTO events (
  event_id,
  project_id,
  event_type,
  phone_e164,
  ts,
  message_text,
  message_id,
  direction,
  provider_event_type,
  payload_raw,
  processed_at,
  created_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
)
ON CONFLICT (event_id) DO NOTHING
RETURNING event_id;

-- Parameters:
[
  "={{ $('Parse yCloud').item.json.event_id }}",
  "={{ $('Parse yCloud').item.json.project_id }}",
  "={{ $('Parse yCloud').item.json.event_type }}",
  "={{ $('Parse yCloud').item.json.phone_e164 }}",
  "={{ $('Parse yCloud').item.json.ts }}",
  "={{ $('Parse yCloud').item.json.message_text }}",
  "={{ $('Parse yCloud').item.json.message_id }}",
  "={{ $('Parse yCloud').item.json.direction }}",
  "={{ $('Parse yCloud').item.json.provider_event_type }}",
  "={{ $('Parse yCloud').item.json.payload_raw }}",
  null,
  "={{ $now.toISO() }}"
]
```

---

#### **Node 6: Google Sheets - Append Row**

**Tipo:** Google Sheets
**Nombre:** "Append to Sheets"

```javascript
Operation: Append
Sheet ID: {{ $('Get Config').item.json.sheet_spreadsheet_id }}
Range: {{ $('Get Config').item.json.sheet_messages_name }}!A:E

Values:
[
  "={{ $('Parse yCloud').item.json.phone_e164 }}",
  "={{ $('Parse yCloud').item.json.direction }}",
  "={{ $('Parse yCloud').item.json.message_text }}",
  "={{ $('Parse yCloud').item.json.ts }}",
  "={{ $('Parse yCloud').item.json.message_id }}"
]
```

---

#### **Node 7: Respond to Webhook**

**Tipo:** Respond to Webhook
**Nombre:** "Respond"

```javascript
{
  "success": true,
  "event_id": "={{ $('Insert Message').item.json.event_id }}",
  "project_id": "={{ $('Parse yCloud').item.json.project_id }}",
  "timestamp": "={{ $now.toISO() }}"
}
```

---

### **PASO 2.2: Configurar Webhook en yCloud**

**Tiempo:** 15 minutos

```bash
# 1. Login en yCloud Dashboard
https://app.ycloud.com

# 2. Ir a: Settings → Webhooks

# 3. Click "Add Webhook"

# 4. Configurar:
URL: https://tu-n8n.railway.app/webhook/ycloud/lucilu
Events:
  ✅ whatsapp.inbound_message.received
  ✅ whatsapp.message.updated
Secret: (opcional, para validación)

# 5. Save

# 6. Test webhook (envía mensaje de prueba)
```

---

### **PASO 2.3: Testing Workflow 2**

**Tiempo:** 15 minutos

```bash
# Opción 1: Test con curl (manual)
curl -X POST https://tu-n8n.railway.app/webhook/ycloud/lucilu \
  -H "Content-Type: application/json" \
  -d '{
    "type": "whatsapp.inbound_message.received",
    "whatsappInboundMessage": {
      "id": "wamid.test123",
      "from": "+573001234567",
      "to": "+573142856021",
      "text": {"body": "Hola! Cuánto cuesta el desayuno?"},
      "sendTime": "2025-01-15T10:00:00Z"
    }
  }'

# Opción 2: Enviar mensaje real desde WhatsApp
# WhatsApp → +573142856021 → "Hola prueba"

# Verificar en Postgres:
psql $DATABASE_URL

SELECT
  event_id,
  project_id,
  event_type,
  direction,
  phone_e164,
  message_text,
  ts
FROM events
WHERE event_type IN ('message_in', 'message_out')
ORDER BY created_at DESC
LIMIT 10;

# Deberías ver el mensaje ✅
```

---

## ✅ CHECKPOINT FASE 2

**Al terminar esta fase debes tener:**

- ✅ Workflow 2 creado y activo
- ✅ Webhook yCloud configurado
- ✅ Al menos 1 mensaje en Postgres (message_in o message_out)
- ✅ Google Sheets recibiendo mensajes

**Validación:**

```sql
-- Debe retornar >0
SELECT COUNT(*) FROM events WHERE event_type IN ('message_in', 'message_out');

-- Ver últimos mensajes
SELECT
  direction,
  phone_e164,
  LEFT(message_text, 50) as preview,
  ts
FROM events
WHERE event_type IN ('message_in', 'message_out')
ORDER BY ts DESC
LIMIT 5;
```

---

## 🚀 FASE 3: MATCH + SCORE + DISPATCH

### **PASO 3.1: Configurar OpenAI en n8n**

**Tiempo:** 10 minutos

```bash
# 1. Obtener API Key de OpenAI
https://platform.openai.com/api-keys

# 2. En n8n:
Settings → Credentials → Add Credential → OpenAI

# 3. Configurar:
Name: OpenAI - Konversion
API Key: sk-...

# 4. Save
```

---

### **PASO 3.2: Crear Workflow 3 en n8n**

**Tiempo:** 1-2 horas (es el más complejo)

**Archivo de referencia completo:** `workflows_plan.md` (Workflow 3)

**Resumen de nodos principales:**

1. **Cron Trigger** - Cada 2 minutos
2. **Postgres Get Pending Messages** - WHERE processed_at IS NULL
3. **Code - Group by Phone** - Agrupa mensajes por teléfono
4. **Loop Over Phones** - Procesa cada teléfono
5. **Code - Aggregate Conversation** - Formatea para IA
6. **Code - Extract Regex Code** - Busca códigos de producto
7. **Postgres - Find Click (hash)** - Matching por código
8. **IF - Click Found?** - Fallback a phone matching
9. **Postgres - Find Click (phone)** - Fallback
10. **OpenAI Chat** - Clasificación IA
11. **Code - Parse AI Response** - Validar JSON
12. **Code - Map Label to Value** - Convertir label a conversión
13. **Postgres - UPSERT Conversion** - Guardar conversión
14. **Google Sheets - Append** - Reportar
15. **Postgres - Mark Processed** - Actualizar processed_at

**⚠️ IMPORTANTE:** Este workflow es largo. Sigue el documento `workflows_plan.md` sección "Workflow 3" para el código completo de cada nodo.

---

### **PASO 3.3: Testing Workflow 3**

**Tiempo:** 30 minutos

```bash
# 1. Generar datos de prueba completos:

# a) Insertar click
curl -X POST https://tu-n8n.../webhook/click/lucilu \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+573001234567",
    "gclid": "CjwKCAiA0eTJBhBaEiwA...",
    "landing_url": "https://lucilu.com"
  }'

# b) Insertar mensaje IN
curl -X POST https://tu-n8n.../webhook/ycloud/lucilu \
  -H "Content-Type: application/json" \
  -d '{
    "type": "whatsapp.inbound_message.received",
    "whatsappInboundMessage": {
      "id": "wamid.abc123",
      "from": "+573001234567",
      "to": "+573142856021",
      "text": {"body": "Hola! Cuánto cuesta el desayuno sorpresa?"},
      "sendTime": "2025-01-15T10:05:00Z"
    }
  }'

# c) Insertar mensaje OUT
curl -X POST https://tu-n8n.../webhook/ycloud/lucilu \
  -H "Content-Type: application/json" \
  -d '{
    "type": "whatsapp.message.updated",
    "whatsappMessage": {
      "id": "wamid.def456",
      "from": "+573142856021",
      "to": "+573001234567",
      "status": "delivered",
      "text": {"body": "Buen día! El desayuno sorpresa cuesta $50.000. Incluye flores y chocolates."},
      "sendTime": "2025-01-15T10:06:00Z"
    }
  }'

# 2. Ejecutar Workflow 3 manualmente
# En n8n: Abrir Workflow 3 → Click "Execute Workflow"

# 3. Verificar conversión creada
psql $DATABASE_URL

SELECT
  conversion_id,
  project_id,
  phone_e164,
  ai_label,
  conversion_name,
  conversion_value,
  ai_confidence,
  ai_reason
FROM conversions
ORDER BY created_at DESC
LIMIT 5;

# Deberías ver 1 conversión con label 2 (lead) ✅

# 4. Verificar mensajes marcados como procesados
SELECT
  event_id,
  event_type,
  processed_at IS NOT NULL as was_processed
FROM events
WHERE event_type IN ('message_in', 'message_out')
  AND phone_e164 = '+573001234567';

# Todos deben tener processed_at != NULL ✅
```

---

## ✅ CHECKPOINT FASE 3

**Al terminar esta fase debes tener:**

- ✅ Workflow 3 creado y activo
- ✅ OpenAI configurado
- ✅ Al menos 1 conversión en Postgres
- ✅ Mensajes marcados como processed_at

**Validación:**

```sql
-- Debe retornar >0
SELECT COUNT(*) FROM conversions;

-- Ver conversiones
SELECT
  ai_label,
  conversion_name,
  conversion_value,
  phone_e164,
  ai_confidence
FROM conversions;

-- Verificar mensajes procesados
SELECT
  COUNT(*) as total_messages,
  COUNT(processed_at) as processed_messages
FROM events
WHERE event_type IN ('message_in', 'message_out');

-- Ambos números deben ser iguales ✅
```

---

## 🎉 SISTEMA COMPLETO FUNCIONANDO

**Felicitaciones! Si llegaste aquí, ya tienes:**

```
✅ Widget Firebase → n8n Workflow 1 → Postgres + Sheets
✅ yCloud → n8n Workflow 2 → Postgres + Sheets
✅ n8n Workflow 3 (cron) → Clasificación IA → Conversiones
✅ Datos en Postgres + Google Sheets
```

---

## 🔧 TROUBLESHOOTING

### **Error: "Table events does not exist"**

```sql
-- Verificar que la tabla existe
\dt

-- Si no existe, ejecutar PASO 1.2 de nuevo
```

---

### **Error: "Cannot read property 'json' of undefined"**

```javascript
// En nodos Code, verificar que referencias a nodos anteriores sean correctas
// Cambiar:
$('Extract Data').item.json.phone

// Por:
$('Extract Data').first().json.phone
```

---

### **Error: OpenAI "Invalid JSON response"**

```javascript
// En Code - Parse AI Response, agregar try/catch:
try {
  const content = $input.first().json.choices[0].message.content;
  const parsed = JSON.parse(content);

  if (!parsed.label || !parsed.value) {
    throw new Error('Invalid schema');
  }

  return parsed;
} catch (error) {
  console.error('OpenAI response:', $input.first().json);
  throw new Error(`Failed to parse AI: ${error.message}`);
}
```

---

### **Mensajes no se procesan (processed_at siempre NULL)**

```sql
-- Verificar que Workflow 3 está activo
-- En n8n: Workflow 3 → Toggle "Active" ON

-- Ejecutar manualmente para testear
-- Workflow 3 → "Execute Workflow"

-- Ver logs de ejecución
-- Workflow 3 → Executions → Ver último error
```

---

## 📊 FASE 4 (OPCIONAL): DASHBOARD FIREBASE

**Tiempo:** 2-3 horas
**Documento:** `dashboard_firebase_n8n.md`

Si quieres agregar el dashboard visual en Firebase Admin Panel:

1. Agregar nodo final en Workflow 3 (publicar stats.json)
2. Crear componente DashboardSection.jsx
3. Fetch JSON cada 30s
4. Mostrar KPIs

**Esto es opcional** - con Postgres ya puedes hacer queries directos para analytics.

---

## 📚 PRÓXIMOS PASOS

### **Agregar más clientes:**

```sql
-- Insertar cliente #2
INSERT INTO clients_config (
  project_id,
  client_name,
  status,
  phone_filter,
  sheet_spreadsheet_id,
  prompt_template,
  conversion_config
) VALUES (
  'cliente-2',
  'Panadería Sol',
  'active',
  '+573001234567',
  'SHEET_ID_CLIENTE_2',
  'Prompt personalizado...',
  '{"1": {...}, "2": {...}, "3": {...}}'::jsonb
);
```

Los workflows maestros automáticamente procesarán este nuevo cliente ✅

---

### **Optimizaciones:**

- Agregar retry logic en OpenAI (3 intentos)
- Implementar alertas Slack si Workflow 3 falla
- Particionamiento Postgres por project_id (si >1M eventos)
- Rate limiting en webhooks (evitar spam)

---

## 🆘 SOPORTE

**Si tienes problemas:**

1. Revisar logs de n8n (Executions)
2. Revisar logs de Postgres (`SELECT * FROM pg_stat_activity`)
3. Testear nodos individuales (Execute node)
4. Consultar `workflows_plan.md` para código completo

---

**FIN DE LA GUÍA**

¡Éxito en la implementación! 🚀
