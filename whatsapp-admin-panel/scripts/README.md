# Scripts de Mantenimiento de Widgets

Esta carpeta contiene scripts para actualizar y verificar widgets de forma masiva.

## 📋 Scripts disponibles

### 1. `checkWidgetVersions.js` - Verificación de versiones

**Propósito**: Verificar qué widgets tienen los últimos cambios del código base.

**Qué hace**:
- ✅ Descarga todos los archivos `.js` de Firebase Storage
- ✅ Verifica si contienen las últimas features
- ✅ Genera reporte de widgets desactualizados
- ❌ **NO modifica nada** (solo lectura)

**Cuándo usar**:
- Antes de ejecutar `updateAllWidgets.js` para ver qué necesita actualización
- Para diagnóstico cuando un cliente reporta que una feature no funciona
- Para verificar que la actualización masiva funcionó correctamente

**Uso**:
```bash
cd whatsapp-admin-panel
node scripts/checkWidgetVersions.js
```

**Ejemplo de output**:
```
🔍 ============================================
   VERIFICACIÓN DE VERSIONES DE WIDGETS
============================================

📝 Verificando features:
   - Enlaces #whatsapp
   - Construcción de mensajes
   - Tracking con project_id
   - Detección móvil/escritorio

📂 Obteniendo usuarios...
✅ Encontrados 5 usuarios

👤 Usuario: usuario1@example.com
   📁 Proyectos: 2
   📦 Proyecto: Proyecto A
      ✅ Actualizado (tiene todas las features)
   📦 Proyecto: Proyecto B
      ⚠️  DESACTUALIZADO - Falta:
         - Enlaces #whatsapp
         - Construcción de mensajes

============================================
   RESUMEN DE VERIFICACIÓN
============================================

📊 Total verificados: 10
✅ Actualizados: 7 (70%)
⚠️  Desactualizados: 3 (30%)
❌ Sin archivo .js: 0

💡 Ejecuta "node scripts/updateAllWidgets.js" para actualizarlos
```

---

### 2. `updateAllWidgets.js` - Actualización masiva

**Propósito**: Regenerar TODOS los archivos `.js` en Firebase Storage con la última versión del código base.

**Qué hace**:
- ✅ Lee todos los usuarios y proyectos de Firestore
- ✅ Regenera archivos `.json` y `.js` en Storage
- ✅ Usa la última versión de `widgetJsGenerator.js`
- ✅ Mantiene la configuración de cada proyecto (no la modifica)

**Cuándo usar**:
- Después de modificar `widgetJsGenerator.js`
- Después de modificar `widgetCodeGenerator.optimized.js`
- Cuando agregas nuevas features al widget que afectan el código generado
- Después de fixes de bugs críticos en el widget

**Uso**:
```bash
cd whatsapp-admin-panel
node scripts/updateAllWidgets.js
```

**Ejemplo de output**:
```
🚀 ============================================
   ACTUALIZACIÓN MASIVA DE WIDGETS
============================================

📝 Este script regenerará todos los archivos .js en Storage
   con la última versión del código base.

📂 Obteniendo usuarios...
✅ Encontrados 5 usuarios

👤 Usuario: usuario1@example.com
   📁 Proyectos: 2
   📦 Proyecto: Proyecto A (HMR9Z75xI0PYxEYStK1l)
      👥 Agentes: 3
      ✅ Widget actualizado
      🔗 JSON: https://firebasestorage.googleapis.com/.../HMR9Z75xI0PYxEYStK1l.json
      🔗 JS:   https://firebasestorage.googleapis.com/.../HMR9Z75xI0PYxEYStK1l.js

============================================
   RESUMEN DE ACTUALIZACIÓN
============================================

✅ Widgets actualizados: 10
❌ Errores: 0

🎉 Actualización completada
```

---

## 🔧 Configuración

Los scripts usan la configuración de Firebase del archivo `.env` (si existe) o valores por defecto.

