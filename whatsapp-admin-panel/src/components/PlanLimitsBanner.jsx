import { Alert, AlertTitle, Button, Box } from '@mui/material';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import { PLANS } from '../constants/plans';
import { formatLimit } from '../utils/permissions';

const PlanLimitsBanner = ({ userData, projects, agents }) => {
  if (!userData) return null;

  const plan = PLANS[userData.subscription?.plan?.toUpperCase()] || PLANS.FREE;
  const limits = plan.limits;

  const projectsUsage = (projects.length / (limits.projects === -1 ? 1 : limits.projects)) * 100;
  const agentsUsage = (agents.length / (limits.agents === -1 ? 1 : limits.agents)) * 100;

  const isNearLimit = projectsUsage > 80 || agentsUsage > 80;
  const isAtLimit = projectsUsage >= 100 || agentsUsage >= 100;

  if (!isNearLimit && !isAtLimit) return null;

  return (
    <Alert
      severity={isAtLimit ? 'error' : 'warning'}
      sx={{ mb: 3 }}
      action={
        <Button
          color="inherit"
          size="small"
          startIcon={<UpgradeIcon />}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Actualizar Plan
        </Button>
      }
    >
      <AlertTitle sx={{ fontWeight: 600 }}>
        {isAtLimit ? 'Límite alcanzado' : 'Cerca del límite'}
      </AlertTitle>
      <Box component="span">
        Plan <strong>{plan.name}</strong>: {projects.length}/{formatLimit(limits.projects)} proyectos, {agents.length}/{formatLimit(limits.agents)} agentes
      </Box>
    </Alert>
  );
};

export default PlanLimitsBanner;
