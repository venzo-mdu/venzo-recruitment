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
        <Toolbar>
          <Box sx={{ mr: 2 }}>
            <Logo width={120} height={40} variant="white" />
          </Box>
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 'bold', ml: 1, cursor: 'pointer', mr: 4 }}
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
                  fontSize: '0.85rem',
                  px: 2,
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
          <Typography variant="body2" sx={{ mr: 3, display: { xs: 'none', sm: 'block' } }}>
            {user?.email}
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<Logout />}
            sx={{ textTransform: 'none', fontSize: '0.85rem' }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
