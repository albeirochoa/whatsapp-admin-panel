# Changelog - WhatsApp Admin Panel

Historial de cambios y mejoras implementadas en la lógica de configuración y UX.

## [2025-12-30] - Automatización de Prompt y UX Premium

### ✨ Funcionalidades Nuevas
- **Prompt Automático (IA Prompting)**: Se eliminó la obligación de escribir prompts técnicos. El sistema ahora ensambla el prompt final inyectando automáticamente instrucciones de formato JSON, extracción de emails y valores dinámicos.
- **Descripción de Negocio**: Nuevo campo en `ConfigSection` para proporcionar contexto a la IA de forma sencilla.
- **Criterios por Label**: Cada conversión ahora tiene su propio espacio de texto para definir escenarios específicos de clasificación.
- **Captura de Email**: Instrucción de sistema añadida para extraer `lead_email` del chat sin configuración manual.
- **Valor Dinámico**: Opción de priorizar el valor detectado por la IA en la conversación sobre el valor fijo de respaldo.

### 🎨 Mejoras de UX
- **Acordeón en Conversiones**: Las conversiones ahora usan un componente desplegable para ahorrar espacio vertical.
- **Diseño Modernizado**: Actualización de tipografía, colores y badges (badge `✨ Automatizado`) para una sensación más premium.
- **Validación de Teléfonos**: Limpieza automática de espacios y prefijo `+` obligatorio al guardar, garantizando compatibilidad con los flujos de n8n.

### 🔧 Ajustes Técnicos
- **Refactor `syncClient.js`**: Implementación de la función `formatPhone` y lógica de ensamblado de `prompt_template` dinámico.
- **Robustez en n8n**: Corregido error de timestamp nulo en `Workflow 2 - yCloud Ingest` implementando múltiples fallbacks para el campo `ts` y mejorando la normalización de teléfonos.
- **Despliegue Firebase**: Sincronización completa del frontend con Firebase Hosting y Firestore.

### 🐞 Correcciones
- Solucionado problema de sobre-atribución en Workflow 3 mediante ajuste de SQL.
- Corregido error de formato en teléfonos que impedía el funcionamiento correcto del Workflow 2.
