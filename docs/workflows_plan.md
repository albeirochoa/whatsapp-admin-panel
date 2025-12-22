# WORKFLOWS N8N - KONVERSION SYSTEM
## 3 Workflows CORE para 80+ Clientes

**Última actualización:** 2025-12-13
**Plataforma:** n8n (Railway)

---

## ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────────┐
│  WORKFLOW 1: CLICK INGEST                                       │
│  Trigger: Webhook /click/:project_id                            │
│  Frecuencia: Real-time (on-demand)                              │
│  Operación: INSERT en events + Append a Google Sheets           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Escribe en DB
                 ▼
            ┌────────────┐
            │  POSTGRES  │
            │   events   │
            └────┬───────┘
                 │
                 │ Lee eventos pendientes
                 │
┌────────────────▼────────────────────────────────────────────────┐
│  WORKFLOW 2: YCLOUD INGEST                                      │
│  Trigger: Webhook /ycloud/:project_id                           │
│  Frecuencia: Real-time (on-demand)                              │
│  Operación: INSERT en events + Append a Google Sheets           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Escribe mensajes
                 ▼
            ┌────────────┐
            │  POSTGRES  │
            │   events   │
            └────┬───────┘
                 │
                 │ Batch processing
                 │
┌────────────────▼────────────────────────────────────────────────┐
│  WORKFLOW 3: MATCH + SCORE + DISPATCH                           │
│  Trigger: Cron cada 5 min (n8n Schedule)                        │
│  Frecuencia: Batch (programado)                                 │
│  Operación:                                                      │
│    1. Agrupar conversaciones por phone                          │
│    2. Procesar cada item (delay 500 ms)                         │
│    3. Buscar click atribuible + fallback orgánico               │
│    4. Clasificar con OpenAI                                     │
│    5. UPSERT en conversions + Append a Google Sheets            │
│    6. Marcar mensajes como procesados                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## WORKFLOW 1: CLICK INGEST

### **Objetivo**
Capturar clicks de campañas publicitarias (Google Ads/Facebook) y guardarlos para posterior matching con mensajes WhatsApp.

### **Trigger**
**Webhook Node**
- **HTTP Method:** POST
- **Path:** `/click/:project_id`
- **Authentication:** None (o API Key en header `X-API-Key`)
- **Expected Payload:**
  ```json
  {
    "phone": "+573142856021",
    "click_id": "Cj0KCQiA...",
    "click_id_type": "gclid",
    "landing_url": "https://lucilu.com/desayunos",
    "traffic_source": "google_ads",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "desayunos_enero"
  }
  ```

### **Diagrama del Workflow**

```
┌─────────────────────┐
│  1. Webhook         │
│  POST /click/:id    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  2. Code Node       │
│  Extract & Validate │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  3. Postgres Query  │
│  Get config         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  4. IF Node         │
│  status == active?  │
└──────┬──────────────┘
       │
       ├─ No → STOP
       │
       └─ Yes ▼
         ┌─────────────────────┐
         │  5. Code Node       │
         │  Build event object │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  6. Postgres Query  │
         │  INSERT event       │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  7. Google Sheets   │
         │  Append Row         │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  8. Respond to      │
         │     Webhook         │
         └─────────────────────┘
```

### **Nodos Detallados**

#### **Node 1: Webhook**
```javascript
// Configuración
{
  "httpMethod": "POST",
  "path": "click/:project_id",
  "responseMode": "responseNode"
}
```

