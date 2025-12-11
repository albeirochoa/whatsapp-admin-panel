# Firebase Storage - Reglas de Seguridad

## 🔒 Configurar Reglas para la Estrategia de JSON Estático

Para que el widget funcione correctamente, necesitas configurar las reglas de Firebase Storage.

### Paso 1: Ir a Firebase Console

1. Abre **Firebase Console**: https://console.firebase.google.com
2. Selecciona tu proyecto: **whatsapp-widget-admin**
3. Ve a **Storage** → **Rules**

### Paso 2: Reemplazar las Reglas

Copia y pega estas reglas:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    // CORRECCIÓN: Usamos {fileName} para capturar todo el nombre (ej: "proyecto123.json")
    match /widgets/{userId}/{fileName} {
      // Cualquiera puede leer (necesario para el widget público)
      allow read: if true;
      
      // Solo el usuario autenticado dueño puede escribir en su carpeta
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Resto del storage - Privado
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Paso 3: Publicar las Reglas

1. Click en **Publicar**
2. Confirma los cambios

---

## 📊 Explicación de las Reglas

### Carpeta `/widgets/{userId}/{projectId}.json`

**Lectura Pública (`allow read: if true`)**
- ✅ Permite que el widget sea descargado sin autenticación
- ✅ Esto es SEGURO porque solo contiene configuración pública
- ✅ No contiene secretos ni datos sensibles

**Escritura Protegida (`allow write: if request.auth.uid == userId`)**
- 🔒 Solo el usuario dueño puede actualizar su widget
- 🔒 Previene que otros usuarios sobrescriban archivos
- 🔒 Requiere autenticación

### Seguridad

El JSON publicado solo contiene:
```json
{
  "config": {
    "message": "¡Hola! 👋",
    "delayShow": 2000,
    "onlyMobile": false,
    "excludePages": "/checkout, /gracias"
  },
  "agents": [
    {
      "name": "Pedro",
      "role": "Ventas",
      "phone": "573001234567",
      "photo": "https://...",
      "showOn": ["/bogota"],
      "hideOn": ["/medellin"]
    }
  ]
}
```

**NO contiene:**
- ❌ Claves API
- ❌ Secretos
- ❌ Datos de usuario
- ❌ Información privada

---

## 🚀 Beneficios de Esta Estrategia

### Antes (Firestore directo)
```
Widget → Firestore Read (cada visita)
10,000 visitas = 10,000 lecturas
Límite: 50,000/día gratis
💰 Costo: Alto con escala
```

### Después (JSON Estático)
```
Widget → Storage Download (cada visita)
10,000 visitas = 10KB descargados
Límite: 1GB/día = 1,000,000 visitas
💰 Costo: Casi CERO
```

### Comparación de Costos

| Método | 100K visitas/mes | 1M visitas/mes | 10M visitas/mes |
|--------|------------------|----------------|-----------------|
| **Firestore** | $0.60 | $6.00 | $60.00 |
| **Storage** | $0.01 | $0.12 | $1.20 |
| **Ahorro** | 98% | 98% | 98% |

---

## 🧪 Probar las Reglas

Después de configurar, verifica que funcionan:

### Test 1: Lectura Pública
Abre esta URL en tu navegador (sin estar logueado):

```
https://firebasestorage.googleapis.com/v0/b/whatsapp-widget-admin.firebasestorage.app/o/widgets%2F{TU_USER_ID}%2F{PROJECT_ID}.json?alt=media
```

Deberías ver el JSON descargarse ✅

### Test 2: Escritura Protegida
Intenta subir un archivo desde una cuenta no autenticada → Debería fallar ❌

---

## 🔄 Actualización Automática

Cuando guardas la configuración en el panel:

1. **Panel Admin** ejecuta `saveConfig()`
2. Se guarda en **Firestore** (para ti)
3. Se genera un **JSON**
4. Se sube a **Storage** (público)
5. El **widget** descarga el JSON actualizado

**Tiempo de propagación:** ~5 minutos (por el cache)

---

## 📁 Estructura de Archivos en Storage

```
storage/
  widgets/
    {userId1}/
      {projectId1}.json
      {projectId2}.json
    {userId2}/
      {projectId1}.json
```

Cada usuario tiene su carpeta, cada proyecto su JSON.

---

## ⚙️ Cache Control

El JSON se sube con:
```javascript
cacheControl: 'public, max-age=300'
```

Esto significa:
- Cache de 5 minutos (300 segundos)
- Cambios se propagan en máximo 5 min
- Reduce aún más el costo

Si necesitas cambios instantáneos, reduce a `max-age=60` (1 minuto).

---

## ✅ Checklist

Antes de ir a producción:

- [ ] Reglas de Storage configuradas
- [ ] Test de lectura pública funciona
- [ ] Test de escritura protegida falla sin auth
- [ ] Widget descarga el JSON correctamente
- [ ] Cache configurado correctamente

---

## 🆘 Troubleshooting

### Error: "CORS error"
**Solución:** Agrega reglas CORS en Storage:
```bash
gsutil cors set cors.json gs://whatsapp-widget-admin.firebasestorage.app
```

Archivo `cors.json`:
```json
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

### Error: "Permission denied"
**Solución:** Verifica que las reglas estén publicadas y que la carpeta sea `/widgets`

### Error: "File not found"
**Solución:** Asegúrate de haber guardado la configuración al menos una vez

---

## 📚 Documentación Oficial

- [Firebase Storage Rules](https://firebase.google.com/docs/storage/security)
- [Firebase Storage Pricing](https://firebase.google.com/pricing)
- [Storage Best Practices](https://firebase.google.com/docs/storage/web/best-practices)
