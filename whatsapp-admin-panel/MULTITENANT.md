# Sistema Multi-Tenant - WhatsApp Admin Panel

## Resumen

Sistema completo de SaaS multi-tenant con roles, planes de suscripción y límites por usuario.

---

## Características Implementadas

### ✅ Sistema de Roles
- **Super Admin**: Gestión completa de usuarios y sistema
- **Admin**: Gestión de cuenta propia
- **Client**: Usuario estándar con límites de plan

### ✅ Planes de Suscripción

| Plan | Precio | Proyectos | Agentes | Leads/mes |
|------|--------|-----------|---------|-----------|
| **Free** | $0 | 1 | 2 | 100 |
| **Starter** | $29 | 3 | 10 | 1,000 |
| **Pro** | $79 | 10 | 50 | 10,000 |
| **Enterprise** | $199 | ∞ | ∞ | ∞ |

### ✅ Sistema de Límites
- Validación automática antes de crear proyectos/agentes
- Actualización de contadores en tiempo real
- Notificaciones al acercarse al límite
- Mensajes de error descriptivos

### ✅ Página de Registro Público
- Selección de plan antes de registrarse
- Diseño atractivo con cards de planes
- Badges para resaltar el plan recomendado
- Integración con autenticación Google

### ✅ Dashboard de Super Admin
- Estadísticas globales del sistema
- Gestión de usuarios (CRUD completo)
- Cambio de roles en tiempo real
- Cambio de planes para usuarios
- Vista de distribución de planes

---

## Estructura de Base de Datos Firestore

```
users/
  {userId}/
    - email: string
    - displayName: string
    - photoURL: string
    - role: "super_admin" | "admin" | "client"
    - plan: "free" | "starter" | "pro" | "enterprise"
    - createdAt: timestamp
    - subscription:
        - plan: string
        - status: "active" | "inactive"
        - startDate: timestamp
        - limits:
            - projects: number
            - agents: number
            - monthlyLeads: number
    - usage:
        - projects: number
        - agents: number
        - monthlyLeads: number

    projects/
      {projectId}/
        - name: string
        - createdAt: timestamp
        - config: object

        agents/
          {agentId}/
            - name: string
            - role: string
            - phone: string
            - photo: string
            - showOn: array
            - hideOn: array
```

---

## Archivos Nuevos Creados

### 📁 Constants
```
src/constants/
  └── plans.js          # Definición de planes, roles y permisos
```

### 📁 Contexts
```
src/contexts/
  ├── AuthContext.jsx   # Autenticación (actualizado con soporte de planes)
  └── UserContext.jsx   # Gestión de usuario y roles
```

### 📁 Components
```
src/components/
  ├── PublicRegistration.jsx    # Página de registro público
  ├── SuperAdminDashboard.jsx   # Dashboard de super admin
  ├── PlanLimitsBanner.jsx      # Banner de notificación de límites
  └── Dashboard.jsx             # Dashboard actualizado con límites
```

### 📁 Utils
```
src/utils/
  └── permissions.js    # Funciones de validación de permisos y límites
```

### 📁 Styles
```
src/styles/
  ├── Registration.css  # Estilos de registro
  ├── SuperAdmin.css    # Estilos de super admin
  └── MultiTenant.css   # Estilos de sistema multi-tenant
```

### 📁 Hooks (Actualizados)
```
src/hooks/
  ├── useProjects.js    # Actualizado con validación de límites
  └── useAgents.js      # Actualizado con validación de límites
```

---

## Flujo de Usuario

### 1. Nuevo Usuario
```
1. Accede a la app
2. Click en "Crear cuenta nueva"
3. Ve página de registro con planes
4. Selecciona un plan (Free por defecto)
5. Click en "Continuar con Google"
6. Se crea usuario en Firestore con:
   - role: "client"
   - plan: seleccionado
   - subscription: con límites del plan
   - usage: {projects: 0, agents: 0, monthlyLeads: 0}
7. Redirige al Dashboard
```

