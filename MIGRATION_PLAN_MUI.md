# 🎨 Plan de Migración a Material-UI (MUI)

## 📋 Resumen Ejecutivo

**Objetivo:** Modernizar el look & feel del WhatsApp Admin Panel migrando de CSS vanilla a Material-UI.

**Alcance:** 17 componentes React + 1,157 líneas de CSS

**Tiempo estimado:** 4-6 semanas (trabajo incremental)

**Nivel de riesgo:** BAJO (solo cambia UI, lógica se mantiene intacta)

---

## 🎯 Mejoras Clave Incluidas

### 1. Nueva Arquitectura de Pestañas (✨ Nuevo Feature)

Antes:
```
Dashboard
├── ConfigSection
├── AgentsSection
├── MonitoringSection  ← Todo mezclado en una sola vista
├── CodeSection
└── PreviewSection
```

Después:
```
Dashboard con Tabs (MUI)
├─ [Configuración] ← ConfigSection + PreviewSection
├─ [Agentes]       ← AgentsSection
├─ [Estadísticas]  ← MonitoringSection (NUEVA PESTAÑA SEPARADA)
└─ [Código]        ← CodeSection
```

**Beneficios:**
- ✅ Mejor organización visual
- ✅ Estadísticas aisladas para análisis
- ✅ Menos scroll vertical
- ✅ Navegación más intuitiva

---

## 📦 Instalación Inicial

### Paquetes a Instalar

```bash
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
```

**Tamaño:** ~1.5 MB (comprimido)

---

## 🎨 Configuración del Tema

### Archivo Nuevo: `src/theme.js`

```javascript
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#25D366',      // WhatsApp Green
      light: '#2FE074',
      dark: '#1DA851',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#128C7E',      // WhatsApp Teal
      light: '#15A690',
      dark: '#0D6B61',
    },
    error: {
      main: '#DC3545',
    },
    warning: {
      main: '#FFA500',
    },
    info: {
      main: '#007BFF',
    },
    success: {
      main: '#25D366',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      textTransform: 'none', // Botones sin MAYÚSCULAS
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.95rem',
        },
      },
    },
  },
});
```

### Modificación: `src/App.jsx`

```javascript
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Reset CSS + estilos base MUI */}
      {/* ... resto del código */}
    </ThemeProvider>
  );
}
```

---

## 🗓️ Plan de Migración en Fases

### FASE 1: Setup + Layout Principal (Semana 1)

**Objetivo:** Infraestructura base sin romper nada

#### 1.1 Setup Inicial (30 min)

- [x] Crear branch `feature/mui-redesign`
- [x] Instalar paquetes MUI
- [x] Crear `src/theme.js`
- [x] Agregar `ThemeProvider` a `App.jsx`
- [x] Commit: "chore: setup Material-UI dependencies and theme"

#### 1.2 Migrar Header.jsx → MUI AppBar (1 hora)

**Antes:**
```jsx
<header className="header">
  <div className="header-left">
    <img src={logo} alt="Logo" className="header-logo" />
    <span className="header-title">WhatsApp Admin Panel</span>
  </div>
  <div className="header-right">
    <span className="header-user">{userEmail}</span>
    <button onClick={onLogout} className="logout-btn">Cerrar sesión</button>
  </div>
</header>
```

**Después:**
```jsx
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

<AppBar position="static" color="default" elevation={1}>
  <Toolbar>
    <Box display="flex" alignItems="center" gap={2}>
      <img src={logo} alt="Logo" style={{ height: 40 }} />
      <Typography variant="h6" component="div">
        WhatsApp Admin Panel
      </Typography>
    </Box>

    <Box sx={{ flexGrow: 1 }} />

    <Box display="flex" alignItems="center" gap={2}>
      <Typography variant="body2" color="text.secondary">
        {userEmail}
      </Typography>
      <Button
        variant="outlined"
        color="error"
        startIcon={<LogoutIcon />}
        onClick={onLogout}
      >
        Cerrar sesión
      </Button>
    </Box>
  </Toolbar>
</AppBar>
```

**Archivos:**
- [Header.jsx](src/components/Header.jsx)

**Testing:**
- ✅ Logo visible
- ✅ Email de usuario visible
- ✅ Botón logout funcional
- ✅ Responsive (mobile)

