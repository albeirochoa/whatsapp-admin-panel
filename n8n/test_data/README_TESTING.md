# 🧪 Guía de Testing - Workflows n8n Color Tapetes

## 📋 Información de Prueba

**Cliente configurado:** Color Tapetes
**Project ID:** `color-tapetes`
**Teléfono Empresa (Agente):** `+573123725256`
**Teléfono Cliente (Prueba):** `+573103069696`

---

## 🎯 Objetivo de las Pruebas

Probar el flujo completo de conversión tracking:

1. **Workflow 1:** Captura click del widget → Postgres + Sheets
2. **Workflow 2:** Captura mensajes WhatsApp → Postgres + Sheets
3. **Workflow 3:** Clasifica conversaciones con OpenAI → Postgres + Sheets

---

## 📁 Archivos de Prueba

### 1. `click_test_data.json` (3 casos)
- ✅ Click con GCLID (Google Ads)
- ✅ Click con WBRAID (iOS Safari)
- ✅ Click orgánico (sin GCLID)

### 2. `ycloud_inbound_test_data.json` (3 mensajes)
- Cliente consulta precio
- Cliente pregunta medidas
- Cliente confirma compra

### 3. `ycloud_outbound_test_data.json` (4 mensajes)
- Agente responde con precio
- Agente confirma disponibilidad
- Agente envía info de pago
- Mensaje con status='sent' (debe ser ignorado)

---

## 🚀 Cómo Ejecutar las Pruebas

### Paso 1: Obtener URLs de Webhook

Ve a n8n y obtén los webhook paths:

**Workflow 1 - Click Ingest:**
1. Abre "Workflow 1 - Click Ingest"
2. Click en nodo "Webhook"
3. Copia el Production URL
4. Formato: `/webhook/[UUID]/click/:project_id`

**Workflow 2 - Message Ingest:**
1. Abre "Workflow 2 - yCloud Ingest"
2. Click en nodo "Webhook"
3. Copia el Production URL
4. Formato: `/webhook/[UUID]/ycloud/:project_id`

### Paso 2: Actualizar Script PowerShell

Edita `test_workflows.ps1` líneas 72-73:

```powershell
$clickWebhookPath = "TU_UUID_AQUI"   # Del Workflow 1
$ycloudWebhookPath = "TU_UUID_AQUI"  # Del Workflow 2
```

### Paso 3: Ejecutar Script

Abre PowerShell en la carpeta `n8n/`:

```powershell
cd c:\proyectos\whatsapp-admin-panel\n8n
.\test_workflows.ps1
```

**Salida esperada:**
```
╔══════════════════════════════════════════╗
║   TEST WORKFLOWS - Color Tapetes         ║
╚══════════════════════════════════════════╝

═══════════════════════════════════════════════════
TEST 1: Click Ingest (Workflow 1)
═══════════════════════════════════════════════════
Probando: Click con GCLID
URL: https://n8n-production-ec65.up.railway.app/webhook/[UUID]/click/color-tapetes
Enviando payload...
Exito! Respuesta:
{...}

... (tests 2 y 3) ...

╔══════════════════════════════════════════╗
║   TESTS COMPLETADOS                      ║
╚══════════════════════════════════════════╝
```

---

## ✅ Verificación de Resultados

### 1. Verificar en n8n

Ve a n8n → Executions y verifica:

- **Workflow 1:** 1 ejecución exitosa (click insertado)
- **Workflow 2:** 2 ejecuciones exitosas (3 inbound + 3 outbound delivered)

### 2. Verificar en Postgres

Conecta a Railway Postgres y ejecuta:

```sql
-- Ver clicks insertados
SELECT
  event_id,
  phone_e164,
  click_id,
  click_id_hash,
  landing_url,
  created_at
FROM events
WHERE project_id = 'color-tapetes'
  AND event_type = 'click'
ORDER BY created_at DESC
LIMIT 5;

-- Ver mensajes insertados
SELECT
  event_id,
  phone_e164,
  direction,
  message_text,
  ts,
  processed_at
FROM events
WHERE project_id = 'color-tapetes'
  AND event_type IN ('message_in', 'message_out')
ORDER BY ts ASC
LIMIT 10;

-- Resultado esperado:
-- - 1 click con GCLID
-- - 3 mensajes inbound (direccion='in')
-- - 3 mensajes outbound (direccion='out')
-- - processed_at debe ser NULL (aún no procesados por Workflow 3)
```

### 3. Verificar en Google Sheets

Abre el Google Sheet de Color Tapetes:

**Hoja "chats_raw":**
- Debe tener 6 filas nuevas (3 inbound + 3 outbound)
- Columnas: phone_e164, direction, message_text, timestamp_iso, message_id