#### **Node 2: Code - Extract & Validate**
```javascript
// Extraer datos del webhook
const project_id = $input.params.project_id;
const body = $input.first().json.body;

// Validar campos requeridos
if (!body.phone || !body.click_id) {
  throw new Error('Missing required fields: phone, click_id');
}

// Normalizar teléfono a E.164
function normalizePhone(phone) {
  let clean = phone.replace(/[^0-9+]/g, '');
  if (!clean.startsWith('+')) clean = '+' + clean;
  return clean;
}

// Generar click_id_hash (SHA256)
const crypto = require('crypto');
const click_id_hash = crypto
  .createHash('sha256')
  .update(body.click_id)
  .digest('hex');

// Generar event_id único
const ts = new Date().toISOString();
const event_id = crypto
  .createHash('sha256')
  .update(`${project_id}|${normalizePhone(body.phone)}|${ts}|${body.click_id}`)
  .digest('hex');

// Output
return {
  project_id,
  event_id,
  phone_e164: normalizePhone(body.phone),
  ts,
  click_id: body.click_id,
  click_id_type: body.click_id_type || 'gclid',
  click_id_hash,
  landing_url: body.landing_url || null,
  traffic_source: body.traffic_source || 'unknown',
  utm_source: body.utm_source || null,
  utm_medium: body.utm_medium || null,
  utm_campaign: body.utm_campaign || null,
  payload_raw: JSON.stringify(body)
};
```

#### **Node 3: Postgres Query - Get Config**
```sql
SELECT
  project_id,
  client_name,
  status,
  sheet_spreadsheet_id,
  sheet_clicks_name
FROM clients_config
WHERE project_id = '{{ $json.project_id }}'
LIMIT 1;
```

#### **Node 4: IF Node**
```javascript
// Condition
return items[0].json.status === 'active';
```

#### **Node 5: Code - Build Event Object**
```javascript
const event = $input.first().json;
const config = $('Get Config').first().json;

return {
  // Para INSERT Postgres
  db_insert: {
    event_id: event.event_id,
    project_id: event.project_id,
    event_type: 'click',
    phone_e164: event.phone_e164,
    ts: event.ts,
    click_id: event.click_id,
    click_id_type: event.click_id_type,
    click_id_hash: event.click_id_hash,
    landing_url: event.landing_url,
    traffic_source: event.traffic_source,
    utm_source: event.utm_source,
    utm_medium: event.utm_medium,
    utm_campaign: event.utm_campaign,
    payload_raw: event.payload_raw,
    processed_at: null,
    created_at: event.ts
  },

  // Para Google Sheets
  sheet_row: {
    spreadsheet_id: config.sheet_spreadsheet_id,
    sheet_name: config.sheet_clicks_name,
    values: [
      event.click_id,           // A: gclid
      event.phone_e164,         // B: phone_e164
      event.ts,                 // C: first_click_time_iso
      event.landing_url,        // D: landing_url
      event.traffic_source,     // E: source
      event.click_id_hash       // F: gclid_hash
    ]
  }
};
```

#### **Node 6: Postgres Query - INSERT Event**
```sql
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
  utm_source,
  utm_medium,
  utm_campaign,
  payload_raw,
  processed_at,
  created_at
) VALUES (
  '{{ $json.db_insert.event_id }}',
  '{{ $json.db_insert.project_id }}',
  '{{ $json.db_insert.event_type }}',
  '{{ $json.db_insert.phone_e164 }}',
  '{{ $json.db_insert.ts }}',
  '{{ $json.db_insert.click_id }}',
  '{{ $json.db_insert.click_id_type }}',
  '{{ $json.db_insert.click_id_hash }}',
  '{{ $json.db_insert.landing_url }}',
  '{{ $json.db_insert.traffic_source }}',
  '{{ $json.db_insert.utm_source }}',
  '{{ $json.db_insert.utm_medium }}',
  '{{ $json.db_insert.utm_campaign }}',
  '{{ $json.db_insert.payload_raw }}'::jsonb,
  NULL,
  '{{ $json.db_insert.created_at }}'
)
ON CONFLICT (event_id) DO NOTHING
RETURNING event_id;
```

#### **Node 7: Google Sheets - Append Row**
```javascript
// Configuración del nodo
{
  "operation": "append",
  "sheetId": "{{ $('Code - Build').first().json.sheet_row.spreadsheet_id }}",
  "range": "{{ $('Code - Build').first().json.sheet_row.sheet_name }}!A:F",
  "options": {
    "valueInputOption": "USER_ENTERED"
  },
  "columns": {
    "values": "={{ $('Code - Build').first().json.sheet_row.values }}"
  }
}
```

