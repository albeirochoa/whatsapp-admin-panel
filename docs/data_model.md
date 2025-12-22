# MODELO DE DATOS - N8N KONVERSION SYSTEM
## Sistema de Conversiones WhatsApp Multi-Tenant

**Última actualización:** 2025-12-13
**Base de datos:** PostgreSQL (Railway)

---

## RESUMEN EJECUTIVO

Sistema de 3 tablas para gestionar:
- **80+ clientes** en arquitectura multi-tenant
- **Tracking de clicks** de campañas (Google Ads/Facebook)
- **Mensajes WhatsApp** bidireccionales (cliente ↔ agente)
- **Clasificación IA** de conversaciones (GPT-4)
- **Conversiones** con atribución para Google Ads

**Clave primaria multi-tenant:** `project_id` (identificador único por cliente)

---

## TABLA 1: `clients_config`

**Propósito:** Configuración por cliente (multi-tenant)

```sql
CREATE TABLE clients_config (
  -- IDENTIFICACIÓN
  project_id TEXT PRIMARY KEY,                    -- Slug único: 'lucilu', 'cliente_2', etc.
  client_name TEXT NOT NULL,                      -- Nombre comercial
  status TEXT DEFAULT 'active'                    -- 'active' | 'paused' | 'archived'
    CHECK (status IN ('active', 'paused', 'archived')),

  -- FILTROS DE INGESTA
  phone_filter TEXT NOT NULL,                     -- WhatsApp del cliente (ej: +573142856021)

  -- DESTINOS GOOGLE SHEETS (reporting)
  sheet_spreadsheet_id TEXT NOT NULL,             -- ID del spreadsheet completo
  sheet_clicks_name TEXT DEFAULT 'clicks',        -- Nombre del sheet de clicks
  sheet_messages_name TEXT DEFAULT 'chats_raw',   -- Nombre del sheet de mensajes
  sheet_conversions_name TEXT DEFAULT 'conversions', -- Nombre del sheet de conversiones

  -- CLASIFICACIÓN IA
  prompt_template TEXT NOT NULL,                  -- Prompt GPT con placeholders
  openai_model TEXT DEFAULT 'gpt-4o-mini',        -- Modelo OpenAI a usar
  openai_temperature DECIMAL(2,1) DEFAULT 0.3,    -- Temperatura del modelo (0.0-2.0)
  openai_max_tokens INTEGER DEFAULT 150,          -- Límite de tokens respuesta

  -- VALORES DE NEGOCIO
  conversion_config JSONB NOT NULL DEFAULT '{
    "1": {"name": "click_button", "value": 0, "currency": "USD"},
    "2": {"name": "qualified_lead", "value": 15, "currency": "USD"},
    "3": {"name": "sale_confirmed", "value": 100, "currency": "USD"}
  }'::jsonb,                                       -- Configuración de conversiones por label

  -- MATCHING
  regex_code_pattern TEXT DEFAULT '(?:Ref:\s*#|Código:\s*)([A-Z0-9]{5})', -- Regex para extraer códigos
  click_matching_window_days INTEGER DEFAULT 60,  -- Ventana temporal para matching clicks
  message_limit_per_conversation INTEGER DEFAULT 100, -- Max mensajes a agregar para IA

  -- METADATA
  timezone TEXT DEFAULT 'UTC',                    -- Zona horaria del cliente
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_clients_status ON clients_config(status) WHERE status = 'active';
CREATE INDEX idx_clients_phone ON clients_config(phone_filter);

-- Trigger para updated_at
CREATE TRIGGER update_clients_config_updated_at
  BEFORE UPDATE ON clients_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### **Ejemplo de configuración:**

```sql
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
  'Eres un asistente que clasifica conversaciones de WhatsApp para un negocio de {business_type} en {country}.

Clasifica la conversación en:
- Label 1: Solo saludos (valor: $0)
- Label 2: Consulta precios/disponibilidad (valor: $15)
- Label 3: Confirma compra (valor: $100)

