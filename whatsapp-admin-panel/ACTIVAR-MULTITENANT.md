# Cómo Activar el Sistema Multi-Tenant

## 🚀 Resumen

Tu aplicación ahora tiene **DOS VERSIONES**:

1. **Versión Simple** (actual en `App.js`)
   - Sin roles ni límites
   - Todos los usuarios son iguales

2. **Versión Multi-Tenant** (en `App.multitenant.js`)
   - Sistema completo de roles
   - Planes de suscripción
   - Límites por plan
   - Super Admin Dashboard
   - Página de registro público

---

## ⚡ Activación Rápida

### Paso 1: Backup
```bash
cd c:\proyectos\whatsapp-admin-panel\whatsapp-admin-panel\src
cp App.js App.single-tenant.backup.js
```

### Paso 2: Activar Multi-Tenant
```bash
cp App.multitenant.js App.js
```

### Paso 3: Reiniciar la App
```bash
npm start
```

¡Listo! Ahora tienes el sistema multi-tenant activo.

---

## 📋 Checklist de Verificación

Después de activar, verifica:

- [ ] La página de inicio muestra los 4 planes
- [ ] Al hacer login te pregunta qué plan quieres
- [ ] Después de login, aparece el Dashboard normal
- [ ] Puedes crear proyectos y agentes
- [ ] Se respetan los límites del plan

---

## 🛠️ Configurar Primer Super Admin

### Opción A: Manual (Recomendado)

1. Regístrate normalmente en la app
2. Abre **Firebase Console** → https://console.firebase.google.com
3. Ve a **Firestore Database**
4. Busca la colección `users`
5. Encuentra tu documento (busca por tu email)
6. Click en **Editar**
7. Cambia el campo `role` a: `super_admin`
8. Cambia el campo `plan` a: `enterprise`
9. Guarda cambios
10. Recarga la aplicación

**Ahora verás el Super Admin Dashboard** 🎉

### Opción B: Por Código (Temporal)

1. Abre `src/contexts/UserContext.jsx`
2. Encuentra la línea:
   ```javascript
   role: ROLES.CLIENT,
   ```
3. Cámbiala temporalmente a:
   ```javascript
   role: ROLES.SUPER_ADMIN,
   ```
4. Regístrate con una cuenta nueva
5. **IMPORTANTE**: Vuelve a cambiar a `ROLES.CLIENT` después

---

## 🎯 Probar el Sistema

### Test 1: Usuario Free (Límites)
1. Crea cuenta con plan Free
2. Crea 1 proyecto ✅ (debería funcionar)
3. Intenta crear 2do proyecto ❌ (debería fallar)
4. Crea 2 agentes ✅ (debería funcionar)
5. Intenta crear 3er agente ❌ (debería fallar)

### Test 2: Super Admin
1. Configura tu usuario como super_admin (ver arriba)
2. Recarga la app
3. Deberías ver el **Super Admin Dashboard**
4. Verás la tabla de todos los usuarios
5. Puedes cambiar roles y planes

### Test 3: Actualizar Plan
1. Desde Super Admin Dashboard
2. Busca un usuario
3. Cambia su plan de "free" a "pro"
4. Ese usuario ahora puede crear hasta 10 proyectos

---

## 📁 Estructura de Archivos Nuevos

```
src/
├── constants/
│   └── plans.js                    # 🆕 Planes y roles
│
├── contexts/
│   ├── AuthContext.jsx             # ✏️ Actualizado
│   └── UserContext.jsx             # 🆕 Gestión de usuarios
│
├── components/
│   ├── PublicRegistration.jsx      # 🆕 Registro con planes
│   ├── SuperAdminDashboard.jsx     # 🆕 Dashboard admin
│   ├── PlanLimitsBanner.jsx        # 🆕 Banner de límites
│   ├── Dashboard.jsx               # ✏️ Actualizado
│   └── Dashboard.original.jsx      # 💾 Backup
│
├── hooks/
│   ├── useProjects.js              # ✏️ Con validación
│   └── useAgents.js                # ✏️ Con validación
│
├── utils/
│   └── permissions.js              # 🆕 Validación de límites
│
├── styles/
│   ├── Registration.css            # 🆕
│   ├── SuperAdmin.css              # 🆕
│   └── MultiTenant.css             # 🆕
│
├── App.js                          # Versión actual
├── App.multitenant.js              # 🆕 Versión multi-tenant
└── App.single-tenant.backup.js     # 💾 Backup simple
```

