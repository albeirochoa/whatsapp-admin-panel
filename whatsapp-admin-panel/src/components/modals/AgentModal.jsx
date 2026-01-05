import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid
} from '@mui/material';

const AgentModal = ({ onClose, onSave, editingAgent }) => {
  const [agentForm, setAgentForm] = useState({
    name: '',
    role: '',
    phone: '',
    photo: 'https://cdn-icons-png.flaticon.com/512/3001/3001764.png',
    showOn: '',
    hideOn: ''
  });

  useEffect(() => {
    if (editingAgent) {
      setAgentForm({
        ...editingAgent,
        showOn: editingAgent.showOn?.join(', ') || '',
        hideOn: editingAgent.hideOn?.join(', ') || ''
      });
    }
  }, [editingAgent]);

  const handleSave = () => {
    onSave(agentForm, editingAgent);
    setAgentForm({
      name: '',
      role: '',
      phone: '',
      photo: 'https://cdn-icons-png.flaticon.com/512/3001/3001764.png',
      showOn: '',
      hideOn: ''
    });
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editingAgent ? 'Editar agente' : 'Nuevo agente'}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nombre"
              fullWidth
              value={agentForm.name}
              onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
              placeholder="María García"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Rol / Área"
              fullWidth
              value={agentForm.role}
              onChange={(e) => setAgentForm({ ...agentForm, role: e.target.value })}
              placeholder="Ventas Bogotá"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Teléfono"
              fullWidth
              value={agentForm.phone}
              onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })}
              placeholder="573001234567"
              helperText="Con código de país, sin +"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="URL de foto"
              fullWidth
              value={agentForm.photo}
              onChange={(e) => setAgentForm({ ...agentForm, photo: e.target.value })}
              placeholder="https://..."
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Mostrar solo en URLs que contengan"
              fullWidth
              value={agentForm.showOn}
              onChange={(e) => setAgentForm({ ...agentForm, showOn: e.target.value })}
              placeholder="bogota, norte"
              helperText="Separar por comas"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Ocultar en URLs que contengan"
              fullWidth
              value={agentForm.hideOn}
              onChange={(e) => setAgentForm({ ...agentForm, hideOn: e.target.value })}
              placeholder="medellin, sur"
              helperText="Separar por comas"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          {editingAgent ? 'Guardar cambios' : 'Agregar agente'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AgentModal;
