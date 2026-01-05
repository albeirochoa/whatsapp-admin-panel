import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const AgentsSection = ({ agents, onAddAgent, onEditAgent, onDeleteAgent }) => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <PeopleIcon color="action" />
          <Typography variant="h5">
            Agentes ({agents.length})
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={onAddAgent}
        >
          Agregar agente
        </Button>
      </Box>

      {agents.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
        >
          <Typography variant="h1" fontSize="4rem" mb={2}>
            👤
          </Typography>
          <Typography variant="h6" gutterBottom>
            Sin agentes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Agrega tu primer agente para comenzar
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {agents.map(agent => (
            <Grid item xs={12} sm={6} md={4} key={agent.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar
                      src={agent.photo}
                      alt={agent.name}
                      sx={{ width: 56, height: 56 }}
                    />
                    <Box>
                      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                        {agent.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {agent.role}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    sx={{
                      bgcolor: 'success.light',
                      color: 'success.contrastText',
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      mb: 2
                    }}
                  >
                    <WhatsAppIcon fontSize="small" />
                    <Typography variant="body2" fontWeight={500}>
                      +{agent.phone}
                    </Typography>
                  </Box>

                  <Box>
                    {agent.showOn?.length > 0 && (
                      <Box mb={1}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          Mostrar en:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {agent.showOn.map((page, idx) => (
                            <Chip key={idx} label={page} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}
                    {agent.hideOn?.length > 0 && (
                      <Box mb={1}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          Ocultar en:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {agent.hideOn.map((page, idx) => (
                            <Chip key={idx} label={page} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}
                    {(!agent.showOn?.length && !agent.hideOn?.length) && (
                      <Typography variant="caption" color="text.secondary">
                        Aparece en todas las páginas
                      </Typography>
                    )}
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => onEditAgent(agent)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => onDeleteAgent(agent.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AgentsSection;