**Commit:** `feat: migrate Header to MUI AppBar`

---

#### 1.3 Migrar Sidebar.jsx → MUI Drawer (1.5 horas)

**Antes:**
```jsx
<aside className="sidebar">
  <div className="sidebar-section">
    <h3>Proyectos</h3>
    <div className="project-list">
      {projects.map(p => (
        <button
          key={p.id}
          onClick={() => onSelectProject(p.id)}
          className={selectedProject === p.id ? 'active' : ''}
        >
          {p.nombre}
        </button>
      ))}
    </div>
    <button className="add-project-btn" onClick={onAddProject}>
      + Nuevo Proyecto
    </button>
  </div>
</aside>
```

**Después:**
```jsx
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Button,
  Divider,
  Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

<Drawer
  variant="permanent"
  sx={{
    width: 280,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: 280,
      boxSizing: 'border-box',
      top: 64, // Altura del AppBar
      height: 'calc(100% - 64px)',
    },
  }}
>
  <Box sx={{ p: 2 }}>
    <Typography variant="h6" gutterBottom>
      Proyectos
    </Typography>

    <List>
      {projects.map(p => (
        <ListItem key={p.id} disablePadding>
          <ListItemButton
            selected={selectedProject === p.id}
            onClick={() => onSelectProject(p.id)}
          >
            <ListItemText primary={p.nombre} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>

    <Divider sx={{ my: 2 }} />

    <Button
      variant="contained"
      color="primary"
      fullWidth
      startIcon={<AddIcon />}
      onClick={onAddProject}
    >
      Nuevo Proyecto
    </Button>
  </Box>
</Drawer>
```

**Archivos:**
- [Sidebar.jsx](src/components/Sidebar.jsx)

**Testing:**
- ✅ Lista de proyectos visible
- ✅ Selección de proyecto funciona
- ✅ Botón "Nuevo Proyecto" funcional
- ✅ Sidebar fijo a la izquierda

**Commit:** `feat: migrate Sidebar to MUI Drawer`

---

#### 1.4 Migrar Dashboard.jsx → Sistema de Tabs (3 horas)

**NUEVA ARQUITECTURA:**

```jsx
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography
} from '@mui/material';
import { useState } from 'react';

// Importar secciones
import ConfigSection from './sections/ConfigSection';
import AgentsSection from './sections/AgentsSection';
import MonitoringSection from './sections/MonitoringSection';
import CodeSection from './sections/CodeSection';

function Dashboard({ selectedProject, ... }) {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (!selectedProject) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <Box textAlign="center">
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Selecciona un proyecto
          </Typography>
          <Typography variant="body2" color="text.secondary">
            o crea uno nuevo desde el sidebar
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
      {/* Header con nombre del proyecto */}
      <Typography variant="h4" gutterBottom>
        {selectedProject.nombre}
      </Typography>

      {/* Sistema de Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Dashboard sections"
        >
          <Tab label="Configuración" />
          <Tab label="Agentes" />
          <Tab label="Estadísticas" />
          <Tab label="Código" />
        </Tabs>
      </Box>

      {/* Contenido de las tabs */}
      <Box role="tabpanel" hidden={activeTab !== 0}>
        {activeTab === 0 && (
          <ConfigSection
            selectedProject={selectedProject}
            config={config}
            onSaveConfig={onSaveConfig}
          />
        )}
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 1}>
        {activeTab === 1 && (
          <AgentsSection
            agents={agents}
            onEditAgent={handleEditAgent}
            onDeleteAgent={handleDeleteAgent}
            onAddAgent={() => setShowAgentModal(true)}
          />
        )}
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 2}>
        {activeTab === 2 && (
          <MonitoringSection selectedProject={selectedProject} />
        )}
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 3}>
        {activeTab === 3 && (
          <CodeSection selectedProject={selectedProject} />
        )}
      </Box>

      {/* Modals (sin cambios) */}
      {showProjectModal && <ProjectModal ... />}
      {showAgentModal && <AgentModal ... />}
    </Container>
  );
}
```

**Archivos:**
- [Dashboard.jsx](src/components/Dashboard.jsx)

