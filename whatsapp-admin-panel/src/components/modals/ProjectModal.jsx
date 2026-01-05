import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button
} from '@mui/material';

const ProjectModal = ({ onClose, onSave }) => {
  const [projectName, setProjectName] = useState('');

  const handleSave = () => {
    onSave(projectName);
    setProjectName('');
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nuevo Proyecto</DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Nombre del proyecto"
          fullWidth
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Mi sitio web"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Crear proyecto
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectModal;
