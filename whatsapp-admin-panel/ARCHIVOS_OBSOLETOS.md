# Archivos Obsoletos - Para Eliminar

Este documento lista todos los archivos que ya no se usan en la aplicación y pueden ser eliminados de forma segura.

## ❌ Archivos a Eliminar

### Backups y versiones antiguas de App.js
Estos son backups de versiones anteriores que ya no se necesitan:

```
src/App.backup.js
src/App.multitenant.js
src/App.new.js
src/App.single-tenant.backup.js
```

**Razón:** Solo se usa `src/App.js` actualmente.

---

### Componentes duplicados/backups

```
src/components/Dashboard.original.jsx
```

**Razón:** Solo se usa `src/components/Dashboard.jsx`.

---

### Utilidades obsoletas

```
src/utils/widgetCodeGenerator.js
src/utils/trackingUtils.js
```

**Razón:**
- `widgetCodeGenerator.js` fue reemplazado por `widgetCodeGenerator.optimized.js`
- `trackingUtils.js` nunca se usa - el tracking está embebido en el widget generado

---

### Contextos no utilizados

```
src/contexts/UserContext.jsx
```

**Razón:** Solo se usa `AuthContext.jsx` para autenticación.

---

### Componentes no utilizados

```
src/components/PlanLimitsBanner.jsx
src/components/SuperAdminDashboard.jsx
src/components/PublicRegistration.jsx
```

**Razón:**
- `PlanLimitsBanner.jsx` - No hay sistema de planes implementado
- `SuperAdminDashboard.jsx` - No hay rol super admin implementado
- `PublicRegistration.jsx` - No hay registro público (solo Google Auth)

---

## ✅ Archivos que SÍ se deben conservar

### Core de la aplicación
```
src/App.js
src/index.js
src/firebase.js
```

### Componentes activos
```
src/components/Dashboard.jsx
src/components/Header.jsx
src/components/Icons.jsx
src/components/LoginScreen.jsx
src/components/Sidebar.jsx
src/components/modals/AgentModal.jsx
src/components/modals/ProjectModal.jsx
src/components/sections/AgentsSection.jsx
src/components/sections/CodeSection.jsx
src/components/sections/ConfigSection.jsx
src/components/sections/PreviewSection.jsx
```

### Hooks personalizados
```
src/hooks/useAgents.js
src/hooks/useConfig.js
src/hooks/useProjects.js
```

### Contextos
```
src/contexts/AuthContext.jsx
```

### Utilidades activas
```
src/utils/permissions.js
src/utils/staticJsonPublisher.js
src/utils/syncClient.js
src/utils/widgetCodeGenerator.optimized.js  ← Snippet largo (embebido)
src/utils/widgetJsGenerator.js              ← Snippet corto (Storage)
```

### Constantes
```
src/constants/plans.js
```

---

## 📋 Comando para eliminar archivos obsoletos

```bash
cd whatsapp-admin-panel/src

# Eliminar backups de App.js
rm App.backup.js App.multitenant.js App.new.js App.single-tenant.backup.js

# Eliminar componente duplicado
rm components/Dashboard.original.jsx

# Eliminar utilidades obsoletas
rm utils/widgetCodeGenerator.js utils/trackingUtils.js

# Eliminar contexto no usado
rm contexts/UserContext.jsx

# Eliminar componentes no utilizados
rm components/PlanLimitsBanner.jsx components/SuperAdminDashboard.jsx components/PublicRegistration.jsx
```

---

## 📊 Resumen

| Tipo | Obsoletos | Activos |
|------|-----------|---------|
| App.js variants | 4 | 1 |
| Componentes | 4 | 11 |
| Hooks | 0 | 3 |
| Contextos | 1 | 1 |
| Utilidades | 2 | 5 |
| **TOTAL** | **11** | **21** |

**Ahorro de espacio estimado:** ~100 KB de código sin usar
