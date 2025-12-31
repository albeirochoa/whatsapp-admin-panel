# n8n Workflows Documentation - WhatsApp Admin Panel

Este directorio contiene los archivos JSON de los flujos de n8n que alimentan el sistema de automatización y clasificación de leads por IA.

## 🚀 Descripción General
El sistema utiliza n8n como motor de orquestación para procesar mensajes de WhatsApp en tiempo real, sincronizar configuraciones desde el panel de administración y realizar atribución y clasificación automática de conversiones mediante OpenAI.

---

## 📂 Flujos Principales

### 0. Workflow 0 - Sync Client
**Propósito:** Sincroniza la configuración de cada proyecto desde el Admin Panel (Firebase) hacia la base de datos PostgreSQL (`clients_config`).
- **Activación:** Webhook `POST /sync-client`.
- **Funcionamiento:** 
  1. Recibe la configuración del cliente (prompts, modelos de IA, IDs de hojas de cálculo).
  2. Valida el API Key de seguridad.
  3. Realiza un `UPSERT` en la tabla `clients_config`.
- **Relación:** Es la base de conocimiento para los demás flujos; define qué prompts y qué modelos usar para cada cliente.

### 2. Workflow 2 - yCloud Ingest [Ver 2]
**Propósito:** Punto de entrada para todos los mensajes de WhatsApp que pasan por yCloud.
- **Activación:** Webhook `POST /ycloud/:project_id`.
- **Funcionamiento:**
  1. Detecta si el mensaje es entrante (`inbound`) o saliente (`outbound`).
  2. Extrae hashes de tracking del texto del mensaje (ej: `#A7K9Q`, `Ref: #1234`).
  3. Valida que el proyecto esté activo y el teléfono del negocio coincida.
  4. Guarda el mensaje en la tabla `events` de PostgreSQL.
  5. Registra el mensaje en tiempo real en la hoja de cálculo de Google Sheets configurada (`chats_raw`).
- **Relación:** Provee la materia prima (mensajes) para el proceso de clasificación.

### 3. Workflow 3 - AI Classification [ver 2]
**Propósito:** Analiza las conversaciones pendientes, les asigna una categoría de conversión y atribuye el origen del lead.
- **Activación:** Cron programado (cada 5 minutos).
- **Funcionamiento:**
  1. Recupera mensajes no procesados de la tabla `events`.
  2. Agrupa mensajes por teléfono del cliente y proyecto.
  3. Reconstruye la conversación completa (Agente vs Cliente).
  4. **Atribución:** Busca coincidencias de Click ID mediante hashes detectados en el Workflow 2 o historial de `lead_attribution`.
  5. **IA:** Envía la conversación a OpenAI (GPT-4o/mini) usando el prompt template específico del proyecto.
  6. **Conversión:** Guarda el resultado (label, confianza, razón, valor) en la tabla `conversions`.
  7. **Mirror Real-time:** Sincroniza la conversión con **Google Cloud Firestore** (vía HTTP Request) para alimentar el Dashboard del Admin Panel en tiempo real.
  8. Actualiza Google Sheets (`conversions`) con hashes de privacidad (SHA-256 para email y teléfono).
  9. Marca los mensajes como procesados para evitar duplicidad.
- **Relación:** Genera los datos analíticos finales y permite el monitoreo en vivo desde el Dashboard.

---

## 🛠️ Relación entre Componentes

1. **Admin Panel** → Envía config a **Flujo 0** → Guarda en `clients_config`.
2. **yCloud** → Notifica mensaje a **Flujo 2** → Guarda en `events` + `chats_raw`.
3. **Flujo 3** (Cada 5 min) → Lee de `events` + `clients_config` → Clasifica con **OpenAI** → Guarda en `conversions`.
4. **Flujo 3** → Espejo a **Firestore** → **Admin Panel** (Escucha en tiempo real y muestra en Dashboard).

---

## 📊 Base de Datos (PostgreSQL)
- `clients_config`: Almacena la configuración maestra y prompts.
- `events`: Log de todos los mensajes de WhatsApp y clics previos.
- `conversions`: Resultados finales de la clasificación por IA.
- `lead_attribution`: Cache de relación entre teléfonos y Click IDs de Google.