**Testing:**
- ✅ Tabs navegables
- ✅ Contenido correcto en cada tab
- ✅ Empty state funcional
- ✅ Modals siguen funcionando

**Commit:** `feat: implement MUI Tabs system with separate Statistics tab`

---

### FASE 2: Componentes Simples (Semana 2)

#### 2.1 LoginScreen.jsx (45 min)

**Antes:**
```jsx
<div className="login-screen">
  <div className="login-box">
    <img src={logo} alt="Logo" />
    <h2>WhatsApp Admin Panel</h2>
    <input
      type="email"
      placeholder="Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
    <button onClick={handleLogin}>Ingresar con Google</button>
  </div>
</div>
```

**Después:**
```jsx
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

<Container maxWidth="sm">
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <Card sx={{ width: '100%', maxWidth: 400 }}>
      <CardContent sx={{ p: 4, textAlign: 'center' }}>
        <Box mb={3}>
          <img src={logo} alt="Logo" style={{ width: 80, height: 80 }} />
        </Box>

        <Typography variant="h4" gutterBottom>
          WhatsApp Admin Panel
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Ingresa con tu cuenta de Google
        </Typography>

        <TextField
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleLogin}
        >
          Ingresar con Google
        </Button>
      </CardContent>
    </Card>
  </Box>
</Container>
```

**Archivos:**
- [LoginScreen.jsx](src/components/LoginScreen.jsx)

**Commit:** `feat: migrate LoginScreen to MUI Card and TextField`

---

#### 2.2 ProjectModal.jsx (45 min)

**Antes:**
```jsx
<div className="modal-overlay">
  <div className="modal">
    <h2>{editingProject ? 'Editar' : 'Nuevo'} Proyecto</h2>
    <input
      placeholder="Nombre del proyecto"
      value={nombre}
      onChange={...}
    />
    <div className="modal-actions">
      <button onClick={onSave}>Guardar</button>
      <button onClick={onClose}>Cancelar</button>
    </div>
  </div>
</div>
```

**Después:**
```jsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from '@mui/material';

<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
  <DialogTitle>
    {editingProject ? 'Editar' : 'Nuevo'} Proyecto
  </DialogTitle>

  <DialogContent>
    <TextField
      autoFocus
      margin="dense"
      label="Nombre del proyecto"
      fullWidth
      value={nombre}
      onChange={(e) => setNombre(e.target.value)}
    />
  </DialogContent>

  <DialogActions>
    <Button onClick={onClose}>
      Cancelar
    </Button>
    <Button onClick={onSave} variant="contained" color="primary">
      Guardar
    </Button>
  </DialogActions>
</Dialog>
```

**Archivos:**
- [modals/ProjectModal.jsx](src/components/modals/ProjectModal.jsx)

**Commit:** `feat: migrate ProjectModal to MUI Dialog`

---

#### 2.3 PlanLimitsBanner.jsx (30 min)

**Antes:**
```jsx
<div className="limits-banner warning">
  <span>{message}</span>
  <button onClick={onClose}>×</button>
</div>
```

**Después:**
```jsx
import { Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

<Alert
  severity="warning"
  action={
    <IconButton size="small" onClick={onClose}>
      <CloseIcon fontSize="small" />
    </IconButton>
  }
  sx={{ mb: 2 }}
>
  {message}
</Alert>
```

**Archivos:**
- [PlanLimitsBanner.jsx](src/components/PlanLimitsBanner.jsx)

**Commit:** `feat: migrate PlanLimitsBanner to MUI Alert`

---

### FASE 3: Componentes Medio (Semana 3)

#### 3.1 AgentModal.jsx (2 horas)

**Elementos a migrar:**
- 6 inputs → `TextField`
- 2 botones → `Button`
- Layout modal → `Dialog`

**Código:**
```jsx
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid
} from '@mui/material';

<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
  <DialogTitle>
    {editingAgent ? 'Editar' : 'Nuevo'} Agente
  </DialogTitle>

  <DialogContent>
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12}>
        <TextField
          label="Nombre"
          fullWidth
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Descripción"
          fullWidth
          multiline
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Avatar URL"
          fullWidth
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Teléfono"
          fullWidth
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
      </Grid>

      {/* ... resto de campos */}
    </Grid>
  </DialogContent>

  <DialogActions>
    <Button onClick={onClose}>
      Cancelar
    </Button>
    <Button onClick={onSave} variant="contained" color="primary">
      Guardar
    </Button>
  </DialogActions>
</Dialog>
```

