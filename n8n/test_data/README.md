# Guía de Pruebas - Sistema WhatsApp Admin Panel

## Configuración Inicial

### 1. Preparar Base de Datos
Ejecutar el script de configuración del cliente de prueba:
```bash
psql "postgresql://[TU_DB_URL]" -f n8n/test_data/setup_test_client.sql
```

Este script crea el cliente `test-color-tapetes` con:
- **Project ID**: `test-color-tapetes`
- **Teléfono**: `+573123725256`
- **Configuración de conversión**: Lead calificado (15000 COP), Venta confirmada (85000 COP)
- **Modelo AI**: `gpt-4o-mini`

### 2. Verificar Workflows en n8n
Asegurarse de que los siguientes workflows estén **activos**:
- **Workflow 1**: Click Ingest
- **Workflow 2**: yCloud Message Processing
- **Workflow 3**: AI Classification (puede ejecutarse manualmente o por timer)

## Ejecución de Pruebas

### Ejecutar Script de Pruebas
```powershell
cd n8n
powershell -ExecutionPolicy Bypass -File test_workflows.ps1
```

El script:
1. Carga 10 clientes de prueba desde los archivos JSON
2. Envía eventos en secuencia: Click → Inbound → Outbound
3. Espera 3 segundos entre cada petición (ver sección de problemas)
4. Muestra el estado de cada envío

### Datos de Prueba Generados
- **10 clientes** con números `+5730010000XX`
- **5 clientes con hash** en el primer mensaje (formato `#XXXXX`)
- **Variedad de fuentes**: Google Ads, Facebook Ads, Orgánico, Instagram
- **Todas las respuestas** con estado `delivered` (crítico para registro)

## Verificación de Resultados

### 1. Base de Datos
```sql
-- Verificar eventos recientes
SELECT event_type, COUNT(*) 
FROM events 
WHERE project_id = 'test-color-tapetes' 
  AND created_at > NOW() - INTERVAL '10 minutes' 
GROUP BY event_type;

-- Debe mostrar: 10 clicks, 10 message_in, 10 message_out

-- Verificar extracción de hashes
SELECT COUNT(*) 
FROM events 
WHERE project_id = 'test-color-tapetes' 
  AND event_type = 'message_in' 
  AND click_id_hash IS NOT NULL;

-- Debe mostrar: ~5 (clientes con hash en mensaje)
```

### 2. Google Sheets
Revisar la hoja `chats_raw` del spreadsheet configurado:
- Debe contener 10 filas de mensajes inbound
- Debe contener 10 filas de mensajes outbound
- Verificar que los datos coincidan con los números de teléfono

### 3. Conversiones AI
Ejecutar manualmente **Workflow 3** en n8n o esperar 5 minutos.

Verificar en la hoja `conversions`:
- Clasificaciones: `lead_qualified`, `sale_confirmed`, `no_qualified`
- Valores de conversión correctos según configuración
- Razones de clasificación coherentes

## Problemas Conocidos

### ⚠️ Google Sheets Rate Limiting (Error 429)

#### Síntoma
La hoja `chats_raw` solo recibe los primeros 5-6 clientes, aunque la base de datos tiene todos los registros.

#### Causa
Google Sheets API limita la tasa de escrituras. El Workflow 2 escribe **en tiempo real** cada mensaje individual, lo que causa:
- En pruebas rápidas: Bloqueo después de ~15 peticiones en 30 segundos
- En producción con tráfico alto: Pérdida de datos crítica

#### Solución Temporal (Pruebas)
El script `test_workflows.ps1` incluye un delay de **3 segundos** entre mensajes:
```powershell
Start-Sleep -Seconds 3
```
Esto evita el rate limit en pruebas pequeñas pero **NO es viable en producción**.

#### Solución Recomendada (Producción)

**Arquitectura Actual (Problemática)**:
```
Webhook → n8n → [Escribir DB + Escribir Sheets] (síncrono)
```

**Arquitectura Propuesta (Robusta)**:
```
1. Ingesta Rápida:
   Webhook → n8n → Solo escribir en PostgreSQL

2. Sincronización Batch (Workflow separado con Cron cada 1-5 min):
   - Leer de DB mensajes no sincronizados
   - Agrupar en lote (batch)
   - Escribir todos en una sola petición a Sheets
   - Marcar como sincronizados en DB
```

**Ventajas**:
- ✅ Cero errores 429 (1 petición cada 5 min vs 100/min)
- ✅ Webhook responde instantáneamente
- ✅ Datos seguros en DB aunque Sheets falle
- ✅ Escalable a miles de mensajes/hora

**Implementación**:
1. Modificar Workflow 2: Eliminar nodo "Append to Sheet"
2. Crear Workflow 4 (Sync to Sheets):
   - Trigger: Cron cada 5 minutos
   - Query: `SELECT * FROM events WHERE synced_to_sheets = false LIMIT 100`
   - Batch Append a Google Sheets
   - Update: `SET synced_to_sheets = true`

### ⚠️ Mensajes Outbound No Registrados

#### Síntoma
Solo aparecen mensajes inbound en `chats_raw`, las respuestas del agente no se guardan.

#### Causa
Workflow 2 filtra mensajes outbound por estado:
```javascript
if (payload.whatsappMessage.status !== 'delivered') {
    return []; // Ignora el mensaje
}
```

Si los datos de prueba usan `status: "read"` o `"sent"`, se descartan.

#### Solución
Asegurar que **todos** los mensajes outbound en `ycloud_outbound_test_data.json` tengan:
```json
"status": "delivered"
```

## Archivos de Configuración

- `click_test_data.json`: 10 eventos de click con diferentes fuentes
- `ycloud_inbound_test_data.json`: 10 mensajes entrantes (5 con hash)
- `ycloud_outbound_test_data.json`: 10 respuestas del agente (todas `delivered`)
- `setup_test_client.sql`: Configuración del cliente de prueba
- `test_workflows.ps1`: Script de ejecución automatizada

## Notas Importantes

1. **Hashes**: Deben ser exactamente 5 caracteres alfanuméricos (regex: `/#([A-Z0-9]{5})/`)
2. **Timestamps**: Usar formato ISO 8601 con zona horaria
3. **Phone Numbers**: Formato E.164 (`+573XXXXXXXXX`)
4. **Project ID**: Debe coincidir exactamente entre DB, JSON y workflows
