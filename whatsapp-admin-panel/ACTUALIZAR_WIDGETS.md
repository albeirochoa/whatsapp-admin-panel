# Cómo Actualizar Todos los Widgets

Cuando modificas el código base del widget (`widgetJsGenerator.js`), los archivos `.js` en Firebase Storage quedan con código antiguo. Aquí te explico cómo actualizarlos de forma masiva.

## 🎯 Problema

- Modificaste `widgetJsGenerator.js` con una nueva feature
- Los archivos `.js` en Firebase Storage tienen el código viejo
- Los clientes que usan el "snippet corto" (Tag Manager) no ven la nueva feature

---

## ✅ Solución Rápida (5 minutos)

### Opción 1: Actualizar solo tus proyectos

La forma MÁS SIMPLE es actualizar solo tus propios proyectos:

1. **Abre el panel admin** en tu navegador
2. **Inicia sesión**
3. **Por cada proyecto**:
   - Click en el proyecto
   - Ve a "Configuración"
   - Click en "Guardar Configuración" (aunque no cambies nada)
   - Esto regenera el `.js` con el código actualizado ✅

**Tiempo**: ~30 segundos por proyecto

---

### Opción 2: Script desde consola (para múltiples proyectos)

Si tienes 5+ proyectos, usa este método:

#### Paso 1: Abrir DevTools

1. Abre el panel admin en tu navegador
2. **Inicia sesión normalmente**
3. Presiona **F12** para abrir DevTools
4. Ve a la pestaña **"Console"**

#### Paso 2: Pegar el script de actualización

Abre el archivo [`scripts/browser-update-widgets.js`](scripts/browser-update-widgets.js) y:

1. **Selecciona TODO** el contenido (Ctrl+A)
2. **Copia** (Ctrl+C)
3. **Pega en la consola** del navegador (Ctrl+V)
4. Presiona **Enter**

#### Paso 3: Ver el progreso

Verás algo como esto:

```
🚀 ACTUALIZACIÓN MASIVA DE WIDGETS
============================================

👤 Usuario: tu-email@example.com
📁 Actualizando tus proyectos...

📦 Total de proyectos: 5

📦 Proyecto: Proyecto A
   👥 Agentes: 3
   ✅ Widget actualizado
   🔗 JS: https://firebasestorage.googleapis.com/.../proyecto.js

📦 Proyecto: Proyecto B
   👥 Agentes: 2
   ✅ Widget actualizado
   🔗 JS: https://firebasestorage.googleapis.com/.../proyecto.js

============================================
✅ Widgets actualizados: 5
❌ Errores: 0
🎉 Actualización completada
```

**Tiempo**: ~5 segundos total para todos tus proyectos

---

## 🔍 Verificar que funcionó

### Método 1: Firebase Console

1. Ve a **Firebase Console → Storage**
2. Navega a `widgets/{userId}/{projectId}.js`
3. Click en el archivo → **Descargar**
4. Abre con editor de texto
5. Busca la feature que agregaste (ej: `attachLinkHandlers`)
6. Si está presente → ✅ Actualización exitosa

### Método 2: En el sitio del cliente

1. Abre el sitio web del cliente
2. Presiona **F12** → pestaña **"Sources"**
3. Busca el archivo `{projectId}.js` de Firebase Storage
4. Verifica que tenga el código actualizado

---

## ⚠️ Importante

### ✅ Qué SÍ hace la actualización:
- Regenera archivos `.js` y `.json` en Firebase Storage
- Usa la última versión de `widgetJsGenerator.js`
- Se aplica automáticamente a clientes con "snippet corto"

### ❌ Qué NO hace:
- NO modifica la configuración de los proyectos
- NO requiere que el cliente cambie nada en su sitio
- NO actualiza el "snippet largo" (código embebido directamente)

---

## 🆘 Troubleshooting

### "No hay usuario autenticado"

**Causa**: No iniciaste sesión en el panel.
**Solución**: Inicia sesión primero, luego ejecuta el script.

### "publishWidgetConfig is not defined"

**Causa**: El script no encuentra las funciones del panel.
**Solución**: Asegúrate de estar en la página del panel admin (no en otra pestaña).

### "Widget no se actualiza" en sitio del cliente

**Causa**: Cache del navegador o CDN.
**Solución**:
- Hard refresh: **Ctrl + Shift + R** (Chrome/Firefox)
- O espera 1 hora (tiempo de cache del `.js`)

### Los widgets se actualizaron pero clientes no ven cambios

**Posible causa**: Están usando el **"snippet largo"** (código embebido).
**Solución**: El snippet largo NO se actualiza automáticamente. Opciones:
1. Pedirles que usen el "snippet corto" (Tag Manager)
2. Enviarles el nuevo snippet largo para que lo reemplacen

---

## 💡 Workflow recomendado

Cada vez que modifiques el código del widget:

```bash
# 1. Modificar el código
code src/utils/widgetJsGenerator.js

# 2. Commit los cambios
git add src/utils/widgetJsGenerator.js
git commit -m "feat: nueva feature X en widget"
git push

# 3. Actualizar widgets (elige una opción):
   a) Manualmente desde panel (click en "Guardar" en cada proyecto)
   b) Script desde consola (pegar scripts/browser-update-widgets.js)

# 4. Verificar en un proyecto de prueba

# 5. (Opcional) Notificar clientes si hay cambios importantes
```

---

## 📚 Documentación relacionada

- [scripts/README.md](scripts/README.md) - Scripts de actualización masiva
- [src/utils/README.md](src/utils/README.md#L451) - Sección de scripts
- [src/utils/CHANGELOG.md](src/utils/CHANGELOG.md#L7) - Historial de cambios
- [scripts/browser-update-widgets.js](scripts/browser-update-widgets.js) - Script para copiar/pegar

---

## 🔮 Futuras mejoras

Ideas para automatizar aún más:

- [ ] Botón "Actualizar Todos" en el panel admin
- [ ] Webhook que actualiza automáticamente al hacer git push
- [ ] Notificaciones automáticas a clientes cuando hay updates
- [ ] Dashboard mostrando versión del widget de cada cliente