**Archivos:**
- [modals/AgentModal.jsx](src/components/modals/AgentModal.jsx)

**Commit:** `feat: migrate AgentModal to MUI Dialog with Grid layout`

---

#### 3.2 AgentsSection.jsx (2 horas)

**Antes:**
```jsx
<div className="card">
  <div className="agents-header">
    <h2>Agentes IA</h2>
    <button className="add-agent-btn" onClick={onAddAgent}>
      + Nuevo Agente
    </button>
  </div>

  <div className="agents-grid">
    {agents.map(agent => (
      <div key={agent.id} className="agent-card">
        <img src={agent.avatarUrl} className="agent-avatar" />
        <h3>{agent.nombre}</h3>
        <p>{agent.descripcion}</p>
        <div className="agent-actions">
          <button onClick={() => onEditAgent(agent)}>✏️</button>
          <button onClick={() => onDeleteAgent(agent.id)}>🗑️</button>
        </div>
      </div>
    ))}
  </div>
</div>
```

**Después:**
```jsx
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

<Box>
  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
    <Typography variant="h5">
      Agentes IA
    </Typography>
    <Button
      variant="contained"
      color="success"
      startIcon={<AddIcon />}
      onClick={onAddAgent}
    >
      Nuevo Agente
    </Button>
  </Box>

  <Grid container spacing={3}>
    {agents.map(agent => (
      <Grid item xs={12} sm={6} md={4} key={agent.id}>
        <Card>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
              <Avatar
                src={agent.avatarUrl}
                sx={{ width: 80, height: 80, mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                {agent.nombre}
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {agent.descripcion}
              </Typography>
            </Box>
          </CardContent>

          <CardActions sx={{ justifyContent: 'center' }}>
            <IconButton
              color="primary"
              onClick={() => onEditAgent(agent)}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              color="error"
              onClick={() => onDeleteAgent(agent.id)}
            >
              <DeleteIcon />
            </IconButton>
          </CardActions>
        </Card>
      </Grid>
    ))}
  </Grid>
</Box>
```

**Archivos:**
- [sections/AgentsSection.jsx](src/components/sections/AgentsSection.jsx)

**Commit:** `feat: migrate AgentsSection to MUI Grid and Cards`

---

#### 3.3 CodeSection.jsx (2.5 horas)

**Elementos:**
- Tabs para código (JavaScript / React) → `Tabs`
- Código en bloque → `Paper` + syntax highlight
- Botón copiar → `Button` con icono

**Código:**
```jsx
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Alert
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useState } from 'react';

function CodeSection({ selectedProject }) {
  const [codeTab, setCodeTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const code = codeTab === 0 ? jsCode : reactCode;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Código de Integración
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={codeTab} onChange={(e, v) => setCodeTab(v)}>
          <Tab label="JavaScript Vanilla" />
          <Tab label="React" />
        </Tabs>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          bgcolor: '#f5f5f5',
          position: 'relative'
        }}
      >
        <Button
          size="small"
          startIcon={<ContentCopyIcon />}
          onClick={handleCopy}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          Copiar
        </Button>

        <pre style={{ margin: 0, overflow: 'auto' }}>
          <code>{codeTab === 0 ? jsCode : reactCode}</code>
        </pre>
      </Paper>

      {copied && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Código copiado al portapapeles
        </Alert>
      )}
    </Box>
  );
}
```

**Archivos:**
- [sections/CodeSection.jsx](src/components/sections/CodeSection.jsx)

**Commit:** `feat: migrate CodeSection to MUI with Tabs and Paper`

---

### FASE 4: Componentes Complejos (Semanas 4-5)

#### 4.1 MonitoringSection.jsx (3 horas)

