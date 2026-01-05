# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [2.1.0] - 2026-01-05

### ✨ Added - Mejoras de Tracking y GTM
- **Evento GTM Estándar:** Implementación del evento `whatsapp_click` para Google Tag Manager.
- **Captura de GCLID:** Mejora en la persistencia de `gclid`, `gbraid` y `wbraid` en cookies y localStorage.
- **DataLayer Integration:** El widget ahora envía automáticamente `project_id`, `agent_name`, `click_id` y otros metadatos a la dataLayer.

### 🐛 Fixed
- **ESM Module Resolution:** Corregidos errores `ERR_MODULE_NOT_FOUND` añadiendo extensiones `.js` en imports de utilidades.
- **Importaciones Circulares:** Refactorización de `staticJsonPublisher.js` para evitar recurrencia infinita.

---

## [Unreleased]

### Added
- Documentación completa del código fuente en `README.md`

---

## [2.0.0] - 2025-12-31

### ✨ Added - Migración a Material-UI (Fase 1)

#### Infraestructura
- **Material-UI 5.15** como framework UI principal
- **Tema personalizado** inspirado en Devias Kit Pro (`theme.js`)
  - Paleta de colores WhatsApp (#25D366 primary)
  - Tipografía Inter con excelente contraste
  - Componentes customizados (botones, cards, inputs)
  - Sombras sutiles y bordes redondeados

#### Componentes Migrados
- **Header** → Material-UI AppBar
  - Toolbar con logo y navegación
  - Avatar del usuario
  - Botón de logout con ícono

- **Sidebar** → Material-UI Drawer
  - Drawer permanente con lista de proyectos
  - ListItemButton con estado seleccionado
  - Botón de "Nuevo proyecto" con ícono
  - Footer slot para funciones adicionales

- **Dashboard** → Sistema de Tabs
  - **4 pestañas horizontales:**
    1. Configuración (ConfigSection + PreviewSection)
    2. Agentes (AgentsSection)
    3. **Estadísticas (MonitoringSection)** ← NUEVA PESTAÑA SEPARADA
    4. Código (CodeSection)
  - Container responsivo con máx width
  - Header de proyecto con botones de acción
  - Empty state mejorado

- **PlanLimitsBanner** → Material-UI Alert
  - AlertTitle con severidad (warning/error)
  - Botón de "Actualizar Plan" integrado
  - Mejor legibilidad del texto

- **AgentsSection** → Material-UI Cards + Grid
  - Grid responsivo (1-3 columnas)
  - Cards con Avatar circular de 56px
  - Teléfono en badge de WhatsApp green
  - Chips para reglas de visibilidad
  - IconButtons para editar/eliminar
  - Empty state con emoji y mensaje

- **ProjectModal** → Material-UI Dialog
  - DialogTitle, DialogContent, DialogActions
  - TextField con label flotante
  - Botones de acción en footer

- **AgentModal** → Material-UI Dialog con Grid
  - Grid layout de 2 columnas
  - 6 TextFields con labels y helpers
  - Modo edición con pre-fill de datos

#### Mejoras de UX/UI
- **Mejor contraste de colores:**
  - Texto primario: #111927 (casi negro)
  - Texto secundario: #6C737F (gris con buen contraste)
  - Fondo: #F9FAFB (gris muy claro)

- **Notificaciones mejoradas:**
  - Snackbar en esquina inferior derecha
  - Alert con close button
  - Auto-dismiss después de 5 segundos

- **Tipografía profesional:**
  - Fuente Inter
  - Weights de 400-700
  - Line heights optimizados
  - Letter spacing ajustado

### 🔧 Changed

#### Arquitectura
- Reorganización del Dashboard en pestañas
- MonitoringSection movido a pestaña separada "Estadísticas"
- Botones sin transformación a mayúsculas (mejor UX)
- Border radius aumentado (8-16px para mejor estética)

#### Dependencias
- Agregado `@mui/material` ^5.15.0
- Agregado `@mui/icons-material` ^5.15.0
- Agregado `@emotion/react` ^11.11.1
- Agregado `@emotion/styled` ^11.11.0

### 🐛 Fixed
- Problemas de contraste en textos sobre fondos claros
- Inconsistencias en espaciado entre componentes
- Tamaños de fuente inconsistentes
- Sombras demasiado fuertes

### 🎨 Improved
- Accesibilidad general (WCAG AA)
- Responsive design en mobile/tablet
- Feedback visual en interacciones (hover, focus, active)
- Estados de carga más claros

---

## [1.5.0] - 2025-12-24

### Added
- Sistema de variables dinámicas en mensajes (Tier 1)
- Opción de hash universal para todo el tráfico en widget
- Scripts convertidos a .mjs para mejor compatibilidad

### Changed
- Actualización de README y documentación

### Fixed
- Problemas con scripts y configuración de package.json

---

## [1.4.0] - 2025-12-20

### Added
- Dashboard de conversiones en tiempo real
- Integración con Firestore para tracking
- Hook `useConversions` para métricas en tiempo real
- KPIs visuales (Hoy, Semana, Total)

### Changed
- Mejoras en la estructura de datos de conversiones
- Optimización de queries a Firestore

---

## [1.3.0] - 2025-12-15

### Added
- Sistema multi-tenant completo
- Gestión de usuarios con roles (USER, ADMIN, SUPER_ADMIN)
- Límites por plan (FREE, STARTER, PRO)
- PlanLimitsBanner para avisos de límites

### Changed
- Separación de lógica en custom hooks
- Refactorización de AuthContext y UserContext

---

## [1.2.0] - 2025-12-10

### Added
- Integración con OpenAI para respuestas inteligentes
- Configuración de Google Sheets
- Tracking con Google Analytics y Meta Pixel
- ConversionsEditor para gestión de eventos

### Changed
- Mejoras en la generación de código del widget
- Optimización del código JavaScript generado

---

## [1.1.0] - 2025-12-05

### Added
- Sistema de agentes múltiples
- Reglas de visibilidad por URL (showOn/hideOn)
- AgentModal con validaciones
- Preview del widget

### Fixed
- Bugs en la sincronización con n8n

---

## [1.0.0] - 2025-12-01

### Added - Lanzamiento inicial
- Panel de administración con autenticación Google
- Gestión de proyectos
- Configuración básica del widget de WhatsApp
- Generación de código para integración
- Publicación estática en Firebase Storage
- Sidebar con navegación de proyectos
- ConfigSection con formularios
- Firebase Auth, Firestore y Storage

---

## Tipos de cambios

- `Added` - Nuevas funcionalidades
- `Changed` - Cambios en funcionalidades existentes
- `Deprecated` - Funcionalidades que serán removidas
- `Removed` - Funcionalidades removidas
- `Fixed` - Corrección de bugs
- `Security` - Vulnerabilidades de seguridad

---

## Próximas versiones planeadas

### [2.1.0] - Migración Fase 2 (Planeado)
- [ ] Migrar ConfigSection a MUI
- [ ] Migrar MonitoringSection (tabla) a MUI Table
- [ ] Migrar CodeSection a MUI Tabs
- [ ] Migrar LoginScreen a MUI
- [ ] Migrar PublicRegistration a MUI

### [2.2.0] - Features adicionales (Planeado)
- [ ] Dark mode toggle
- [ ] Exportación de datos de conversiones (CSV/Excel)
- [ ] Gráficos de conversiones (Charts.js o Recharts)
- [ ] Sistema de notificaciones en tiempo real
- [ ] Webhooks configurables

### [3.0.0] - Mejoras avanzadas (Futuro)
- [ ] Editor visual del widget (drag & drop)
- [ ] A/B testing de mensajes
- [ ] Múltiples idiomas (i18n)
- [ ] White-label para agencias
- [ ] API pública para integraciones

---

## Contribuyendo

Para agregar entradas al changelog:

1. **Formato de fecha:** YYYY-MM-DD
2. **Categorías:** Added, Changed, Deprecated, Removed, Fixed, Security
3. **Descripción clara:** Qué se cambió y por qué
4. **Referencias:** Link a issues/PRs cuando aplique

### Ejemplo:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- Nueva funcionalidad X (#123)
- Integración con servicio Y

### Fixed
- Bug en componente Z (#456)
```

---

## Versionado

- **MAJOR (X.0.0):** Cambios que rompen compatibilidad
- **MINOR (0.X.0):** Nuevas funcionalidades retrocompatibles
- **PATCH (0.0.X):** Correcciones de bugs retrocompatibles

---

_Última actualización: 2025-12-31_
