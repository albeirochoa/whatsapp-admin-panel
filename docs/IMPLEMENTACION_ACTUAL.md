# IMPLEMENTACION ACTUAL - SISTEMA N8N + POSTGRES
**Fecha:** 2025-12-20  
**Estado:** Fase 1 y Fase 2 completadas. Fase 3 en progreso (Workflow 3 en pruebas).

---

## OBJETIVO DEL SISTEMA

Migrar el sistema de conversiones de WhatsApp de **Make + Google Sheets** a **n8n + Postgres** con clasificacion IA.

**Arquitectura final:**
```
Widget Firebase -> n8n Workflow 1 -> Postgres + Google Sheets (clicks)
                                   |
yCloud WhatsApp -> n8n Workflow 2 -> Postgres + Google Sheets (mensajes)
                                   |
              n8n Workflow 3 (cron) -> OpenAI -> conversions
```

---

## FASE 1 COMPLETADA: SETUP BASE

### 1.1 Base de Datos Postgres (Railway)
- SSL configurado en modo `Allow`
- Ignore SSL Issues: `ON`

### 1.2 Schema Postgres (actual)
Tablas principales:
- `clients_config` (configuracion multi-tenant)
- `events` (clicks + mensajes)
- `conversions` (clasificacion IA)

Archivos:
- `scripts/create_tables.sql`
- `scripts/seed_client.sql`

### 1.3 Workflow 1: Click Ingest
- Webhook recibe clicks del widget
- Inserta en `events`
- Append a Google Sheets (backup)
- Dedupe por `event_id` con `ON CONFLICT DO NOTHING`

---

## FASE 2 COMPLETADA: YCLOUD INGEST

### 2.1 Workflow 2: yCloud Message Ingest
- Webhook recibe inbound/outbound
- Inserta en `events`
- Append a Google Sheets (backup)
- Filtra por `phone_filter` y `status=active`

---

## FASE 3 EN PROGRESO: AI CLASSIFICATION (WORKFLOW 3)

**Archivo:** `n8n/Workflow 3 - AI Classification.json`  
**Estado actual:** En pruebas; flujo base funcionando con dedupe en `conversions`, pero con manejo de errores y retries pendiente.

### Cambios ya implementados en Workflow 3
- **Dedupe de conversiones:** `ON CONFLICT (external_attrib_id) DO NOTHING` evita updates innecesarios.
- **Cache de clasificaciones:** evita llamadas duplicadas a OpenAI cuando no cambia la conversacion.
- **Attribution:** guardado de `lead_attribution` y busqueda de click por `click_id_hash`.
- **Rate limiting:** pausa entre items durante el agregado de conversacion.
- **Salida a Sheets:** solo campos necesarios para evitar columnas extra.

### Ajuste aplicado
- **Parse AI Response (emparejamiento de items):** se agrega `Merge OpenAI + Convo` por posicion y el parse consume el item combinado, eliminando el error `No matched conversation`.

---

## MEJORAS DE PRODUCCION (IMPLEMENTADAS)

### Retries + manejo de errores
**Objetivo:** evitar loops infinitos cuando OpenAI o el parseo fallan.

Cambios aplicados:
- **DB (events):** columnas `retry_count INTEGER DEFAULT 0` y `error_message TEXT`.
- **Get Pending Messages:** filtra por `processed_at IS NULL` y `(retry_count IS NULL OR retry_count < 3)`.
- **Branch de error en Workflow 3:** captura fallos de OpenAI/Parse, actualiza `retry_count` + `error_message` por `event_id`, y corta reintentos tras 3.

### Ventana dinamica de atribucion
**Objetivo:** usar la configuracion por cliente.

Cambios aplicados:
- En `Find Click`, se usa `config.click_matching_window_days` para el intervalo.

---

## VERIFICACION RECOMENDADA
- Forzar error de OpenAI y verificar incremento de `retry_count`.
- Confirmar que tras 3 fallos el evento no vuelve a ser tomado.
- Verificar que `external_attrib_id` es estable por clasificacion.
- Confirmar que Google Sheets recibe solo la conversion final correcta.

---

## DOCUMENTACION RELACIONADA
- `docs/GUIA_IMPLEMENTACION.md`
- `docs/data_model.md`
- `docs/workflows_plan.md`

## INTEGRACION PANEL (FIREBASE) → N8N (PENDIENTE DE IMPLEMENTAR)
- **Workflow 0 (n8n):** Webhook POST `/sync-client` con header `x-api-key`; valida secreto y hace UPSERT en `clients_config` con el payload del panel.
- **Payload esperado:** `project_id, client_name, status, phone_filter, prompt_template, conversion_config, openai_model, openai_temperature, openai_max_tokens, click_matching_window_days, message_limit_per_conversation, sheet_spreadsheet_id, sheet_messages_name, sheet_conversions_name`.
- **Panel (hooks):**
  - `useConfig.saveConfig`: hoy guarda en Firestore y publica JSON/JS en Storage; se añadirá la llamada al webhook de sync justo después de guardar/publicar.
  - `useProjects.createProject`: al crear proyecto, disparará el registro inicial en n8n.
- **Agentes / múltiples números:** `useAgents` maneja subcolección `agents` por proyecto; cada agente tiene su propio `phone`. Para n8n se seguirá usando `phone_filter` principal en `clients_config`, pero el panel puede tener varios agentes; si se requiere soportar múltiples números en n8n, se deberá enviar la lista de `agents` y definir cómo mapearlos (por ahora, un número principal).
