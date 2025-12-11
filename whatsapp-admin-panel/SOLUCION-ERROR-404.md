# 🔧 Solución Error 404 - Widget de WhatsApp

## ❌ Error que estás viendo:

```
GET https://firebasestorage.googleapis.com/.../widgets%2F...%2F....json?alt=media 404 (Not Found)
Widget no disponible: Error: Config not found
```

---

## ✅ Solución Completa (5 Pasos)

### PASO 1: Configurar Firebase Storage Rules (CRÍTICO)

**1.1 Abrir Firebase Console:**
- Ve a: https://console.firebase.google.com
- Selecciona: **whatsapp-widget-admin**
- Click: **Storage** → **Rules**

**1.2 Copiar estas reglas:**

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    // Carpeta /widgets - LECTURA PÚBLICA
    match /widgets/{userId}/{projectId}.json {
      allow read: if true;  // Lectura pública
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Resto - Privado
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**1.3 Publicar:**
- Click **"Publicar"** (botón azul)
- ✅ Confirmar

---

### PASO 2: Actualizar el Código en el Panel

**Acabo de actualizar el archivo CodeSection.jsx para usar el generador optimizado.**

**2.1 Reiniciar la aplicación:**

```bash
# Detén el servidor (Ctrl + C)
npm start
```

**2.2 Hacer hard refresh en el navegador:**
- Presiona: **Ctrl + Shift + R**

---

### PASO 3: Guardar y Publicar la Configuración

**3.1 En el panel de admin:**
1. **Login** con Google
2. **Selecciona** el proyecto: `gZp77xF31rwW78lnwQfa`
3. Ve a **"Configuración General"**

**3.2 Configura los datos:**
- **Mensaje predeterminado:** (Ej: "¡Hola! 👋 Me gustaría obtener más información.")
- **Webhook URL:** (Opcional - para Make/n8n)
- **Páginas a excluir:** (Ej: "/checkout, /gracias")
- **Delay:** 2000 ms (o el que prefieras)
- **Solo móvil:** No (o Sí, según necesites)

**3.3 Guardar:**
- Click en **"Guardar y Publicar Widget 🚀"**
- Debes ver:
  - ⏳ "🚀 Publicando widget..."
  - ✅ "Configuración guardada y widget publicado ✅"

---

### PASO 4: Agregar Agentes

**4.1 En la sección "Agentes de WhatsApp":**
- Click **"Agregar Agente +"**

**4.2 Completar datos:**
- **Nombre:** (Ej: "Pedro García")
- **Rol:** (Ej: "Ventas" o "Soporte")
- **Teléfono:** Formato E.164 (Ej: 573001234567)
  - ⚠️ **SIN espacios, SIN guiones, SIN +**
  - 57 = Código de Colombia
  - 300 = Operador
  - 1234567 = Número
- **Foto URL:** (Opcional - URL de imagen)
- **Mostrar en:** (Opcional - URLs donde mostrar este agente)
- **Ocultar en:** (Opcional - URLs donde NO mostrar)

**4.3 Guardar:**
- Click **"Guardar"**

**4.4 Repetir para más agentes si necesitas**

**4.5 Publicar cambios:**
- Ve a **"Configuración General"**
- Click **"Guardar y Publicar Widget 🚀"** otra vez

---

### PASO 5: Verificar que el JSON Existe

**5.1 Abrir el verificador:**
- Abre el archivo: `verificar-json.html` en tu navegador
- Se encuentra en: `c:\proyectos\whatsapp-admin-panel\whatsapp-admin-panel\verificar-json.html`

**5.2 Verificar:**
- Click en **"Verificar Ahora"**
- Debes ver: **✅ JSON Encontrado y Descargado!**

**Si ves ❌ 404:**
- Vuelve al PASO 3 y asegúrate de guardar la configuración

**Si ves ❌ 403:**
- Vuelve al PASO 1 y verifica las reglas de Storage

---

### PASO 6: Copiar el Nuevo Código del Widget

**6.1 En el panel, ve a "Código para instalar (Optimizado 🚀)"**

**6.2 Verifica que veas:**
- ✅ Código optimizado - Lee de Firebase Storage (98% menos costo)

**6.3 Click "Copiar código"**

**6.4 Reemplazar en Google Tag Manager:**

1. Abre Google Tag Manager
2. Ve a tu etiqueta del widget de WhatsApp
3. **BORRA todo el código viejo**
4. **PEGA el código nuevo** (que acabas de copiar)
5. **Guarda los cambios**
6. **Publica el contenedor** (botón "Enviar" arriba a la derecha)

---

### PASO 7: Probar el Widget

**7.1 Abrir tu sitio web:**
- Ve a la URL donde instalaste el widget
- **Hard refresh:** Ctrl + Shift + R

**7.2 Verificar:**
- El botón de WhatsApp debe aparecer después de 2 segundos (o el delay configurado)
- Al hacer clic, debe abrir WhatsApp con el mensaje

**7.3 Verificar en la consola (F12):**
- **NO debe haber errores 404**
- Debes ver una petición exitosa a `firebasestorage.googleapis.com`

---

## 🔍 Diagnóstico Rápido

### ¿Qué verificar en DevTools (F12 → Network)?

**✅ CORRECTO:**
```
https://firebasestorage.googleapis.com/.../widgets%2F...%2F....json?alt=media
Status: 200 OK
```

**❌ INCORRECTO:**
```
Status: 404 Not Found  →  No has guardado la configuración (PASO 3)
Status: 403 Forbidden  →  Reglas de Storage mal configuradas (PASO 1)
```

---

## 📊 Diferencia entre el Código Viejo y Nuevo

### ❌ Código Viejo (NO usar):
- Lee directamente de **Firestore**
- Caro: $60/mes por 10M visitas
- URL: `firestore.googleapis.com`

### ✅ Código Nuevo (USAR):
- Lee de **Firebase Storage** (JSON estático)
- Barato: $1.20/mes por 10M visitas
- URL: `firebasestorage.googleapis.com`
- **98% de ahorro** 🎉

---

## 🆘 Troubleshooting

### Problema 1: "Sigo viendo Error 404"

**Causas posibles:**
1. No guardaste la configuración → Ve al PASO 3
2. Reglas de Storage mal → Ve al PASO 1
3. Código viejo en GTM → Ve al PASO 6

**Solución:**
- Abre `verificar-json.html` y verifica si el JSON existe
- Si existe → Problema está en el código del widget
- Si no existe → Problema está en guardar configuración

---

### Problema 2: "Error 403 Forbidden"

**Causa:** Reglas de Storage no permiten lectura pública

**Solución:**
- Ve al PASO 1
- Asegúrate de que la regla tenga: `allow read: if true;`
- Click en **Publicar**

---

### Problema 3: "El botón no aparece"

**Causas posibles:**
1. La página está en la lista de exclusión
2. Solo está configurado para móvil y estás en desktop
3. No hay agentes configurados
4. El delay es muy largo

**Solución:**
- Verifica la configuración en el panel
- Agrega al menos un agente (PASO 4)
- Verifica que no hayas excluido esa página
- Reduce el delay a 1000ms para probar

---

### Problema 4: "El widget funciona pero no abre WhatsApp"

**Causa:** Número de teléfono mal formateado

**Solución:**
- Verifica que el número esté en formato E.164:
  - ✅ Correcto: `573001234567`
  - ❌ Incorrecto: `+57 300 123 4567`
  - ❌ Incorrecto: `300-123-4567`
  - ❌ Incorrecto: `(300) 123-4567`

---

## ✅ Checklist Final

Antes de probar en producción:

- [ ] Reglas de Storage publicadas (PASO 1)
- [ ] Código actualizado con generador optimizado (PASO 2)
- [ ] Configuración guardada en el panel (PASO 3)
- [ ] Al menos un agente agregado (PASO 4)
- [ ] verificar-json.html muestra ✅ (PASO 5)
- [ ] Código nuevo copiado y pegado en GTM (PASO 6)
- [ ] GTM publicado
- [ ] Widget aparece en el sitio (PASO 7)
- [ ] WhatsApp se abre correctamente
- [ ] No hay errores 404 en consola

---

## 📞 Formato del Teléfono

### Formato Correcto (E.164):

| País | Código | Operador | Número | Formato Final |
|------|--------|----------|---------|---------------|
| Colombia | 57 | 300 | 1234567 | `573001234567` |
| Colombia | 57 | 310 | 1234567 | `573101234567` |
| México | 52 | 55 | 12345678 | `525512345678` |
| España | 34 | 6 | 12345678 | `34612345678` |
| USA | 1 | 415 | 1234567 | `14151234567` |

**Reglas:**
- ✅ Solo números
- ✅ Sin espacios
- ✅ Sin guiones
- ✅ Sin paréntesis
- ✅ Sin símbolo +
- ✅ Empezar con código de país

---

## 🎯 Resumen de 30 Segundos

1. **Configurar Storage Rules** → Firebase Console → Storage → Rules → Pegar reglas → Publicar
2. **Guardar configuración** → Panel admin → Configuración General → Guardar y Publicar Widget
3. **Agregar agentes** → Agentes de WhatsApp → Agregar Agente → Guardar
4. **Verificar JSON** → Abrir verificar-json.html → Click Verificar → Ver ✅
5. **Copiar código nuevo** → Panel → Código para instalar → Copiar
6. **Pegar en GTM** → GTM → Etiqueta → Pegar código → Publicar
7. **Probar** → Abrir sitio → Ver botón → Click → WhatsApp abre ✅

---

**Última actualización:** 2025-12-11
**Versión:** 1.0
