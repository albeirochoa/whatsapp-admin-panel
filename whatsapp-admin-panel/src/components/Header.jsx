import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { WhatsAppIcon } from './Icons';

const Header = ({ user, onLogout }) => {
  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Box display="flex" alignItems="center" gap={2}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WhatsAppIcon />
          </Box>
          <Typography variant="h6" component="div">
            Widget Admin
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box display="flex" alignItems="center" gap={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              src={user.photoURL}
              alt={user.displayName}
              sx={{ width: 32, height: 32 }}
            />
            <Typography variant="body2" color="text.secondary">
              {user.displayName?.split(' ')[0]}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={onLogout}
          >
            Salir
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
