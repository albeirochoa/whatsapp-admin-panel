import { createTheme } from '@mui/material/styles';

// Tema inspirado en Devias Kit Pro con identidad WhatsApp
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#25D366',      // WhatsApp Green
      light: '#4ADE80',
      dark: '#16A34A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#6366F1',      // Indigo (Devias style)
      light: '#818CF8',
      dark: '#4F46E5',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#F04438',
      light: '#F97066',
      dark: '#D92D20',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F79009',
      light: '#FDB022',
      dark: '#DC6803',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#2E90FA',
      light: '#53B1FD',
      dark: '#1570EF',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#12B76A',
      light: '#32D583',
      dark: '#039855',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F9FAFB',   // Gris muy claro (Devias style)
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111927',    // Casi negro - excelente contraste
      secondary: '#6C737F',  // Gris medio - buen contraste
      disabled: '#9DA4AE',   // Gris claro
    },
    divider: '#F3F4F6',
    neutral: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D2D6DB',
      400: '#9DA4AE',
      500: '#6C737F',
      600: '#4D5761',
      700: '#384250',
      800: '#1F2A37',
      900: '#111927',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.75,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.57,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.9375rem',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.08)',
    '0px 1px 5px rgba(0, 0, 0, 0.08)',
    '0px 1px 8px rgba(0, 0, 0, 0.08)',
    '0px 2px 10px rgba(0, 0, 0, 0.08)',
    '0px 3px 12px rgba(0, 0, 0, 0.08)',
    '0px 4px 14px rgba(0, 0, 0, 0.08)',
    '0px 5px 16px rgba(0, 0, 0, 0.08)',
    '0px 6px 18px rgba(0, 0, 0, 0.08)',
    '0px 7px 20px rgba(0, 0, 0, 0.08)',
    '0px 8px 22px rgba(0, 0, 0, 0.08)',
    '0px 9px 24px rgba(0, 0, 0, 0.08)',
    '0px 10px 26px rgba(0, 0, 0, 0.08)',
    '0px 11px 28px rgba(0, 0, 0, 0.08)',
    '0px 12px 30px rgba(0, 0, 0, 0.08)',
    '0px 13px 32px rgba(0, 0, 0, 0.08)',
    '0px 14px 34px rgba(0, 0, 0, 0.08)',
    '0px 15px 36px rgba(0, 0, 0, 0.08)',
    '0px 16px 38px rgba(0, 0, 0, 0.08)',
    '0px 17px 40px rgba(0, 0, 0, 0.08)',
    '0px 18px 42px rgba(0, 0, 0, 0.08)',
    '0px 19px 44px rgba(0, 0, 0, 0.08)',
    '0px 20px 46px rgba(0, 0, 0, 0.08)',
    '0px 21px 48px rgba(0, 0, 0, 0.08)',
    '0px 22px 50px rgba(0, 0, 0, 0.08)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.9375rem',
          fontWeight: 600,
          padding: '8px 20px',
        },
        sizeLarge: {
          padding: '11px 24px',
        },
        sizeSmall: {
          padding: '6px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid #F3F4F6',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 12,
        },
        outlined: {
          border: '1px solid #F3F4F6',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.9375rem',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D2D6DB',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '2px',
          },
        },
        notchedOutline: {
          borderColor: '#E5E7EB',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.9375rem',
          color: '#6C737F',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 0 rgba(0, 0, 0, 0.05)',
          borderBottom: '1px solid #F3F4F6',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #F3F4F6',
          boxShadow: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: 'rgba(37, 211, 102, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(37, 211, 102, 0.12)',
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9375rem',
          minHeight: 48,
          color: '#6C737F',
          '&.Mui-selected': {
            color: '#111927',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: '0.8125rem',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F9FAFB',
          '.MuiTableCell-root': {
            color: '#6C737F',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            borderBottom: '1px solid #F3F4F6',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #F3F4F6',
          fontSize: '0.875rem',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: '0.875rem',
        },
        standardSuccess: {
          backgroundColor: '#F0FDF4',
          color: '#065F46',
        },
        standardError: {
          backgroundColor: '#FEF2F2',
          color: '#991B1B',
        },
        standardWarning: {
          backgroundColor: '#FFFBEB',
          color: '#92400E',
        },
        standardInfo: {
          backgroundColor: '#EFF6FF',
          color: '#1E40AF',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 600,
        },
      },
    },
  },
});