**Antes:**
```jsx
<div className="card">
  <h2>Monitoreo de Conversiones</h2>

  {/* KPI Cards */}
  <div className="stats-grid">
    <div className="stat-card">
      <h3>Hoy</h3>
      <p className="stat-number">{stats.todayCount}</p>
    </div>
    {/* ... más cards */}
  </div>

  {/* Tabla */}
  <table className="conversions-table">
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Tipo</th>
        <th>Valor</th>
      </tr>
    </thead>
    <tbody>
      {conversions.map(c => (
        <tr key={c.id}>
          <td>{formatDate(c.createdAt)}</td>
          <td>{c.tipo}</td>
          <td>${c.valor}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Después:**
```jsx
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssessmentIcon from '@mui/icons-material/Assessment';

function MonitoringSection({ selectedProject }) {
  const { conversions, stats, loading } = useConversions(selectedProject);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Monitoreo de Conversiones
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <CalendarTodayIcon color="primary" />
                <Typography variant="h6" color="text.secondary">
                  Hoy
                </Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {stats.todayCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUpIcon color="success" />
                <Typography variant="h6" color="text.secondary">
                  Esta Semana
                </Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {stats.weekCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <AssessmentIcon color="info" />
                <Typography variant="h6" color="text.secondary">
                  Total
                </Typography>
              </Box>
              <Typography variant="h3" color="info.main">
                {stats.totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabla de Conversiones */}
      <Paper elevation={0} variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {conversions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary" py={4}>
                      No hay conversiones registradas
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                conversions.map(conv => (
                  <TableRow key={conv.id} hover>
                    <TableCell>
                      {new Date(conv.createdAt?.toDate()).toLocaleString('es-ES')}
                    </TableCell>
                    <TableCell>{conv.tipo}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        ${conv.valor}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label="Completado"
                        color="success"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
```

**Archivos:**
- [sections/MonitoringSection.jsx](src/components/sections/MonitoringSection.jsx)

**Commit:** `feat: migrate MonitoringSection to MUI with Cards and Table`

---

#### 4.2 ConfigSection.jsx (5 horas) ⚠️ MÁS COMPLEJO

**Estrategia:** Dividir en subsecciones con `Accordion`

```jsx
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';

function ConfigSection({ selectedProject, config, onSaveConfig }) {
  // ... estados existentes (sin cambios)

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          Configuración del Proyecto
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
        >
          Guardar Cambios
        </Button>
      </Box>

      {/* Sección: Datos Básicos */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Datos Básicos</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Nombre del Sitio"
                fullWidth
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                helperText="Nombre que aparecerá en el widget"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Mensaje de Bienvenida"
                fullWidth
                multiline
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                helperText="Mensaje que verán tus visitantes"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Webhook URL (n8n)"
                fullWidth
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Posición del Widget</InputLabel>
                <Select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                >
                  <MenuItem value="bottom-right">Abajo Derecha</MenuItem>
                  <MenuItem value="bottom-left">Abajo Izquierda</MenuItem>
                  <MenuItem value="top-right">Arriba Derecha</MenuItem>
                  <MenuItem value="top-left">Arriba Izquierda</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Sección: Conversiones */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Configuración de Conversiones</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <ConversionsEditor
            conversions={conversion_config}
            onChange={setConversionConfig}
          />
        </AccordionDetails>
      </Accordion>

      {/* Sección: Inteligencia Artificial */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Inteligencia Artificial</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Descripción del Negocio"
                fullWidth
                multiline
                rows={4}
                value={business_description}
                onChange={(e) => setBusinessDescription(e.target.value)}
                helperText="Describe tu negocio para mejorar las respuestas de la IA"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="OpenAI API Key"
                type="password"
                fullWidth
                value={openai_api_key}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Modelo GPT</InputLabel>
                <Select
                  value={openai_model}
                  onChange={(e) => setOpenaiModel(e.target.value)}
                >
                  <MenuItem value="gpt-4o">GPT-4o (Recomendado)</MenuItem>
                  <MenuItem value="gpt-4">GPT-4</MenuItem>
                  <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Sección: Google Sheets */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Integración Google Sheets</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Google Sheet ID"
                fullWidth
                value={sheet_id}
                onChange={(e) => setSheetId(e.target.value)}
                helperText="ID de la hoja de cálculo de Google Sheets"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Service Account Email"
                fullWidth
                value={sheet_service_account_email}
                onChange={(e) => setSheetServiceAccountEmail(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Private Key"
                type="password"
                fullWidth
                value={sheet_private_key}
                onChange={(e) => setSheetPrivateKey(e.target.value)}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Sección: Tracking & Comportamiento */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Tracking y Comportamiento</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Retraso de Aparición (ms)"
                type="number"
                fullWidth
                value={delayShow}
                onChange={(e) => setDelayShow(e.target.value)}
                helperText="Tiempo antes de mostrar el widget"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={onlyMobile}
                    onChange={(e) => setOnlyMobile(e.target.checked)}
                  />
                }
                label="Solo en dispositivos móviles"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Páginas Excluidas"
                fullWidth
                value={excludePages}
                onChange={(e) => setExcludePages(e.target.value)}
                helperText="Separadas por comas. Ej: /checkout, /admin"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Google Analytics ID"
                fullWidth
                value={tracking_ga_id}
                onChange={(e) => setTrackingGaId(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Meta Pixel ID"
                fullWidth
                value={tracking_meta_pixel}
                onChange={(e) => setTrackingMetaPixel(e.target.value)}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 3 }} />

      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
        >
          Guardar Todos los Cambios
        </Button>
      </Box>
    </Box>
  );
}
```

**Archivos:**
- [sections/ConfigSection.jsx](src/components/sections/ConfigSection.jsx)

**Commit:** `feat: migrate ConfigSection to MUI with Accordion layout`

---

#### 4.3 ConversionsEditor.jsx (2.5 horas)

**Migración a MUI Accordion + Grid:**

```jsx
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  IconButton,
  Button,
  Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';

function ConversionsEditor({ conversions, onChange }) {
  // ... lógica existente

  return (
    <Box>
      {Object.entries(conversions).map(([key, conv]) => (
        <Accordion key={key}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{conv.nombre || 'Nueva Conversión'}</Typography>
          </AccordionSummary>

          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre"
                  fullWidth
                  value={conv.nombre}
                  onChange={(e) => handleChange(key, 'nombre', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Valor ($)"
                  type="number"
                  fullWidth
                  value={conv.valor}
                  onChange={(e) => handleChange(key, 'valor', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(key)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      <Button
        startIcon={<AddCircleIcon />}
        onClick={handleAdd}
        sx={{ mt: 2 }}
      >
        Agregar Conversión
      </Button>
    </Box>
  );
}
```

**Archivos:**
- [sections/ConversionsEditor.jsx](src/components/sections/ConversionsEditor.jsx)

**Commit:** `feat: migrate ConversionsEditor to MUI Accordion`

---

### FASE 5: Componentes Admin (Semana 6)

#### 5.1 SuperAdminDashboard.jsx (4 horas)

**Migración:**
- Tabla de usuarios → `Table` + `TableContainer`
- Formulario de edición → `Dialog` + `TextField`
- Stats cards → `Card` + `Grid`

**Commit:** `feat: migrate SuperAdminDashboard to MUI`

---

#### 5.2 PublicRegistration.jsx (2 horas)

**Migración:**
- Formulario de registro → `TextField` + `Select`
- Layout → `Container` + `Card`

**Commit:** `feat: migrate PublicRegistration to MUI`

---

### FASE 6: Limpieza y Optimización (Semana 7)

#### 6.1 Eliminar CSS Legacy

**Archivos a eliminar/reducir:**
- `App.css` → Eliminar 90% (dejar solo estilos custom)
- `SuperAdmin.css` → Eliminar completamente
- `Registration.css` → Eliminar completamente
- `MultiTenant.css` → Eliminar completamente

**Commit:** `chore: remove legacy CSS files`

---

#### 6.2 Ajustes Responsivos

**Testing en:**
- Desktop (1920px)
- Tablet (768px)
- Mobile (375px)

**Commit:** `style: responsive adjustments for mobile and tablet`

---

#### 6.3 Temas Personalizados

**Mejorar `theme.js`:**
- Dark mode (opcional)
- Paleta de colores WhatsApp
- Tipografía custom

**Commit:** `style: enhance theme with custom WhatsApp branding`

---

## ✅ Checklist de Testing por Componente

### Después de Migrar Cada Componente:

- [ ] **Visual:** El componente se ve bien
- [ ] **Funcional:** Todos los botones/inputs funcionan
- [ ] **Props:** Los props se pasan correctamente
- [ ] **Estado:** Los estados se mantienen
- [ ] **Responsive:** Se ve bien en mobile
- [ ] **Hooks:** Los hooks custom siguen funcionando
- [ ] **Firebase:** Las llamadas a Firestore funcionan
- [ ] **Sin errores:** No hay errores en consola

---

## 🛡️ Estrategia de Rollback

### Si algo sale mal:

```bash
# Ver diferencias
git diff main

# Volver a una versión anterior
git checkout HEAD~1 -- src/components/ComponentName.jsx

# Revertir último commit
git revert HEAD

# Volver completamente a main
git checkout main
```

---

## 📊 Métricas de Progreso

| Fase | Componentes | Tiempo Estimado | Complejidad |
|------|-------------|-----------------|-------------|
| 1. Setup + Layout | 3 | 1 semana | Media |
| 2. Simples | 3 | 1 semana | Baja |
| 3. Medio | 3 | 1 semana | Media |
| 4. Complejos | 3 | 2 semanas | Alta |
| 5. Admin | 2 | 1 semana | Media |
| 6. Limpieza | - | 1 semana | Baja |
| **TOTAL** | **14** | **7 semanas** | **Media-Alta** |

---

## 🚀 Orden de Implementación Recomendado

### Semana 1: Fundación
1. ✅ Setup (theme.js + ThemeProvider)
2. ✅ Header → AppBar
3. ✅ Sidebar → Drawer
4. ✅ Dashboard → Tabs system

### Semana 2: Quick Wins
5. ✅ LoginScreen → Card
6. ✅ ProjectModal → Dialog
7. ✅ PlanLimitsBanner → Alert

### Semana 3: Features Medios
8. ✅ AgentModal → Dialog
9. ✅ AgentsSection → Grid + Cards
10. ✅ CodeSection → Tabs + Paper

### Semana 4-5: Features Complejos
11. ✅ MonitoringSection → Table + Cards
12. ✅ ConfigSection → Accordion + Forms
13. ✅ ConversionsEditor → Accordion

### Semana 6: Admin
14. ✅ SuperAdminDashboard → Table
15. ✅ PublicRegistration → Form

### Semana 7: Polish
16. ✅ Eliminar CSS legacy
17. ✅ Responsive testing
18. ✅ Mejoras de tema

---

## 🎯 Próximos Pasos Inmediatos

### Para empezar HOY:

1. **Crear branch:**
   ```bash
   git checkout -b feature/mui-redesign
   ```

2. **Instalar MUI:**
   ```bash
   npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
   ```

3. **Crear `theme.js`** (copiar código de arriba)

4. **Modificar `App.jsx`** para agregar ThemeProvider

5. **Commit inicial:**
   ```bash
   git add .
   git commit -m "chore: setup Material-UI dependencies and theme"
   ```

6. **Migrar Header.jsx** (primera prueba)

---

## ❓ FAQ

### ¿Puedo hacer cambios mientras migro?
Sí, pero mejor en commits separados. Ejemplo:
```bash
# Primero migra el componente
git commit -m "feat: migrate Header to MUI"

# Luego mejoras funcionalidad
git commit -m "feat(Header): add user avatar"
```

### ¿Qué pasa con los hooks personalizados?
**NO SE TOCAN.** Los hooks (`useProjects`, `useAgents`, `useConfig`, `useConversions`) se mantienen exactamente iguales. Solo cambias el JSX que renderizan.

### ¿Necesito cambiar las llamadas a Firebase?
**NO.** Las llamadas a Firestore, Auth, etc. se mantienen intactas.

### ¿Puedo usar algunos componentes de MUI y otros con CSS?
**SÍ**, puedes hacer migración incremental. Pero es mejor terminar un componente completamente antes de pasar al siguiente.

### ¿Qué pasa con el widget público?
El widget NO necesita migración (a menos que quieras). Vive en `public/widget.js` y es standalone.

---

## 📞 Siguiente Acción

**¿Quieres que empecemos con la migración ahora?**

Puedo:
1. Crear el branch y setup inicial
2. Migrar Header.jsx como prueba
3. Mostrarte el resultado en vivo

¿Procedemos? 🚀
