'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  CircularProgress,
} from '@mui/material';
import { Logout, People, Work } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/common/Logo';

export default function DashboardLayout({ children }) {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  const navItems = [
    { label: 'Candidates', path: '/dashboard', icon: <People fontSize="small" /> },
    { label: 'Jobs', path: '/dashboard/jobs', icon: <Work fontSize="small" /> },
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar position="static" elevation={2}>
        {/* Main toolbar */}
        <Toolbar sx={{ flexWrap: 'wrap', gap: { xs: 0.5, md: 0 }, py: { xs: 0.5, md: 0 } }}>
          <Box sx={{ mr: { xs: 1, md: 2 } }}>
            <Logo width={100} height={35} variant="white" />
          </Box>
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 'bold', cursor: 'pointer', mr: { xs: 1, md: 4 }, fontSize: { xs: '1rem', md: '1.25rem' } }}
            onClick={() => router.push('/dashboard')}
          >
            CandidAI
          </Typography>

          {/* Navigation */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                startIcon={item.icon}
                onClick={() => router.push(item.path)}
                sx={{
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', md: '0.85rem' },
                  px: { xs: 1, md: 2 },
                  minWidth: 'auto',
                  borderRadius: 1,
                  backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.15)' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Email — hidden on mobile */}
          <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', md: 'block' }, fontSize: '0.8rem' }}>
            {user?.email}
          </Typography>

          {/* Logout — icon only on mobile, text on desktop */}
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<Logout fontSize="small" />}
            sx={{
              textTransform: 'none',
              fontSize: '0.8rem',
              minWidth: 'auto',
              px: { xs: 1, md: 2 },
              '& .MuiButton-startIcon': { mr: { xs: 0, md: 0.5 } },
            }}
          >
            <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Logout</Box>
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