### 2. Usuario Existente
```
1. Accede a la app
2. Click en "Continuar con Google"
3. Carga datos de usuario desde Firestore
4. Redirige según rol:
   - super_admin → SuperAdminDashboard
   - admin/client → Dashboard normal
```

### 3. Validación de Límites
```
Cuando usuario intenta crear proyecto:
1. Hook verifica límite del plan
2. Si está en límite:
   - Retorna error
   - Muestra mensaje: "Has alcanzado el límite..."
   - No crea el proyecto
3. Si tiene espacio:
   - Crea el proyecto
   - Actualiza contador usage.projects
```

---

## Permisos y Roles

### Super Admin
```javascript
PERMISOS:
- MANAGE_ALL_USERS      // Gestionar todos los usuarios
- MANAGE_PLANS          // Cambiar planes de usuarios
- VIEW_ANALYTICS        // Ver analíticas globales
- MANAGE_OWN_ACCOUNT    // Gestionar su cuenta
- CREATE_PROJECTS       // Crear proyectos (ilimitado)
- CREATE_AGENTS         // Crear agentes (ilimitado)
- VIEW_CODE             // Ver código del widget

ACCESO:
- SuperAdminDashboard
- Tabla de usuarios
- Cambio de roles
- Cambio de planes
```

### Admin / Client
```javascript
PERMISOS:
- MANAGE_OWN_ACCOUNT    // Gestionar su cuenta
- CREATE_PROJECTS       // Crear proyectos (con límites)
- CREATE_AGENTS         // Crear agentes (con límites)
- VIEW_CODE             // Ver código del widget

ACCESO:
- Dashboard normal
- Sus propios proyectos
- Sus propios agentes
- Sujeto a límites de plan
```

---

## Validación de Límites

### En useProjects.js
```javascript
const createProject = async (name) => {
  // Verificar límite
  const userPlan = userData.subscription?.plan || 'free';
  if (!canCreateProject(userData.role, projects.length, userPlan)) {
    return {
      success: false,
      error: 'Has alcanzado el límite de proyectos de tu plan.'
    };
  }

  // Crear proyecto...
};
```

### En useAgents.js
```javascript
const saveAgent = async (agentForm, editingAgent) => {
  // Solo validar para nuevos agentes
  if (!editingAgent) {
    const userPlan = userData.subscription?.plan || 'free';
    if (!canCreateAgent(userData.role, agents.length, userPlan)) {
      return {
        success: false,
        error: 'Has alcanzado el límite de agentes de tu plan.'
      };
    }
  }

  // Guardar agente...
};
```

---

## Super Admin Dashboard

### Estadísticas Globales
```
┌─────────────────┬─────────────────┬─────────────────┐
│  👥 Usuarios    │  🌐 Proyectos   │  👤 Agentes     │
│     245         │      892        │     3,421       │
└─────────────────┴─────────────────┴─────────────────┘

📊 Distribución de Planes:
FREE: 120
STARTER: 80
PRO: 35
ENTERPRISE: 10
```

### Tabla de Usuarios
```
Usuario    Email         Rol      Plan      Proyectos  Agentes  Registro
----------------------------------------------------------------------
Juan P.    juan@...     Client   Pro           8/10      35/50   12/01/25
María G.   maria@...    Client   Starter       2/3        7/10   10/01/25
...
```

### Acciones Disponibles
- Cambiar rol de usuario (dropdown)
- Cambiar plan de usuario (dropdown)
- Eliminar usuario (con confirmación)
- Auto-actualización en tiempo real

---

## Cómo Usar

### Ejecutar la App
```bash
cd whatsapp-admin-panel
npm install
npm start
```

### Configurar Primer Super Admin

**Método 1: Manualmente en Firestore**
1. Abre Firebase Console
2. Ve a Firestore Database
3. Navega a `users/{tu-uid}`
4. Edita el documento:
   ```json
   {
     "role": "super_admin"
   }
   ```