#### **Node 8: Respond to Webhook**
```javascript
return {
  success: true,
  event_id: $('Insert Event').first().json.event_id,
  project_id: $input.first().json.project_id,
  timestamp: new Date().toISOString()
};
```

---

## WORKFLOW 2: YCLOUD INGEST

### **Objetivo**
Capturar mensajes WhatsApp bidireccionales (cliente → agente y agente → cliente) desde webhooks de yCloud.

### **Trigger**
**Webhook Node**
- **HTTP Method:** POST
- **Path:** `/ycloud/:project_id`
- **Expected Payload (inbound):**
  ```json
  {
    "id": "event-123",
    "type": "whatsapp.inbound_message.received",
    "whatsappInboundMessage": {
      "id": "wamid.ABC123",
      "from": "+573001234567",
      "to": "+573142856021",
      "text": {
        "body": "Hola, cuánto cuesta el desayuno?"
      },
      "sendTime": "2025-01-15T10:35:00Z"
    }
  }
  ```
- **Expected Payload (outbound):**
  ```json
  {
    "id": "event-456",
    "type": "whatsapp.message.updated",
    "whatsappMessage": {
      "id": "wamid.DEF456",
      "from": "+573142856021",
      "to": "+573001234567",
      "status": "delivered",
      "text": {
        "body": "Buen día! El desayuno cuesta $50.000"
      },
      "sendTime": "2025-01-15T10:36:00Z"
    }
  }
  ```

### **Diagrama del Workflow**

```
┌─────────────────────┐
│  1. Webhook         │
│  POST /ycloud/:id   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  2. Code Node       │
│  Parse yCloud       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  3. Switch Node     │
│  event.type         │
└──┬───────────────┬──┘
   │               │
   │ inbound_msg   │ message.updated
   ▼               ▼
┌──────────┐   ┌──────────┐
│ Ruta IN  │   │ Ruta OUT │
└────┬─────┘   └────┬─────┘
     │              │
     └──────┬───────┘
            │
            ▼
┌─────────────────────┐
│  4. Postgres Query  │
│  Get config         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  5. IF Node         │
│  phone matches?     │
└──────┬──────────────┘
       │
       ├─ No → STOP
       │
       └─ Yes ▼
         ┌─────────────────────┐
         │  6. Code Node       │
         │  Build event        │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  7. Postgres INSERT │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  8. Google Sheets   │
         │  Append Row         │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │  9. Respond         │
         └─────────────────────┘
```

### **Nodos Detallados**

#### **Node 2: Code - Parse yCloud**
```javascript
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
    phone: payload.whatsappInboundMessage.from, // Cliente
    business_phone: payload.whatsappInboundMessage.to, // Negocio
    text: payload.whatsappInboundMessage.text?.body || '',
    ts: payload.whatsappInboundMessage.sendTime,
    direction: 'in',
    event_type: 'message_in'
  };
} else {
  // Outbound - solo si status = delivered
  if (payload.whatsappMessage.status !== 'delivered') {
    return []; // Skip no procesables
  }

  message_data = {
    message_id: payload.whatsappMessage.id,
    phone: payload.whatsappMessage.to, // Cliente
    business_phone: payload.whatsappMessage.from, // Negocio
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
const crypto = require('crypto');
const event_id = crypto
  .createHash('sha256')
  .update(`${project_id}|${message_data.phone}|${message_data.ts}|${message_data.message_id}|${message_data.direction}`)
  .digest('hex');

return {
  project_id,
  event_id,
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

#### **Node 3: Switch Node**
```javascript
// Routing rules
{
  "rules": [
    {
      "output": 0,
      "condition": "={{ $json.event_type === 'message_in' }}"
    },
    {
      "output": 1,
      "condition": "={{ $json.event_type === 'message_out' }}"
    }
  ]
}
```

#### **Node 4: Postgres - Get Config**
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

#### **Node 5: IF Node - Phone Matches**
```javascript
// Verificar que el business_phone del mensaje coincida con el phone_filter del config
const config = $input.first().json;
const message = $('Parse yCloud').first().json;

