import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  Divider,
  Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LanguageIcon from '@mui/icons-material/Language';

const DRAWER_WIDTH = 280;

const Sidebar = ({ projects, selectedProject, onSelectProject, onNewProject, footerSlot }) => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          top: 64, // Altura del AppBar
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 2 }}>
          Proyectos
        </Typography>

        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {projects.map(project => (
            <ListItem key={project.id} disablePadding>
              <ListItemButton
                selected={selectedProject?.id === project.id}
                onClick={() => onSelectProject(project)}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  mb: 0.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LanguageIcon color={selectedProject?.id === project.id ? 'primary' : 'action'} />
                </ListItemIcon>
                <ListItemText primary={project.name} />
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
          onClick={onNewProject}
        >
          Nuevo proyecto
        </Button>

        {footerSlot && (
          <Box sx={{ mt: 2 }}>
            {footerSlot}
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