**Método 2: Por Código (una sola vez)**
```javascript
// En UserContext.jsx, temporalmente:
const newUser = {
  // ...otros campos
  role: ROLES.SUPER_ADMIN,  // En lugar de ROLES.CLIENT
  plan: 'enterprise'
};
```

---

## Banner de Límites

### Estados del Banner

#### ⚠️ Crítico (100% o más)
```
⚠️ Límite alcanzado
Plan FREE: 1/1 proyectos, 2/2 agentes
[Actualizar Plan]
```

#### 📊 Advertencia (80-99%)
```
📊 Cerca del límite
Plan STARTER: 2/3 proyectos, 9/10 agentes
[Actualizar Plan]
```

#### (Sin banner si < 80%)

---

## Actualización de App.js

### Versión Original vs Multi-Tenant

**Antes:**
```javascript
function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <AppContent />
      </div>
    </AuthProvider>
  );
}
```

**Ahora:**
```javascript
function App() {
  return (
    <AuthProvider>
      {({ user }) => (
        <UserProvider firebaseUser={user}>
          <div className="app-container">
            <AppContent />
          </div>
        </UserProvider>
      )}
    </AuthProvider>
  );
}
```

---

## Testing

### Crear Usuario de Prueba

1. **Usuario Free**
   - Registrarse con plan Free
   - Intentar crear 2 proyectos (debería fallar)
   - Intentar crear 3 agentes (debería fallar)

2. **Usuario Pro**
   - Cambiar plan a Pro desde Super Admin
   - Verificar puede crear hasta 10 proyectos
   - Verificar puede crear hasta 50 agentes

3. **Super Admin**
   - Cambiar rol a super_admin
   - Acceder a SuperAdminDashboard
   - Gestionar usuarios

---

## Próximas Mejoras

### 📋 Pendientes
1. **Integración de Pagos**
   - Stripe / PayPal
   - Actualización automática de plan

2. **Analytics**
   - Tracking de leads reales
   - Gráficas de uso
   - Exportación de datos

3. **Emails**
   - Bienvenida al registrarse
   - Notificación al llegar al límite
   - Recordatorio de actualización

4. **API**
   - Endpoints REST
   - Webhooks configurables
   - Rate limiting

5. **White Label** (Enterprise)
   - Logo personalizado
   - Dominio propio
   - Colores de marca

---

## Migración desde Versión Simple

Si ya tienes usuarios en la versión simple sin multi-tenant:

### Script de Migración
```javascript
// migrations/addMultiTenantFields.js
const addMultiTenantFields = async () => {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

  for (const docSnap of snapshot.docs) {
    const userData = docSnap.data();

    // Si no tiene role, asignar client
    if (!userData.role) {
      await updateDoc(docSnap.ref, {
        role: 'client',
        plan: 'free',
        subscription: {
          plan: 'free',
          status: 'active',
          startDate: new Date().toISOString(),
          limits: PLANS.FREE.limits
        },
        usage: {
          projects: 0,
          agents: 0,
          monthlyLeads: 0
        }
      });
    }
  }
};
```

---

## Archivos a Reemplazar

Para activar multi-tenant, reemplaza:

```bash
# Backup del App.js actual
cp src/App.js src/App.single-tenant.js

# Activar multi-tenant
cp src/App.multitenant.js src/App.js
```

---

## Resumen de Cambios

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Usuarios** | Sin roles | 3 roles (super_admin, admin, client) |
| **Planes** | Ninguno | 4 planes (Free, Starter, Pro, Enterprise) |
| **Límites** | Ninguno | Por plan, validados automáticamente |
| **Dashboard** | Uno solo | Diferente según rol |
| **Registro** | Login directo | Selección de plan + registro |
| **Gestión** | Autogestión | Super Admin puede gestionar todos |

---

## ✅ Estado: SISTEMA MULTI-TENANT COMPLETO

**De app simple a SaaS completo con gestión de usuarios, roles y planes** 🚀