return config.phone_filter === message.business_phone;
```

#### **Node 6: Code - Build Event**
```javascript
const msg = $('Parse yCloud').first().json;
const config = $('Get Config').first().json;

return {
  db_insert: {
    event_id: msg.event_id,
    project_id: msg.project_id,
    event_type: msg.event_type,
    phone_e164: msg.phone_e164,
    ts: msg.ts,
    message_text: msg.message_text,
    message_id: msg.message_id,
    direction: msg.direction,
    provider_event_type: msg.provider_event_type,
    payload_raw: msg.payload_raw,
    processed_at: null,
    created_at: msg.ts
  },

  sheet_row: {
    spreadsheet_id: config.sheet_spreadsheet_id,
    sheet_name: config.sheet_messages_name,
    values: [
      msg.phone_e164,       // A: phone_e164
      msg.direction,        // B: direction (in/out)
      msg.message_text,     // C: text
      msg.ts,               // D: timestamp_iso
      msg.message_id        // E: message_id
    ]
  }
};
```

#### **Node 7: Postgres INSERT**
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
  '{{ $json.db_insert.event_id }}',
  '{{ $json.db_insert.project_id }}',
  '{{ $json.db_insert.event_type }}',
  '{{ $json.db_insert.phone_e164 }}',
  '{{ $json.db_insert.ts }}',
  '{{ $json.db_insert.message_text }}',
  '{{ $json.db_insert.message_id }}',
  '{{ $json.db_insert.direction }}',
  '{{ $json.db_insert.provider_event_type }}',
  '{{ $json.db_insert.payload_raw }}'::jsonb,
  NULL,
  '{{ $json.db_insert.created_at }}'
)
ON CONFLICT (event_id) DO NOTHING
RETURNING event_id;
```

#### **Node 8: Google Sheets - Append**
```javascript
{
  "operation": "append",
  "sheetId": "={{ $('Code - Build').first().json.sheet_row.spreadsheet_id }}",
  "range": "={{ $('Code - Build').first().json.sheet_row.sheet_name }}!A:E",
  "options": {
    "valueInputOption": "USER_ENTERED"
  },
  "columns": {
    "values": "={{ $('Code - Build').first().json.sheet_row.values }}"
  }
}
```

---

## WORKFLOW 3: MATCH + SCORE + DISPATCH

### **Objetivo**
Procesar todos los mensajes pendientes, agregar la conversaci?n por cliente, matchear el click m?s cercano, clasificar con IA y dejar registradas las conversiones tanto en Postgres como en Google Sheets.

### **Triggers**
1. **Cron:** Schedule Trigger configurado cada 5 minutos.
2. **Manual:** Ejecutar "Execute Workflow" desde n8n cuando se necesite depurar (no hay webhook manual en esta versi?n).

### **Diagrama del Workflow (Simplificado)**
```
??????????????      ??????????????????      ????????????????
? 1. Cron    ? ???? ? 2. Get Pending ? ???? ? 3. IF Has?   ?
??????????????      ??????????????????      ????????????????
                                                   ?No
                                                   ?
                                             No Messages (NoOp)
                                                   ?S?
                                                   ?
                                            ????????????????
                                            ?4. Group by   ?
                                            ?   Phone      ?
                                            ????????????????
                                                 ? (items)
                                            ????????????????
                                            ?5. Process    ?
                                            ?   Convers.   ?
                                            ????????????????
                                                 ?
                                     ???????????????????????????
                                     ?6. Find Click (PG, AOD) ?
                                     ???????????????????????????
                                          ?
                                ????????????????????????
                                ?7. Merge Click Data   ?
                                ????????????????????????
                                     ?
                           ????????????????????????????
                           ?8. Classify with OpenAI   ?
                           ????????????????????????????
                                ?
                      ????????????????????????????????
                      ?9. Parse AI Response          ?
                      ????????????????????????????????
                           ?
                ??????????????????????????
                ?10. Save Conversion (PG)?
                ??????????????????????????
                     ?
        ???????????????????????????????????????????
        ?                    ?                    ?
11. Prepare Update   12. Mark Processed    13. Prepare Sheets
                                             ?
                                             ?
                                     14. Append to Sheets
```

