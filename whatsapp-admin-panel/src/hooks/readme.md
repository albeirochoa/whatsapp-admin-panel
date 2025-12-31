# Hooks Documentation

Este directorio contiene los **Custom Hooks** del WhatsApp Admin Panel. Los hooks encapsulan la lógica de negocio y la integración con Firebase Firestore, proporcionando una capa de abstracción reutilizable para los componentes de React.

---

## 📋 Índice de Hooks

| Hook | Propósito | Dependencias |
|------|-----------|--------------|
| [`useProjects.js`](#useprojectsjs) | Gestión de proyectos (CRUD) | Firestore |
| [`useAgents.js`](#useagentsjs) | Gestión de agentes por proyecto | Firestore |
| [`useConfig.js`](#useconfigjs) | Configuración del widget y sincronización con n8n | Firestore, n8n API |
| [`useConversions.js`](#useconversionsjs) | Monitoreo en tiempo real de conversiones | Firestore |

---

## useProjects.js

### Propósito
Gestiona el ciclo de vida completo de los proyectos del usuario: creación, lectura, selección y eliminación.

### Estado Retornado
```javascript
{
  projects: Project[],           // Lista de proyectos del usuario
  selectedProject: Project | null, // Proyecto actualmente seleccionado
  setSelectedProject: (project) => void,
  createProject: (name) => Promise<void>,
  deleteProject: (id) => Promise<void>
}
```

### Estructura de Datos: Project
```javascript
{
  id: string,              // ID de Firestore
  name: string,            // Nombre del proyecto
  userId: string,          // UID del propietario
  createdAt: Timestamp,    // Fecha de creación
  status: 'active' | 'inactive'
}
```

### Integración Firestore
- **Colección**: `/projects`
- **Listener**: `onSnapshot` con filtro `where('userId', '==', user.uid)`
- **Operaciones**:
  - `addDoc`: Crear proyecto
  - `deleteDoc`: Eliminar proyecto

### Uso en Componentes
```javascript
const { projects, selectedProject, createProject, deleteProject } = useProjects(user);
```

---

## useAgents.js

### Propósito
Administra los agentes de WhatsApp asociados a un proyecto específico.

### Estado Retornado
```javascript
{
  agents: Agent[],                    // Lista de agentes del proyecto
  saveAgent: (form, editing?) => Promise<void>,
  deleteAgent: (id) => Promise<void>
}
```

### Estructura de Datos: Agent
```javascript
{
  id: string,              // ID de Firestore
  name: string,            // Nombre del agente
  phone: string,           // Teléfono en formato E.164 (+57...)
  projectId: string,       // ID del proyecto padre
  createdAt: Timestamp
}
```

### Integración Firestore
- **Colección**: `/agents`
- **Listener**: `onSnapshot` con filtro `where('projectId', '==', selectedProject.id)`
- **Operaciones**:
  - `addDoc` / `updateDoc`: Guardar agente (crea o actualiza)
  - `deleteDoc`: Eliminar agente

### Formateo de Teléfonos
El hook aplica automáticamente el formato E.164 a los números de teléfono usando la utilidad `formatPhone` de `syncClient.js`.

### Uso en Componentes
```javascript
const { agents, saveAgent, deleteAgent } = useAgents(user, selectedProject);
```

---

## useConfig.js

### Propósito
Gestiona la configuración del widget de WhatsApp y sincroniza los cambios con el backend de n8n para la clasificación de IA.

### Estado Retornado
```javascript
{
  config: Config,                  // Configuración actual
  setConfig: (config) => void,     // Actualizar estado local
  saveConfig: () => Promise<void>  // Guardar en Firestore + n8n
}
```

### Estructura de Datos: Config
```javascript
{
  // Widget UI
  primaryColor: string,
  secondaryColor: string,
  buttonText: string,
  welcomeMessage: string,
  
  // Tracking
  primaryPhone: string,            // Teléfono principal (E.164)
  
  // AI Classification
  businessDescription: string,     // Descripción del negocio
  aiInstructions: string,          // Instrucciones adicionales (opcional)
  
  // Conversions
  conversions: {
    [key: string]: {
      label: string,               // Nombre de la conversión
      value: number,               // Valor fijo (respaldo)
      criteria: string,            // Criterios de clasificación
      prioritizeDynamic: boolean   // Usar valor detectado por IA
    }
  },
  
  // Google Sheets
  spreadsheetId: string,
  sheetName: string
}
```

### Integración Firestore
- **Colección**: `/configs`
- **Documento**: `configs/{projectId}`
- **Operaciones**:
  - `getDoc`: Cargar configuración inicial
  - `setDoc`: Guardar configuración

### Sincronización con n8n
Cuando se guarda la configuración, el hook llama a `syncClientConfig()` (de `utils/syncClient.js`) que:
1. Ensambla el prompt de IA automáticamente
2. Formatea teléfonos a E.164
3. Envía payload a n8n Workflow 0 (`/sync-client`)
4. Actualiza la tabla `clients_config` en PostgreSQL

### Uso en Componentes
```javascript
const { config, setConfig, saveConfig } = useConfig(user, selectedProject);
```

---

## useConversions.js

### Propósito
Proporciona acceso en tiempo real a las conversiones registradas para un proyecto, con KPIs calculados automáticamente.

### Estado Retornado
```javascript
{
  conversions: Conversion[],  // Últimas 50 conversiones
  stats: {
    totalCount: number,       // Total de conversiones
    totalValue: number,       // Valor acumulado
    todayCount: number        // Conversiones hoy
  },
  loading: boolean
}
```

### Estructura de Datos: Conversion
```javascript
{
  id: string,                    // ID de Firestore
  project_id: string,            // ID del proyecto
  conversion_name: string,       // Nombre de la conversión (lead, sale, etc.)
  conversion_value: number,      // Valor monetario
  phone_e164: string,            // Teléfono del lead
  lead_email: string,            // Email detectado por IA
  lead_name: string,             // Nombre detectado por IA
  ai_reason: string,             // Razón de la clasificación
  ai_confidence: number,         // Confianza de la IA (0-1)
  created_at: Timestamp | string, // Fecha de conversión
  date: Date                     // Fecha parseada (para UI)
}
```

### Integración Firestore
- **Colección**: `/conversions`
- **Query**:
  ```javascript
  query(
    collection(db, 'conversions'),
    where('project_id', '==', selectedProject.id),
    orderBy('created_at', 'desc'),
    limit(50)
  )
  ```
- **Listener**: `onSnapshot` para actualizaciones en tiempo real

### Manejo de Timestamps
El hook maneja múltiples formatos de timestamp:
- **Timestamp nativo de Firestore** (`.toDate()`)
- **String ISO** (desde REST API de Firestore)
- **Timestamp serializado** (`_seconds`)

### Índice Requerido
Para que la query funcione, Firestore requiere un **índice compuesto**:
- Campo 1: `project_id` (Ascending)
- Campo 2: `created_at` (Descending)

El índice se crea automáticamente al hacer clic en el link del error de consola.

### Uso en Componentes
```javascript
const { conversions, stats, loading } = useConversions(selectedProject);
```

---

## Patrones de Diseño

### 1. **Separation of Concerns**
Los hooks separan la lógica de negocio de la UI, permitiendo que los componentes se enfoquen en el renderizado.

### 2. **Real-time Subscriptions**
Todos los hooks usan `onSnapshot` de Firestore para actualizaciones en tiempo real, eliminando la necesidad de polling manual.

### 3. **Cleanup Pattern**
Cada hook retorna una función de limpieza en el `useEffect` para desuscribirse de los listeners cuando el componente se desmonta:
```javascript
return () => unsubscribe();
```

### 4. **Error Handling**
Los hooks incluyen manejo de errores con callbacks de error en `onSnapshot`:
```javascript
onSnapshot(q, (snapshot) => { /* ... */ }, (error) => {
  console.error("Error:", error);
  setLoading(false);
});
```

### 5. **Dependency Management**
Los hooks usan `useEffect` con dependencias específicas para evitar re-renders innecesarios:
```javascript
useEffect(() => { /* ... */ }, [selectedProject?.id]);
```

---

## Ventajas de Esta Arquitectura

✅ **Reutilización**: Los hooks pueden usarse en múltiples componentes  
✅ **Testabilidad**: La lógica puede testearse independientemente de la UI  
✅ **Mantenibilidad**: Cambios en la lógica de negocio no afectan componentes  
✅ **Type Safety**: Estructuras de datos bien definidas  
✅ **Performance**: Listeners optimizados con queries específicas  

---

## Próximos Pasos

### Mejoras Potenciales
- [ ] Agregar paginación a `useConversions` para más de 50 conversiones
- [ ] Implementar caché local con `localStorage` para reducir lecturas de Firestore
- [ ] Agregar retry logic para operaciones fallidas
- [ ] Implementar optimistic updates para mejor UX
- [ ] Agregar TypeScript para type safety completo

### Nuevos Hooks Sugeridos
- `useAnalytics`: Métricas y estadísticas avanzadas
- `useExport`: Exportación de datos a CSV/Excel
- `useNotifications`: Sistema de notificaciones en tiempo real