### 4. Ejecutar Workflow 3 (AI Classification)

**Opción A: Ejecutar manualmente**
1. Ve a n8n → Workflow 3
2. Click en "Test workflow"
3. Espera ~20 segundos (procesa con rate limiting)

**Opción B: Esperar trigger automático**
- Workflow 3 se ejecuta cada 5 minutos automáticamente
- Espera hasta 5 minutos

### 5. Verificar Conversión Clasificada

```sql
-- Ver conversiones generadas
SELECT
  conversion_id,
  phone_e164,
  ai_label,
  ai_confidence,
  conversion_name,
  conversion_value,
  attribution_method,
  has_click_id,
  ai_reason,
  created_at
FROM conversions
WHERE project_id = 'color-tapetes'
ORDER BY created_at DESC;

-- Resultado esperado:
-- - 1 conversión para +573103069696
-- - ai_label: 2 o 3 (Lead calificado o Venta confirmada)
-- - attribution_method: 'click_id_hash_match' o 'phone_match'
-- - conversion_value: 15000 o 85000 (según label)

-- Ver que los mensajes fueron marcados como procesados
SELECT
  event_id,
  message_text,
  processed_at
FROM events
WHERE project_id = 'color-tapetes'
  AND event_type IN ('message_in', 'message_out')
  AND processed_at IS NOT NULL;
```

**En Google Sheets - Hoja "conversions":**
- Debe tener 1 fila nueva
- Columnas: Google Click ID, Conversion Name, Conversion Time, Conversion Value, etc.

---

## 🎭 Escenarios de Prueba Cubiertos

### Escenario 1: Conversión con Atribución Google Ads
1. ✅ Usuario hace click en anuncio (GCLID capturado)
2. ✅ Usuario envía mensaje por WhatsApp
3. ✅ Agente responde
4. ✅ Conversación clasificada con atribución a Google Ads

**Resultado esperado:**
- `attribution_method: 'click_id_hash_match'`
- `click_id` presente en tabla conversions

### Escenario 2: Conversión Orgánica
1. ✅ Usuario NO hace click (o click orgánico)
2. ✅ Usuario envía mensaje directamente
3. ✅ Conversación clasificada sin atribución

**Resultado esperado:**
- `attribution_method: 'organic'`
- `click_id: NULL`

### Escenario 3: Multiagente (Futuro)
Actualmente solo soporta 1 teléfono en `phone_filter`.

---

## 🐛 Troubleshooting

### Error: "No fields - node executed, but no items were sent"

**Causa:** Loop Conversations tenía `batchSize` faltante
**Solución:** Ya corregido en Workflow 3 actualizado

### Error: "content: null" en OpenAI

**Causa:** `config.prompt_template` no llega al nodo
**Solución:** Ya corregido usando `$itemIndex` pattern

### Error: "Mensaje outbound status='sent' no debe guardarse"

**Causa:** Workflow 2 debe filtrar solo `status='delivered'`
**Verificar:** En nodo "Parse yCloud", debe tener condición:
```javascript
if (status === 'delivered') { ... }
```

### No aparecen datos en Google Sheets

1. Verificar credenciales Google Sheets en n8n
2. Verificar `sheet_spreadsheet_id` en `clients_config`
3. Verificar que la hoja existe (ej: "chats_raw", "conversions")

---

## 📊 Métricas Esperadas

**Workflow 1 - Click Ingest:**
- Tiempo ejecución: <1 segundo
- Inserts en Postgres: 1
- Filas en Sheets: 1

**Workflow 2 - Message Ingest:**
- Tiempo ejecución: <1 segundo por mensaje
- Inserts en Postgres: 6 (3 inbound + 3 outbound)
- Filas en Sheets: 6

**Workflow 3 - AI Classification:**
- Tiempo ejecución: ~20 segundos (42 items con 500ms delay + OpenAI)
- Inserts en conversions: 1
- UPDATEs en events: 6 (marca como procesados)
- Filas en Sheets conversions: 1

---

## 🎯 Próximos Pasos Después de Testing

1. ✅ **Sheets Dinámico:** Ya implementado - cada cliente usa su propio Sheet
2. ⏳ **Sync Firebase → Postgres:** Implementar webhook para crear clientes automáticamente
3. ⏳ **Multiagente:** Cambiar `phone_filter` de TEXT a TEXT[] (array)
4. ⏳ **Admin Panel:** Agregar campo "Google Sheet URL" en configuración

---

**Última actualización:** 2025-12-18
**Versión Workflow 3:** Simplificado con `$itemIndex` pattern