### **Nodos Detallados**

#### **Node 1: Schedule Trigger**
- Intervalo de 5 minutos.
- Ejecuta el batch completo sin inputs manuales.

#### **Node 2: Postgres - Get Pending Messages**
```sql
SELECT
  e.event_id,
  e.project_id,
  e.phone_e164,
  e.ts,
  e.message_text,
  e.direction,
  c.client_name,
  c.prompt_template,
  c.conversion_config,
  c.openai_model,
  c.openai_temperature,
  c.openai_max_tokens,
  c.click_matching_window_days,
  c.sheet_spreadsheet_id,
  c.sheet_conversions_name
FROM events e
INNER JOIN clients_config c ON e.project_id = c.project_id
WHERE e.event_type IN ('message_in', 'message_out')
  AND e.processed_at IS NULL
  AND c.status = 'active'
ORDER BY e.project_id, e.phone_e164, e.ts ASC
LIMIT 500;
```
- Devuelve todos los mensajes listos para agrupar, junto con la configuraci?n del cliente.

#### **Node 3: IF - Has Messages?**
- Condici?n: `$input.all().length > 0`.
- Si no hay registros, sale por la rama "No" hacia `No Messages` (NoOp) y termina la ejecuci?n.

#### **Node 4: Code - Group by Phone**
```javascript
const items = $input.all();
const groups = {};

for (const item of items) {
  const key = `${item.json.project_id}:${item.json.phone_e164}`;

  if (!groups[key]) {
    let conversionConfig = item.json.conversion_config;
    if (typeof conversionConfig === 'string') {
      try {
        conversionConfig = JSON.parse(conversionConfig);
      } catch (error) {
        conversionConfig = {
          '1': { name: 'no_qualified', value: 0, currency: 'COP' },
          '2': { name: 'lead_qualified', value: 15000, currency: 'COP' },
          '3': { name: 'sale_confirmed', value: 85000, currency: 'COP' }
        };
      }
    }

    groups[key] = {
      project_id: item.json.project_id,
      phone_e164: item.json.phone_e164,
      config: {
        client_name: item.json.client_name,
        prompt_template: item.json.prompt_template,
        conversion_config: conversionConfig,
        openai_model: item.json.openai_model || 'gpt-4o-mini',
        openai_temperature: parseFloat(item.json.openai_temperature) || 0.3,
        openai_max_tokens: parseInt(item.json.openai_max_tokens) || 150,
        click_matching_window_days: parseInt(item.json.click_matching_window_days) || 60,
        sheet_spreadsheet_id: item.json.sheet_spreadsheet_id,
        sheet_conversions_name: item.json.sheet_conversions_name || 'conversions'
      },
      messages: [],
      event_ids: []
    };
  }

  groups[key].messages.push({
    ts: item.json.ts,
    text: item.json.message_text || '',
    direction: item.json.direction
  });

  groups[key].event_ids.push(item.json.event_id);
}

return Object.values(groups).map(group => ({ json: group }));
```
- Ejecuta en modo `runOnceForAllItems` y prepara la estructura base para cada conversaci?n.

#### **Node 5: Code - Process Conversation**
```javascript
const group = $input.item.json;

if (!group.messages || !Array.isArray(group.messages)) {
  throw new Error('No messages array. Keys: ' + Object.keys(group).join(', '));
}

if (group.messages.length === 0) {
  return {
    ...group,
    aggregated_conversation: '[No hay mensajes]',
    message_count: 0,
    first_message_ts: new Date().toISOString(),
    last_message_ts: new Date().toISOString(),
    click_data: null,
    has_click: false
  };
}

const sortedMessages = [...group.messages].sort((a, b) =>
  new Date(a.ts) - new Date(b.ts)
);

const conversation = sortedMessages
  .map(m => {
    const direction = m.direction === 'in' ? 'CLIENTE' : 'AGENTE';
    const text = m.text && m.text.trim() ? m.text : '[Multimedia/Sin texto]';
    return `${direction}: ${text}`;
  })
  .join('
');

await new Promise(resolve => setTimeout(resolve, 500));

return {
  project_id: group.project_id,
  phone_e164: group.phone_e164,
  config: group.config,
  event_ids: group.event_ids,
  aggregated_conversation: conversation,
  message_count: group.messages.length,
  first_message_ts: sortedMessages[0].ts,
  last_message_ts: sortedMessages[sortedMessages.length - 1].ts,
  click_data: null,
  has_click: false
};
```
- Corre en `runOnceForEachItem`. Agrega la conversaci?n y aplica rate limit de 500 ms para evitar 429s.