Responde SOLO con JSON:
{
  "label": 1-3,
  "value": 0-100,
  "confidence": 0.0-1.0,
  "reason": "explicación breve"
}',
  '{
    "1": {"name": "clic_boton_wa", "value": 0, "currency": "COP"},
    "2": {"name": "chat_iniciado_wa", "value": 15000, "currency": "COP"},
    "3": {"name": "venta_confirmada_wa", "value": 85000, "currency": "COP"}
  }'::jsonb
);
```

---

## TABLA 2: `events`

**Propósito:** Registro unificado de clicks y mensajes (append-only)

```sql
CREATE TABLE events (
  -- IDENTIFICACIÓN
  event_id TEXT PRIMARY KEY,                      -- SHA256(project_id + phone + ts + type + unique_data)
  project_id TEXT NOT NULL REFERENCES clients_config(project_id),
  event_type TEXT NOT NULL                        -- 'click' | 'message_in' | 'message_out'
    CHECK (event_type IN ('click', 'message_in', 'message_out')),

  -- CAMPOS COMUNES
  phone_e164 TEXT NOT NULL,                       -- Teléfono en formato E.164 (+573142856021)
  ts TIMESTAMPTZ NOT NULL,                        -- Timestamp del evento

  -- CAMPOS DE CLICK (solo event_type = 'click')
  click_id TEXT,                                  -- gclid, fbclid, gbraid, wbraid
  click_id_type TEXT,                             -- 'gclid' | 'fbclid' | 'gbraid' | 'wbraid'
  click_id_hash TEXT,                             -- SHA256 del click_id (para matching)
  landing_url TEXT,                               -- URL de destino
  traffic_source TEXT,                            -- 'google_ads' | 'facebook' | 'organic'
  utm_source TEXT,                                -- UTM parameters
  utm_medium TEXT,
  utm_campaign TEXT,

  -- CAMPOS DE MENSAJE (solo event_type IN ('message_in', 'message_out'))
  message_text TEXT,                              -- Contenido del mensaje
  message_id TEXT,                                -- ID único del proveedor (yCloud/Twilio)
  direction TEXT CHECK (direction IN ('in', 'out')), -- Redundante con event_type pero útil
  provider_event_type TEXT,                       -- Ej: 'whatsapp.inbound_message.received'

  -- METADATA
  payload_raw JSONB,                              -- Payload completo del webhook (auditoría)
  processed_at TIMESTAMPTZ,                       -- NULL = pendiente de procesar
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices críticos para performance
CREATE INDEX idx_events_project_phone_ts ON events(project_id, phone_e164, ts DESC);
CREATE INDEX idx_events_project_type_unprocessed ON events(project_id, event_type, processed_at)
  WHERE processed_at IS NULL;
CREATE INDEX idx_events_click_id_hash ON events(click_id_hash) WHERE click_id_hash IS NOT NULL;
CREATE INDEX idx_events_phone_ts ON events(phone_e164, ts DESC);
CREATE INDEX idx_events_message_id ON events(message_id) WHERE message_id IS NOT NULL;

-- Particionamiento por fecha (opcional para >1M eventos)
-- CREATE TABLE events_2025_01 PARTITION OF events FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### **Ejemplos de registros:**

**Evento CLICK:**
```sql
INSERT INTO events (
  event_id, project_id, event_type, phone_e164, ts,
  click_id, click_id_type, click_id_hash, landing_url, traffic_source
) VALUES (
  'abc123...', 'lucilu', 'click', '+573142856021', '2025-01-15 10:30:00+00',
  'Cj0KCQiA...', 'gclid', 'sha256hash...', 'https://lucilu.com/desayunos', 'google_ads'
);
```

**Evento MESSAGE_IN:**
```sql
INSERT INTO events (
  event_id, project_id, event_type, phone_e164, ts,
  message_text, message_id, direction, provider_event_type
) VALUES (
  'def456...', 'lucilu', 'message_in', '+573142856021', '2025-01-15 10:35:00+00',
  'Hola, cuánto cuesta el desayuno?', 'wamid.ABC123', 'in', 'whatsapp.inbound_message.received'
);
```

**Evento MESSAGE_OUT:**
```sql
INSERT INTO events (
  event_id, project_id, event_type, phone_e164, ts,
  message_text, message_id, direction, provider_event_type
) VALUES (
  'ghi789...', 'lucilu', 'message_out', '+573142856021', '2025-01-15 10:36:00+00',
  'Buen día! El desayuno sorpresa cuesta $50.000. Incluye flores y chocolates.',
  'wamid.DEF456', 'out', 'whatsapp.message.updated'
);
```

---

## TABLA 3: `conversions`

**Propósito:** Conversiones clasificadas por IA (resultado del matching)

```sql
CREATE TABLE conversions (
  -- IDENTIFICACIÓN
  conversion_id TEXT PRIMARY KEY,                 -- UUID v4
  project_id TEXT NOT NULL REFERENCES clients_config(project_id),
  phone_e164 TEXT NOT NULL,                       -- Teléfono del prospecto/cliente

  -- ATRIBUCIÓN
  click_event_id TEXT REFERENCES events(event_id), -- Click atribuido (puede ser NULL si organic)
  click_id TEXT,                                  -- gclid/fbclid del click atribuido
  click_id_type TEXT,                             -- 'gclid' | 'fbclid' | NULL
  attribution_method TEXT NOT NULL                -- 'click_id_hash_match' | 'phone_match' | 'organic'
    CHECK (attribution_method IN ('click_id_hash_match', 'phone_match', 'organic')),

  -- CLASIFICACIÓN IA
  ai_label INTEGER NOT NULL CHECK (ai_label IN (1, 2, 3)), -- 1, 2, o 3
  ai_confidence DECIMAL(4,3) CHECK (ai_confidence BETWEEN 0 AND 1), -- 0.000 - 1.000
  ai_reason TEXT,                                 -- Explicación del modelo
  ai_model_used TEXT,                             -- Ej: 'gpt-4o-mini'

  -- CONVERSIÓN
  conversion_name TEXT NOT NULL,                  -- Ej: 'chat_iniciado_wa'
  conversion_value DECIMAL(10,2) NOT NULL,        -- Valor monetario
  conversion_currency TEXT DEFAULT 'USD',         -- Moneda (ISO 4217)
  conversion_time TIMESTAMPTZ NOT NULL,           -- Timestamp de la conversión

  -- DATOS PARA EXPORT
  external_attrib_id TEXT UNIQUE NOT NULL,        -- 'conv-{project_id}-{phone}-{label}' (dedupe key)

  -- AGREGACIÓN DE MENSAJES (auditoría)
  aggregated_conversation TEXT,                   -- Conversación completa enviada a IA
  message_count INTEGER,                          -- Cantidad de mensajes agregados
  first_message_ts TIMESTAMPTZ,                   -- Timestamp primer mensaje
  last_message_ts TIMESTAMPTZ,                    -- Timestamp último mensaje

  -- ESTADO DE ENVÍO
  status TEXT DEFAULT 'pending'                   -- 'pending' | 'sent_to_gads' | 'failed' | 'manual_review'
    CHECK (status IN ('pending', 'sent_to_gads', 'failed', 'manual_review')),
  sent_at TIMESTAMPTZ,                            -- Timestamp de envío exitoso
  error_message TEXT,                             -- Mensaje de error si status = 'failed'

  -- METADATA
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_conversions_project_phone ON conversions(project_id, phone_e164);
CREATE INDEX idx_conversions_external_attrib ON conversions(external_attrib_id);
CREATE INDEX idx_conversions_pending ON conversions(project_id, status) WHERE status = 'pending';
CREATE INDEX idx_conversions_click ON conversions(click_event_id) WHERE click_event_id IS NOT NULL;
CREATE INDEX idx_conversions_created ON conversions(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_conversions_updated_at
  BEFORE UPDATE ON conversions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### **Ejemplo de conversión:**

```sql
INSERT INTO conversions (
  conversion_id, project_id, phone_e164,
  click_event_id, click_id, click_id_type, attribution_method,
  ai_label, ai_confidence, ai_reason, ai_model_used,
  conversion_name, conversion_value, conversion_currency, conversion_time,
  external_attrib_id,
  aggregated_conversation, message_count, first_message_ts, last_message_ts,
  status
) VALUES (
  'conv-uuid-123',
  'lucilu',
  '+573142856021',
  'abc123...',
  'Cj0KCQiA...',
  'gclid',
  'phone_match',
  2,
  0.92,
  'Cliente pregunta precios específicos del producto',
  'gpt-4o-mini',
  'chat_iniciado_wa',
  15000.00,
  'COP',
  '2025-01-15 10:40:00+00',
  'conv-lucilu-+573142856021-2',
  E' CLIENTE:  Hola, cuánto cuesta el desayuno?\n AGENTE:  Buen día! El desayuno cuesta $50.000',
  2,
  '2025-01-15 10:35:00+00',
  '2025-01-15 10:36:00+00',
  'pending'
);
```

---

## FUNCIONES AUXILIARES

### **Función: `update_updated_at_column()`**

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### **Función: `normalize_phone_e164(TEXT)`**

```sql
CREATE OR REPLACE FUNCTION normalize_phone_e164(phone TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remover espacios, guiones, paréntesis
  phone := regexp_replace(phone, '[^0-9+]', '', 'g');

  -- Si no empieza con +, agregar + (asume internacional)
  IF phone !~ '^\+' THEN
    phone := '+' || phone;
  END IF;

  RETURN phone;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### **Función: `generate_event_id(TEXT, TEXT, TIMESTAMPTZ, TEXT)`**

```sql
CREATE OR REPLACE FUNCTION generate_event_id(
  p_project_id TEXT,
  p_phone TEXT,
  p_ts TIMESTAMPTZ,
  p_unique_data TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    digest(
      p_project_id || '|' || p_phone || '|' || p_ts::TEXT || '|' || p_unique_data,
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## ESTRATEGIA DE DEDUPE

### **1. Dedupe de CLICKS**

**Clave única:** `(project_id, phone_e164, click_id, ts)` - mismo click no se registra dos veces

**Implementación en n8n:**
```sql
INSERT INTO events (...) VALUES (...)
ON CONFLICT (event_id) DO NOTHING;
```

### **2. Dedupe de MENSAJES**

**Clave única:** `(project_id, message_id)` - mismo mensaje de yCloud no se registra dos veces

**Implementación:**
```sql
-- event_id incluye message_id en el hash
INSERT INTO events (...) VALUES (...)
ON CONFLICT (event_id) DO NOTHING;
```

### **3. Dedupe de CONVERSIONES**

**Clave única:** `external_attrib_id = conv-{project_id}-{phone}-{label}`

**Lógica:**
- Un teléfono solo puede tener 1 conversión de cada label (1, 2, 3)
- Si label mejora (2 → 3), UPDATE en lugar de INSERT

**Implementación en n8n (Workflow 3):**
```sql
INSERT INTO conversions (...) VALUES (...)
ON CONFLICT (external_attrib_id) DO UPDATE SET
  ai_label = EXCLUDED.ai_label,
  ai_confidence = EXCLUDED.ai_confidence,
  conversion_name = EXCLUDED.conversion_name,
  conversion_value = EXCLUDED.conversion_value,
  updated_at = NOW()
WHERE conversions.ai_label < EXCLUDED.ai_label; -- Solo si mejora
```

---

## QUERIES CRÍTICOS (para n8n workflows)

### **Query 1: Obtener mensajes pendientes de procesar**

```sql
SELECT
  e.event_id,
  e.project_id,
  e.phone_e164,
  e.ts,
  e.message_text,
  e.direction,
  c.prompt_template,
  c.conversion_config,
  c.openai_model,
  c.openai_temperature,
  c.openai_max_tokens,
  c.click_matching_window_days,
  c.regex_code_pattern
FROM events e
INNER JOIN clients_config c ON e.project_id = c.project_id
WHERE e.event_type IN ('message_in', 'message_out')
  AND e.processed_at IS NULL
  AND c.status = 'active'
ORDER BY e.project_id, e.phone_e164, e.ts ASC
LIMIT 1000;
```

### **Query 2: Agregar conversación por teléfono**

```sql
SELECT
  CASE
    WHEN direction = 'in' THEN ' CLIENTE:  ' || message_text
    ELSE ' AGENTE:  ' || message_text
  END as formatted_message,
  ts
FROM events
WHERE project_id = $1
  AND phone_e164 = $2
  AND event_type IN ('message_in', 'message_out')
  AND processed_at IS NULL
ORDER BY ts ASC;
```

### **Query 3: Buscar click atribuible (método 1: regex code)**

```sql
SELECT
  event_id,
  click_id,
  click_id_type,
  ts as click_ts,
  landing_url
FROM events
WHERE project_id = $1
  AND event_type = 'click'
  AND click_id_hash = $2 -- Hash del código extraído por regex
  AND ts >= NOW() - INTERVAL '$3 days' -- Ventana temporal
ORDER BY ts DESC
LIMIT 1;
```

### **Query 4: Buscar click atribuible (método 2: phone fallback)**

```sql
SELECT
  event_id,
  click_id,
  click_id_type,
  ts as click_ts,
  landing_url
FROM events
WHERE project_id = $1
  AND phone_e164 = $2
  AND event_type = 'click'
  AND ts < $3 -- Antes del primer mensaje
  AND ts >= NOW() - INTERVAL '$4 days'
ORDER BY ts DESC -- Click más reciente
LIMIT 1;
```

### **Query 5: Marcar mensajes como procesados**

```sql
UPDATE events
SET processed_at = NOW()
WHERE event_id = ANY($1::text[]); -- Array de event_ids
```

---

## CONSIDERACIONES DE ESCALABILIDAD

### **Para 80+ clientes:**

1. **Particionamiento por `project_id`** (si >10M eventos):
   ```sql
   CREATE TABLE events_lucilu PARTITION OF events FOR VALUES IN ('lucilu');
   ```

2. **Índices parciales por cliente activo:**
   ```sql
   CREATE INDEX idx_events_lucilu_unprocessed
   ON events(ts DESC)
   WHERE project_id = 'lucilu' AND processed_at IS NULL;
   ```

3. **Archivado de eventos procesados** (>90 días):
   ```sql
   CREATE TABLE events_archive (LIKE events INCLUDING ALL);

   INSERT INTO events_archive
   SELECT * FROM events
   WHERE processed_at < NOW() - INTERVAL '90 days';

   DELETE FROM events
   WHERE processed_at < NOW() - INTERVAL '90 days';
   ```

4. **Materialización de conversaciones agregadas** (si el query es lento):
   ```sql
   CREATE MATERIALIZED VIEW conversations_aggregated AS
   SELECT
     project_id,
     phone_e164,
     string_agg(
       CASE WHEN direction = 'in' THEN ' CLIENTE:  ' ELSE ' AGENTE:  ' END || message_text,
       E'\n' ORDER BY ts
     ) as conversation,
     count(*) as message_count,
     min(ts) as first_message_ts,
     max(ts) as last_message_ts
   FROM events
   WHERE event_type IN ('message_in', 'message_out')
     AND processed_at IS NULL
   GROUP BY project_id, phone_e164;

   CREATE UNIQUE INDEX ON conversations_aggregated(project_id, phone_e164);
   ```

---

## MIGRACIÓN DESDE GOOGLE SHEETS (Make)

### **Script de importación de datos históricos:**

```sql
-- Importar clicks históricos
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
  processed_at
)
SELECT
  generate_event_id('lucilu', B, C::timestamptz, A),
  'lucilu',
  'click',
  normalize_phone_e164(B),
  C::timestamptz,
  A, -- gclid
  'gclid',
  F, -- gclid_hash
  D, -- landing_url
  E, -- source
  NOW() -- Marcar como ya procesado
FROM sheets_clicks_import;

-- Importar mensajes históricos
INSERT INTO events (
  event_id,
  project_id,
  event_type,
  phone_e164,
  ts,
  message_text,
  message_id,
  direction,
  processed_at
)
SELECT
  generate_event_id('lucilu', A, D::timestamptz, E),
  'lucilu',
  CASE WHEN B = 'in' THEN 'message_in' ELSE 'message_out' END,
  normalize_phone_e164(A),
  D::timestamptz,
  C, -- text
  E, -- message_id
  B, -- direction
  NOW()
FROM sheets_messages_import;

-- Importar conversiones históricas
INSERT INTO conversions (
  conversion_id,
  project_id,
  phone_e164,
  click_id,
  click_id_type,
  ai_label,
  ai_confidence,
  ai_reason,
  conversion_name,
  conversion_value,
  conversion_currency,
  conversion_time,
  external_attrib_id,
  status
)
SELECT
  gen_random_uuid()::text,
  'lucilu',
  F, -- phone_e164
  A, -- gclid
  'gclid',
  CASE
    WHEN B LIKE '%venta%' THEN 3
    WHEN B LIKE '%iniciado%' THEN 2
    ELSE 1
  END,
  H::decimal, -- ai_confidence
  G, -- ai_reason
  B, -- conversion_name
  D::decimal, -- conversion_value
  E, -- currency
  C::timestamptz, -- conversion_time
  I, -- external_attrib_id
  'sent_to_gads'
FROM sheets_conversions_import;
```

---

## BACKUP Y DISASTER RECOVERY

### **Backup diario de Postgres:**

```bash
# En Railway CLI o cron job
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz
aws s3 cp backup_$(date +%Y%m%d).sql.gz s3://konversion-backups/
```

### **Export a Google Sheets (continuidad):**

```sql
-- Query para export diario a Sheets (ejecutado por n8n Cron)
SELECT
  click_id as "Google Click ID",
  conversion_name as "Conversion Name",
  to_char(conversion_time, 'YYYY-MM-DD HH24:MI:SS') as "Conversion Time",
  conversion_value as "Conversion Value",
  conversion_currency as "Conversion Currency",
  phone_e164,
  ai_reason,
  round(ai_confidence::numeric, 2) as ai_confidence,
  external_attrib_id
FROM conversions
WHERE project_id = 'lucilu'
  AND created_at >= CURRENT_DATE
ORDER BY conversion_time DESC;
```

---

## PRÓXIMOS PASOS

1. ✅ **Crear schema en Railway Postgres** con estos scripts
2. ✅ **Seedear `clients_config`** con Lucilu como primer cliente
3. ✅ **Importar datos históricos** de Google Sheets (opcional)
4. ✅ **Implementar Workflow 1** (Click Ingest)
5. ✅ **Implementar Workflow 2** (yCloud Ingest)
6. ✅ **Implementar Workflow 3** (Match + Score + Dispatch)

---

**Fin del documento.**
