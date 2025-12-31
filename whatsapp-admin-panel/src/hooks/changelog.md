# Changelog - Hooks

Registro de cambios recientes en los Custom Hooks del WhatsApp Admin Panel.

---

## [2025-12-31] - Dashboard de Conversiones en Tiempo Real

### Added
- **`useConversions.js`**: Nuevo hook para monitoreo en tiempo real de conversiones
  - Query de Firestore con filtro por `project_id` y orden descendente por `created_at`
  - Cálculo automático de KPIs: `totalCount`, `totalValue`, `todayCount`
  - Listener `onSnapshot` para actualizaciones en tiempo real
  - Manejo robusto de múltiples formatos de timestamp (nativo, ISO string, serializado)
  - Límite de 50 conversiones más recientes
  - Logging detallado para debugging

### Changed
- **`useConfig.js`**: Refactorización de la lógica de prompt de IA
  - El prompt ahora se ensambla automáticamente en `syncClient.js`
  - Campo `aiInstructions` ahora es opcional (antes era `prompt_template`)
  - Nuevo campo `businessDescription` para describir el negocio
  - Formateo automático de teléfonos a E.164 antes de sincronizar con n8n

- **`useAgents.js`**: Mejora en formateo de teléfonos
  - Aplicación consistente de `formatPhone` para todos los números
  - Validación de formato E.164 antes de guardar en Firestore

### Fixed
- **`useConversions.js`**: Compatibilidad con timestamps de REST API
  - Solución para timestamps guardados como strings ISO desde n8n
  - Fallback para timestamps serializados (`_seconds`)
  - Prevención de errores con fechas inválidas

---

## [2025-12-30] - Automatización de Prompts de IA

### Changed
- **`useConfig.js`**: Integración con nueva lógica de `syncClient.js`
  - Eliminación de campo `prompt_template` manual
  - Nuevo campo `businessDescription` para contexto del negocio
  - Campo `aiInstructions` ahora es opcional
  - Sincronización automática de configuración de conversiones con criterios de clasificación

### Added
- Soporte para configuración avanzada de conversiones:
  - `criteria`: Criterios de clasificación por conversión
  - `prioritizeDynamic`: Flag para priorizar valores detectados por IA

---

## [2025-12-29] - Formateo de Teléfonos

### Changed
- **`useAgents.js`**: Formateo consistente de números de teléfono
  - Aplicación de `formatPhone` de `syncClient.js`
  - Normalización a formato E.164 (+57...)
  - Eliminación de espacios y caracteres especiales

- **`useConfig.js`**: Formateo de `primaryPhone`
  - Aplicación de `formatPhone` antes de guardar
  - Validación de formato E.164

---

## [2025-12-28] - Sincronización con n8n

### Added
- **`useConfig.js`**: Integración con Workflow 0 de n8n
  - Llamada a `syncClientConfig()` después de guardar en Firestore
  - Sincronización de configuración a tabla `clients_config` en PostgreSQL
  - Manejo de errores de sincronización con logs detallados

---

## Notas Técnicas

### Índices de Firestore Requeridos
Para que `useConversions.js` funcione correctamente, se requiere un **índice compuesto** en Firestore:
- Colección: `conversions`
- Campos:
  1. `project_id` (Ascending)
  2. `created_at` (Descending)

El índice se crea automáticamente al hacer clic en el link del error de consola.

### Dependencias
- Firebase SDK v9+ (modular)
- `utils/syncClient.js` para sincronización con n8n
- `firebase.js` para configuración de Firestore

### Breaking Changes
Ninguno. Todos los cambios son retrocompatibles.
