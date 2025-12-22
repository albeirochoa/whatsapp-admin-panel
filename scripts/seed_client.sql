-- ============================================
-- SEED: Cliente Konversion (ejecutar después del schema)
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
  '+573115810311',
  '1lvM3HHcbfv1hWpatJUs5QvITS4QsQB7SXUIfm9ERCSI',
  'Eres un asistente que clasifica conversaciones de WhatsApp para un negocio de marketing digital.

Tu tarea: analizar la conversacion completa (mensajes del Cliente y del Vendedor) y clasificarla en uno de estos 3 niveles:

Label 1 - No Calificado (value: 0):
- Solo saludos sin preguntas especificas
- Consultas muy generales sin intencion clara
- Conversacion no avanza

Label 2 - Lead Calificado (value: 15):
- Pregunta precios especificos de servicios
- Consulta disponibilidad u horarios
- Muestra interes claro pero no confirma compra

Label 3 - Venta Confirmada (value: 100):
- Confirma compra explicitamente
- Proporciona datos de pago o informacion de contacto
- Dice "lo llevo", "lo quiero", "confirmo"

IMPORTANTE: Debes responder SOLO con un objeto JSON valido, sin texto adicional, sin markdown, sin backticks.

Formato de respuesta:
{
  "label": 1,
  "value": 0,
  "confidence": 0.95,
  "reason": "Breve explicacion de por que asignaste este label"
}',
  '{
    "1": {"name": "clic_boton_wa", "value": 0, "currency": "USD"},
    "2": {"name": "chat_iniciado_wa", "value": 15, "currency": "USD"},
    "3": {"name": "venta_confirmada_wa", "value": 100, "currency": "USD"}
  }'::jsonb
)
ON CONFLICT (project_id) DO NOTHING;

-- Verificacion
SELECT 'Cliente insertado exitosamente' as status;
SELECT project_id, client_name, status, phone_filter FROM clients_config WHERE project_id = 'konversion-web';