#### **Node 6: Postgres - Find Click**
```sql
SELECT
  event_id as click_event_id,
  click_id,
  click_id_type,
  click_id_hash,
  ts as click_ts,
  landing_url
FROM events
WHERE project_id = $1
  AND phone_e164 = $2
  AND event_type = 'click'
  AND ts < $3
  AND ts >= NOW() - INTERVAL '60 days'
ORDER BY ts DESC
LIMIT 1;
```
- `alwaysOutputData: true` para que el flujo contin?e incluso cuando no exista click (atribuci?n org?nica).

#### **Node 7: Code - Merge Click Data**
```javascript
const itemIndex = $itemIndex;
const allConvos = $('Process Conversation').all();
const convo = allConvos[itemIndex]?.json;
const clickResult = $input.item.json;

if (!convo) {
  throw new Error(`No conversation found at index ${itemIndex}`);
}

let click_data = null;
let has_click = false;

if (clickResult && clickResult.click_event_id) {
  click_data = clickResult;
  has_click = true;
}

return {
  ...convo,
  click_data,
  has_click
};
```
- El uso de `$itemIndex` evita la p?rdida de datos que ocurr?a cuando el nodo SQL devolv?a `[]`.

#### **Node 8: OpenAI - Classify conversation**
- Modelo: `={{ $json.config.openai_model || 'gpt-4o-mini' }}`.
- Prompt System: `{{ $json.config.prompt_template }}`.
- Prompt User: Conversaci?n agregada (`$json.aggregated_conversation`).
- Opciones: `temperature`, `maxTokens` y `model` vienen por item desde la configuraci?n del cliente.

#### **Node 9: Code - Parse AI Response**
```javascript
const itemIndex = $itemIndex;
const openai_response = $input.item.json;
const convo_data = $('Merge Click Data').all()[itemIndex]?.json;

let ai_result;
try {
  const content = openai_response.message?.content ||
                  openai_response.choices?.[0]?.message?.content || '{}';
  const cleanContent = content
    .replace(/```json
