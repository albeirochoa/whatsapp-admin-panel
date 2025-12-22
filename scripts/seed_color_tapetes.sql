-- ============================================
-- SEED: Cliente color-tapetes
-- Para sistema de conversiones WhatsApp
-- ============================================

INSERT INTO clients_config (
  project_id,
  client_name,
  status,
  phone_filter,
  sheet_spreadsheet_id,
  sheet_clicks_name,
  sheet_messages_name,
  sheet_conversions_name,
  prompt_template,
  openai_model,
  openai_temperature,
  openai_max_tokens,
  conversion_config,
  click_matching_window_days,
  timezone
) VALUES (
  'color-tapetes',
  'Color Tapetes',
  'active',
  '+573226851661',
  '1lvM3HHcbfv1hWpatJUs5QvITS4QsQB7SXUIfm9ERCSI',
  'clicks',
  'chats_raw',
  'conversions',
  'Eres un asistente que clasifica conversaciones de WhatsApp para un negocio de tapetes y decoración para el hogar.

Tu tarea: analizar la conversación completa (mensajes del Cliente y del Vendedor) y clasificarla en uno de estos 3 niveles:

**Label 1 - No Calificado (value: 0):**
- Solo saludos sin preguntas específicas
- Consultas muy generales sin intención clara
- Conversación no avanza o cliente no responde

**Label 2 - Lead Calificado (value: 15000):**
- Pregunta precios específicos de tapetes
- Consulta medidas, colores o disponibilidad
- Pide catálogo o fotos adicionales
- Muestra interés claro pero no confirma compra

**Label 3 - Venta Confirmada (value: 85000):**
- Confirma compra explícitamente
- Proporciona dirección de envío
- Pregunta por métodos de pago
- Dice "lo llevo", "lo quiero", "confirmo el pedido"

IMPORTANTE: Debes responder SOLO con un objeto JSON válido, sin texto adicional, sin markdown, sin backticks.

Formato de respuesta:
{
  "label": 1,
  "value": 0,
  "confidence": 0.95,
  "reason": "Breve explicación de por qué asignaste este label"
}',
  'gpt-4o-mini',
  0.3,
  200,
  '{
    "1": {"name": "clic_boton_wa", "value": 0, "currency": "COP"},
    "2": {"name": "chat_iniciado_wa", "value": 15000, "currency": "COP"},
    "3": {"name": "venta_confirmada_wa", "value": 85000, "currency": "COP"}
  }'::jsonb,
  60,
  'America/Bogota'
)
ON CONFLICT (project_id) DO UPDATE SET
  prompt_template = EXCLUDED.prompt_template,
  openai_model = EXCLUDED.openai_model,
  openai_temperature = EXCLUDED.openai_temperature,
  openai_max_tokens = EXCLUDED.openai_max_tokens,
  conversion_config = EXCLUDED.conversion_config,
  sheet_conversions_name = EXCLUDED.sheet_conversions_name,
  click_matching_window_days = EXCLUDED.click_matching_window_days,
  timezone = EXCLUDED.timezone,
  updated_at = NOW();

-- Verificar configuración
SELECT 
  project_id, 
  client_name, 
  phone_filter,
  openai_model,
  sheet_conversions_name
FROM clients_config
WHERE project_id = 'color-tapetes';