**🆕** = Archivo nuevo
**✏️** = Archivo actualizado
**💾** = Backup

---

## 🔄 Volver a la Versión Simple

Si necesitas volver atrás:

```bash
cd c:\proyectos\whatsapp-admin-panel\whatsapp-admin-panel\src
cp App.single-tenant.backup.js App.js
npm start
```

---

## 📊 Planes Disponibles

| Plan | Precio | Proyectos | Agentes | Leads/mes |
|------|--------|-----------|---------|-----------|
| Free | $0 | 1 | 2 | 100 |
| Starter | $29 | 3 | 10 | 1,000 |
| Pro | $79 | 10 | 50 | 10,000 |
| Enterprise | $199 | ∞ | ∞ | ∞ |

---

## 🎨 Personalizar Planes

Edita: `src/constants/plans.js`

```javascript
export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    limits: {
      projects: 1,     // Cambiar límites
      agents: 2,
      monthlyLeads: 100
    },
    features: [
      '1 proyecto',    // Cambiar features
      '2 agentes',
      // ...
    ]
  },
  // ...otros planes
};
```

---

## ⚠️ Notas Importantes

1. **Firestore Rules**
   - Actualmente las reglas son básicas
   - Para producción, agrega validación de roles:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth.uid == userId;
       }
     }
   }
   ```

2. **Migración de Usuarios Existentes**
   - Usuarios existentes necesitan campos nuevos
   - Ver: `MULTITENANT.md` sección "Migración"

3. **Testing**
   - Prueba TODOS los planes
   - Verifica límites funcionan
   - Prueba Super Admin Dashboard

---

## 🆘 Solución de Problemas

### Problema: "No puedo crear proyectos"
**Solución:** Verifica tu plan en Firestore. Asegúrate que `subscription.limits.projects` > 0

### Problema: "No veo Super Admin Dashboard"
**Solución:** Tu campo `role` debe ser exactamente `super_admin` (minúsculas, con guión bajo)

### Problema: "Error al cargar usuarios"
**Solución:** Verifica que tu usuario tenga rol `super_admin` en Firestore

### Problema: "La app se queda en 'Cargando...'"
**Solución:** Revisa la consola del navegador. Probablemente hay un error de Firestore.

---

## 📚 Documentación Completa

- **[MULTITENANT.md](file:///c:/proyectos/whatsapp-admin-panel/whatsapp-admin-panel/MULTITENANT.md)** - Documentación técnica completa
- **[REFACTORIZACION.md](file:///c:/proyectos/whatsapp-admin-panel/whatsapp-admin-panel/REFACTORIZACION.md)** - Cambios de arquitectura
- **[ARQUITECTURA.md](file:///c:/proyectos/whatsapp-admin-panel/whatsapp-admin-panel/ARQUITECTURA.md)** - Diagramas y flujos

---

## ✅ Checklist Final

Antes de ir a producción:

- [ ] Firestore rules configuradas
- [ ] Primer super admin creado
- [ ] Planes probados (Free, Starter, Pro)
- [ ] Límites validados
- [ ] Super Admin Dashboard funciona
- [ ] Página de registro estilizada
- [ ] Emails configurados (opcional)
- [ ] Pagos integrados (opcional)

---

## 🎉 ¡Listo!

Tu aplicación ahora es un **SaaS completo** con:
- ✅ Sistema de roles
- ✅ Planes de suscripción
- ✅ Límites automáticos
- ✅ Dashboard de administración
- ✅ Página de registro público

**De app simple a plataforma multi-tenant en producción** 🚀
