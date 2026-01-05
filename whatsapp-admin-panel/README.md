# WhatsApp Widget Admin Panel

Panel de administración para gestionar widgets de WhatsApp multi-agente.

## 🚀 Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Firebase

El archivo `src/firebase.js` ya tiene tu configuración. Solo necesitas:

1. Ir a la consola de Firebase
2. **Firestore** → Reglas → Pegar el contenido de `firestore.rules`
3. **Authentication** → Verificar que Google esté habilitado

### 3. Desarrollo local

```bash
npm start
```

Abre [http://localhost:3000](http://localhost:3000)

### 4. Desplegar a Firebase Hosting

```bash
# Instalar Firebase CLI (solo la primera vez)
npm install -g firebase-tools

# Login
firebase login

# Inicializar (selecciona tu proyecto)
firebase init hosting

# Build y deploy
npm run build
firebase deploy --only hosting
```

## 📁 Estructura

```
src/
├── App.js          # Componente principal (todo el panel)
├── firebase.js     # Configuración de Firebase
└── index.js        # Entry point

firestore.rules     # Reglas de seguridad
firebase.json       # Config de hosting
```

## 🔧 Funcionalidades

- ✅ Login con Google
- ✅ Crear múltiples proyectos (sitios web)
- ✅ CRUD de agentes con reglas showOn/hideOn
- ✅ Configuración de mensaje, webhook, exclusiones
- ✅ Generador de código para copiar
- ✅ Vista previa del widget
- ✅ Datos persistentes en Firestore
- ✅ Tracking avanzado (GTM `whatsapp_click`, `gclid`, `project_id`)

## 🎨 Personalización

Para cambiar colores, edita las variables CSS en `App.js`:
- Verde WhatsApp: `#25D366`
- Fondo oscuro: `#0a1628`

## 📝 Licencia

MIT
