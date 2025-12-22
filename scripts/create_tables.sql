-- ============================================
-- SCHEMA POSTGRES - KONVERSION N8N
-- Sistema de Conversiones WhatsApp Multi-Tenant
-- Ejecutar TODO este bloque una sola vez (o las veces que quieras, es idempotente)
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
-- Configuración por cliente (multi-tenant)
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
  regex_code_pattern TEXT DEFAULT '(?:Ref:\s*#|Código:\s*)([A-Z0-9]{5})',
  click_matching_window_days INTEGER DEFAULT 60,
  message_limit_per_conversation INTEGER DEFAULT 100,

  -- Metadata
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices (idempotentes)
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients_config(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients_config(phone_filter);

-- Trigger updated_at (idempotente)
DROP TRIGGER IF EXISTS update_clients_config_updated_at ON clients_config;

CREATE TRIGGER update_clients_config_updated_at
  BEFORE UPDATE ON clients_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA 2: events
-- Registro unificado de clicks y mensajes
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

-- Índices críticos (idempotentes)
CREATE INDEX IF NOT EXISTS idx_events_project_phone_ts ON events(project_id, phone_e164, ts DESC);

CREATE INDEX IF NOT EXISTS idx_events_project_type_unprocessed ON events(project_id, event_type, processed_at)
  WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_events_click_id_hash ON events(click_id_hash)
  WHERE click_id_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_phone_ts ON events(phone_e164, ts DESC);

CREATE INDEX IF NOT EXISTS idx_events_message_id ON events(message_id)
  WHERE message_id IS NOT NULL;

-- ============================================
-- TABLA 3: conversions
-- Conversiones clasificadas por IA
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

-- Índices (idempotentes)
CREATE INDEX IF NOT EXISTS idx_conversions_project_phone ON conversions(project_id, phone_e164);
CREATE INDEX IF NOT EXISTS idx_conversions_external_attrib ON conversions(external_attrib_id);
CREATE INDEX IF NOT EXISTS idx_conversions_pending ON conversions(project_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_conversions_click ON conversions(click_event_id) WHERE click_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversions_created ON conversions(created_at DESC);

-- Trigger updated_at (idempotente)
DROP TRIGGER IF EXISTS update_conversions_updated_at ON conversions;

CREATE TRIGGER update_conversions_updated_at
  BEFORE UPDATE ON conversions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED: Cliente de prueba (ajusta tus datos)
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
  'konversion-web',
  'Konversion - Sistema de Conversiones',
  'active',
  '+573115810311',  -- ⚠️ CAMBIAR por tu número de WhatsApp Business
  '1lvM3HHcbfv1hWpatJUs5QvITS4QsQB7SXUIfm9ERCSI',  -- Tu Sheet actual
  'Eres un asistente que clasifica conversaciones de WhatsApp para un negocio de marketing digital.

Tu tarea: analizar la conversación completa (mensajes del Cliente y del Vendedor) y clasificarla en uno de estos 3 niveles:

**Label 1 - No Calificado (value: 0):**
- Solo saludos sin preguntas específicas
- Consultas muy generales sin intención clara
- Conversación no avanza

**Label 2 - Lead Calificado (value: 15):**
- Pregunta precios específicos de servicios
- Consulta disponibilidad u horarios
- Muestra interés claro pero no confirma compra

**Label 3 - Venta Confirmada (value: 100):**
- Confirma compra explícitamente
- Proporciona datos de pago o información de contacto
- Dice "lo llevo", "lo quiero", "confirmo"

IMPORTANTE: Debes responder SOLO con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks.

Formato de respuesta:
{
  "label": 1,
  "value": 0,
  "confidence": 0.95,
  "reason": "Breve explicación de por qué asignaste este label"
}',
  '{
    "1": {"name": "clic_boton_wa", "value": 0, "currency": "USD"},
    "2": {"name": "chat_iniciado_wa", "value": 15, "currency": "USD"},
    "3": {"name": "venta_confirmada_wa", "value": 100, "currency": "USD"}
  }'::jsonb
)
ON CONFLICT (project_id) DO NOTHING;