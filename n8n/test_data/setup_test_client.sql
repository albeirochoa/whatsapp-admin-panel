-- ============================================
-- CONFIGURACIÓN DE CLIENTE PARA TESTING
-- ============================================
-- Este script crea un cliente de prueba separado
-- para testing sin afectar datos de producción
-- ============================================

-- Insertar configuración del cliente de prueba
INSERT INTO clients_config (
  project_id,
  client_name,
  status,
  phone_filter,
  sheet_spreadsheet_id,
  sheet_messages_name,
  sheet_conversions_name,
  prompt_template,
  conversion_config,
  openai_model,
  openai_temperature,
  openai_max_tokens,
  click_matching_window_days,
  created_at,
  updated_at
) VALUES (
  'test-color-tapetes',
  'Color Tapetes - TEST',
  'active',
  '+573123725256',
  '17hhsaZJ67qeMNZxTX8RTDE-xE1Mbon_clGQfev1ZmdA',  -- Reemplazar con tu spreadsheet ID de prueba
  'chats_raw',
  'conversions',
  'Eres un clasificador de conversaciones de WhatsApp para Color Tapetes.

Analiza la conversación y clasifícala en uno de estos 3 niveles:

**Label 1 - No Calificado**: Cliente solo pregunta, no muestra interés real, abandona, o hace preguntas muy vagas.
**Label 2 - Lead Calificado**: Cliente pregunta por productos específicos, precios, medidas, disponibilidad. Muestra interés claro pero no confirma compra.
**Label 3 - Venta Confirmada**: Cliente confirma que quiere comprar, pregunta por métodos de pago, envío, o acepta la propuesta.

Responde SOLO con un JSON en este formato:
{
  "label": 1,
  "confidence": 0.85,
  "reason": "Breve explicación de por qué"
}',
  '{"1":{"name":"no_qualified","value":0,"currency":"COP"},"2":{"name":"lead_qualified","value":15000,"currency":"COP"},"3":{"name":"sale_confirmed","value":85000,"currency":"COP"}}'::jsonb,
  'gpt-4o-mini',
  0.3,
  150,
  7,
  NOW(),
  NOW()
)
ON CONFLICT (project_id) DO UPDATE SET
  client_name = EXCLUDED.client_name,
  status = EXCLUDED.status,
  phone_filter = EXCLUDED.phone_filter,
  sheet_spreadsheet_id = EXCLUDED.sheet_spreadsheet_id,
  prompt_template = EXCLUDED.prompt_template,
  conversion_config = EXCLUDED.conversion_config,
  click_matching_window_days = EXCLUDED.click_matching_window_days,
  updated_at = NOW();

-- Verificar que se creó correctamente
SELECT
  project_id,
  client_name,
  status,
  phone_filter,
  click_matching_window_days,
  created_at
FROM clients_config
WHERE project_id = 'test-color-tapetes';