?/g, '')
    .replace(/```
?/g, '')
    .trim();
  ai_result = JSON.parse(cleanContent);
  if (typeof ai_result.label === 'undefined') ai_result.label = 1;
  if (typeof ai_result.confidence === 'undefined') ai_result.confidence = 0.5;
  if (!ai_result.reason) ai_result.reason = 'Clasificaci?n autom?tica';
  if (![1, 2, 3].includes(ai_result.label)) ai_result.label = 1;
} catch (error) {
  ai_result = {
    label: 1,
    confidence: 0.3,
    reason: 'Error parsing: ' + error.message
  };
}

const conversion_config = convo_data.config.conversion_config[ai_result.label.toString()] ||
  { name: 'unknown', value: 0, currency: 'COP' };

const conversion_id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
const external_attrib_id = `conv-${convo_data.project_id}-${convo_data.phone_e164}-${ai_result.label}`;

let attribution_method = 'organic';
if (convo_data.click_data && convo_data.click_data.click_id) {
  attribution_method = convo_data.click_data.click_id_hash
    ? 'click_id_hash_match'
    : 'click_id_match';
}

return {
  conversion_id,
  project_id: convo_data.project_id,
  phone_e164: convo_data.phone_e164,
  click_event_id: convo_data.click_data?.click_event_id || null,
  click_id: convo_data.click_data?.click_id || null,
  click_id_type: convo_data.click_data?.click_id_type || null,
  attribution_method,
  ai_label: ai_result.label,
  ai_confidence: ai_result.confidence,
  ai_reason: ai_result.reason,
  ai_model_used: convo_data.config.openai_model || 'gpt-4o-mini',
  conversion_name: conversion_config.name,
  conversion_value: conversion_config.value,
  conversion_currency: conversion_config.currency || 'COP',
  conversion_time: new Date().toISOString(),
  external_attrib_id,
  aggregated_conversation: convo_data.aggregated_conversation,
  message_count: convo_data.message_count,
  first_message_ts: convo_data.first_message_ts,
  last_message_ts: convo_data.last_message_ts,
  event_ids: convo_data.event_ids,
  config: convo_data.config
};
```

#### **Node 10: Postgres - Save Conversion**
```sql
INSERT INTO conversions (
  conversion_id,
  project_id,
  phone_e164,
  click_event_id,
  click_id,
  click_id_type,
  attribution_method,
  ai_label,
  ai_confidence,
  ai_reason,
  ai_model_used,
  conversion_name,
  conversion_value,
  conversion_currency,
  conversion_time,
  external_attrib_id,
  aggregated_conversation,
  message_count,
  first_message_ts,
  last_message_ts,
  status,
  created_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'pending', NOW()
)
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
- `alwaysOutputData: true` para continuar aunque no haya upsert (por ejemplo, label m?s bajo que el existente).

#### **Node 11: Code - Prepare Update**
```javascript
const itemIndex = $itemIndex;
const data = $('Parse AI Response').all()[itemIndex]?.json;

if (!data || !data.event_ids) {
  return { success: false, message: 'No event_ids', event_ids_array: [] };
}

return {
  event_ids_array: data.event_ids,
  count: data.event_ids.length
};
```

#### **Node 12: Postgres - Mark as Processed**
```sql
UPDATE events
SET processed_at = NOW()
WHERE event_id = ANY($1::text[])
RETURNING event_id;
```
- Tambi?n con `alwaysOutputData: true` para mantener el pipeline incluso si alg?n batch llega vac?o.

#### **Node 13: Code - Prepare for Sheets**
```javascript
const itemIndex = $itemIndex;
const data = $('Parse AI Response').all()[itemIndex]?.json;

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toISOString().replace('T', ' ').substring(0, 19) + '-05:00';
};

const labelMap = {
  1: 'No Calificado',
  2: 'Lead Calificado',
  3: 'Venta Confirmada'
};

return {
  click_id: data.click_id || '',
  conversion_name: data.conversion_name,
  conversion_time: formatDate(data.conversion_time),
  conversion_value: data.conversion_value,
  conversion_currency: data.conversion_currency,
  phone_e164: data.phone_e164,
  ai_reason: data.ai_reason,
  ai_confidence: Math.round(data.ai_confidence * 100) / 100,
  external_attrib_id: data.external_attrib_id,
  label_text: labelMap[data.ai_label] || 'Unknown',
  sheet_spreadsheet_id: data.config.sheet_spreadsheet_id,
  sheet_name: data.config.sheet_conversions_name || 'conversions'
};
```

#### **Node 14: Google Sheets - Append Row**
- Operaci?n `append`, columnas fijas (A:I) para Google Ads Offline Conversions.
- Usa `sheet_spreadsheet_id` y `sheet_name` del paso anterior.
- Formato final: `Google Click ID`, `Conversion Name`, `Conversion Time`, `Conversion Value`, `Conversion Currency`, `phone_e164`, `ai_reason`, `ai_confidence`, `external_attrib_id`.

### **Notas clave / mejoras respecto a la versi?n anterior**
- No hay `Split in Batches`. El modo `runOnceForEachItem` nativo de n8n maneja la iteraci?n.
- `Process Conversation` agrega la conversaci?n y aplica un delay de 500 ms para proteger a OpenAI/Sheets/Postgres.
- `alwaysOutputData: true` est? habilitado en los nodos Postgres donde una query vac?a era antes un bloqueo.
- La fusi?n de datos se hace con `$itemIndex` y `$('Node').all()`, garantizando que nunca se pierdan configuraciones ni event_ids.
- Todo el contexto requerido por OpenAI proviene de `$json` (nada de `$('Node').item`), por lo que el nodo ya no lanza `content null`.
- La conversaci?n completa y la metadata se mantienen disponibles hasta el final para el guardado en Postgres, Sheets y para marcar mensajes como procesados.

## MEJORES PRÁCTICAS N8N

### **1. Manejo de Errores**

```javascript
// En todos los Code Nodes críticos
try {
  // Lógica principal
  return result;
} catch (error) {
  // Log error
  console.error('Error in node:', error.message);

  // Enviar a webhook de alertas (opcional)
  // await $http.request({
  //   method: 'POST',
  //   url: 'https://hooks.slack.com/...',
  //   body: { text: `Error en workflow: ${error.message}` }
  // });

  // Re-throw para que n8n marque como fallido
  throw error;
}
```

### **2. Retry en OpenAI**

```javascript
// Configuración del nodo OpenAI
{
  "retryOnFail": true,
  "maxTries": 3,
  "waitBetweenTries": 2000 // 2 segundos
}
```

### **3. Rate Limiting Google Sheets**

```javascript
// Agregar Wait node después de Google Sheets
{
  "wait": 1000 // 1 segundo entre requests
}
```

### **4. Logging**

```javascript
// Code node de logging (opcional)
const data = $input.first().json;