**Variables de entorno**:
```bash
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
```

Si no están definidas, usa los valores hardcoded en el script (que debes actualizar con tu config real).

---

## 🎯 Workflow recomendado

Cuando hagas cambios al código base del widget:

1. **Modificar el código**:
   ```bash
   # Editar widgetJsGenerator.js o widgetCodeGenerator.optimized.js
   nano src/utils/widgetJsGenerator.js
   ```

2. **Commit los cambios**:
   ```bash
   git add src/utils/widgetJsGenerator.js
   git commit -m "feat: agregar nueva feature X al widget"
   ```

3. **Verificar estado actual** (opcional):
   ```bash
   node scripts/checkWidgetVersions.js
   ```

4. **Actualizar todos los widgets**:
   ```bash
   node scripts/updateAllWidgets.js
   ```

5. **Verificar que la actualización funcionó**:
   ```bash
   node scripts/checkWidgetVersions.js
   # Debería mostrar 100% actualizados
   ```

---

## 📊 Features verificadas

El script `checkWidgetVersions.js` verifica estas features:

| Feature | Pattern buscado | Desde |
|---------|----------------|-------|
| Enlaces #whatsapp | `attachLinkHandlers` | 2025-12-28 |
| Construcción de mensajes | `buildWhatsAppMessage` | 2025-12-28 |
| Tracking con project_id | `project_id:` | 2025-12-20 |
| Detección móvil/escritorio | `wa.me/` | 2025-12-28 |

Para agregar nuevas features a verificar, edita el array `FEATURES_TO_CHECK` en `checkWidgetVersions.js`.

---

## ⚠️ Precauciones

1. **Backup antes de actualizar**:
   - `updateAllWidgets.js` sobrescribe archivos en Storage
   - Asegúrate de que el código nuevo está testeado

2. **Rate limits de Firebase**:
   - Si tienes 100+ proyectos, el script puede tardar varios minutos
   - Firebase tiene límites de lectura/escritura por segundo

3. **Errores de red**:
   - Los scripts tienen retry automático
   - Si falla, puedes ejecutarlo de nuevo (es idempotente)

4. **Configuración vs Código**:
   - Los scripts **NO modifican** la configuración de los proyectos
   - Solo regeneran el código `.js` y `.json` con la misma config

---

## 🐛 Troubleshooting

### Error: "Firebase config not found"
**Solución**: Verifica que las variables de entorno estén definidas o actualiza los valores hardcoded en el script.

### Error: "Permission denied"
**Solución**: Asegúrate de tener permisos de admin en Firebase. Ejecuta con credenciales de administrador.

### Error: "Module not found"
**Solución**: Instala dependencias:
```bash
npm install
```

### El script no encuentra proyectos
**Solución**: Verifica que la estructura de Firestore sea:
```
users/{userId}/projects/{projectId}/agents/{agentId}
```

---

## 📝 Logs

Los scripts generan logs detallados en consola. Para guardar un log:

```bash
# Guardar output de verificación
node scripts/checkWidgetVersions.js > verification-report.txt 2>&1

# Guardar output de actualización
node scripts/updateAllWidgets.js > update-report.txt 2>&1
```

---

## 🔮 Próximas mejoras

Ideas para futuras versiones:

- [ ] Actualización selectiva (solo ciertos usuarios/proyectos)
- [ ] Dry-run mode (ver qué haría sin ejecutar)
- [ ] Rollback automático si falla
- [ ] Notificación por email cuando se actualiza un widget
- [ ] Versionado de widgets (historial de cambios)
- [ ] Dashboard web para ejecutar scripts sin CLI

---

## 📚 Documentación relacionada

- [CHANGELOG.md](../src/utils/CHANGELOG.md) - Historial de cambios en utils
- [README.md](../src/utils/README.md) - Documentación de archivos utils
- [ARQUITECTURA.md](../ARQUITECTURA.md) - Arquitectura completa del sistema
