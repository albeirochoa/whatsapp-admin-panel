# Changelog - n8n Workflows

Registro de los cambios y correcciones aplicadas a los flujos de n8n.

## [2025-12-31] - Mejoras de Privacidad y Estabilidad

### Workflow 3 - AI Classification [ver 2]
- **Hash de Privacidad:** Implementada generación de hashes **SHA-256** para `phone` y `email` antes de enviar datos a Google Sheets, cumpliendo con estándares de Enhanced Conversions.
- **Corrección de Schema:** Actualizado el nodo "Upsert to Sheets" para corregir el error de columnas desincronizadas (agregado campo `email_sha256`).
- **Lógica de Email:** Mejorada la extracción de `lead_email` desde la respuesta de la IA.

### Workflow 2 - yCloud Ingest [Ver 2]
- **Detección de Hashes Avanzada:** Se agregaron múltiples prefijos de detección para el hash de tracking: `Ref`, `Referencia`, `Código`, `Bono`, `Code`, `Promo`, `Ticket`.
- **Normalización de Teléfonos:** Unificada la lógica de limpieza de teléfonos para asegurar que siempre comiencen con `+` y coincidan con los filtros de `clients_config`.
- **Robustez de Timestamps:** Agregados múltiples fallbacks para capturar la fecha del mensaje (`sendTime`, `createTime`, `payload.createTime`) evitando errores de valor nulo.

## [2025-12-24] - Sincronización Inicial con Admin Panel

### Workflow 0 - Sync Client
- **Auth Validator:** Añadida validación de `x-api-key` en los headers para seguridad.
- **Mapeo Dinámico:** Configurada la recepción de `conversion_config` como objeto JSON para soportar múltiples niveles de conversión por proyecto.

### Workflow 1 - Click Ingest (Legacy/Refactor)
- Integración inicial para captura de clics directos desde el widget.

---
**Última actualización:** 2025-12-31