await $http.request({
  method: 'POST',
  url: process.env.LOGGING_WEBHOOK,
  body: {
    workflow: 'match-score-dispatch',
    event: 'conversion_created',
    project_id: data.project_id,
    phone: data.phone_e164,
    ai_label: data.ai_label,
    timestamp: new Date().toISOString()
  }
});

return data; // Pass-through
```

---

## VARIABLES DE ENTORNO

```env
# Postgres
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# OpenAI
OPENAI_API_KEY=sk-...

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...

# Webhooks (opcional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
LOGGING_WEBHOOK_URL=https://...

# Config
DEFAULT_TIMEZONE=America/Bogota
DEFAULT_OPENAI_MODEL=gpt-4o-mini
```

---

## TESTING WORKFLOWS

### **Test Workflow 1 (Click Ingest)**

```bash
curl -X POST https://n8n.railway.app/webhook/click/lucilu \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+573142856021",
    "click_id": "test-gclid-123",
    "click_id_type": "gclid",
    "landing_url": "https://lucilu.com/test",
    "traffic_source": "google_ads"
  }'
```

### **Test Workflow 2 (yCloud Ingest)**

```bash
curl -X POST https://n8n.railway.app/webhook/ycloud/lucilu \
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
```

### **Test Workflow 3 (Manual Execution)**

1. En n8n selecciona el workflow **Workflow 3 - AI Classification (FIXED)**.
2. Haz clic en **Execute Workflow** (botón verde). El Schedule Trigger se deshabilita temporalmente y la ejecución arranca inmediatamente.
3. Observa el log de cada nodo (`Process Conversation`, `Merge Click Data`, etc.) para validar índices y tiempos.
4. Detén la ejecución si necesitas abortar; el workflow es idempotente gracias al `external_attrib_id`.

---

## MONITOREO

### **Queries de Health Check**

```sql
-- Mensajes pendientes de procesar
SELECT
  project_id,
  count(*) as pending_messages
FROM events
WHERE event_type IN ('message_in', 'message_out')
  AND processed_at IS NULL
GROUP BY project_id;

-- Conversiones creadas hoy
SELECT
  project_id,
  ai_label,
  count(*) as count,
  sum(conversion_value) as total_value
FROM conversions
WHERE created_at >= CURRENT_DATE
GROUP BY project_id, ai_label;

-- Errores de procesamiento (latencia >5 min)
SELECT
  project_id,
  phone_e164,
  count(*) as stuck_messages,
  min(ts) as oldest_message
FROM events
WHERE event_type IN ('message_in', 'message_out')
  AND processed_at IS NULL
  AND ts < NOW() - INTERVAL '5 minutes'
GROUP BY project_id, phone_e164;
```

---

**FIN DEL DOCUMENTO**
